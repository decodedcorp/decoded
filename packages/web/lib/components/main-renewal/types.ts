/**
 * Main Page Renewal Types
 *
 * Types for all renewed main page sections:
 * Hero, Dynamic Grid, and Personalize Banner.
 */

/** Floating annotation spot on the hero image */
export interface HeroSpotAnnotation {
  id: string;
  x: number; // percentage position on the person image (0-100)
  y: number;
  label: string;
  brand?: string;
  imageUrl?: string; // Item product image URL
  side: "left" | "right";
}

/** Hero section data -- "The Hook" */
export interface MainHeroData {
  celebrityName: string; // e.g. "NEWJEANS" -- displayed huge
  editorialTitle: string; // e.g. "The New Wave of K-Fashion"
  editorialSubtitle?: string;
  heroImageUrl: string;
  ctaLink: string; // e.g. "/magazine"
  ctaLabel?: string; // e.g. "VIEW EDITORIAL"
  spots?: HeroSpotAnnotation[]; // Floating item annotation spots
}

/** Grid item for masonry layout */
export interface GridItemData {
  id: string;
  imageUrl: string;
  title: string;
  subtitle?: string;
  category: string; // e.g. "Street", "Minimal", "Archive"
  link: string;
  spots?: GridItemSpot[]; // Optional item spots on the image
  aspectRatio?: number; // For masonry height variation (0.8-1.5)
}

/** Spot on a grid item image -- brand/price popup on hover */
export interface GridItemSpot {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  label: string; // e.g. "COS Wool Coat"
  brand: string;
  price: string;
  productLink?: string;
}

/** Personalize banner -- soft wall CTA */
export interface PersonalizeBannerData {
  headline: string; // Generic headline (SNS name is now animated separately)
  subtext?: string;
  ctaLabel: string; // "나만의 매거진 만들기"
  images: string[]; // Rotating images for suction animation
  snsNames?: string[]; // Optional SNS names for slot machine animation (defaults to built-in list)
}
