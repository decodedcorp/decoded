# [SCR-MAG-02] Personal Issue Generation
> Route: `/magazine/personal` | Status: proposed | Updated: 2026-03-05
> Milestone: M7 (AI Magazine & Archive Expansion)
> Flow: FLW-06 (Magazine Rendering Flow — Steps 4-6)

## Purpose

User generates a personalized magazine issue based on their taste profile. The generation process itself is a cinematic "Decoding Ritual" experience — not a passive loading screen, but an engaging showcase of AI analyzing the user's style DNA.

## Design Direction

- **The Decoding Ritual:** User's reference images converge toward screen center with centripetal motion, transforming into style keywords.
- **Minimalist Dashboard:** No complex metrics. AI-derived Style Persona displayed as accent-color typography.
- **Playful Loading:** Variable-weight font animates while displaying analysis phrases ("Analyzing your DNA...", "Curating your layout...").
- **Fake Progress:** `estimated_seconds` drives a front-loaded progress curve (fast 0-80%, slow 80-100%) to reduce perceived wait.
- **Theme:** Deep Black (#050505) / Neon Chartreuse (#eafd67) — consistent with SCR-MAG-01.

## Component Map

| Region | Component | File | Props/Notes |
|--------|-----------|------|-------------|
| Page | PersonalMagazinePage | `packages/web/app/magazine/personal/page.tsx` | async; auth-gated server component |
| Client wrapper | PersonalIssueClient | `packages/web/lib/components/magazine/PersonalIssueClient.tsx` | "use client"; orchestrates generation vs. display |
| Generation UI | DecodingRitual | `packages/web/lib/components/magazine/DecodingRitual.tsx` | Particle field + keyword emergence + progress |
| Particle field | DecodingParticles | `packages/web/lib/components/magazine/DecodingParticles.tsx` | GSAP-driven centripetal particle motion |
| Keyword chips | StyleKeywordChip | `packages/web/lib/components/magazine/StyleKeywordChip.tsx` | Floating entry with accent glow |
| Progress indicator | ProgressGlow | `packages/web/lib/components/magazine/ProgressGlow.tsx` | scaleX based on progress %, accent color bar |
| Variable text | DecodingText | `packages/web/lib/components/magazine/DecodingText.tsx` | Variable font weight animation (300-900) |
| Credit gate | CreditGate | `packages/web/lib/components/magazine/CreditGate.tsx` | Balance check + top-up modal trigger |
| Rendered issue | MagazineRenderer | `packages/web/lib/components/magazine/MagazineRenderer.tsx` | Reused from SCR-MAG-01; renders personal layout_json |
| Bottom nav | NavBar | DS: component-registry | mobile-only; active="magazine" |

> All file paths are proposed (components not yet created). Verify against filesystem before implementation.

## Layout

### Mobile (default)

**State: Credit check / Generation idle**
```
+-------------------------------+
| [< Back]              [X]    |  <- Minimal top bar
+-------------------------------+
|                               |
|  "Generate My Edition"        |  <- Heading, accent color
|                               |
|  Your personalized magazine   |  <- Subtext
|  crafted from your taste DNA  |
|                               |
|  [Credits: 5 remaining]       |  <- creditStore.balance
|                               |
|  [====== Generate ======]     |  <- Primary CTA button
|                               |
+-------------------------------+
| [NavBar]                      |
+-------------------------------+
```

**State: Generating (The Decoding Ritual)**
```
+-------------------------------+
|                               |
|  [DecodingParticles]          |  <- Full-screen particle field
|  images converge to center    |     GSAP random coords -> center
|                               |
|     #Minimal  #Cyberpunk      |  <- StyleKeywordChip emerges
|         #StreetCore           |     accent glow, stagger entry
|                               |
|  "Analyzing your DNA..."      |  <- DecodingText, variable weight
|                               |
|  [====== progress glow ===]   |  <- ProgressGlow bar
|  42%                          |     front-loaded curve
|                               |
+-------------------------------+
```

**State: Ready (Personal issue rendered)**
```
+-------------------------------+
|                               |
| [MagazineRenderer]            |  <- Same renderer as SCR-MAG-01
| personal layout_json +        |     with user-specific theme
| user theme_palette            |
|                               |
| [Regenerate] [Save to         |
|  Collection]                  |  <- Action buttons at bottom
|                               |
+-------------------------------+
| [NavBar]                      |
+-------------------------------+
```

### Desktop (>=768px)

Generation UI centered in max-w-[800px] container. Particle field fills viewport with vignette. Rendered issue uses same MagazineRenderer layout as SCR-MAG-01 desktop. DesktopHeader visible; NavBar hidden.

| Element | Mobile | Desktop |
|---------|--------|---------|
| Header | Minimal back/close bar | DesktopHeader |
| Particle field | Full viewport | Full viewport with vignette |
| Content width | 100% | max-w-[800px] centered (generation), max-w-[1200px] (rendered) |
| Bottom nav | NavBar | Hidden |

## Requirements

### Auth & Credit Gate

- When the page mounts, the system shall check `authStore.selectIsLoggedIn`. If not logged in, the system shall redirect to `/login` with return URL.
- When the user is authenticated, the system shall fetch `GET /api/v1/credits/balance` via `creditStore.fetchBalance()`.
- When `creditStore.balance < 1`, the system shall disable the Generate button and display `CreditGate` with a top-up prompt.
- When `creditStore.balance >= 1`, the system shall enable the Generate button with remaining balance display.

### Generation Trigger

- When the user taps "Generate", the system shall call `POST /api/v1/magazine/personal/generate`.
- When the API responds 202 (queued), the system shall set `magazineStore.personalStatus` to `'generating'` and deduct 1 credit locally via `creditStore.deductLocally(1)`.
- When the API responds 402 (insufficient credits), the system shall display the credit top-up modal and not change state.
- When the API responds with error, the system shall show a retry toast and not deduct credits.

### Decoding Ritual Animation

- When `personalStatus` is `'generating'`, the system shall render `DecodingRitual` as full-screen overlay.
- When the ritual starts, the system shall animate `DecodingParticles` — random image thumbnails moving from edge positions toward screen center using GSAP `to()` with centripetal easing.
- When the backend returns intermediate style keywords (via polling response metadata), the system shall pop `StyleKeywordChip` elements onto screen with accent glow and staggered entry (0.2s interval).
- While generating, the system shall animate `DecodingText` with variable font weight oscillation (300-900) cycling through phrases: "Analyzing your DNA...", "Decoding your style...", "Curating your layout...".
- While generating, the system shall display `ProgressGlow` with front-loaded easing: progress = `estimated_seconds` based, fast 0-80% (cubic-bezier ease-out), slow 80-100% (waiting for real completion).

### Polling

- When generation is queued, the system shall poll `GET /api/v1/magazine/personal` every 3 seconds.
- When the poll returns a `MagazineIssue` (status ready), the system shall set `magazineStore.personalStatus` to `'ready'` and `personalIssue` to the response.
- When polling exceeds 60 seconds without completion, the system shall display "Taking longer than expected..." with option to keep waiting or cancel.
- When the user cancels during generation, the system shall stop polling and refund credit via `creditStore.refund(1)`. Backend generation may complete asynchronously.

### Completion & Display

- When `personalStatus` transitions to `'ready'`, the system shall execute a cinematic crossfade (DecodingRitual fades out 0.8s, MagazineRenderer fades in 0.8s, overlapping 0.3s).
- When the personal issue is displayed, the system shall render it using `MagazineRenderer` (same as SCR-MAG-01) with the user-specific `theme_palette` and `layout_json`.
- When the rendered issue is visible, the system shall display "Regenerate" (costs 1 credit) and "Save to Collection" action buttons.

### Regeneration

- When the user taps "Regenerate", the system shall repeat the generation flow (credit check -> generate -> ritual -> display).
- When regenerating, the system shall use `action_type: "magazine_regenerate"` for credit deduction.

## State

| Store | Usage |
|-------|-------|
| magazineStore | `personalIssue`, `personalStatus` ('idle'/'checking'/'generating'/'ready'/'error'), `gsapTimeline` |
| creditStore | `balance`, `deductLocally()`, `refund()`, `selectCanAfford(1)` |
| authStore | `selectIsLoggedIn` for auth gate |

## Navigation

| Trigger | Destination | Data Passed |
|---------|-------------|-------------|
| Back / X button | `/magazine` (SCR-MAG-01) | - |
| Item tap in rendered issue | `/posts/[id]` (SCR-VIEW-01) | postId, transitionStore |
| "Save to Collection" | `/collection` (SCR-COL-01) | personal issue ID |
| Login redirect | `/login` | returnUrl: `/magazine/personal` |

## Error & Empty States

| State | Condition | UI |
|-------|-----------|-----|
| Loading | Credit balance fetching | Skeleton button + balance placeholder |
| No credits | balance < 1 | CreditGate: "You need 1 credit" + top-up CTA |
| Generating | personalStatus: 'generating' | DecodingRitual full-screen animation |
| Timeout | Polling > 60s | "Taking longer..." message + keep/cancel options |
| Generation error | API 5xx during generate | Retry toast + credit refund |
| Poll error | Network failure during poll | Auto-retry poll silently (3 attempts), then show error |
| Existing issue | personalIssue already exists on mount | Skip generation, show rendered issue directly |

## Animations

| Trigger | Type | Library | Details |
|---------|------|---------|---------|
| Particle field | Centripetal motion | GSAP | Random edges -> center, 2-4s per particle, stagger |
| Keyword emerge | Pop + glow | GSAP | scale 0->1, opacity 0->1, 0.3s + accent box-shadow |
| Variable text | Font weight oscillation | GSAP/CSS | font-variation-settings wght 300-900, 1.5s loop |
| Progress bar | Front-loaded fill | GSAP | scaleX 0->1, cubic-bezier(0.16,1,0.3,1) |
| Completion crossfade | Overlay transition | GSAP | Ritual opacity 1->0 (0.8s), Renderer opacity 0->1 (0.8s), 0.3s overlap |
| Page exit | Context revert | GSAP | gsapContext.revert() on unmount |

---

See: [SCR-MAG-01](SCR-MAG-01-daily-editorial.md) -- Daily editorial (entry point)
See: [SCR-COL-01](../collection/SCR-COL-01-bookshelf.md) -- Collection bookshelf (save destination)
See: [FLW-06](../../flows/FLW-06-magazine-rendering.md) -- Magazine rendering flow (Steps 4-6)
