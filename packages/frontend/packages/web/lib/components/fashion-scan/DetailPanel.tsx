"use client";

import { useRef, useLayoutEffect } from "react";
import type { ScanItem, ScanData } from "./types";

interface DetailPanelProps {
  data: ScanData;
  onCardRefsChange?: (map: Partial<Record<string, HTMLDivElement>>) => void;
}

const ZOOM = 4; // 4배 확대 (400%)

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getBackgroundPositionFromBox(
  box: { top: number; left: number; width: number; height: number },
  zoom: number = ZOOM
): string {
  // 박스의 중심점 계산 (0~100 범위)
  const centerX = box.left + box.width / 2; // 0 ~ 100
  const centerY = box.top + box.height / 2; // 0 ~ 100

  // 확대된 이미지 위에서 centerX, centerY가 썸네일 중앙에 오도록 역산
  // 수식: pos = (center * zoom - 50) / (zoom - 1)
  // zoom=3일 때: centerX=50 → posX=50, 가장자리로 갈수록 0 아래 또는 100 위로 나가므로 클램프 필요
  const rawPosX = (centerX * zoom - 50) / (zoom - 1);
  const rawPosY = (centerY * zoom - 50) / (zoom - 1);

  // 경계값 클램프 (0~100 범위로 제한)
  const posX = clamp(rawPosX, 0, 100);
  const posY = clamp(rawPosY, 0, 100);

  return `${posX}% ${posY}%`;
}

export default function DetailPanel({
  data,
  onCardRefsChange,
}: DetailPanelProps) {
  const cardRefs = useRef<Partial<Record<string, HTMLDivElement>>>({});

  // 카드 ref를 부모로 올려주기
  useLayoutEffect(() => {
    if (!onCardRefsChange) return;
    onCardRefsChange(cardRefs.current);
  }, [onCardRefsChange, data.items]);

  return (
    <div className="flex flex-col gap-4 w-full">
      {data.items.map((item) => (
        <div
          key={item.id}
          ref={(el) => {
            if (el) {
              cardRefs.current[item.id] = el;
            } else {
              delete cardRefs.current[item.id];
            }
            // ref 변경 시 부모에 알림
            if (onCardRefsChange) {
              onCardRefsChange(cardRefs.current);
            }
          }}
          className="bg-zinc-900/90 backdrop-blur-sm border border-lime-400/30 rounded-lg p-4 hover:border-lime-400/60 hover:bg-zinc-900 transition-all duration-200"
        >
          <div className="flex items-start gap-4">
            {/* 줌 썸네일 */}
            <div
              className="w-20 h-20 rounded-md bg-zinc-800 border border-lime-400/20 flex-shrink-0 overflow-hidden relative"
              style={{
                backgroundImage: `url(${data.photoUrl})`,
                backgroundSize: `${ZOOM * 100}%`,
                backgroundPosition: getBackgroundPositionFromBox(
                  item.box,
                  ZOOM
                ),
                backgroundRepeat: "no-repeat",
              }}
              aria-hidden="true"
            >
              {/* 디버깅용: 썸네일 중심선 (개발 중에만 표시) */}
              {process.env.NODE_ENV === "development" && (
                <>
                  <div className="absolute inset-y-[calc(50%-1px)] left-0 right-0 h-0.5 bg-pink-500/30 pointer-events-none" />
                  <div className="absolute inset-x-[calc(50%-1px)] top-0 bottom-0 w-0.5 bg-pink-500/30 pointer-events-none" />
                </>
              )}
            </div>

            {/* 텍스트 정보 */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lime-400 font-mono text-sm font-semibold mb-1 uppercase tracking-wide">
                {item.name}
              </h3>
              <p className="text-zinc-400 text-xs font-mono">
                Confidence:{" "}
                <span className="text-lime-400/80">{item.confidence}%</span>
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
