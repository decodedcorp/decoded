# [SCR-MAG-04] Magazine Theme System
> Route: internal layer within `/magazine` and `/magazine/personal` | Status: proposed | Updated: 2026-03-05
> Milestone: M7 (AI Magazine & Archive Expansion)
> Flow: FLW-06 (Magazine Rendering Flow — Step 2 prerequisite)

## Purpose

Each magazine issue carries a `theme_palette` that is injected as CSS custom properties onto the page container before rendering begins, giving every issue its own visual identity while keeping all component styles theme-agnostic.

See: SCR-MAG-03 — Rendering engine (reads CSS vars set by this layer)
See: SCR-MAG-01 — Daily editorial (default theme: Deep Black / Neon Chartreuse)
See: SCR-MAG-02 — Personal issue (user-specific theme derived from taste profile)

## Theme Palette Contract

```typescript
interface ThemePalette {
  primary: string;   // hex — dominant background or foreground color
  accent: string;    // hex — highlight, glow, interactive elements
  bg: string;        // hex — page background
  text: string;      // hex — primary readable text
  muted?: string;    // hex — secondary text, borders (optional)
  skeleton?: string; // hex — skeleton pulse color (optional)
}

interface MagazineIssue {
  theme_palette: ThemePalette;
  layout_json: LayoutJSON;
  // ...
}
```

## CSS Custom Property Naming Convention

| `theme_palette` field | CSS Custom Property | Fallback |
|-----------------------|---------------------|----------|
| `primary` | `--mag-primary` | `#050505` |
| `accent` | `--mag-accent` | `#eafd67` |
| `bg` | `--mag-bg` | `#050505` |
| `text` | `--mag-text` | `#f5f5f5` |
| `muted` | `--mag-muted` | `#555555` |
| `skeleton` | `--mag-skeleton` | `--mag-accent` value |

### Default Theme (Daily Editorial)

```css
--mag-primary:  #050505;
--mag-accent:   #eafd67;
--mag-bg:       #050505;
--mag-text:     #f5f5f5;
--mag-muted:    #555555;
--mag-skeleton: #eafd67;
```

## Component Map

| Region | Component | File | Props/Notes |
|--------|-----------|------|-------------|
| Theme injector | MagazineThemeProvider | `packages/web/lib/components/magazine/MagazineThemeProvider.tsx` | "use client"; `palette: ThemePalette`; sets CSS vars on container div |
| Skeleton themed | MagazineSkeleton | `packages/web/lib/components/magazine/MagazineSkeleton.tsx` | Reads `--mag-skeleton` and `--mag-bg`; no prop needed |
| Glow effects | Inline CSS / Tailwind | All magazine components | Reference `var(--mag-accent)` for box-shadow |

> All file paths are proposed. Verify against filesystem before implementation.

## Layout

### Injection Point

```
MagazinePage (server)
  |
  +-- MagazineThemeProvider  <-- injects CSS vars as style prop on wrapper div
       |
       +-- MagazineRenderer  <-- all components read vars from nearest ancestor
            |
            +-- MagazineHero       (color: var(--mag-text))
            +-- MagazineText       (color: var(--mag-text); accent via var(--mag-accent))
            +-- MagazineItemCard   (border-color: var(--mag-accent))
            +-- MagazineQuote      (color: var(--mag-primary))
            +-- MagazineDivider    (background: var(--mag-accent))
            +-- MagazineGallery    (gap border: var(--mag-muted))
```

### Mobile vs Desktop

| Behavior | Mobile | Desktop |
|----------|--------|---------|
| Theme scope | `--mag-*` vars on full-page container | Same; vars cascade into DesktopHeader Magazine nav link |
| Dark adaptation | `--mag-bg` drives background; no separate dark class | Same |
| Glow intensity | `box-shadow 0 0 12px var(--mag-accent)` | `box-shadow 0 0 24px var(--mag-accent)` |

## Requirements

### Palette Injection

