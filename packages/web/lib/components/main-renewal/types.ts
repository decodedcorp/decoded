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
  price?: string;
  productLink?: string;
}

/**
 * Deterministic scatter position for a hero card.
 * All values are CSS strings. Computed by seeded PRNG — identical on SSR and client.
 */
export interface ScatterPosition {
  top: string;
  left: string;
  width: string;
  rotate: number;
  zIndex: number;
  tier: "hero" | "medium" | "small";
  aspectRatio: string;
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

/** Individual floating image in the hero scattered collage */
export interface FloatingHeroImage {
  id: string;
  imageUrl: string;
  label?: string;
  link: string;
  spots?: HeroSpotAnnotation[];
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

// ─── DecodeShowcase: "The Magic" AI detection section ───

/** A single detected item with bounding box coordinates */
export interface DetectedItem {
  id: string;
  label: string;
  brand?: string;
  price?: string;
  imageUrl?: string;
  productLink?: string;
  /** Bounding box as percentage of image (0-100) */
  bbox: { x: number; y: number; width: number; height: number };
}

/** Data for the AI detection showcase section */
export interface DecodeShowcaseData {
  /** The source image to "decode" */
  sourceImageUrl: string;
  /** Artist/celebrity name */
  artistName: string;
  /** Detected items with bounding boxes */
  detectedItems: DetectedItem[];
  /** Optional tagline */
  tagline?: string;
}

// ─── VirtualTryOnTeaser: VTON Before/After section ───

/** A single VTON comparison pair */
export interface VTONComparisonPair {
  id: string;
  /** Original model wearing the item */
  beforeImageUrl: string;
  /** Virtual try-on result */
  afterImageUrl: string;
  /** Item being tried on */
  itemName: string;
  itemBrand?: string;
}

/** Data for the VTON teaser section */
export interface VTONTeaserData {
  pairs: VTONComparisonPair[];
  ctaLabel?: string;
}

// ─── CommunityLeaderboard: Style DNA & Rank section ───

/** A trending user entry */
export interface TrendingUser {
  id: string;
  username: string;
  avatarUrl?: string;
  /** Style DNA tags (e.g. "Minimal", "Streetwear") */
  styleTags: string[];
  /** Badge or rank icon */
  badge?: string;
  /** Activity score or ink count */
  score: number;
}

/** Data for the community leaderboard section */
export interface CommunityLeaderboardData {
  trendingUsers: TrendingUser[];
  /** Weekly highlight hashtags */
  trendingTags?: string[];
}

// ─── EditorialMagazine: Horizontal scroll magazine section ───

/** A magazine-style card in the horizontal feed */
export interface MagazineCard {
  id: string;
  imageUrl: string;
  title: string;
  subtitle?: string;
  artistName: string;
  category?: string;
  link: string;
}

/** Data for the editorial magazine section */
export interface EditorialMagazineData {
  cards: MagazineCard[];
  featuredArtist?: string;
}

/** Personalize banner -- soft wall CTA */
export interface PersonalizeBannerData {
  headline: string; // Generic headline (SNS name is now animated separately)
  subtext?: string;
  ctaLabel: string; // "나만의 매거진 만들기"
  images: string[]; // Rotating images for suction animation
  snsNames?: string[]; // Optional SNS names for slot machine animation (defaults to built-in list)
}
