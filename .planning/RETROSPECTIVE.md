# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v5.0 — AI Magazine & Archive Expansion

**Shipped:** 2026-03-12
**Phases:** 3 | **Plans:** 11 | **Sessions:** ~5

### What Was Built
- LayoutJSON-driven MagazineRenderer with 6 component types and GSAP orchestration
- 3 magazine pages: daily editorial (/magazine), personal ritual (/magazine/personal), 3D studio collection (/collection)
- Cinema-to-Action main page renewal — Hero tilt/glow, MasonryGrid parallax, SmartNav
- Spline Pro 3D Studio with studioStore state machine, data/event bridges, HTML overlays
- WebGL fallback path for non-capable browsers (BookshelfViewFallback)

### What Worked
- Wave-based sequential execution kept context clean (3 waves, no parallelism needed since each plan depended on the previous)
- Checkpoint at m7-03-03 visual verification provided a natural quality gate before marking complete
- studioStore semantic actions pattern (focusIssue/unfocus) simplified all downstream consumers
- Self-hosted .splinecode approach eliminated CDN CORS issues upfront
- Mock-first approach (m7-01) enabled frontend iteration without backend dependency

### What Was Inefficient
- ROADMAP.md plan checkboxes not updated by executor agents — manual fix needed at milestone close
- No formal REQUIREMENTS.md for M7 — milestone was ad-hoc without GSD requirements definition
- Some summary fields (one_liner) not populated by executors, reducing automated extraction quality
- Quick tasks (039-056) tracked in STATE.md but not formally linked to milestone scope

### Patterns Established
- Spline Pro integration pattern: studioStore (state machine) → useSplineRuntime (hook) → useSplineBridge (data sync) → useSplineEvents (interactions)
- Composition root pattern for 3D+2D UI: SplineStudio renders both canvas and HTML overlays as siblings
- Prop-less overlay pattern: components read from Zustand store directly instead of prop drilling through orchestrator
- ConditionalNav pattern for per-route navigation appearance (transparent/solid)

### Key Lessons
1. Mock-first frontend development (m7-01) creates a solid foundation that enables rapid iteration on visual features without backend coordination
2. Spline Pro Runtime API integration requires clear separation between data bridge (store → scene) and event bridge (scene → store) — mixing them creates circular dependencies
3. WebGL detection + fallback should be built into the first plan, not deferred — it affects component architecture

### Cost Observations
- Model mix: ~20% opus (orchestration), ~80% sonnet (execution)
- Sessions: ~5 (plan + 3 waves + checkpoint continuation)
- Notable: Wave-based sequential execution with sonnet executors was cost-efficient for dependent plans

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 5 | 5 | Initial GSD setup |
| v1.1 | 5 | 13 | Parallel worktree execution |
| v2.0 | 9 | 26 | Large-scale design overhaul |
| v2.1 | 6 | 14 | Component-focused, CVA pattern |
| v3.0 | 6 | 12 | Admin panel, defense-in-depth |
| v4.0 | 9 | 13 | Documentation-only milestone |
| v5.0 | 3 | 11 | 3D integration, mock-first approach |

### Top Lessons (Verified Across Milestones)

1. Mock-first approach enables rapid frontend iteration (validated in v2.0, v5.0)
2. Wave-based execution with clear dependencies prevents merge conflicts (validated in v1.1, v5.0)
3. Composition root pattern scales well for complex UI with multiple overlay layers (validated in v2.0, v5.0)
