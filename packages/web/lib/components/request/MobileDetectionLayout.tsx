"use client";

import { useCallback } from "react";
import {
  type UploadedImage,
  type DetectedSpot,
  type SpotSolutionData,
} from "@/lib/stores/requestStore";
import { DetectionView } from "./DetectionView";
import { DetectedItemCard } from "./DetectedItemCard";
import { BottomSheet } from "@/lib/design-system";
import { useSpotCardSync } from "@/lib/hooks/useSpotCardSync";

interface MobileDetectionLayoutProps {
  image: UploadedImage;
  spots: DetectedSpot[];
  isDetecting: boolean;
  isRevealing: boolean;
  selectedSpotId: string | null;
  onSelectSpot: (spotId: string | null) => void;
  onSaveSolution?: (spotId: string, solution: SpotSolutionData) => void;
  onAddSpot?: (x: number, y: number) => void;
}

/**
 * MobileDetectionLayout - 모바일용 감지 결과 레이아웃
 *
 * - 풀스크린 이미지 + SpotMarkers
 * - 바텀시트로 아이템 카드 표시 (기본 30%)
 * - SpotMarker ↔ 카드 상호작용 연동
 */
export function MobileDetectionLayout({
  image,
  spots,
  isDetecting,
  isRevealing,
  selectedSpotId,
  onSelectSpot,
  onSaveSolution,
  onAddSpot,
}: MobileDetectionLayoutProps) {
  const { cardRefs, scrollContainerRef, selectSpot } = useSpotCardSync({
    spots,
    selectedSpotId,
    onSelectSpot,
  });

  const handleSpotClick = useCallback(
    (spot: DetectedSpot) => {
      selectSpot(spot.id);
    },
    [selectSpot]
  );

  const handleCardClick = useCallback(
    (spot: DetectedSpot) => {
      onSelectSpot(spot.id);
    },
    [onSelectSpot]
  );

  const setCardRef = useCallback(
    (spotId: string) => (el: HTMLDivElement | null) => {
      cardRefs.current.set(spotId, el);
    },
    [cardRefs]
  );

  const showBottomSheet = !isDetecting && spots.length > 0;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      {/* Fullscreen Image Container */}
      <div
        className="absolute inset-0"
        style={{
          paddingBottom: showBottomSheet ? "30vh" : 0,
        }}
      >
        <DetectionView
          image={image}
          spots={spots}
          isDetecting={isDetecting}
          isRevealing={isRevealing}
          selectedSpotId={selectedSpotId}
          onSpotClick={handleSpotClick}
          onImageClick={onAddSpot}
          layout="fullscreen"
        />
      </div>

      {/* Bottom Sheet with Cards */}
      <BottomSheet
        isOpen={showBottomSheet}
        snapPoints={[0.3, 0.6, 0.9]}
        defaultSnapPoint={0.3}
        header={
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Spots ({spots.length})</h2>
          </div>
        }
      >
        <div
          ref={scrollContainerRef}
          className="px-4 py-2 space-y-3 h-full overflow-y-auto"
        >
          {spots.map((spot) => (
            <DetectedItemCard
              key={spot.id}
              ref={setCardRef(spot.id)}
              spot={spot}
              isSelected={selectedSpotId === spot.id}
              onClick={() => handleCardClick(spot)}
              onSaveSolution={onSaveSolution}
            />
          ))}
        </div>
      </BottomSheet>
    </div>
  );
}
