# v2.0 Design System (LLM quick reference)

Implementation: `packages/web/lib/design-system/`. Human-facing 토큰·패턴 상세는 [docs/design-system/](../design-system/)를 SSOT로 둡니다.

## Import path

All design system components are exported from a single barrel import:

```typescript
import {
  // Typography
  Heading,
  Text,
  // Inputs
  Input,
  SearchInput,
  // Cards
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardSkeleton,
  ProductCard,
  GridCard,
  FeedCardBase,
  ProfileHeaderCard,
  // Headers & Footer
  DesktopHeader,
  MobileHeader,
  DesktopFooter,
  // Tokens
  typography,
  colors,
  spacing,
  shadows,
  borderRadius,
  zIndex,
} from "@/lib/design-system";
```

## Component usage guide

| Component       | Use Case            | Example                                              |
| --------------- | ------------------- | ---------------------------------------------------- |
| **Heading**     | Page/section titles | `<Heading variant="h2">Title</Heading>`              |
| **Text**        | Body text, captions | `<Text variant="small">Description</Text>`           |
| **Card**        | Generic container   | `<Card variant="elevated" size="md">...</Card>`      |
| **ProductCard** | Product display     | `<ProductCard image={url} title="..." price="$99"/>` |
| **Input**       | Form inputs         | `<Input variant="search" leftIcon={<Search/>}/>`     |

## Design token reference

Access design tokens directly for custom styling:

```typescript
import { typography, spacing, colors } from "@/lib/design-system/tokens";

// Typography
typography.sizes.h1; // Font size for h1
responsiveTypography.pageTitle; // Responsive title sizing

// Spacing (4px base unit)
spacing[4]; // 16px
spacing[8]; // 32px

// Colors (CSS variable references)
colors.primary;
colors.muted;
```

## Further documentation

- **[docs/design-system/](../design-system/)** — Design token documentation
- **[.planning/codebase/](../../.planning/codebase/)** — Architecture and conventions

## Component inventory

Located in `lib/design-system/`:

| Component                            | Purpose                                              |
| ------------------------------------ | ---------------------------------------------------- |
| **tokens.ts**                        | Design tokens (colors, spacing, typography, shadows) |
| **Heading, Text**                    | Typography components with size variants             |
| **Input, SearchInput**               | Form inputs with variants                            |
| **Card Family**                      | Base card + Header/Content/Footer + Skeleton         |
| **ProductCard**                      | Product card with image & description                |
| **GridCard**                         | Grid layout card variant                             |
| **FeedCardBase**                     | Social feed card variant                             |
| **ProfileHeaderCard**                | Profile header card                                  |
| **DesktopHeader**                    | Desktop navigation header                            |
| **MobileHeader**                     | Mobile navigation with bottom sheet                  |
| **DesktopFooter**                    | Desktop footer with links                            |
| **ActionButton**                     | Interactive action button                            |
| **ArtistCard**                       | Artist/celebrity display card                        |
| **Badge**                            | Badge/tag display                                    |
| **BottomSheet**                      | Mobile bottom sheet                                  |
| **Divider**                          | Section divider                                      |
| **GuestButton**                      | Guest action button                                  |
| **Hotspot**                          | Interactive hotspot marker                           |
| **LeaderItem**                       | Leaderboard/ranking item                             |
| **LoadingSpinner**                   | Loading state indicator                              |
| **LoginCard**                        | Login prompt card                                    |
| **NavBar, NavItem**                  | Navigation components                                |
| **OAuthButton**                      | OAuth provider button                                |
| **RankingItem**                      | Ranking display item                                 |
| **SectionHeader**                    | Section title header                                 |
| **ShopCarouselCard**                 | Shop item carousel card                              |
| **SpotCard, SpotDetail, SpotMarker** | Spot interaction components                          |
| **StatCard**                         | Statistics display card                              |
| **StepIndicator**                    | Multi-step progress indicator                        |
| **Tabs**                             | Tab navigation                                       |
| **Tag**                              | Categorization tag                                   |
