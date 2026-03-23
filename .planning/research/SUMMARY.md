# Project Research Summary

**Project:** decoded-monorepo v9.0 — Type-Safe API Client Generation
**Domain:** OpenAPI-driven TypeScript codegen (Orval + Zod) replacing hand-written fetch clients
**Researched:** 2026-03-23
**Confidence:** HIGH

## Executive Summary

The v9.0 milestone replaces `packages/web/lib/api/` — a hand-written fetch client with per-resource files and manually typed DTOs — with Orval-generated React Query hooks and TypeScript model types derived directly from the Rust/Axum backend's OpenAPI spec. The recommended approach is: install `orval@^8.5.3` and `zod@^3.25` in `packages/web`, configure a two-block `orval.config.ts` (one block for `client: 'react-query'`, a second for `client: 'zod'`), and wire a custom fetch mutator that preserves the existing Supabase JWT injection and Next.js proxy routing pattern. This replaces all per-resource files and hook wrappers without touching any component, store, or proxy route.

The highest-confidence recommendation from combined research is the phased, domain-by-domain migration strategy: generate code alongside the existing client first, validate parity on a single endpoint, then migrate one API tag at a time (badges → rankings → categories → comments → spots → solutions → users → posts → admin). Upload endpoints (binary/multipart) must remain as manual implementations permanently — Orval cannot correctly represent `File | Blob` parameters or custom retry/progress logic. Zod schema validation should be deferred until the core hook generation pipeline is confirmed working in CI.

The critical risks are front-loaded and concentrated in setup: the utoipa-generated OpenAPI spec may contain OpenAPI 3.1 nullable field syntax that produces uncompilable Zod output; `operationId` values auto-generated from Rust function names will produce hook names with `Handler`/`Route` suffixes; and baseURL misconfiguration will produce double-prefixed URLs or bypass the Next.js proxy. All three must be resolved before the first Orval generation run succeeds. Once setup is clean, the migration follows well-documented patterns with low regression risk if executed per-endpoint rather than per-feature.

---

## Key Findings

### Recommended Stack

The existing stack is unchanged — no new runtime dependencies except `axios@^1.13.6` and `zod@^3.25`, plus `orval@^8.5.3` as a dev dependency. Orval is the industry-standard Node.js CLI for OpenAPI-to-TypeScript codegen as of 2025-2026, actively maintained (v8.5.3 released March 6, 2025), and has native support for TanStack React Query v5 (already in use at `@tanstack/react-query@5.90.11`).

**Core technologies:**
- `orval@^8.5.3`: CLI that reads the OpenAPI spec and emits React Query hooks + TypeScript models — replaces all hand-written API function files; `tags-split` mode produces one folder per OpenAPI tag matching the existing per-domain structure
- `zod@^3.25`: Runtime validation library — use v3 (not v4) because Orval's Zod v4 compatibility has active edge-case bugs (#2249, #2304) as of March 2026; v3 is the battle-tested path
- `axios@^1.13.6`: HTTP client used by Orval-generated code — interceptors provide a single JWT injection point (replaces per-file `apiClient()` pattern); ships `bun` export condition for full bun compatibility

Version constraint that matters most: `orval@^8.x` targets TanStack Query v5 only. The project is already on v5 — no version negotiation needed.

### Expected Features

Orval replaces the following hand-written layers: `lib/api/client.ts`, `lib/api/posts.ts` (and all per-resource siblings), `lib/api/types.ts`, and the React Query hook wrappers in `lib/hooks/`. The custom mutator at `lib/api/mutator.ts` becomes the single auth injection point for all generated hooks. The Next.js API proxy routes (`app/api/v1/**`) are unchanged.

**Must have (table stakes — v9.0 launch blockers):**
- React Query hook generation (`useQuery`/`useMutation` per endpoint) — drop-in replacement for existing hooks
- TypeScript model generation — replaces `lib/api/types.ts`; all 30+ endpoint shapes covered automatically
- Custom mutator (`lib/api/mutator.ts`) — Supabase JWT injection + Next.js proxy routing; this is the first deliverable before any generated hook is usable
- `generate:api` script wired into `packages/web/package.json` and Turborepo pipeline (runs before `build` and `typecheck`)
- `tags-split` output mode — one folder per OpenAPI tag; matches existing per-domain structure in `lib/api/`
- `afterAllFilesWrite` formatting — Prettier + ESLint on generated files to pass pre-push CI (`just ci-web`)
- Full migration: delete `lib/api/[domain].ts` files and `lib/hooks/*.ts` wrappers per domain after validation
- `.gitignore` update: `packages/web/lib/api/generated/` excluded; CI drift check as compensating control

