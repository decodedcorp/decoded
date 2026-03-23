# Phase 40: Codegen Pipeline and Custom Mutator - Research

**Researched:** 2026-03-23
**Domain:** Orval custom mutator (axios + Supabase JWT), orval.config.ts finalization, Turborepo generate pipeline
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-02 | Custom mutator: Supabase JWT + baseURL="" + error handling — replaces lib/api/client.ts | Exact mutator pattern documented with TypeScript signature; getSession pattern from existing client.ts confirmed reusable |
| INFRA-03 | generate:api bun script + Turborepo pipeline (build depends on generate) | Turborepo `dependsOn` pattern verified; outputs cache config documented |
| INFRA-04 | Zod schema generation config (decodedApiZod block, .zod.ts extension) | Already partially configured in orval.config.ts; afterAllFilesWrite hook location confirmed |
| INFRA-05 | afterAllFilesWrite formatting (Prettier + ESLint auto-apply) | hooks.afterAllFilesWrite verified as top-level key (not inside output block); exact syntax documented |
| SPEC-04 | Smoke test: single endpoint → generate → build → verify correct URL, no double prefix, type match | Smoke test strategy documented; double-prefix risk, typecheck command, and verification steps mapped |
</phase_requirements>

---

## Summary

Phase 39 completed all prerequisites: packages are installed (orval@^8.5.3, axios@^1.13.6, zod@^3.25 confirmed in packages/web/package.json), orval.config.ts skeleton exists with the correct multipart transformer, and the 4 duplicate operationId blockers are resolved (backend PR merged, openapi.json re-downloaded — confirmed by commit `d694b9ac`). Phase 40 is fully unblocked.

The three work areas are: (1) implement `lib/api/mutator/custom-instance.ts` using the existing `client.ts` auth pattern adapted for the Orval axios mutator signature; (2) finalize `orval.config.ts` by adding the `hooks.afterAllFilesWrite` block and confirming the zod config block; (3) wire the `generate:api` script into Turborepo so `build` and `typecheck` both depend on `generate` completing first.

The existing `lib/api/client.ts` is the direct reference implementation for the mutator: it already uses `supabaseBrowserClient.auth.getSession()`, empty-string baseURL, and the same error-handling contract. The mutator adapts this to the Orval-expected axios-based function signature.

**Primary recommendation:** Build the mutator first (it gates everything else), then run `orval generate` to verify the config produces clean output, then wire Turborepo and run the smoke test.

---

## Standard Stack

### Core (already installed — no new installs needed)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| orval | ^8.5.3 | OpenAPI → TanStack Query + Zod codegen | Installed in devDependencies |
| axios | ^1.13.6 | HTTP client for generated hooks | Installed in dependencies |
| zod | ^3.25 | Schema validation (pinned to v3) | Installed in dependencies |
| @tanstack/react-query | ^5.90.11 | Query client for generated hooks | Already present |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @supabase/supabase-js | ^2.86.0 | JWT token source via getSession() | Mutator imports supabaseBrowserClient |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| hooks.afterAllFilesWrite | output.prettier: true | `output.prettier: true` requires prettier globally installed; hooks approach works with local prettier in devDependencies — prefer hooks |
| Turborepo generate task | prebuild script in package.json | Turborepo approach enables caching and explicit cross-package dep ordering; package.json prebuild would work but loses turbo cache benefits |

**No new installations required for Phase 40.** All dependencies are already in packages/web/package.json.

---

## Architecture Patterns

### File Layout

```
packages/web/
├── orval.config.ts                     # EXISTING — needs hooks block added
├── lib/api/
│   ├── mutator/
│   │   └── custom-instance.ts          # NEW — Phase 40 primary deliverable
│   ├── generated/                      # NEW — orval output (gitignored)
│   │   ├── feed.ts                     # per-tag hooks
│   │   ├── posts.ts
│   │   ├── users.ts
│   │   ├── admin.ts
│   │   ├── ...                         # one file per tag (15 tags)
│   │   ├── models/                     # shared TypeScript types
│   │   └── zod/                        # zod schema files (.zod.ts)
│   ├── client.ts                       # EXISTING — not deleted until Phase 42
│   └── types.ts                        # EXISTING — not deleted until Phase 42
└── turbo.json (root)                   # needs generate task added
```

