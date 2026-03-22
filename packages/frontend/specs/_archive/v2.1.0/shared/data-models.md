# Data Models

> TypeScript interfaces and database schemas for Decoded App

> **Related Documentation**
> - 실제 DB 사용 가이드: [docs/database/01-schema-usage.md](../../docs/database/01-schema-usage.md)
> - API 스키마: [docs/api/schemas.md](../../docs/api/schemas.md)

---

## Core Domain Types

### Category Hierarchy

```typescript
// Level 1: Top-level category
type CategoryType = 'K-POP' | 'K-Drama' | 'K-Movie' | 'K-Variety' | 'K-Fashion';

// Level 2: Media or Group
interface Media {
  id: string;
  type: 'group' | 'show' | 'drama' | 'movie' | 'variety';
  name: string;
  nameKo: string;
  category: CategoryType;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Level 3: Cast or Person
interface Cast {
  id: string;
  name: string;
  nameKo: string;
  mediaIds: string[];           // Can belong to multiple media (groups, shows)
  profileImageUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Level 4: Context
type ContextType =
  | 'airport'       // Airport fashion
  | 'stage'         // Performance outfit
  | 'mv'            // Music video
  | 'drama_scene'   // Drama scene
  | 'variety'       // Variety show appearance
  | 'photoshoot'    // Magazine/promotional
  | 'daily'         // Daily/casual
  | 'event';        // Awards, premieres

interface Context {
  id: string;
  type: ContextType;
  label: string;
  labelKo: string;
}
```

### Post Entity

```typescript
interface Post {
  id: string;

  // Source information
  account: string;              // Instagram account or source
  sourceUrl?: string;           // Original post URL
  sourceType: 'instagram' | 'twitter' | 'tiktok' | 'manual';

  // Content
  article?: string;             // Caption or description

  // Hierarchical metadata
  mediaId?: string;             // FK to Media
  castIds: string[];            // FK to Cast[]
  contextType?: ContextType;

  // Timestamps
  postedAt: Date;               // Original post date
  createdAt: Date;
  updatedAt: Date;

  // Status
  status: 'draft' | 'published' | 'archived';
}

// Junction table for post-image relationship
interface PostImage {
  id: string;
  postId: string;
  imageId: string;
  orderIndex: number;
  itemLocations?: ItemLocation[];
  itemLocationsUpdatedAt?: Date;
}
```

### Image Entity

```typescript
type ImageStatus =
  | 'pending'           // Initial upload
  | 'extracted'         // Items detected
  | 'extracted_metadata'// Metadata enriched
  | 'skipped';          // No items found

interface Image {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string;

  // Dimensions
  width: number;
  height: number;
  aspectRatio: number;

  // Processing status
  status: ImageStatus;
  withItems: boolean;

  // AI analysis results
  aiLabels?: string[];
  aiConfidence?: number;

  createdAt: Date;
  updatedAt: Date;
}
```

### Item Entity

```typescript
interface BoundingBox {
  x: number;      // 0-1 normalized
  y: number;      // 0-1 normalized
  width: number;  // 0-1 normalized
  height: number; // 0-1 normalized
}

interface Point {
  x: number;      // 0-1 normalized
  y: number;      // 0-1 normalized
}

type ItemCategory =
  | 'top'
  | 'bottom'
  | 'outerwear'
  | 'dress'
  | 'shoes'
  | 'bag'
  | 'accessory'
  | 'jewelry'
  | 'hat'
  | 'eyewear'
  | 'other';

type MatchType = 'original' | 'vibe';  // The Original vs The Vibe

interface Item {
  id: string;
  imageId: string;                     // FK to Image

  // Product information
  productName?: string;
  brand?: string;
  price?: number;
  currency?: string;
  purchaseUrl?: string;

  // Visual data
  croppedImagePath?: string;
  bboxes: BoundingBox[];              // Multiple bounding boxes possible
  center: Point;                       // Spot position (정규화 좌표)

  // Classification
  category: ItemCategory;
  matchType: MatchType;

  // Metadata
  color?: string;
  material?: string;
  season?: string;

  // AI confidence
  confidence?: number;

  createdAt: Date;
  updatedAt: Date;
}
```

---

## User & Gamification Types

### User Entity

