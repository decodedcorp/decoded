"use client";

import { RefObject, useCallback, useMemo, useRef, useState } from "react";
import type { ImageDetail } from "@/lib/supabase/queries/images";
import type { ImageDetailWithPostOwner } from "@/lib/api/adapters/postDetailToImageDetail";
import type {
  PostMagazineLayout,
  RelatedEditorialItem,
} from "@/lib/api/mutation-types";
import type { Json } from "@/lib/supabase/types";
import { normalizeItem, solutionToShopItem } from "./types";
import type { UiItem } from "./types";
import { HeroSection } from "./HeroSection";
import { InteractiveShowcase } from "./InteractiveShowcase";
import { ShopGrid } from "./ShopGrid";
import { RelatedImages } from "./RelatedImages";
import { SocialActions } from "@/lib/components/shared/SocialActions";
import { ImageCommentSection } from "./ImageCommentSection";
import { AddSolutionSheet } from "./AddSolutionSheet";
import { AISummarySection } from "./AISummarySection";
import { useAllSolutionsForSpots } from "@/lib/hooks/useSolutions";
import { TryGallerySection } from "./TryGallerySection";
import type { VtonPreloadItem } from "@/lib/stores/vtonStore";
import { useCommentCount } from "@/lib/hooks/useComments";
import { usePostLike } from "@/lib/hooks/usePostLike";
import { useSavedPost } from "@/lib/hooks/useSavedPost";
import Image from "next/image";
import {
  MagazineEditorialSection,
  MagazineCelebSection,
  MagazineItemsSection,
  MagazineRelatedSection,
} from "./magazine";
import { MagazineTitleSection } from "./magazine/MagazineTitleSection";
import { SpotDot } from "./SpotDot";

type Props = {
  image: ImageDetail & { ai_summary?: string | null };
  magazineLayout?: PostMagazineLayout | null;
  relatedEditorials?: RelatedEditorialItem[];
  isModal?: boolean;
  scrollContainerRef?: RefObject<HTMLElement>;
  activeIndex?: number | null;
  onActiveIndexChange?: (index: number | null) => void;
  hideImage?: boolean;
  onHeroClick?: () => void;
};

/**
 * Shared content component for image detail view
 * Used by both modal and full page versions
 *
 * Sections:
 * 1. Hero Section - Full-screen image with dramatic typography
 * 2. Interactive Showcase - Sticky layout with item highlights (if items exist)
 * 3. Shop Grid - Grid of items (if items exist)
 */
