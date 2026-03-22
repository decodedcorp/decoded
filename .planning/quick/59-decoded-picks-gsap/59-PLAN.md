---
phase: quick-59
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/lib/components/main/DecodedPickSection.tsx
autonomous: true
requirements: [QUICK-59]
must_haves:
  truths:
    - "Section header animates in from left with GSAP ScrollTrigger on scroll"
    - "Spotlight image has parallax effect on scroll (moves slower than scroll)"
    - "Item cards stagger-reveal from right as user scrolls into view"
    - "Interactive spot hover effects (AnimatePresence) remain unchanged"
  artifacts:
    - path: "packages/web/lib/components/main/DecodedPickSection.tsx"
      provides: "GSAP ScrollTrigger scroll animations for DecodedPickSection"
      contains: "ScrollTrigger"
  key_links:
    - from: "DecodedPickSection.tsx"
      to: "gsap/ScrollTrigger"
      via: "useGSAP hook + scrollTrigger config"
      pattern: "scrollTrigger.*trigger"
---

<objective>
Replace framer-motion whileInView entrance animations in DecodedPickSection with GSAP ScrollTrigger for more impactful, scroll-driven animations (parallax, stagger reveals, text clip animations).

Purpose: Consistent GSAP-based scroll animation across the main page, matching the pattern used in detail page sections.
Output: Updated DecodedPickSection.tsx with GSAP ScrollTrigger animations.
</objective>

<execution_context>
@/Users/kiyeol/.claude-pers/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-pers/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/web/lib/components/main/DecodedPickSection.tsx
@packages/web/lib/components/detail/HeroSection.tsx (GSAP ScrollTrigger pattern reference)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace framer-motion scroll animations with GSAP ScrollTrigger</name>
  <files>packages/web/lib/components/main/DecodedPickSection.tsx</files>
  <action>
Replace the framer-motion `whileInView` entrance animations with GSAP ScrollTrigger, following the established codebase pattern from HeroSection.tsx.

**Imports to change:**

- Remove `motion` from the `motion/react` import (keep `AnimatePresence` only since it is used for spot hover effects)
- Add: `import gsap from "gsap"`, `import ScrollTrigger from "gsap/ScrollTrigger"`, `import { useGSAP } from "@gsap/react"`
- Add `useRef` to the React imports (already has `useState`, `useMemo`)
- Register plugin: `if (typeof window !== "undefined") { gsap.registerPlugin(ScrollTrigger); }`

**Refs to add:**

- `sectionRef` on the outer `<section>` element
- `headerRef` on the section header wrapper div (the one containing "Editor's Choice" + "Decoded's Pick")
- `imageWrapperRef` on the spotlight image container div (the `motion.div` with aspect ratio)
- `itemsContainerRef` on the items grid container div
- `ctaRef` on the "Discover full aesthetic" link

**useGSAP hook (scoped to sectionRef):**

```
useGSAP(() => {
  // 1. Header: slide from left + fade
  gsap.fromTo(headerRef.current,
    { opacity: 0, x: -60 },
    { opacity: 1, x: 0, duration: 1.2, ease: "power3.out",
      scrollTrigger: { trigger: headerRef.current, start: "top 85%", toggleActions: "play none none none" }
    }
  );

  // 2. Spotlight image: scale up reveal + parallax on continued scroll
  gsap.fromTo(imageWrapperRef.current,
    { opacity: 0, scale: 0.92, y: 60 },
    { opacity: 1, scale: 1, y: 0, duration: 1.4, ease: "power2.out",
      scrollTrigger: { trigger: imageWrapperRef.current, start: "top 80%", toggleActions: "play none none none" }
    }
  );
  // Parallax: image moves slower than scroll after reveal
  gsap.to(imageWrapperRef.current, {
    y: -40, ease: "none",
    scrollTrigger: { trigger: imageWrapperRef.current, start: "top bottom", end: "bottom top", scrub: true }
  });

  // 3. Item cards: stagger from right
  const items = itemsContainerRef.current?.querySelectorAll('.decoded-pick-item');
  if (items?.length) {
    gsap.fromTo(items,
      { opacity: 0, x: 60, y: 20 },
      { opacity: 1, x: 0, y: 0, duration: 0.8, ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: { trigger: itemsContainerRef.current, start: "top 80%", toggleActions: "play none none none" }
      }
    );
  }

  // 4. CTA link: fade up
  gsap.fromTo(ctaRef.current,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.6, ease: "power2.out",
      scrollTrigger: { trigger: ctaRef.current, start: "top 90%", toggleActions: "play none none none" }
    }
  );
}, { scope: sectionRef });
```

**Element changes:**

- Convert `motion.div` elements that only use `whileInView` to plain `<div>` with refs
- The spotlight image wrapper: change from `<motion.div initial/whileInView ...>` to `<div ref={imageWrapperRef} style={{ opacity: 0 }} ...>` (initial hidden state set via style to prevent flash)
- The header wrapper: change from `<motion.div initial/whileInView>` to `<div ref={headerRef} style={{ opacity: 0 }}`
- Each item card wrapper: change from `<motion.div initial/whileInView>` to `<div className="decoded-pick-item" style={{ opacity: 0 }}>` (GSAP targets via class selector)
- The inner overlay `motion.div` at line 206-217 (artistName/title inside the image) can stay as `motion.div` since it uses `animate` not `whileInView`, OR convert to a ref-based gsap animation within the same useGSAP. Prefer converting it: add `overlayRef`, animate with gsap.fromTo delay 0.8 inside the image scrollTrigger callback or using a small delay.

**Keep unchanged:**

- All `motion.div` and `AnimatePresence` used for spot hover interactivity (the clipping mask spotlight, ping effect, tooltip label) - lines 137-199
- The `motion.div` for the spotlight color layer (line 137) which uses `animate` prop reactively based on `activeSpotId`

**Style note:** Set `style={{ opacity: 0 }}` on GSAP-animated elements so they start hidden before GSAP runs. This prevents content flash. GSAP's `fromTo` will handle the initial state.
</action>
<verify>
<automated>cd /Users/kiyeol/development/decoded/decoded-app && npx tsc --noEmit --project packages/web/tsconfig.json 2>&1 | head -30</automated>
</verify>
<done>

- DecodedPickSection uses GSAP ScrollTrigger for all entrance animations (header, image, items, CTA)
- Spotlight image has parallax scrub effect
- Item cards stagger-reveal with 0.12s delay between each
- Interactive spot hover effects (AnimatePresence, clip-path) remain functional
- No framer-motion whileInView patterns remain in the component (only AnimatePresence + reactive animate kept)
- TypeScript compiles without errors
  </done>
  </task>

</tasks>

<verification>
- `yarn dev` and scroll to DECODED PICKs section: header slides in from left, image scales up with parallax, items stagger from right
- Hover over spots on the image: color spotlight and tooltip still work
- No console errors related to GSAP or ScrollTrigger
</verification>

<success_criteria>

- All scroll entrance animations use GSAP ScrollTrigger instead of framer-motion whileInView
- Parallax effect visible on spotlight image during scroll
- Staggered item card reveals create a polished cascade effect
- Spot hover interactivity unchanged
- No TypeScript errors
  </success_criteria>

<output>
After completion, create `.planning/quick/59-decoded-picks-gsap/59-SUMMARY.md`
</output>
