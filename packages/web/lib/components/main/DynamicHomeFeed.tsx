"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

import { DecodedPickSection } from "./DecodedPickSection";
import { TodayDecodedSection } from "./TodayDecodedSection";
import { ArtistSpotlightSection } from "./ArtistSpotlightSection";
import { WhatsNewSection } from "./WhatsNewSection";
import { DiscoverItemsSection } from "./DiscoverSection";
import { BestItemSection, WeeklyBestSection } from "./BestSection";
import { TrendingNowSection } from "./TrendingSection";
import { ForYouSection, type ForYouSectionProps } from "./ForYouSection";
import { TopItemsSection } from "./TopItemsSection";
import { EditorialSection } from "./EditorialSection";
import { TrendingListSection } from "./TrendingListSection";
import DomeGallery from "@/lib/components/dome/DomeGallery";
import type { ImageItem } from "@/lib/utils/fallbackImages";
import { FuzzyText } from "@/lib/components/ui/FuzzyText";

import type { StyleCardData } from "./StyleCard";
import type { ItemCardData } from "./ItemCard";
import type { WeeklyBestStyle } from "./BestSection";

export type HomeSectionType =
  | "hero"
  | "decoded-pick"
  | "for-you"
  | "today-decoded"
  | "artist-spotlight"
  | "masonry-grid"
  | "whats-new"
  | "discover-items"
  | "best-items"
  | "weekly-best"
  | "trending-now"
  | "personalize-banner"
  | "top-items"
  | "editorial-feature"
  | "trending-list"
  | "dome-gallery";

type LayoutMode = "editorial" | "dense" | "magazine";

interface TrendingKeyword {
  id: string;
  label: string;
  href: string;
  image?: string;
}

/** All section data needed to render any section */
export interface HomeSectionData {
  decodedPickStyle?: StyleCardData;
  editorialStyle?: StyleCardData;
  forYou: ForYouSectionProps;
  spotlightStyles?: StyleCardData[];
  whatsNewStyles?: StyleCardData[];
  bestItemCards?: ItemCardData[];
  weeklyBestStyles?: WeeklyBestStyle[];
  trendingKeywords?: TrendingKeyword[];
  domeImages?: ImageItem[];
}

export interface DynamicHomeFeedProps {
  /** Ordered list of section types to render (hero/masonry-grid/personalize-banner handled by parent) */
  sections: HomeSectionType[];
  layoutMode: LayoutMode;
  data: HomeSectionData;
}

/**
 * Layout mode → spacing between sections.
 * All modes use space-y-0 because sections manage their own internal padding.
 * editorial: extra padding injected via CSS overrides on section children
 * dense: reduced padding injected via CSS overrides
 * magazine: default section padding (no overrides)
 */
const layoutSpacing: Record<LayoutMode, string> = {
  editorial: "space-y-0",
  dense: "space-y-0",
  magazine: "space-y-0",
};

/** Pre-defined className overrides per layout mode — avoids inline conditional evaluation on each render */
const LAYOUT_CLASSES: Record<LayoutMode, string> = {
  dense: "[&>section]:!py-12 [&>section]:md:!py-16",
  editorial: "[&>section]:!py-28 [&>section]:md:!py-44",
  magazine: "",
};

/** Wraps each section with scroll-triggered entrance animation and layout-mode padding overrides */
function SectionWrapper({
  layoutMode,
  children,
  className,
}: {
  layoutMode: LayoutMode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={cn(LAYOUT_CLASSES[layoutMode], className)}
    >
      {children}
    </motion.div>
  );
}

