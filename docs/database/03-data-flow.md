# Image Detail Page Data Flow

> **Last updated:** 2025-12-18  
> **Purpose:** Document the complete data flow from image click to item/post display, including field mappings

## Overview

This document describes how data flows from database to UI components when a user clicks an image to view its detail page. It includes explicit field mappings to prevent data loss during transformation.

---

## 1. User Interaction → Routing

### Flow

1. User clicks an image in the grid (`app/HomeClient.tsx`)
2. `Link` component navigates to `/images/${imageId}`
3. FLIP animation state is captured (`useTransitionStore`)

### Code Location

- **Component**: `app/HomeClient.tsx` (CardCell component, lines 139-146)
- **Route**: Two paths:
  - **Modal**: `app/@modal/(.)images/[id]/page.tsx` → `ImageDetailModal`
  - **Full Page**: `app/images/[id]/page.tsx` → `ImageDetailPage`

---

## 2. Data Fetching

### Query Function

- **Hook**: `useImageById(imageId)` (`lib/hooks/useImages.ts:58-64`)
- **Query**: `fetchImageById(id)` (`lib/supabase/queries/images.ts:83-121`)

### Database Query Structure

```typescript
supabaseBrowserClient
  .from("image")
  .select(
    `
    *,
    items:item(*),
    post_images:post_image(
      post(*)
    )
  `
  )
  .eq("id", id)
  .single();
```

### Relationships

- **image → item**: One-to-many (`item.image_id` FK)
- **image → post**: Many-to-many (via `post_image` join table)

---

## 3. Data Transformation

### 3.1 Posts Transformation

**Location**: `lib/supabase/queries/images.ts:106-109`

```typescript
const posts = data.post_images
  ? (data.post_images as any[]).map((pi) => pi.post).filter(Boolean)
  : [];
```

**Transformation**: `post_images` array → flat `posts` array

### 3.2 Items Transformation

**Location**: `lib/components/detail/types.ts:normalizeItem()`

**Purpose**: Transform `DbItem` (database format) → `UiItem` (UI format)

#### Field Mapping Table

| DB Column            | DB Type          | Transform Function       | UI Field           | UI Type                   | Component Usage               |
| -------------------- | ---------------- | ------------------------ | ------------------ | ------------------------- | ----------------------------- |
| `cropped_image_path` | `string \| null` | `normalizeItem()`        | `imageUrl`         | `string \| null`          | `<img src={item.imageUrl} />` |
| `center`             | `Json \| null`   | `normalizeCoordinates()` | `normalizedBox`    | `BoundingBox \| null`     | Highlight positioning         |
| `center`             | `Json \| null`   | `getBoxCenter()`         | `normalizedCenter` | `NormalizedCoord \| null` | Connector lines               |

#### Transformation Code

```typescript
export function normalizeItem(
  item: DbItem,
  imageSize?: { width: number; height: number }
): UiItem {
  const normalizedBox = normalizeCoordinates(item.center, imageSize);
  const normalizedCenter = normalizedBox ? getBoxCenter(normalizedBox) : null;

  return {
    ...item,
    normalizedBox,
    normalizedCenter,
    imageUrl: item.cropped_image_path || null, // Explicit mapping
  };
}
```

**Key Points**:

- `normalizeItem` is the **single source of truth** for DbItem → UiItem transformation
- All field mappings happen here
- Coordinates are normalized to 0.0-1.0 range for viewport independence

---

## 4. Component Rendering

### 4.1 ImageDetailContent

**Location**: `lib/components/detail/ImageDetailContent.tsx`

**Responsibilities**:

- Receives `ImageDetail` (image + items + posts)
- Normalizes items: `items.map(item => normalizeItem(item))`
- Passes normalized items to child components

### 4.2 ShopGrid

**Location**: `lib/components/detail/ShopGrid.tsx`

**Data Flow**:

```
UiItem[] → ShopGrid → Render cards with item.imageUrl
```

**Rendering**:

- Uses `item.imageUrl` for image display
- Fallback: Shows placeholder if `imageUrl` is null

### 4.3 ItemDetailCard

**Location**: `lib/components/detail/ItemDetailCard.tsx`

**Data Flow**:

```
UiItem → ItemDetailCard → Render card with item.imageUrl
```

**Rendering**:

- Uses `item.imageUrl` for image display
- Displays product name, brand, price

### 4.4 InteractiveShowcase

**Location**: `lib/components/detail/InteractiveShowcase.tsx`

**Data Flow**:

```
UiItem[] → InteractiveShowcase → ImageCanvas + ItemDetailCard[]
```

**Components**:

- `ImageCanvas`: Uses `item.normalizedBox` for highlighting
- `ItemDetailCard[]`: Uses `item.imageUrl` for images
- `ConnectorLayer`: Uses `item.normalizedCenter` for line drawing

---

## 5. Complete Data Flow Diagram

```
┌─────────────────┐
│  User Clicks    │
│     Image       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Route to       │
│ /images/[id]    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│ useImageById()  │─────▶│ fetchImageById()  │
└────────┬────────┘      └────────┬─────────┘
         │                        │
         │                        ▼
         │              ┌──────────────────┐
         │              │  Supabase Query   │
         │              │  image + items +  │
         │              │  post_images      │
         │              └────────┬─────────┘
         │                        │
         │                        ▼
         │              ┌──────────────────┐
         │              │  ImageDetail      │
         │              │  { image, items,  │
         │              │    posts }         │
         │              └────────┬─────────┘
         │                        │
         ▼                        │
┌─────────────────┐              │
│ImageDetailContent│◀─────────────┘
└────────┬────────┘
         │
         │ items.map(normalizeItem)
         │
         ▼
┌─────────────────┐
│  normalizeItem() │
│  DbItem → UiItem │
│  - cropped_image │
│    _path →       │
│    imageUrl      │
│  - center →      │
│    normalizedBox │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   UiItem[]      │
└────────┬────────┘
         │
         ├─────────────────┬──────────────────┐
         ▼                 ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  ShopGrid    │  │Interactive   │  │ItemDetailCard│
│  item.imageUrl│  │Showcase      │  │item.imageUrl │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## 6. Critical Field Mappings

### Item Image Field Path

```
DB: item.cropped_image_path (string | null)
  ↓
Query: items:item(*) (automatically included)
  ↓
Type: DbItem.cropped_image_path
  ↓
Transform: normalizeItem() → UiItem.imageUrl
  ↓
Component: <img src={item.imageUrl} />
```

**Why This Matters**:

- If any step in this chain breaks, images won't display
- The mapping must be explicit in `normalizeItem()` to prevent data loss
- Type safety ensures the field exists at each step

---

## 7. Common Issues & Solutions

### Issue: Items don't show images

**Symptoms**: Items render but images are missing

**Checklist**:

1. ✅ DB has `cropped_image_path` column (verify with MCP)
2. ✅ TypeScript types include `cropped_image_path` in `item` Row type
3. ✅ Query includes `items:item(*)` (gets all columns)
4. ✅ `normalizeItem()` maps `cropped_image_path` → `imageUrl`
5. ✅ Component uses `item.imageUrl` (not `item.cropped_image_path`)

### Issue: Type errors after schema change

**Solution**: Regenerate types and update `normalizeItem()` if field names change

---

## 8. MCP Verification Workflow

When schema changes:

1. **Verify with MCP**: `mcp_supabase-decoded-ai_list_tables` for `item` table
2. **Check fields**: Confirm `cropped_image_path` exists and is correct type
3. **Update types**: Regenerate `lib/supabase/types.ts`
4. **Update mapping**: Ensure `normalizeItem()` handles new/renamed fields
5. **Test**: Verify images display correctly

---

## Changelog

- **2025-12-18**: Updated to reflect new schema fields (item.description, post.article, post_image.item_locations/item_locations_updated_at)
- **2025-01-XX**: Initial version documenting complete data flow and field mappings
