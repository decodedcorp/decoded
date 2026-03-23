# Pitfalls Research

**Domain:** Orval + Zod API code generation — adding to existing Next.js + React Query project (decoded-monorepo v9.0)
**Researched:** 2026-03-23
**Confidence:** HIGH (Orval + React Query mechanics, utoipa schema issues), MEDIUM (bun/Turborepo Orval CLI integration), MEDIUM (migration patterns from manual to generated hooks)

---

## Critical Pitfalls

Mistakes that force rewrites, break TypeScript compilation, or invalidate the generated output entirely.

---

### Pitfall 1: OpenAPI 3.1 + utoipa Nullable Fields Generate Uncompilable Zod

**What goes wrong:**
utoipa on Axum can emit OpenAPI 3.1 specs where `Option<T>` fields are represented as union type arrays — `type: ["string", "null"]` — instead of the OpenAPI 3.0 `nullable: true` approach. When Orval processes these alongside a pattern constraint (e.g., a field that is both numeric and string-parseable), it generates `zod.number().regex()` which does not exist in the Zod API. The output file will not compile.

**Why it happens:**
Orval's Zod generator has a code path for `allOf/oneOf` combined with `nullable` that can produce invalid method chains when the union type mixes number and string with a regex constraint. The root cause is that the generator applies `.regex()` to a `zod.number()` schema, which is a type mismatch — `regex` only exists on `zod.string()`. This was confirmed in Orval issue #2562 and is triggered specifically by OpenAPI 3.1 specs where numeric fields allow string representation.

**How to avoid:**
1. Verify the utoipa version in `packages/api-server/Cargo.toml` — utoipa 4.x generates OpenAPI 3.1 by default. Check whether the spec endpoint (`/api-docs/openapi.json`) returns `"openapi": "3.1.0"` or `"3.0.x"`.
2. If the spec is 3.1 and nullable fields use type arrays, configure utoipa to emit OpenAPI 3.0 format, or add a post-processing script to normalize `type: ["T", "null"]` → `{type: "T", nullable: true}` before Orval consumes the spec.
3. As a fallback: in `orval.config.ts`, use `override.operationName` + `override.response` to manually correct only the affected schemas.

**Warning signs:**
- TypeScript compilation error: `Property 'regex' does not exist on type 'ZodNumber'`
- TypeScript compilation error: `Property 'stringFormat' does not exist`
- Generated file contains `z.number().regex(...)` or `z.number().stringFormat(...)`
- The spec's `openapi` field is `"3.1.0"` and you have `Option<CustomType>` in Axum handlers

**Phase to address:** Phase 1 (Setup & spec validation). Validate the spec and fix schema emission before running Orval for the first time. Do not proceed to generation until a clean spec is confirmed.

---

### Pitfall 2: utoipa Missing `operationId` Breaks Generated Hook Names

**What goes wrong:**
Orval derives TypeScript function and hook names from the OpenAPI `operationId`. If utoipa handlers do not have explicit `operation_id` annotations, utoipa auto-generates them from the handler function name using snake_case (e.g., `get_posts_handler` → operationId `getPostsHandler`). The resulting React Query hook names become long and inconsistent (`useGetPostsHandlerQuery` instead of `useGetPosts`). Worse, if two handlers share a similar name pattern, utoipa may generate duplicate `operationId` values, which causes Orval to emit duplicate exports — a TypeScript error.

**Why it happens:**
utoipa's auto-generated `operationId` is based on the Rust function name, which often includes implementation detail suffixes like `_handler`, `_route`, `_endpoint`. The Orval name derivation is mechanical: it takes the operationId and maps to `use{OperationId}` (PascalCase). Without intentional naming in utoipa, the DX of the generated client degrades significantly.

**How to avoid:**
Before running Orval, audit every endpoint in the spec for its `operationId`. Add explicit `operation_id = "listPosts"` (camelCase) in each utoipa `#[utoipa::path(...)]` annotation in Rust. This is a Rust-side change that must happen before code generation. Create a spec linting step that asserts no duplicate `operationId` values and all ids follow `verbNoun` pattern (e.g., `listPosts`, `getPost`, `createPost`).

