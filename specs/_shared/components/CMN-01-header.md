---
id: CMN-01
component: Global Header
status: implemented
updated: 2026-02-19
---

# CMN-01: Global Header

Global header rendered on all pages. Mobile and desktop use separate components, both in `packages/web/lib/design-system/`.

**Props reference:** `→ specs/_shared/component-registry.md` (MobileHeader, DesktopHeader entries)

---

## Component Map

| Breakpoint | Component | File | Visibility |
|------------|-----------|------|------------|
| Mobile (<768px) | `MobileHeader` | `packages/web/lib/design-system/mobile-header.tsx` | `md:hidden` |
| Desktop (≥768px) | `DesktopHeader` | `packages/web/lib/design-system/desktop-header.tsx` | `hidden md:flex` |

Both components are `position: fixed`, `z-index: 40`, `backdrop-blur-md`.

---

## MobileHeader

**Height:** 56px | **Variant prop:** `default` (bg-background/80) | `transparent`

Layout: Logo (left) + action icons (right).

**Action icons (right side):**
- Search icon — calls `onSearchClick` prop
- Notification bell — always visible, hardcoded red dot badge
- Admin shield — shown only when `isAdmin === true`
- Filter icon — shown when `showFilter === true` prop; calls `onFilterClick`

**State from authStore:** reads `user` and `selectIsAdmin` selector to conditionally show admin icon.

**Requirements:**

- When the viewport is below 768px, the system shall render MobileHeader and hide DesktopHeader.
- When `showFilter` prop is false, the system shall hide the filter icon.
- When the authenticated user has admin privileges, the system shall show the admin shield icon linking to `/admin`.

---

## DesktopHeader

**Height:** 72px | **Variant prop:** `default` (bg-background/95 + border) | `transparent`

Layout: Logo (left, flex-1) + Navigation (center, flex-none) + Actions (right, flex-1).

**Navigation items (center):**

| Label | Route |
|-------|-------|
| Home | `/` |
| Feed | `/feed` |
| Explore | `/explore` |
| Request | `/request/upload` |

Active item: `text-primary font-semibold`. Inactive: `text-muted-foreground`.

**Right section (authenticated user):**
- Search icon (calls `onSearchClick` prop)
- Admin shield link to `/admin` (shown when `isAdmin === true`)
- Notification bell with red dot badge
- Avatar button — opens user dropdown (Profile, Activity, Settings, Logout)

**Right section (unauthenticated):**
- Search icon
- Login link to `/login`

**State from authStore:** reads `user` and `selectIsAdmin` for conditional rendering.

**Requirements:**

- When the viewport is 768px or wider, the system shall render DesktopHeader and hide MobileHeader.
- When the user is authenticated, the system shall show the user avatar dropdown and notification bell.
- When the user is not authenticated, the system shall show a Login link to `/page/login`.
- When the user clicks outside the open dropdown, the system shall close the dropdown.
- When the user presses Escape with the dropdown open, the system shall close the dropdown.
- When the authenticated user has admin privileges, the system shall show the admin shield icon.

---

## Search Trigger

Both headers call an `onSearchClick` prop callback. The parent (layout or page) is responsible for opening the search overlay. No search state is held in the header components — see `searchStore` in `→ specs/_shared/store-map.md`.

---

## Related

- CMN-03: Mobile nav bar (replaces desktop nav on mobile) — `specs/_shared/components/CMN-03-mobile-nav.md`
- authStore: `→ specs/_shared/store-map.md`
