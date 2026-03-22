# [SCR-XXX-NN] Screen Name
> Route: `/path` | Status: implemented | Updated: YYYY-MM-DD

## Purpose

One sentence describing what the user accomplishes on this screen.

## Component Map

| Region | Component | File | Props/Notes |
|--------|-----------|------|-------------|
| Header | MobileHeader | `packages/web/lib/components/...` | variant="default" |
| Body | ScreenComponent | `packages/web/lib/components/...` | prop={Type} |
| Footer | BottomNav | `packages/web/lib/components/...` | active="home" |

> All file paths must be verified against filesystem. Target: 200 lines. Max: 300 (justification required).

## Layout

### Mobile (default)

```
┌────────────────────────┐
│ [Header]               │
├────────────────────────┤
│ [HeroSection]          │
│ [ContentArea]          │
│  ├── [Card] [Card]     │
│  └── [Card] [Card]     │
├────────────────────────┤
│ [BottomNav]            │
└────────────────────────┘
```

### Desktop (>=768px)

Sidebar at left (240px); content area expands. BottomNav hidden; top nav visible.

## Requirements

### Data Loading

- When the screen mounts, the system shall fetch `GET /api/v1/resource` and display results.
- When the fetch is in progress, the system shall display skeleton placeholders.
- When the fetch fails with 4xx/5xx, the system shall show an error message with a retry button.

### User Interactions

- When the user taps a card, the system shall navigate to `/posts/[id]`.
- When the user scrolls to 80% of the list, the system shall fetch the next page.
- When the list is empty, the system shall display an empty state message.

### State

- Store: `resourceStore` from `packages/web/lib/stores/resourceStore.ts`
- Key fields: `items`, `isLoading`, `error`, `page`
- Query key: `["resource", filter]`

## Navigation

| Trigger | Destination | Data Passed |
|---------|-------------|-------------|
| Card tap | `/posts/[id]` | postId |
| Search icon | `/search` | - |
| Back gesture | Previous screen | - |

## Error & Empty States

| State | Condition | UI |
|-------|-----------|-----|
| Loading | Initial fetch | Skeleton ([SkeletonCard] x6) |
| Empty | No results | "No items found" + browse suggestion |
| Error | API 4xx/5xx | Error message + Retry button |

## Animations (if applicable)
| Trigger | Type | Library |
|---------|------|---------|
| Screen enter | Fade in | Motion (duration: 0.3s) |
| Card click | FLIP expand | GSAP Flip (duration: 0.5s) |
