"use client";

import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  lazy,
  Suspense,
} from "react";
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
const RelatedImages = lazy(() =>
  import("./RelatedImages").then((m) => ({ default: m.RelatedImages }))
);
import { SocialActions } from "@/lib/components/shared/SocialActions";
import { CommentSection } from "@/lib/components/shared/CommentSection";
import { BottomSheet } from "@/lib/design-system/bottom-sheet";
import { AddSolutionSheet } from "./AddSolutionSheet";
import { AISummarySection } from "./AISummarySection";
import { useAllSolutionsForSpots } from "@/lib/hooks/useSolutions";
import { TryGallerySection } from "./TryGallerySection";
import type { VtonPreloadItem } from "@/lib/stores/vtonStore";
import { useCommentCount } from "@/lib/hooks/useComments";
import { usePostLike } from "@/lib/hooks/usePostLike";
import { useSavedPost } from "@/lib/hooks/useSavedPost";
import {
  MagazineEditorialSection,
  MagazineCelebSection,
  MagazineItemsSection,
  MagazineNewsSection,
} from "./magazine";
import { MagazineTitleSection } from "./magazine/MagazineTitleSection";
// MagazineRelatedSection lazy-loaded (only rendered when related editorials exist)
const MagazineRelatedSectionLazy = lazy(() =>
  import("./magazine").then((m) => ({
    default: m.MagazineRelatedSection,
  }))
);
import { EditorialPreviewHeader } from "./EditorialPreviewHeader";
const DecodeShowcase = lazy(
  () => import("@/lib/components/main-renewal/DecodeShowcase")
);
import { toDecodeShowcaseData } from "./adapters/toDecodeShowcaseData";
import { SpotDot } from "./SpotDot";
import { SpotSolutionTabs } from "./SpotSolutionTabs";
import { useAuthStore } from "@/lib/stores/authStore";
import { X } from "lucide-react";
import { useMediaQuery, breakpoints } from "@/lib/hooks/useMediaQuery";

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
  variant?: "full" | "explore-preview";
  /** Pre-computed comment count from PostDetailResponse (avoids separate fetch) */
  commentCount?: number;
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
  variant = "full",
  commentCount: commentCountProp,
}: Props) {
  const isExplorePreview = variant === "explore-preview";
  const hasMagazine = !!magazineLayout;
  const imageUrl = typeof image.image_url === "string" ? image.image_url : null;
  // D-08: Always use brand color — per-post design_spec.accent_color override removed
  const accentColor = "var(--mag-accent)";
  const detailContentRef = useRef<HTMLDivElement>(null);
  const currentUser = useAuthStore((s) => s.user);
  const userProfile = useAuthStore((s) => s.profile);
  const commentViewerName = !currentUser
    ? null
    : userProfile?.display_name?.trim() ||
      userProfile?.username?.trim() ||
      currentUser.name?.trim() ||
      null;
  const commentViewerAvatarUrl = !currentUser
    ? null
    : userProfile?.avatar_url?.trim() || currentUser.avatarUrl || null;
  const [isCommentOverlayOpen, setIsCommentOverlayOpen] = useState(false);
  const isMdUp = useMediaQuery(breakpoints.md);

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

  const openCommentOverlay = useCallback(() => {
    if (isExplorePreview) return;
    setIsCommentOverlayOpen(true);
  }, [isExplorePreview]);

  const closeCommentOverlay = useCallback(() => {
    setIsCommentOverlayOpen(false);
  }, []);

  useEffect(() => {
    if (!isCommentOverlayOpen || isExplorePreview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsCommentOverlayOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isCommentOverlayOpen, isExplorePreview]);

  const imageWithOwner = image as ImageDetailWithPostOwner;
  const likeCount = imageWithOwner.like_count ?? 0;
  const saveCount = imageWithOwner.save_count ?? 0;
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

  const fetchedCommentCount = useCommentCount(image.id);
  // Always use live count from comments query (updates after create/delete)
  // Fall back to prop only when comments haven't loaded yet
  const commentCount =
    fetchedCommentCount > 0 ? fetchedCommentCount : (commentCountProp ?? 0);

  // Build DecodeShowcase data whenever the post has item centers + hero image (all layouts)
  const decodeShowcaseData = useMemo(() => {
    if (!imageUrl) return null;
    const itemsWithCenter = normalizedItems.filter((i) => i.normalizedCenter);
    if (itemsWithCenter.length === 0) return null;
    const post = firstPost as Record<string, unknown> | undefined;
    return toDecodeShowcaseData({
      items: normalizedItems,
      imageUrl,
      artistName:
        imageWithOwner.artist_name ?? imageWithOwner.group_name ?? "DECODED",
      imageWidth: (post?.image_width as number) ?? null,
      imageHeight: (post?.image_height as number) ?? null,
    });
  }, [
    imageUrl,
    normalizedItems,
    firstPost,
    imageWithOwner.artist_name,
    imageWithOwner.group_name,
  ]);

  const showDecodeShowcase =
    !!decodeShowcaseData && !isModal && !isExplorePreview;

  const scrollItemDetailIntoView = useCallback((itemId: string) => {
    const root = detailContentRef.current;
    if (!root || typeof document === "undefined") return;
    const escaped =
      typeof CSS !== "undefined" && typeof CSS.escape === "function"
        ? CSS.escape(itemId)
        : itemId.replace(/"/g, '\\"');
    const el = root.querySelector<HTMLElement>(`[data-item-id="${escaped}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  /** DecodeShowcase taps scroll to item cards below (InteractiveShowcase or MagazineItemsSection) */
  const decodeShowcaseItemNav = showDecodeShowcase
    ? scrollItemDetailIntoView
    : undefined;

  const decodeShowcaseArtist = useMemo(() => {
    if (!showDecodeShowcase) return null;
    const displayName = imageWithOwner.artist_name || imageWithOwner.group_name;
    if (!displayName) return null;
    return {
      displayName,
      profileImageUrl:
        imageWithOwner.artist_profile_image_url ||
        imageWithOwner.group_profile_image_url ||
        null,
    };
  }, [
    showDecodeShowcase,
    imageWithOwner.artist_name,
    imageWithOwner.group_name,
    imageWithOwner.artist_profile_image_url,
    imageWithOwner.group_profile_image_url,
  ]);

  const [showFloatingBar, setShowFloatingBar] = useState(false);

  useEffect(() => {
    if (isModal || isExplorePreview) return;
    const onScroll = () => setShowFloatingBar(window.scrollY > 100);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isModal, isExplorePreview]);

  // D-08: Always set --magazine-accent to brand color (accentColor is always "var(--mag-accent)")
  const magazineCssVars = {
    "--magazine-accent": accentColor,
  } as React.CSSProperties;

  return (
    <div
      ref={detailContentRef}
      className="detail-content relative"
      style={magazineCssVars}
    >
      <>
        {/* Editorial Preview Header — explore modal only */}
        {isExplorePreview && (
          <EditorialPreviewHeader
            title={
              hasMagazine
                ? magazineLayout.title
                : (((firstPost as Record<string, unknown>)?.title as string) ??
                  imageWithOwner.artist_name ??
                  "Untitled")
            }
            subtitle={hasMagazine ? magazineLayout.subtitle : null}
            description={
              hasMagazine
                ? (magazineLayout.editorial.paragraphs?.[0] ?? null)
                : aiSummary
            }
            postId={image.id}
          />
        )}

        {/* Artist/Group profile — explore-preview only */}
        {isExplorePreview &&
          (() => {
            const profileImageUrl =
              imageWithOwner.artist_profile_image_url ||
              imageWithOwner.group_profile_image_url;
            const displayName =
              imageWithOwner.artist_name || imageWithOwner.group_name;
            if (!displayName) return null;
            return (
              <div className="flex flex-col items-center gap-2 px-6 py-5">
                {profileImageUrl ? (
                  <img
                    src={`/api/v1/image-proxy?url=${encodeURIComponent(profileImageUrl)}`}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover border border-white/10"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-base font-bold text-white/50">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                    Artist
                  </p>
                </div>
              </div>
            );
          })()}

        {/* Decorative Vertical Typography - Shown on desktop (Full Page & Modal) */}
        {!isExplorePreview && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden lg:block pointer-events-none select-none">
            <span className="font-serif text-[10px] uppercase tracking-[1em] text-primary/5 writing-mode-vertical-rl rotate-180 opacity-50">
              Decoded Editorial Archive —{" "}
              {new Date(image.created_at).getFullYear()}
            </span>
          </div>
        )}

        {/* DecodeShowcase first on full page (modal/preview unchanged) */}
        {!isExplorePreview && showDecodeShowcase && (
          <Suspense fallback={null}>
            <DecodeShowcase
              data={decodeShowcaseData}
              artist={decodeShowcaseArtist}
              aiSummary={aiSummary}
              isModal={isModal}
              onItemNavigate={decodeShowcaseItemNav}
            />
          </Suspense>
        )}

        {/* Section 1: Editorial title or Hero; artist row immediately after title/hero */}
        {!isExplorePreview && (
          <>
            {hasMagazine ? (
              <MagazineTitleSection
                title={magazineLayout.title}
                subtitle={magazineLayout.subtitle}
                isModal={isModal}
              />
            ) : (
              !hideImage &&
              !showDecodeShowcase && (
                <HeroSection
                  image={image}
                  isModal={isModal}
                  onClick={onHeroClick}
                />
              )
            )}
            {showDecodeShowcase
              ? null
              : (() => {
                  const profileImageUrl =
                    imageWithOwner.artist_profile_image_url ||
                    imageWithOwner.group_profile_image_url;
                  const displayName =
                    imageWithOwner.artist_name || imageWithOwner.group_name;
                  if (!displayName) return null;
                  return (
                    <div className="flex flex-col items-center gap-2 px-6 py-5">
                      {profileImageUrl ? (
                        <img
                          src={`/api/v1/image-proxy?url=${encodeURIComponent(profileImageUrl)}`}
                          alt=""
                          className="h-12 w-12 rounded-full border border-white/10 object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-base font-bold text-white/50">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="text-center">
                        <p className="text-lg font-semibold text-foreground">
                          {displayName}
                        </p>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          Artist
                        </p>
                      </div>
                    </div>
                  );
                })()}
          </>
        )}

        {/* AI Summary — inside DecodeShowcase when pinned decode runs; else below title/hero */}
        {aiSummary && !isExplorePreview && !showDecodeShowcase && (
          <section
            className={`mx-auto px-6 ${isModal ? "max-w-5xl pt-10 pb-8" : hasMagazine ? "max-w-6xl pt-4 pb-8" : "max-w-6xl pt-20 pb-16"}`}
          >
            <div className="w-full">
              <AISummarySection summary={aiSummary} isModal={isModal} />
            </div>
          </section>
        )}

        {/* Interactive item cards (non-magazine); DecodeShowcase rendered above */}
        {!hasMagazine && hasItemsWithCoordinates && (
          <InteractiveShowcase
            image={image}
            items={normalizedItems}
            isModal={isModal}
            compact={isExplorePreview}
            scrollContainerRef={scrollContainerRef}
            activeIndex={activeIndex}
            onActiveIndexChange={onActiveIndexChange}
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

        {hasMagazine && (
          <>
            {/* Magazine: Editorial & Celeb — hidden in explore-preview */}
            {!isExplorePreview && (
              <>
                <MagazineEditorialSection
                  editorial={magazineLayout.editorial}
                  accentColor={accentColor}
                  isModal={isModal}
                />
                <MagazineCelebSection
                  celebs={magazineLayout.celeb_list}
                  accentColor={accentColor}
                  isModal={isModal}
                />
              </>
            )}

            {/* Magazine: Items — always visible (compact in explore-preview) */}
            <MagazineItemsSection
              items={magazineLayout.items}
              relatedItems={magazineLayout.related_items}
              accentColor={accentColor}
              isModal={isModal}
              compact={isExplorePreview}
              scrollContainerRef={scrollContainerRef}
              onActiveIndexChange={onActiveIndexChange}
            />

            {/* Magazine: News References */}
            {!isExplorePreview &&
              magazineLayout.news_references &&
              magazineLayout.news_references.length > 0 && (
                <MagazineNewsSection
                  newsReferences={magazineLayout.news_references}
                  accentColor={accentColor}
                  isModal={isModal}
                />
              )}
          </>
        )}

        {!hasMagazine && (
          <>
            {/* Spot-by-spot Solution Comparison (when 2+ spots) */}
            {spotIds.length >= 2 && (
              <section className="mx-auto max-w-6xl px-4 py-8 md:px-8">
                <h5 className="mb-4 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">
                  Solutions by Spot
                </h5>
                <SpotSolutionTabs
                  spots={normalizedItems
                    .filter((i) => i.spot_id)
                    .map((item, idx) => ({
                      spotId: item.spot_id!,
                      label: item.product_name ?? undefined,
                      index: idx + 1,
                    }))}
                  isPostOwner={false}
                  postId={image.id}
                  onAddSolution={(spotId) => setSpotIdToAddSolution(spotId)}
                />
              </section>
            )}

            {/* Shop Grid (show if any items exist, even without coordinates) */}
            {hasItems && (
              <div>
                {!isExplorePreview &&
                  itemsFromPost &&
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

        {/* Related Posts - 같은 유저가 올린 다른 포스트 (lazy loaded) */}
        {!isExplorePreview &&
          (image.postImages?.[0]?.post as Record<string, unknown>)?.account && (
            <Suspense
              fallback={
                <div className="mx-auto max-w-6xl px-4 py-8">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="aspect-[3/4] animate-pulse rounded-lg bg-muted"
                      />
                    ))}
                  </div>
                </div>
              }
            >
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
            </Suspense>
          )}

        {/* Comments: mobile bottom sheet vs desktop centered modal (single CommentSection) */}
        {!isExplorePreview && isCommentOverlayOpen && !isMdUp && (
          <BottomSheet
            isOpen
            onClose={closeCommentOverlay}
            title={`Comments (${commentCount})`}
            snapPoints={[0.5, 0.75, 0.9]}
            defaultSnapPoint={0.75}
            backdropClassName="z-[60]"
            className="z-[70]"
          >
            <CommentSection
              postId={image.id}
              currentUserId={currentUser?.id}
              hideHeading
              viewerName={commentViewerName}
              viewerAvatarUrl={commentViewerAvatarUrl}
            />
          </BottomSheet>
        )}
        {!isExplorePreview && isCommentOverlayOpen && isMdUp && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="comment-overlay-title"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/60"
              aria-label="Close comments"
              onClick={closeCommentOverlay}
            />
            <div
              className="relative z-[70] flex w-full max-w-lg max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
                <h2
                  id="comment-overlay-title"
                  className="text-lg font-semibold"
                >
                  Comments ({commentCount})
                </h2>
                <button
                  type="button"
                  onClick={closeCommentOverlay}
                  className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
                <CommentSection
                  postId={image.id}
                  currentUserId={currentUser?.id}
                  hideHeading
                  viewerName={commentViewerName}
                  viewerAvatarUrl={commentViewerAvatarUrl}
                />
              </div>
            </div>
          </div>
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

        {/* Floating social action bar — full page only */}
        {!isModal && !isExplorePreview && (
          <div
            className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-background/80 px-2 py-1.5 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-[var(--mag-accent)]/60 hover:shadow-[0_0_16px_rgba(234,253,103,0.15)] ${
              showFloatingBar
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0 pointer-events-none"
            }`}
          >
            <SocialActions
              initialLiked={initialLiked}
              initialSaved={initialSaved}
              likeCount={likeCount}
              saveCount={saveCount}
              commentCount={commentCount}
              showComment
              variant="default"
              onLike={handleLike}
              onSave={handleSave}
              onShare={handleShare}
              onComment={openCommentOverlay}
            />
          </div>
        )}

        {/* Static social actions — modal / explore-preview */}
        {(isModal || isExplorePreview) && (
          <div className="px-6 py-6 md:px-10 border-t border-border">
            <SocialActions
              initialLiked={initialLiked}
              initialSaved={initialSaved}
              likeCount={likeCount}
              saveCount={saveCount}
              commentCount={commentCount}
              showComment
              variant="default"
              onLike={handleLike}
              onSave={handleSave}
              onShare={handleShare}
              onComment={openCommentOverlay}
            />
          </div>
        )}

        {/* Magazine: Related Editorials - 맨 마지막 (lazy loaded) */}
        {hasMagazine && relatedEditorials && relatedEditorials.length > 0 && (
          <Suspense fallback={null}>
            <MagazineRelatedSectionLazy relatedEditorials={relatedEditorials} />
          </Suspense>
        )}

        {/* Fallback: Show basic info if no items */}
        {!isExplorePreview && !hasItems && !hasMagazine && (
          <div className="mx-auto max-w-4xl px-4 py-16 md:px-8">
            <div className="mb-8">
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
