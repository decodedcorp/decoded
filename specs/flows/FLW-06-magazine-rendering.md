# [FLW-06] Magazine Rendering Flow

> Screens: SCR-MAG-01 -> SCR-MAG-02 | Updated: 2026-03-05
> Builds on: NEXT-03 (Dynamic UI Stage 2-3), NEXT-01 (Service Identity)

## Journey

User enters the magazine tab and views an AI-generated editorial layout rendered dynamically from backend Layout JSON. The system interprets JSON coordinates, typography, and animation directives to produce a cinematic magazine experience via GSAP.

## Screen Sequence

```
[Home / Nav]
     |
     v
[SCR-MAG-01: AI Daily Editorial] --"My Issue"--> [SCR-MAG-02: Personalized Issue]
     |                                                  |
     v                                                  v
[SCR-VIEW-01: Post Detail]                    [Generation Pending UI]
     |                                                  |
     v                                                  v
[FLW-02: Detail Flow]                         [SCR-MAG-02: Rendered Result]
```

## Steps

### Step 1: Magazine Tab Entry

- **Screen:** SCR-MAG-01 (`/magazine`)
- **Trigger:** User taps Magazine tab in NavBar or navigates via deep link
- **State change:** `magazineStore.currentIssue` set to null, `isLoading` set to true
- **Data:** GET `/api/v1/magazine/daily` -> `MagazineIssue` with `layout_json`
- **Next:** -> Step 2 (on success) | -> Error state with retry (on failure)

### Step 2: Layout JSON Interpretation

- **Screen:** SCR-MAG-01 (`/magazine`)
- **Trigger:** API response received with `layout_json`
- **State change:** `magazineStore.currentIssue` populated, `isLoading` false
- **Processing:**
  1. Parse `layout_json.components[]` array
  2. Map each component `type` to a React component via `componentRegistry`
  3. Apply absolute positioning from `x, y, w, h` values (percentage-based)
  4. Create GSAP timeline with staggered entrances per `animation_type`
- **Next:** -> Step 3 (rendering complete)

### Step 3: Interactive Magazine View

- **Screen:** SCR-MAG-01 (`/magazine`)
- **Trigger:** GSAP entrance animation completes
- **Interactions:**
  - Scroll: parallax layers shift at different rates via GSAP ScrollTrigger
  - Tap item card: navigate to `/posts/[id]` (FLW-02 entry)
  - Tap "My Issue" CTA: navigate to SCR-MAG-02
  - Swipe horizontal: navigate to next/prev editorial section
- **Next:** -> SCR-VIEW-01 (item tap) | -> Step 4 (My Issue tap)

### Step 4: Personal Issue Request

- **Screen:** SCR-MAG-02 (`/magazine/personal`)
- **Trigger:** User taps "My Issue" from SCR-MAG-01 or navigates directly
- **Auth gate:** `authStore.selectIsLoggedIn` required (not guest)
- **State change:** `magazineStore.personalStatus` set to 'checking'
- **Data:** GET `/api/v1/magazine/personal` -> `PersonalIssue | null`
- **Next:** -> Step 5 (issue exists) | -> Step 6 (generation needed)

### Step 5: Personal Issue Display

- **Screen:** SCR-MAG-02 (`/magazine/personal`)
- **Trigger:** Personal issue data received (previously generated)
- **State change:** `magazineStore.personalIssue` populated
- **Processing:** Same Layout JSON interpretation as Step 2, with user-specific theme_palette
- **Next:** -> Flow end (user browses their issue)

### Step 6: Issue Generation

- **Screen:** SCR-MAG-02 (`/magazine/personal`)
- **Trigger:** No existing personal issue, or user requests regeneration
- **State change:** `magazineStore.personalStatus` set to 'generating'
- **Data:** POST `/api/v1/magazine/personal/generate` -> `{ status: 'queued', estimated_seconds: N }`
- **UI:** Generation skeleton with progress indicator (animated book-building)
- **Polling:** GET `/api/v1/magazine/personal` every 3s until status: 'ready'
- **Credit:** Deducts 1 magazine credit from `creditStore.balance`
- **Next:** -> Step 5 (generation complete) | -> Error with retry (timeout/failure)

## State Transitions

| From | Event | To | Side Effect |
|------|-------|----|-------------|
| idle | magazine tab entry | loading | GET /api/v1/magazine/daily |
| loading | daily issue received | rendering | Parse layout_json, build GSAP timeline |
| rendering | GSAP complete | interactive | User can scroll, tap, navigate |
| interactive | "My Issue" tap | personal_checking | GET /api/v1/magazine/personal |
| personal_checking | issue exists | personal_rendering | Parse personal layout_json |
| personal_checking | no issue | generating | POST /api/v1/magazine/personal/generate |
| generating | poll success | personal_rendering | Parse generated layout_json |
| any | network error | error | Show retry toast |

## Shared Data

| Data | Source | Consumed By |
|------|--------|-------------|
| layout_json | Magazine API response | Layout interpreter (Step 2) |
| theme_palette | MagazineIssue.theme_palette | GSAP color animations, CSS custom properties |
| component type | layout_json.components[].type | componentRegistry mapping |
| animation_type | layout_json.components[].animation_type | GSAP timeline configuration |
| post references | layout_json.components[].post_id | Navigation to FLW-02 detail flow |

## Layout JSON Contract

```typescript
interface LayoutComponent {
  type: 'hero-image' | 'text-block' | 'item-card' | 'divider' | 'quote' | 'grid-gallery';
  x: number;      // percentage (0-100) from left
  y: number;      // percentage (0-100) from top
  w: number;      // percentage width
  h: number;      // percentage height
  animation_type: 'fade-up' | 'scale-in' | 'slide-left' | 'parallax' | 'none';
  animation_delay?: number; // seconds, for stagger timing
  data: Record<string, unknown>; // component-specific payload
}

interface LayoutJSON {
  version: 1;
  viewport: 'mobile' | 'desktop';  // layout optimized for
  components: LayoutComponent[];
}
```

## Component Registry Mapping

| layout type | React Component | GSAP Preset |
|-------------|----------------|-------------|
| hero-image | MagazineHero | scale 1.1->1, opacity 0->1, duration 1.8s |
| text-block | MagazineText | fade-up, y 30->0, duration 0.6s |
| item-card | MagazineItemCard | slide-left, x 40->0, duration 0.5s |
| divider | MagazineDivider | scale-x 0->1, duration 0.4s |
| quote | MagazineQuote | fade-up + parallax scroll offset |
| grid-gallery | MagazineGallery | stagger children, 0.1s interval |

## Error Recovery

| Error Point | Recovery | Fallback |
|-------------|----------|----------|
| Daily issue fetch fails | Retry toast + manual retry button | Show cached previous issue if available |
| Layout JSON parse error | Log error, skip malformed component | Render remaining valid components |
| Personal issue generation timeout (>60s) | Show "Taking longer than expected" + keep polling | Allow user to cancel and return to daily |
| Credit insufficient | Show credit purchase prompt | Block generation, show daily issue instead |
| GSAP animation error | Catch in timeline callback, render without animation | Static layout (no animation) |

---

See: [SCR-MAG-01](../screens/magazine/SCR-MAG-01-daily-editorial.md) -- Daily editorial screen
See: [SCR-MAG-02](../screens/magazine/SCR-MAG-02-personal-issue.md) -- Personal issue screen
See: [NEXT-03](../_next/NEXT-03-dynamic-ui.md) -- Dynamic UI progression (Stage 2-3 scope)
See: [FLW-02](FLW-02-detail.md) -- Detail flow (item tap destination)
