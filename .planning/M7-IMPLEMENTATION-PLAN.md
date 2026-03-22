# M7 Implementation Plan — AI Magazine & Archive Expansion

> Created: 2026-03-05 | Status: Planning
> Streams: Magazine (MAG), Collection (COL), VTON (VTON)
> Total: 5 Waves, ~60 tasks across 3 parallel streams

## Dependency Overview

```
Wave 0: Shared Foundation (types, API clients, stores, routes)
         |
    +----+----+----+
    |         |         |
Wave 1: [MAG Engine] [COL 3D Shelf] [VTON Drag&Match]   <- parallel streams
    |         |         |
Wave 2: [MAG Screens] [COL Page]    [VTON Screens]      <- parallel streams
    |         |         |
Wave 3: [MAG-02 Ritual] [COL Polish] [VTON Cinematic]   <- parallel streams
    |         |         |
Wave 4: Cross-cutting Integration + NavBar + Entry Points
```

---

## Wave 0: Shared Foundation (Sequential — blocks everything)

All three streams share types, creditStore, and API route patterns. Build once, use everywhere.

| # | Task | File | Size | Depends |
|---|------|------|------|---------|
| 0-1 | Magazine + Credit + VTON types | `lib/api/types.ts` (extend) | M | - |
| 0-2 | Magazine API client | `lib/api/magazine.ts` | M | 0-1 |
| 0-3 | Credits API client | `lib/api/credits.ts` | S | 0-1 |
| 0-4 | VTON API client | `lib/api/vton.ts` | S | 0-1 |
| 0-5 | API barrel export update | `lib/api/index.ts` | S | 0-2,3,4 |
| 0-6 | creditStore (shared) | `lib/stores/creditStore.ts` | M | 0-3 |
| 0-7 | magazineStore | `lib/stores/magazineStore.ts` | L | 0-2 |
| 0-8 | vtonStore | `lib/stores/vtonStore.ts` | M | 0-4 |

**API proxy routes (all parallel, no code dependencies):**

| # | Task | File | Size | Depends |
|---|------|------|------|---------|
| 0-R1 | GET magazine/daily | `app/api/v1/magazine/daily/route.ts` | S | - |
| 0-R2 | GET magazine/personal | `app/api/v1/magazine/personal/route.ts` | S | - |
| 0-R3 | POST magazine/personal/generate | `app/api/v1/magazine/personal/generate/route.ts` | S | - |
| 0-R4 | GET magazine/collection | `app/api/v1/magazine/collection/route.ts` | S | - |
| 0-R5 | DELETE magazine/collection/[issueId] | `app/api/v1/magazine/collection/[issueId]/route.ts` | S | - |
| 0-R6 | GET credits/balance | `app/api/v1/credits/balance/route.ts` | S | - |
| 0-R7 | POST vton/apply | `app/api/v1/vton/apply/route.ts` | S | - |
| 0-R8 | GET vton/result/[taskId] | `app/api/v1/vton/result/[taskId]/route.ts` | S | - |

**Wave 0 parallelism:**
- 0-R1~R8 can ALL run in parallel (8 tasks, all S)
- 0-2, 0-3, 0-4 can run in parallel after 0-1
- 0-6, 0-7, 0-8 can run in parallel after their respective API clients

**Wave 0 critical path:** 0-1 -> 0-2 -> 0-7 (magazineStore is the longest)

---

## Wave 1: Core Engines (3 Parallel Streams)

After Wave 0, all three streams can proceed independently.

### Stream A: Magazine Rendering Engine

| # | Task | File | Size | Depends |
|---|------|------|------|---------|
| A1-1 | ComponentRegistry | `lib/components/magazine/componentRegistry.ts` | S | 0-1 |
| A1-2 | MagazineHero | `lib/components/magazine/MagazineHero.tsx` | M | 0-1 |
| A1-3 | MagazineText | `lib/components/magazine/MagazineText.tsx` | S | 0-1 |
| A1-4 | MagazineItemCard | `lib/components/magazine/MagazineItemCard.tsx` | M | 0-1 |
| A1-5 | MagazineDivider | `lib/components/magazine/MagazineDivider.tsx` | S | 0-1 |
| A1-6 | MagazineQuote | `lib/components/magazine/MagazineQuote.tsx` | S | 0-1 |
| A1-7 | MagazineGallery | `lib/components/magazine/MagazineGallery.tsx` | M | 0-1 |
| A1-8 | MagazineSkeleton | `lib/components/magazine/MagazineSkeleton.tsx` | S | - |
| A1-9 | **MagazineRenderer** (core) | `lib/components/magazine/MagazineRenderer.tsx` | **L** | A1-1~7 |

> A1-2~8 are ALL parallelizable. A1-9 assembles them.

### Stream B: Collection 3D Shelf