export function DynamicHomeFeed({
  sections,
  layoutMode,
  data,
}: DynamicHomeFeedProps) {
  // hero, masonry-grid, and personalize-banner are rendered by the server component parent
  const clientSections = sections.filter(
    (s) => s !== "hero" && s !== "masonry-grid" && s !== "personalize-banner"
  );

  function renderSection(type: HomeSectionType) {
    switch (type) {
      case "decoded-pick":
        return (
          <SectionWrapper key={type} layoutMode={layoutMode}>
            <DecodedPickSection styleData={data.decodedPickStyle} />
          </SectionWrapper>
        );

      case "for-you":
        return (
          <SectionWrapper key={type} layoutMode={layoutMode}>
            <ForYouSection {...data.forYou} />
          </SectionWrapper>
        );

      case "today-decoded":
        return (
          <SectionWrapper key={type} layoutMode={layoutMode}>
            <TodayDecodedSection />
          </SectionWrapper>
        );

      case "artist-spotlight":
        return (
          <SectionWrapper key={type} layoutMode={layoutMode}>
            <ArtistSpotlightSection
              data={
                data.spotlightStyles && data.spotlightStyles.length > 0
                  ? data.spotlightStyles
                  : undefined
              }
            />
          </SectionWrapper>
        );

      case "whats-new":
        return (
          <SectionWrapper key={type} layoutMode={layoutMode}>
            <WhatsNewSection
              styles={
                data.whatsNewStyles && data.whatsNewStyles.length > 0
                  ? data.whatsNewStyles
                  : undefined
              }
            />
          </SectionWrapper>
        );

      case "discover-items":
        return (
          <SectionWrapper key={type} layoutMode={layoutMode}>
            <DiscoverItemsSection />
          </SectionWrapper>
        );

      case "best-items":
        return (
          <SectionWrapper key={type} layoutMode={layoutMode}>
            <BestItemSection
              items={
                data.bestItemCards && data.bestItemCards.length > 0
                  ? data.bestItemCards
                  : undefined
              }
            />
          </SectionWrapper>
        );

      case "weekly-best":
        return (
          <SectionWrapper key={type} layoutMode={layoutMode}>
            <WeeklyBestSection
              styles={
                data.weeklyBestStyles && data.weeklyBestStyles.length > 0
                  ? data.weeklyBestStyles
                  : undefined
              }
            />
          </SectionWrapper>
        );

      case "trending-now":
        return (
          <SectionWrapper key={type} layoutMode={layoutMode}>
            <TrendingNowSection
              keywords={
                data.trendingKeywords && data.trendingKeywords.length > 0
                  ? data.trendingKeywords
                  : undefined
              }
            />
          </SectionWrapper>
        );

      case "top-items":
        return (
          <SectionWrapper key={type} layoutMode={layoutMode}>
            <TopItemsSection
              items={
                data.bestItemCards && data.bestItemCards.length > 0
                  ? data.bestItemCards
                  : undefined
              }
            />
          </SectionWrapper>
        );

      case "editorial-feature": {
        // Check if trending-list follows immediately — render side by side
        const idx = clientSections.indexOf(type);
        const nextIsTrending =
          idx >= 0 && clientSections[idx + 1] === "trending-list";

        const hasKeywords =
          data.trendingKeywords && data.trendingKeywords.length > 0;

        if (nextIsTrending && hasKeywords) {
          return (
            <SectionWrapper
              key="editorial-trending-combo"
              layoutMode={layoutMode}
              className="!py-10 lg:!py-14 px-6 md:px-12 lg:px-20"
            >
              <div className="mx-auto max-w-[1400px] grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-6">
                <EditorialSection style={data.editorialStyle} embedded />
                <TrendingListSection
                  keywords={data.trendingKeywords}
                  embedded
                />
              </div>
            </SectionWrapper>
          );
        }

        return (
          <SectionWrapper key={type} layoutMode={layoutMode}>
            <EditorialSection style={data.editorialStyle} />
          </SectionWrapper>
        );
      }

      case "trending-list":
        // Skip if already rendered in the editorial-feature combo above
        {
          const idx = clientSections.indexOf("trending-list");
          const prevIsEditorial =
            idx > 0 && clientSections[idx - 1] === "editorial-feature";
          if (prevIsEditorial) return null;
        }
        return (
          <SectionWrapper key={type} layoutMode={layoutMode}>
            <TrendingListSection
              keywords={
                data.trendingKeywords && data.trendingKeywords.length > 0
                  ? data.trendingKeywords
                  : undefined
              }
            />
          </SectionWrapper>
        );

      case "dome-gallery":
        return <DomeGallerySection key={type} images={data.domeImages} />;

      default:
        return null;
    }
  }

  return (
    <div className={cn(layoutSpacing[layoutMode])}>
      {clientSections.map(renderSection)}
    </div>
  );
}

interface DomeGallerySectionProps {
  images?: ImageItem[];
}

/** Full-bleed dome gallery with centered CTA */
export function DomeGallerySection({ images }: DomeGallerySectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-screen left-1/2 -translate-x-1/2 h-[80vh] md:h-[90vh] overflow-hidden"
    >
      <DomeGallery
        autoRotate
        grayscale
        overlayBlurColor="#050505"
        fit={1.2}
        padFactor={0.01}
        fitBasis="width"
        minRadius={900}
        vignetteStart={88}
        segments={28}
        heightGuardMultiplier={2.5}
        images={images}
      />

      {/* Dark scrim with accent color tint */}
      <div
        className="absolute inset-0 z-[6] pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(255,103,103,0.06) 0%, rgba(0,0,0,0.5) 50%, rgba(234,253,103,0.08) 100%)",
        }}
      />

      {/* Center CTA */}
      <div className="absolute inset-0 z-[7] flex flex-col items-center justify-center pointer-events-none">
        {/* Accent line */}
        <div className="flex items-center gap-3 mb-5">
          <span className="w-8 h-[1.5px] bg-[#ff6767]" />
          <p className="text-[10px] md:text-xs uppercase tracking-[0.35em] text-[#ff6767]/80 font-sans">
            Virtual Try-On
          </p>
          <span className="w-8 h-[1.5px] bg-[#ff6767]" />
        </div>
        <div className="flex flex-col items-center mb-3 pointer-events-auto">
          <FuzzyText
            fontSize="clamp(2.5rem, 8vw, 5rem)"
            fontWeight={900}
            color="#ffffff"
            baseIntensity={0.15}
            hoverIntensity={0.4}
            fuzzRange={8}
            enableHover
          >
            Find Your
          </FuzzyText>
          <FuzzyText
            fontSize="clamp(2.5rem, 8vw, 5rem)"
            fontWeight={900}
            gradient={["#ffffff", "#eafd67", "#ffffff"]}
            baseIntensity={0.15}
            hoverIntensity={0.4}
            fuzzRange={8}
            enableHover
          >
            Perfect Fit
          </FuzzyText>
        </div>
        <p
          className="text-sm md:text-base text-white/60 text-center max-w-sm mb-10 font-light"
          style={{ textShadow: "0 1px 20px rgba(0,0,0,0.7)" }}
        >
          셀럽의 스타일을 AI로 직접 입어보세요
        </p>
        <span
          className="pointer-events-auto relative px-10 py-3.5 text-sm font-semibold tracking-[0.15em] uppercase
            text-white rounded-full
            bg-white/20 border border-white/40 backdrop-blur-sm
            cursor-not-allowed
            shadow-[0_0_20px_rgba(255,255,255,0.15)]"
        >
          Coming Soon
        </span>
      </div>
    </motion.section>
  );
}
