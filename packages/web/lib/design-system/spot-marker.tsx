"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

// 인덱스별 악센트 (에메랄드, 블루, 앰버, 로즈, 바이올렛, 틸)
const SPOT_ACCENTS = [
  {
    base: "oklch(0.75 0.18 145)",
    dim: "oklch(0.75 0.18 145 / 0.25)",
    glow: "oklch(0.75 0.18 145 / 0.5)",
  },
  {
    base: "oklch(0.72 0.16 250)",
    dim: "oklch(0.72 0.16 250 / 0.25)",
    glow: "oklch(0.72 0.16 250 / 0.5)",
  },
  {
    base: "oklch(0.72 0.18 25)",
    dim: "oklch(0.72 0.18 25 / 0.25)",
    glow: "oklch(0.72 0.18 25 / 0.5)",
  },
  {
    base: "oklch(0.72 0.16 330)",
    dim: "oklch(0.72 0.16 330 / 0.25)",
    glow: "oklch(0.72 0.16 330 / 0.5)",
  },
  {
    base: "oklch(0.68 0.2 280)",
    dim: "oklch(0.68 0.2 280 / 0.25)",
    glow: "oklch(0.68 0.2 280 / 0.5)",
  },
  {
    base: "oklch(0.72 0.14 180)",
    dim: "oklch(0.72 0.14 180 / 0.25)",
    glow: "oklch(0.72 0.14 180 / 0.5)",
  },
];

function getAccent(index: number) {
  return SPOT_ACCENTS[(index - 1) % SPOT_ACCENTS.length];
}

/** 좌표 포맷: 0–1 정규화 또는 퍼센트 문자열 */
export type SpotPosition =
  | { x: number; y: number } // 0-1
  | { position_left: string; position_top: string }; // "45.5" or "45.5%"

function parsePosition(pos: SpotPosition): { left: string; top: string } {
  if ("x" in pos) {
    const x = Math.max(0, Math.min(1, pos.x)) * 100;
    const y = Math.max(0, Math.min(1, pos.y)) * 100;
    return { left: `${x}%`, top: `${y}%` };
  }
  const left = pos.position_left.replace("%", "");
  const top = pos.position_top.replace("%", "");
  return { left: `${parseFloat(left) || 0}%`, top: `${parseFloat(top) || 0}%` };
}

export type SpotMarkerSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<SpotMarkerSize, { wrapper: string; text: string }> =
  {
    sm: { wrapper: "w-2.5 h-2.5", text: "text-[6px]" },
    md: { wrapper: "w-6 h-6", text: "text-[10px]" },
    lg: { wrapper: "w-8 h-8", text: "text-xs" },
  };

export interface SpotMarkerProps {
  /** 좌표 (0–1 정규화 또는 position_left/position_top 문자열) */
  position: SpotPosition;
  /** 표시 순번 (1-based), 악센트 색상에 사용 */
  index: number;
  /** 선택 여부 (글로우 애니메이션) */
  isSelected?: boolean;
  /** 클릭 핸들러 (Link 내부 사용 시 e.preventDefault() 호출 가능) */
  onClick?: (e?: React.MouseEvent) => void;
  /** Reveal 애니메이션 사용 (DetectionView용) */
  isRevealing?: boolean;
  /** Reveal 애니메이션 딜레이 (ms) */
  revealDelay?: number;
  /** 마커 크기 */
  size?: SpotMarkerSize;
  /** 내부 숫자 표시 여부 */
  showIndex?: boolean;
  /** aria-label */
  label?: string;
  /** 추가 className */
  className?: string;
}

/**
 * SpotMarker - 디코디드 플랫폼 공통 스팟 마커
 *
 * - 인덱스별 악센트 컬러
 * - 선택 시 글로우 애니메이션
 * - DetectionView, DecodedSolutionsSection, ImageDetailContent 등에서 통일 사용
 */
export const SpotMarker = memo(
  ({
    position,
    index,
    isSelected = false,
    onClick,
    isRevealing = false,
    revealDelay = 0,
    size = "sm",
    showIndex = true,
    label,
    className,
  }: SpotMarkerProps) => {
    const { left, top } = parsePosition(position);
    const { base: accent, dim: accentDim, glow: accentGlow } = getAccent(index);
    const { wrapper: sizeClass, text: textClass } = SIZE_CLASSES[size];

    const Component = onClick ? "button" : "div";

    const handleClick = onClick
      ? (e: React.MouseEvent) => onClick(e)
      : undefined;

    return (
      <Component
        type={onClick ? "button" : undefined}
        onClick={handleClick}
        className={cn(
          "absolute z-10 -translate-x-1/2 -translate-y-1/2",
          "flex items-center justify-center rounded-full font-bold",
          sizeClass,
          textClass,
          isRevealing ? "" : "transition-all duration-200 ease-out",
          isRevealing ? "animate-spot-reveal" : "",
          isSelected ? "animate-spot-glow" : "",
          isSelected
            ? "bg-primary text-primary-foreground scale-110"
            : "hover:scale-105",
          onClick && "cursor-pointer",
          className
        )}
        style={
          {
            left,
            top,
            animationDelay: isRevealing ? `${revealDelay}ms` : undefined,
            opacity: isRevealing ? 0 : 1,
            "--spot-ring": accentGlow,
            "--spot-glow": accentGlow,
            background: isSelected
              ? undefined
              : `linear-gradient(135deg, ${accentDim}, oklch(0.5 0.1 145 / 0.08))`,
            color: isSelected ? "oklch(1 0 0)" : accent,
            border: isSelected ? "none" : `2px solid ${accent}`,
            boxShadow: isSelected
              ? `0 0 0 2px ${accentGlow}, 0 0 12px ${accentGlow}`
              : `0 0 0 1px ${accentGlow}, 0 2px 8px oklch(0 0 0 / 0.25)`,
          } as React.CSSProperties
        }
        aria-label={label || `Spot ${index}${label ? `: ${label}` : ""}`}
      >
        {showIndex && index}
      </Component>
    );
  }
);

SpotMarker.displayName = "SpotMarker";