export function ImageDetailContent({
  image,
  magazineLayout,
  relatedEditorials,
  isModal = false,
  scrollContainerRef,
  activeIndex,
  onActiveIndexChange,
  hideImage = false,
  onHeroClick,
}: Props) {
  const hasMagazine = !!magazineLayout;
  const imageUrl = typeof image.image_url === "string" ? image.image_url : null;
  // D-08: Always use brand color — per-post design_spec.accent_color override removed
  const accentColor = "var(--mag-accent)";
  const commentSectionRef = useRef<HTMLDivElement>(null);

  const handleShare = useCallback(async () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/posts/${image.id}`
        : "";
    if (navigator.share) {
      try {
        await navigator.share({ title: "Post", url });
        return;
      } catch (err) {
        if ((err as Error).name !== "AbortError") console.error(err);
      }
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [image.id]);

  const scrollToComments = useCallback(() => {
    commentSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const imageWithOwner = image as ImageDetailWithPostOwner;
  const likeCount = imageWithOwner.like_count ?? 0;
  const initialLiked = imageWithOwner.user_has_liked ?? false;
  const initialSaved = imageWithOwner.user_has_saved ?? false;

  const { like, unlike } = usePostLike(image.id);
  const { save, unsave } = useSavedPost(image.id);

  const handleLike = useCallback(
    async (nextLiked: boolean) => {
      try {
        if (nextLiked) {
          await like();
        } else {
          await unlike();
        }
      } catch (err) {
        console.error("Like error:", err);
      }
    },
    [like, unlike]
  );

  const handleSave = useCallback(
    async (nextSaved: boolean) => {
      try {
        if (nextSaved) {
          await save();
        } else {
          await unsave();
        }
      } catch (err) {
        console.error("Save error:", err);
      }
    },
    [save, unsave]
  );

  // Items are now pre-fetched via post.item_ids (if post_image exists)
  // Fallback to item.image_id if no post_image found
  const items = image.items || [];

  // Check if items were fetched via post (postImages exist)
  const itemsFromPost = image.postImages && image.postImages.length > 0;

  const firstPost = image.postImages?.[0]?.post || image.posts?.[0];
  const aiSummary = image.ai_summary ?? null;

  // Normalize items with coordinates
  // Use item_locations from the first post_image if available to override item centers
  const firstPostImage = image.postImages?.[0];
  const itemLocations = firstPostImage?.item_locations;

  // Convert item_locations to a map for easy lookup if it's an array
  const itemLocationsMap = useMemo(() => {
    const map: Record<
      string,
      { bbox?: number[] | null; center?: Json | null; score?: number | null }
    > = {};
    if (Array.isArray(itemLocations)) {
      itemLocations.forEach((loc: Record<string, unknown>) => {
        if (loc && loc.item_id) {
          map[String(loc.item_id)] = {
            bbox: loc.bbox as number[] | null,
            center: (loc.center as Json | null) || (loc as unknown as Json),
            score: loc.score as number | null,
          };
        }
      });
    } else if (itemLocations && typeof itemLocations === "object") {
      Object.assign(map, itemLocations);
    }
    return map;
  }, [itemLocations]);

  const normalizedItems = useMemo(() => {
    return items.map((item) => {
      const overrideLocation = itemLocationsMap[item.id.toString()];
      return normalizeItem(item, undefined, overrideLocation);
    });
  }, [items, itemLocationsMap]);

  const spotIds = useMemo(
    () =>
      normalizedItems.map((i) => i.spot_id).filter((id): id is string => !!id),
    [normalizedItems]
  );
  const { isLoading: solutionsLoading, allSolutionsWithSpot } =
    useAllSolutionsForSpots(spotIds);

  const shopItems: UiItem[] = useMemo(() => {
    if (spotIds.length === 0) return normalizedItems;
    const spotToBaseItem = new Map(
      normalizedItems.filter((i) => i.spot_id).map((i) => [i.spot_id!, i])
    );
    const spotsWithSolutions = new Set(
      allSolutionsWithSpot.map(({ spotId }) => spotId)
    );
    const result: UiItem[] = [];
    const seenSolutionIds = new Set<string>();
    allSolutionsWithSpot.forEach(({ spotId, solution }) => {
      if (seenSolutionIds.has(solution.id)) return;
      seenSolutionIds.add(solution.id);
      const base = spotToBaseItem.get(spotId);
      if (base) result.push(solutionToShopItem(solution, base));
    });
    spotIds.forEach((spotId) => {
      if (!spotsWithSolutions.has(spotId)) {
        const base = spotToBaseItem.get(spotId);
        if (base) result.push(base);
      }
    });
    return result.sort((a, b) => {
      const aSpotted = a.normalizedCenter ? 1 : 0;
      const bSpotted = b.normalizedCenter ? 1 : 0;
      return bSpotted - aSpotted;
    });
  }, [normalizedItems, spotIds, allSolutionsWithSpot]);

  // Check if we have items (with or without coordinates)
  // Items without coordinates can still be displayed in ShopGrid
  const hasItems = normalizedItems.length > 0;
  const hasItemsWithCoordinates = normalizedItems.some(
    (item) => item.normalizedBox !== null
  );

  const [spotIdToAddSolution, setSpotIdToAddSolution] = useState<string | null>(
    null
  );

  const commentCount = useCommentCount(image.id);

  // D-08: Always set --magazine-accent to brand color (accentColor is always "var(--mag-accent)")
  const magazineCssVars = { "--magazine-accent": accentColor } as React.CSSProperties;
  // Note: PostBadge intentionally not rendered (D-06 — clean image-centric UX)

  return (
    <div className="detail-content relative" style={magazineCssVars}>
      <>
        {/* Decorative Vertical Typography - Shown on desktop (Full Page & Modal) */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden lg:block pointer-events-none select-none">
          <span className="font-serif text-[10px] uppercase tracking-[1em] text-primary/5 writing-mode-vertical-rl rotate-180 opacity-50">
            Decoded Editorial Archive —{" "}
            {new Date(image.created_at).getFullYear()}
          </span>
        </div>

        {/* Section 1: Magazine Title (text header) or Hero Image */}
        {hasMagazine ? (
          <MagazineTitleSection
            title={magazineLayout.title}
            subtitle={magazineLayout.subtitle}
            isModal={isModal}
          />
        ) : (
          !hideImage && (
            <HeroSection
              image={image}
              isModal={isModal}
              onClick={onHeroClick}
            />
          )
        )}

        {/* AI Summary Section — only rendered when summary exists */}
        {aiSummary && (
          <section
            className={`mx-auto px-6 ${isModal ? "max-w-5xl pt-10 pb-8" : hasMagazine ? "max-w-6xl pt-4 pb-8" : "max-w-6xl pt-20 pb-16"}`}
          >
            <div className="w-full">
              <AISummarySection summary={aiSummary} isModal={isModal} />
            </div>
          </section>
        )}

        {/* Section 2: Interactive Showcase (non-magazine) or static post image with spot dots (magazine) */}
        {/* In modal mode, the floating left panel already shows this image — skip duplicate */}
        {Boolean(hasMagazine && imageUrl && !isModal) && (
          <section className="mx-auto max-w-sm px-4 py-8 md:px-8 md:py-12">
            <div className="relative overflow-hidden rounded-xl">
              <Image
                src={imageUrl!}
                alt="Post image"
                width={384}
                height={0}
                className="h-auto w-full"
                sizes="(max-width: 768px) 80vw, 384px"
                priority
              />
              {/* Spot overlay dots */}
              {normalizedItems.map((item) => {
                if (!item.normalizedCenter) return null;
                const meta = item.metadata as unknown as
                  | Record<string, unknown>
                  | undefined;
                return (
                  <SpotDot
                    key={item.id}
                    mode="percent"
                    x={item.normalizedCenter.x}
                    y={item.normalizedCenter.y}
                    label={item.product_name ?? ""}
                    brand={meta?.brand as string | undefined}
                    category={meta?.sub_category as string | undefined}
                    accentColor={accentColor}
                  />
                );
              })}
            </div>
          </section>
        )}
        {!hasMagazine && hasItemsWithCoordinates && (
          <InteractiveShowcase
            image={image}
            items={normalizedItems}
            isModal={isModal}
            scrollContainerRef={scrollContainerRef}
            activeIndex={activeIndex}
            onActiveIndexChange={onActiveIndexChange}
            renderImage={!hideImage}
            onAddSolution={(spotId) => setSpotIdToAddSolution(spotId)}
            postOwnerId={
              (image as ImageDetailWithPostOwner).post_owner_id ?? null
            }
          />
        )}

        {/* Add Solution Sheet - for items without product info */}
        <AddSolutionSheet
          spotId={spotIdToAddSolution ?? ""}
          postId={image.id}
          isOpen={!!spotIdToAddSolution}
          onClose={() => setSpotIdToAddSolution(null)}
        />

        {hasMagazine ? (
          <>
            {/* Magazine: Editorial Section */}
            <MagazineEditorialSection
              editorial={magazineLayout.editorial}
              accentColor={accentColor}
              isModal={isModal}
            />

            {/* Magazine: Celebrity Style Archive */}
            <MagazineCelebSection
              celebs={magazineLayout.celeb_list}
              accentColor={accentColor}
              isModal={isModal}
            />

            {/* Magazine: The Look + per-item Related Items */}
            <MagazineItemsSection
              items={magazineLayout.items}
              relatedItems={magazineLayout.related_items}
              accentColor={accentColor}
              isModal={isModal}
            />
          </>
        ) : (
          <>
            {/* Shop Grid (show if any items exist, even without coordinates) */}
            {hasItems && (
              <div>
                {itemsFromPost &&
                  image.postImages &&
                  image.postImages.length > 0 && (
                    <div className="mx-auto max-w-6xl px-4 py-3 md:px-8">
                      <p className="text-sm text-muted-foreground">
                        Items from post: @
                        {String(
                          (image.postImages[0].post as Record<string, unknown>)
                            ?.account ?? ""
                        )}
                      </p>
                    </div>
                  )}
                <ShopGrid
                  items={solutionsLoading ? normalizedItems : shopItems}
                  isModal={isModal}
                  postId={image.id}
                  onAddSolutionClick={(spotId) =>
                    setSpotIdToAddSolution(spotId)
                  }
                />
              </div>
            )}
          </>
        )}

        {/* Related Posts - 같은 유저가 올린 다른 포스트 */}
        {(image.postImages?.[0]?.post as Record<string, unknown>)?.account && (
          <RelatedImages
            currentPostId={image.id}
            account={String(
              (image.postImages![0].post as Record<string, unknown>).account
            )}
            userId={
              (image as ImageDetailWithPostOwner).post_owner_id ?? undefined
            }
            isModal={isModal}
          />
        )}

        {/* TODO: Try Gallery Section — temporarily disabled
      <TryGallerySection
        postId={image.id}
        items={normalizedItems
          .filter((item) => item.imageUrl)
          .map(
            (item): VtonPreloadItem => ({
              id: String(item.id),
              title: item.product_name || item.sam_prompt || `Item ${item.id}`,
              thumbnail_url: item.imageUrl!,
              description: item.description,
              keywords: null,
            })
          )}
      />
      */}

        {/* TODO: Social Actions & Comments — temporarily disabled
      <div className="px-6 py-6 md:px-10 border-t border-border">
        <SocialActions
          initialLiked={initialLiked}
          initialSaved={initialSaved}
          likeCount={likeCount}
          commentCount={commentCount}
          showComment
          variant="default"
          onLike={handleLike}
          onSave={handleSave}
          onShare={handleShare}
          onComment={scrollToComments}
        />
      </div>
      <div ref={commentSectionRef}>
        <ImageCommentSection imageId={image.id} />
      </div>
      */}

        {/* Magazine: Related Editorials - 맨 마지막 */}
        {hasMagazine && relatedEditorials && relatedEditorials.length > 0 && (
          <MagazineRelatedSection relatedEditorials={relatedEditorials} />
        )}

        {/* Fallback: Show basic info if no items */}
        {!hasItems && !hasMagazine && (
          <div className="mx-auto max-w-4xl px-4 py-16 md:px-8">
            <div className="mb-8">
              <div className="mb-4 flex flex-wrap gap-2">
                {image.status && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide ${
                      image.status === "pending"
                        ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
                        : image.status === "extracted"
                          ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100"
                          : "bg-slate-100 text-slate-900 dark:bg-slate-800/80 dark:text-slate-100"
                    }`}
                  >
                    {image.status}
                  </span>
                )}
                {image.with_items && (
                  <span className="rounded-full bg-blue-500/80 px-3 py-1 text-xs font-medium uppercase tracking-wide text-blue-100">
                    Items Detected
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Created: {new Date(image.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="mb-12">
              <h1 className="mb-4 text-4xl font-bold md:text-5xl">
                Image Details
              </h1>
              <p className="text-lg text-muted-foreground">
                Image ID:{" "}
                <code className="rounded bg-muted px-2 py-1 text-sm">
                  {image.id}
                </code>
              </p>
            </div>

            <div>
              <h2 className="mb-4 text-2xl font-semibold">Details</h2>
              <p className="text-muted-foreground">
                No items with coordinates found for this image.
              </p>
            </div>
          </div>
        )}
      </>
    </div>
  );
}
