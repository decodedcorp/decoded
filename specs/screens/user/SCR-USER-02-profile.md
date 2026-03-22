# SCR-USER-02: Profile Screen

**ID:** SCR-USER-02
**Route:** `/profile`
**Status:** Partially Implemented (real user/stats data; mock activity, badges, rankings, follow counts)
**Flow:** FLW-04 — User Authentication

> See: [FLW-04](../../flows/FLW-04-user.md) | [SCR-USER-01](./SCR-USER-01-login.md) | [SCR-USER-03](./SCR-USER-03-earnings.md) | [store-map](../../_shared/store-map.md)

---

## Purpose

User views their own profile with contribution stats, earned badges, rankings, and tabbed activity history; edit modal allows updating name, bio, and avatar.

---

## Component Map

| Component | Path | Data |
|-----------|------|------|
| ProfilePage | `packages/web/app/profile/page.tsx` | SSR shell |
| ProfileClient | `packages/web/app/profile/ProfileClient.tsx` | Orchestrator — error/loading routing |
| ProfileHeader | `packages/web/lib/components/profile/ProfileHeader.tsx` | Avatar + name — REAL (useMe) |
| ProfileBio | `packages/web/lib/components/profile/ProfileBio.tsx` | Bio text — REAL (useMe) |
| FollowStats | `packages/web/lib/components/profile/FollowStats.tsx` | Followers/following — MOCK (hardcoded defaults) |
| StatsCards | `packages/web/lib/components/profile/StatsCards.tsx` | Posts/Solutions/Points — REAL (useUserStats) |
| BadgeGrid | `packages/web/lib/components/profile/BadgeGrid.tsx` | Earned badges — MOCK (MOCK_BADGES) |
| BadgeModal | `packages/web/lib/components/profile/BadgeModal.tsx` | Badge detail popup — MOCK |
| RankingList | `packages/web/lib/components/profile/RankingList.tsx` | Leaderboard rows — MOCK (MOCK_RANKINGS) |
| ActivityTabs | `packages/web/lib/components/profile/ActivityTabs.tsx` | Tab bar — REAL (UI only) |
| ActivityContent | `packages/web/lib/components/profile/ActivityContent.tsx` | Tab content router — REAL (UI only) |
| PostsGrid | `packages/web/lib/components/profile/PostsGrid.tsx` | Posts tab — MOCK (MOCK_POSTS) |
| SpotsList | `packages/web/lib/components/profile/SpotsList.tsx` | Spots tab — MOCK (MOCK_SPOTS) |
| SolutionsList | `packages/web/lib/components/profile/SolutionsList.tsx` | Solutions tab — MOCK (MOCK_SOLUTIONS) |
| SavedGrid | `packages/web/lib/components/profile/SavedGrid.tsx` | Saved tab — MOCK (MOCK_SAVED) |
| ProfileEditModal | `packages/web/lib/components/profile/ProfileEditModal.tsx` | Edit form — REAL (PATCH /api/v1/users/me) |
| ProfileDesktopLayout | `packages/web/lib/components/profile/ProfileDesktopLayout.tsx` | Desktop 2-col layout |
| DS ProfileHeaderCard | `packages/web/lib/design-system/profile-header-card.tsx` | Header card primitive |
| DS StatCard | `packages/web/lib/design-system/stat-card.tsx` | Stat card primitive |
| DS RankingItem | `packages/web/lib/design-system/ranking-item.tsx` | Ranking row primitive |
| DS Tabs | `packages/web/lib/design-system/tabs.tsx` | Tab bar primitive |

---

## Layout — Mobile

```
┌──────────────────────────────────────┐
│  ←  Profile   [share]  [settings⚙]  │  sticky header (md:hidden)
├──────────────────────────────────────┤
│  [avatar 64px]  [display name]       │  ProfileHeader
│                 [@username]          │
│  [bio text]                          │  ProfileBio
│  1.2K followers | 567 following      │  FollowStats (MOCK)
│  ┌───────┬───────────┬────────────┐  │
│  │  127  │    89     │   ₩45,000  │  │  StatsCards (Posts/Solutions/Points)
│  │ Posts │ Solutions │   Points   │  │  Posts → alert, Points → alert
│  └───────┴───────────┴────────────┘  │
│  [BadgeGrid horizontal scroll]       │  MOCK_BADGES
│  [RankingList]                       │  MOCK_RANKINGS (mobile hidden)
│  [Posts] [Spots] [Solutions] [Saved] │  ActivityTabs
│  [tab content]                       │  ActivityContent (all MOCK)
└──────────────────────────────────────┘
```

