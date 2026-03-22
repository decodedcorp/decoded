"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  useRequestStore,
  selectImages,
  selectDetectedSpots,
  selectSelectedSpotId,
  selectCurrentStep,
  type DetectedSpot,
} from "@/lib/stores/requestStore";
import { RequestFlowModal } from "@/lib/components/request/RequestFlowModal";
import { RequestFlowHeader } from "@/lib/components/request/RequestFlowHeader";
import { DetectionView } from "@/lib/components/request/DetectionView";
import { DetectedItemCard } from "@/lib/components/request/DetectedItemCard";
import { useSpotCardSync } from "@/lib/hooks/useSpotCardSync";

/**
 * Intercepting route for /request/detect
 * Shows detect page as modal overlay on desktop
 */
export default function ModalRequestDetectPage() {
  const router = useRouter();

  const images = useRequestStore(selectImages);
  const spots = useRequestStore(selectDetectedSpots);
  const selectedSpotId = useRequestStore(selectSelectedSpotId);
  const currentStep = useRequestStore(selectCurrentStep);

  const selectSpot = useRequestStore((s) => s.selectSpot);
  const addSpot = useRequestStore((s) => s.addSpot);
  const setSpotSolution = useRequestStore((s) => s.setSpotSolution);
  const resetRequestFlow = useRequestStore((s) => s.resetRequestFlow);
  const setStep = useRequestStore((s) => s.setStep);

  // Get the first uploaded image
  const uploadedImage = images.find((img) => img.status === "uploaded");

  // Spot-card sync for modal layout
  const {
    cardRefs,
    scrollContainerRef,
    selectSpot: syncSelectSpot,
  } = useSpotCardSync({
    spots,
    selectedSpotId,
    onSelectSpot: selectSpot,
  });

  // Redirect to upload if no images
  useEffect(() => {
    if (images.length === 0) {
      const timer = setTimeout(() => {
        if (useRequestStore.getState().images.length === 0) {
          router.push("/request/upload");
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [images.length, router]);

  // Set step to 2 when entering this page
  useEffect(() => {
    setStep(2);
  }, [setStep]);

  const handleClose = () => {
    resetRequestFlow();
    router.back();
  };

  const handleBack = () => {
    router.push("/request/upload");
  };

  const handleSpotClick = useCallback(
    (spot: DetectedSpot) => {
      syncSelectSpot(spot.id);
    },
    [syncSelectSpot]
  );

  const handleCardClick = useCallback(
    (spot: DetectedSpot) => {
      selectSpot(spot.id);
    },
    [selectSpot]
  );

  const handleAddSpot = useCallback(
    (x: number, y: number) => {
      addSpot(x, y);
    },
    [addSpot]
  );

  const setCardRef = useCallback(
    (spotId: string) => (el: HTMLDivElement | null) => {
      cardRefs.current.set(spotId, el);
    },
    [cardRefs]
  );

  // Show nothing while redirecting
  if (!uploadedImage) {
    return null;
  }

  return (
    <RequestFlowModal>
      <div className="flex flex-col h-full min-h-[70vh]">
        <RequestFlowHeader
          title="Add Spots"
          currentStep={currentStep}
          onClose={handleClose}
          onBack={handleBack}
        />

        <main className="flex-1 min-h-0 overflow-hidden">
          {/* Compact Modal Layout - Split View */}
          <div className="flex h-full">
            {/* Left: Image */}
            <div className="w-1/2 p-4 flex items-center justify-center">
              <div className="w-full max-w-[400px]">
                <DetectionView
                  image={uploadedImage}
                  spots={spots}
                  isDetecting={false}
                  isRevealing={false}
                  selectedSpotId={selectedSpotId}
                  onSpotClick={handleSpotClick}
                  onImageClick={handleAddSpot}
                  layout="default"
                />
              </div>
            </div>

            {/* Right: Cards Panel */}
            <div className="w-1/2 p-4 flex flex-col border-l border-border">
              <div className="mb-3">
                <h2 className="text-base font-semibold">
                  Spots ({spots.length})
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Click on image to add spots
                </p>
              </div>

              {spots.length > 0 && (
                <div
                  ref={scrollContainerRef}
                  className="flex-1 overflow-y-auto space-y-3 pr-1"
                >
                  {spots.map((spot) => (
                    <DetectedItemCard
                      key={spot.id}
                      ref={setCardRef(spot.id)}
                      spot={spot}
                      isSelected={selectedSpotId === spot.id}
                      onClick={() => handleCardClick(spot)}
                      onSaveSolution={setSpotSolution}
                    />
                  ))}
                </div>
              )}

              {spots.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                  Click on image to add spots
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </RequestFlowModal>
  );
}
