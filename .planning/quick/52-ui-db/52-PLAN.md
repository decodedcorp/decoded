---
phase: quick-052
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/lib/components/profile/StyleDNACard.tsx
  - packages/web/lib/components/profile/ArchiveStats.tsx
  - packages/web/lib/components/profile/InkEconomyCard.tsx
  - packages/web/lib/components/profile/DataSourcesCard.tsx
  - packages/web/lib/components/profile/index.ts
  - packages/web/app/profile/ProfileClient.tsx
autonomous: true
requirements: [QUICK-052]

must_haves:
  truths:
    - "Profile page shows Style DNA section with keywords, color palette, decoding progress gauge"
    - "Profile page shows Archive Stats with Total Issues, Try-on History, Social Rank"
    - "Profile page shows Ink Economy with ink balance and subscription CTA"
    - "Profile page shows Data Sources with SNS connection status and update button"
    - "All new sections use Tech-Editorial design (frosted glass, monospace+serif, #eafd67 accent)"
  artifacts:
    - path: "packages/web/lib/components/profile/StyleDNACard.tsx"
      provides: "Style DNA visualization with keywords, color swatches, progress gauge"
    - path: "packages/web/lib/components/profile/ArchiveStats.tsx"
      provides: "Archive stats grid (Total Issues, Try-on, Social Rank)"
    - path: "packages/web/lib/components/profile/InkEconomyCard.tsx"
      provides: "Ink balance display with CTA buttons"
    - path: "packages/web/lib/components/profile/DataSourcesCard.tsx"
      provides: "SNS connection status cards with update action"
  key_links:
    - from: "packages/web/app/profile/ProfileClient.tsx"
      to: "New profile section components"
      via: "import and render in mobile + desktop layouts"
      pattern: "StyleDNACard|ArchiveStats|InkEconomyCard|DataSourcesCard"
---

<objective>
Add 4 new profile sections (Style DNA, Archive Stats, Ink Economy, Data Sources) with Tech-Editorial visual design using mock data. These sections use frosted glass backgrounds, monospace+serif typography, and #eafd67 accent color.

Purpose: Transform the profile page from basic stats into a rich personal dashboard with style/data identity.
Output: 4 new components integrated into both mobile and desktop profile layouts.
</objective>

<execution_context>
@/Users/kiyeol/.claude-pers/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-pers/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/web/app/profile/ProfileClient.tsx
@packages/web/lib/components/profile/index.ts
@packages/web/lib/components/profile/StatsCards.tsx
@packages/web/lib/components/profile/ProfileDesktopLayout.tsx
@packages/web/lib/stores/profileStore.ts

<interfaces>
<!-- Existing profile store types used by components -->
From packages/web/lib/stores/profileStore.ts:
```typescript
export interface ProfileStats {
  totalContributions: number;
  totalAnswers: number;
  totalAccepted: number;
  totalEarnings: number;
}
export const selectStats = (state: ProfileState) => state.stats;
```

From packages/web/lib/api/types.ts:
```typescript
export interface UserResponse {
  id: string;
  email: string;
  username: string;
  rank: string | null;
  total_points: number;
  is_admin: boolean;
  avatar_url: string | null;
  bio: string | null;
  display_name: string | null;
}
export interface UserStatsResponse {
  total_posts: number;
  total_comments: number;
  total_likes_received: number;
  total_points: number;
  rank: string | null;
}
```

Note: DB does NOT have ink_credits, style_dna, sns_connections columns yet.
All new sections use hardcoded mock data with TODO comments for future API integration.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create 4 new profile section components with Tech-Editorial design</name>
  <files>
    packages/web/lib/components/profile/StyleDNACard.tsx
    packages/web/lib/components/profile/ArchiveStats.tsx
    packages/web/lib/components/profile/InkEconomyCard.tsx
    packages/web/lib/components/profile/DataSourcesCard.tsx
    packages/web/lib/components/profile/index.ts
  </files>
  <action>
Create 4 new components using "use client" directive, Tailwind CSS styling, and motion/react for animations.

**Shared Design System (Tech-Editorial Look):**
- Frosted glass: `bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl`
- Section titles: `font-mono text-xs uppercase tracking-[0.2em] text-neutral-400`
- Values: `font-serif text-2xl text-white` (or use default sans-serif if serif not loaded)
- Accent color: `text-[#eafd67]` and `bg-[#eafd67]` for highlights, gauges, active states
- Card padding: `p-5` mobile, `p-6` desktop

**1. StyleDNACard.tsx** - Style persona visualization
- Section title: "STYLE DNA" in mono uppercase
- DNA keywords row: 3-4 pill tags (e.g., "Minimal", "Monochrome", "Avant-Garde", "Urban") using `border border-[#eafd67]/30 text-[#eafd67] rounded-full px-3 py-1 text-xs font-mono`
- Color palette: 4-5 small circles (w-6 h-6 rounded-full) showing user's extracted style colors (mock: #1a1a1a, #eafd67, #f5f5f0, #8b7355, #c9302c)
- Decoding progress: Circular or linear gauge showing "Style Decoding" completion percentage (mock: 72%). Use an SVG circle gauge with stroke-dasharray. Label: "72% Decoded" in accent color.
- All data hardcoded with `// TODO: Replace with API data from user style_dna` comments

