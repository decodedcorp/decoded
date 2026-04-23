"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  useRequestStore,
  getRequestActions,
  selectHasImages,
  selectDetectedSpots,
  selectSelectedSpotId,
  selectUserKnowsItems,
  selectMediaSource,
  selectArtistName,
  selectGroupName,
  selectContext,
  selectStructuredMetadata,
  selectHasInProgressWork,
  selectDisabledReason,
  type DetectedSpot,
  type SpotSolutionData,
  type DisabledReason,
} from "@/lib/stores/requestStore";
import { useImageUpload } from "@/lib/hooks/useImageUpload";
import { useUploadFlow } from "./useUploadFlow";
import { DropZone } from "@/lib/components/request/DropZone";
import { DetectionView } from "@/lib/components/request/DetectionView";
import { SolutionInputForm } from "@/lib/components/request/SolutionInputForm";
import { StepProgress } from "@/lib/components/request/StepProgress";
import { MobileUploadOptions } from "@/lib/components/request/MobileUploadOptions";
import {
  MetadataInputForm,
  type MetadataFormValues,
} from "@/lib/components/request/MetadataInputForm";
import { ImageEditor } from "@/lib/components/request/ImageEditor";
import { DiscardProgressDialog } from "@/lib/components/request/DiscardProgressDialog";
import { RECOMMENDED_SPOT_COUNT } from "@/lib/components/request/constants";
import { clearDraft } from "@/lib/utils/offlineDraft";
import {
  Trash2,
  Plus,
  Loader2,
  RefreshCw,
  Crop,
  ArrowLeft,
} from "lucide-react";

/**
 * Renders the full step-switch UI for the upload request flow.
 *
 * Consumes useUploadFlow for submit/close/isSubmitting/submitError and
 * useImageUpload for local image state. RequestFlowHeader is intentionally
 * excluded — the parent assembler (page.tsx or modal) renders it.
 */
