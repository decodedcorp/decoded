# DECODED Specifications

> Version: 4.1 | Updated: 2026-03-05

## Overview

This directory contains feature specifications (design intent) for decoded-app.

- **specs/**: Design intent — what should exist and how it should behave
- **docs/**: Implementation records — what is currently built
- **.planning/codebase/**: Current code analysis — how it actually works

Specs are optimized for AI agent context injection: compact, structured, verified paths.

## Directory Structure

```
specs/
├── _archive/v2.1.0/       # Previous version snapshot (read-only)
├── _shared/               # Shared foundation
│   ├── component-registry.md    # All components with verified file paths
│   ├── data-models.md           # Canonical data shapes
│   ├── api-contracts.md         # API endpoint contracts
│   ├── store-map.md             # Zustand store inventory
│   ├── injection-guide.md       # How to inject specs into AI prompts
│   ├── components/              # Shared component specs (CMN-*)
│   │   ├── CMN-01-header.md
│   │   ├── CMN-02-footer.md
│   │   ├── CMN-03-mobile-nav.md
│   │   ├── CMN-03-modals.md
│   │   └── CMN-04-toasts.md
│   └── templates/               # Spec templates
│       ├── screen-spec-template.md
│       └── flow-spec-template.md
├── _next/                 # Future feature drafts (DRAFT status)
├── admin/                 # v3.0 admin specs (exception — v3.0 format)
├── flows/                 # User journey flows (FLW-*)
├── screens/               # Screen specs by bundle
│   ├── detail/            # SCR-VIEW-* (detail view screens)
│   ├── discovery/         # SCR-DISC-* (home, search, feed)
│   ├── creation/          # SCR-CREA-* (upload, AI tagging)
│   ├── magazine/          # SCR-MAG-* (AI magazine, personal issue) -- M7
│   ├── collection/        # SCR-COL-* (bookshelf, archive) -- M7
│   ├── vton/              # SCR-VTON-* (virtual try-on studio) -- M7
│   └── user/              # SCR-USER-* (login, profile, settings)
└── README.md
```

## ID Scheme

| Prefix | Category | Format | Example |
|--------|----------|--------|---------|
| SCR-VIEW- | Detail view screens | SCR-VIEW-NN | SCR-VIEW-01 |
| SCR-DISC- | Discovery screens | SCR-DISC-NN | SCR-DISC-01 |
| SCR-CREA- | Creation screens | SCR-CREA-NN | SCR-CREA-01 |
| SCR-USER- | User system screens | SCR-USER-NN | SCR-USER-01 |
| SCR-MAG- | Magazine screens | SCR-MAG-NN | SCR-MAG-01 |
| SCR-COL- | Collection screens | SCR-COL-NN | SCR-COL-01 |
| SCR-CREA-TRY- | Try upload screens | SCR-CREA-TRY-NN | SCR-CREA-TRY-01 |
| SCR-VTON- | VTON screens | SCR-VTON-NN | SCR-VTON-01 |
| FLW- | User journey flows | FLW-NN | FLW-01 |
| CMN- | Shared components | CMN-NN | CMN-01 |

## Spec Format Rules

1. **200-line target** (300-line max with written justification in frontmatter)
2. **EARS syntax** for requirements: "When [trigger], the system shall [behavior]"
3. **Mobile-first** layout: mobile wireframe is the primary design, desktop is adaptation
4. **Verified file paths**: every component path checked against filesystem before publishing
5. **No anti-features**:
   - No i18n sections (handled separately)
   - No version history tables (use git log)
   - No copied TypeScript type definitions (reference the source file)
   - No placeholder sections (omit sections that don't apply)
   - No implementation checklists (not design intent)
   - No test scenario tables (separate test docs)

## AI Agent Injection Guide

Quick reference for loading specs into AI agent prompts:

| Task | Load These Files |
|------|-----------------|
| Modifying a screen | Screen spec + `_shared/component-registry.md` + `_shared/store-map.md` |
| Adding a feature | Flow spec + affected screen specs + `_shared/api-contracts.md` |
| Fixing a bug | Screen spec + `_shared/component-registry.md` + `_shared/store-map.md` |
| Understanding data | `_shared/data-models.md` + `_shared/api-contracts.md` |
| New screen from scratch | `_shared/templates/screen-spec-template.md` + `_shared/component-registry.md` |
| Admin feature work | `admin/` + relevant screen spec |
| Magazine implementation | SCR-MAG-01~05 + FLW-06 + FLW-07 + `_shared/api-contracts.md` |
| Collection implementation | SCR-COL-01~03 + `_shared/store-map.md` |
| VTON implementation | SCR-VTON-01~04 + FLW-05 + FLW-07 + NEXT-02 |
| My Try feature | FLW-08 + SCR-VIEW-01 + SCR-CREA-* |

> Full injection guide: `_shared/injection-guide.md`

## Templates

- [Screen spec template](./_shared/templates/screen-spec-template.md) — for SCR-* documents
- [Flow spec template](./_shared/templates/flow-spec-template.md) — for FLW-* documents

## Related Docs

- [.planning/codebase/ARCHITECTURE.md](../.planning/codebase/ARCHITECTURE.md) — system architecture
- [.planning/codebase/STRUCTURE.md](../.planning/codebase/STRUCTURE.md) — directory structure
- [.planning/codebase/CONVENTIONS.md](../.planning/codebase/CONVENTIONS.md) — coding conventions
- [docs/design-system/](../docs/design-system/) — design tokens
- [docs/api/](../docs/api/) — implemented API docs
