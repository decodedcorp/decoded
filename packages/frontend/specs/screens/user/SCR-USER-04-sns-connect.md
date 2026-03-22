# [SCR-USER-04] SNS Connect & Style Sources
> Route: `/settings/connect` | Status: proposed | Updated: 2026-03-05
> Milestone: M8 (SNS Integration & Style Personalization)
> Flow: FLW-07 (SNS Data Ingestion Flow)

## Purpose

User manages SNS connections and style reference sources that power their personalized magazine. Supports Pinterest OAuth, Instagram (official + crawling), and direct image upload as fallback.

## Design Direction

- **Minimal & Trust-First:** Deep Black (#050505) / Neon Chartreuse (#eafd67) theme. Emphasize data privacy with clear consent messaging.
- **Progressive Disclosure:** Show connection status first, expand to details on tap.
- **Status-Driven:** Each SNS card shows connection state, last sync time, and image count.

## Component Map

| Region | Component | File | Props/Notes |
|--------|-----------|------|-------------|
| Page | SnsConnectPage | `packages/web/app/settings/connect/page.tsx` | async; auth-gated server component |
| Client wrapper | SnsConnectClient | `packages/web/lib/components/settings/SnsConnectClient.tsx` | "use client"; orchestrates all connections |
| SNS card | SnsConnectCard | `packages/web/lib/components/settings/SnsConnectCard.tsx` | provider, status, onConnect, onDisconnect |
| Board selector | PinterestBoardSelector | `packages/web/lib/components/settings/PinterestBoardSelector.tsx` | BottomSheet with board list + checkboxes |
| IG username input | InstagramUsernameInput | `packages/web/lib/components/settings/InstagramUsernameInput.tsx` | Username field + consent checkbox |
| Upload zone | StyleSourceUploader | `packages/web/lib/components/settings/StyleSourceUploader.tsx` | Multi-image dropzone (max 20) |
| Sync status | SyncProgressIndicator | `packages/web/lib/components/settings/SyncProgressIndicator.tsx` | Progress bar + status text |
| Style preview | StyleProfilePreview | `packages/web/lib/components/settings/StyleProfilePreview.tsx` | Keywords, colors, brands display |
| Bottom nav | NavBar | DS: component-registry | mobile-only; active="profile" |

> All file paths are proposed (components not yet created). Verify against filesystem before implementation.

## Layout

### Mobile (default)

**State: No connections**
```
+-------------------------------+
| [< Back]    Style Sources     |
+-------------------------------+
|                               |
|  Connect your style universe  |  <- Heading
|  to get a personalized        |
|  magazine just for you        |  <- Subtext
|                               |
|  +---------------------------+|
|  | [P logo] Pinterest        ||  <- SnsConnectCard
|  | Connect your boards       ||
|  | [====== Connect ======]   ||
|  +---------------------------+|
|                               |
|  +---------------------------+|
|  | [IG logo] Instagram       ||  <- SnsConnectCard
|  | Share your style feed     ||
|  | [====== Connect ======]   ||
|  +---------------------------+|
|                               |
|  +---------------------------+|
|  | [+] Direct Upload         ||  <- StyleSourceUploader
|  | Upload style images       ||
|  | [====== Upload =======]   ||
|  +---------------------------+|
|                               |
+-------------------------------+
| [NavBar]                      |
+-------------------------------+
```

**State: Pinterest connected + syncing**
```
+-------------------------------+
| [< Back]    Style Sources     |
+-------------------------------+
|                               |
|  +---------------------------+|
|  | [P] Pinterest  [Connected]||  <- Green badge
|  | @username | 3 boards      ||
|  | Last sync: 2m ago         ||
|  | [Manage Boards] [Disconnect]|
|  +---------------------------+|
|                               |
|  +---------------------------+|
|  | Syncing...   42/100       ||  <- SyncProgressIndicator
|  | [======-------- progress] ||
|  | Fetching pin images...    ||
|  +---------------------------+|
|                               |
|  +---------------------------+|
|  | [IG] Instagram            ||
|  | [====== Connect ======]   ||
|  +---------------------------+|
|                               |
+-------------------------------+
```

**State: Instagram crawling consent**
```
+-------------------------------+
| [< Back]    Style Sources     |
+-------------------------------+
|                               |
|  +---------------------------+|
|  | [IG] Instagram            ||
|  |                           ||
|  | Your username:            ||
|  | [@________________]       ||  <- InstagramUsernameInput
|  |                           ||
|  | [x] I authorize decoded   ||  <- Consent checkbox
|  |     to analyze my public  ||
|  |     posts for style       ||
|  |     profiling. (Privacy)  ||  <- Link to privacy policy
|  |                           ||
|  | [====== Analyze ======]   ||
|  +---------------------------+|
|                               |
+-------------------------------+
```

**State: Style profile ready**
```
+-------------------------------+
| [< Back]    Style Sources     |
+-------------------------------+
|                               |
|  Your Style DNA              |  <- Heading
|                               |
|  +---------------------------+|
|  | StyleProfilePreview       ||
|  | #Minimal #StreetCore      ||  <- Persona keywords
|  | #Cyberpunk #Oversized     ||
|  |                           ||
|  | Colors:                   ||
|  | [#1a1a1a][#eafd67][#fff]  ||  <- Color swatches
|  |                           ||
|  | Brands: Nike, Zara, COS   ||
|  | Based on 47 images        ||
|  +---------------------------+|
|                               |
|  [Re-analyze] [Generate       |
|   My Magazine]                |  <- CTA to SCR-MAG-02
|                               |
|  --- Connected Sources ---    |
|  [P] Pinterest   [Connected] |
|  [IG] Instagram  [Connected] |
|  [+] 5 uploaded              |
|                               |
+-------------------------------+
```

### Desktop (>=768px)

Content area max-w-[680px] centered. SNS cards in 2-column grid. Style profile preview spans full width. DesktopHeader visible; NavBar hidden.

| Element | Mobile | Desktop |
|---------|--------|---------|
| Header | Back + title bar | DesktopHeader |
| SNS cards | Stacked | 2-column grid |
| Content width | 100% | max-w-[680px] centered |
| Bottom nav | NavBar visible | NavBar hidden |

## Requirements

### Auth Gate

- When the page mounts, the system shall check `authStore.selectIsLoggedIn`. If not logged in, redirect to `/login` with return URL.
- When authenticated, the system shall fetch `GET /api/v1/users/me/social` to display connection states.

### Pinterest Connection

- When the user taps "Connect" on Pinterest card, the system shall call `GET /api/v1/auth/pinterest` and redirect to the returned authorization URL.
- When Pinterest OAuth completes successfully, the system shall display `PinterestBoardSelector` as a BottomSheet.
- When the user selects boards and confirms, the system shall call `POST /api/v1/users/me/social/sync` with `{ provider: 'pinterest', board_ids: [...] }`.
- When sync is in progress, the system shall display `SyncProgressIndicator` with fetched/total count.

### Instagram Connection (Tier 1 - Official)

- When the user taps "Connect" on Instagram card and has a Professional account, the system shall redirect to Instagram OAuth.
- When OAuth completes, the system shall fetch recent media via Graph API and save to `user_style_references`.

### Instagram Connection (Tier 2 - Crawling)

- When the user taps "Connect" on Instagram card and selects "General account", the system shall display `InstagramUsernameInput`.
- When the user enters username, the system shall require the consent checkbox to be checked before enabling the "Analyze" button.
- When the user taps "Analyze", the system shall call `POST /api/v1/users/me/social/sync` with `{ provider: 'instagram', username: '...', consent: true }`.
- When the server-side crawl is in progress, the system shall display `SyncProgressIndicator`.
- When the crawl fails (blocked/timeout), the system shall suggest direct upload as fallback.

### Direct Upload

- When the user taps "Upload" on the direct upload card, the system shall display a multi-image dropzone (max 20 images, max 5MB each).
- When images are selected, the system shall upload to Supabase Storage and save references to `user_style_references` with `source: 'upload'`.

### Sync & Analysis

- When image collection completes (any source), the system shall automatically trigger AI analysis.
- While AI analysis runs, the system shall display progress with status text ("Analyzing your DNA...", "Extracting style keywords...").
- When analysis completes, the system shall display `StyleProfilePreview` with persona keywords, color palette, and brand affinities.

### Disconnect

- When the user taps "Disconnect" on a connected SNS, the system shall confirm with a dialog: "This will remove all style data from this source."
- When confirmed, the system shall call `DELETE /api/v1/users/me/social/:provider` which CASCADE-deletes tokens + references.
- When a source is disconnected, the system shall re-trigger AI analysis on remaining sources (if any).

## State

| Store | Usage |
|-------|-------|
| socialStore | `connections[]`, `syncStatus`, `syncProgress`, `styleProfile`, `selectedBoards` |
| authStore | `selectIsLoggedIn` for auth gate |

## Navigation

| Trigger | Destination | Data Passed |
|---------|-------------|-------------|
| Back button | `/profile` (SCR-USER-02) | - |
| "Generate My Magazine" CTA | `/magazine/personal` (SCR-MAG-02) | - |
| Privacy policy link | External privacy policy page | - |
| Login redirect | `/login` | returnUrl: `/settings/connect` |

## Error & Empty States

| State | Condition | UI |
|-------|-----------|-----|
| Loading | Fetching connection states | Skeleton cards |
| No connections | No SNS connected, no uploads | Welcome message + connect CTAs |
| OAuth error | Pinterest/IG OAuth fails | Error toast + retry option |
| Crawl blocked | IG returns 403/429 | "Unable to access. Try direct upload instead." |
| Crawl timeout | No response in 30s | "Connection timed out. Try again or upload directly." |
| Insufficient images | < 5 images from source | Warning: "Add more images for better analysis" |
| Analysis error | Gemini API failure | Retry toast |
| Profile ready | Style profile exists | StyleProfilePreview + "Generate My Magazine" CTA |

## Animations

| Trigger | Type | Library | Details |
|---------|------|---------|---------|
| Card mount | Stagger fade-up | GSAP | 0.1s stagger per card |
| Connection success | Badge pop | GSAP | scale 0->1, green badge |
| Sync progress | Bar fill | CSS transition | width 0->100% |
| Profile reveal | Expand + fade | GSAP | height auto, opacity 0->1, 0.5s |
| Keyword chips | Pop-in | GSAP | scale 0->1, 0.2s stagger |

---

See: [FLW-07](../../flows/FLW-07-sns-ingestion.md) -- SNS data ingestion flow
See: [SCR-MAG-02](../magazine/SCR-MAG-02-personal-issue.md) -- Personal issue generation (consumer)
See: [SCR-USER-02](SCR-USER-02-profile.md) -- Profile page (entry point)