| # | Task | File | Size | Depends |
|---|------|------|------|---------|
| B1-1 | collectionStore | `lib/stores/collectionStore.ts` | M | 0-2 |
| B1-2 | useCollection hook | `lib/hooks/useCollection.ts` | S | 0-2 |
| B1-3 | **IssueSpine** (3D core) | `lib/components/collection/IssueSpine.tsx` | **L** | 0-1 |
| B1-4 | IssuePreviewCard | `lib/components/collection/IssuePreviewCard.tsx` | M | 0-1 |
| B1-5 | ShelfRow | `lib/components/collection/ShelfRow.tsx` | M | B1-3 |
| B1-6 | EmptyBookshelf | `lib/components/collection/EmptyBookshelf.tsx` | S | - |
| B1-7 | CollectionFilterBar | `lib/components/collection/CollectionFilterBar.tsx` | S | - |
| B1-8 | CollectionShareSheet | `lib/components/collection/CollectionShareSheet.tsx` | S | - |

> B1-3, B1-4, B1-6, B1-7, B1-8 are parallelizable. B1-5 depends on B1-3.

### Stream C: VTON Drag & Match

| # | Task | File | Size | Depends |
|---|------|------|------|---------|
| C1-1 | useVtonPhotoUpload hook | `lib/hooks/useVtonPhotoUpload.ts` | M | 0-8 |
| C1-2 | useVtonPolling hook | `lib/hooks/useVtonPolling.ts` | M | 0-4, 0-8 |
| C1-3 | PhotoDropZone | `lib/components/vton/PhotoDropZone.tsx` | S | - |
| C1-4 | **DraggableItemCard** | `lib/components/vton/DraggableItemCard.tsx` | **M** | 0-8 |
| C1-5 | UserPhotoPanel | `lib/components/vton/UserPhotoPanel.tsx` | M | C1-1 |
| C1-6 | ItemSidebar | `lib/components/vton/ItemSidebar.tsx` | M | C1-4 |
| C1-7 | BeforeAfterSlider | `lib/components/vton/BeforeAfterSlider.tsx` | M | - |

> C1-3, C1-4, C1-7 are parallelizable. C1-5 needs C1-1. C1-6 needs C1-4.

---

## Wave 2: Screen Assembly (3 Parallel Streams)

### Stream A: SCR-MAG-01 Daily Editorial

| # | Task | File | Size | Depends |
|---|------|------|------|---------|
| A2-1 | GenerateMyEdition CTA | `lib/components/magazine/GenerateMyEdition.tsx` | S | 0-6 |
| A2-2 | Magazine layout | `app/magazine/layout.tsx` | S | - |
| A2-3 | **SCR-MAG-01 page** | `app/magazine/page.tsx` | **M** | 0-7, A1-8, A1-9, A2-1, A2-2 |

### Stream B: SCR-COL-01 Bookshelf

| # | Task | File | Size | Depends |
|---|------|------|------|---------|
| B2-1 | **BookshelfView** | `lib/components/collection/BookshelfView.tsx` | **L** | B1-3~8 |
| B2-2 | CollectionClient | `lib/components/collection/CollectionClient.tsx` | L | B1-1,2, B2-1 |
| B2-3 | **SCR-COL-01 page** | `app/collection/page.tsx` | **S** | B2-2 |

### Stream C: SCR-VTON-01 Try-on Studio

| # | Task | File | Size | Depends |
|---|------|------|------|---------|
| C2-1 | VtonCreditConfirm | `lib/components/vton/VtonCreditConfirm.tsx` | M | 0-6, 0-8 |
| C2-2 | VtonResultViewer | `lib/components/vton/VtonResultViewer.tsx` | M | C1-7, 0-8 |
| C2-3 | **VTON page shell** | `app/vton/page.tsx` | **S** | - |

---

## Wave 3: Generation & Polish (3 Parallel Streams)

### Stream A: SCR-MAG-02 Decoding Ritual

| # | Task | File | Size | Depends |
|---|------|------|------|---------|
| A3-1 | DecodingParticles | `lib/components/magazine/DecodingParticles.tsx` | L | - |
| A3-2 | StyleKeywordChip | `lib/components/magazine/StyleKeywordChip.tsx` | S | - |
| A3-3 | ProgressGlow | `lib/components/magazine/ProgressGlow.tsx` | S | - |
| A3-4 | DecodingText | `lib/components/magazine/DecodingText.tsx` | S | - |
| A3-5 | CreditGate | `lib/components/magazine/CreditGate.tsx` | S | 0-6 |
| A3-6 | **DecodingRitual** (assembly) | `lib/components/magazine/DecodingRitual.tsx` | **L** | A3-1~4 |
| A3-7 | PersonalIssueClient | `lib/components/magazine/PersonalIssueClient.tsx` | L | 0-6,7, A1-9, A3-5,6 |
| A3-8 | **SCR-MAG-02 page** | `app/magazine/personal/page.tsx` | **M** | A3-7 |

