"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Markdown from "react-markdown";
import {
  ExternalLink,
  Plus,
  Check,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { extractKoreanPart, filterKoreanTags } from "@/lib/utils/locale";
import type { UiItem } from "./types";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useAuthStore } from "@/lib/stores/authStore";
import {
  useSolutions,
  useAdoptSolution,
  useUnadoptSolution,
} from "@/lib/hooks/useSolutions";

// Register GSAP ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Props = {
  item: UiItem;
  index: number;
  onActivate: () => void;
  onDeactivate: () => void;
  isModal?: boolean;
  /** 스팟 ID - 솔루션 등록 CTA 표시 시 사용 */
  spotId?: string | null;
  /** 솔루션 등록 버튼 클릭 시 (spotId 전달) */
  onAddSolution?: (spotId: string) => void;
  /** 포스트 작성자 ID - 채택 UI 표시 여부 */
  postOwnerId?: string | null;
};

/**
 * ItemDetailCard - Magazine-style item card
 */
export function ItemDetailCard({
  item,
  index,
  onActivate,
  onDeactivate,
  isModal = false,
  spotId,
  onAddSolution,
  postOwnerId = null,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const formattedIndex = String(index + 1).padStart(2, "0");

  const currentUser = useAuthStore((s) => s.user);
  const isPostOwner =
    !!postOwnerId && !!currentUser && postOwnerId === currentUser.id;

  const { data: rawSolutions = [], isLoading: solutionsLoading } = useSolutions(
    spotId ?? "",
    { enabled: !!spotId }
  );
  // API 중복 방지: solution id 기준으로 유일하게
  const solutions = useMemo(() => {
    const seen = new Set<string>();
    return rawSolutions.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [rawSolutions]);
  const [othersExpanded, setOthersExpanded] = useState(false);
  const adoptMutation = useAdoptSolution();
  const unadoptMutation = useUnadoptSolution();
  const [adoptTargetId, setAdoptTargetId] = useState<string | null>(null);
  const adoptDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!adoptTargetId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        adoptDropdownRef.current &&
        !adoptDropdownRef.current.contains(e.target as Node)
      ) {
        setAdoptTargetId(null);
      }
    };
    // click 사용: mousedown 시 드롭다운 내부 버튼 클릭이 선점되는 이슈 회피
    const tid = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(tid);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [adoptTargetId]);

  useGSAP(
    () => {
      if (!contentRef.current || isModal) return;

      gsap.fromTo(
        contentRef.current,
        {
          y: 60,
          opacity: 0,
          scale: 0.98,
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 85%",
            end: "top 50%",
            toggleActions: "play none none reverse",
          },
        }
      );
    },
    { scope: cardRef }
  );

  // Filter metadata tags to only show Korean ones (or strictly locale-matching)
  // This matches the project's strategy to prioritize Korean content
  // Note: We use raw metadata for specs below, so we don't necessarily need displayTags here
  // unless we want to filter them. For now, let's keep the spec logic simple.

  // Parse multi-language fields
  const displayBrand = item.brand
    ? extractKoreanPart(item.brand) || item.brand
    : null;
  const displayName = item.product_name
    ? extractKoreanPart(item.product_name) || item.product_name
    : null;
  const displayPrice = item.price
    ? extractKoreanPart(item.price, { splitByComma: false }) || item.price
    : null;
  // For description, use raw markdown content without extraction
  const displayDescription = item.description || null;

  // Parse metadata into key-value pairs if possible
  // Filter to only show Korean parts of metadata
  const displayMetadata = filterKoreanTags(item.metadata);

  const parsedMetadata = displayMetadata.map((tag) => {
    // Check for "Key: Value" pattern
    const match = tag.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      return { key: match[1], value: match[2] };
    }
    return { key: null, value: tag };
  });

  /** 솔루션 metadata(Record)를 키-값 리스트로 변환 */
  const parseSolutionMetadata = (
    meta: unknown
  ): { key: string; value: string }[] => {
    if (!meta || typeof meta !== "object") return [];
    return Object.entries(meta)
      .filter(([, v]) => v != null && v !== "")
      .map(([k, v]) => ({
        key: k,
        value: Array.isArray(v) ? v.join(", ") : String(v),
      }))
      .slice(0, 6); // 최대 6개만 표시
  };

  const topSolution = solutions[0];
  const topSolutionCard = topSolution
    ? (() => {
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
                          <span className="text-primary/80">
                            · Perfect Match
                          </span>
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
                  {parseSolutionMetadata(topSolution.metadata ?? undefined)
                    .length > 0 && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[11px] text-muted-foreground/70">
                      {parseSolutionMetadata(
                        topSolution.metadata ?? undefined
                      ).map(({ key, value }) => (
                        <span key={key}>
                          <span className="text-muted-foreground/50">
                            {key}:
                          </span>{" "}
                          {value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {isPostOwner && (
                  <div className="flex items-center gap-2 shrink-0">
                    {topSolution.is_adopted ? (
                      <button
                        type="button"
                        onClick={() =>
                          unadoptMutation.mutate({
                            solutionId: topSolution.id,
                            spotId: spotId!,
                          })
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
                            className={`w-3 h-3 transition-transform ${adoptTargetId === topSolution.id ? "rotate-180" : ""}`}
                          />
                        </button>
                        {adoptTargetId === topSolution.id && (
                          <div className="absolute right-0 top-full z-10 mt-1 flex flex-col rounded-md border border-border/60 bg-background py-1 shadow-lg">
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                adoptMutation.mutate(
                                  {
                                    solutionId: topSolution.id,
                                    spotId: spotId!,
                                    matchType: "perfect",
                                  },
                                  { onSuccess: () => setAdoptTargetId(null) }
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
                                adoptMutation.mutate(
                                  {
                                    solutionId: topSolution.id,
                                    spotId: spotId!,
                                    matchType: "close",
                                  },
                                  { onSuccess: () => setAdoptTargetId(null) }
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
      })()
    : null;

  return (
    <div
      ref={cardRef}
      data-item-index={index}
      className="group relative mb-8 md:mb-12 flex min-h-auto flex-col justify-center py-4 md:py-6 lg:mb-16"
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
    >
      {/* Decorative Background Index */}
      <div
        className={`absolute z-0 select-none font-serif font-black leading-none text-foreground/[0.04] pointer-events-none transition-all duration-700 ${
          isModal
            ? "text-[8rem] md:text-[10rem] lg:text-[12rem] right-0 -top-10"
            : "text-[10rem] md:text-[15rem] lg:text-[20rem] -left-12 -top-10 md:-left-20 lg:-left-32"
        }`}
        aria-hidden="true"
      >
        {formattedIndex}
      </div>

      <div
        ref={contentRef}
        className="relative z-10 flex flex-col gap-4 md:gap-6"
      >
        {/* Item Image - Layered Collage Style */}
        <div className="group/image relative w-full aspect-[4/3] md:aspect-[3/2] rounded-xl overflow-visible">
          {/* Ambient Background Blur Layer */}
          <div className="absolute inset-4 z-0 bg-primary/5 blur-3xl rounded-full" />

          {/* Main Container with subtle border */}
          <div className="absolute inset-0 z-10 bg-muted/5 rounded-xl border border-border/10 backdrop-blur-[2px] overflow-hidden">
            {/* Subtle scanline or texture effect if desired */}
          </div>

          {/* Floating Image Layer - Breaks boundaries slightly */}
          {item.imageUrl && (
            <div className="absolute inset-0 z-20 transition-transform duration-700 ease-out group-hover/image:scale-105 group-hover/image:-translate-y-2">
              <Image
                src={item.imageUrl}
                alt={item.product_name || `Item ${formattedIndex}`}
                fill
                className="object-contain p-3 md:p-5 drop-shadow-2xl filter brightness-[1.02]"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 800px"
              />
            </div>
          )}
        </div>

        {/* Text Content - Overlapping Feel */}
        <div className="flex flex-col relative z-30 px-2">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="flex-1">
              {/* Brand & Index Label */}
              <div className="flex items-center gap-3 mb-2">
                <span className="font-serif italic text-xl md:text-2xl text-primary/40 leading-none shrink-0 border-b border-primary/20 pb-1">
                  {formattedIndex}
                </span>
                {displayBrand && (
                  <p className="font-sans text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground/60">
                    {displayBrand}
                  </p>
                )}
              </div>

              {/* Product Name */}
              <h2 className="font-serif text-xl md:text-2xl lg:text-3xl font-bold leading-tight tracking-tight text-foreground/90 max-w-[90%]">
                {displayName || `Item ${formattedIndex}`}
              </h2>
            </div>

            {/* Price */}
            {displayPrice && (
              <div className="flex flex-col items-start md:items-end">
                <span className="font-sans text-[9px] uppercase tracking-widest text-muted-foreground/40 mb-1">
                  Price Reference
                </span>
                <p className="font-serif text-xl md:text-2xl font-medium text-foreground/80 whitespace-nowrap">
                  {displayPrice.split("|")[0].trim()}
                </p>
              </div>
            )}
          </div>

          <div className="h-px w-full bg-gradient-to-r from-border/60 via-border/20 to-transparent my-4 md:my-6" />

          {/* Description - Editorial Typography */}
          {displayDescription && (
            <div className="prose prose-sm dark:prose-invert max-w-none font-serif text-muted-foreground/80 font-light [&>p]:leading-relaxed [&>p]:mb-3 [&>p]:text-base">
              <Markdown>{displayDescription}</Markdown>
            </div>
          )}

          {/* Details / Metadata - Minimalist Technical Specs */}
          {parsedMetadata.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/20">
              <h5 className="mb-3 font-sans text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-primary/60">
                Technical Details
              </h5>

              <div className="flex flex-wrap gap-x-8 gap-y-4">
                {parsedMetadata.map((meta, i) => (
                  <div key={i} className="flex flex-col min-w-[120px]">
                    {meta.key ? (
                      <>
                        <span className="font-sans text-[9px] uppercase tracking-wider text-muted-foreground/40 mb-1.5">
                          {meta.key}
                        </span>
                        <span className="font-serif text-base text-foreground/80">
                          {meta.value}
                        </span>
                      </>
                    ) : (
                      <span className="font-serif text-base text-foreground/80">
                        {meta.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Source Data Footer - Editorialized Shop Links */}
          <div className="mt-6 pt-6 border-t border-border/20">
            <h5 className="mb-4 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">
              Shop the Look
            </h5>

            <div className="flex flex-col gap-4">
              {/* 솔루션 목록: 스팟이 있으면 API에서 조회, 없으면 item.citations 폴백 */}
              {!spotId ? (
                item.citations && item.citations.length > 0 ? (
                  <div className="flex flex-wrap gap-x-8 gap-y-3">
                    {item.citations.map((citation, i) => {
                      let hostname = citation;
                      try {
                        hostname = new URL(citation).hostname.replace(
                          "www.",
                          ""
                        );
                      } catch {
                        /* keep original */
                      }
                      return (
                        <a
                          key={i}
                          href={citation}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group/link flex items-center gap-2 py-1"
                        >
                          <span className="font-serif italic text-base text-foreground/60 group-hover/link:text-primary transition-all underline decoration-primary/20 underline-offset-4 decoration-1 group-hover/link:decoration-primary/60">
                            {hostname}
                          </span>
                          <ExternalLink className="w-3 h-3 text-muted-foreground/40 group-hover/link:text-primary transition-colors opacity-0 group-hover/link:opacity-100 -translate-x-2 group-hover/link:translate-x-0" />
                        </a>
                      );
                    })}
                  </div>
                ) : (
                  <p className="font-serif text-sm italic text-muted-foreground/40">
                    쇼핑 링크가 없습니다.
                  </p>
                )
              ) : solutionsLoading ? (
                <p className="font-serif text-sm text-muted-foreground/60">
                  로딩 중…
                </p>
              ) : solutions.length === 0 ? (
                spotId && onAddSolution ? (
                  <div className="flex flex-col gap-3 py-3">
                    <p className="font-serif text-sm text-muted-foreground/70">
                      쇼핑 링크가 없습니다. 링크를 등록하면 사용자가 상품을 찾을
                      수 있습니다.
                    </p>
                    <button
                      type="button"
                      onClick={() => onAddSolution(spotId)}
                      className="inline-flex items-center justify-center gap-2 self-start rounded-md border border-primary/40 bg-primary/5 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-primary/10 hover:border-primary/60"
                    >
                      <Plus className="w-4 h-4" />
                      솔루션 등록하기
                    </button>
                  </div>
                ) : (
                  <p className="font-serif text-sm italic text-muted-foreground/40">
                    등록된 솔루션이 없습니다.
                  </p>
                )
              ) : (
                <div className="flex flex-col gap-3">
                  {/* 대표 솔루션 (채택 > 검증 > 투표 순, 백엔드 정렬) - 채택됐든 안 됐든 1순위로 표시 */}
                  {topSolutionCard}
                  {/* 나머지 솔루션 - 접기/펼치기 */}{" "}
                  {solutions.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setOthersExpanded((e) => !e)}
                        className="flex items-center gap-2 self-start rounded border border-border/40 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                      >
                        <ChevronRight
                          className={`w-3 h-3 transition-transform ${othersExpanded ? "rotate-90" : ""}`}
                        />
                        다른 {solutions.length - 1}개 솔루션{" "}
                        {othersExpanded ? "접기" : "보기"}
                      </button>
                      {othersExpanded && (
                        <div className="flex flex-col gap-2 pl-1">
                          {solutions.slice(1).map((sol) => {
                            const linkUrl =
                              sol.affiliate_url ?? sol.original_url ?? null;
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
                                            return new URL(
                                              linkUrl
                                            ).hostname.replace("www.", "");
                                          } catch {
                                            return "링크";
                                          }
                                        })()}
                                        <ExternalLink className="w-2.5 h-2.5" />
                                      </a>
                                    )}
                                    {parseSolutionMetadata(
                                      sol.metadata ?? undefined
                                    ).length > 0 && (
                                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[10px] text-muted-foreground/60">
                                        {parseSolutionMetadata(
                                          sol.metadata ?? undefined
                                        ).map(({ key, value }) => (
                                          <span key={key}>
                                            <span className="text-muted-foreground/40">
                                              {key}:
                                            </span>{" "}
                                            {value}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  {isPostOwner &&
                                    (sol.is_adopted ? (
                                      <>
                                        <span className="text-[10px] text-primary shrink-0">
                                          채택됨
                                          {sol.match_type === "perfect" &&
                                            " · Perfect"}
                                          {sol.match_type === "close" &&
                                            " · Close"}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            unadoptMutation.mutate({
                                              solutionId: sol.id,
                                              spotId: spotId!,
                                            })
                                          }
                                          disabled={unadoptMutation.isPending}
                                          className="shrink-0 rounded border px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted/50 disabled:opacity-50"
                                        >
                                          취소
                                        </button>
                                      </>
                                    ) : (
                                      <div
                                        ref={
                                          isAdopting
                                            ? adoptDropdownRef
                                            : undefined
                                        }
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
                                            adoptMutation.isPending ||
                                            unadoptMutation.isPending
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
                                                adoptMutation.mutate(
                                                  {
                                                    solutionId: sol.id,
                                                    spotId: spotId!,
                                                    matchType: "perfect",
                                                  },
                                                  {
                                                    onSuccess: () =>
                                                      setAdoptTargetId(null),
                                                  }
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
                                                adoptMutation.mutate(
                                                  {
                                                    solutionId: sol.id,
                                                    spotId: spotId!,
                                                    matchType: "close",
                                                  },
                                                  {
                                                    onSuccess: () =>
                                                      setAdoptTargetId(null),
                                                  }
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
                    </>
                  )}
                  {onAddSolution && !isPostOwner && (
                    <button
                      type="button"
                      onClick={() => onAddSolution(spotId)}
                      className="inline-flex items-center justify-center gap-2 self-start rounded-md border border-dashed border-primary/30 px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    >
                      <Plus className="w-3 h-3" />
                      솔루션 더 추가하기
                    </button>
                  )}
                </div>
              )}

              {/* ID Metadata - Subtle footnote */}
              {item.id && (
                <div className="mt-4 flex items-center gap-2 opacity-20 hover:opacity-100 transition-opacity">
                  <span className="font-mono text-[9px] uppercase tracking-tighter text-muted-foreground">
                    Ref. {String(item.id)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
