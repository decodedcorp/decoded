/**
 * Design System
 *
 * Barrel export for all design system modules
 */

// Tokens
export * from "./tokens";

// Typography Components
export { Heading, headingVariants, Text, textVariants } from "./typography";
export type { HeadingProps, TextProps } from "./typography";

// Input Components
export { Input, inputVariants, SearchInput } from "./input";
export type { InputProps, SearchInputProps } from "./input";

// Card Components
export {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardSkeleton,
  cardVariants,
} from "./card";
export type {
  CardProps,
  CardHeaderProps,
  CardContentProps,
  CardFooterProps,
  CardSkeletonProps,
} from "./card";

// Product Cards
export { ProductCard, ProductCardSkeleton } from "./product-card";
export type {
  ProductCardProps,
  ProductCardSkeletonProps,
} from "./product-card";

// Grid Cards
export { GridCard, GridCardSkeleton } from "./grid-card";
export type { GridCardProps, GridCardSkeletonProps } from "./grid-card";

// Feed Card (design-system base)
export {
  FeedCard as FeedCardBase,
  FeedCardSkeleton as FeedCardBaseSkeleton,
} from "./feed-card";
export type { FeedCardProps as FeedCardBaseProps } from "./feed-card";

// Profile Header Card
export {
  ProfileHeaderCard,
  ProfileHeaderCardSkeleton,
} from "./profile-header-card";
export type { ProfileHeaderCardProps } from "./profile-header-card";

// Header Components
export { DesktopHeader, desktopHeaderVariants } from "./desktop-header";
export type { DesktopHeaderProps } from "./desktop-header";

export { MobileHeader, mobileHeaderVariants } from "./mobile-header";
export type { MobileHeaderProps } from "./mobile-header";

// Footer Components
export { DesktopFooter } from "./desktop-footer";
export type { DesktopFooterProps } from "./desktop-footer";

// Tag Component
export { Tag, tagVariants } from "./tag";
export type { TagProps } from "./tag";

// ActionButton Component
export { ActionButton, actionButtonVariants } from "./action-button";
export type { ActionButtonProps } from "./action-button";

// StepIndicator Component
export { StepIndicator, stepIndicatorVariants } from "./step-indicator";
export type { StepIndicatorProps } from "./step-indicator";

// Hotspot Component
export { Hotspot, hotspotVariants, brandToColor } from "./hotspot";
export type { HotspotProps, HotspotPosition } from "./hotspot";

// SpotMarker Component (platform-wide spot marker)
export { SpotMarker } from "./spot-marker";
export type {
  SpotMarkerProps,
  SpotMarkerSize,
  SpotPosition,
} from "./spot-marker";

// NavItem Component
export { NavItem, navItemVariants } from "./nav-item";
export type { NavItemProps } from "./nav-item";

// NavBar Component
export { NavBar, navBarVariants } from "./nav-bar";
export type { NavBarProps } from "./nav-bar";

// SectionHeader Component
export { SectionHeader } from "./section-header";
export type { SectionHeaderProps } from "./section-header";

// Tabs Components
export { Tabs, TabItem, tabItemVariants } from "./tabs";
export type { TabsProps, TabItemProps } from "./tabs";

// ArtistCard Component
export { ArtistCard, ArtistCardSkeleton } from "./artist-card";
export type { ArtistCardProps, ArtistCardSkeletonProps } from "./artist-card";

// StatCard Component
export { StatCard, StatCardSkeleton } from "./stat-card";
export type { StatCardProps, StatCardSkeletonProps } from "./stat-card";

// SpotCard Component
export { SpotCard, SpotCardSkeleton, spotCardVariants } from "./spot-card";
export type { SpotCardProps } from "./spot-card";

// ShopCarouselCard Component
export {
  ShopCarouselCard,
  ShopCarouselCardSkeleton,
} from "./shop-carousel-card";
export type { ShopCarouselCardProps } from "./shop-carousel-card";

// Badge Component
export { Badge, BadgeSkeleton, badgeVariants } from "./badge";
export type { BadgeProps, BadgeSkeletonProps } from "./badge";

// LeaderItem Component
export { LeaderItem, LeaderItemSkeleton } from "./leader-item";
export type { LeaderItemProps, LeaderItemSkeletonProps } from "./leader-item";

// RankingItem Component
export { RankingItem, rankingItemVariants } from "./ranking-item";
export type { RankingItemProps } from "./ranking-item";

// SpotDetail Component
export { SpotDetail, SpotDetailSkeleton } from "./spot-detail";
export type {
  SpotDetailProps,
  SpotDetailSkeletonProps,
  SpotDetailShopLink,
  SpotDetailRelatedItem,
} from "./spot-detail";

// OAuthButton Component
export { OAuthButton, oauthButtonVariants } from "./oauth-button";
export type { OAuthButtonProps, OAuthProvider } from "./oauth-button";

// GuestButton Component
export { GuestButton } from "./guest-button";
export type { GuestButtonProps } from "./guest-button";

// Divider Component
export { Divider } from "./divider";
export type { DividerProps } from "./divider";

// SkeletonCard Component
export { SkeletonCard, skeletonCardVariants } from "./skeleton-card";
export type { SkeletonCardProps } from "./skeleton-card";

// BottomSheet Component
export { BottomSheet } from "./bottom-sheet";
export type { BottomSheetProps } from "./bottom-sheet";

// LoginCard Component
export { LoginCard } from "./login-card";
export type { LoginCardProps } from "./login-card";

// LoadingSpinner Component
export { LoadingSpinner } from "./loading-spinner";
export type { LoadingSpinnerProps } from "./loading-spinner";
