"use client";

import { memo, useRef } from "react";
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
  onSpotMove?: (spotId: string, x: number, y: number) => void; // normalized 0-1
  onImageClick?: (x: number, y: number) => void; // 이미지 클릭 시 normalized 좌표 전달
  layout?: "default" | "fullscreen";
}

// Pixel distance above which a pointer interaction is treated as a drag,
// not a click. Below this threshold we keep the original click semantics.
const DRAG_THRESHOLD_PX = 4;

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
    onSpotMove,
    onImageClick,
    layout = "default",
  }: DetectionViewProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const dragStateRef = useRef<{
      spotId: string | null;
      startX: number;
      startY: number;
      moved: boolean;
    }>({ spotId: null, startX: 0, startY: 0, moved: false });
    // After a drag, suppress the synthetic click that would otherwise
    // fire on pointer-up (from both the Hotspot button and the image
    // overlay beneath it if the pointer ended outside the button).
    const suppressNextClickRef = useRef(false);

    const normalizedFromEvent = (
      clientX: number,
      clientY: number
    ): { x: number; y: number } | null => {
      if (!containerRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      return {
        x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
        y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
      };
    };

    const handleSpotPointerDown = (
      e: React.PointerEvent<HTMLButtonElement>,
      spot: DetectedSpot
    ) => {
      if (!onSpotMove) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragStateRef.current = {
        spotId: spot.id,
        startX: e.clientX,
        startY: e.clientY,
        moved: false,
      };
    };

    const handleSpotPointerMove = (
      e: React.PointerEvent<HTMLButtonElement>
    ) => {
      const drag = dragStateRef.current;
      if (!drag.spotId || !onSpotMove) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      drag.moved = true;
      const coords = normalizedFromEvent(e.clientX, e.clientY);
      if (!coords) return;
      onSpotMove(drag.spotId, coords.x, coords.y);
    };

    const handleSpotPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
      const drag = dragStateRef.current;
      if (!drag.spotId) return;
      if (drag.moved) {
        // Finalize position (last move already committed coords) and
        // suppress the synthetic click that follows pointer-up.
        const coords = normalizedFromEvent(e.clientX, e.clientY);
        if (coords && onSpotMove) onSpotMove(drag.spotId, coords.x, coords.y);
        suppressNextClickRef.current = true;
      }
      dragStateRef.current = {
        spotId: null,
        startX: 0,
        startY: 0,
        moved: false,
      };
    };

    // 이미지 클릭 핸들러 - normalized 좌표로 변환
    const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onImageClick || isDetecting) return;
      if (suppressNextClickRef.current) {
        // Ate the click that terminated a drag — do not create a new spot.
        suppressNextClickRef.current = false;
        return;
      }

      const coords = normalizedFromEvent(e.clientX, e.clientY);
      if (!coords) return;
      onImageClick(coords.x, coords.y);
    };
    const containerClasses =
      layout === "fullscreen"
        ? "relative w-full h-full overflow-hidden bg-foreground/5"
        : "relative w-full aspect-[3/4] max-w-md mx-auto rounded-xl overflow-hidden bg-foreground/5";

    return (
      <div ref={containerRef} className={containerClasses}>
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
              style={onSpotMove ? { touchAction: "none" } : undefined}
              onPointerDown={(e) => handleSpotPointerDown(e, spot)}
              onPointerMove={handleSpotPointerMove}
              onPointerUp={handleSpotPointerUp}
              onPointerCancel={handleSpotPointerUp}
              onClick={(e) => {
                if (suppressNextClickRef.current) {
                  e.stopPropagation();
                  suppressNextClickRef.current = false;
                  return;
                }
                onSpotClick?.(spot);
              }}
            />
          ))}

        {/* 스팟 배치 가이드 오버레이 */}
        {!isDetecting && spots.length === 0 && (
          <div className="absolute inset-0 z-[2] flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-3 animate-pulse">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/60 flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-white/80"
                >
                  <path
                    d="M12 5v14M5 12h14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <p className="text-sm text-white/90 font-medium drop-shadow-md">
                Tap where an item appears
              </p>
              <p className="text-xs text-white/60 drop-shadow-md">
                Mark at least one spot
              </p>
            </div>
          </div>
        )}

        {/* 안내 메시지 */}
        {!isDetecting && (
          <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
            <p className="text-xs text-white text-center">
              {spots.length > 0
                ? `${spots.length} spot${spots.length === 1 ? "" : "s"} added · add more or continue`
                : "Tap the image to mark item locations"}
            </p>
          </div>
        )}
      </div>
    );
  }
);

DetectionView.displayName = "DetectionView";
