# [SCR-DISC-02] Search
> Route: `/search` | Status: implemented | Updated: 2026-03-05

## Purpose

User searches across posts, people, and items via a full-screen page with debounced query input, four result tabs, and pre-search recent/trending suggestions.

## Component Map

| Region | Component | File | Props/Notes |
|--------|-----------|------|-------------|
| Page | SearchPage (server) | `packages/web/app/search/page.tsx` | async; reads `?q=` + `?tab=` from searchParams; Suspense wrapper |
| Client root | SearchPageClient | `packages/web/app/search/SearchPageClient.tsx` | "use client"; fixed inset-0 z-50 overlay; initialQuery, initialTab props |
| Input | SearchInput (search) | `packages/web/lib/components/search/SearchInput.tsx` | Connects to searchStore.setQuery; autoFocus; showSuggestions |
| Tabs | SearchTabs | `packages/web/lib/components/search/SearchTabs.tsx` | Reads searchStore.activeTab; facets, totalCount; uses DS Tabs |
| Results | SearchResults | `packages/web/lib/components/search/SearchResults.tsx` | data, groupedData, isLoading, isError, query |
| Pre-search | RecentSearches | `packages/web/lib/components/search/RecentSearches.tsx` | onSelect callback; shown when query is empty |
| Pre-search | TrendingSearches | `packages/web/lib/components/search/TrendingSearches.tsx` | onSelect callback; shown when query is empty |
| Result section | ItemResultSection | `packages/web/lib/components/search/ItemResultSection.tsx` | Item-type results |
| Result section | MediaResultSection | `packages/web/lib/components/search/MediaResultSection.tsx` | Media-type results |
| Result card | MediaResultCard | `packages/web/lib/components/search/MediaResultCard.tsx` | Single media result |
| Result section | PeopleResultSection | `packages/web/lib/components/search/PeopleResultSection.tsx` | People/user results |
| Result card | PersonResultCard | `packages/web/lib/components/search/PersonResultCard.tsx` | Single person result |
| Empty state | EmptySearchState | `packages/web/lib/components/search/EmptySearchState.tsx` | Shown when results are empty |
| Suggestions | SearchSuggestions | `packages/web/lib/components/search/SearchSuggestions.tsx` | Autocomplete; conditionally rendered |
| Store | searchStore | `packages/shared/stores/searchStore.ts` | query, debouncedQuery, activeTab, filters, page |
| Hook | useGroupedSearch | `packages/web/lib/hooks/useSearch.ts` | Unified search + result grouping; enabled when debouncedQuery.length >= 2 |
| Hook | useSearchURLSync | `packages/web/lib/hooks/useSearchURLSync.ts` | Bidirectional URL ↔ store sync; skipInitialSync on SearchPageClient |

## Layout

### Mobile (default)

```
┌─────────────────────────────┐  fixed inset-0 z-50 bg-background
│ [← back]  [Search input   ]│  ← header: ArrowLeft + SearchInput; border-b
├─────────────────────────────┤
│                             │  scrollable content (calc 100vh - 72px)
│  ── No query state ──       │
│                             │
│  Recent Searches            │  ← RecentSearches (localStorage)
│  #recent1  #recent2         │
│                             │
│  Trending                   │  ← TrendingSearches (popular keywords)
│  #trend1  #trend2  #trend3  │
│                             │
├─────────────────────────────┤
│  ── Active query state ──   │
│                             │
│  Results for "query" (N)    │  ← result count + took_ms
│                             │
│  [All][People][Media][Items]│  ← SearchTabs (DS Tabs, underline variant)
│  ─────                      │    animated sliding underline
│                             │
│  PEOPLE                     │  ← PeopleResultSection
│  [Avatar] Name  @handle     │    PersonResultCard rows
│  [Avatar] Name  @handle     │
│                             │
│  MEDIA                      │  ← MediaResultSection
│  [Thumb] Title  2024        │    MediaResultCard rows
│                             │
│  ITEMS                      │  ← ItemResultSection
│  [Img] Brand / Name  $99    │    item cards
│                             │
│  ── Empty state ──          │
│  [EmptySearchState]         │  ← no results for query
└─────────────────────────────┘
```

### Desktop (>=768px)

Same fixed full-screen layout. Content area uses `max-w-4xl mx-auto` centering. Result sections display in a wider grid.

