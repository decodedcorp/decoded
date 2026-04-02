---
phase: quick
plan: 260402-qhu
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/lib/components/detail/magazine/MagazineCelebSection.tsx
  - packages/web/lib/components/detail/magazine/MagazineItemsSection.tsx
autonomous: true
requirements: [SIZE-01, SIZE-02, SIZE-03]
must_haves:
  truths:
    - "Style Archive celeb cards are visually larger than before"
    - "The Look item representative images are slightly smaller than before"
    - "Similar Items cards are slightly larger than before"
  artifacts:
    - path: "packages/web/lib/components/detail/magazine/MagazineCelebSection.tsx"
      provides: "Enlarged celeb card grid"
    - path: "packages/web/lib/components/detail/magazine/MagazineItemsSection.tsx"
      provides: "Adjusted item image and similar items sizes"
  key_links: []
---

<objective>
Post detail page and modal panel component size adjustments for magazine (editorial) posts.

Purpose: Improve visual balance by enlarging the Style Archive celeb section, slightly shrinking The Look representative item images, and slightly enlarging Similar Items cards.
Output: Updated Tailwind classes in two magazine section components.
</objective>

<execution_context>
@$HOME/.claude-pers/get-shit-done/workflows/execute-plan.md
@$HOME/.claude-pers/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/web/lib/components/detail/magazine/MagazineCelebSection.tsx
@packages/web/lib/components/detail/magazine/MagazineItemsSection.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Enlarge Style Archive celeb cards and adjust The Look + Similar Items sizes</name>
  <files>
    packages/web/lib/components/detail/magazine/MagazineCelebSection.tsx
    packages/web/lib/components/detail/magazine/MagazineItemsSection.tsx
  </files>
  <action>
**MagazineCelebSection.tsx — Style Archive 크기 키우기:**

1. Line 91: Change grid from `grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5` to `grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4` (fewer columns on desktop = larger cards)
2. Line 100: Change card image aspect from `aspect-[3/4]` to `aspect-[3/4]` (keep aspect ratio, the fewer columns already make them bigger)
3. Line 37: Update cols estimation to match — change `gridWidth >= 1024 ? 5` to `gridWidth >= 1024 ? 4` (for text layout calculation)
4. Line 84: Optionally widen section container from `max-w-5xl` to `max-w-6xl` for more breathing room

**MagazineItemsSection.tsx — The Look 이미지 약간 줄이기:**

1. Line 186: Change item image sizing from `md:w-72 lg:w-80` to `md:w-60 lg:w-64` (shrinks the representative item image from 288/320px to 240/256px)
2. Line 279: Update the Similar Items margin offset to match — change `md:ml-[calc(18rem+2.5rem)] lg:ml-[calc(20rem+2.5rem)]` to `md:ml-[calc(15rem+2.5rem)] lg:ml-[calc(16rem+2.5rem)]`
3. Line 49-51: Update titleContainerWidth calculation — change `320` (image width) to `256` to match the new lg:w-64

**MagazineItemsSection.tsx — Similar Items 약간 키우기:**

1. Line 283: Change similar items grid from `grid grid-cols-2 gap-3 sm:grid-cols-3` to `grid grid-cols-2 gap-4 sm:grid-cols-3` (slightly more gap)
2. Line 309: Change text padding from `p-2` to `p-2.5` (slightly more padding for text area)
3. Line 292: Change similar item image aspect from `aspect-square` to `aspect-[4/5]` (taller cards = visually bigger feel)
  </action>
  <verify>
    <automated>cd /Users/kiyeol/development/decoded/decoded-monorepo && npx tsc --noEmit --project packages/web/tsconfig.json 2>&1 | head -20</automated>
  </verify>
  <done>
    - MagazineCelebSection grid uses 4 columns on lg instead of 5 (larger celeb cards)
    - MagazineItemsSection item images use md:w-60 lg:w-64 (smaller than before md:w-72 lg:w-80)
    - Similar Items use aspect-[4/5], gap-4, and p-2.5 (slightly larger than before)
    - TypeScript compiles without errors
  </done>
</task>

</tasks>

<verification>
- TypeScript compiles without errors
- Visual check: Style Archive cards are noticeably larger (4-col vs 5-col on desktop)
- Visual check: The Look item images are slightly smaller
- Visual check: Similar Items cards are slightly larger with taller aspect ratio
</verification>

<success_criteria>
All three size adjustments applied. No TypeScript errors. Components render correctly in both full page and modal contexts.
</success_criteria>

<output>
After completion, create `.planning/quick/260402-qhu-post/260402-qhu-SUMMARY.md`
</output>
