# Feature Research

**Domain:** API code generation — Orval + Zod for OpenAPI-driven TypeScript client generation
**Researched:** 2026-03-23
**Confidence:** HIGH (Orval official docs + DeepWiki architecture analysis + multiple production implementation references)

## Context: What We Are Replacing

The existing `packages/web/lib/api/` layer is a hand-written fetch client:

- `client.ts` — shared `apiClient<T>()` wrapper using `fetch`, Supabase JWT injection, empty `API_BASE_URL` to route through the Next.js `/api/v1/` proxy
- Per-resource files (`posts.ts`, `users.ts`, `spots.ts`, `badges.ts`, `rankings.ts`, etc.) — typed request functions wrapping `apiClient`
- React Query hooks in `lib/hooks/` that wrap the above per-resource functions

Orval replaces the per-resource files and the React Query hook layer. The custom auth injection logic from `client.ts` migrates into an Orval **mutator function**.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that any Orval + Zod integration must deliver. Missing these means the tooling does not function as a code generation pipeline.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **React Query hook generation** | The project already uses React Query throughout. Orval must emit `useQuery`/`useMutation` hooks, not bare fetch functions. Engineers expect drop-in replacements, not a new calling convention. | LOW | `client: 'react-query'` in config. Generates one `use[OperationId]` hook per OpenAPI path. GET → `useQuery`, POST/PUT/PATCH/DELETE → `useMutation`. |
| **TypeScript model generation from OpenAPI** | Every endpoint needs typed request/response shapes. Writing these by hand against `https://dev.decoded.style` is what v9.0 replaces. | LOW | Orval reads the spec at generation time and emits `.ts` interface/type files into a `models/` directory. All 30+ endpoint shapes are covered automatically. |
| **Custom mutator for auth + proxy routing** | Existing `client.ts` injects Supabase JWT and uses an empty `API_BASE_URL` so all requests route via the Next.js `/api/v1/` proxy (avoiding CORS and keeping backend URL server-side). Generated hooks must preserve this behavior. | MEDIUM | `output.override.mutator` config points to a hand-written `mutator.ts`. The mutator receives `AxiosRequestConfig` and returns `Promise<T>`. It replaces the entire transport layer for all generated hooks. |
| **Single `generate:api` script** | Developers need one command to regenerate all clients when the backend spec changes. | LOW | `orval --config orval.config.ts` runs from `packages/web/`. Add to `package.json` scripts as `generate:api` and add to Turborepo pipeline before `build`. |
| **Query key generation** | React Query cache invalidation requires stable, predictable keys. The existing manual hooks use ad hoc string arrays. | LOW | Auto-generated: `get[OperationId]QueryKey()` function per endpoint. Default key is the route path as an array (e.g. `['/posts/{postId}', { postId }]`). Can switch to operation ID with `useOperationIdAsQueryKey: true`. |
| **tags-split output mode** | 30+ endpoints across ~10 domain tags (posts, users, spots, solutions, admin, badges, rankings, vton, events, categories). Flat single-file output is unmanageable at this scale. | LOW | `mode: 'tags-split'` creates one folder per OpenAPI tag (matching backend organization), then splits implementation/schemas/mocks within each folder. Matches the existing per-domain structure in `lib/api/`. |
| **Separate schemas directory** | Model types must be importable from both generated hooks and other non-hook code (stores, utilities). Mixing them into the same file as hooks creates awkward imports. | LOW | `output.schemas: './src/generated/models'` puts all type definitions in a dedicated path. `output.operationSchemas` for operation-specific param/body types. |
| **Index barrel exports** | Consumers import from a single path per tag, not from internal generated file paths that may change on next generation. | LOW | `indexFiles: true` (default) generates `index.ts` in each tag folder. `workspace` option generates a root `index.ts` with all exports. |
| **Post-generation formatting** | Generated files must pass the existing pre-push CI (`just ci-web` runs ESLint + Prettier + tsc). Unformatted generated code will fail CI immediately. | LOW | `output.hooks.afterAllFilesWrite: ['prettier --write', 'eslint --fix']` runs formatters automatically after every generation. |

---

### Differentiators (Competitive Advantage)