### Pattern 1: Custom Mutator Function Signature

**What:** Orval calls `customInstance(config, options?)` for every generated hook. The function wraps an axios instance with Supabase JWT injection.

**Critical contract:** Orval expects the mutator to export a function named (matching `mutator.name` in config) with this exact shape:

```typescript
// Source: https://orval.dev/guides/custom-axios (verified 2026-03-23)
// and lib/api/client.ts (project reference — same auth pattern)

import Axios, { AxiosRequestConfig } from "axios";
import { supabaseBrowserClient } from "@/lib/supabase/client";

// Empty string = route through Next.js proxy at /api/v1/*
// Backend paths already include /api/v1/ prefix — do NOT set baseURL to actual backend
const AXIOS_INSTANCE = Axios.create({ baseURL: "" });

export const customInstance = async <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const { data: { session } } = await supabaseBrowserClient.auth.getSession();
  const token = session?.access_token ?? null;

  const source = Axios.CancelToken.source();
  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...config.headers,
      ...options?.headers,
    },
    cancelToken: source.token,
  }).then(({ data }) => data);

  // @ts-ignore
  promise.cancel = () => source.cancel("Query was cancelled");
  return promise;
};

// Required type exports — Orval uses these in generated files
export type ErrorType<Error> = import("axios").AxiosError<Error>;
export type BodyType<BodyData> = BodyData;
```

**Why empty baseURL is required:** The OpenAPI spec paths are `/api/v1/posts`, `/api/v1/feed`, etc. — they include the full path. The Next.js proxy (proxy.ts) routes `/api/v1/*` → backend. If baseURL were set to `http://localhost:8000`, the generated URL would be `http://localhost:8000/api/v1/posts` — bypassing the proxy and failing in production. Empty string routes through the Next.js app correctly.

**Why `"use client"` is NOT needed:** The mutator file runs in React component context (client-side). It does not need the directive, but it imports from `@/lib/supabase/client` which has `"use client"` already — this is fine.

### Pattern 2: orval.config.ts Finalized Structure

The existing orval.config.ts skeleton needs one addition: the top-level `hooks` block. The rest of the config is already correct (verified from the file):

```typescript
// packages/web/orval.config.ts
import { defineConfig } from "orval";

export default defineConfig({
  decodedApi: {
    input: {
      target: "../api-server/openapi.json",
      override: {
        transformer: (spec) => {
          // ... existing transformer (already correct, do not change)
        },
      },
    },
    output: {
      mode: "tags-split",
      target: "./lib/api/generated",
      schemas: "./lib/api/generated/models",
      client: "react-query",
      httpClient: "axios",
      override: {
        mutator: {
          path: "./lib/api/mutator/custom-instance.ts",
          name: "customInstance",
        },
        query: {
          useQuery: true,
          useMutation: true,
        },
      },
    },
    // ADD THIS BLOCK — at the decodedApi level, not inside output
    hooks: {
      afterAllFilesWrite: "prettier --write",
    },
  },
  decodedApiZod: {
    input: {
      target: "../api-server/openapi.json",
    },
    output: {
      client: "zod",
      target: "./lib/api/generated/zod",
      fileExtension: ".zod.ts",
    },
    // Zod config block can also have hooks if desired — optional
  },
});
```

**CRITICAL:** `hooks` is a sibling of `input`/`output` at the config-block level — it is NOT inside the `output` block. Placing it inside `output` causes a TypeScript type error and the hook silently does not run.

**`afterAllFilesWrite` value:** Orval appends the generated file paths to this command. `"prettier --write"` becomes `prettier --write ./lib/api/generated/foo.ts ./lib/api/generated/bar.ts ...`. This requires prettier to be resolvable — it is in devDependencies, so `bun run prettier` works, but the plain string `"prettier --write"` requires the binary to be in PATH or use the full path `"./node_modules/.bin/prettier --write"`.

**ESLint fix:** Can be added as an array: `afterAllFilesWrite: ["prettier --write", "eslint --fix"]`. ESLint flat config (the project uses eslint.config.mjs) works with `eslint --fix` directly. However, ESLint auto-fix on generated files may fail if ESLint rules conflict with Orval output style — safer to start with just prettier and add ESLint if needed.

