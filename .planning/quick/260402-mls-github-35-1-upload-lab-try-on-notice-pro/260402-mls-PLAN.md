---
phase: quick
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/lib/components/main-renewal/SmartNav.tsx
autonomous: true
requirements: ["GH-35-1st-release"]

must_haves:
  truths:
    - "Desktop nav does NOT show Upload link"
    - "Desktop nav does NOT show Lab link"
    - "Desktop nav does NOT show Try On button"
    - "Desktop nav does NOT show notification bell (notice)"
    - "Desktop nav does NOT show profile dropdown or login link"
    - "Desktop nav still shows Home, Explore, Search, Admin (for admins)"
    - "Mobile nav is unchanged (Home, Search, Explore)"
  artifacts:
    - path: "packages/web/lib/components/main-renewal/SmartNav.tsx"
      provides: "Stripped desktop nav for 1st release"
  key_links:
    - from: "SmartNav.tsx"
      to: "ConditionalNav.tsx"
      via: "import in ConditionalNav"
      pattern: "SmartNav"
---

<objective>
Hide non-essential navigation items for GitHub issue #35 first release.

Purpose: Strip Upload, Lab, Try On, Notification (notice), Profile, and Login from the desktop SmartNav to ship a focused 1st release with only core navigation (Home, Explore, Search).
Output: Cleaned SmartNav.tsx with hidden features commented out for easy re-enablement.
</objective>

<execution_context>
@$HOME/.claude-pers/get-shit-done/workflows/execute-plan.md
@$HOME/.claude-pers/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/web/lib/components/main-renewal/SmartNav.tsx
@packages/web/lib/components/ConditionalNav.tsx
@packages/web/lib/components/MobileNavBar.tsx
</context>

<interfaces>
<!-- SmartNav current structure to modify -->

From packages/web/lib/components/main-renewal/SmartNav.tsx:
```typescript
const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/request/upload", label: "Upload", isUpload: true },  // REMOVE
  { href: "/lab", label: "Lab" },                                 // REMOVE
] as const;

// Lines 192-200: Try On button block                              // REMOVE
// Lines 225-300: Bell icon + Profile dropdown + Login link         // REMOVE (entire auth UI section)
```

MobileNavBar already has only Home, Search, Explore -- no changes needed.
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Strip hidden features from SmartNav desktop navigation</name>
  <files>packages/web/lib/components/main-renewal/SmartNav.tsx</files>
  <action>
Modify SmartNav.tsx to hide features for 1st release. Use comment blocks so they can be re-enabled later.

1. **NAV_ITEMS array (line 21-26):** Remove the Upload and Lab entries. Keep only Home and Explore:
   ```typescript
   const NAV_ITEMS = [
     { href: "/", label: "Home" },
     { href: "/explore", label: "Explore" },
     // 1st release: Upload and Lab hidden (GH #35)
     // { href: "/request/upload", label: "Upload", isUpload: true },
     // { href: "/lab", label: "Lab" },
   ] as const;
   ```

2. **Try On button (lines 192-200):** Comment out the entire Try On button block AND the divider below it. Wrap with:
   ```
   {/* 1st release: Try On hidden (GH #35)
   <button ... Try On</button>
   */}
   ```

3. **Notification bell (lines 226-234):** Comment out the Bell button block (inside the `user ?` ternary, the first button with Bell icon). Wrap with:
   ```
   {/* 1st release: Notifications hidden (GH #35)
   <button ...><Bell .../> ...</button>
   */}
   ```

4. **Profile dropdown + Login (lines 225-310):** Comment out the ENTIRE auth UI section -- both the logged-in branch (avatar + dropdown) and the logged-out branch (Login link). Replace with nothing (no visible element). Wrap with:
   ```
   {/* 1st release: Profile/Login hidden (GH #35)
   {user ? ( ... ) : ( <Link href="/login" ... /> )}
   */}
   ```

5. **Clean up unused imports:** Remove imports that are no longer used after commenting out:
   - Remove: `Bell`, `User`, `Settings`, `Activity`, `LogOut`, `Sparkles` from lucide-react (keep `Search`, `Shield`)
   - Remove: `useVtonStore` import
   - Remove: `useAuthStore`, `selectIsAdmin` imports -- BUT only if Admin link is also removed. Since Admin link depends on auth state, comment it out too and remove auth imports.
   
   Actually, reconsider: The Admin link (Shield icon, lines 214-222) also depends on `user` and `isAdmin`. Since we are hiding login/profile, there is no logged-in state visible. Comment out the Admin link too. Then we can safely remove all auth-related imports and the `useVtonStore` import.

6. **Remove unused variables:** After commenting out auth UI and vton:
   - Remove `const user = useAuthStore(...)` 
   - Remove `const isAdmin = useAuthStore(...)`
   - Remove `const [dropdownOpen, setDropdownOpen] = useState(false)`
   - Remove `const dropdownRef = useRef<HTMLDivElement>(null)`
   - Remove the `useEffect` for dropdown close (lines 54-75)
   - Remove `const openVton = useVtonStore(...)`
   - Remove `const handleUploadClick` function
   - Remove `useRouter` import and `const router = useRouter()`
   - Keep: `useRef`, `useEffect`, `useState` for scroll behavior; `gsap`, `Link`, `Search` icon, `DecodedLogo`, `usePathname`

7. **Keep the divider + Search button** in the right actions area. The remaining right side should be: nav links (Home, Explore) + divider + Search button.

Final right-side structure should be:
```
<div className="flex items-center gap-6">
  {NAV_ITEMS.map(...)}  {/* Home, Explore only */}
  <div className="h-4 w-px bg-white/15" />  {/* Divider */}
  <button ...><Search /></button>  {/* Search */}
  {/* All other items commented out with "1st release" markers */}
</div>
```
  </action>
  <verify>
    <automated>cd /Users/kiyeol/development/decoded/decoded-monorepo && npx tsc --noEmit --project packages/web/tsconfig.json 2>&1 | head -20</automated>
  </verify>
  <done>SmartNav renders only Home, Explore, and Search. Upload, Lab, Try On, Notifications, Profile, and Login are commented out with "1st release: ... hidden (GH #35)" markers. TypeScript compiles without errors. No unused import warnings.</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes for packages/web
- Visual check: desktop nav shows only Logo | Home | Explore | Search
- Mobile nav unchanged: Home | Search | Explore
- No console errors on page load
</verification>

<success_criteria>
- Desktop SmartNav shows ONLY: Logo (left), Home, Explore, Search (right)
- Upload, Lab, Try On, Bell/notice, Profile dropdown, Login link are ALL gone from desktop nav
- MobileNavBar unchanged (Home, Search, Explore)
- All hidden items have "1st release" comment markers for easy re-enablement
- TypeScript compiles cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/260402-mls-github-35-1-upload-lab-try-on-notice-pro/260402-mls-SUMMARY.md`
</output>
