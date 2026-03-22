# AI Agent Context Injection Guide

> Single source of truth for "which spec files to load" for any given task. This file defines the context-loading protocol for AI agents working in decoded-app.
>
> **Cross-reference:** `specs/README.md` AI Agent Injection Guide section links here.

---

## Decision Tree

```
What are you doing?
│
├── Modifying an existing screen
│   → Screen spec + component-registry.md + store-map.md
│
├── Adding a new feature to an existing screen
│   → Flow spec (if exists) + screen spec + api-contracts.md + component-registry.md
│
├── Fixing a bug
│   → Screen spec + component-registry.md + store-map.md
│   → If data/API related, add: api-contracts.md + data-models.md
│
├── Creating a new screen from scratch
│   → _shared/templates/screen-spec-template.md + component-registry.md + relevant flow spec
│
├── Modifying data flow (API calls, store state, data transformations)
│   → api-contracts.md + data-models.md + store-map.md
│
├── Updating a shared component (design system)
│   → component-registry.md + affected screen specs (load the 1–2 most relevant)
│
└── Understanding architecture / onboarding
    → store-map.md + api-contracts.md + data-models.md
```

---

## Task Type Reference

### Modifying an existing screen

**Goal:** Change UI, layout, behavior, or content of an existing page.

| Priority | File | Purpose |
|----------|------|---------|
| Required | Screen spec (`specs/screens/{bundle}/SCR-*.md`) | Requirements and component map |
| Required | `specs/_shared/component-registry.md` | Verify which design system components to use |
| Required | `specs/_shared/store-map.md` | Understand state management for this screen |
| Optional | `specs/_shared/api-contracts.md` | If changing data fetching |
| Optional | `specs/_shared/data-models.md` | If touching data shapes |

**Loading order:** screen spec first → component-registry → store-map

---

### Adding a new feature to an existing screen

**Goal:** Extend a page with new functionality (new modal, new section, new interaction).

| Priority | File | Purpose |
|----------|------|---------|
| Required | Screen spec for the affected screen | Existing requirements context |
| Required | `specs/_shared/api-contracts.md` | Endpoint to call for new feature |
| Required | `specs/_shared/component-registry.md` | Components to compose new UI |
| Optional | Flow spec (`specs/flows/FLW-*.md`) | If feature is part of a user journey |
| Optional | `specs/_shared/store-map.md` | If feature needs new state |
| Optional | `specs/_shared/data-models.md` | If feature introduces new data types |

**Loading order:** flow spec (if any) → screen spec → api-contracts → component-registry

---

### Fixing a bug

**Goal:** Diagnose and resolve incorrect behavior.

| Priority | File | Purpose |
|----------|------|---------|
| Required | Screen spec for the affected screen | Intended behavior vs. broken behavior |
| Required | `specs/_shared/component-registry.md` | Verify correct component usage |
| Required | `specs/_shared/store-map.md` | Understand state transitions that may be wrong |
| Optional | `specs/_shared/api-contracts.md` | If bug is in API call or response handling |
| Optional | `specs/_shared/data-models.md` | If bug is in data type mismatch |

**Loading order:** screen spec → store-map → component-registry

---

### Creating a new screen from scratch

**Goal:** Build a page that doesn't exist yet, following v4.0 spec format.

| Priority | File | Purpose |
|----------|------|---------|
| Required | `specs/_shared/templates/screen-spec-template.md` | Spec format and structure |
| Required | `specs/_shared/component-registry.md` | Available components to specify |
| Optional | Relevant flow spec | User journey context for the screen |
| Optional | `specs/_shared/api-contracts.md` | Endpoints the screen will call |
| Optional | `specs/_shared/store-map.md` | Stores the screen will consume |

**Loading order:** template → component-registry → relevant context files

---

### Modifying data flow

**Goal:** Change API calls, store state, data transformations, or type definitions.

| Priority | File | Purpose |
|----------|------|---------|
| Required | `specs/_shared/api-contracts.md` | Endpoint signatures and response shapes |
| Required | `specs/_shared/data-models.md` | Type definitions for entities |
| Required | `specs/_shared/store-map.md` | Store state that consumes the data |
| Optional | Affected screen specs | UI implications of data change |

**Loading order:** api-contracts → data-models → store-map

---

### Updating a shared component

**Goal:** Modify a design system component in `packages/web/lib/design-system/`.

| Priority | File | Purpose |
|----------|------|---------|
| Required | `specs/_shared/component-registry.md` | Component's current props and usage |
| Optional | 1–2 most relevant screen specs | How screens depend on this component |
| Optional | CMN spec (`specs/_shared/components/CMN-*.md`) | If it's a layout component (header/footer/nav) |

**Loading order:** component-registry → CMN spec (if layout) → affected screens

---

### Understanding architecture

**Goal:** Learn how the system works before contributing (onboarding or audit).

| Priority | File | Purpose |
|----------|------|---------|
| Required | `specs/_shared/store-map.md` | State management patterns |
| Required | `specs/_shared/api-contracts.md` | Backend surface and auth model |
| Required | `specs/_shared/data-models.md` | Core entity types |
| Optional | `specs/_shared/component-registry.md` | UI component catalog |
| Optional | `.planning/codebase/ARCHITECTURE.md` | System architecture narrative |

**Loading order:** store-map → api-contracts → data-models

---

### Admin feature work

**Goal:** Build or modify features in the admin panel (`/admin` routes).