**Warning signs:**
- Generated hooks have `Handler` or `Route` in their names
- TypeScript error: duplicate identifier in generated file
- `operationId` values in the spec contain underscores (indicates auto-generation from Rust fn names)

**Phase to address:** Phase 1 (Spec preparation). Fix operationIds in Rust before first generation run.

---

### Pitfall 3: Snake_case API Response Fields + Orval Default = Type/Runtime Mismatch

**What goes wrong:**
The Rust/Axum backend returns JSON with `snake_case` field names (`image_url`, `artist_name`, `created_at`). The existing `lib/api/types.ts` already mirrors this correctly. Orval, by default, preserves the casing from the spec — it generates TypeScript types with `snake_case` properties. This is actually correct behavior, but the pitfall is that if anyone configures Orval's `override.components.schemas.namingConvention` to convert to `camelCase` thinking it follows TypeScript conventions, the generated types will say `imageUrl` while the actual API response returns `image_url`. The TypeScript types will be wrong at runtime with all fields undefined.

**Why it happens:**
Developers conflate TypeScript naming conventions (camelCase for variables) with API response field names (snake_case from Rust/serde). Orval does not transform the actual runtime values — it only generates type definitions. Switching the type names to camelCase creates a lie: the TypeScript says `imageUrl` but fetch returns `image_url`.

**How to avoid:**
Keep Orval's default case preservation. The generated types should exactly mirror what the backend returns. The existing `lib/api/types.ts` already uses snake_case correctly — the generated types should match this pattern. If camelCase is desired in the frontend, add a transformation layer in the custom mutator (not in Orval config), using a library like `camelcase-keys` applied to the response body before returning.

**Warning signs:**
- `namingConvention: "camelCase"` appears in `orval.config.ts` schema overrides
- After migration, components that previously showed data now show undefined fields
- TypeScript types compile but runtime values are `undefined`

**Phase to address:** Phase 2 (Generation configuration). Establish the correct naming policy before any hooks are migrated.

---

### Pitfall 4: Next.js API Proxy + Orval baseURL Double-Prefixing

**What goes wrong:**
The current `lib/api/client.ts` uses `API_BASE_URL = ""` so all requests route through the Next.js API proxy (`/api/v1/...`). If Orval is configured with a `baseURL` pointing to the backend directly (`https://dev.decoded.style`), the generated client will bypass the proxy. This breaks: (1) auth token injection via Supabase session, (2) CORS — the backend does not accept browser-side direct calls, (3) the FormData multipart upload path that relies on the proxy to forward correctly.

If instead the baseURL is set to `""` (empty, matching the current client) but the OpenAPI spec paths already include `/api/v1/`, the generated calls will double-prefix to `/api/v1/api/v1/...`.

**Why it happens:**
Orval prepends the configured `baseURL` to the path from the spec. The spec from the Rust backend includes full paths like `/api/v1/posts`. If both the baseURL and the spec paths contribute the prefix, the final URL doubles it. The existing manual client avoids this by using empty baseURL and relying on Next.js routing.

**How to avoid:**
1. Set Orval's baseURL to `""` (empty string) — routes through the proxy.
2. Verify that the custom mutator strips any path prefix that would double up. Alternatively, configure `baseURL` pointing to the real backend for server-side generation and the proxy path for client-side.
3. The safest approach: use a custom mutator that delegates to the existing `apiClient()` function in `lib/api/client.ts`, inheriting its proxy-routing and auth logic. This minimizes the surface area of change during initial migration.

**Warning signs:**
- Network requests show URLs like `/api/v1/api/v1/posts`
- 404 errors immediately after switching to generated client
- Browser CORS error on `dev.decoded.style` from the frontend origin

**Phase to address:** Phase 2 (Generation + custom mutator setup). Validate URL construction with a single endpoint before migrating all hooks.

---

### Pitfall 5: Multipart Upload Endpoints Cannot Be Directly Generated

**What goes wrong:**
The `POST /api/v1/posts/upload` and `POST /api/v1/posts` (FormData) endpoints use multipart/form-data with a binary file field. Orval changed how it generates the type for binary fields between v7.20 and v8.0 — it now generates `string` instead of `Blob` for binary-typed fields. The generated function signature will accept a `string` where a `File` or `Blob` is needed, causing a runtime failure on upload.

