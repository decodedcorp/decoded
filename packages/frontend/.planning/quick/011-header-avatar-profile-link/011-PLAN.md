---
phase: quick
plan: 011
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/lib/design-system/desktop-header.tsx
autonomous: true

must_haves:
  truths:
    - "Logged-in user can click avatar in desktop header to navigate to /profile"
    - "Avatar maintains same visual styling (size, colors, hover states)"
  artifacts:
    - path: "packages/web/lib/design-system/desktop-header.tsx"
      provides: "Avatar as Link to /profile"
      contains: "Link.*href.*profile"
  key_links:
    - from: "desktop-header.tsx avatar"
      to: "/profile route"
      via: "Next.js Link component"
      pattern: "Link.*href=\"/profile\""
---

<objective>
Connect header avatar to profile page

Purpose: Enable logged-in users to access their profile by clicking their avatar in the desktop header
Output: Desktop header avatar becomes a Link navigating to /profile
</objective>

<execution_context>
@/Users/kiyeol/.claude-work/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-work/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@packages/web/lib/design-system/desktop-header.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Convert avatar button to Link in DesktopHeader</name>
  <files>packages/web/lib/design-system/desktop-header.tsx</files>
  <action>
    In DesktopHeader component (line 142-150), change the avatar `<button>` element to a Next.js `<Link>` component:

    1. The Link import already exists (line 5)
    2. Replace the button wrapper with Link:
       - Change: `<button className="h-8 w-8 rounded-full..." aria-label="User menu">`
       - To: `<Link href="/profile" className="h-8 w-8 rounded-full..." aria-label="Go to profile">`
    3. Update closing tag from `</button>` to `</Link>`
    4. Keep all existing styling classes intact
    5. Update aria-label from "User menu" to "Go to profile" for accessibility

    Note: MobileHeader does NOT have an avatar - it uses bottom navigation for profile access, which is the standard mobile pattern. No changes needed there.
  </action>
  <verify>
    1. Run TypeScript check: `cd packages/web && npx tsc --noEmit`
    2. Visual verification: Start dev server, log in, click avatar in desktop header - should navigate to /profile
  </verify>
  <done>
    - Avatar in desktop header is a Link to /profile
    - Maintains same h-8 w-8 rounded-full styling
    - hover:bg-primary/20 transition preserved
    - TypeScript compiles without errors
  </done>
</task>

</tasks>

<verification>
1. TypeScript compilation passes
2. Desktop header avatar navigates to /profile when clicked
3. Avatar styling unchanged (size, colors, hover states)
</verification>

<success_criteria>
- Logged-in users can click avatar in desktop header to reach profile page
- No visual regression in avatar appearance
- No TypeScript errors
</success_criteria>

<output>
After completion, create `.planning/quick/011-header-avatar-profile-link/011-SUMMARY.md`
</output>
