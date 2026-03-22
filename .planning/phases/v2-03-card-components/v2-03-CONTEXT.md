# Phase v2-03: Card Components - Context

**Gathered:** 2026-01-29
**Status:** Ready for planning

<domain>
## Phase Boundary

All content card types render with decoded.pen styling and maintain existing data bindings. This includes ProductCard, FeedCard, ProfileHeaderCard, GridCard, and ItemCard variants. Cards display images, titles, prices, metadata, and engagement actions while matching decoded.pen specifications for layout, spacing, and interactions.

</domain>

<decisions>
## Implementation Decisions

### Card Slot Structure
- **Shared base Card component** with flexible slots that variants compose
- Slot structure extracted from decoded.pen card designs (Claude's discretion on exact regions)
- Base Card provides consistent styling foundation (border, shadow, radius, padding)

### Visual Hierarchy
- Image aspect ratios: match decoded.pen specifications per card type (Claude extracts from designs)
- Text truncation: Claude applies appropriate line clamp/character limits based on decoded.pen layout
- Information density follows decoded.pen visual hierarchy

### Interaction Feedback
- Hover/press states match decoded.pen interaction patterns (Claude extracts specifics)
- **Animated skeletons** for loading states — shimmer animation on placeholder shapes matching card layout
- All interactive states (hover, active, disabled, focus) implemented per decoded.pen specs

### Card Type Variants
- **Wrapper component pattern**: ProductCard, FeedCard, ProfileCard wrap base Card with preset props and specific content structure
- Variants import and compose the shared base Card
- Each variant handles its specific data shape and layout requirements

### Migration Strategy
- **Refactor all existing cards** to use new base Card component
- FeedCard, ItemCard, StyleCard, DetectedItemCard, etc. updated to wrap base Card
- Ensures consistent design system application across all card usage

### Claude's Discretion
- Exact slot regions for base Card (based on decoded.pen analysis)
- Image aspect ratios per card type (extracted from decoded.pen)
- Specific hover/press visual effects (shadow, scale, border changes)
- Text truncation rules per card context
- Skeleton animation timing and appearance

</decisions>

<specifics>
## Specific Ideas

- Reference decoded.pen as single source of truth for all visual specifications
- Use Pencil MCP to extract design specs and generate component code
- Maintain existing data bindings and functionality — this is a design-only change
- Cards should feel cohesive with Phase 1 typography and Phase 2 interactive components

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: v2-03-card-components*
*Context gathered: 2026-01-29*
