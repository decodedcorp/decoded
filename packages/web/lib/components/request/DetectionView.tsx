"use client";

import { memo } from "react";
import Image from "next/image";
import {
  type UploadedImage,
  type DetectedSpot,
} from "@/lib/stores/requestStore";
import { Hotspot } from "@/lib/design-system";

interface DetectionViewProps {
  image: UploadedImage;
  spots: DetectedSpot[];
  isDetecting: boolean;
  isRevealing?: boolean;
  selectedSpotId?: string | null;
  onSpotClick?: (spot: DetectedSpot) => void;
  onImageClick?: (x: number, y: number) => void; // 이미지 클릭 시 normalized 좌표 전달
  layout?: "default" | "fullscreen";
}

/**
 * DetectionView - AI 감지 결과를 보여주는 뷰
 *
 * - 이미지 위에 SpotMarker 오버레이
 * - 감지 중일 때 로딩 오버레이
 * - 스팟 클릭 시 선택 상태 변경
 */
export const DetectionView = memo(
  ({
    image,
    spots,
    isDetecting,
    isRevealing = false,
    selectedSpotId,
    onSpotClick,
    onImageClick,
    layout = "default",
  }: DetectionViewProps) => {
    // 이미지 클릭 핸들러 - normalized 좌표로 변환
    const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onImageClick || isDetecting) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      // 클램프 0-1
      const clampedX = Math.max(0, Math.min(1, x));
      const clampedY = Math.max(0, Math.min(1, y));

      onImageClick(clampedX, clampedY);
    };
    const containerClasses =
      layout === "fullscreen"
        ? "relative w-full h-full overflow-hidden bg-foreground/5"
        : "relative w-full aspect-[3/4] max-w-md mx-auto rounded-xl overflow-hidden bg-foreground/5";

    return (
      <div className={containerClasses}>
        {/* 이미지 */}
        <Image
          src={image.previewUrl}
          alt="Uploaded image"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 400px"
        />

        {/* 클릭 영역 (spot 추가용) - z-[1]로 SpotMarker(z-10)보다 낮게 */}
        {onImageClick && !isDetecting && (
          <div
            className="absolute inset-0 z-[1] cursor-crosshair"
            onClick={handleImageClick}
          />
        )}

        {/* 홀로그램 스캔 오버레이 */}
        {isDetecting && (
          <div className="absolute inset-0 z-10 overflow-hidden">
            {/* 배경 딤 + 블러 */}
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]" />

            {/* 그리드 오버레이 */}
            <div className="absolute inset-0 hologram-grid animate-hologram-pulse" />

            {/* 스캔라인 (CRT 효과) */}
            <div className="absolute inset-0 hologram-scanlines" />

            {/* 메인 스캔 라인 - 네온 발광 */}
            <div
              className="absolute left-0 right-0 h-1 animate-hologram-scan"
              style={{
                background: `linear-gradient(90deg,
                  transparent 0%,
                  oklch(0.9519 0.1739 115.8446 / 0.3) 10%,
                  oklch(0.9519 0.1739 115.8446) 50%,
                  oklch(0.9519 0.1739 115.8446 / 0.3) 90%,
                  transparent 100%
                )`,
                boxShadow: `
                  0 0 20px oklch(0.9519 0.1739 115.8446),
                  0 0 40px oklch(0.9519 0.1739 115.8446 / 0.7),
                  0 0 60px oklch(0.9519 0.1739 115.8446 / 0.4)
                `,
              }}
            />

            {/* 스캔 영역 표시 (스캔 라인 아래 영역 하이라이트) */}
            <div
              className="absolute left-0 right-0 animate-hologram-scan"
              style={{
                height: "30%",
                background: `linear-gradient(180deg,
                  oklch(0.9519 0.1739 115.8446 / 0.15) 0%,
                  transparent 100%
                )`,
              }}
            />

            {/* 코너 마커들 */}
            <div className="absolute top-4 left-4 w-8 h-8 animate-corner-pulse">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-primary" />
              <div className="absolute top-0 left-0 w-0.5 h-full bg-primary" />
            </div>
            <div className="absolute top-4 right-4 w-8 h-8 animate-corner-pulse">
              <div className="absolute top-0 right-0 w-full h-0.5 bg-primary" />
              <div className="absolute top-0 right-0 w-0.5 h-full bg-primary" />
            </div>
            <div className="absolute bottom-4 left-4 w-8 h-8 animate-corner-pulse">
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />
              <div className="absolute bottom-0 left-0 w-0.5 h-full bg-primary" />
            </div>
            <div className="absolute bottom-4 right-4 w-8 h-8 animate-corner-pulse">
              <div className="absolute bottom-0 right-0 w-full h-0.5 bg-primary" />
              <div className="absolute bottom-0 right-0 w-0.5 h-full bg-primary" />
            </div>

            {/* 중앙 텍스트 - 네온 글로우 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="animate-hologram-glow">
                <p className="text-primary font-mono text-sm tracking-wider">
                  ANALYZING...
                </p>
              </div>
              <p className="text-primary/60 font-mono text-xs mt-2">
                Detecting items
              </p>
            </div>
          </div>
        )}

        {/* Reveal 스캔 라인 */}
        {isRevealing && (
          <div
            className="absolute left-0 right-0 h-0.5 animate-reveal-scan z-20"
            style={{
              background: `linear-gradient(90deg,
                transparent 0%,
                oklch(0.9519 0.1739 115.8446 / 0.5) 20%,
                oklch(0.9519 0.1739 115.8446) 50%,
                oklch(0.9519 0.1739 115.8446 / 0.5) 80%,
                transparent 100%
              )`,
              boxShadow: "0 0 15px oklch(0.9519 0.1739 115.8446)",
            }}
          />
        )}

        {/* 스팟 마커들 */}
        {!isDetecting &&
          spots.map((spot) => (
            <Hotspot
              key={spot.id}
              variant="numbered"
              number={spot.index}
              position={{ x: spot.center.x * 100, y: spot.center.y * 100 }}
              selected={selectedSpotId === spot.id}
              revealing={isRevealing}
              revealDelay={spot.center.y * 1000}
              glow={true}
              label={`Spot ${spot.index}${spot.label ? `: ${spot.label}` : ""}`}
              onClick={() => onSpotClick?.(spot)}
            />
          ))}

        {/* 안내 메시지 */}
        {!isDetecting && (
          <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
            <p className="text-xs text-white text-center">
              {spots.length > 0
                ? `${spots.length}개의 스팟이 추가됨`
                : "이미지를 탭하여 아이템 위치를 표시하세요"}
            </p>
          </div>
        )}
      </div>
    );
  }
);

DetectionView.displayName = "DetectionView";