```
┌──────────────────────────────────────────────────────────────┐
│ [← back]  [Search input — wider                           ]  │
├──────────────────────────────────────────────────────────────┤
│              max-w-4xl centered                              │
│                                                              │
│  Results for "query" (N results in Xms)                      │
│                                                              │
│  [All] [People] [Media] [Items]                              │
│  ────                                                        │
│                                                              │
│  PEOPLE          MEDIA             ITEMS                     │
│  [Card][Card]    [Card][Card]      [Card][Card][Card]        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

| Element | Mobile | Desktop |
|---------|--------|---------|
| Layout | Full-screen fixed overlay | Full-screen fixed overlay |
| Content max-width | Full width px-4 | max-w-4xl centered |
| Tab style | DS Tabs (underline) | DS Tabs (underline) |
| Result layout | Single column sections | Wider grid per section |

## State Transitions

**searchStore** (`packages/shared/stores/searchStore.ts`)

```
idle (query: '')
  → pre-search UI: RecentSearches + TrendingSearches

user types → setQuery(q) [live]
  → debounce → setDebouncedQuery(q) [after 300ms via useGroupedSearch]
  → enabled = debouncedQuery.length >= 2
  → useGroupedSearch fires: GET /api/v1/posts?q=...
  → results rendered in SearchResults

tab switch → setActiveTab(tab) + page reset
  → results refetch for new tab scope

filter change → setFilters(filters) + page reset
  → results refetch with new filters

back button → router.back() + searchStore.resetAll()
  → returns to previous route (typically Home /SCR-DISC-01)
```

**Key store fields:**

| Field | Type | Description |
|-------|------|-------------|
| query | `string` | Live input value (immediate) |
| debouncedQuery | `string` | Debounced for API calls |
| activeTab | `'all' \| 'people' \| 'media' \| 'items'` | Active result tab |
| filters | `SearchFilters` | category, mediaType, context, hasAdopted, sort |
| page | `number` | Current results page (resets on tab/filter change) |

**URL sync (useSearchURLSync):**
- Store → URL: when debouncedQuery/activeTab/filters/page change, `router.replace` updates `?q=&tab=` params
- URL → Store: on mount, reads URLSearchParams and calls `setFromURLParams` (skipInitialSync=true in SearchPageClient, so URL→store runs via initialQuery/initialTab props instead)

## Requirements

### Query Input

- ✅ When user types in search input, the system shall update `searchStore.query` immediately via `setQuery`.
- ✅ When `searchStore.query` is set, the system shall trigger API search when `debouncedQuery.length >= 2` (useGroupedSearch enabled guard).
- ✅ When user taps a recent or trending search term, the system shall populate the input and trigger search via `handleRecentSelect`.

### Results Display

- ✅ When query is empty, the system shall display RecentSearches and TrendingSearches sections.
- ✅ When results are loaded, the system shall display them in tab-separated sections (All, People, Media, Items) via SearchTabs + SearchResults.
- ✅ When user taps a search tab, the system shall call `setActiveTab` and reset page; results refetch for the new scope.
- ✅ When results are loading, the system shall show skeleton placeholders (SearchPageSkeleton via Suspense).
- ✅ When no results match the query, the system shall display EmptySearchState.

### Navigation

- ✅ When search page loads with `?q=` URL parameter, the system shall populate the store from `initialQuery` prop (SSR-extracted).
- ✅ When user taps a result card, the system shall navigate to the corresponding detail page (`/posts/[id]`).
- ✅ When user taps back button, the system shall call `router.back()` and return to the previous screen.
- ✅ When store state changes (debounced query/tab/filters), the system shall update URL via `useSearchURLSync` (replace strategy).

### Error States

- ✅ When search API returns an error, the system shall pass `isError=true` to SearchResults for error display.

## Navigation

| Trigger | Destination | Data Passed |
|---------|-------------|-------------|
| Back button tap | Previous screen (Home `/`) | — |
| Result card tap | `/posts/[id]` or `/images/[id]` | postId / imageId |
| Recent/trending tap | Same page (query populated) | sets searchStore.query |
| Direct URL `?q=value` | `/search` pre-populated | initialQuery → setQuery |

## Error & Empty States

| State | Condition | UI |
|-------|-----------|-----|
| Loading (Suspense) | Initial page mount | SearchPageSkeleton (input + tab + result skeletons) |
| Pre-search | query === '' | RecentSearches + TrendingSearches |
| No results | query set but 0 results | EmptySearchState component |
| API error | Search API fails | isError passed to SearchResults |
| Short query | query.length < 2 | useGroupedSearch disabled; no API call |

---

See: [SCR-DISC-01](SCR-DISC-01-home.md) — Home page (search icon entry point)
See: [FLW-01](../../flows/FLW-01-discovery.md) — Discovery Flow (search state transitions)
See: [store-map.md](../../_shared/store-map.md) — searchStore full field reference
