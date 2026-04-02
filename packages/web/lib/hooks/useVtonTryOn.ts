import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { ItemData } from "@/lib/hooks/useVtonItemFetch";

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

async function copyImageToClipboard(dataUrl: string) {
  try {
    const blob = await dataUrlToBlob(dataUrl);
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    toast.success("Image copied to clipboard!");
  } catch {
    await navigator.clipboard.writeText(dataUrl);
    toast.success("Link copied to clipboard!");
  }
}

export { dataUrlToBlob, copyImageToClipboard };

interface UseVtonTryOnOptions {
  personImage: string | null;
  personPreview: string | null;
  selectedItems: ItemData[];
  sourcePostId: string | null;
  displayResultImage: string | null;
  abortControllerRef: React.RefObject<AbortController | null>;
  onTryOnStart: () => void;
  onTryOnComplete: (resultDataUrl: string, latencyMs: number | null) => void;
  onTryOnError: (message: string) => void;
  onTryOnFinally: () => void;
  startBackgroundJob: (
    personPreview: string,
    personImageBase64: string,
    selectedItems: ItemData[]
  ) => string;
}

interface UseVtonTryOnResult {
  handleTryOn: () => Promise<void>;
  handleSaveToProfile: () => Promise<void>;
  handleShare: () => Promise<void>;
  isSaving: boolean;
  savedToProfile: boolean;
  setSavedToProfile: (value: boolean) => void;
}

/**
 * Encapsulates try-on execution and save-to-profile logic.
 * Uses the shared abortControllerRef pattern from Phase 44.
 */
export function useVtonTryOn(options: UseVtonTryOnOptions): UseVtonTryOnResult {
  const {
    personImage,
    personPreview,
    selectedItems,
    sourcePostId,
    displayResultImage,
    abortControllerRef,
    onTryOnStart,
    onTryOnComplete,
    onTryOnError,
    onTryOnFinally,
    startBackgroundJob,
  } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [savedToProfile, setSavedToProfile] = useState(false);

  const handleTryOn = useCallback(async () => {
    if (!personImage || !personPreview || selectedItems.length === 0) return;

    onTryOnStart();

    // Register background job so it persists across modal close
    startBackgroundJob(personPreview, personImage, selectedItems);

    // Abort any previous in-flight request and create a fresh controller
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      const productImageUrls = selectedItems.map((item) => item.thumbnail_url);

      const res = await fetch("/api/v1/vton", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personImageBase64: personImage,
          productImageUrls,
        }),
        signal: abortControllerRef.current.signal,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      const resultDataUrl = `data:${data.mimeType};base64,${data.resultImage}`;
      onTryOnComplete(resultDataUrl, data.latencyMs);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      const message = (err as Error).message;
      onTryOnError(message);
    } finally {
      onTryOnFinally();
    }
  }, [
    personImage,
    personPreview,
    selectedItems,
    abortControllerRef,
    onTryOnStart,
    onTryOnComplete,
    onTryOnError,
    onTryOnFinally,
    startBackgroundJob,
  ]);

  const handleSaveToProfile = useCallback(async () => {
    if (!displayResultImage || savedToProfile) return;
    setIsSaving(true);

    // Abort any previous in-flight request and create a fresh controller
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch("/api/v1/tries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          result_image: displayResultImage,
          source_post_id: sourcePostId,
          selected_item_ids: selectedItems.map((i) => i.id),
        }),
        signal: abortControllerRef.current.signal,
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Please log in to save");
        if (res.status === 413) throw new Error("Image too large");
        throw new Error("Failed to save");
      }
      setSavedToProfile(true);
      toast.success("Saved to My Tries!");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      console.error("[VtonModal] Save error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to save. Try again.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }, [
    displayResultImage,
    savedToProfile,
    sourcePostId,
    selectedItems,
    abortControllerRef,
  ]);

  const handleShare = useCallback(async () => {
    if (!displayResultImage) return;
    if (navigator.share) {
      try {
        const blob = await dataUrlToBlob(displayResultImage);
        const file = new File([blob], `vton-${Date.now()}.png`, {
          type: blob.type,
        });
        await navigator.share({
          title: "My Virtual Try-On",
          files: [file],
        });
      } catch {
        await copyImageToClipboard(displayResultImage);
      }
    } else {
      await copyImageToClipboard(displayResultImage);
    }
  }, [displayResultImage]);

  return {
    handleTryOn,
    handleSaveToProfile,
    handleShare,
    isSaving,
    savedToProfile,
    setSavedToProfile,
  };
}
