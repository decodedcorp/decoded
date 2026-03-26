---
phase: 47-observability
plan: "01"
subsystem: frontend-observability
tags: [sentry, error-tracking, web-vitals, nextjs, monitoring]
dependency_graph:
  requires: []
  provides: [sentry-nextjs-integration, web-vitals-monitoring, error-boundaries]
  affects: [packages/web/next.config.js, packages/web/instrumentation.ts]
tech_stack:
  added: ["@sentry/nextjs@10.46.0"]
  patterns:
    - Next.js instrumentation hook (register()) for server/edge Sentry init
    - App Router global-error.tsx boundary for React render error capture
    - withSentryConfig CommonJS wrapper for source map config
key_files:
  created:
    - packages/web/instrumentation-client.ts
    - packages/web/sentry.server.config.ts
    - packages/web/sentry.edge.config.ts
    - packages/web/instrumentation.ts
    - packages/web/app/global-error.tsx
  modified:
    - packages/web/next.config.js
    - packages/web/.env.local.example
    - packages/web/package.json
decisions:
  - "@sentry/nextjs/server subpath removed — not exported in v10.46.0; onRequestError is Next.js 15.3+ feature; register() still loads server/edge configs correctly"
  - "All Sentry env vars commented out by default — graceful degradation when DSN absent"
  - "hideSourceMaps: true prevents source map exposure in client bundles"
metrics:
  duration_seconds: 184
  completed_date: "2026-03-26"
  tasks_completed: 2
  tasks_total: 2
  files_created: 5
  files_modified: 3
---

# Phase 47 Plan 01: Sentry Next.js Integration Summary

**One-liner:** Integrated @sentry/nextjs 10.46.0 with browser/server/edge error capture, Web Vitals monitoring, and App Router global error boundary — all gracefully disabled without DSN.

## What Was Built

Installed and configured Sentry for the Next.js 16 frontend with full-stack error capture:

- **Browser init** (`instrumentation-client.ts`): Captures client-side errors and Web Vitals (LCP, CLS, INP automatically)
- **Server init** (`sentry.server.config.ts`): Captures Node.js server errors
- **Edge init** (`sentry.edge.config.ts`): Captures Edge runtime errors
- **Instrumentation hook** (`instrumentation.ts`): Next.js `register()` conditionally imports server/edge configs
- **Error boundary** (`app/global-error.tsx`): React App Router boundary captures unhandled render errors and provides reset UI
- **Build config** (`next.config.js`): Wrapped with `withSentryConfig` (CommonJS require) with `hideSourceMaps: true`
- **Env docs** (`.env.local.example`): 5 Sentry env vars documented and commented out

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed invalid @sentry/nextjs/server re-export**
- **Found during:** Task 2 (build verification)
- **Issue:** Plan specified `export { onRequestError } from "@sentry/nextjs/server"` but the `/server` subpath is not exported in `@sentry/nextjs@10.46.0` (package exports map only has: `.`, `./async-storage-shim`, `./import`, `./loader`). This is a Next.js 15.3+ feature not yet in the installed version.
- **Fix:** Removed the re-export line from `instrumentation.ts`. The `register()` function still correctly loads server and edge configs.
- **Files modified:** `packages/web/instrumentation.ts`
- **Commit:** e1049a19

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 3cfe5f4a | Install @sentry/nextjs and create 5 Sentry config files |
| Task 2 | e1049a19 | Wrap next.config.js with withSentryConfig, document env vars, fix instrumentation.ts |

## Self-Check: PASSED

All 7 files found on disk. Both task commits (3cfe5f4a, e1049a19) verified in git log.