| Priority | File | Purpose |
|----------|------|---------|
| Required | `specs/admin/` | v3.0 admin specs — entity management, UI patterns |
| Optional | `specs/_shared/api-contracts.md` | API endpoints the admin feature calls |
| Optional | `specs/_shared/data-models.md` | Entity types managed by admin |

> Note: `specs/admin/` uses v3.0 spec format — it is a permanent exception and will not be rewritten to v4.0 format.

**Loading order:** admin spec → api-contracts (if needed) → data-models (if needed)

---

## File Inventory

All spec files with their purpose and location:

| File | Path | Purpose | Size target |
|------|------|---------|-------------|
| Component Registry | `specs/_shared/component-registry.md` | Design system catalog — 52 components with file paths, props, usage | ~700 lines |
| Data Models | `specs/_shared/data-models.md` | Entity type reference — TypeScript types for all major entities | ~650 lines |
| API Contracts | `specs/_shared/api-contracts.md` | Endpoint reference — 24 routes with params, body, response, auth | ~700 lines |
| Store Map | `specs/_shared/store-map.md` | State management reference — 6 Zustand stores with state shapes, transitions, screen usage | ~330 lines |
| Injection Guide | `specs/_shared/injection-guide.md` | This file — context loading protocol | ~200 lines |
| Screen Spec Template | `specs/_shared/templates/screen-spec-template.md` | Template for new screen specs | ~100 lines |
| Flow Spec Template | `specs/_shared/templates/flow-spec-template.md` | Template for new flow specs | ~100 lines |
| CMN-01 Header | `specs/_shared/components/CMN-01-header.md` | Header component spec (DesktopHeader + MobileHeader) | ~80 lines |
| CMN-02 Footer | `specs/_shared/components/CMN-02-footer.md` | Footer component spec (DesktopFooter) | ~80 lines |
| CMN-03 Mobile Nav | `specs/_shared/components/CMN-03-mobile-nav.md` | Mobile bottom nav spec (NavBar + NavItem) | ~80 lines |
| CMN-03 Modals | `specs/_shared/components/CMN-03-modals.md` | Modal component spec | ~80 lines |
| CMN-04 Toasts | `specs/_shared/components/CMN-04-toasts.md` | Toast/notification spec | ~80 lines |

**Screen specs** (populated in v4-04 through v4-07):

| Bundle | Path | Screens |
|--------|------|---------|
| Detail View | `specs/screens/detail/SCR-VIEW-*.md` | Image detail, post detail, lightbox |
| Discovery | `specs/screens/discovery/SCR-DISC-*.md` | Home, explore, search, feed |
| Creation | `specs/screens/creation/SCR-CREA-*.md` | Upload, AI detection, solution editing |
| User System | `specs/screens/user/SCR-USER-*.md` | Login, profile, settings |

**Flow specs** (populated in v4-03):

| Prefix | Path | Flows |
|--------|------|-------|
| FLW-* | `specs/flows/FLW-*.md` | Request creation, search, auth flows |

**Future direction drafts** (DRAFT — do not inject for implementation tasks, see guardrail above):

| Prefix | Path | Content |
|--------|------|---------|
| NEXT-* | `specs/_next/NEXT-*.md` | Service identity, VTON, dynamic UI, commerce bridge — pending approval |

---

## DRAFT Document Guardrail — Do Not Inject NEXT-* Files

Files in `specs/_next/` (NEXT-01 through NEXT-04) are **future direction drafts**, not implementation specs. They are pending service direction approval and have no corresponding codebase implementation.

**Rules:**
- **Do NOT load NEXT-* files** when working on current codebase implementation tasks.
- **Do NOT treat NEXT-* content as requirements** — they are direction memos, not approved specs.
- **Only load NEXT-* files** when explicitly discussing future service direction, or when a NEXT-* item has been formally approved and promoted to a real spec (SCR-*, FLW-*, etc.).

---

## Loading Priority Rules

1. **Load the most specific file first.** Screen spec before shared files — screen specs define requirements, shared files provide reference context.

2. **Load shared files that match the task type.** Do not load all 5 shared files for every task. Use the decision tree above to select 2–3 relevant files.

3. **For cross-screen work, load the flow document first.** Flow specs provide user journey context that supersedes individual screen specs.

4. **Prefer the component-registry over reading source code.** The registry has verified paths and compact prop summaries. Only read source when the registry says "see source for full props."

5. **Store-map over reading store source.** The store map documents state shapes and transitions. Only read store source when implementing new state.

---

## Context Budget

Each shared file is designed to be compact:

| Content | Lines | Tokens (approx.) |
|---------|-------|-----------------|
| 1 shared file (average) | ~400 | ~3,000 |
| All 5 shared files | ~2,700 | ~20,000 |
| 1 screen spec | ~200 | ~1,500 |
| 1 flow spec | ~150 | ~1,100 |

**Recommended loading budget per task:**

| Task type | Load | Approx. lines |
|-----------|------|---------------|
| Simple UI change | 1 screen spec + component-registry | ~900 |
| Bug fix | 1 screen spec + component-registry + store-map | ~1,230 |
| Feature addition | flow + screen spec + api-contracts + component-registry | ~1,750 |
| Data flow change | api-contracts + data-models + store-map | ~1,680 |
| Architecture review | store-map + api-contracts + data-models | ~1,680 |

**Avoid** loading all 5 shared files plus multiple screen specs in a single context — total exceeds 3,000 lines and dilutes task focus.
