# Phase v2-08: Request Flow & Login - Research

**Researched:** 2026-02-05
**Domain:** Multi-step form UI with page transitions, OAuth authentication
**Confidence:** HIGH

## Summary

Phase v2-08 applies the decoded.pen design system to the existing Request flow (Upload → Detection → Details) and simplifies the Login page OAuth options. The core functionality remains unchanged—this is purely a styling and animation enhancement phase.

**Key findings:**
- Motion (v12.23.12) library is already installed and used for AnimatePresence patterns
- Existing RequestStore manages 4-step flow (1: Upload, 2: Detect, 3: Details, 4: Submit)
- Current StepIndicator uses 4 steps with connecting lines—needs update to 3 dots (Submit merged into Details)
- Design system tokens from v2-01 are available in globals.css
- Prior v2-06 and v2-07 phases established AnimatePresence patterns (0.2s duration, fade/slide)

**Primary recommendation:** Leverage existing AnimatePresence patterns from v2-06/v2-07 for consistent transition behavior. Update StepIndicator to 3-step configuration. Apply decoded.pen tokens to form inputs and layout grids.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| motion | 12.23.12 | Animation library (formerly Framer Motion) | Already used in v2-06, v2-07; declarative API for React animations |
| Zustand | 4.5.7 | State management | Already manages RequestStore with step flow state |
| Lucide React | 0.555.0 | Icon library | Already used for arrow-left, x icons in RequestFlowHeader |
| Tailwind CSS | 3.4.18 | Styling | Design system tokens defined as CSS variables |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx / tailwind-merge | 3.4.0 | Conditional classNames | Button/input variant styling |
| class-variance-authority | N/A (in Button) | Variant management | Already used in Button component |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| motion | React Spring | Motion is already installed and consistently used |
| Inline validation | On-submit validation | Inline is better UX per research, but defer to Claude's discretion |

**Installation:**
No new dependencies required—all libraries already installed.

## Architecture Patterns

### Step Flow State Management (Existing)
The RequestStore already manages step transitions:
```typescript
// From requestStore.ts
export type RequestStep = 1 | 2 | 3 | 4;

interface RequestState {
  currentStep: RequestStep;
  setStep: (step: RequestStep) => void;
  // ... image, detection, details state
}
```

**Adjustment needed:** The store defines 4 steps, but decoded.pen spec uses 3 (Submit merged into Details). Update to `RequestStep = 1 | 2 | 3` and adjust StepIndicator constants.

### Page Transition Pattern (v2-06 Established)
From existing ActivityContent.tsx:
```typescript
// Source: packages/web/lib/components/profile/ActivityContent.tsx
<AnimatePresence mode="wait">
  <motion.div
    key={activeTab}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

**For Request flow:** Use directional slide instead of fade:
```typescript
// Forward transition (step 1→2→3)
<motion.div
  key={currentStep}
  initial={{ x: '100%' }}
  animate={{ x: 0 }}
  exit={{ x: '-100%' }}
  transition={{ duration: 0.2, ease: 'easeOut' }}
>
```

### Responsive Layout Pattern
Existing DetectionView uses layout prop:
```typescript
// Desktop: 2-column grid
<div className="grid lg:grid-cols-2 gap-8">
  <DetectionView layout="default" />
  <DetectedItemList />
</div>

// Mobile: fullscreen overlay
<DetectionView layout="fullscreen" />
```

Apply same pattern to Details step for 2-column form layout.

### Form Input Component Pattern
From MediaSourceInput.tsx (existing):
```typescript
// Current pattern (will be enhanced)
<input
  type="text"
  className="
    w-full px-3 py-2 rounded-lg border border-border
    bg-background text-foreground text-sm
    placeholder:text-muted-foreground
    focus:outline-none focus:ring-2 focus:ring-primary/50
  "