Features that go beyond the minimum and significantly improve developer experience, type safety, or test coverage.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Zod response validation** | Runtime type checking catches backend contract violations at the API boundary — before the data reaches components and causes cryptic render errors. | MEDIUM | Requires a second Orval config block with `client: 'zod'`. Generates `{operationName}Response` Zod schema. Must be wired into the mutator via `.parse()` on the response. Orval auto-detects Zod v3 vs v4 from `package.json` (v7.10.0+). |
| **Zod request body validation** | Validate user-submitted data before it hits the network. Especially valuable for the upload/detect flow where invalid payloads cause confusing backend errors. | MEDIUM | Generates `{operationName}Body` Zod schemas. Call `schema.parse(body)` before invoking the mutation. Errors surface in the component with a clear validation message rather than a 400 from the server. |
| **Auto-invalidation on mutation success** | Orval can generate `useInvalidate[Operation]` helpers that precisely target the affected query keys. Eliminates manual `queryClient.invalidateQueries()` calls in mutation `onSuccess` handlers. | MEDIUM | `output.override.query.useInvalidate: true`. The generated invalidator knows the correct query key because it is generated from the same spec as the query hook. |
| **useInfiniteQuery for paginated endpoints** | Images grid and feed use infinite scroll. The cursor/offset parameter must be plumbed through correctly. Manual implementation today has this wired by hand. | MEDIUM | `output.override.query.useInfinite: true` + `useInfiniteQueryParam: 'cursor'` (or whichever param the backend uses). Generates `useInfinite[OperationId]` hooks alongside regular `use[OperationId]` hooks. |
| **usePrefetch hooks for SSR** | Post detail and profile pages are good candidates for server-side prefetching. Generated `usePrefetch[OperationId]` can be called in route handlers to populate the React Query cache before the page renders. | MEDIUM | `output.override.query.usePrefetch: true`. Returns a function compatible with `queryClient.prefetchQuery`. Requires careful `"use client"` boundary management — the hook wrapper must live in a client component. |
| **Zod coercion for query params** | URL query parameters arrive as strings. Coercion converts `"42"` → `42` and `"true"` → `true` automatically, without manual parsing in the component. | LOW | `output.override.zod.coerce: true` scoped to `query` context only. Avoids unwanted coercion on response bodies where type accuracy matters. |
| **Zod strict mode on critical responses** | Detect when the backend sends unexpected fields — surfaces API contract drift immediately rather than silently ignoring extra data. | LOW | `output.override.zod.strict: true` scoped to `response` context for high-risk endpoints (auth, user profile). Generates `.strict()` (v3) or `strictObject()` (v4). Do not enable globally — see anti-features. |
| **useOperationIdAsQueryKey** | Operation IDs (e.g. `getPostById`) produce human-readable query keys in React Query DevTools instead of raw route paths. Significantly easier to debug cache state. | LOW | `output.override.query.useOperationIdAsQueryKey: true`. One line of config. Only downside: operation IDs must be stable in the OpenAPI spec. |
| **MSW mock generation** | Generated MSW handlers (`*.msw.ts`) and Faker-based mock data functions (`get[OperationId]ResponseMock()`) enable integration tests and component-level testing without a running backend. | HIGH | `output.mock: true`. Generates `*.msw.ts` files alongside hooks. Requires `@faker-js/faker` and `msw` (neither currently in the stack). MSW mock data will not satisfy strict Zod schemas — these must be used in separate test environments. |

