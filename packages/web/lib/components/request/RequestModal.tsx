"use client";

import { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { X, ArrowLeft } from "lucide-react";
import {
  useRequestStore,
  selectCurrentStep,
  selectHasImages,
  selectCanProceed,
  selectDetectedSpots,
  selectIsDetecting,
  selectIsRevealing,
  selectSelectedSpotId,
} from "@/lib/stores/requestStore";
import { useImageUpload } from "@/lib/hooks/useImageUpload";
import { DropZone } from "./DropZone";
import { SingleImagePreview } from "./SingleImagePreview";
import { StepIndicator } from "@/lib/design-system";
import { DetectionView } from "./DetectionView";
import { DetectedItemCard } from "./DetectedItemCard";
import { DetailsStep } from "./DetailsStep";
import { StepContent } from "./StepContent";

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEP_TITLES: Record<number, string> = {
  1: "Upload Image",
  2: "Detected Items",
  3: "Details",
};

export function RequestModal({ isOpen, onClose }: RequestModalProps) {
  const [mounted, setMounted] = useState(false);
  const currentStep = useRequestStore(selectCurrentStep);
  const hasImages = useRequestStore(selectHasImages);
  const canProceed = useRequestStore(selectCanProceed);
  const detectedSpots = useRequestStore(selectDetectedSpots);
  const isDetecting = useRequestStore(selectIsDetecting);
  const isRevealing = useRequestStore(selectIsRevealing);
  const selectedSpotId = useRequestStore(selectSelectedSpotId);
  const resetRequestFlow = useRequestStore((s) => s.resetRequestFlow);
  const startDetection = useRequestStore((s) => s.startDetection);
  const selectSpot = useRequestStore((s) => s.selectSpot);
  const addSpot = useRequestStore((s) => s.addSpot);
  const setStep = useRequestStore((s) => s.setStep);

  const handleImageClick = useCallback(
    (x: number, y: number) => {
      addSpot(x, y);
    },
    [addSpot]
  );

  const { images, isMaxImages, handleFilesSelected, removeImage, retryUpload } =
    useImageUpload();

  // Client-side only mounting for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, hasImages]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (hasImages || detectedSpots.length > 0) {
      const confirmed = window.confirm(
        "진행 중인 내용이 있습니다. 닫으시겠습니까?"
      );
      if (!confirmed) return;
    }
    resetRequestFlow();
    onClose();
  }, [hasImages, detectedSpots.length, resetRequestFlow, onClose]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setStep((currentStep - 1) as 1 | 2 | 3);
    }
  }, [currentStep, setStep]);

  const handleNext = useCallback(() => {
    if (!canProceed) return;

    if (currentStep === 1) {
      // Step 1 → Step 2: AI 감지 시작
      startDetection();
    } else if (currentStep === 2) {
      // Step 2 → Step 3: 다음 단계로 이동
      setStep(3);
    }
  }, [canProceed, currentStep, startDetection, setStep]);

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        className="relative w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-xl
                   bg-background md:border md:border-border md:shadow-lg
                   overflow-hidden flex flex-col animate-in fade-in-0 zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          {/* Back button */}
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="p-2 -ml-2 rounded-full hover:bg-foreground/5 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <div className="w-9" />
          )}

          <div className="flex flex-col items-center">
            <h1 id="request-modal-title" className="text-base font-medium">
              {STEP_TITLES[currentStep]}
            </h1>
            <StepIndicator
              currentStep={currentStep}
              size="xs"
              className="mt-1"
            />
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 -mr-2 rounded-full hover:bg-foreground/5 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Body */}
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <StepContent currentStep={currentStep}>
            <div className="flex-1 min-h-0 flex flex-col overflow-y-auto p-4 md:p-6">
              {/* Step 1: Upload */}
              {currentStep === 1 && (
                <div className="flex-1 min-h-0 flex flex-col">
                  {!hasImages && (
                    <DropZone
                      onFilesSelected={handleFilesSelected}
                      disabled={isMaxImages}
                      className="flex-1 min-h-[250px] md:min-h-[300px]"
                    />
                  )}

                  {hasImages && images[0] && (
                    <div className="flex-1 flex items-center justify-center">
                      <SingleImagePreview
                        image={images[0]}
                        onRemove={() => removeImage(images[0].id)}
                        onRetry={() => retryUpload(images[0].id)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Detection */}
              {currentStep === 2 && images[0] && (
                <div className="space-y-4">
                  {/* Image with SpotMarkers - 최대한 크게 */}
                  <div className="flex-shrink-0">
                    <DetectionView
                      image={images[0]}
                      spots={detectedSpots}
                      isDetecting={isDetecting}
                      isRevealing={isRevealing}
                      selectedSpotId={selectedSpotId}
                      onSpotClick={(spot) => selectSpot(spot.id)}
                      onImageClick={handleImageClick}
                    />
                  </div>

                  {/* Item Cards - 스크롤해서 볼 수 있음 */}
                  {!isDetecting && detectedSpots.length > 0 && (
                    <div className="space-y-2 pb-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground">
                          Detected Items ({detectedSpots.length})
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          Scroll to see more
                        </span>
                      </div>
                      <div className="space-y-2">
                        {detectedSpots.map((spot) => (
                          <DetectedItemCard
                            key={spot.id}
                            spot={spot}
                            isSelected={selectedSpotId === spot.id}
                            onClick={() => selectSpot(spot.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Details */}
              {currentStep === 3 && <DetailsStep onClose={handleClose} />}
            </div>
          </StepContent>
        </main>

        {/* Footer */}
        {(hasImages || currentStep > 1) &&
          currentStep !== 3 &&
          !isDetecting &&
          !isRevealing && (
            <footer className="flex justify-end px-4 py-3 border-t border-border flex-shrink-0">
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed}
                className={`
                  px-6 py-2.5 rounded-lg font-medium transition-all
                  ${
                    canProceed
                      ? "bg-primary text-primary-foreground hover:shadow-[0_0_20px_oklch(0.9519_0.1739_115.8446_/_0.5)]"
                      : "bg-primary/20 text-primary/40 cursor-not-allowed"
                  }
                `}
              >
                {currentStep === 1 ? "Analyze" : "Next"}
              </button>
            </footer>
          )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