```typescript
type AuthProvider = 'kakao' | 'google' | 'apple' | 'email';

interface User {
  id: string;

  // Authentication
  email?: string;
  authProvider: AuthProvider;
  authProviderId: string;

  // Profile
  displayName: string;
  avatarUrl?: string;
  bio?: string;

  // Preferences
  preferredLanguage: 'ko' | 'en';

  // Stats (denormalized for performance)
  totalContributions: number;
  totalAccepted: number;
  totalEarnings: number;

  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}
```

### Badge System

```typescript
type BadgeType =
  | 'expert'       // High accuracy in specific tag
  | 'master'       // Top contributor for specific tag
  | 'pioneer'      // First to identify items
  | 'contributor'; // General contribution milestones

interface Badge {
  id: string;
  type: BadgeType;

  // Target (e.g., "IVE", "JENNIE", "Squid Game")
  targetType: 'media' | 'cast' | 'category';
  targetId: string;
  targetName: string;

  // Display
  title: string;                      // "IVE Fashion Expert"
  titleKo: string;                    // "IVE 패션 전문가"
  description: string;
  iconUrl: string;

  // Criteria
  criteria: BadgeCriteria;

  createdAt: Date;
}

interface BadgeCriteria {
  minContributions: number;           // Minimum posts/answers
  minAcceptRate: number;              // 0-1, minimum acceptance rate
  timeWindow: 'weekly' | 'monthly' | 'allTime';
  additionalRules?: Record<string, unknown>;
}

interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: Date;

  // Snapshot of stats when earned
  statsSnapshot: {
    contributions: number;
    acceptRate: number;
    rank: number;
  };
}
```

### Ranking System

```typescript
interface ContributorRanking {
  id: string;
  userId: string;

  // Scope
  scope: 'global' | 'media' | 'cast';
  scopeId?: string;                   // If media or cast scope

  // Time period
  period: 'weekly' | 'monthly' | 'allTime';
  periodStart: Date;
  periodEnd: Date;

  // Stats
  rank: number;
  contributions: number;
  acceptedCount: number;
  acceptRate: number;

  // Points breakdown
  points: {
    posts: number;
    answers: number;
    votes: number;
  };

  calculatedAt: Date;
}
```

### Rewards System

```typescript
type RewardType =
  | 'click'        // Affiliate click
  | 'conversion'   // Purchase conversion
  | 'bonus';       // Special bonus

type RewardStatus =
  | 'pending'      // Not yet confirmed
  | 'confirmed'    // Confirmed, awaiting payout
  | 'paid'         // Paid out
  | 'cancelled';   // Cancelled/refunded

interface Reward {
  id: string;
  userId: string;

  type: RewardType;
  amount: number;
  currency: string;

  // Source tracking
  itemId?: string;
  clickId?: string;

  status: RewardStatus;

  createdAt: Date;
  confirmedAt?: Date;
  paidAt?: Date;
}

interface WithdrawalRequest {
  id: string;
  userId: string;

  amount: number;
  currency: string;

  // Payment details
  paymentMethod: 'bank_transfer' | 'paypal';
  paymentDetails: Record<string, string>;

  status: 'pending' | 'processing' | 'completed' | 'rejected';

  requestedAt: Date;
  processedAt?: Date;
  completedAt?: Date;

  adminNote?: string;
}
```

---

## Interaction Types

### Voting

```typescript
type VoteType = 'accurate' | 'inaccurate';

interface Vote {
  id: string;
  userId: string;
  itemId: string;

  type: VoteType;

  createdAt: Date;
}

// Aggregated vote counts (materialized view)
interface ItemVoteSummary {
  itemId: string;
  accurateCount: number;
  inaccurateCount: number;
  accuracyScore: number;          // 0-1
  totalVotes: number;
  lastUpdated: Date;
}
```

### Comments

```typescript
interface Comment {
  id: string;
  userId: string;

  // Target (polymorphic)
  targetType: 'post' | 'item';
  targetId: string;

  // Content
  content: string;

  // Threading
  parentId?: string;              // For replies

  // Moderation
  status: 'visible' | 'hidden' | 'deleted';
  reportCount: number;

  createdAt: Date;
  updatedAt: Date;
}
```

### Favorites

```typescript
interface Favorite {
  id: string;
  userId: string;

  targetType: 'post' | 'item' | 'cast' | 'media';
  targetId: string;

  createdAt: Date;
}
```

---

## Analytics & Tracking