---

## Layout — Desktop (>=768px, delta from mobile)

`ProfileDesktopLayout` renders two-column side-by-side:
- **Left sidebar (w-80):** ProfileHeader (avatar + name + stats inside ProfileHeaderCard)
- **Right main (flex-1):** BadgeGrid + RankingList + ActivityTabs + ActivityContent

---

## Real vs Mock Data Inventory

| Section | Hook / Source | API | Status |
|---------|---------------|-----|--------|
| User name, username, avatar | `useMe()` | `GET /api/v1/users/me` | REAL |
| Bio text | `useMe()` | `GET /api/v1/users/me` | REAL |
| Posts count, Solutions count, Points | `useUserStats()` | `GET /api/v1/users/me/stats` | REAL |
| Profile edit (name, bio, avatar URL) | `useUpdateProfile()` | `PATCH /api/v1/users/me` | REAL |
| Followers, following counts | FollowStats defaults | None | MOCK |
| Badges | `MOCK_BADGES` (profileStore) | None | MOCK |
| Rankings | `MOCK_RANKINGS` (profileStore) | None | MOCK |
| Activity > Posts | `MOCK_POSTS` (PostsGrid) | None | MOCK |
| Activity > Spots | `MOCK_SPOTS` (SpotsList) | None | MOCK |
| Activity > Solutions | `MOCK_SOLUTIONS` (SolutionsList) | None | MOCK |
| Activity > Saved | `MOCK_SAVED` (SavedGrid) | None | MOCK |

---

## profileStore Fields

| Field | Type | Purpose |
|-------|------|---------|
| `badgeModalMode` | `BadgeModalMode` ("single" \| "all" \| null) | Controls BadgeModal open state |
| `selectedBadge` | `Badge \| null` | Badge passed to detail modal |

**Local state in ProfileClient (NOT profileStore):**

| Field | Type | Purpose |
|-------|------|---------|
| `activeTab` | `ActivityTab` (useState) | Active activity tab |
| `isEditModalOpen` | `boolean` (useState) | ProfileEditModal visibility |

---

## Auth Pattern

No middleware protects `/profile`. Auth is API-response-driven:
- `useMe()` or `useUserStats()` fails (any error) → `ProfileError` component renders with retry button
- No `selectIsAuthenticated` check in component code — purely server-response-driven
- No redirect to `/login` on 401; user sees error state with retry

---

## ProfileEditModal Fields

| Field | Input | Validation | API Field |
|-------|-------|------------|-----------|
| Display Name | text (max 50) | ≥2 chars required | `display_name` |
| Bio | textarea (max 200) | 0-200 chars | `bio` |
| Avatar URL | url input | Optional | `avatar_url` |

Submit → `PATCH /api/v1/users/me` → React Query cache update + profileStore sync.

---

## Activity Tabs

| Tab | Component | Data | Status |
|-----|-----------|------|--------|
| Posts | PostsGrid | MOCK_POSTS (6 items, picsum URLs) | MOCK |
| Spots | SpotsList | MOCK_SPOTS (3 items, picsum URLs) | MOCK |
| Solutions | SolutionsList | MOCK_SOLUTIONS (3 items, picsum URLs) | MOCK |
| Saved | SavedGrid | MOCK_SAVED (4 items, picsum URLs) | MOCK |

---

## Requirements

- When authenticated user visits `/profile`, the system shall fetch user info via `useMe()` and stats via `useUserStats()`. — **IMPL**
- When API returns any error, the system shall show `ProfileError` component with retry button (not redirect to login). — **IMPL**
- When user taps Settings icon, the system shall open `ProfileEditModal`. — **IMPL**
- When user saves profile edits, the system shall call `PATCH /api/v1/users/me` and update React Query cache + profileStore. — **IMPL**
- When user taps activity tab, the system shall switch `activeTab` state and render corresponding mock content. — **IMPL**
- When user taps Points stat card, the system shall show `alert('수익 페이지는 아직 구현되지 않았습니다.')`. — **IMPL** (alert only)
- When user taps Posts stat card, the system shall show `alert('활동 내역 페이지는 아직 구현되지 않았습니다.')`. — **IMPL** (alert only)
- Badge details, ranking calculations, follow counts, and all 4 activity tab data are mock. — **MOCK**
- Other-user profile view (`/profile/[userId]`). — **NOT-IMPL** (route does not exist)

---

> Cross-ref: [SCR-USER-01](./SCR-USER-01-login.md) — login entry | [SCR-USER-03](./SCR-USER-03-earnings.md) — Points tap destination
