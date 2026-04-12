"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useAllSolutionsForSpots } from "@/lib/hooks/useSolutions";
import { TopSolutionCard, type SolutionItem } from "./TopSolutionCard";
import { OtherSolutionsList } from "./OtherSolutionsList";
import { useAdoptDropdown } from "@/lib/hooks/useAdoptDropdown";
import { useAffiliateClick } from "@/lib/hooks/useAffiliateClick";
import { Plus } from "lucide-react";

interface SpotInfo {
  spotId: string;
  label?: string;
  index: number;
}

interface SpotSolutionTabsProps {
  spots: SpotInfo[];
  isPostOwner: boolean;
  postId?: string | null;
  onAddSolution?: (spotId: string) => void;
  onSpotSelect?: (spotId: string) => void;
  className?: string;
}

/**
 * SpotSolutionTabs - 스팟별 솔루션 비교 탭 UI
 *
 * 스팟이 2개 이상일 때 탭으로 전환하며 각 스팟의 솔루션을 비교합니다.
 */
export function SpotSolutionTabs({
  spots,
  isPostOwner,
  postId,
  onAddSolution,
  onSpotSelect,
  className,
}: SpotSolutionTabsProps) {
  const [activeSpotIndex, setActiveSpotIndex] = useState(0);
  const spotIds = useMemo(() => spots.map((s) => s.spotId), [spots]);
  const { spotSolutionsMap, isLoading } = useAllSolutionsForSpots(spotIds);
  const trackAffiliateClick = useAffiliateClick();

  const activeSpot = spots[activeSpotIndex];
  const activeSpotId = activeSpot?.spotId;
  const adoptDropdown = useAdoptDropdown(activeSpotId);

  const activeSolutions = useMemo(
    () => (activeSpotId ? spotSolutionsMap.get(activeSpotId) : undefined) ?? [],
    [activeSpotId, spotSolutionsMap]
  ) as SolutionItem[];

  const topSolution = activeSolutions[0];
  const otherSolutions = activeSolutions.slice(1);

  const handleTabClick = (index: number) => {
    setActiveSpotIndex(index);
    onSpotSelect?.(spots[index].spotId);
  };

  if (spots.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Spot Tabs */}
      {spots.length > 1 && (
        <div
          role="tablist"
          className="flex items-center gap-2 overflow-x-auto pb-1"
        >
          {spots.map((spot, i) => {
            const solutions = spotSolutionsMap.get(spot.spotId);
            const count = solutions?.length ?? 0;
            const isActive = activeSpotIndex === i;

            return (
              <button
                key={spot.spotId}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleTabClick(i)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-[10px] font-bold">
                  {spot.index}
                </span>
                {spot.label || `Spot ${spot.index}`}
                {count > 0 && (
                  <span className="text-[10px] opacity-70">({count})</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Active Spot Solutions */}
      <div role="tabpanel" className="min-h-[80px]">
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4">Loading...</p>
        ) : activeSolutions.length === 0 ? (
          <div className="flex flex-col gap-3 py-3">
            <p className="text-sm text-muted-foreground">
              No solutions yet.
            </p>
            {onAddSolution && activeSpotId && (
              <button
                type="button"
                onClick={() => onAddSolution(activeSpotId)}
                className="inline-flex items-center justify-center gap-2 self-start rounded-md border border-primary/40 bg-primary/5 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-primary/10 hover:border-primary/60"
              >
                <Plus className="w-4 h-4" />
                Add a solution
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {topSolution && (
              <TopSolutionCard
                topSolution={topSolution}
                isPostOwner={isPostOwner}
                spotId={activeSpotId}
                onLinkClick={(url) =>
                  trackAffiliateClick({
                    solutionId: topSolution.id,
                    spotId: activeSpotId ?? undefined,
                    postId: postId ?? undefined,
                    url,
                  })
                }
                {...adoptDropdown}
              />
            )}
            <OtherSolutionsList
              otherSolutions={otherSolutions}
              spotId={activeSpotId}
              onAddSolution={onAddSolution}
              isPostOwner={isPostOwner}
              onLinkClick={(solutionId, url) =>
                trackAffiliateClick({
                  solutionId,
                  spotId: activeSpotId ?? undefined,
                  postId: postId ?? undefined,
                  url,
                })
              }
              {...adoptDropdown}
            />
          </div>
        )}
      </div>
    </div>
  );
}