**Should have (add after v9.0 pipeline is validated):**
- Zod request body validation — for upload/detect flow where invalid payloads cause opaque 400 errors
- Zod response validation — for auth and user profile endpoints where silent data corruption is highest-risk
- Auto-invalidation helpers (`useInvalidate`) — eliminate manual `queryClient.invalidateQueries()` calls
- `useInfiniteQuery` generation for images and feed — once cursor/page parameter confirmed in spec
- `useOperationIdAsQueryKey` — human-readable DevTools query keys

**Defer to v10+:**
- MSW mock generation — requires adding `@faker-js/faker` + `msw`; significant setup investment
- `usePrefetch` for SSR — defer until App Router data fetching patterns are formalized
- Zod strict mode on responses — too many false positives during active backend development
- Zod coercion for query params — current manual parameter handling works correctly

### Architecture Approach

The architecture is additive and non-breaking: Orval-generated code lives at `lib/api/generated/` alongside existing `lib/api/` files during migration. Existing Next.js proxy routes (`app/api/v1/`), Zustand stores, and all React components are unchanged. Generated hooks in `packages/web` must never be moved to `packages/shared` — React Query hooks require `QueryClientProvider` context, and sharing hooks across package boundaries causes the "No QueryClient set" error (TanStack/query #3595).

**Major components:**
1. `orval.config.ts` (packages/web root) — two named config blocks: `client: 'react-query'` targeting `lib/api/generated/`; `client: 'zod'` with `fileExtension: '.zod.ts'` to prevent naming conflicts; both read from the same spec URL
2. `lib/api/mutator.ts` — custom fetch mutator; the single auth injection point for all generated hooks; calls `supabaseBrowserClient.auth.getSession()` per-request; uses empty-string baseURL to preserve Next.js proxy routing; replaces `lib/api/client.ts:apiClient()` logic
3. `lib/api/generated/` (gitignored) — Orval output: per-tag hook files, `model/` directory for TypeScript types, `.zod.ts` files for validation schemas
4. Upload endpoints (`/api/v1/posts/upload`, `/api/v1/posts` with FormData) — explicitly excluded from Orval generation in `orval.config.ts`; remain as manual `lib/api/upload.ts` permanently

**Key constraint:** The mutator must use `baseURL: ""` (empty string). The OpenAPI spec paths include `/api/v1/` prefix and the Next.js proxy routes handle `/api/v1/...`. Configuring any non-empty baseURL causes either CORS failures (direct backend) or double-prefixed URLs (`/api/v1/api/v1/...`).

### Critical Pitfalls

1. **OpenAPI 3.1 nullable fields from utoipa generate uncompilable Zod** — utoipa 4.x emits `type: ["string", "null"]` (OpenAPI 3.1 syntax) which Orval's Zod generator converts to invalid method chains like `z.number().regex()` (Orval #2562). Fix before running Orval: inspect the spec `openapi` field; if `"3.1.0"`, add a preprocessing script to normalize nullable syntax to OpenAPI 3.0 format before Orval consumes the spec.

2. **Auto-generated `operationId` values produce unusable hook names** — utoipa derives operationIds from Rust function names (`get_posts_handler` → `useGetPostsHandlerQuery`); duplicate operationIds produce TypeScript duplicate-export errors. Fix: audit every endpoint's operationId before the first generation run; add explicit `operation_id = "listPosts"` annotations in Rust (camelCase `verbNoun` pattern); add a spec linting step.

3. **baseURL misconfiguration causes double-prefixed URLs or CORS failures** — setting `baseURL` to backend URL bypasses proxy (CORS, no server secrets); non-empty string with spec paths already containing `/api/v1/` causes double-prefixing. Fix: always use `baseURL: ""` in the mutator; validate with a single endpoint smoke test before migrating any production code.

4. **Multipart upload endpoints cannot be generated correctly** — Orval v8 generates `string` for binary fields (should be `File | Blob`); progress callbacks and retry logic cannot be expressed in generated hooks. Fix: exclude upload endpoints in `orval.config.ts`; keep `lib/api/upload.ts` manual permanently.

5. **Query key collisions during gradual migration cause cache bugs** — old and new hooks for the same endpoint coexist in React Query cache, causing dual network requests and invalidation that does not propagate across key structures. Fix: migrate per-endpoint atomically — never leave both old and new hooks active for the same endpoint simultaneously (Orval #2359).

---

## Implications for Roadmap

Based on combined research, a 5-phase structure is recommended. Phases 1 and 2 are strict serial prerequisites. Phase 3 and 4 have an internal ordering within them. Phase 5 is a hardening gate.

### Phase 1: Setup and Spec Validation
**Rationale:** All downstream work depends on a clean, Orval-parseable OpenAPI spec and a confirmed working codegen invocation. The utoipa nullable pitfall and operationId pitfall both block this phase. Resolving them before writing any generated code prevents cascading failures across all later phases.
**Delivers:** `orval@^8.5.3` installed as devDependency in `packages/web`; `orval.config.ts` skeleton created; `bun run generate:api` runs without errors; generated TypeScript compiles without TypeScript errors (`bun run typecheck`); spec linting confirms clean operationIds; Turborepo `generate` task declared in `turbo.json`.
**Addresses features:** `generate:api` script wiring, Turborepo pipeline task, `.gitignore` update, bun invocation pattern established.
**Avoids:** Pitfall 1 (OpenAPI 3.1 nullable → uncompilable Zod), Pitfall 2 (operationId names), Pitfall 7 (bun/Turborepo CLI version mismatch).

### Phase 2: Custom Mutator and Generation Configuration
**Rationale:** The mutator is the first deliverable — without it, no generated hook can authenticate or route correctly. This phase also establishes the naming convention policy (snake_case field preservation) and permanently excludes upload endpoints before any migration begins, preventing those exclusions from being discovered mid-migration.
**Delivers:** `lib/api/mutator.ts` with Supabase JWT injection and empty-string baseURL; `orval.config.ts` finalized with `tags-split` mode, upload endpoint exclusions, `afterAllFilesWrite` formatting hooks; single-endpoint smoke test confirms auth token in Network tab, correct URL (no double-prefix), and data shape matching existing `lib/api/types.ts`.
**Uses:** `axios@^1.13.6`, `supabaseBrowserClient.auth.getSession()` pattern from existing `lib/api/client.ts`.
**Implements:** Custom fetch mutator pattern; two-config block architecture.
**Avoids:** Pitfall 3 (snake_case naming policy), Pitfall 4 (baseURL double-prefix), Pitfall 5 (multipart upload type mismatch).

### Phase 3: Read Hook Migration (Domain by Domain)
**Rationale:** Read hooks (GET endpoints) are lower risk than mutations — no cache invalidation logic, no Zustand store syncing. Migrating in ascending complexity order minimizes blast radius if a domain reveals an unexpected Orval behavior. The thin wrapper pattern (keep hook signature, swap `queryFn` to generated function) preserves backward compatibility so zero component changes are needed.
**Delivers:** All GET endpoint hooks replaced with generated `use[OperationId]` hooks in order: badges → rankings → categories → comments → spots → solutions → users → posts → admin. Per-resource `lib/api/[domain].ts` files deleted as each domain completes. `lib/api/types.ts` deleted when `lib/api/generated/model/` covers all types.
**Addresses features:** TypeScript model generation (SSOT established), `tags-split` file organization, index barrel exports, full `lib/api/[domain].ts` deletion.
**Avoids:** Pitfall 6 (query key collisions) — enforced by per-endpoint atomic migration; old and new hooks never active simultaneously for the same endpoint.

### Phase 4: Mutation Hook Migration and Cache Wiring
**Rationale:** Mutations require extra care because they have `onSuccess` cache invalidation and Zustand store syncing logic that does not appear in generated code and must be explicitly preserved at the call site. `useUpdateProfile` (syncs with `profileStore` on success) must be migrated last. Generated mutation files regenerate on next `bun run generate:api` — any manual edits inside them are lost.
**Delivers:** All POST/PATCH/DELETE hooks replaced with generated `useCreate*`/`useUpdate*`/`useDelete*` hooks; `onSuccess` cache invalidation logic moved to call sites using generated `get[OperationId]QueryKey()` helpers; `lib/api/client.ts` deleted; `lib/hooks/*.ts` wrapper files deleted; `lib/api/index.ts` updated to export only from `generated/`.
**Implements:** Cache invalidation pattern via mutation option prop at call sites (not in generated files).
**Avoids:** Anti-pattern of editing generated files; anti-pattern of full cutover before per-domain validation.

### Phase 5: CI Integration, Drift Detection, and Cleanup
**Rationale:** The migration is complete but needs hardening before it is production-stable. The CI drift detection step is the final safety net that prevents stale types from shipping silently when the backend's OpenAPI spec changes. Without it, a backend PR that adds a field will not cause frontend CI to fail — the type error is invisible until runtime.
**Delivers:** `bun run generate && git diff --exit-code packages/web/lib/api/generated/` added to CI; `packages/web/scripts/pre-push.sh` updated to run `bun run generate:api` before `tsc --noEmit`; `bun run build` succeeds end-to-end; Playwright visual QA passes on all migrated pages; type alias cleanup from Phase 1 name-overlap workarounds complete.
**Addresses features:** CI drift detection, generated file strategy (commit + drift check pattern), full cleanup.
**Avoids:** Pitfall 8 (stale generated files ship silently when spec changes).

### Phase Ordering Rationale

- Phase 1 before Phase 2: The mutator in Phase 2 depends on knowing what the spec looks like — if the spec requires preprocessing (OpenAPI 3.1 normalization), that preprocessing must be part of the `generate:api` script established in Phase 1.
- Phase 2 before Phase 3: The mutator is required for any generated hook to be functional. Starting migration without a working mutator means all generated hooks make unauthenticated calls through the wrong URL.
- Read hooks before mutation hooks (Phase 3 before Phase 4): Reads are stateless. Confirming data shapes match before adding cache invalidation complexity reduces the space of what can go wrong during mutation migration.
- Domain order within Phase 3 (simple to complex): Badges and rankings have the fewest dependencies and simplest shapes. Posts and admin have the most complex shapes and the most consumers. Start simple to build confidence.
- Phase 5 last: CI drift detection requires knowing the final state of all generated files to calibrate. Adding it mid-migration would produce false positives during the transition window.

### Research Flags

Phases needing inspection or deeper research during planning:
- **Phase 1 (Spec inspection — potentially blocking):** Whether the spec at `https://dev.decoded.style/api-docs/openapi.json` is OpenAPI 3.0 or 3.1 determines whether a preprocessing normalization script is required. Whether utoipa handlers have explicit `operation_id` annotations determines whether a Rust backend PR is a Phase 1 prerequisite. Both questions require reading the live spec and the Rust source — this is the highest-uncertainty point in the entire roadmap.
- **Phase 4 (useUpdateProfile store sync):** `useUpdateProfile` syncs auth state into `profileStore` on success. The generated hook provides only the mutation primitive. The Zustand sync pattern must be explicitly preserved at the call site. Review the existing implementation before Phase 4 begins to scope the migration correctly.

Phases with standard, well-documented patterns (skip additional research):
- **Phase 2:** Orval custom mutator with fetch is covered by official docs and verified production examples.
- **Phase 3:** Domain-by-domain hook migration is the standard Orval adoption path; thin wrapper strategy is established.
- **Phase 5:** CI drift check pattern is documented in community references; no novel integration.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Orval v8.5.3 verified from official GitHub releases; axios 1.13.6 from npm; zod v3 stable path confirmed; all versions cross-checked against project's existing React Query v5 dependency |
| Features | HIGH | Feature set derived from official Orval docs and DeepWiki codebase analysis; table stakes vs. differentiators distinction clear from multiple corroborating sources |
| Architecture | HIGH | Custom mutator pattern verified from official Orval sample code; proxy-preservation pattern derived from existing codebase inspection; shared-package anti-pattern verified from TanStack Query official issue tracker |
| Pitfalls | HIGH (Orval/utoipa mechanics), MEDIUM (migration patterns) | Orval/utoipa bugs verified from official GitHub issue tracker with confirmed reproducers; migration patterns are inferred from community practice with multiple corroborating sources but no single authoritative guide |

**Overall confidence:** HIGH

### Gaps to Address

- **OpenAPI spec version (blocking for Phase 1):** Whether `https://dev.decoded.style/api-docs/openapi.json` returns `"openapi": "3.1.0"` or `"3.0.x"` determines whether a preprocessing normalization step is required. Fetch and inspect the spec as the first action in Phase 1 execution.

- **utoipa operationId audit (blocking for Phase 1):** Whether existing Axum handlers have explicit `operation_id` annotations cannot be answered from research alone. Inspect the spec's `operationId` values; if auto-generated from Rust function names (snake_case or `Handler` suffixes), a backend PR to add explicit annotations is a Phase 1 prerequisite.

- **Cursor/offset pagination parameter name (affects Phase 3):** The OpenAPI spec's exact pagination parameter name (`cursor`? `page`? `offset`?) for images and feed endpoints determines `useInfiniteQueryParam` configuration. Confirm from the live spec before enabling `useInfiniteQuery` generation.

- **`useInvalidate` scope boundary (affects Phase 4):** The `useInvalidate` helpers only cover Orval-generated queries. Manual Supabase queries in `packages/shared/supabase/queries/` are not covered and require explicit `queryClient.invalidateQueries()` calls regardless. Confirm the scope of manual invalidation required before Phase 4 begins.

---

## Sources

### Primary (HIGH confidence)
- https://github.com/orval-labs/orval/releases — Orval v8.5.3 release date, changelog
- https://www.orval.dev/reference/configuration/output — Complete output configuration reference
- https://www.orval.dev/guides/react-query — React Query hook generation patterns, query key naming, infinite query
- https://www.orval.dev/guides/client-with-zod — Two-config pattern for react-query + zod parallel generation
- https://www.orval.dev/guides/custom-axios — Custom mutator function signature
- https://www.npmjs.com/package/zod — Zod v3 active and stable, v4 edge-case bugs confirmed
- https://github.com/axios/axios/releases — Axios 1.13.6 latest as of March 2026
- https://github.com/orval-labs/orval/issues/2249 — Orval Zod v4 string format bug
- https://github.com/orval-labs/orval/issues/2304 — Orval Zod v4 + Hono validator error
- https://github.com/orval-labs/orval/issues/2562 — Zod uncompilable types from OpenAPI 3.1 nullable
- https://github.com/orval-labs/orval/issues/2359 — Query key collision for infinite + regular query
- https://github.com/orval-labs/orval/issues/2864 — Multipart/form-data binary type regression
- https://github.com/orval-labs/orval/security/advisories/GHSA-h526-wf6g-67jv — CVE-2026-23947 code injection via x-enum-descriptions
- https://github.com/TanStack/query/issues/3595 — TanStack Query shared library "No QueryClient set" error
- https://github.com/TanStack/query/issues/7965 — QueryClient provider cross-package issue
- Existing codebase (read directly): `packages/web/lib/api/client.ts`, `lib/api/types.ts`, `lib/hooks/usePosts.ts`, `lib/hooks/useProfile.ts`, `app/api/v1/posts/route.ts`

### Secondary (MEDIUM confidence)
- https://deepwiki.com/orval-labs/orval/5-zod-schema-validation — Two-phase Zod generation, schema naming conventions, five schema types per operation
- https://deepwiki.com/orval-labs/orval/5.1-zod-generation-configuration — Strict, coerce, per-context overrides, Zod v3/v4 auto-detection
- https://deepwiki.com/orval-labs/orval/2.2-output-modes — tags-split recommended for large APIs
- https://prototyp.digital/blog/generating-api-client-openapi-swagger-definitions — Production Orval migration workflow
- https://github.com/vercel/turborepo/issues/4762 — Turborepo + bun `--filter` flag conflict
- https://vercel.com/blog/how-we-optimized-package-imports-in-next-js — Barrel files and Next.js tree-shaking
- https://github.com/juhaku/utoipa/issues/973 — utoipa nullable $ref OpenAPI 3.1 issue
- https://github.com/juhaku/utoipa/issues/1215 — utoipa query param nullable issue

### Tertiary (LOW confidence)
- https://andyprimawan.com/generate-typescript-sdks-and-react-query-hooks-for-nextjs-with-orval-and-openapi-specs/ — Full Next.js config with auth interceptors (community article, patterns verified against official docs)
- https://www.neteye-blog.com/2025/09/summoning-orval-binding-backend-and-frontend-by-magic/ — CI/CD integration, afterAllFilesWrite pattern (community article)

---
*Research completed: 2026-03-23*
*Ready for roadmap: yes*