### Pattern 3: Turborepo Pipeline — generate Task

**Location:** Root `turbo.json` (already exists, needs `generate` task added).

**Key rules:**
- `generate` produces files that `build` and `typecheck` need — both must list `"generate"` in their `dependsOn`
- `generate` outputs go in `packages/web/lib/api/generated/**` — declare these in `outputs` for Turborepo caching
- `generate` has no `^` dependency (it doesn't depend on other packages building first)

```json
// /turbo.json — add generate task, update build and typecheck
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "generate": {
      "outputs": ["lib/api/generated/**"]
    },
    "build": {
      "dependsOn": ["^build", "generate"],
      "outputs": [".next/**", "dist/**"]
    },
    "typecheck": {
      "dependsOn": ["generate"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {}
  }
}
```

**`packages/web/package.json` scripts addition:**

```json
"generate:api": "orval --config orval.config.ts"
```

**Root `package.json` scripts addition (for monorepo-level access):**

```json
"generate:api": "turbo run generate"
```

**Running the task:**
- From packages/web: `bun run generate:api`
- From root: `bun run generate:api` (runs via turbo)

### Anti-Patterns to Avoid

- **Double prefix `/api/v1/api/v1/...`:** This happens if `baseURL` in the mutator is set to `http://localhost:8000/api/v1` AND the OpenAPI paths also start with `/api/v1/`. Result: URL becomes `/api/v1/api/v1/posts`. Fix: baseURL must be `""`.
- **Editing generated files:** Orval overwrites `lib/api/generated/**` on every run. All customization must go in the mutator.
- **hooks inside output block:** `output.hooks` is not a valid Orval config key. Hooks go at the config-block top level: `decodedApi.hooks`.
- **Importing generated hooks in packages/shared:** Causes "No QueryClient set" error (TanStack #3595). Generated files stay in packages/web.
- **`zod@^4.x`:** Pin to ^3.25 — currently ^3.25 is already in package.json (do not upgrade).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth header injection | Custom fetch wrapper | Custom mutator with axios interceptors | Orval calls the mutator directly; a custom fetch wrapper runs outside Orval's lifecycle |
| Token refresh logic | Manual refresh in hooks | Axios response interceptors in AXIOS_INSTANCE | Interceptor runs automatically on every 401; hook-level logic is duplicated across 85 endpoints |
| Type generation | Manual types from spec | Orval generated models/ directory | 85 endpoints, 100+ types — auto-generated types stay in sync with spec changes |
| Per-hook ESLint disables | Adding `// eslint-disable` to generated files | `afterAllFilesWrite: "prettier --write"` + ESLint ignore for generated dir | Generated files are not owned by developers — disable lint in .eslintignore or eslint.config.mjs for the generated path |

**Key insight:** The mutator is the single seam between Orval's generated code and project-specific auth. Everything project-specific goes in the mutator — not in generated files.

---

## Common Pitfalls

### Pitfall 1: Double URL Prefix (`/api/v1/api/v1/...`)
**What goes wrong:** Network request URL shows `/api/v1/api/v1/posts` instead of `/api/v1/posts`
**Why it happens:** baseURL is set to a non-empty value (e.g., `"/api/v1"` or `"http://localhost:8000"`) AND OpenAPI spec paths already include `/api/v1/`
**How to avoid:** `baseURL: ""` (empty string) in AXIOS_INSTANCE creation
**Warning signs:** First smoke test request returns 404 with the doubled prefix visible in network DevTools

### Pitfall 2: `afterAllFilesWrite` Hook Not Running
**What goes wrong:** Generated files are not formatted after codegen; no error reported
**Why it happens:** `hooks` block placed inside `output` instead of at the config-block level
**How to avoid:** `hooks` must be a sibling of `input` and `output` inside `decodedApi: { ... }`
**Warning signs:** TypeScript type error on the config object; or no formatting change after generation

### Pitfall 3: `prettier` Binary Not Found by afterAllFilesWrite
**What goes wrong:** `Error: prettier: command not found` during orval generate
**Why it happens:** The plain string `"prettier --write"` requires `prettier` to be in shell PATH. In a local bun workspace, it's in `./node_modules/.bin/` but not in PATH
**How to avoid:** Use `"./node_modules/.bin/prettier --write"` or ensure prettier is globally available. Alternatively, use `output.prettier: true` which Orval handles internally.
**Warning signs:** Orval runs but ends with a non-zero exit code mentioning `prettier`

### Pitfall 4: Typecheck Fails on Generated Files
**What goes wrong:** `bun run typecheck` shows type errors in `lib/api/generated/` files
**Why it happens:** (a) Mutator is missing the required `ErrorType` and `BodyType` type exports that generated files import; (b) strict TypeScript options catch issues in Orval output
**How to avoid:** Always include the two type exports in custom-instance.ts. If strict errors appear in generated files, add `// @ts-nocheck` at top of generated file template OR set `skipLibCheck: true` (already set in tsconfig.json — should be sufficient)
**Warning signs:** Type errors referencing `ErrorType` or `BodyType` not found in mutator module

### Pitfall 5: generate Task Output Not Cached by Turborepo
**What goes wrong:** Turborepo re-runs `generate` on every `bun run build` even when openapi.json hasn't changed
**Why it happens:** `outputs` not declared in the `generate` task definition — Turborepo can't restore cached output
**How to avoid:** Declare `"outputs": ["lib/api/generated/**"]` in the generate task
**Warning signs:** `>>> FULL TURBO` shown instead of cache hits on generate task

### Pitfall 6: orval.config.ts Not Found When Running from Root
**What goes wrong:** `orval` can't find the config file when executed from root or via turbo
**Why it happens:** `orval --config orval.config.ts` resolves the config path relative to CWD. Turbo runs tasks from the package directory by default, so this should work; but if invoked from root manually it fails.
**How to avoid:** In package.json script: `"generate:api": "orval --config orval.config.ts"` (orval resolves relative to packages/web/ when turbo runs it). For manual root-level invocation: `bun run --filter @decoded/web generate:api`.

---

## Code Examples

### Complete custom-instance.ts

```typescript
// Source: Pattern derived from official Orval custom-axios guide (orval.dev/guides/custom-axios)
// and existing lib/api/client.ts auth pattern (verified same supabaseBrowserClient usage)
// File: packages/web/lib/api/mutator/custom-instance.ts

import Axios, { AxiosRequestConfig } from "axios";
import { supabaseBrowserClient } from "@/lib/supabase/client";

// baseURL MUST be empty string — OpenAPI paths include /api/v1/ prefix
// Next.js proxy routes /api/v1/* → backend (avoids CORS and auth exposure)
const AXIOS_INSTANCE = Axios.create({ baseURL: "" });

export const customInstance = async <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  // Get current Supabase session — inject JWT as Bearer if logged in
  const {
    data: { session },
  } = await supabaseBrowserClient.auth.getSession();
  const token = session?.access_token ?? null;

  const source = Axios.CancelToken.source();

  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
    headers: {
      // Auth token — injected when available (both authed and optional-auth endpoints)
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...config.headers,
      ...options?.headers,
    },
    cancelToken: source.token,
  }).then(({ data }) => data);

  // Enable React Query cancellation via promise.cancel()
  // @ts-ignore — Orval generated code calls promise.cancel() if TanStack Query cancels
  promise.cancel = () => {
    source.cancel("Query was cancelled by React Query");
  };

  return promise;
};

// Required exports — Orval generated files import these types
export type ErrorType<Error> = import("axios").AxiosError<Error>;
export type BodyType<BodyData> = BodyData;
```

### Smoke Test Verification Script

```bash
# Run from packages/web/
# Step 1: Generate
bun run generate:api

# Step 2: Verify output structure
ls lib/api/generated/
# Expected: feed.ts posts.ts users.ts admin.ts badges.ts ... models/ zod/

# Step 3: Typecheck (includes generated files)
bun run typecheck
# Expected: no errors

# Step 4: Verify no double-prefix in generated files
grep -r "api/v1/api/v1" lib/api/generated/
# Expected: no matches (empty output)

# Step 5: Spot-check a generated hook signature
grep "useGetMyProfile\|useHomeFeed\|useListPosts" lib/api/generated/users.ts lib/api/generated/feed.ts lib/api/generated/posts.ts
# Expected: hook exports found
```

### Turborepo task ordering verification

```bash
# From repo root — verify generate runs before build
bun run build 2>&1 | head -30
# Expected: "generate" task appears in output before "build" task
# Or check that turbo respects dependsOn ordering
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| Orval hooks inside `output` block | `hooks` at config-block level (sibling of output) | Orval v7+ | Type error if placed in wrong location |
| Orval default HTTP = axios | Default = fetch, must set `httpClient: "axios"` | Orval v8.0.0 | Already set in existing orval.config.ts |
| CancelToken (Axios 0.x) | CancelToken still valid, AbortSignal also works | Axios 0.22+ | Both work; CancelToken more widely documented for Orval |
| hooks: `afterAllFilesWrite: []` (array) | `afterAllFilesWrite: "string"` (single) or array both work | Orval 8.x | Use array for multiple commands: `["prettier --write", "eslint --fix"]` |

**Deprecated/outdated in this context:**
- `override.coerceTypes` — removed Orval v8; use `override.zod.coerce` if needed
- Manual `bun run format` after codegen — replaced by `afterAllFilesWrite` hook

---

## Current State Inventory (what Phase 40 starts with)

| Artifact | Status | Notes |
|----------|--------|-------|
| packages/web/orval.config.ts | EXISTS — needs hooks block | Two-block structure correct; transformer correct; mutator path referenced |
| lib/api/mutator/custom-instance.ts | DOES NOT EXIST | Phase 40 creates this |
| lib/api/generated/ | EMPTY (.gitkeep) | Phase 40 populates via orval generate |
| packages/web/package.json scripts | Missing `generate:api` | Phase 40 adds |
| turbo.json generate task | MISSING | Phase 40 adds generate task and updates dependsOn |
| packages/api-server/openapi.json | EXISTS, CLEAN | 4 duplicate operationIds fixed (commit d694b9ac) |
| Duplicate operationId blocker | RESOLVED | admin_list_posts/badges/solutions/spots — PR merged |

---

## Open Questions

1. **`afterAllFilesWrite` prettier binary path**
   - What we know: `prettier` is in devDependencies; `afterAllFilesWrite: "prettier --write"` depends on PATH
   - What's unclear: Whether turbo's task runner adds node_modules/.bin to PATH automatically
   - Recommendation: Try plain `"prettier --write"` first; if it fails, use `"./node_modules/.bin/prettier --write"`. Alternatively, use Orval's built-in `output.prettier: true` flag as fallback.

2. **ESLint on generated files**
   - What we know: Project uses ESLint flat config (eslint.config.mjs); generated files will have Orval style
   - What's unclear: Whether ESLint rules will flag generated code (unused imports, etc.)
   - Recommendation: Add `lib/api/generated/` to ESLint ignore list in eslint.config.mjs before running the hook. Then add `"eslint --fix"` to afterAllFilesWrite array if desired.

3. **`lib/api/generated/` gitignore status**
   - What we know: Neither root .gitignore nor packages/web/.gitignore currently ignores lib/api/generated/
   - What's unclear: Should Phase 40 add the gitignore entry or defer to Phase 43 (CI-03)?
   - Recommendation: Phase 40 plan (40-03) should add `packages/web/lib/api/generated/` to .gitignore as part of pipeline wiring — it's a prerequisite for the smoke test commit to be clean. CI-03 in Phase 43 is for the formal CI pipeline configuration.

---

## Validation Architecture

> workflow.nyquist_validation key is absent from .planning/config.json — treat as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | TypeScript compiler (tsc) + bash smoke commands |
| Config file | packages/web/tsconfig.json (existing) |
| Quick run command | `cd packages/web && bun run typecheck` |
| Full suite command | `cd packages/web && bun run generate:api && bun run typecheck` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-02 | JWT Bearer token appears in request headers | smoke (manual DevTools) | N/A — requires browser network tab | ❌ Wave 0 — custom-instance.ts must be created |
| INFRA-02 | customInstance exports compile without errors | unit (typecheck) | `bun run typecheck` | ❌ Wave 0 — mutator file must be created |
| INFRA-03 | generate:api script exists in package.json | smoke | `cd packages/web && bun run generate:api` | ❌ Wave 0 — script must be added |
| INFRA-03 | turbo generate runs before build | smoke | `bun run build 2>&1 \| grep -E "generate|build"` | ❌ Wave 0 — turbo.json must be updated |
| INFRA-04 | zod/ directory created with .zod.ts files | smoke | `ls packages/web/lib/api/generated/zod/` | ❌ Wave 0 — requires orval generate run |
| INFRA-05 | Generated files are prettier-formatted | smoke | `bun run format:check packages/web/lib/api/generated/` | ❌ Wave 0 — requires generate run |
| SPEC-04 | No double-prefix in generated URLs | smoke | `grep -r "api/v1/api/v1" packages/web/lib/api/generated/` | ❌ Wave 0 — requires generate run |
| SPEC-04 | typecheck passes including generated files | typecheck | `cd packages/web && bun run typecheck` | ❌ Wave 0 — requires generate run |

### Sampling Rate

- **Per task commit:** `bun run typecheck` in packages/web
- **Per wave merge:** `bun run generate:api && bun run typecheck`
- **Phase gate:** All smoke checks green; network DevTools confirms correct URL and Bearer token before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `packages/web/lib/api/mutator/custom-instance.ts` — custom axios mutator with Supabase JWT
- [ ] `generate:api` script in `packages/web/package.json`
- [ ] `generate` task in root `turbo.json` with correct `dependsOn` for build and typecheck
- [ ] `hooks.afterAllFilesWrite` block in `packages/web/orval.config.ts`
- [ ] `packages/web/lib/api/generated/` added to .gitignore (prerequisite for clean commits)

---

## Sources

### Primary (HIGH confidence)

- `packages/web/orval.config.ts` — existing skeleton, read directly; two-block structure, transformer, mutator path all confirmed
- `packages/web/lib/api/client.ts` — existing auth pattern; `supabaseBrowserClient.auth.getSession()` and empty-string baseURL confirmed
- `packages/web/lib/supabase/client.ts` — `supabaseBrowserClient` export path confirmed: `@/lib/supabase/client`
- `packages/web/package.json` — orval ^8.5.3 (devDeps), axios ^1.13.6, zod ^3.25 (deps) all confirmed installed
- `packages/api-server/openapi.json` — duplicate operationId blocker resolved; confirmed via git log (`d694b9ac`)
- `turbo.json` — current state: no generate task; build/dev/lint/test tasks present; needs update
- [Turborepo configuring-tasks docs](https://turborepo.dev/docs/crafting-your-repository/configuring-tasks) — dependsOn syntax and outputs configuration verified

### Secondary (MEDIUM confidence)

- [Orval custom-axios guide](https://orval.dev/guides/custom-axios) — 404 on fetch; pattern confirmed via WebSearch summary and community examples
- [Orval output configuration](https://www.orval.dev/reference/configuration/output) — `output.prettier: true` and mutator object config verified; `hooks` location at config-block level confirmed
- [prototyp.digital blog](https://prototyp.digital/blog/generating-api-client-openapi-swagger-definitions) — `ErrorType` and `BodyType` export pattern for Orval custom mutator confirmed (MEDIUM — single source)

### Tertiary (LOW confidence)

- Various WebSearch results on `afterAllFilesWrite` array syntax — multiple sources agree on `["prettier --write", "eslint --fix"]` pattern; not directly verified against official docs page

---

## Metadata

**Confidence breakdown:**

- Custom mutator pattern: HIGH — derived from existing `client.ts` (same project) + official Orval mutator contract (AxiosRequestConfig signature, ErrorType/BodyType exports)
- orval.config.ts hooks.afterAllFilesWrite location: HIGH — confirmed via official output config docs (hooks is sibling of output, not child)
- Turborepo generate pipeline: HIGH — official Turborepo docs verified; dependsOn + outputs pattern documented
- prettier binary resolution: MEDIUM — behavior depends on shell PATH setup; fallback strategy documented
- ESLint on generated files: MEDIUM — likely to cause issues; gitignore/config recommendation is precautionary

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (30 days — Orval 8.x is actively maintained; Turborepo config syntax is stable)