---

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem appealing but create concrete problems for this project.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Editing generated files manually** | Tempting to patch a quirk in a generated hook inline | Generated files are fully overwritten on the next `generate:api` run. Any manual fix is silently lost. Creates a false confidence that something is fixed. | Fix the upstream OpenAPI spec or use `output.override` config to customize generation behavior. Generated files are build artifacts, not source code. |
| **Committing generated files to version control** | Feels like a safety net — "at least the generated files are there if generation fails" | Generated files produce large, noisy diffs on every spec change. Merge conflicts are frequent and meaningless. The spec is the source of truth. | Add `packages/web/src/generated/` to `.gitignore`. Regenerate in CI as part of the `build` pipeline task. CI fails fast if spec is unreachable. |
| **Enabling Zod validation on all contexts simultaneously** | Seems maximally safe — validate everything everywhere | Response validation adds parse overhead on every API call. Enabling strict mode globally causes parse failures on minor backend additions (new optional field → strict schema rejects it). Particularly painful during active backend development. | Enable Zod selectively: coerce for query params (low risk, high value), response validation only for auth/user endpoints (highest drift risk), skip strict mode entirely until the OpenAPI spec is stable. |
| **Single-file output mode** | Simple — one import, easy to understand | 30+ endpoints in one file produces a massive generated file. IDE performance (autocomplete, type checking) degrades. Tree-shaking fails. Merge conflicts on regeneration are unresolvable. | Use `tags-split` mode which mirrors the existing per-domain organization in `lib/api/`. The folder structure is immediately recognizable to the team. |
| **generateEachHttpStatus: true** | Want Zod schemas for 400/404/500 error shapes too | With 30+ endpoints, generating schemas for every HTTP status produces 150-200+ schemas. Most error shapes are identical (a generic `ErrorResponse` type) or are never machine-validated. Generation time increases significantly. | Generate only 2xx response schemas (the default). Handle error shapes generically in the mutator's error interceptor, the same way `client.ts` currently does. |
| **Replacing the Next.js /api/v1/ proxy with direct backend calls** | Orval can be configured to call `https://dev.decoded.style` directly from the browser | The Next.js proxy exists for three reasons: (1) CORS — the backend does not whitelist browser origins, (2) secrets — `API_BASE_URL` is a server-side env var that must not leak to the browser, (3) centralized auth flow. Bypassing it breaks all three. | Configure the mutator `baseURL` to `""` (empty string). All generated hooks continue routing via `/api/v1/` exactly as the current manual `client.ts` does. |
| **Zod generateEachHttpStatus for admin routes** | Admin dashboard has complex status flows | Admin routes behind auth middleware have additional behavioral complexity. Strict per-status Zod schemas for ~15 admin endpoints adds ~90 schemas that change frequently as the admin API evolves. | Handle admin error responses with the generic error pattern in the mutator. Admin-specific error shapes belong in the admin hook layer, not in generated schemas. |

---

## Feature Dependencies

```
[Custom Mutator (mutator.ts)]
    └──required-by──> [React Query Hook Generation]
    └──required-by──> [TypeScript Model Generation]  (mutator is the transport layer)
    └──required-by──> [Zod Response Validation]      (mutator runs .parse() on response)

[React Query Hook Generation]
    └──enables──> [Query Key Generation]
    └──enables──> [Auto-Invalidation on Mutation]
    └──enables──> [useInfiniteQuery for Pagination]
    └──enables──> [usePrefetch Hooks]

[tags-split Output Mode]
    └──requires──> [OpenAPI tags defined on backend endpoints]
    └──enables──> [Index Barrel Exports per tag]

[Zod Schema Generation (separate config block, client: 'zod')]
    └──requires──> [zod package installed]
    └──enables──> [Zod Response Validation]
    └──enables──> [Zod Request Body Validation]
    └──enhances──> [Zod Coercion for Query Params]
    └──enhances──> [Zod Strict Mode on Responses]

[afterAllFilesWrite Formatting]
    └──requires──> [Prettier configured in packages/web]
    └──requires──> [ESLint flat config in packages/web]
    └──prevents──> [CI failure on generated file style]

[MSW Mock Generation]
    └──requires──> [@faker-js/faker installed]
    └──requires──> [msw installed]
    └──conflicts──> [Zod Strict Mode]  (Faker data fails strict schemas)

[useInfiniteQuery]
    └──requires──> [Backend cursor/offset param documented in OpenAPI spec]

[Auto-Invalidation on Mutation]
    └──requires──> [useOperationIdAsQueryKey OR matching query key]
    └──note──> [Only invalidates Orval-generated queries; hand-written queries need manual invalidation]
```

### Dependency Notes

- **Custom mutator must be implemented before any generated hook is usable.** Without it, generated hooks call raw axios with no auth token and no proxy routing. The mutator is the first deliverable in v9.0.
- **Zod generation is a separate Orval config block.** `client: 'zod'` mode generates only validation schemas, not hooks. It runs in the same `orval.config.ts` as a second named entry alongside the `client: 'react-query'` entry. Both read the same spec, output to different directories.
- **tags-split requires backend OpenAPI tags.** Verify that `https://dev.decoded.style/openapi.json` has tags defined on every operation before committing to this mode. If tags are missing, Orval falls back to a single file — acceptable temporarily but must be fixed in the spec.
- **MSW mocks and strict Zod cannot coexist in the same test environment.** Faker generates plausible but not spec-perfect data. Enable MSW mocks in a separate test `orval.config.test.ts` without Zod strict mode.
- **Auto-invalidation only covers Orval-generated query hooks.** The Supabase direct queries in `packages/shared/supabase/queries/` are not touched by Orval and are not auto-invalidated by generated mutation hooks.

