# Phase v2-2: Core Interactive Components - Context

**Gathered:** 2026-01-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the interactive building blocks (Buttons, Inputs, Tags) that all other UI components will use. Extend existing shadcn/ui components with design system tokens and additional variants. ActionButton is integrated into Button component, not a separate component.

</domain>

<decisions>
## Implementation Decisions

### Button Component
- Extend existing `packages/web/lib/components/ui/button.tsx`
- Add `icon-sm`, `icon-lg` size variants for icon-only buttons
- Add `isLoading` prop with spinner display (disable click while loading)
- Primary variant already exists as `default` - keep as is
- All variants use design system color tokens from v2-01

### Input Component
- Create new Input component in `packages/web/lib/components/design-system/`
- Support left/right icon slots via `leftIcon`, `rightIcon` props
- Integrate label, helper text, and error message as optional props
- Add `search` variant with rounded corners and clear button
- Error state shows red border + error message below

### Tag Component
- Create new Tag component for category filtering
- Support single-select mode (radio-like) for category filters
- Support multi-select mode (checkbox-like) for tag groups
- Removable variant with X button for user-selected tags
- Active state styling: filled background, different text color

### ActionButton Decision
- **Not a separate component** - use Button with `icon` size variants
- Like/Save/Share buttons: Button with `variant="ghost"` + `size="icon"`
- Toggle states handled by parent component (isActive prop not needed on Button)

### Claude's Discretion
- Exact transition/animation timings
- Spinner component design for loading state
- Tag touch target sizing (minimum 44px mobile)
- Input field border radius values

</decisions>

<specifics>
## Specific Ideas

- Base on existing shadcn/ui patterns - don't reinvent
- Use `cva` (class-variance-authority) for variant management
- Follow v2-01 design tokens for colors, spacing, typography
- Keep components composable (slots, render props where needed)

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope

</deferred>

---

*Phase: v2-02-core-interactive-components*
*Context gathered: 2026-01-29*