**2. ArchiveStats.tsx** - Replace or augment current StatsCards
- 3-column grid layout matching existing StatsCards grid pattern
- Cards: "Total Issues" (use total_posts from profileStore), "Try-on History" (mock: 24), "Social Rank" (use rank from UserResponse or derive from total_points: top X%)
- Each card: frosted glass background, large serif number, mono uppercase label below
- Social Rank shows a small rank badge icon or tier label (e.g., "TOP 12%") in accent color
- Wire total_posts from `useProfileStore(selectStats)` for "Total Issues". Other values mock with TODO comments.

**3. InkEconomyCard.tsx** - Ink balance display
- Shows "INK BALANCE" title in mono uppercase
- Large balance number: "1,250 INK" in serif font, accent color
- Two CTA buttons side by side:
  - "Subscribe" button: outlined style `border border-[#eafd67] text-[#eafd67] rounded-full px-4 py-2 text-sm font-mono`
  - "Charge" button: filled style `bg-[#eafd67] text-black rounded-full px-4 py-2 text-sm font-mono font-medium`
- Both buttons are non-functional (onClick shows console.log + alert "Coming soon")
- All values hardcoded mock with `// TODO: Wire to ink_credits API`

**4. DataSourcesCard.tsx** - SNS connection status
- Section title: "DATA SOURCES" mono uppercase
- Two rows for Pinterest and Instagram:
  - Each row: SNS icon (use lucide-react icons or simple text labels), connection status badge ("Connected" in accent / "Not Connected" in neutral-500), last sync date
  - Pinterest: mock as connected, last sync "2 hours ago"
  - Instagram: mock as not connected
- "Update Data" button at bottom: outlined style, triggers console.log + alert "Syncing..."
- Mock data with `// TODO: Wire to sns_connections API`

**Update index.ts:** Add exports for all 4 new components.
  </action>
  <verify>
    <automated>cd /Users/kiyeol/development/decoded/decoded-app && npx tsc --noEmit --project packages/web/tsconfig.json 2>&1 | head -30</automated>
  </verify>
  <done>All 4 components exist, export from index.ts, and pass TypeScript compilation with no errors in new files</done>
</task>

<task type="auto">
  <name>Task 2: Integrate new sections into ProfileClient mobile and desktop layouts</name>
  <files>
    packages/web/app/profile/ProfileClient.tsx
  </files>
  <action>
Import the 4 new components from `@/lib/components/profile`.

**Mobile layout** (inside `md:hidden` div, after FollowStats and before existing StatsCards):
Insert in this order within the space-y-4 container:
1. `<StyleDNACard />` - after FollowStats
2. `<ArchiveStats />` - replaces existing `<StatsCards />` (remove the old StatsCards from mobile layout)
3. `<InkEconomyCard />` - after ArchiveStats
4. `<DataSourcesCard />` - after InkEconomyCard
5. Keep BadgeGrid and ActivityTabs below

**Desktop layout** (inside ProfileDesktopLayout):
Add new sections to the `profileSection` prop (left sidebar), after ProfileHeader:
1. `<StyleDNACard />`
2. `<InkEconomyCard />`
3. `<DataSourcesCard />`

Add `<ArchiveStats />` to the `activitySection` prop (right column), before BadgeGrid. Remove old StatsCards reference if it was in desktop layout.

Keep all existing imports and functionality unchanged. Only add the new component imports and JSX insertions.
  </action>
  <verify>
    <automated>cd /Users/kiyeol/development/decoded/decoded-app && npx tsc --noEmit --project packages/web/tsconfig.json 2>&1 | head -30</automated>
  </verify>
  <done>Profile page renders all 4 new sections in both mobile (stacked) and desktop (sidebar + main) layouts. Existing functionality (badges, rankings, activity tabs, modals) unchanged.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>4 new profile sections with Tech-Editorial design: Style DNA (keywords + color palette + progress gauge), Archive Stats (issues/try-on/rank), Ink Economy (balance + CTA), Data Sources (SNS status)</what-built>
  <how-to-verify>
    1. Run `yarn dev` in project root
    2. Navigate to http://localhost:3000/profile
    3. Verify mobile view (Chrome DevTools responsive mode, 390px width):
       - Style DNA card shows keywords pills in accent color, color palette circles, and circular progress gauge
       - Archive Stats shows 3-column grid with Total Issues, Try-on History, Social Rank
       - Ink Economy shows balance in accent color with Subscribe and Charge buttons
       - Data Sources shows Pinterest (connected) and Instagram (not connected) with Update button
    4. Verify desktop view (full width):
       - Style DNA, Ink Economy, Data Sources appear in left sidebar
       - Archive Stats appears in right column above badges
    5. Confirm frosted glass effect, monospace titles, #eafd67 accent throughout
    6. Click CTA buttons to verify they show "Coming soon" alerts
  </how-to-verify>
  <resume-signal>Type "approved" or describe visual/functional issues to fix</resume-signal>
</task>

</tasks>

<verification>
- TypeScript compilation passes with no errors
- All 4 new components render without runtime errors
- Profile page loads successfully at /profile
- Existing profile functionality (badges, rankings, activity, edit modal) still works
</verification>

<success_criteria>
- Style DNA card renders with keywords, color palette, and progress gauge
- Archive Stats shows 3-column grid with real total_posts + mock data
- Ink Economy shows ink balance with functional CTA buttons (alerts)
- Data Sources shows SNS connection status with update button
- Tech-Editorial design applied consistently: frosted glass, monospace titles, #eafd67 accent
- Both mobile and desktop layouts updated
</success_criteria>

<output>
After completion, create `.planning/quick/52-ui-db/52-SUMMARY.md`
</output>