> A3-1~5 are ALL parallelizable. A3-6 assembles 1-4.

### Stream B: Collection Polish

| # | Task | File | Size | Depends |
|---|------|------|------|---------|
| B3-1 | Delete confirmation + fall animation | Modify B2-1, B2-2 | M | B2-1 |
| B3-2 | Date/mood grouping logic | Modify B1-1, B2-1 | M | B2-1 |

### Stream C: VTON Cinematic + Result

| # | Task | File | Size | Depends |
|---|------|------|------|---------|
| C3-1 | **VtonCinematicSequence** (5-stage) | `lib/components/vton/VtonCinematicSequence.tsx` | **L** | 0-8 |
| C3-2 | **VtonStudio** (orchestrator) | `lib/components/vton/VtonStudio.tsx` | **L** | C1-*, C2-*, C3-1 |
| C3-3 | Error/edge-case states | Modify C3-2 | M | C3-2 |
| C3-4 | Responsive layout + theme | Modify C3-2, C1-5, C1-6 | M | C3-2 |

---

## Wave 4: Cross-cutting Integration

| # | Task | File | Size | Depends |
|---|------|------|------|---------|
| X4-1 | NavBar: add Magazine tab | Modify DS NavBar | S | A2-3 |
| X4-2 | Post detail: "Try On" CTA | Modify detail components | S | C2-3 |
| X4-3 | Magazine: "Save to Collection" | Modify A3-7 | S | B2-3 |
| X4-4 | Magazine item card -> post detail | Verify A1-4 navigation | S | A2-3 |
| X4-5 | Profile: credit balance display | Modify profile components | S | 0-6 |
| X4-6 | Barrel exports (magazine, collection, vton) | index.ts files | S | All |

---

## Parallelism Summary

### Maximum concurrent tasks per wave

| Wave | Stream A (MAG) | Stream B (COL) | Stream C (VTON) | Shared | Max Parallel |
|------|---------------|----------------|-----------------|--------|-------------|
| 0 | - | - | - | 16 tasks | **8** (routes) + **3** (API clients) |
| 1 | 8 tasks | 7 tasks | 7 tasks | - | **~10** (leaf components across streams) |
| 2 | 3 tasks | 3 tasks | 3 tasks | - | **~5** (one assembler per stream + leaves) |
| 3 | 8 tasks | 2 tasks | 4 tasks | - | **~8** (ritual sub-components + cinematic) |
| 4 | - | - | - | 6 tasks | **6** (all independent) |

### Stream-level parallelism

After Wave 0 completes, **all three streams are fully independent** until Wave 4 integration.
A single developer can work one stream at a time. With 2-3 developers, streams run in true parallel.

---

## Critical Paths (per stream)

**Stream A (Magazine):** 0-1 -> 0-2 -> 0-7 -> A1-1 -> A1-9 -> A2-3 -> A3-6 -> A3-7 -> A3-8
**Stream B (Collection):** 0-1 -> 0-2 -> B1-1 -> B1-3 -> B1-5 -> B2-1 -> B2-2 -> B2-3
**Stream C (VTON):** 0-1 -> 0-4 -> 0-8 -> C1-2 -> C3-1 -> C3-2 -> C3-3

**Overall critical path:** Stream A (Magazine) is longest due to MagazineRenderer + DecodingRitual assembly chain.

---

## Size Distribution

| Size | Count | % |
|------|-------|---|
| S | ~25 | 42% |
| M | ~22 | 37% |
| L | ~8 | 13% |
| Total | ~60 | 100% |

**L tasks (highest risk):**
1. magazineStore (polling + timeline management)
2. MagazineRenderer (JSON -> GSAP pipeline)
3. IssueSpine (3D CSS + GSAP perspective)
4. DecodingParticles (centripetal particle field)
5. DecodingRitual (animation orchestration)
6. PersonalIssueClient (state machine + crossfade)
7. VtonCinematicSequence (5-stage animation)
8. VtonStudio (full orchestrator)

---

## Recommended Execution Order (Solo Developer)

1. **Wave 0** (1-2 days): Types + API clients + stores + all routes
2. **Stream A Wave 1** (2-3 days): Magazine components + MagazineRenderer
3. **Stream A Wave 2** (1 day): SCR-MAG-01 page assembly
4. **Stream B Wave 1-2** (2-3 days): Collection components + BookshelfView + page
5. **Stream A Wave 3** (2-3 days): Decoding Ritual + SCR-MAG-02
6. **Stream C Wave 1-3** (3-4 days): VTON components + cinematic + studio
7. **Wave 4** (1 day): Integration + NavBar + entry points

---

*All file paths relative to `packages/web/`*
