---
id: CMN-02
component: Global Footer
status: implemented
updated: 2026-02-19
---

# CMN-02: Global Footer

Site-wide footer. One component (`DesktopFooter`) handles both mobile and desktop layouts via responsive CSS. Rendered at page bottom using `flex flex-col min-h-screen` pattern with `mt-auto`.

**Props reference:** `→ specs/_shared/component-registry.md` (DesktopFooter entry)

---

## Component Map

| Component | File | Usage |
|-----------|------|-------|
| `DesktopFooter` | `packages/web/lib/design-system/desktop-footer.tsx` | All pages (some pages hide it: Explore, Feed) |

`role="contentinfo"` on the footer element.

---

## Layout

**Desktop (≥768px):** 4-column grid — Brand | Company | Support | Connect (social + newsletter)

**Mobile (<768px):** Stacked layout — Brand, then Company/Support as accordion sections (collapsed by default), then Connect section always visible.

---

## Sections

### Brand
Logo text "decoded" (font-mono, text-primary) linking to `/`. Slogan: "Discover fashion from your favorite celebrities."

### Company links
| Label | Route |
|-------|-------|
| About | `/about` |
| Careers | `/careers` |
| Press | `/press` |
| Blog | `/blog` |

### Support links
| Label | Route |
|-------|-------|
| Help Center | `/help` |
| Contact | `/contact` |
| FAQ | `/faq` |
| Report Issue | `/report` |

### Connect
Social icons: Instagram, Twitter, Facebook (external links, `target="_blank" rel="noopener noreferrer"`).

Newsletter form: email input + submit button. Calls `onNewsletterSubscribe` prop callback with email string.

### Bottom bar
Copyright text, legal links (Privacy Policy `/privacy`, Terms of Service `/terms`, Cookie Policy `/cookies`), language selector (English / 한국어 / 日本語).

---

## Requirements

- When the viewport is below 768px, the system shall collapse Company and Support link sections into accordion controls.
- When the user expands an accordion section, the system shall reveal the link list with a chevron rotation animation.
- When the user submits the newsletter form, the system shall call the `onNewsletterSubscribe` prop with the email value and clear the input.
- When the page is Explore or Feed, the system shall hide the footer (handled at the layout level, not inside DesktopFooter).

---

## Props

| Prop | Type | Description |
|------|------|-------------|
| `onNewsletterSubscribe` | `(email: string) => void` (optional) | Callback when newsletter form submitted |
| `className` | `string` (optional) | Additional CSS classes |

No store dependencies. No auth-conditional rendering.
