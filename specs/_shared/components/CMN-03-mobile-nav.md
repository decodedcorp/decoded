---
id: CMN-03
component: Mobile Bottom Navigation
status: implemented
updated: 2026-02-19
---

# CMN-03: Mobile Bottom Navigation

Fixed bottom navigation bar for mobile viewports. Hidden on desktop (`md:hidden`). Composed of `NavBar` (container) and `NavItem` (individual items).

**Props reference:** `→ specs/_shared/component-registry.md` (NavBar, NavItem entries)

---

## Component Map

| Component | File | Role |
|-----------|------|------|
| `NavBar` | `packages/web/lib/design-system/nav-bar.tsx` | Container — fixed bottom bar with safe-area support |
| `NavItem` | `packages/web/lib/design-system/nav-item.tsx` | Individual nav item — icon + label, renders as Link or button |

---

## NavBar

**Height:** 64px (h-16) | **Position:** `fixed bottom-0 left-0 right-0` | **z-index:** 50

Background: `bg-card` with `border-t border-border`. Safe-area padding: `pb-[calc(8px+env(safe-area-inset-bottom,0px))]` for iPhone notch support.

`position` prop: `fixed` (default) | `static` (for testing).

`role="navigation"`, `aria-label="Main navigation"`.

---

## NavItem

Renders as `<Link>` when `href` provided, `<button>` when `onClick` provided, disabled `<button>` when `disabled` prop set.

**State variants:** `active` (text-primary) | `inactive` (text-muted-foreground)

**Size variants:** `sm` (18px icon) | `md` (22px icon, default) | `lg` (26px icon)

Disabled state: `opacity-40 cursor-not-allowed`, `aria-disabled="true"`, `aria-label="{label} (coming soon)"`.

Active link: `aria-current="page"`.

---

## Current Navigation Items

| Label | Icon | Route | State |
|-------|------|-------|-------|
| Home | `Home` (Lucide) | `/` | Active when `pathname === '/'` |
| Explore | `Search` (Lucide) | `/explore` | Active when `pathname === '/explore'` |
| Request | `Plus` (Lucide) | — | Disabled (coming soon) |
| Profile | `User` (Lucide) | — | Disabled (coming soon) |

Active state determined by comparing `usePathname()` to each item's `href`.

---

## Layout with Header

Mobile pages require padding to avoid content overlap:
- Top: `pt-14` (56px for MobileHeader)
- Bottom: `pb-16` (64px for NavBar) + safe-area

---

## Requirements

- When the viewport is below 768px, the system shall render the NavBar at the bottom of the screen.
- When the viewport is 768px or wider, the system shall hide the NavBar (`md:hidden`).
- When a NavItem's route matches the current pathname, the system shall apply the `active` state style.
- When a NavItem is disabled, the system shall prevent navigation and show `opacity-40` styling.
- When running on a device with a home indicator (iPhone), the system shall apply `safe-area-inset-bottom` padding.

---

## Related

- CMN-01: MobileHeader (top header, used alongside NavBar on mobile) — `specs/_shared/components/CMN-01-header.md`
