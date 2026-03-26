"use client";

import { useState } from "react";
import { Plus, ChevronRight, ChevronDown, ExternalLink } from "lucide-react";
import type { SolutionItem } from "./TopSolutionCard";
import type { UseAdoptDropdownReturn } from "@/lib/hooks/useAdoptDropdown";

/** Parse solution metadata (Record) into key-value pairs */
function parseSolutionMetadata(
  meta: unknown
): { key: string; value: string }[] {
  if (!meta || typeof meta !== "object") return [];
  return Object.entries(meta as Record<string, unknown>)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => ({
      key: k,
      value: Array.isArray(v) ? v.join(", ") : String(v),
    }))
    .slice(0, 6);
}

interface OtherSolutionsListProps {
  otherSolutions: SolutionItem[];
  spotId: string | null | undefined;
  onAddSolution?: (spotId: string) => void;
  isPostOwner: boolean;
  adoptTargetId: UseAdoptDropdownReturn["adoptTargetId"];
  setAdoptTargetId: UseAdoptDropdownReturn["setAdoptTargetId"];
  handleAdopt: UseAdoptDropdownReturn["handleAdopt"];
  handleUnadopt: UseAdoptDropdownReturn["handleUnadopt"];
  adoptDropdownRef: UseAdoptDropdownReturn["adoptDropdownRef"];
  adoptMutation: UseAdoptDropdownReturn["adoptMutation"];
  unadoptMutation: UseAdoptDropdownReturn["unadoptMutation"];
}

/**
 * Expandable list of "other" solutions (solutions beyond the top one).
 */
export function OtherSolutionsList({
  otherSolutions,
  spotId,
  onAddSolution,
  isPostOwner,
  adoptTargetId,
  setAdoptTargetId,
  handleAdopt,
  handleUnadopt,
  adoptDropdownRef,
  adoptMutation,
  unadoptMutation,
}: OtherSolutionsListProps) {
  const [othersExpanded, setOthersExpanded] = useState(false);

  // When there are no other solutions, only show the "add more" button if applicable
  if (otherSolutions.length === 0) {
    if (onAddSolution && !isPostOwner && spotId) {
      return (
        <button
          type="button"
          onClick={() => onAddSolution(spotId)}
          className="inline-flex items-center justify-center gap-2 self-start rounded-md border border-dashed border-primary/30 px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground"
        >
          <Plus className="w-3 h-3" />
          솔루션 더 추가하기
        </button>
      );
    }
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOthersExpanded((e) => !e)}
        className="flex items-center gap-2 self-start rounded border border-border/40 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/30 hover:text-foreground"
      >
        <ChevronRight
          className={`w-3 h-3 transition-transform ${othersExpanded ? "rotate-90" : ""}`}
        />
        다른 {otherSolutions.length}개 솔루션{" "}
        {othersExpanded ? "접기" : "보기"}
      </button>
      {othersExpanded && (
        <div className="flex flex-col gap-2 pl-1">
          {otherSolutions.map((sol) => {
            const linkUrl = sol.affiliate_url ?? sol.original_url ?? null;
            const isAdopting = adoptTargetId === sol.id;
            return (
              <div
                key={sol.id}
                className="flex items-start gap-2.5 rounded border border-border/30 p-2.5"
              >
                {sol.thumbnail_url &&
                  (linkUrl ? (
                    <a
                      href={linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 w-10 h-10 rounded overflow-hidden bg-muted/30 border border-border/20"
                    >
                      <img
                        src={sol.thumbnail_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ) : (
                    <div className="shrink-0 w-10 h-10 rounded overflow-hidden bg-muted/30 border border-border/20">
                      <img
                        src={sol.thumbnail_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                <div className="flex flex-wrap items-center justify-between gap-2 min-w-0 flex-1">
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <span className="font-serif text-xs text-foreground/85 truncate">
                      {sol.title}
                    </span>
                    {linkUrl && (
                      <a
                        href={linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/link flex items-center gap-1 text-[11px] text-muted-foreground/70 hover:text-primary"
                      >
                        {(() => {
                          try {
                            return new URL(linkUrl).hostname.replace("www.", "");
                          } catch {
                            return "링크";
                          }
                        })()}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                    {parseSolutionMetadata(sol.metadata ?? undefined).length >
                      0 && (
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[10px] text-muted-foreground/60">
                        {parseSolutionMetadata(sol.metadata ?? undefined).map(
                          ({ key, value }) => (
                            <span key={key}>
                              <span className="text-muted-foreground/40">
                                {key}:
                              </span>{" "}
                              {value}
                            </span>
                          )
                        )}
                      </div>
                    )}
                  </div>
                  {isPostOwner &&
                    (sol.is_adopted ? (
                      <>
                        <span className="text-[10px] text-primary shrink-0">
                          채택됨
                          {sol.match_type === "perfect" && " · Perfect"}
                          {sol.match_type === "close" && " · Close"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUnadopt(sol.id, spotId!)}
                          disabled={unadoptMutation.isPending}
                          className="shrink-0 rounded border px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted/50 disabled:opacity-50"
                        >
                          취소
                        </button>
                      </>
                    ) : (
                      <div
                        ref={isAdopting ? adoptDropdownRef : undefined}
                        className="relative shrink-0"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setAdoptTargetId((p) =>
                              p === sol.id ? null : sol.id
                            )
                          }
                          disabled={
                            adoptMutation.isPending || unadoptMutation.isPending
                          }
                          className="inline-flex items-center gap-0.5 rounded border border-primary/40 px-2 py-0.5 text-[10px] font-medium hover:bg-primary/10 disabled:opacity-50"
                        >
                          채택
                          <ChevronDown
                            className={`w-2.5 h-2.5 ${isAdopting ? "rotate-180" : ""}`}
                          />
                        </button>
                        {isAdopting && (
                          <div className="absolute right-0 top-full z-10 mt-1 flex flex-col rounded border border-border/60 bg-background py-0.5 shadow-lg">
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                handleAdopt(
                                  {
                                    solutionId: sol.id,
                                    spotId: spotId!,
                                    matchType: "perfect",
                                  },
                                  () => setAdoptTargetId(null)
                                );
                              }}
                              className="px-2.5 py-1 text-left text-[10px] hover:bg-muted/50 w-full"
                            >
                              Perfect
                            </button>
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                handleAdopt(
                                  {
                                    solutionId: sol.id,
                                    spotId: spotId!,
                                    matchType: "close",
                                  },
                                  () => setAdoptTargetId(null)
                                );
                              }}
                              className="px-2.5 py-1 text-left text-[10px] hover:bg-muted/50 w-full"
                            >
                              Close
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {onAddSolution && !isPostOwner && (
        <button
          type="button"
          onClick={() => onAddSolution(spotId!)}
          className="inline-flex items-center justify-center gap-2 self-start rounded-md border border-dashed border-primary/30 px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground"
        >
          <Plus className="w-3 h-3" />
          솔루션 더 추가하기
        </button>
      )}
    </>
  );
}
