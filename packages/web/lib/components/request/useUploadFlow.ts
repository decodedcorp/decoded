"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useRequestStore,
  getRequestActions,
  selectDetectedSpots,
  selectUserKnowsItems,
  selectMediaSource,
  selectArtistName,
  selectGroupName,
  selectContext,
} from "@/lib/stores/requestStore";
import {
  createPostWithFile,
  createPostWithFileAndSolutions,
} from "@/lib/api/posts";
import { compressImage } from "@/lib/utils/imageCompression";
import {
  saveDraft,
  saveDraftThumbnail,
  loadDraft,
  clearDraft,
} from "@/lib/utils/offlineDraft";

export interface UseUploadFlowReturn {
  instanceId: string;
  isSubmitting: boolean;
  submitError: string | null;
  submit: () => Promise<void>;
  close: () => void;
}

/**
 * Headless state + actions for the Request/Upload flow.
 *
 * Registers the caller as the current owner of `requestStore` via
 * `activeInstanceId` so that unmount of one mount (e.g., intercept modal)
 * does not clobber state belonging to another mount (e.g., direct URL page).
 *
 * Owns: draft load (with Restore toast), auto-save effect, image compression,
 * and POST API submit. canProceed gating is left to the caller (page/steps).
 */
export function useUploadFlow(): UseUploadFlowReturn {
  const instanceId = useId();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Subscribe to store slices needed for auto-save effect deps
  const detectedSpots = useRequestStore(selectDetectedSpots);
  const userKnowsItems = useRequestStore(selectUserKnowsItems);
  const mediaSource = useRequestStore(selectMediaSource);
  const artistName = useRequestStore(selectArtistName);
  const groupName = useRequestStore(selectGroupName);
  const context = useRequestStore(selectContext);
  // Identity of the primary image — used as a dep so auto-save thumbnail
  // re-fires when the user swaps the image (parity with old page.tsx).
  const primaryImageId = useRequestStore((s) => s.images[0]?.id ?? null);

  // Register as active instance; reset on unmount
  useEffect(() => {
    useRequestStore.getState().setActiveInstance(instanceId);
    return () => {
      useRequestStore.getState().resetIfActive(instanceId);
    };
  }, [instanceId]);

  // Draft restore (once on mount)
  useEffect(() => {
    const draft = loadDraft();
    if (!draft || draft.spots.length === 0) return;

    toast("You have an unsaved request draft.", {
      action: {
        label: "Restore",
        onClick: () => {
          const actions = getRequestActions();
          if (draft.userKnowsItems !== null) {
            actions.setUserKnowsItems(draft.userKnowsItems);
          }
          for (const spot of draft.spots) {
            actions.addSpot(spot.center.x, spot.center.y, spot.categoryCode);
            if (spot.solution) {
              actions.setSpotSolution(spot.id, spot.solution);
            }
          }
          if (draft.mediaSource) actions.setMediaSource(draft.mediaSource);
          if (draft.artistName) actions.setArtistName(draft.artistName);
          if (draft.groupName) actions.setGroupName(draft.groupName);
          if (draft.context) actions.setContext(draft.context);
          toast.success("Draft restored. Please choose the image again.");
        },
      },
      duration: 10000,
    });
  }, []);

  // Auto-save draft when spots/metadata change
  useEffect(() => {
    if (detectedSpots.length === 0 && userKnowsItems === null) return;

    saveDraft({
      userKnowsItems,
      spots: detectedSpots.map((s) => ({
        id: s.id,
        index: s.index,
        center: s.center,
        label: s.label,
        categoryCode: s.categoryCode,
        title: s.title,
        description: s.description,
        solution: s.solution,
      })),
      mediaSource: mediaSource ?? null,
      artistName: artistName ?? "",
      groupName: groupName ?? "",
      context: context ?? null,
    });

    const file = useRequestStore.getState().images[0]?.file;
    if (file) saveDraftThumbnail(file);
  }, [
    detectedSpots,
    userKnowsItems,
    mediaSource,
    artistName,
    groupName,
    context,
    primaryImageId,
  ]);

  const submit = useCallback(async () => {
    const storeState = useRequestStore.getState();
    const localImage = storeState.images[0];

    if (!localImage?.file) {
      toast.error("Please select an image.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Compress image
      toast.loading("Preparing image...", { id: "prepare" });
      const { file: compressedFile } = await compressImage(localImage.file);
      toast.dismiss("prepare");

      // Read fresh store state after async gap
      const {
        detectedSpots: spots,
        userKnowsItems: knowsItems,
        mediaSource: mediaSrc,
        artistName: artist,
        groupName: group,
        context: ctx,
      } = useRequestStore.getState();

      // 2. spots → API position payload (for non-solution path)
      const spotsPayload = spots.map((spot) => ({
        position_left: `${(spot.center.x * 100).toFixed(1)}%`,
        position_top: `${(spot.center.y * 100).toFixed(1)}%`,
      }));

      // 3. POST API — branch on userKnowsItems
      toast.loading("Creating post...", { id: "create" });
      const mediaSourcePayload = {
        type: mediaSrc?.type ?? "user_upload",
        description:
          mediaSrc?.title?.trim() || (knowsItems ? "User Upload" : undefined),
      };

      const response =
        knowsItems === true
          ? await createPostWithFileAndSolutions({
              file: compressedFile,
              media_source: mediaSourcePayload,
              spots: spots.map((spot) => ({
                position_left: `${(spot.center.x * 100).toFixed(1)}%`,
                position_top: `${(spot.center.y * 100).toFixed(1)}%`,
                solution: spot.solution
                  ? {
                      original_url: spot.solution.originalUrl,
                      title: spot.solution.title,
                      thumbnail_url: spot.solution.thumbnailUrl,
                      description: spot.solution.description,
                      metadata: spot.solution.priceAmount
                        ? {
                            price: {
                              amount: String(spot.solution.priceAmount),
                              currency: spot.solution.priceCurrency || "KRW",
                            },
                          }
                        : undefined,
                    }
                  : undefined,
              })),
            })
          : await createPostWithFile({
              file: compressedFile,
              media_source: mediaSourcePayload,
              spots: spotsPayload,
              artist_name: artist?.trim() || undefined,
              group_name: group?.trim() || undefined,
              context: ctx ?? undefined,
            });
      toast.dismiss("create");

      toast.success("Post created!");

      // 4. Cleanup + redirect
      clearDraft();
      useRequestStore.getState().resetIfActive(instanceId);
      router.push(`/posts/${response.id}`);
    } catch (error) {
      toast.dismiss("upload");
      toast.dismiss("create");
      const message =
        error instanceof Error ? error.message : "Failed to create post.";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [instanceId, router]);

  const close = useCallback(() => {
    useRequestStore.getState().resetIfActive(instanceId);
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }, [instanceId, router]);

  return { instanceId, isSubmitting, submitError, submit, close };
}