/>
```

**Enhancement:** Extract into reusable Input component with label, helper text, and error state props (per v2-02 design).

### Anti-Patterns to Avoid
- **Don't overlap animations:** Use `mode="wait"` in AnimatePresence to prevent old/new pages rendering simultaneously
- **Don't validate empty required fields on focus:** Only validate after user interaction or on submit
- **Don't rely on color alone for errors:** Use icons + borders + text for accessibility
- **Don't use separate Submit step:** decoded.pen spec merges Submit into Details page

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Page transition detection | Manual direction tracking | AnimatePresence + key prop | Motion handles mount/unmount lifecycle automatically |
| Form validation timing | Custom debouncing/event logic | React Hook Form or inline validation on blur | Proper validation timing is complex (premature validation hurts UX) |
| Step indicator animation | Custom CSS transitions | Motion layoutId or simple CSS transition | Over-engineering; simple scale/color is sufficient |
| Drag-and-drop file upload | Custom drag event handlers | Existing DropZone component | Already handles validation, multiple files, preview |
| Skeleton loading | Custom pulsing divs | Consider react-loading-skeleton library | Automatic sizing, consistent animation, accessibility |

**Key insight:** The Request flow already has robust components (DropZone, DetectionView, form inputs). This phase is about styling, not rewriting logic.

## Common Pitfalls

### Pitfall 1: Step Count Mismatch
**What goes wrong:** StepIndicator shows 4 dots but decoded.pen spec requires 3 (Submit merged into Details).
**Why it happens:** Existing code defined 4 steps; spec changed to simplify flow.
**How to avoid:**
1. Update `RequestStep = 1 | 2 | 3` in requestStore.ts
2. Update STEPS array in StepIndicator.tsx to 3 items
3. Add Submit button to Details page footer
**Warning signs:** UI shows 4 dots; navigation to step 4 fails.

### Pitfall 2: Premature Form Validation
**What goes wrong:** Input shows error state while user is still typing, causing frustration.
**Why it happens:** Validation runs on `onChange` instead of `onBlur` or submit.
**How to avoid:**
- Required fields: validate on blur or submit
- Format validation (email): validate on blur
- Real-time feedback (password strength): OK to show on change
**Warning signs:** User types first character and sees "Field is required" error.

### Pitfall 3: Animation Jank During Step Transition
**What goes wrong:** Page slides but content jumps or flickers.
**Why it happens:** Different content heights cause layout shift; images load during animation.
**How to avoid:**
- Use `mode="wait"` in AnimatePresence
- Set min-height on animated container
- Preload images or use skeleton placeholders
- Keep transition duration short (0.2s)
**Warning signs:** Scroll position jumps; images pop in mid-animation.

### Pitfall 4: OAuth Button NASCAR Problem
**What goes wrong:** Multiple branded OAuth buttons create visual noise and confusion.
**Why it happens:** Too many provider options with competing brand colors.
**How to avoid:**
- For v2-08: Only show Google OAuth (per CONTEXT.md decision)
- Remove Kakao and Apple temporarily (add in v2.1)
- Use consistent sizing: 320px width, 52px height, 12px border-radius
**Warning signs:** User asks "Which one should I use?" or ignores all options.

### Pitfall 5: StepIndicator Active State Confusion
**What goes wrong:** User can't tell which step is active vs. completed.
**Why it happens:** Completed steps use same color as active step.
**How to avoid:** Per decoded.pen spec:
- Active step: Primary color (#D9FC69)
- Completed steps: Also Primary color (no visual distinction needed)
- Incomplete steps: #3D3D3D (muted)
- No scale effect; fixed 8px size
**Warning signs:** User clicks "back" thinking they're on wrong step.

## Code Examples

Verified patterns from official sources and existing codebase:

### Step Transition with Direction Awareness
```typescript
// Source: Existing codebase + Motion best practices
import { AnimatePresence, motion } from 'motion/react';

interface StepContentProps {
  currentStep: RequestStep;
  children: React.ReactNode;
}