Additionally, the current `uploadImage()` in `posts.ts` has custom retry logic (exponential backoff, progress callbacks) that cannot be expressed in an Orval-generated hook. A generated hook would lose this critical UX behavior.

**Why it happens:**
Orval's multipart/form-data type detection relies on the OpenAPI spec correctly annotating binary fields with `format: binary`. If utoipa emits these fields differently (e.g., as `type: string` without the binary format), Orval generates a plain string type. Even with correct annotation, Orval's generated code may use `Blob` when `File` is needed (since `File extends Blob` but FormData behaves differently).

**How to avoid:**
Explicitly exclude the upload endpoints from Orval generation using `override.operationsSuffix` exclusions or separate them into a non-generated `lib/api/upload.ts` that keeps the existing manual implementation. Mark these endpoints with a comment in the spec or in `orval.config.ts` to prevent accidental migration. The rule: **endpoints with progress callbacks, retry logic, or binary uploads stay manual**.

**Warning signs:**
- Generated type for file parameter is `string` instead of `File | Blob`
- TypeScript error when passing a `File` object to a generated function parameter
- Upload progress UI stops working after migration to generated hook

**Phase to address:** Phase 2 (Generation configuration) — exclude these endpoints. Phase 3 (Migration) — explicitly do not migrate upload functions.

---

### Pitfall 6: Existing React Query Hook Query Keys Collide with Generated Keys

**What goes wrong:**
The existing hooks (e.g., `usePosts`, `useProfile`) define their own query keys using patterns like `["posts", params]` or `["profile", userId]`. Orval generates query keys from the operationId and parameters. When both old and new hooks coexist during migration, they may use different query key structures for the same endpoint. React Query's cache will treat them as distinct — causing duplicate fetches, stale data, and cache invalidation that doesn't propagate.

