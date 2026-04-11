"use client";

import { motion, type Variants } from "motion/react";
import {
  HeroSection,
  HeroCarousel,
  ArtistSpotlightSection,
  WeeklyBestSection,
} from "./";
import { StyleListSection } from "./StyleListSection";
import { DecodedSolutionsSection } from "./DecodedSolutionsSection";
import { CuriousItemsSection } from "./CuriousItemsSection";
import type { HeroData } from "./HeroSection";
import type { StyleCardData } from "./StyleCard";
import type { WeeklyBestStyle } from "@/lib/utils/main-page-mapper";
import type { HeroSlide } from "@/lib/data/heroSlides";

interface HomeAnimatedContentProps {
  heroData?: HeroData;
  heroSlides?: HeroSlide[];
  artistSpotlightStyles: StyleCardData[];
  artistSpotlightSubtitle?: string;
  /** 솔루션 있는 포스트만 – Decoded Community Solutions 섹션용 */
  solvedPostStyles: StyleCardData[];
  /** 아직 솔루션 없는 포스트 – 궁금해요 섹션용 */
  curiousItemsStyles: StyleCardData[];
  whatsNewStyles: StyleCardData[];
  weeklyBestStyles: WeeklyBestStyle[];
}

export function HomeAnimatedContent({
  heroData,
  heroSlides = [],
  artistSpotlightStyles,
  artistSpotlightSubtitle,
  solvedPostStyles,
  curiousItemsStyles,
  whatsNewStyles,
  weeklyBestStyles,
}: HomeAnimatedContentProps) {
  // Convert empty arrays to undefined so component default sample data kicks in
  const orUndef = <T,>(arr: T[]): T[] | undefined =>
    arr.length > 0 ? arr : undefined;

  const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <>
      {heroSlides.length > 0 ? (
        <HeroCarousel slides={heroSlides} />
      ) : (
        <HeroSection data={heroData} />
      )}

      <main>
        {/* Artist Spotlight */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
        >
          <ArtistSpotlightSection
            data={artistSpotlightStyles}
            subtitle={artistSpotlightSubtitle}
          />
        </motion.div>

        {/* Decoded – 솔루션 있는 포스트만, 그리드 + 브랜딩 + 솔루션 강조 */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
        >
          <DecodedSolutionsSection styles={solvedPostStyles} />
        </motion.div>

        {/* 궁금해요 – 아직 솔루션 없는 포스트, 디코딩 요청 유도 */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
        >
          <CuriousItemsSection styles={curiousItemsStyles} />
        </motion.div>

        {/* What's New – 솔루션 있는 포스트, 호버 시 스팟 표시 */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
        >
          <StyleListSection
            title="What's New"
            subtitle="Recently uploaded looks."
            styles={whatsNewStyles}
            linkHref="/feed"
          />
        </motion.div>

        {/* Weekly Best */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
        >
          <WeeklyBestSection styles={orUndef(weeklyBestStyles)} />
        </motion.div>
      </main>
    </>
  );
}