export function StepContent({ currentStep, children }: StepContentProps) {
  // Direction: forward (1→2→3) or backward (3→2→1)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  useEffect(() => {
    const prevStep = useRequestStore.getState().currentStep;
    setDirection(currentStep > prevStep ? 'forward' : 'backward');
  }, [currentStep]);

  const variants = {
    enter: (dir: string) => ({
      x: dir === 'forward' ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (dir: string) => ({
      x: dir === 'forward' ? '-100%' : '100%',
      opacity: 0
    })
  };

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={currentStep}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

### StepIndicator (3 Dots, No Connecting Lines)
```typescript
// Updated from existing StepIndicator.tsx
const STEPS = [
  { step: 1, label: "Upload" },
  { step: 2, label: "Detect" },
  { step: 3, label: "Details" }, // Submit merged here
] as const;

export function StepIndicator({ currentStep }: { currentStep: RequestStep }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {STEPS.map(({ step }) => {
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;

        return (
          <div
            key={step}
            className={`
              h-2 w-2 rounded-full transition-colors duration-200
              ${isActive || isCompleted ? 'bg-primary' : 'bg-[#3D3D3D]'}
            `}
            aria-label={`Step ${step}: ${STEPS[step - 1].label}`}
            aria-current={isActive ? 'step' : undefined}
          />
        );
      })}
    </div>
  );
}
```

### Form Input with Label and Error (Design System Pattern)
```typescript
// Pattern for MediaSourceInput, ArtistInput, etc.
interface InputWithLabelProps {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
}

function InputWithLabel({ label, required, error, helperText, children }: InputWithLabelProps) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
      {!error && helperText && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}
```

### OAuth Button (Simplified for Google Only)
```typescript
// Source: Existing OAuthButton.tsx (simplified)
interface OAuthButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function OAuthButton({ onClick, isLoading, disabled }: OAuthButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className="
        relative flex w-full max-w-[320px] items-center justify-center gap-3
        h-[52px] rounded-xl px-4 py-3.5 text-sm font-medium transition-all
        bg-white text-gray-700 border border-gray-300
        hover:bg-gray-50 active:bg-gray-100
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
      "
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <GoogleIcon className="h-5 w-5" />
      )}
      <span>Continue with Google</span>
    </button>
  );
}
```

### Skeleton Loading for DetectedItemCard
```typescript
// Pattern from Material UI Skeleton + design system
function DetectedItemCardSkeleton() {
  return (
    <div className="rounded-lg border border-border p-4 animate-pulse">
      {/* Thumbnail */}
      <div className="w-full aspect-square bg-muted rounded-md mb-3" />

      {/* Title */}
      <div className="h-4 bg-muted rounded w-3/4 mb-2" />

      {/* Description */}
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-5/6" />
      </div>

      {/* Badge */}
      <div className="h-6 bg-muted rounded-full w-16 mt-3" />
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Framer Motion library | Motion library | v12+ (2024) | Same API, lighter bundle; import from 'motion/react' not 'framer-motion' |
| 4-step flow (Upload/Detect/Details/Submit) | 3-step flow (Submit merged into Details) | v2-08 spec | Simpler UX; fewer clicks |
| On-submit validation | Inline validation on blur | 2025+ UX research | Faster feedback, lower cognitive load |
| Multiple OAuth providers | Progressive rollout (Google first) | v2-08 decision | Avoids NASCAR problem; add more providers later |
| Spinner loading state | Skeleton screens | 2024+ design trends | Perceived performance boost; less jarring |

**Deprecated/outdated:**
- **Framer Motion package name:** Use `motion` not `framer-motion` (v12+ rebrand)
- **AnimatePresence `exitBeforeEnter` prop:** Replaced by `mode="wait"` in motion v10+
- **4-step RequestStore:** Update to 3-step for v2-08

## Open Questions

Things that couldn't be fully resolved:

1. **Should inline validation be real-time or on blur?**
   - What we know: Research says "on blur" for required fields, "on change" for format validation
   - What's unclear: User's preference for this app (no existing validation implemented)
   - Recommendation: Start with on-blur validation; add real-time for format fields (email, URL) if needed

2. **How to handle browser back button during step flow?**
   - What we know: RequestStore manages `currentStep`; browser back returns to previous route (/)
   - What's unclear: Should back button go to previous step or close flow?
   - Recommendation: Back button closes flow (returns to /); use RequestFlowHeader arrow-left for step navigation

3. **Should detection errors retry automatically?**
   - What we know: Detection can fail due to network/API errors
   - What's unclear: Auto-retry vs. manual retry button
   - Recommendation: Show error message with "Retry" button; no auto-retry to avoid infinite loops

4. **Skeleton loading duration for DetectedItemCard?**
   - What we know: Detection typically takes 2-5 seconds
   - What's unclear: Fixed duration vs. actual API response time
   - Recommendation: Show skeleton until API returns; no artificial delay

## Sources

### Primary (HIGH confidence)
- Existing codebase:
  - `packages/web/lib/components/request/` - Current Request flow components
  - `packages/web/lib/stores/requestStore.ts` - Step flow state management
  - `packages/web/lib/components/search/SearchOverlay.tsx` - AnimatePresence slide pattern
  - `packages/web/lib/components/profile/ActivityContent.tsx` - Tab transition pattern (0.2s fade)
  - `packages/web/lib/components/ui/button.tsx` - Button variants with cva
  - `packages/web/app/globals.css` - Design system tokens from v2-01
- Context documents:
  - `.planning/phases/v2-08-request-flow-login/v2-08-CONTEXT.md` - User decisions and constraints
  - `.planning/STATE.md` - Prior animation patterns from v2-06, v2-07

### Secondary (MEDIUM confidence)
- [Multi-step forms with Transition Effects in React](https://blog.openreplay.com/multi-step-forms-with-transition-effects-in-react/) - AnimatePresence patterns for step transitions
- [Mastering Page Transitions with Framer Motion](https://react-news.com/mastering-page-transitions-a-deep-dive-into-animating-react-routes-with-framer-motion) - Direction-aware animations
- [Login & Signup UX – Complete 2025 Guide](https://www.authgear.com/post/login-signup-ux-guide) - OAuth button design best practices
- [Form Validation UX And Best Practices](https://userpeek.com/blog/form-validation-ux-and-best-practices/) - Inline validation timing
- [Implementing Skeleton Screens In React](https://www.smashingmagazine.com/2020/04/skeleton-screens-react/) - Loading state patterns

### Tertiary (LOW confidence)
- [React Loading Skeleton npm](https://www.npmjs.com/package/react-loading-skeleton) - Library option (not installed; consider if needed)
- [Direction-aware animations in Framer Motion](https://sinja.io/blog/direction-aware-animations-in-framer-motion) - Advanced transition patterns (may be over-engineered for this phase)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and used in codebase
- Architecture: HIGH - Existing patterns from v2-06/v2-07 well-documented
- Pitfalls: MEDIUM - Based on general UX research and codebase inspection (not user testing)

**Research date:** 2026-02-05
**Valid until:** 2026-03-05 (30 days - stable React/animation patterns)