### Click Tracking

```typescript
interface ClickEvent {
  id: string;

  // What was clicked
  itemId: string;
  purchaseUrl: string;

  // Who clicked
  userId?: string;
  sessionId: string;

  // Attribution
  sourcePostId?: string;
  sourceImageId?: string;

  // Device info
  userAgent: string;
  ipHash: string;                 // Hashed for privacy
  referrer?: string;

  // Timestamps
  clickedAt: Date;

  // Affiliate tracking
  affiliateCode?: string;
  isConverted: boolean;
  convertedAt?: Date;
}
```

---

## Filter State Types

```typescript
// For Zustand store
interface FilterState {
  // Active selections at each level
  category?: CategoryType;
  mediaId?: string;
  castId?: string;
  contextType?: ContextType;

  // Search
  searchQuery?: string;

  // Pagination
  cursor?: string;
  hasMore: boolean;

  // Actions
  setCategory: (category: CategoryType | undefined) => void;
  setMedia: (mediaId: string | undefined) => void;
  setCast: (castId: string | undefined) => void;
  setContext: (contextType: ContextType | undefined) => void;
  setSearchQuery: (query: string | undefined) => void;
  resetFilters: () => void;
}

// Filter breadcrumb for display
interface FilterBreadcrumb {
  level: 1 | 2 | 3 | 4;
  type: 'category' | 'media' | 'cast' | 'context';
  id: string;
  label: string;
}
```

---

## Database Schema (Supabase/PostgreSQL)

### Core Tables

```sql
-- Categories (static reference)
CREATE TYPE category_type AS ENUM ('K-POP', 'K-Drama', 'K-Movie', 'K-Variety', 'K-Fashion');

-- Media (groups, shows, dramas)
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  name_ko VARCHAR(255) NOT NULL,
  category category_type NOT NULL,
  image_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cast (people)
CREATE TABLE cast (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  name_ko VARCHAR(255) NOT NULL,
  profile_image_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Media-Cast junction
CREATE TABLE media_cast (
  media_id UUID REFERENCES media(id),
  cast_id UUID REFERENCES cast(id),
  role VARCHAR(100),
  PRIMARY KEY (media_id, cast_id)
);

-- Context types (static reference)
CREATE TYPE context_type AS ENUM (
  'airport', 'stage', 'mv', 'drama_scene',
  'variety', 'photoshoot', 'daily', 'event'
);

-- Posts
CREATE TABLE post (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account VARCHAR(255) NOT NULL,
  source_url TEXT,
  source_type VARCHAR(20) DEFAULT 'manual',
  article TEXT,
  media_id UUID REFERENCES media(id),
  context_type context_type,
  posted_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post-Cast junction
CREATE TABLE post_cast (
  post_id UUID REFERENCES post(id),
  cast_id UUID REFERENCES cast(id),
  PRIMARY KEY (post_id, cast_id)
);

-- Images
CREATE TYPE image_status AS ENUM ('pending', 'extracted', 'extracted_metadata', 'skipped');

CREATE TABLE image (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  width INTEGER,
  height INTEGER,
  aspect_ratio DECIMAL(5,3),
  status image_status DEFAULT 'pending',
  with_items BOOLEAN DEFAULT FALSE,
  ai_labels JSONB,
  ai_confidence DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post-Image junction
CREATE TABLE post_image (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES post(id),
  image_id UUID REFERENCES image(id),
  order_index INTEGER DEFAULT 0,
  item_locations JSONB,
  item_locations_updated_at TIMESTAMPTZ
);

-- Items
CREATE TYPE item_category AS ENUM (
  'top', 'bottom', 'outerwear', 'dress', 'shoes',
  'bag', 'accessory', 'jewelry', 'hat', 'eyewear', 'other'
);

CREATE TYPE match_type AS ENUM ('original', 'vibe');

CREATE TABLE item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID REFERENCES image(id),
  product_name VARCHAR(255),
  brand VARCHAR(255),
  price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'KRW',
  purchase_url TEXT,
  cropped_image_path TEXT,
  bboxes JSONB NOT NULL DEFAULT '[]',
  center JSONB NOT NULL,
  category item_category,
  match_type match_type DEFAULT 'original',
  color VARCHAR(50),
  material VARCHAR(100),
  season VARCHAR(20),
  confidence DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for filtering
CREATE INDEX idx_post_media ON post(media_id);
CREATE INDEX idx_post_context ON post(context_type);
CREATE INDEX idx_item_category ON item(category);
CREATE INDEX idx_item_brand ON item(brand);
```

