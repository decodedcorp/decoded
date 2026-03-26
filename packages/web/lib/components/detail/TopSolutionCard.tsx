"use client";

import { Check, ChevronDown, ExternalLink } from "lucide-react";
import type { UseAdoptDropdownReturn } from "@/lib/hooks/useAdoptDropdown";

/** Minimal shape of what ItemDetailCard uses from SolutionListItem */
export interface SolutionItem {
  id: string;
  title: string;
  thumbnail_url?: string | null;
  original_url?: string | null;
  affiliate_url?: string | null;
  is_adopted?: boolean | null;
  match_type?: string | null;
  metadata?: unknown;
}

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

interface TopSolutionCardProps {
  topSolution: SolutionItem;
  isPostOwner: boolean;
  spotId: string | null | undefined;
  adoptTargetId: UseAdoptDropdownReturn["adoptTargetId"];
  setAdoptTargetId: UseAdoptDropdownReturn["setAdoptTargetId"];
  handleAdopt: UseAdoptDropdownReturn["handleAdopt"];
  handleUnadopt: UseAdoptDropdownReturn["handleUnadopt"];
  adoptDropdownRef: UseAdoptDropdownReturn["adoptDropdownRef"];
  adoptMutation: UseAdoptDropdownReturn["adoptMutation"];
  unadoptMutation: UseAdoptDropdownReturn["unadoptMutation"];
}

/**
 * Displays the top solution card with adopt/unadopt actions.
 */
export function TopSolutionCard({
  topSolution,
  isPostOwner,
  spotId,
  adoptTargetId,
  setAdoptTargetId,
  handleAdopt,
  handleUnadopt,
  adoptDropdownRef,
  adoptMutation,
  unadoptMutation,
}: TopSolutionCardProps) {
  const linkUrl =
    topSolution.affiliate_url ?? topSolution.original_url ?? null;

  return (
    <div
      key={topSolution.id}
      className="rounded-lg border border-primary/20 bg-primary/5 p-3"
    >
      <div className="flex items-start gap-3">
        {topSolution.thumbnail_url &&
          (linkUrl ? (
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 w-14 h-14 rounded overflow-hidden bg-muted/30 border border-border/20"
            >
              <img
                src={topSolution.thumbnail_url}
                alt=""
                className="w-full h-full object-cover"
              />
            </a>
          ) : (
            <div className="shrink-0 w-14 h-14 rounded overflow-hidden bg-muted/30 border border-border/20">
              <img
                src={topSolution.thumbnail_url}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        <div className="flex flex-wrap items-center justify-between gap-2 min-w-0 flex-1">
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-serif text-sm font-medium text-foreground/95 truncate">
                {topSolution.title}
              </span>
              {topSolution.is_adopted && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/25 px-2 py-0.5 text-[10px] font-medium text-primary shrink-0">
                  <Check className="w-2.5 h-2.5" />
                  채택됨
                  {topSolution.match_type === "perfect" && (
                    <span className="text-primary/80">· Perfect Match</span>
                  )}
                  {topSolution.match_type === "close" && (
                    <span className="text-primary/80">· Close Match</span>
                  )}
                </span>
              )}
            </div>
            {linkUrl && (
              <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group/link flex items-center gap-1.5 text-xs text-muted-foreground/80 hover:text-primary"
              >
                {(() => {
                  try {
                    return new URL(linkUrl).hostname.replace("www.", "");
                  } catch {
                    return "링크";
                  }
                })()}
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            )}
            {parseSolutionMetadata(topSolution.metadata ?? undefined).length >
              0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[11px] text-muted-foreground/70">
                {parseSolutionMetadata(topSolution.metadata ?? undefined).map(
                  ({ key, value }) => (
                    <span key={key}>
                      <span className="text-muted-foreground/50">{key}:</span>{" "}
                      {value}
                    </span>
                  )
                )}
              </div>
            )}
          </div>
          {isPostOwner && (
            <div className="flex items-center gap-2 shrink-0">
              {topSolution.is_adopted ? (
                <button
                  type="button"
                  onClick={() =>
                    handleUnadopt(topSolution.id, spotId!)
                  }
                  disabled={unadoptMutation.isPending}
                  className="rounded border border-border/60 px-2 py-1 text-xs text-muted-foreground hover:bg-muted/50 disabled:opacity-50"
                >
                  채택 취소
                </button>
              ) : (
                <div
                  ref={
                    adoptTargetId === topSolution.id
                      ? adoptDropdownRef
                      : undefined
                  }
                  className="relative"
                >
                  <button
                    data-testid="item-adopt-button"
                    type="button"
                    onClick={() =>
                      setAdoptTargetId((p) =>
                        p === topSolution.id ? null : topSolution.id
                      )
                    }
                    disabled={
                      adoptMutation.isPending || unadoptMutation.isPending
                    }
                    className="inline-flex items-center gap-1 rounded border border-primary/50 bg-primary/10 px-2.5 py-1 text-xs font-medium hover:bg-primary/20 disabled:opacity-50"
                  >
                    채택하기
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${
                        adoptTargetId === topSolution.id ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {adoptTargetId === topSolution.id && (
                    <div className="absolute right-0 top-full z-10 mt-1 flex flex-col rounded-md border border-border/60 bg-background py-1 shadow-lg">
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleAdopt(
                            {
                              solutionId: topSolution.id,
                              spotId: spotId!,
                              matchType: "perfect",
                            },
                            () => setAdoptTargetId(null)
                          );
                        }}
                        className="px-3 py-1.5 text-left text-xs hover:bg-muted/50 w-full"
                      >
                        Perfect Match
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleAdopt(
                            {
                              solutionId: topSolution.id,
                              spotId: spotId!,
                              matchType: "close",
                            },
                            () => setAdoptTargetId(null)
                          );
                        }}
                        className="px-3 py-1.5 text-left text-xs hover:bg-muted/50 w-full"
                      >
                        Close Match
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