export function UploadFlowSteps() {
  const [showEditor, setShowEditor] = useState(false);

  // Store subscriptions (render-only)
  const hasImages = useRequestStore(selectHasImages);
  const userKnowsItems = useRequestStore(selectUserKnowsItems);
  const detectedSpots = useRequestStore(selectDetectedSpots);
  const selectedSpotId = useRequestStore(selectSelectedSpotId);
  const mediaSource = useRequestStore(selectMediaSource);
  const artistName = useRequestStore(selectArtistName);
  const groupName = useRequestStore(selectGroupName);
  const context = useRequestStore(selectContext);
  const structuredMetadata = useRequestStore(selectStructuredMetadata);

  // Flow hook: submit / isSubmitting / submitError / close / instanceId
  const flow = useUploadFlow();

  // Image upload hook: autoUpload/autoAnalyze disabled
  const { images, isMaxImages, handleFilesSelected, removeImage, retryUpload } =
    useImageUpload({ autoUpload: false, autoAnalyze: false });

  // canProceed: unknowing users need spots only; knowing users need spots + links
  const canProceed =
    detectedSpots.length > 0 &&
    !flow.isSubmitting &&
    (userKnowsItems === false ||
      (userKnowsItems === true &&
        detectedSpots.every(
          (s) => s.solution?.originalUrl && s.solution?.title
        )));

  // Step indicator progression: Upload → Detect → Details → Submit.
  // Derived from UI state rather than store.currentStep, which is only
  // written by the legacy AI-detection path and otherwise stays at 1.
  const currentStep: number = flow.isSubmitting
    ? 4
    : detectedSpots.length > 0
      ? 3
      : hasImages && userKnowsItems !== null
        ? 2
        : 1;

  const hasInProgressWork = useRequestStore(selectHasInProgressWork);
  const disabledReason = useRequestStore(selectDisabledReason);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const disabledReasonCopy = (r: DisabledReason): string | null => {
    switch (r) {
      case "need_image":
        return "Upload an image";
      case "need_fork_choice":
        return "Choose how you'll add info";
      case "need_spot":
        return "Tap the image to add at least 1 spot";
      case "need_solution":
        return "Add a link and title for each spot";
      case "submitting":
      case null:
        return null;
    }
  };

  // Back button 노출/활성화
  const anyImageUploading = images.some((img) => img.status === "uploading");
  // fork 화면(이미지만 업로드, 분기 미선택)도 포함하기 위해 hasImages 기준으로 노출.
  const showBackButton = hasImages;
  const backDisabled = anyImageUploading || flow.isSubmitting;

  const performBack = useCallback(() => {
    // fork 화면(userKnowsItems === null) → DropZone
    // 스팟 마킹/디테일 → fork 화면 (backToFork가 userKnowsItems까지 클리어)
    if (userKnowsItems === null) {
      getRequestActions().backToUpload();
    } else {
      getRequestActions().backToFork();
    }
    // 어떤 경로든 draft는 의미 없어짐
    clearDraft();
  }, [userKnowsItems]);

  const handleBackClick = useCallback(() => {
    // 진행 중 작업이 있으면 Discard 확인. fork 화면은 hasInProgressWork=false라 바로 전이.
    if (hasInProgressWork) {
      setShowDiscardDialog(true);
      return;
    }
    performBack();
  }, [hasInProgressWork, performBack]);

  const handleUserTypeSelect = useCallback((knows: boolean) => {
    getRequestActions().setUserKnowsItems(knows);
    if (!knows) {
      getRequestActions().setMediaSource({
        type: "user_upload",
        title: "",
      });
    }
  }, []);

  const metadataValues: MetadataFormValues = {
    mediaType: mediaSource?.type ?? "user_upload",
    mediaDescription: mediaSource?.title ?? "",
    groupName: groupName ?? "",
    artistName: artistName ?? "",
    context: context ?? null,
    structured: structuredMetadata,
  };

  const handleMetadataChange = useCallback(
    (values: MetadataFormValues) => {
      const actions = getRequestActions();
      // Media type 변경은 changeMediaType으로 라우팅 — 타입-불일치 structured key drop
      if (values.mediaType !== (mediaSource?.type ?? "user_upload")) {
        actions.changeMediaType(values.mediaType);
      }
      actions.setMediaSource({
        type: values.mediaType,
        title: values.mediaDescription,
      });
      actions.setGroupName(values.groupName);
      actions.setArtistName(values.artistName);
      actions.setContext(values.context);
      actions.setStructuredMetadata(values.structured);
    },
    [mediaSource?.type]
  );

  // Submit gated by canProceed
  const handleSubmit = async () => {
    if (!canProceed) return;
    await flow.submit();
  };

  const handleImageClick = useCallback((x: number, y: number) => {
    getRequestActions().addSpot(x, y);
  }, []);

  const handleSpotClick = useCallback((spot: DetectedSpot) => {
    getRequestActions().selectSpot(spot.id);
  }, []);

  const handleSpotMove = useCallback((spotId: string, x: number, y: number) => {
    getRequestActions().moveSpot(spotId, x, y);
  }, []);

  const handleRemoveSpot = useCallback(
    (spotId: string) => {
      // Snapshot the spot (including solution + original index) so Undo
      // can restore it intact after the store re-indexes remaining spots.
      const snapshot = detectedSpots.find((s) => s.id === spotId);
      const originalIndex = detectedSpots.findIndex((s) => s.id === spotId);
      getRequestActions().removeSpot(spotId);
      if (!snapshot) return;
      const toastId = `spot-deleted-${spotId}`;
      toast(`Spot ${snapshot.index} deleted`, {
        id: toastId,
        duration: 5000,
        action: {
          label: "Undo",
          onClick: () => {
            getRequestActions().restoreSpot(
              snapshot,
              originalIndex >= 0 ? originalIndex : undefined
            );
            toast.dismiss(toastId);
          },
        },
      });
    },
    [detectedSpots]
  );

  const handleSaveSolution = useCallback(
    (spotId: string, solution: SpotSolutionData) => {
      getRequestActions().setSpotSolution(spotId, solution);
      getRequestActions().selectSpot(null);
    },
    []
  );

  const handleCancelSolution = useCallback(() => {
    getRequestActions().selectSpot(null);
  }, []);

  const handleEditorSave = useCallback(
    (editedFile: File) => {
      const currentImage = images[0];
      if (!currentImage) return;

      const actions = getRequestActions();
      actions.removeImage(currentImage.id);
      actions.addImage(editedFile);
      setShowEditor(false);
    },
    [images]
  );

  // Local preview image
  const localImage = images[0];

  return (
    <div data-testid="upload-flow-steps" className="relative">
      {showBackButton && (
        <button
          type="button"
          onClick={handleBackClick}
          disabled={backDisabled}
          aria-label="Go back"
          className="absolute top-4 left-4 z-20 rounded-full p-2 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}
      <main className="flex-1 min-h-0 flex flex-col px-4 py-4 md:py-6">
        <StepProgress currentStep={currentStep} className="py-4" />

        {!hasImages && (
          <div data-testid="upload-flow-dropzone">
            {/* Mobile upload options */}
            <div className="md:hidden mb-4">
              <MobileUploadOptions
                onGalleryClick={() => {
                  const input = document.querySelector(
                    'input[type="file"]'
                  ) as HTMLInputElement;
                  input?.click();
                }}
              />
            </div>

            <DropZone
              onFilesSelected={handleFilesSelected}
              disabled={isMaxImages}
              className="flex-1 h-full"
            />
          </div>
        )}

        {localImage && userKnowsItems === null && (
          <div
            data-testid="upload-flow-fork"
            className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full space-y-6 py-8"
          >
            <div
              data-testid="upload-flow-fork-preview"
              className="relative w-full aspect-[3/4] max-w-[220px] sm:max-w-xs rounded-xl overflow-hidden bg-foreground/5"
            >
              <Image
                src={localImage.previewUrl}
                alt={`Uploaded image preview: ${localImage.file.name}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 220px, 320px"
                priority
              />
            </div>
            <p className="text-lg font-medium text-center">
              Do you know the items in this photo?
            </p>
            <div className="flex gap-4 w-full">
              <button
                type="button"
                onClick={() => handleUserTypeSelect(true)}
                className="flex-1 py-4 px-6 rounded-xl font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
              >
                Yes, I have links
              </button>
              <button
                type="button"
                onClick={() => handleUserTypeSelect(false)}
                className="flex-1 py-4 px-6 rounded-xl font-medium border-2 border-foreground text-foreground hover:bg-foreground/5 transition-colors"
              >
                No, I'm curious
              </button>
            </div>
          </div>
        )}

        {localImage && userKnowsItems !== null && (
          <div
            data-testid="upload-flow-active"
            className="flex-1 min-h-0 flex flex-col space-y-4 max-w-6xl mx-auto w-full"
          >
            <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4 overflow-hidden">
              {/* Image with spot markers */}
              <div className="flex-1 min-h-0 flex items-center justify-center relative">
                <button
                  type="button"
                  onClick={() => setShowEditor(true)}
                  className="absolute top-2 right-2 z-10 p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white transition-colors"
                  aria-label="Edit image"
                >
                  <Crop className="w-4 h-4" />
                </button>
                <DetectionView
                  image={{
                    ...localImage,
                    // previewUrl을 uploadedUrl로 사용 (DetectionView 호환)
                    uploadedUrl: localImage.previewUrl,
                    status: "uploaded" as const,
                  }}
                  spots={detectedSpots}
                  isDetecting={false}
                  selectedSpotId={selectedSpotId}
                  onSpotClick={handleSpotClick}
                  onSpotMove={handleSpotMove}
                  onImageClick={handleImageClick}
                  layout="default"
                />
              </div>

              {/* Spot list + Metadata panel */}
              <div className="w-full md:w-80 flex-shrink-0 overflow-y-auto space-y-4">
                <div className="space-y-3">
                  {detectedSpots.length >= 1 && (
                    <div className="flex flex-col gap-1">
                      <div className="text-sm font-medium text-foreground">
                        <span className="tabular-nums">
                          Spots {detectedSpots.length}
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          / {RECOMMENDED_SPOT_COUNT}
                        </span>
                      </div>
                      {detectedSpots.length < RECOMMENDED_SPOT_COUNT && (
                        <p className="text-xs text-muted-foreground">
                          Tap image to add more, or drag to reposition
                        </p>
                      )}
                      {detectedSpots.length === RECOMMENDED_SPOT_COUNT && (
                        <p className="text-xs text-muted-foreground">
                          Nice. Add more if needed.
                        </p>
                      )}
                      {/* count > RECOMMENDED_SPOT_COUNT: no subtext (intentional, per spec) */}
                    </div>
                  )}

                  {detectedSpots.length === 0 && (
                    <div className="py-8 text-center space-y-2">
                      <Plus className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {userKnowsItems
                          ? "Tap on the image where items appear"
                          : "Tap on the image where you're curious"}
                      </p>
                    </div>
                  )}

                  {detectedSpots.map((spot) => (
                    <div
                      key={spot.id}
                      className={`
                      p-3 rounded-lg border transition-all
                      ${
                        selectedSpotId === spot.id
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background"
                      }
                    `}
                    >
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => handleSpotClick(spot)}
                          className={`
                          flex-shrink-0 w-6 h-6 rounded-full
                          flex items-center justify-center
                          text-xs font-bold transition-all
                          ${
                            selectedSpotId === spot.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-primary/20 text-primary hover:bg-primary/30"
                          }
                        `}
                        >
                          {spot.index}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {spot.solution?.title || spot.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {spot.solution
                                  ? "Link added"
                                  : userKnowsItems
                                    ? "Tap to add product link"
                                    : "Location marked"}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveSpot(spot.id)}
                              className="flex-shrink-0 p-1 text-muted-foreground hover:text-destructive transition-colors"
                              aria-label="Remove spot"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {selectedSpotId === spot.id &&
                            userKnowsItems === true && (
                              <SolutionInputForm
                                spotId={spot.id}
                                initialData={spot.solution}
                                onSave={handleSaveSolution}
                                onCancel={handleCancelSolution}
                              />
                            )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* 메타데이터 입력 - 솔루션 모르는 유저만 */}
                  {userKnowsItems === false && (
                    <div className="pt-4 border-t border-border">
                      <MetadataInputForm
                        values={metadataValues}
                        onChange={handleMetadataChange}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div
              className="flex flex-col gap-2 pt-4 border-t border-border flex-shrink-0"
              style={{
                paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
              }}
            >
              {disabledReasonCopy(disabledReason) && (
                <p
                  id="post-disabled-reason"
                  className="text-xs text-muted-foreground"
                >
                  {disabledReasonCopy(disabledReason)}
                </p>
              )}
              <div className="flex items-center justify-end gap-3">
                {flow.submitError && (
                  <div className="flex items-center gap-2 mr-auto">
                    <p className="text-sm text-destructive">
                      {flow.submitError}
                    </p>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={flow.isSubmitting}
                      className="px-3 py-1.5 text-sm bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Retry
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canProceed}
                  aria-describedby={
                    disabledReason && disabledReason !== "submitting"
                      ? "post-disabled-reason"
                      : undefined
                  }
                  className={`
                    px-6 py-2.5 rounded-lg font-medium transition-all
                    flex items-center gap-2
                    ${
                      canProceed
                        ? "bg-foreground text-background hover:bg-foreground/90"
                        : "bg-foreground/20 text-foreground/40 cursor-not-allowed"
                    }
                  `}
                >
                  {flow.isSubmitting && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {flow.isSubmitting ? "Posting..." : "Post"}
                  {detectedSpots.length > 0 && !flow.isSubmitting && (
                    <span className="ml-1 opacity-80">
                      · {detectedSpots.length}{" "}
                      {detectedSpots.length === 1 ? "spot" : "spots"}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Image Editor Modal */}
      {showEditor && localImage && (
        <ImageEditor
          imageUrl={localImage.previewUrl}
          onSave={handleEditorSave}
          onCancel={() => setShowEditor(false)}
        />
      )}

      <DiscardProgressDialog
        open={showDiscardDialog}
        onCancel={() => setShowDiscardDialog(false)}
        onConfirm={() => {
          setShowDiscardDialog(false);
          performBack();
        }}
      />
    </div>
  );
}
