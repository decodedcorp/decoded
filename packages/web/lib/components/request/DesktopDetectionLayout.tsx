"use client";

import { useCallback } from "react";
import {
  type UploadedImage,
  type DetectedSpot,
  type SpotSolutionData,
} from "@/lib/stores/requestStore";
import { DetectionView } from "./DetectionView";
import { DetectedItemCard } from "./DetectedItemCard";
import { useSpotCardSync } from "@/lib/hooks/useSpotCardSync";

interface DesktopDetectionLayoutProps {
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
 * DesktopDetectionLayout - 데스크톱용 감지 결과 레이아웃
 *
 * - Side-by-side 레이아웃
 * - 좌측: 이미지 (sticky, aspect-[3/4])
 * - 우측: 카드 목록 (스크롤)
 * - SpotMarker ↔ 카드 상호작용 연동
 */
export function DesktopDetectionLayout({
  image,
  spots,
  isDetecting,
  isRevealing,
  selectedSpotId,
  onSelectSpot,
  onSaveSolution,
  onAddSpot,
}: DesktopDetectionLayoutProps) {
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

  return (
    <div className="flex gap-8 max-w-6xl mx-auto px-4 py-6">
      {/* Left: Image Container (sticky) */}
      <div className="flex-1 max-w-md">
        <div className="sticky top-24">
          <DetectionView
            image={image}
            spots={spots}
            isDetecting={isDetecting}
            isRevealing={isRevealing}
            selectedSpotId={selectedSpotId}
            onSpotClick={handleSpotClick}
            onImageClick={onAddSpot}
            layout="default"
          />
        </div>
      </div>

      {/* Right: Cards Panel (scrollable) */}
      <div className="flex-1 max-w-md">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Spots ({spots.length})</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Click on image to add spots
          </p>
        </div>

        {isDetecting && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {!isDetecting && spots.length > 0 && (
          <div
            ref={scrollContainerRef}
            className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2"
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
        )}
      </div>
    </div>
  );
}
