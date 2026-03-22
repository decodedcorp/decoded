---
phase: quick
plan: 043
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/lib/components/magazine/MagazineRenderer.tsx
autonomous: true

must_haves:
  truths:
    - "Magazine components stack vertically without overlapping"
    - "Side-by-side item-cards (same y value) render in a flex row"
    - "Gallery at y=108% no longer overflows — it flows naturally after preceding content"
    - "GSAP animations still work on each component (fade-up, scale-in, slide-left, parallax)"
    - "Layout renders correctly on different viewport sizes"
  artifacts:
    - path: "packages/web/lib/components/magazine/MagazineRenderer.tsx"
      provides: "Flow-based layout engine replacing absolute positioning"
      contains: "flex"
  key_links:
    - from: "MagazineRenderer.tsx"
      to: "componentRefs.current[i]"
      via: "ref assignment on wrapper divs"
      pattern: "ref=.*componentRefs"
---

<objective>
Convert MagazineRenderer from absolute positioning to flow-based layout to fix component overlap.

Purpose: Components using percentage-based absolute positioning overlap when coordinates
aren't perfectly calibrated, and gallery at y=108% exceeds container bounds. Flow layout
eliminates these problems while preserving GSAP animations.

Output: Updated MagazineRenderer.tsx that renders components in normal document flow.
</objective>

<execution_context>
@/Users/kiyeol/.claude-pers/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-pers/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/web/lib/components/magazine/MagazineRenderer.tsx
@packages/web/lib/components/magazine/types.ts
@packages/web/lib/components/magazine/MagazineHero.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Convert MagazineRenderer to flow-based layout</name>
  <files>packages/web/lib/components/magazine/MagazineRenderer.tsx</files>
  <action>
Rewrite the layout rendering in MagazineRenderer.tsx:

1. **Remove absolute positioning container**: Delete the inner div with
   `height: ${containerHeight}vh` and the `containerHeight` useMemo entirely.

2. **Group components into rows by y-coordinate**: Before rendering, group
   `components` by their `y` value. Components sharing the same `y` are siblings
   in a flex row. Use a tolerance of ~2 for y-matching (e.g., y=72 and y=72 match).
   Sort groups by ascending y value.

   Implementation approach:
   ```typescript
   const rows = useMemo(() => {
     const Y_TOLERANCE = 2;
     const groups: { y: number; items: { comp: LayoutComponent; origIndex: number }[] }[] = [];

     components.forEach((comp, i) => {
       const existing = groups.find(g => Math.abs(g.y - comp.y) <= Y_TOLERANCE);
       if (existing) {
         existing.items.push({ comp, origIndex: i });
       } else {
         groups.push({ y: comp.y, items: [{ comp, origIndex: i }] });
       }
     });

     // Sort rows by y ascending
     groups.sort((a, b) => a.y - b.y);
     // Sort items within each row by x ascending
     groups.forEach(g => g.items.sort((a, b) => a.comp.x - b.comp.x));

     return groups;
   }, [components]);
   ```

3. **Render rows as flex containers**: Each row is a div. Single-item rows use
   `w-full` with horizontal padding derived from `x` (e.g., x=5 means ~5% padding).
   Multi-item rows use `flex` with `gap-4` and items sized by their `w` percentage.

   ```tsx
   <div className="flex w-full flex-col">
     {rows.map((row, rowIdx) => {
       if (row.items.length === 1) {
         // Single component row
         const { comp, origIndex } = row.items[0];
         const Component = getComponent(comp.type);
         if (!Component) return null;
         return (
           <div
             key={`row-${rowIdx}`}
             ref={(el) => { componentRefs.current[origIndex] = el; }}
             style={{
               width: `${comp.w}%`,
               marginLeft: comp.x > 0 ? `${comp.x}%` : undefined,
               opacity: 0,
             }}
           >
             <Component data={comp.data} />
           </div>
         );
       }

       // Multi-component row (side-by-side)
       return (
         <div
           key={`row-${rowIdx}`}
           className="flex w-full gap-4"
           style={{
             paddingLeft: `${Math.min(...row.items.map(it => it.comp.x))}%`,
             paddingRight: `${100 - Math.max(...row.items.map(it => it.comp.x + it.comp.w))}%`,
           }}
         >
           {row.items.map(({ comp, origIndex }) => {
             const Component = getComponent(comp.type);
             if (!Component) return null;
             return (
               <div
                 key={`comp-${origIndex}`}
                 ref={(el) => { componentRefs.current[origIndex] = el; }}
                 className="flex-1"
                 style={{ opacity: 0 }}
               >
                 <Component data={comp.data} />
               </div>
             );
           })}
         </div>
       );
     })}
   </div>
   ```

4. **Add vertical spacing**: Add `py-4` or `space-y-6` to the column container
   for breathing room between rows. Hero (first row, type=hero-image) should have
   no top padding.

5. **Preserve GSAP animation logic**: The `componentRefs.current[origIndex]` mapping
   ensures GSAP still targets the correct elements. The animation `useEffect` stays
   exactly as-is — it iterates `components` by index and refs match by `origIndex`.
   Do NOT change the GSAP useEffect.

6. **Keep outer container**: The outermost div with `ref={containerRef}`, magazine
   theme classes, and `minHeight: 100vh` stays unchanged.

**What NOT to change:**
- types.ts — keep LayoutComponent interface with x/y/w/h
- GSAP useEffect block — keep as-is, it uses componentRefs.current[i] which maps correctly
- Theme injection useEffect — keep as-is
- componentRegistry.ts, individual components — no changes
  </action>
  <verify>
Run `yarn build` from packages/web to verify no TypeScript errors.
Visually check that:
- `yarn dev` -> navigate to magazine page
- Components stack vertically without overlap
- Two item-cards in daily editorial appear side-by-side
- Gallery appears after quote without exceeding viewport
- GSAP animations play on scroll/load
  </verify>
  <done>
MagazineRenderer uses flow-based layout. Components render in vertical document flow.
Same-y components render in flex rows. No absolute positioning on layout components.
GSAP animations still fire correctly on each component ref.
  </done>
</task>

</tasks>

<verification>
- `yarn build` passes without errors in packages/web
- Magazine page renders without component overlap
- Side-by-side item-cards (daily editorial) display correctly
- Gallery section scrolls naturally (no y=108% overflow)
- GSAP animations work: fade-up, scale-in, slide-left, parallax
</verification>

<success_criteria>
- Zero component overlap on magazine pages
- All mock data layouts (personal-issue, daily-editorial, collection-issues) render correctly
- GSAP animations preserved and functional
- No TypeScript/build errors
</success_criteria>

<output>
After completion, create `.planning/quick/043-magazine-page-layout-overlap-fix/043-SUMMARY.md`
</output>