### User Tables

```sql
-- Users
CREATE TABLE "user" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  auth_provider VARCHAR(20) NOT NULL,
  auth_provider_id VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  preferred_language VARCHAR(2) DEFAULT 'ko',
  total_contributions INTEGER DEFAULT 0,
  total_accepted INTEGER DEFAULT 0,
  total_earnings DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(auth_provider, auth_provider_id)
);

-- Badges
CREATE TABLE badge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL,
  target_type VARCHAR(20) NOT NULL,
  target_id UUID,
  target_name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  title_ko VARCHAR(255) NOT NULL,
  description TEXT,
  icon_url TEXT,
  criteria JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-Badge junction
CREATE TABLE user_badge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES "user"(id),
  badge_id UUID REFERENCES badge(id),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  stats_snapshot JSONB,
  UNIQUE(user_id, badge_id)
);

-- Rankings
CREATE TABLE contributor_ranking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES "user"(id),
  scope VARCHAR(20) NOT NULL,
  scope_id UUID,
  period VARCHAR(20) NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  rank INTEGER NOT NULL,
  contributions INTEGER DEFAULT 0,
  accepted_count INTEGER DEFAULT 0,
  accept_rate DECIMAL(3,2) DEFAULT 0,
  points JSONB DEFAULT '{}',
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rewards
CREATE TABLE reward (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES "user"(id),
  type VARCHAR(20) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'KRW',
  item_id UUID REFERENCES item(id),
  click_id UUID,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);

-- Withdrawal Requests
CREATE TABLE withdrawal_request (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES "user"(id),
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'KRW',
  payment_method VARCHAR(20) NOT NULL,
  payment_details JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  admin_note TEXT
);
```

### Interaction Tables

```sql
-- Votes
CREATE TABLE vote (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES "user"(id),
  item_id UUID REFERENCES item(id),
  type VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- Comments
CREATE TABLE comment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES "user"(id),
  target_type VARCHAR(20) NOT NULL,
  target_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comment(id),
  status VARCHAR(20) DEFAULT 'visible',
  report_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favorites
CREATE TABLE favorite (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES "user"(id),
  target_type VARCHAR(20) NOT NULL,
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

-- Click Events
CREATE TABLE click_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES item(id),
  purchase_url TEXT NOT NULL,
  user_id UUID REFERENCES "user"(id),
  session_id VARCHAR(255) NOT NULL,
  source_post_id UUID REFERENCES post(id),
  source_image_id UUID REFERENCES image(id),
  user_agent TEXT,
  ip_hash VARCHAR(64),
  referrer TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  affiliate_code VARCHAR(100),
  is_converted BOOLEAN DEFAULT FALSE,
  converted_at TIMESTAMPTZ
);

-- Indexes for analytics
CREATE INDEX idx_click_item ON click_event(item_id);
CREATE INDEX idx_click_user ON click_event(user_id);
CREATE INDEX idx_click_date ON click_event(clicked_at);
```

---

## API Response Types

```typescript
// Paginated response wrapper
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    cursor?: string;
    hasMore: boolean;
    total?: number;
  };
}

// Deduplication config for infinite scroll
interface DeduplicationConfig {
  strategy: 'id' | 'composite';  // 'id' = image.id only, 'composite' = image.id + postId
  scope: 'page' | 'accumulated'; // 'page' = single page, 'accumulated' = all pages
}

/**
 * 무한 스크롤 중복 제거 전략:
 * - page 단위: fetchUnifiedImages의 deduplicateByImageId 옵션 (어댑터 레벨)
 * - accumulated 단위: 클라이언트에서 flatMap 후 Set<id> 필터링
 */

// Error response
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Feed item (denormalized for display)
interface FeedItem {
  post: Post;
  images: Image[];
  items: Item[];
  media?: Media;
  cast: Cast[];
}

// Detail view response
interface DetailResponse {
  post: Post;
  image: Image;
  items: ItemWithVotes[];
  media?: Media;
  cast: Cast[];
  relatedPosts: Post[];
}

interface ItemWithVotes extends Item {
  votes: ItemVoteSummary;
  comments: Comment[];
}
```
