"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  useRequestStore,
  selectImages,
  selectDetectedSpots,
  selectSelectedSpotId,
  selectCurrentStep,
} from "@/lib/stores/requestStore";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";
import { RequestFlowHeader } from "@/lib/components/request/RequestFlowHeader";
import { MobileDetectionLayout } from "@/lib/components/request/MobileDetectionLayout";
import { DesktopDetectionLayout } from "@/lib/components/request/DesktopDetectionLayout";
import { StepProgress } from "@/lib/components/request/StepProgress";
import { DetectionToolbar } from "@/lib/components/request/DetectionToolbar";

export default function RequestDetectPage() {
  const router = useRouter();
  const isMobile = useIsMobile();

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
    router.push("/");
  };

  const handleBack = () => {
    router.push("/request/upload");
  };

  const handleSelectSpot = (spotId: string | null) => {
    selectSpot(spotId);
  };

  const handleAddSpot = useCallback(
    (x: number, y: number) => {
      addSpot(x, y);
    },
    [addSpot]
  );

  // Show loading state while redirecting
  if (!uploadedImage) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        aria-busy="true"
      >
        <div className="text-sm text-muted-foreground animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <RequestFlowHeader
        title="Add Spots"
        currentStep={currentStep}
        onClose={handleClose}
        onBack={handleBack}
      />

      <div className="px-4 pt-4">
        <StepProgress currentStep={2} className="py-4" />
        <DetectionToolbar className="mb-4 mx-auto" />
      </div>

      {/* Mobile Layout */}
      {isMobile && (
        <MobileDetectionLayout
          image={uploadedImage}
          spots={spots}
          isDetecting={false}
          isRevealing={false}
          selectedSpotId={selectedSpotId}
          onSelectSpot={handleSelectSpot}
          onSaveSolution={setSpotSolution}
          onAddSpot={handleAddSpot}
        />
      )}

      {/* Desktop Layout */}
      {!isMobile && (
        <main className="pt-4">
          <DesktopDetectionLayout
            image={uploadedImage}
            spots={spots}
            isDetecting={false}
            isRevealing={false}
            selectedSpotId={selectedSpotId}
            onSelectSpot={handleSelectSpot}
            onSaveSolution={setSpotSolution}
            onAddSpot={handleAddSpot}
          />
        </main>
      )}
    </div>
  );
}
