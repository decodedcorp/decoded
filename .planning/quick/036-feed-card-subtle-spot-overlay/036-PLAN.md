---
phase: quick
plan: 036
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/lib/components/FeedCard.tsx
autonomous: true

must_haves:
  truths:
    - "Feed cards with spots show subtle dot indicators on the image at correct positions"
    - "Spots appear with low opacity and small size, not distracting from the image"
    - "Feed cards without spots show no overlay dots"
    - "Spot overlay does not interfere with card interactions (like, comment, share, navigation)"
  artifacts:
    - path: "packages/web/lib/components/FeedCard.tsx"
      provides: "Feed card with subtle spot overlay"
      contains: "Hotspot"
  key_links:
    - from: "packages/web/lib/components/FeedCard.tsx"
      to: "packages/web/lib/hooks/useSpots.ts"
      via: "useSpots hook to fetch spot positions"
      pattern: "useSpots"
    - from: "packages/web/lib/components/FeedCard.tsx"
      to: "packages/web/lib/design-system/hotspot.tsx"
      via: "Hotspot component for rendering spot dots"
      pattern: "Hotspot"
---

<objective>
Add subtle spot indicator overlays on feed card images in the feed page.

Purpose: When a feed card has detected items (spots), show small, unobtrusive dot markers on the image at the correct positions. This gives users a visual preview that items have been identified on the image, encouraging them to tap through to the detail page for the full decoded experience.

Output: Updated FeedCard component that fetches and renders spot positions as subtle overlays using the existing Hotspot design system component.
</objective>

<execution_context>
@/Users/kiyeol/.claude-pers/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-pers/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/web/lib/components/FeedCard.tsx
@packages/web/lib/design-system/hotspot.tsx
@packages/web/lib/hooks/useSpots.ts
@packages/web/lib/api/types.ts (Spot interface: id, post_id, position_left, position_top as percentage strings)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add subtle spot overlay to FeedCard</name>
  <files>packages/web/lib/components/FeedCard.tsx</files>
  <action>
    Add spot overlay rendering to FeedCard. The approach:

    1. Import `useSpots` from `@/lib/hooks/useSpots` and `Hotspot` from `@/lib/design-system`.

    2. Inside the FeedCard component, conditionally fetch spots using `useSpots(item.postId!)` ONLY when `item.hasItems && item.postId` is truthy. Use the `enabled` option pattern: pass `{ enabled: !!item.hasItems && !!item.postId }` as options to prevent unnecessary fetches for cards without items.

    3. Render spot dots inside the existing image container div (the `div.relative.aspect-[4/5].bg-muted` element), after the `<img>` element but BEFORE the top overlay and bottom gradient overlay divs. This ensures spots appear on the image but under the UI chrome.

    4. For each spot from the `useSpots` data, render a `<Hotspot>` component with:
       - `variant="inactive"` (the subtle 50% opacity variant, 24x24px)
       - `position={{ x: parseFloat(spot.position_left), y: parseFloat(spot.position_top) }}`
         (position_left and position_top are percentage strings like "45.5" representing 0-100 scale;
          Hotspot expects x,y as 0-100 percentage values, so parseFloat is sufficient)
       - `className="pointer-events-none opacity-40"` to make them non-interactive and even more subtle
         (the inactive variant is already 50% opacity, adding opacity-40 makes them ~20% total, very subtle)
       - `label={spot.category?.name || "Item"}` for accessibility
       - No onClick handler (pointer-events-none, purely decorative in feed context)

    5. Wrap the spots rendering in a condition: only render when `spotsData && spotsData.length > 0`. Use optional chaining.

    6. Important: Do NOT add `glow`, `revealing`, or `selected` props. Keep it minimal and subtle.

    7. The spots container should have `className="absolute inset-0 pointer-events-none z-10"` to overlay on the image without blocking interactions. The z-10 ensures it sits above the image but below the top overlay (which uses absolute positioning) and bottom gradient overlay.

    Implementation pattern:
    ```tsx
    {/* Subtle spot indicators */}
    {spotsData && spotsData.length > 0 && (
      <div className="absolute inset-0 pointer-events-none z-10">
        {spotsData.map((spot) => (
          <Hotspot
            key={spot.id}
            variant="inactive"
            position={{
              x: parseFloat(spot.position_left),
              y: parseFloat(spot.position_top),
            }}
            className="pointer-events-none !w-3 !h-3 opacity-50"
            label={spot.category?.name || "Item"}
          />
        ))}
      </div>
    )}
    ```

    Note: Override Hotspot size to 12x12px (`!w-3 !h-3`) instead of default 24x24px for subtlety in feed cards. Use opacity-50 (not opacity-40) for slightly better visibility while still being subtle. The `!` important prefix overrides the CVA variant defaults.
  </action>
  <verify>
    1. `cd /Users/kiyeol/development/decoded/decoded-app && yarn build` passes without errors
    2. `yarn lint` passes
    3. Visual check: Run `yarn dev`, navigate to /feed, verify that cards with items show small subtle dots on the image at the correct positions
  </verify>
  <done>
    - Feed cards with `hasItems=true` fetch spots via `useSpots` and display subtle inactive Hotspot markers
    - Feed cards without items make no spots API call
    - Spot dots are small (12x12px), semi-transparent (~50% opacity), and non-interactive (pointer-events-none)
    - Spot dots do not interfere with card click navigation, engagement buttons, or other overlays
    - Build and lint pass cleanly
  </done>
</task>

</tasks>

<verification>
1. Build check: `yarn build` completes without TypeScript or build errors
2. Lint check: `yarn lint` passes
3. Visual verification at /feed:
   - Cards with items: small, subtle dots appear on images at spot positions
   - Cards without items: no dots rendered
   - Clicking a card still navigates to /images/[id]
   - Like, comment, share buttons still work
   - Dots appear under the gradient overlay and top badges, not covering them
</verification>

<success_criteria>
- Feed card images display subtle spot indicators when the post has detected items
- Spots are visually unobtrusive (small, semi-transparent, no animation)
- No performance regression (spots only fetched for cards with hasItems=true)
- No interaction conflicts with existing card functionality
</success_criteria>

<output>
After completion, create `.planning/quick/036-feed-card-subtle-spot-overlay/036-SUMMARY.md`
</output>