A specific known issue (Orval #2359): when both `useQuery` and `useInfiniteQuery` are generated for the same endpoint, both use the same query key function. Any code calling `queryClient.invalidateQueries` with one key will not invalidate the other, breaking cache coherence for paginated endpoints like `useImages` and `usePosts`.

**Why it happens:**
Query key design is a contract between producer and consumer. Orval generates keys mechanically from the spec structure. The existing hooks were designed with different key conventions. During a gradual migration where both old and new hooks are in use, two sources of truth for cache state coexist.

**How to avoid:**
1. Plan migration endpoint-by-endpoint, not feature-by-feature. For each endpoint, migrate ALL consumers of the old hook before removing it. Never leave both old and new hooks active for the same endpoint.
2. Configure Orval's `override.query.queryKey` to match the existing key structure where possible, ensuring cache continuity.
3. For pagination endpoints that use both `useQuery` and `useInfiniteQuery`, configure Orval to generate different keys: use `queryKey: (params) => ["posts", "list", params]` for regular and `queryKey: (params) => ["posts", "infinite", params]` for infinite variants.
4. After full migration, do a global search for old query key strings to confirm no dual-key situations remain.

**Warning signs:**
- React Query DevTools shows two entries for the same logical data
- Infinite scroll stops refreshing when new posts are created (invalidation not reaching infinite key)
- Data briefly shows stale state when navigating between pages that use old vs. new hooks

**Phase to address:** Phase 3 (Migration) — requires a strict per-endpoint migration plan.

---

### Pitfall 7: bun + Orval CLI — `npx orval` vs `bunx orval` Behavioral Difference

**What goes wrong:**
Orval is typically invoked via `npx orval` or as a script. Under bun, `bunx orval` works but has a subtle difference: bun's package execution may resolve Orval from a different location than the installed workspace version, especially in a Turborepo monorepo where the root installs tools and the web package uses workspace:* references. The result can be a version mismatch where the Orval config syntax from v8.x is parsed by a v7.x binary (or vice versa), causing silent configuration failures.

Additionally, Turborepo's `--filter` argument conflicts with bun's own `--filter` flag when running scripts through `turbo run generate`. This was a known issue in Turborepo 2.6.x with bun.

**Why it happens:**
bun resolves binaries differently from npm/yarn when `bunx` is used without a lockfile entry. In a hoisted bun monorepo, the binary resolution path for `bunx orval` depends on whether `orval` is installed at the root or in `packages/web`. If installed only at the web package level, `bunx orval` run from the monorepo root may not find it.

**How to avoid:**
1. Install Orval as a devDependency in `packages/web/package.json` (not root), pinned to an exact version.
2. Add a `generate` script to `packages/web/package.json`: `"generate": "orval"` and invoke it via `bun run generate` from within `packages/web/`.
3. In `turbo.json`, add a `generate` task that depends on the spec being available and outputs to the generated directory. Use `bun run generate` (not `bunx orval`) in the turbo task.
4. Verify by running `bun run generate` from `packages/web/` directly and confirming the Orval version in the output matches `package.json`.

**Warning signs:**
- `bunx orval` outputs a different version than `bun run orval --version`
- Orval config keys in `orval.config.ts` show "unknown option" errors
- `turbo run generate` hangs or exits without output

**Phase to address:** Phase 1 (Setup). Establish the correct invocation pattern before writing the Orval config.

---

### Pitfall 8: Committed vs. Gitignored Generated Files Creates CI Drift

**What goes wrong:**
If generated files are gitignored and regenerated on-demand (e.g., in a pre-build script), the TypeScript check in CI (`bun run typecheck`) will fail if the generate step does not run first. The existing `packages/web/scripts/pre-push.sh` runs `tsc --noEmit` — if generated files are absent, TypeScript cannot resolve imports from the generated module.

Conversely, if generated files are committed, CI may pass even when the spec has changed and the committed files are stale. A developer updating the backend spec without regenerating the client will push stale types that silently diverge from the actual API.

**Why it happens:**
There is no inherent synchronization between the OpenAPI spec in the Rust backend and the generated TypeScript files in the Next.js frontend. The two artifacts live in different package directories and have no build-time dependency in Turborepo unless explicitly configured.

**How to avoid:**
The recommended approach for this project: **commit generated files**, but add a CI step that reruns generation and asserts no diff:
```
bun run generate && git diff --exit-code packages/web/src/generated/
```
If there is a diff, CI fails — forcing the developer to regenerate and commit updated files before merging.

Update `packages/web/scripts/pre-push.sh` to run `bun run generate` before `tsc --noEmit`, ensuring the local pre-push hook always has current generated files.

**Warning signs:**
- CI TypeScript check fails with "Cannot find module '../generated/...'"
- `git diff` after running `bun run generate` shows changes (spec has drifted from generated output)
- Developer merges a Rust backend PR without a corresponding frontend regeneration commit

**Phase to address:** Phase 1 (Setup) — define the git strategy. Phase 4 (CI) — add the drift detection step.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keeping both old and new hooks simultaneously "temporarily" | Faster migration per feature | Query key collisions, cache bugs, confusion over which hook to use | Never — migrate per-endpoint atomically |
| Using Orval for upload endpoints with binary fields | Consistent generated client | Progress callbacks lost, type mismatch for `File` vs `string` | Never — keep upload functions manual |
| Pointing generated client directly to backend URL (bypassing proxy) | Simpler config | CORS failures in browser, auth token injection breaks | Only for server-side (Next.js Route Handlers), never for client-side |
| Skipping operationId audit, accepting utoipa auto-generated ids | Saves one Rust PR | Hook names contain `Handler`/`Route` suffixes, bad DX forever | Never — fix operationIds before generation |
| Gitignoring generated files without a CI regeneration step | Cleaner repo | TypeScript check fails in CI, spec drift silently accumulates | Only if a pre-build `generate` step is added to every CI job |
| Committing generated files without a drift check | TypeScript always happy | Stale types ship without detection | Only if a drift check is added to CI |

---

## Integration Gotchas

Common mistakes when wiring Orval into the existing system.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase JWT auth | Hardcoding the token retrieval in the Orval mutator using `import { supabase }` at module level | Use the existing `getAuthToken()` from `lib/api/client.ts` inside the mutator function — token is fetched per-request, not at module init |
| React Query `QueryClient` | Not providing a shared `QueryClient` to generated hooks — each hook creates its own | Wrap the app in a single `QueryClientProvider` and verify generated hooks use the same client (they use context, not local instantiation) |
| Next.js Route Handler proxy | Configuring Orval's baseURL as `https://dev.decoded.style` for both client and server components | Use empty-string baseURL for client components (proxy routing), backend URL only in server-side fetch calls |
| Turborepo task graph | Not declaring the `generate` task as a dependency of `build` and `typecheck` | Add `"generate": { "outputs": ["src/generated/**"] }` to `turbo.json` and make `build` depend on it |
| Orval config file format | Using `.js` config with CJS `module.exports` when the package is ESM | Use `orval.config.ts` (TypeScript) or `orval.config.mjs` (ESM) to match the project's module system |
| utoipa spec endpoint | Fetching spec from `https://dev.decoded.style/api-docs/openapi.json` in Orval config | In development, fetch from local `packages/api-server` running on localhost, or download and commit a static spec file to avoid network dependency in codegen |

---

## Performance Traps

Patterns that degrade build or runtime performance.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Orval barrel file (`indexFiles: true`) + Next.js without `optimizePackageImports` | Large initial bundle, slow cold start | Enable `experimental.optimizePackageImports` in `next.config.js` for the generated directory | At any scale — barrel files defeat tree-shaking |
| Generated hooks imported into layout or root component | Every page loads all API types | Import only the specific hook needed per page/component | At > 20 generated hooks |
| Running `bun run generate` synchronously before every dev server start | 5-10s startup delay | Run generate only when spec changes (watch mode or manual trigger) | Immediately in development |
| Both old `usePosts` and new generated `useGetPosts` querying simultaneously | Double network requests, doubled cache entries | Enforce atomic migration — one hook per endpoint at a time | Immediately during migration |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Using untrusted/external OpenAPI specs with Orval | Code injection via `x-enum-descriptions` field (CVE-2026-23947, CVE-2026-25141) — arbitrary code executed in generated output | Only consume the spec from the known backend (`dev.decoded.style`) or a committed local copy; use Orval >= 8.2.0 which patches these CVEs |
| Logging generated API response bodies in the custom mutator during development | PII (user data, email, profile info) in logs | Add log filtering in the mutator; strip sensitive fields before any debug logging |
| Exposing the backend API URL in generated client code for server-side routes | Backend URL becomes visible in client bundle | Use environment variable (`process.env.API_BASE_URL`) not a hardcoded URL; verify it is not `NEXT_PUBLIC_` prefixed |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Spec validation:** Orval runs without errors — verify generated TypeScript also compiles (`bun run typecheck`) before declaring setup done
- [ ] **Auth injection:** Generated hooks appear to work — verify authenticated endpoints actually send `Authorization: Bearer <token>` (check Network tab with a logged-in user)
- [ ] **Upload endpoints:** Generated client exists for upload routes — verify the manual upload functions in `lib/api/posts.ts` are explicitly excluded from generation and still work
- [ ] **Query key migration:** All consumers of an old hook are removed — search for imports of the old hook name across the entire `packages/web/` directory
- [ ] **Proxy routing:** Generated client calls succeed in local dev — verify the same calls succeed in production where `NEXT_PUBLIC_API_BASE_URL` may differ
- [ ] **Infinite scroll:** Regular query hook is replaced — also check that the infinite query variant uses a distinct query key (Orval issue #2359)
- [ ] **CI drift check:** Generate runs in CI — verify that a spec change without regeneration causes CI to fail (test by modifying a field in the spec and not regenerating)
- [ ] **Zod validation:** Zod schemas are generated — verify they are actually applied at runtime (Orval generates schemas but does not auto-apply them; you must wire them to the mutator or React Query's `select`)

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Uncompilable Zod from OpenAPI 3.1 nullable | MEDIUM | Write a spec normalization script that converts `type: ["T", "null"]` to `{type: "T", nullable: true}` and run it before Orval; re-run generation |
| Query key collisions causing cache bugs | MEDIUM | Identify all dual-hook endpoints in React Query DevTools; rollback those endpoints to old hooks; migrate them atomically with explicit key config |
| Upload endpoint broken after migration | LOW | Revert the migration of upload endpoints; add them to the Orval exclusion list; restore manual implementation from git |
| baseURL double-prefix causing 404s | LOW | Update the custom mutator to strip the `/api/v1` prefix from the path before calling fetch, or reconfigure baseURL in `orval.config.ts` |
| Generated files causing CI typecheck failure | LOW | Add `bun run generate` as a pre-step in the CI typecheck job; commit the regenerated files |
| bun/Turborepo version conflict with Orval CLI | LOW | Pin Orval version in `packages/web/package.json`; add `bun run generate` as a local script; avoid `bunx orval` at monorepo root |
| Spec drift after backend changes | MEDIUM | Establish a process: every backend PR that changes API shape must include a frontend regeneration commit; enforce with CI drift check |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| OpenAPI 3.1 nullable → uncompilable Zod | Phase 1: Spec validation | Run `bun run generate && bun run typecheck` — zero TypeScript errors |
| Missing/duplicate operationId | Phase 1: Spec preparation (Rust-side fix) | Spec linting script finds zero duplicate operationIds and zero auto-generated suffixes |
| Snake_case/camelCase naming policy | Phase 2: Orval config | Generated types mirror existing `lib/api/types.ts` field names exactly |
| Next.js proxy + baseURL double-prefix | Phase 2: Custom mutator setup | Single endpoint smoke test — network request shows correct URL, no double prefix |
| Multipart upload exclusion | Phase 2: Generation config | Orval config has explicit exclusions for upload endpoints; `uploadImage()` still works |
| Query key collisions | Phase 3: Migration (per-endpoint plan) | React Query DevTools shows one cache entry per endpoint after migration |
| bun + Orval CLI invocation | Phase 1: Setup | `bun run generate` from `packages/web/` runs correct Orval version and generates files |
| Generated files CI drift | Phase 4: CI integration | CI fails when spec changes without corresponding regeneration commit |

---

## Sources

- [Orval GitHub Issues — Zod uncompilable types after OpenAPI 3.1 upgrade (#2562)](https://github.com/orval-labs/orval/issues/2562)
- [Orval GitHub Issues — Zod: Code Generation fails for type id/string + pattern (#3097)](https://github.com/orval-labs/orval/issues/3097)
- [Orval GitHub Issues — Query key collision for infinite + regular query (#2359)](https://github.com/orval-labs/orval/issues/2359)
- [Orval GitHub Issues — multipart/form-data binary type regression (#2864)](https://github.com/orval-labs/orval/issues/2864)
- [Orval GitHub Issues — Incorrect import paths with indexFiles=false (#2382)](https://github.com/orval-labs/orval/issues/2382)
- [Orval Discussion — Converting schema field names from snake_case (#218)](https://github.com/orval-labs/orval/discussions/218)
- [Orval Security Advisory — CVE-2026-23947 code injection via x-enum-descriptions](https://github.com/orval-labs/orval/security/advisories/GHSA-h526-wf6g-67jv)
- [utoipa GitHub Issues — nullable $ref should include type: object (#973)](https://github.com/juhaku/utoipa/issues/973)
- [utoipa GitHub Issues — Query params should not be nullable (#1215)](https://github.com/juhaku/utoipa/issues/1215)
- [Orval Custom HTTP Client guide](https://orval.dev/guides/custom-client)
- [Orval DeepWiki — Zod Schema Validation architecture](https://deepwiki.com/orval-labs/orval/5-zod-schema-validation)
- [Turborepo + bun compatibility issues — GitHub Issue #4762](https://github.com/vercel/turborepo/issues/4762)
- [Barrel files and Next.js tree-shaking — Vercel blog](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js)
- [OpenAPI nullable with oneOf/allOf — Speakeasy](https://www.speakeasy.com/openapi/schemas/null)

---
*Pitfalls research for: Orval + Zod API code generation added to existing Next.js + React Query monorepo*
*Researched: 2026-03-23*