---

## MVP Definition

### Launch With (v9.0)

Minimum to replace all manual `lib/api/` clients and validate the generation pipeline end-to-end.

- [ ] **Custom mutator** (`lib/api/generated/mutator.ts`) — Supabase JWT injection from session, empty baseURL for proxy routing, error handling matching current `client.ts` behavior
- [ ] **Orval config** (`packages/web/orval.config.ts`) — `client: 'react-query'`, `mode: 'tags-split'`, points at backend OpenAPI spec, outputs to `src/generated/`
- [ ] **`generate:api` bun script** — wired into `packages/web/package.json` and Turborepo pipeline (runs before `build`)
- [ ] **React Query hook generation** — all 30+ endpoints generating `use[OperationId]` hooks with correct query/mutation split
- [ ] **TypeScript model generation** — all request/response types in `src/generated/models/`, manual types in `lib/api/types.ts` deleted
- [ ] **afterAllFilesWrite formatting** — Prettier + ESLint run on generated files automatically
- [ ] **Full migration of `lib/hooks/`** — all hooks that wrap `lib/api/` functions replaced with direct imports from generated hooks
- [ ] **Delete `lib/api/*.ts`** — posts, users, spots, solutions, badges, rankings, categories, postLikes, savedPosts, comments, and the adapters folder removed after migration is verified
- [ ] **`.gitignore` update** — `packages/web/src/generated/` excluded from version control

### Add After Validation (v9.x)

Add once the generation pipeline is confirmed working in production and CI.

- [ ] **Zod request body validation** — second Orval config block with `client: 'zod'`, wire `{operationName}Body.parse()` into upload and create flows. Trigger: first runtime type mismatch caught in staging.
- [ ] **Zod response validation** — enable for auth and user endpoints first. Trigger: backend spec change causes silent data corruption in the UI.
- [ ] **useInfiniteQuery for images and feed** — enable once cursor parameter confirmed in OpenAPI spec. Trigger: infinite scroll regression caused by manual implementation gap.
- [ ] **Auto-invalidation on mutation** — `useInvalidate` helpers for post create, like, save mutations. Trigger: stale cache complaints from QA.
- [ ] **useOperationIdAsQueryKey** — enable for improved DevTools legibility. Trigger: debugging session complexity grows.

### Future Consideration (v10+)

Defer until v9.0 migration is fully proven and the team has confidence in the generation workflow.

- [ ] **MSW mock generation** — requires adding `@faker-js/faker` and `msw` to the dev stack. High value for component testing but significant setup investment.
- [ ] **usePrefetch for SSR** — enables server-side prefetching for detail pages. Defer until App Router data fetching patterns are formalized in this project.
- [ ] **Zod strict mode on responses** — risk of false-positive failures during active backend development. Enable once the OpenAPI spec is declared stable.
- [ ] **Zod coercion for query params** — nice-to-have for explore/search. Low priority since current manual parameter handling works correctly.

---

## Feature Prioritization Matrix

| Feature | Developer Value | Implementation Cost | Priority |
|---------|----------------|---------------------|----------|
| Custom mutator (auth + proxy) | HIGH | MEDIUM | P1 |
| React Query hook generation | HIGH | LOW | P1 |
| TypeScript model generation | HIGH | LOW | P1 |
| `generate:api` script + Turborepo pipeline | HIGH | LOW | P1 |
| tags-split file organization | HIGH | LOW | P1 |
| afterAllFilesWrite formatting | HIGH | LOW | P1 |
| Migration: delete `lib/api/*.ts` | HIGH | MEDIUM | P1 |
| Migration: replace `lib/hooks/` | HIGH | MEDIUM | P1 |
| Zod request body validation | MEDIUM | MEDIUM | P2 |
| Zod response validation | MEDIUM | MEDIUM | P2 |
| Auto-invalidation on mutation | MEDIUM | LOW | P2 |
| useInfiniteQuery for pagination | MEDIUM | MEDIUM | P2 |
| useOperationIdAsQueryKey | LOW | LOW | P2 |
| usePrefetch hooks | LOW | MEDIUM | P3 |
| MSW mock generation | LOW | HIGH | P3 |
| Zod strict mode on responses | LOW | LOW | P3 |
| Zod coercion for query params | LOW | LOW | P3 |

