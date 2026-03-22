# Code Conventions & Standards

**Project**: decoded-app
**Last Updated**: 2026-02-12
**Focus**: Quality & consistency across the codebase

## Table of Contents
1. [TypeScript & Code Style](#typescript--code-style)
2. [Naming Conventions](#naming-conventions)
3. [File Organization](#file-organization)
4. [Component Patterns](#component-patterns)
5. [State Management](#state-management)
6. [Error Handling](#error-handling)
7. [Documentation](#documentation)

---

## TypeScript & Code Style

### Compiler Settings
**File**: `packages/web/tsconfig.json`

- **Strict Mode**: Enabled (`"strict": true`)
- **ES Target**: ES2017
- **Module System**: ESNext
- **JSX**: react-jsx (automatic)
- **Path Aliases**: `@/*` → `./*`, `@decoded/shared`
- **Module Resolution**: bundler
- **Key Flags**:
  - `isolatedModules: true` - Ensure safe transpilation
  - `skipLibCheck: true` - Skip type checking of node_modules
  - `allowJs: true` - Allow JavaScript files

### ESLint Configuration
**File**: `packages/web/eslint.config.mjs` (ESLint 9.0+ flat config)

**Plugins Enabled**:
- `@next/eslint-plugin-next` - Next.js best practices
- `eslint-plugin-react` - React rules
- `eslint-plugin-react-hooks` - React Hooks safety
- `eslint-plugin-prettier` - Prettier integration

**Key Rules**:
```javascript
"react/react-in-jsx-scope": "off"        // React 18+ JSX transform
"react/prop-types": "off"                // TypeScript replaces PropTypes
"prettier/prettier": "error"             // Enforce Prettier formatting
"@typescript-eslint/no-unused-vars": [
  "warn",
  {
    argsIgnorePattern: "^_",             // Allow unused params prefixed with _
    varsIgnorePattern: "^_"
  }
]
```

### Prettier Formatting
**File**: `packages/web/.prettierrc`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**Ignored Patterns**: See `.prettierignore`

---

## Naming Conventions

### Files & Directories

| Type | Pattern | Example | Location |
|------|---------|---------|----------|
| **React Components** | PascalCase | `FeedCard.tsx` | `lib/components/` |
| **Hooks** | camelCase with `use` prefix | `usePosts.ts` | `lib/hooks/` |
| **Stores (Zustand)** | camelCase with `*Store` suffix | `authStore.ts` | `lib/stores/` |
| **Utilities** | camelCase or descriptive | `validation.ts` | `lib/utils/` |
| **Queries (Supabase)** | camelCase with `.server.ts` if SSR | `posts.server.ts` | `lib/supabase/queries/` |
| **Page Routes** | lowercase/kebab-case (Next.js convention) | `page.tsx` | `app/feed/` |

### Variables & Functions

```typescript
// Components (PascalCase)
export const FeedCard = memo(({ item }: Props) => { ... });

// Hooks (camelCase with 'use')
export function usePosts() { ... }

// Constants (UPPER_SNAKE_CASE for configs)
export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024,
  supportedFormats: ["image/jpeg", "image/png"],
} as const;

// Helper functions (camelCase)
function mapSupabaseUser(user: SupabaseUser): User { ... }

// Private/internal functions (camelCase with leading underscore optional)
const _validateFormat = (file: File) => { ... };
```

### TypeScript Types & Interfaces

```typescript
// Interfaces (PascalCase)
interface FeedCardProps {
  item: FeedCardItem;
  priority?: boolean;
}

// Union types (PascalCase)
type OAuthProvider = "kakao" | "google" | "apple";

// Generics (single letter or descriptive)
<T extends Post>({ data }: Props<T>)

// Exported types from other modules
export type PostDetail = { post: PostRow; items: ItemRow[] };
```

---

## File Organization

### Directory Structure

```
packages/web/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   ├── feed/page.tsx             # Feed route
│   └── [id]/page.tsx             # Dynamic routes
│
├── lib/                          # Reusable code
│   ├── components/               # React components
│   │   ├── ui/                   # Base UI components (button, card, etc.)
│   │   ├── FeedCard.tsx          # Domain-specific components
│   │   └── SidebarFilterPanel.tsx
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── usePosts.ts
│   │   ├── useImageUpload.ts
│   │   └── useCategories.ts
│   │
│   ├── stores/                   # Zustand state stores
│   │   ├── authStore.ts
│   │   ├── filterStore.ts
│   │   └── requestStore.ts
│   │
│   ├── supabase/                 # Supabase integration
│   │   ├── client.ts             # Browser client singleton
│   │   ├── init.ts               # Server initialization
│   │   ├── types.ts              # Generated types from DB
│   │   ├── storage.ts            # File uploads
│   │   └── queries/              # Query layer
│   │       ├── posts.ts          # Client queries
│   │       ├── posts.server.ts   # Server-side queries
│   │       └── images.server.ts
│   │
│   ├── utils/                    # Utility functions
│   │   ├── validation.ts         # Form/file validation
│   │   ├── imageCompression.ts
│   │   └── color.ts
│   │
│   ├── api/                      # REST API client layer
│   │   ├── posts.ts
│   │   └── types.ts
│   │
│   └── react-query/              # React Query setup
│       └── client.ts
│
├── __tests__/                    # Test files
│   └── e2e/
│       └── scroll-animation.spec.ts
│
├── tsconfig.json                 # TypeScript config
├── eslint.config.mjs             # ESLint config (flat)
├── tailwind.config.ts            # Tailwind CSS config
├── next.config.js                # Next.js config
└── package.json
```

### Layering Pattern

**Query Layer Isolation** (`lib/supabase/queries/`):
- All Supabase direct access confined to query functions
- Client-side queries in `*.ts`, server-side in `*.server.ts`
- Changes to RLS policies only require query layer updates
- Frontend remains decoupled from database structure

**API Layer** (`lib/api/`):
- REST API client abstractions
- Type definitions for endpoints
- Request/response mapping

---

## Component Patterns

### Functional Components with React.memo

**File**: `packages/web/lib/components/FeedCard.tsx`

```typescript
"use client";  // Mark client-side components

import { memo, useState } from "react";
import type { ReactNode } from "react";

interface FeedCardProps {
  item: FeedCardItem;
  index: number;
  priority?: boolean;
}

/**
 * FeedCard - Instagram-style full-width card
 *
 * Minimal design with image and item count badge
 * Used in vertical feed layout (VerticalFeed)
 */
export const FeedCard = memo(
  ({ item, index: _index, priority = false }: FeedCardProps) => {
    const [imageError, setImageError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    return (
      <article className="relative w-full overflow-hidden rounded-xl">
        {/* Component JSX */}
      </article>
    );
  }
);

FeedCard.displayName = "FeedCard";  // For debugging
```

**Conventions**:
- Use `React.forwardRef` for components accepting refs
- Set `displayName` for memoized components
- Export both component and skeleton/loader variants
- Document purpose in JSDoc comment
- Unused parameters prefixed with `_`

### Skeleton/Loading Components

```typescript
export const FeedCardSkeleton = memo(() => {
  return (
    <article className="animate-pulse bg-muted">
      {/* Placeholder UI */}
    </article>
  );
});

FeedCardSkeleton.displayName = "FeedCardSkeleton";
```

### UI Components with CVA (shadcn/ui pattern)

**File**: `packages/web/lib/components/ui/button.tsx`

```typescript
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 ...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground ...",
        outline: "border border-input bg-background ...",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export { Button, buttonVariants };
```

---

## State Management

### Zustand Stores Pattern

**File**: `packages/web/lib/stores/authStore.ts`

```typescript
/**
 * Auth Store - Supabase OAuth 인증 상태 관리
 */

import { create } from "zustand";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export type OAuthProvider = "kakao" | "google" | "apple";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

interface AuthState {
  // State
  user: User | null;
  isGuest: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  loadingProvider: OAuthProvider | null;
  error: string | null;

  // Actions (with JSDoc descriptions)
  initialize: () => Promise<void>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// Helper functions outside store
function mapSupabaseUser(supabaseUser: SupabaseUser): User {
  const metadata = supabaseUser.user_metadata || {};
  return { /* mapping logic */ };
}

// Create store with explicit state structure
export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  isGuest: false,
  isLoading: false,
  isInitialized: false,
  loadingProvider: null,
  error: null,

  // Actions
  initialize: async () => {
    if (get().isInitialized) return;
    try {
      // Logic
      set({ isInitialized: true, user: null });
    } catch (error) {
      console.error("Auth initialization error:", error);
      set({ isInitialized: true, user: null });
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      // Logic
      set({ user: null, isGuest: false, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "로그아웃에 실패했습니다.";
      set({ error: message, isLoading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

// Selector pattern for typed access
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) =>
  !!state.user || state.isGuest;
export const selectIsLoggedIn = (state: AuthState) => !!state.user;
```

**Conventions**:
- One store per domain (auth, filter, request, etc.)
- Clear separation between state and actions
- Helper functions outside store definition
- Error handling with try-catch in async actions
- Export selector functions for typed access
- Group related state properties

---

## Error Handling

### Query Layer Pattern

**File**: `packages/web/lib/supabase/queries/posts.ts`

```typescript
/**
 * Fetches a post with its associated items and images (client-side)
 *
 * This function uses a 3-step query pattern:
 * 1. Fetch post (with item_ids)
 * 2. Fetch items using item_ids
 * 3. Fetch images using items' image_id
 *
 * @param postId - Post ID to fetch
 * @returns PostDetail object or null if post not found
 */
export async function fetchPostWithImagesAndItems(
  postId: string
): Promise<PostDetail | null> {
  // 1. Post query
  const { data: post, error: postError } = await supabaseBrowserClient
    .from("post")
    .select("*")
    .eq("id", postId)
    .single<PostRow>();

  if (postError || !post) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[fetchPostWithImagesAndItems] Error fetching post:",
        postError
      );
    }
    return null;  // Graceful fallback
  }

  // Type safety: validate array structure
  const itemIds = Array.isArray(post.item_ids)
    ? (post.item_ids as string[])
    : [];

  if (itemIds.length === 0) {
    return { post, items: [], images: [] };
  }

  // 2. Items query with ID conversion
  const itemIdsAsNumbers = itemIds.map((id) => parseInt(id, 10));

  const { data: itemsData, error: itemsError } = await supabaseBrowserClient
    .from("item")
    .select("*")
    .in("id", itemIdsAsNumbers);

  if (itemsError) {
    if (process.env.NODE_ENV === "development") {
      console.error("[fetchPostWithImagesAndItems] Error fetching items:", itemsError);
    }
    return { post, items: [], images: [] };  // Partial data OK
  }

  // ... continue pattern
}
```

**Patterns**:
- Check for both `error` and null data
- Development-only error logging
- Graceful fallbacks (return null, partial data, or empty arrays)
- Type validation for arrays from DB
- Function name prefix in logs `[functionName]`

### Validation Utilities

**File**: `packages/web/lib/utils/validation.ts`

```typescript
export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024,
  maxImages: 1,
  supportedFormats: ["image/jpeg", "image/png", "image/webp"] as const,
  supportedExtensions: [".jpg", ".jpeg", ".png", ".webp"] as const,
} as const;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File): ValidationResult {
  const formatResult = validateFileFormat(file);
  if (!formatResult.valid) {
    return formatResult;
  }

  const sizeResult = validateFileSize(file);
  if (!sizeResult.valid) {
    return sizeResult;
  }

  return { valid: true };
}
```

**Patterns**:
- Return structured result object with `valid` flag and `error` message
- Chain validations early-exit on first failure
- Use `as const` for readonly config objects
- Validate count before attempting operations

### Hook Error Handling (React Query)

**File**: `packages/web/lib/hooks/usePosts.ts`

```typescript
export function useInfinitePosts(params: UseInfinitePostsParams = {}) {
  return useInfiniteQuery<PostsPage>({
    queryKey: ["posts", "infinite", { /* params */ }],
    queryFn: async ({ pageParam }): Promise<PostsPage> => {
      const page = (pageParam as number) ?? 1;
      const response: PostsListResponse = await fetchPosts(apiParams);

      return {
        items: response.data,
        currentPage: response.pagination.current_page,
        totalPages: response.pagination.total_pages,
        hasMore: response.pagination.current_page < response.pagination.total_pages,
      };
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.currentPage + 1 : undefined,
    initialPageParam: 1,
    staleTime: 1000 * 60,      // 1 minute
    gcTime: 1000 * 60 * 5,     // 5 minutes (formerly cacheTime)
  });
}
```

**Patterns**:
- Use React Query for async state + error handling
- Type query responses explicitly
- Set appropriate stale/cache times
- Let React Query handle retry logic by default

---

## Documentation

### JSDoc Comments

```typescript
/**
 * Formats a date string to relative time
 * Falls back to formatted date if date is older than 7 days
 *
 * @param dateString - ISO date string from database
 * @returns Formatted relative time string (e.g., "2 hours ago")
 * @example
 * formatRelativeTime("2024-01-15T10:30:00Z") // "2 hours ago"
 */
export function formatRelativeTime(dateString: string): string { ... }
```

### Inline Comments - "Why" Over "What"

```typescript
// Good - explains business logic
const itemIds = Array.isArray(post.item_ids)
  ? (post.item_ids as string[])
  : [];  // Handle legacy data where item_ids might be null

// Avoid - restates code
const itemIds = post.item_ids ?? [];  // Get item IDs
```

### File Headers

```typescript
/**
 * Query layer for posts table (client-side)
 *
 * This module establishes the pattern: "Supabase direct access only happens in this layer"
 * When RLS policies change, only these query functions need to be updated,
 * keeping frontend code changes minimal.
 *
 * Note: For server-side queries, use posts.server.ts instead.
 */
```

### Commit Messages (Conventional Commits)

```
feat(auth): add oauth login support
fix(feed): correct infinite scroll pagination
docs(api): update endpoint documentation
refactor(store): simplify filter store logic
test(hooks): add usePosts unit tests
chore(deps): update react to 18.3.1
```

---

## Design System Component Conventions

**File Naming (lib/design-system/):**
```
kebab-case.tsx      # product-card.tsx, desktop-header.tsx
```

**Component & Export Naming:**
```typescript
// Component: PascalCase
export const ProductCard = ({ ... }) => { ... }

// Props type: ComponentNameProps
interface ProductCardProps { ... }

// Variants: CVA pattern with componentVariants constant
const productCardVariants = cva(...)

// Skeleton: ComponentNameSkeleton
export const ProductCardSkeleton = () => { ... }
```

**Import Pattern:**
```typescript
// Barrel export from index.ts
import { Card, ProductCard, Heading, Text } from "@/lib/design-system"

// Individual import (if needed)
import { Card } from "@/lib/design-system/card"
```

**CVA Variant Pattern:**
```typescript
import { cva, type VariantProps } from "class-variance-authority"

const cardVariants = cva(
  "base-classes",
  {
    variants: {
      variant: { default: "...", elevated: "..." },
      size: { sm: "...", md: "...", lg: "..." }
    },
    defaultVariants: { variant: "default", size: "md" }
  }
)

interface CardProps extends VariantProps<typeof cardVariants> {
  children: ReactNode
}
```

**Design Token Reference:**
```typescript
// Import tokens
import { typography, spacing, colors } from "@/lib/design-system/tokens"

// Usage
const fontSize = typography.sizes.h2
const padding = spacing[4]  // 16px
```

**Brand Color Utility (Shared Pattern):**
```typescript
// Brand color utility (shared across design system)
import { brandToColor } from "@/lib/utils/brandToColor"

// Returns deterministic CSS color for brand name via string hash
const color = brandToColor("Nike")  // Always same color for "Nike"
```

**Hotspot Component Pattern:**
```typescript
// Hotspot absorbs SpotMarker functionality (single source of truth)
// SpotMarker is deprecated re-export for backward compatibility
// Glow effects use CSS custom property --hotspot-color
import { Hotspot } from "@/lib/design-system"

// Usage with brand color override
<Hotspot brand="Nike" size="md" />
// Or with direct color override
<Hotspot color="rgb(255, 100, 50)" size="md" />
```

---

## Summary Checklist

- [ ] TypeScript strict mode - all files
- [ ] ESLint passes - run `yarn lint`
- [ ] Prettier formatted - run `yarn format`
- [ ] Components use PascalCase filenames and `React.memo`
- [ ] Hooks prefixed with `use`, in `lib/hooks/`
- [ ] Stores suffixed with `Store`, in `lib/stores/`
- [ ] Supabase queries in `lib/supabase/queries/` with `.server.ts` suffix for SSR
- [ ] Error handling with graceful fallbacks
- [ ] JSDoc for public functions explaining "why"
- [ ] Unused params prefixed with `_`
- [ ] Type definitions explicit and exported
- [ ] React Query hooks configured with stale/cache times
- [ ] Design system components follow CVA pattern with variants
- [ ] Design system imports use barrel export from `@/lib/design-system`

