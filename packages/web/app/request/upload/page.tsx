"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useRequestStore,
  getRequestActions,
  selectCurrentStep,
  selectHasImages,
  selectDetectedSpots,
  selectSelectedSpotId,
  selectUserKnowsItems,
  selectMediaSource,
  selectArtistName,
  selectGroupName,
  selectContext,
  type DetectedSpot,
  type SpotSolutionData,
} from "@/lib/stores/requestStore";
import { useImageUpload } from "@/lib/hooks/useImageUpload";
import {
  createPostWithFile,
  createPostWithFileAndSolutions,
} from "@/lib/api/posts";
import { compressImage } from "@/lib/utils/imageCompression";
import { RequestFlowHeader } from "@/lib/components/request/RequestFlowHeader";
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
import { Trash2, Plus, Loader2, RefreshCw, Crop } from "lucide-react";
import {
  saveDraft,
  saveDraftThumbnail,
  loadDraft,
  clearDraft,
} from "@/lib/utils/offlineDraft";

export default function RequestUploadPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  // 상태만 구독 (렌더링에 필요한 것만)
  const currentStep = useRequestStore(selectCurrentStep);
  const hasImages = useRequestStore(selectHasImages);
  const userKnowsItems = useRequestStore(selectUserKnowsItems);
  const detectedSpots = useRequestStore(selectDetectedSpots);
  const selectedSpotId = useRequestStore(selectSelectedSpotId);
  const mediaSource = useRequestStore(selectMediaSource);
  const artistName = useRequestStore(selectArtistName);
  const groupName = useRequestStore(selectGroupName);
  const context = useRequestStore(selectContext);

  // autoUpload: false, autoAnalyze: false - 자동 업로드/분석 비활성화
  const { images, isMaxImages, handleFilesSelected, removeImage, retryUpload } =
    useImageUpload({ autoUpload: false, autoAnalyze: false });

  // Draft 복원 (마운트 시 1회)
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

  // Auto-save draft (spots/metadata 변경 시)
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

    // 이미지 썸네일도 저장
    const file = images[0]?.file;
    if (file) saveDraftThumbnail(file);
  }, [
    detectedSpots,
    userKnowsItems,
    mediaSource,
    artistName,
    groupName,
    context,
    images,
  ]);

  // canProceed: 모르는 유저는 spots만, 알고 있는 유저는 spots + 모든 스팟에 솔루션(링크)
  const canProceed =
    detectedSpots.length > 0 &&
    !isSubmitting &&
    (userKnowsItems === false ||
      (userKnowsItems === true &&
        detectedSpots.every(
          (s) => s.solution?.originalUrl && s.solution?.title
        )));

  // Action은 getRequestActions()로 접근 (구독 없이)
  const handleClose = useCallback(() => {
    getRequestActions().resetRequestFlow();
    router.push("/");
  }, [router]);

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
  };

  const handleMetadataChange = useCallback((values: MetadataFormValues) => {
    getRequestActions().setMediaSource({
      type: values.mediaType,
      title: values.mediaDescription,
    });
    getRequestActions().setGroupName(values.groupName);
    getRequestActions().setArtistName(values.artistName);
    getRequestActions().setContext(values.context);
  }, []);

  // Next 버튼: 이미지 업로드 + POST API 호출
  const handleNext = async () => {
    if (!canProceed) return;

    const localImage = images[0];
    if (!localImage?.file) {
      toast.error("Please select an image.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1. 이미지 압축
      toast.loading("Preparing image...", { id: "prepare" });
      const { file: compressedFile } = await compressImage(localImage.file);
      toast.dismiss("prepare");

      // 2. spots를 API 형식으로 변환 (position만 전송)
      const spotsPayload = detectedSpots.map((spot) => ({
        position_left: `${(spot.center.x * 100).toFixed(1)}%`,
        position_top: `${(spot.center.y * 100).toFixed(1)}%`,
      }));

      // 3. POST API 호출 (userKnowsItems에 따라 분기)
      toast.loading("Creating post...", { id: "create" });
      const mediaSourcePayload = {
        type: mediaSource?.type ?? "user_upload",
        description:
          mediaSource?.title?.trim() ||
          (userKnowsItems ? "User Upload" : undefined),
      };
      const response =
        userKnowsItems === true
          ? await createPostWithFileAndSolutions({
              file: compressedFile,
              media_source: mediaSourcePayload,
              spots: detectedSpots.map((spot) => ({
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
              artist_name: artistName?.trim() || undefined,
              group_name: groupName?.trim() || undefined,
              context: context ?? undefined,
            });
      toast.dismiss("create");

      toast.success("Post created!");

      // 4. 완료 후 draft 삭제 + 리다이렉트
      clearDraft();
      getRequestActions().resetRequestFlow();
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
  };

  // Spot creation handler
  const handleImageClick = useCallback((x: number, y: number) => {
    getRequestActions().addSpot(x, y);
  }, []);

  // Spot selection handler
  const handleSpotClick = useCallback((spot: DetectedSpot) => {
    getRequestActions().selectSpot(spot.id);
  }, []);

  // Spot deletion handler
  const handleRemoveSpot = useCallback((spotId: string) => {
    getRequestActions().removeSpot(spotId);
  }, []);

  // Solution save handler
  const handleSaveSolution = useCallback(
    (spotId: string, solution: SpotSolutionData) => {
      getRequestActions().setSpotSolution(spotId, solution);
      getRequestActions().selectSpot(null); // Deselect after saving
    },
    []
  );

  // Solution cancel handler
  const handleCancelSolution = useCallback(() => {
    getRequestActions().selectSpot(null);
  }, []);

  // Image editor save handler
  const handleEditorSave = useCallback(
    (editedFile: File) => {
      const currentImage = images[0];
      if (!currentImage) return;

      // Replace the image in the store
      const actions = getRequestActions();
      actions.removeImage(currentImage.id);
      actions.addImage(editedFile);
      setShowEditor(false);
    },
    [images]
  );

  // 로컬 프리뷰 이미지 사용 (previewUrl)
  const localImage = images[0];

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <RequestFlowHeader
        title="Upload Images"
        currentStep={currentStep}
        onClose={handleClose}
      />

      <main className="flex-1 min-h-0 flex flex-col px-4 py-4 md:py-6">
        <StepProgress currentStep={1} className="py-4" />

        {!hasImages && (
          <>
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
          </>
        )}

        {localImage && userKnowsItems === null && (
          <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full space-y-8 py-12">
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
          <div className="flex-1 min-h-0 flex flex-col space-y-4 max-w-6xl mx-auto w-full">
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
                  onImageClick={handleImageClick}
                  layout="default"
                />
              </div>

              {/* Spot list + Metadata panel */}
              <div className="w-full md:w-80 flex-shrink-0 overflow-y-auto space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">
                      Spots ({detectedSpots.length})
                    </h3>
                    {detectedSpots.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {userKnowsItems
                          ? "Tap a spot to add a link"
                          : "Curious locations marked"}
                      </p>
                    )}
                  </div>

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

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border flex-shrink-0">
              {submitError && (
                <div className="flex items-center gap-2 mr-auto">
                  <p className="text-sm text-destructive">{submitError}</p>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 text-sm bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed}
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
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? "Posting..." : "Post"}
              </button>
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
    </div>
  );
}
