"use client";

import { useRef, useMemo } from "react";
import Markdown from "react-markdown";
import { ItemImage } from "@/lib/components/shared/ItemImage";
import { ExternalLink, Plus } from "lucide-react";
import { extractKoreanPart, filterKoreanTags } from "@/lib/utils/locale";
import type { UiItem } from "./types";
import { useAuthStore } from "@/lib/stores/authStore";
import { useSolutions } from "@/lib/hooks/useSolutions";
import { useAdoptDropdown } from "@/lib/hooks/useAdoptDropdown";
import { useItemCardGSAP } from "@/lib/hooks/useItemCardGSAP";
import { TopSolutionCard } from "./TopSolutionCard";
import { OtherSolutionsList } from "./OtherSolutionsList";

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
  // De-duplicate solutions by id to prevent API duplicates
  const solutions = useMemo(() => {
    const seen = new Set<string>();
    return rawSolutions.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [rawSolutions]);

  const adoptDropdown = useAdoptDropdown(spotId);
  useItemCardGSAP(cardRef, contentRef, isModal);

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
  const displayDescription = item.description || null;
  const displayMetadata = filterKoreanTags(item.metadata);

  const parsedMetadata = displayMetadata.map((tag) => {
    const match = tag.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      return { key: match[1], value: match[2] };
    }
    return { key: null, value: tag };
  });

  const topSolution = solutions[0];
  const otherSolutions = solutions.slice(1);

  return (
    <div
      ref={cardRef}
      data-testid="item-detail-card"
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
        {/* Item Image */}
        <div className="group/image">
          <ItemImage
            src={item.imageUrl || ""}
            alt={item.product_name || `Item ${formattedIndex}`}
            size="detail"
            className="rounded-xl transition-transform duration-700 ease-out group-hover/image:scale-105 group-hover/image:-translate-y-2"
            imgClassName="drop-shadow-2xl"
          />
        </div>

        {/* Text Content */}
        <div className="flex flex-col relative z-30 px-2">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="flex-1">
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
              <h2 className="font-serif text-xl md:text-2xl lg:text-3xl font-bold leading-tight tracking-tight text-foreground/90 max-w-[90%]">
                {displayName || `Item ${formattedIndex}`}
              </h2>
            </div>
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

          {displayDescription && (
            <div className="prose prose-sm dark:prose-invert max-w-none font-serif text-muted-foreground/80 font-light [&>p]:leading-relaxed [&>p]:mb-3 [&>p]:text-base">
              <Markdown>{displayDescription}</Markdown>
            </div>
          )}

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

          {/* Shop the Look Section */}
          <div className="mt-6 pt-6 border-t border-border/20">
            <h5 className="mb-4 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">
              Shop the Look
            </h5>
            <div className="flex flex-col gap-4">
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
                  {topSolution && (
                    <TopSolutionCard
                      topSolution={topSolution}
                      isPostOwner={isPostOwner}
                      spotId={spotId}
                      {...adoptDropdown}
                    />
                  )}
                  <OtherSolutionsList
                    otherSolutions={otherSolutions}
                    spotId={spotId}
                    onAddSolution={onAddSolution}
                    isPostOwner={isPostOwner}
                    {...adoptDropdown}
                  />
                </div>
              )}

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