- When `MagazineThemeProvider` mounts, the system shall set all six CSS custom properties (`--mag-primary`, `--mag-accent`, `--mag-bg`, `--mag-text`, `--mag-muted`, `--mag-skeleton`) as inline `style` on the wrapper `div`.
- When `theme_palette.muted` is absent, the system shall fall back to `#555555` for `--mag-muted`.
- When `theme_palette.skeleton` is absent, the system shall set `--mag-skeleton` equal to the resolved `--mag-accent` value.
- When the daily issue changes (date rollover), the system shall re-mount `MagazineThemeProvider` with the new palette, clearing previous custom property values.

### Color Inheritance

- When a magazine component needs the accent color, it shall reference `var(--mag-accent)` via inline style or a Tailwind arbitrary value — never a hardcoded hex.
- When a magazine component renders body text, it shall use `color: var(--mag-text)`.
- When a magazine component renders the page background, it shall apply `background-color: var(--mag-bg)` on the outermost container only.
- When two adjacent text elements share the same `--mag-text` value, the system shall inherit color without re-applying the property on each element.

### Accent Glow Effects

- When a `MagazineItemCard` receives hover/focus, the system shall apply `box-shadow: 0 0 16px var(--mag-accent)` via a CSS transition (duration 0.25s ease).
- When a `StyleKeywordChip` (SCR-MAG-02 generation UI) appears, the system shall initialise it with `box-shadow: 0 0 8px var(--mag-accent)`.
- When rendering on mobile, the system shall halve the glow spread (8px instead of 16px) to avoid visual noise on small screens.

### Skeleton Theming

- When `MagazineSkeleton` is displayed, the system shall use `background-color: var(--mag-bg)` for the base and `animation: pulse` with `opacity` cycling using `var(--mag-skeleton)` as the glow color.
- When the issue has not yet been fetched (no `theme_palette` available), the system shall use the default theme values for skeleton display.

### Dark/Light Adaptation

- When `theme_palette.bg` is a dark color (luminance < 0.1), the system shall set `color-scheme: dark` on the container.
- When `theme_palette.bg` is a light color (luminance >= 0.5), the system shall set `color-scheme: light` and override `--mag-skeleton` to `var(--mag-primary)` for visible pulse contrast.
- When `next-themes` dark mode is active globally, the system shall not override `--mag-*` vars — the issue palette takes precedence over the global theme.

### Personal Issue Theme

- When a personal issue is generated, the system shall derive `theme_palette` from the user's taste profile (server-side; not computed client-side).
- When `MagazineRenderer` renders the personal issue, the system shall apply the personal `theme_palette` identically to the daily issue injection process.

## State

| Store | Field | Usage |
|-------|-------|-------|
| magazineStore | `currentIssue.theme_palette` | Source palette for daily theme injection |
| magazineStore | `personalIssue.theme_palette` | Source palette for personal issue theme |

## Error & Empty States

| State | Condition | Behavior |
|-------|-----------|----------|
| Missing palette | `theme_palette` null/undefined | Use default theme (Deep Black / Neon Chartreuse) |
| Invalid hex | A palette value is not a valid CSS color | Browser ignores the var; default theme shows through |
| Partial palette | Only some fields present | Missing fields fall back to their defined defaults |

## Animations

| Trigger | Type | Library | Details |
|---------|------|---------|---------|
| Skeleton pulse | Opacity oscillation | CSS keyframes | `--mag-skeleton` glow, 1.5s infinite |
| Item hover glow | Box-shadow transition | CSS | `0 0 16px var(--mag-accent)`, 0.25s ease |
| Keyword chip glow | Box-shadow init | GSAP | `0 0 8px var(--mag-accent)` on pop-in |
| Theme crossfade | None | — | Theme vars applied instantly on mount; no transition |

---

See: [SCR-MAG-03](SCR-MAG-03-rendering-engine.md) -- Rendering engine (consumes theme vars)
See: [SCR-MAG-05](SCR-MAG-05-magazine-interactions.md) -- Interaction layer (accent glow on spots)
See: [SCR-MAG-01](SCR-MAG-01-daily-editorial.md) -- Default theme specification
See: [FLW-06](../../flows/FLW-06-magazine-rendering.md) -- theme_palette in shared data table
