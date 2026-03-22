"use client";

import { useCallback, useState } from "react";
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
} from "@/lib/stores/requestStore";
import { useImageUpload } from "@/lib/hooks/useImageUpload";
import {
  createPostWithFile,
  createPostWithFileAndSolutions,
} from "@/lib/api/posts";
import { compressImage } from "@/lib/utils/imageCompression";
import { RequestFlowModal } from "@/lib/components/request/RequestFlowModal";
import { RequestFlowHeader } from "@/lib/components/request/RequestFlowHeader";
import { DropZone } from "@/lib/components/request/DropZone";
import { DetectionView } from "@/lib/components/request/DetectionView";
import { SolutionInputForm } from "@/lib/components/request/SolutionInputForm";
import {
  MetadataInputForm,
  type MetadataFormValues,
} from "@/lib/components/request/MetadataInputForm";
import { Trash2, Plus, Loader2 } from "lucide-react";

/**
 * Intercepting route for /request/upload
 * Shows upload page as modal overlay on desktop
 * Same flow as full page: upload → add spots (tap image) → Post
 */
export default function ModalRequestUploadPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStep = useRequestStore(selectCurrentStep);
  const hasImages = useRequestStore(selectHasImages);
  const userKnowsItems = useRequestStore(selectUserKnowsItems);
  const detectedSpots = useRequestStore(selectDetectedSpots);
  const selectedSpotId = useRequestStore(selectSelectedSpotId);
  const mediaSource = useRequestStore(selectMediaSource);
  const artistName = useRequestStore(selectArtistName);
  const groupName = useRequestStore(selectGroupName);
  const context = useRequestStore(selectContext);

  const { images, isMaxImages, handleFilesSelected, removeImage } =
    useImageUpload({ autoUpload: false, autoAnalyze: false });

  const canProceed =
    detectedSpots.length > 0 &&
    !isSubmitting &&
    (userKnowsItems === false ||
      (userKnowsItems === true &&
        detectedSpots.every(
          (s) => s.solution?.originalUrl && s.solution?.title
        )));

  const handleClose = useCallback(() => {
    getRequestActions().resetRequestFlow();
    router.back();
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

  const handleNext = async () => {
    if (!canProceed) return;

    const localImage = images[0];
    if (!localImage?.file) {
      toast.error("이미지를 선택해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      toast.loading("이미지 준비 중...", { id: "prepare" });
      const { file: compressedFile } = await compressImage(localImage.file);
      toast.dismiss("prepare");

      const spotsPayload = detectedSpots.map((spot) => ({
        position_left: `${(spot.center.x * 100).toFixed(1)}%`,
        position_top: `${(spot.center.y * 100).toFixed(1)}%`,
      }));

      toast.loading("포스트 생성 중...", { id: "create" });
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
      toast.success("포스트가 생성되었습니다!");

      getRequestActions().resetRequestFlow();
      router.push(`/posts/${response.id}`);
    } catch (error) {
      toast.dismiss("upload");
      toast.dismiss("create");
      const message =
        error instanceof Error ? error.message : "포스트 생성에 실패했습니다.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageClick = useCallback((x: number, y: number) => {
    getRequestActions().addSpot(x, y);
  }, []);

  const handleSpotClick = useCallback((spot: DetectedSpot) => {
    getRequestActions().selectSpot(spot.id);
  }, []);

  const handleRemoveSpot = useCallback((spotId: string) => {
    getRequestActions().removeSpot(spotId);
  }, []);

  const handleSaveSolution = useCallback((spotId: string, solution: any) => {
    getRequestActions().setSpotSolution(spotId, solution);
    getRequestActions().selectSpot(null);
  }, []);

  const handleCancelSolution = useCallback(() => {
    getRequestActions().selectSpot(null);
  }, []);

  const localImage = images[0];

  return (
    <RequestFlowModal>
      <div className="flex flex-col h-full min-h-[60vh]">
        <RequestFlowHeader
          title="Upload Images"
          currentStep={currentStep}
          onClose={handleClose}
        />

        <main className="flex-1 min-h-0 flex flex-col px-4 py-4">
          {!hasImages && (
            <DropZone
              onFilesSelected={handleFilesSelected}
              disabled={isMaxImages}
              className="flex-1 h-full min-h-[300px]"
            />
          )}

          {localImage && userKnowsItems === null && (
            <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full space-y-8 py-12">
              <p className="text-lg font-medium text-center">
                이 사진 속 아이템을 알고 계신가요?
              </p>
              <div className="flex gap-4 w-full">
                <button
                  type="button"
                  onClick={() => handleUserTypeSelect(true)}
                  className="flex-1 py-4 px-6 rounded-xl font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
                >
                  네, 링크를 알고 있어요
                </button>
                <button
                  type="button"
                  onClick={() => handleUserTypeSelect(false)}
                  className="flex-1 py-4 px-6 rounded-xl font-medium border-2 border-foreground text-foreground hover:bg-foreground/5 transition-colors"
                >
                  아니요, 궁금해요
                </button>
              </div>
            </div>
          )}

          {localImage && userKnowsItems !== null && (
            <div className="flex-1 min-h-0 flex flex-col space-y-4 w-full">
              <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4 overflow-hidden">
                <div className="flex-1 min-h-0 flex items-center justify-center">
                  <DetectionView
                    image={{
                      ...localImage,
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

                <div className="w-full md:w-80 flex-shrink-0 overflow-y-auto space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">
                      Spots ({detectedSpots.length})
                    </h3>
                    {detectedSpots.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {userKnowsItems
                          ? "스팟 탭하여 링크 입력"
                          : "궁금한 위치가 표시됨"}
                      </p>
                    )}
                  </div>

                  {detectedSpots.length === 0 && (
                    <div className="py-8 text-center space-y-2">
                      <Plus className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {userKnowsItems
                          ? "이미지에서 아이템 위치를 탭하세요"
                          : "이미지에서 궁금한 위치를 탭하세요"}
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
                                  ? "링크 입력됨"
                                  : userKnowsItems
                                    ? "탭하여 상품 링크 입력"
                                    : "위치 표시됨"}
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

              <div className="flex justify-end pt-4 border-t border-border flex-shrink-0">
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
      </div>
    </RequestFlowModal>
  );
}