**Priority key:**
- P1: Required for v9.0 milestone — migration is incomplete without these
- P2: Ship when core is validated — significant DX or safety improvement
- P3: Future milestone — valuable but not blocking

---

## Existing Code Impact Map

The following files in `packages/web` are directly affected by or must be integrated with the generated output.

| Existing File/Directory | Relation to Orval Generation | Action |
|------------------------|------------------------------|--------|
| `lib/api/client.ts` | Contains auth injection + proxy routing logic | Auth logic moves into `mutator.ts`. `client.ts` is deleted after migration is verified. |
| `lib/api/posts.ts`, `users.ts`, `spots.ts`, etc. | Per-resource typed fetch wrappers | Replaced entirely by generated hooks. Delete after each domain is migrated. |
| `lib/api/types.ts` | Manual request/response type definitions | Replaced by generated model files in `src/generated/models/`. Delete when all types are covered. |
| `lib/api/adapters/` | Data transformation adapters between API and UI | Evaluate case-by-case. If transformations are needed, keep them as utilities that consume generated types rather than raw API functions. |
| `lib/hooks/*.ts` | React Query hooks wrapping `lib/api/` functions | Replaced by direct imports from generated `use[OperationId]` hooks. Files deleted after migration. |
| `lib/hooks/admin/*.ts` | Admin-specific data hooks | Same pattern. Generated hooks replace manual wrapping. |
| `app/api/v1/**` | Next.js server-side proxy routes | Keep unchanged. The mutator must route through these. `API_BASE_URL` stays `""` in mutator config. |
| `packages/shared/supabase/queries/` | Supabase direct queries (images, items) | Not replaced by Orval. These target Supabase directly, not the Rust backend REST API. Keep as-is. |

---

## Sources

- [Orval React Query Guide](https://www.orval.dev/guides/react-query) — hook generation pattern, query key naming, infinite query config (HIGH confidence — official docs)
- [Orval Output Configuration Reference](https://www.orval.dev/reference/configuration/output) — mode options, client types, override structure, hooks config (HIGH confidence — official docs)
- [Orval Zod Schema Validation Architecture (DeepWiki)](https://deepwiki.com/orval-labs/orval/5-zod-schema-validation) — two-phase generation, schema naming conventions, five schema types per operation (HIGH confidence — sourced from Orval codebase)
- [Orval Zod Generation Configuration (DeepWiki)](https://deepwiki.com/orval-labs/orval/5.1-zod-generation-configuration) — strict, coerce, preprocess, per-context overrides, Zod v3/v4 auto-detection (HIGH confidence)
- [Orval Output Modes (DeepWiki)](https://deepwiki.com/orval-labs/orval/2.2-output-modes) — tags-split recommended for large APIs (HIGH confidence — sourced from Orval codebase analysis)
- [Orval Custom Axios Guide](https://www.orval.dev/guides/custom-axios) — mutator function signature `<T>(config: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<T>` (HIGH confidence — official docs)
- [Prototyp: Generating API client from OpenAPI/Swagger with Orval and TanStack Query](https://prototyp.digital/blog/generating-api-client-openapi-swagger-definitions) — migration workflow, production patterns (MEDIUM confidence)
- [Andy Primawan: Generate TypeScript SDKs and React Query Hooks for Next.js with Orval](https://andyprimawan.com/generate-typescript-sdks-and-react-query-hooks-for-nextjs-with-orval-and-openapi-specs/) — full Next.js config with auth interceptors (MEDIUM confidence)
- [Neteye Blog: Summoning Orval](https://www.neteye-blog.com/2025/09/summoning-orval-binding-backend-and-frontend-by-magic/) — CI/CD integration, afterAllFilesWrite pattern (MEDIUM confidence)
- [Zod v4 compatibility issue tracker](https://github.com/orval-labs/orval/issues/2042) — Orval v7.10.0+ adds Zod v4 auto-detection (HIGH confidence — primary source)
- [Orval invalidation from mutations discussion](https://github.com/anymaniax/orval/discussions/506) — useInvalidate hook behavior and manual invalidation patterns (MEDIUM confidence)

---

*Feature research for: Orval + Zod API client generation (v9.0 milestone)*
*Researched: 2026-03-23*
