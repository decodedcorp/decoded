---
title: Cursor Profile
owner: human
status: approved
updated: 2026-04-17
tags: [agent, cursor, harness]
---

# Cursor Profile – Main Coding Assistant (v1.0)

**Last verified**: 2025-01-27

## When to Use Cursor

- Implementing new features defined in `specs/feature/`.
- Fixing bugs documented in `specs/bugfix/`.
- Applying refactors already reviewed by Claude.

## Expectations

- **Always read the relevant spec** before coding.
- **Maintain TypeScript strictness**; avoid `any` and unsafe `as` casts.
- **Keep components small**:
  - Prefer extracting hooks/helpers over large components.
- **Describe changes in English** in commit messages, but explain reasoning in Korean when talking to the user.

## Working Style

- **Propose incremental changes** instead of big-bang rewrites.
- **Highlight potential side effects** and affected modules.
- **Whenever touching data fetching or side effects**, mention:
  - Performance impact (load, re-renders).
  - Error handling and fallback behavior.

## Next.js / React Query / Zustand Specifics

(To be added based on project needs - add framework-specific patterns here as you discover them)
