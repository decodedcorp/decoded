"use client";

import { memo, forwardRef, useState, useCallback } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, ExternalLink, Check } from "lucide-react";
import {
  type DetectedSpot,
  type SpotSolutionData,
} from "@/lib/stores/requestStore";
import { SolutionInputForm } from "./SolutionInputForm";

interface DetectedItemCardProps {
  spot: DetectedSpot;
  isSelected: boolean;
  onClick: () => void;
  onSaveSolution?: (spotId: string, solution: SpotSolutionData) => void;
}

/**
 * DetectedItemCard - 컴팩트한 아이템 카드 (썸네일 포함)
 * 선택 시 확장되어 solution 입력 폼 표시
 */
export const DetectedItemCard = memo(
  forwardRef<HTMLDivElement, DetectedItemCardProps>(
    ({ spot, isSelected, onClick, onSaveSolution }, ref) => {
      const [isEditing, setIsEditing] = useState(false);
      const hasSolution = !!spot.solution;

      const handleCardClick = useCallback(() => {
        onClick();
        // 선택 시 자동으로 편집 모드 열지 않음 (토글 버튼으로만)
      }, [onClick]);

      const handleToggleEdit = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing((prev) => !prev);
      }, []);

      const handleSaveSolution = useCallback(
        (spotId: string, solution: SpotSolutionData) => {
          onSaveSolution?.(spotId, solution);
          setIsEditing(false);
        },
        [onSaveSolution]
      );

      const handleCancelEdit = useCallback(() => {
        setIsEditing(false);
      }, []);

      return (
        <div
          ref={ref}
          className={`
            w-full text-left p-3 rounded-lg
            bg-card border transition-all duration-200
            ${
              isSelected
                ? "border-primary shadow-[0_0_8px_oklch(0.9519_0.1739_115.8446_/_0.5)]"
                : "border-border hover:border-primary/50"
            }
          `}
        >
          {/* Main Card Content - Clickable */}
          <button
            type="button"
            onClick={handleCardClick}
            className="w-full text-left"
            aria-pressed={isSelected}
          >
            <div className="flex gap-3 items-center">
              {/* Thumbnail */}
              <div className="relative flex-shrink-0 w-14 h-14 rounded-md overflow-hidden bg-muted">
                {spot.imageUrl ? (
                  <Image
                    src={spot.imageUrl}
                    alt={spot.title}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    No img
                  </div>
                )}
                {/* Index badge overlay */}
                <div
                  className={`
                    absolute top-0.5 left-0.5 w-5 h-5
                    flex items-center justify-center
                    rounded-full text-[10px] font-bold
                    ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-background/80 text-foreground border border-primary"
                    }
                  `}
                >
                  {spot.index}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Label + Brand */}
                <div className="flex items-center gap-1.5 mb-0.5">
                  {spot.label && (
                    <span className="text-[10px] font-medium text-primary">
                      {spot.label}
                    </span>
                  )}
                  {spot.brand && (
                    <span className="text-[10px] text-muted-foreground">
                      {spot.brand}
                    </span>
                  )}
                  {hasSolution && (
                    <span className="flex items-center gap-0.5 text-[10px] text-green-500">
                      <Check className="w-3 h-3" />
                      Solution
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-sm font-medium text-foreground truncate">
                  {spot.title}
                </h3>

                {/* Price or Confidence */}
                {spot.priceRange ? (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {spot.priceRange}
                  </p>
                ) : spot.confidence ? (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Detected: {Math.round(spot.confidence * 100)}%
                  </p>
                ) : null}
              </div>

              {/* Expand/Collapse Indicator */}
              {isSelected && (
                <div className="flex-shrink-0 text-muted-foreground">
                  {isEditing ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              )}
            </div>
          </button>

          {/* Solution Summary (when has solution and not editing) */}
          {isSelected && hasSolution && !isEditing && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {spot.solution!.title}
                  </p>
                  {spot.solution!.priceAmount && (
                    <p className="text-xs text-muted-foreground">
                      {spot.solution!.priceAmount.toLocaleString()}{" "}
                      {spot.solution!.priceCurrency || "KRW"}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 ml-2">
                  <a
                    href={spot.solution!.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={handleToggleEdit}
                    className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground
                               bg-muted rounded transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Solution Button (when selected and no solution) */}
          {isSelected && !hasSolution && !isEditing && (
            <button
              type="button"
              onClick={handleToggleEdit}
              className="mt-3 w-full py-2 text-sm text-primary border border-dashed border-primary/50
                         rounded-lg hover:bg-primary/5 transition-colors"
            >
              + Add product info
            </button>
          )}

          {/* Solution Input Form (when editing) */}
          {isSelected && isEditing && (
            <SolutionInputForm
              spotId={spot.id}
              initialData={spot.solution}
              onSave={handleSaveSolution}
              onCancel={handleCancelEdit}
            />
          )}
        </div>
      );
    }
  )
);

DetectedItemCard.displayName = "DetectedItemCard";
