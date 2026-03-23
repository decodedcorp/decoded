# Phase 39: Setup and Spec Validation - Research

**Researched:** 2026-03-23
**Domain:** Orval codegen setup, OpenAPI spec audit (utoipa 5.x / OpenAPI 3.1), package installation
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | Orval, axios, zod 패키지 설치 및 orval.config.ts 작성 (react-query + zod 두 config 블록) | Verified current package versions; config skeleton documented below |
| SPEC-01 | 백엔드 OpenAPI 스펙 버전 확인 (3.0 vs 3.1) 및 utoipa nullable 이슈 검증 | utoipa 5.3 generates OpenAPI 3.1.0; nullable uses oneOf+type:null pattern; Orval 8.x supports this |
| SPEC-02 | 전체 엔드포인트 operationId 감사 (중복 없음 + camelCase verbNoun) 및 태그 매핑 검증 | utoipa derives operationId from function name (snake_case) — needs audit; all tags confirmed in openapi.rs |
| SPEC-03 | 업로드/multipart 엔드포인트 명시적 목록화 및 Orval config 제외 설정 | 4 multipart endpoints identified and listed below; exclusion strategy documented |
| SPEC-05 | 무한 스크롤 엔드포인트 식별 및 pagination 파라미터 확인 (cursor/page/offset) | ALL paginated endpoints use page+per_page (no cursor); no infinite-scroll cursor pagination found |
</phase_requirements>

---

## Summary

The backend uses utoipa 5.3 which generates **OpenAPI 3.1.0** by default. This is a critical fact: Orval 8.x (specifically 8.5.3, the version to install) has been updated to handle OpenAPI 3.1 nullable patterns, so no preprocessing script should be required. The key nullable pattern from utoipa 5.x is `oneOf: [{type: null}, {$ref: ...}]` — this is the OpenAPI 3.1 canonical form and Orval 8.5 handles it correctly.

The backend has ~75 endpoints registered in openapi.rs. All operationIds are derived from Rust function names in `snake_case` format (e.g., `create_post_without_solutions`, `home_feed`). Orval will convert these to camelCase automatically, but the planner must verify there are no duplicate operationIds (two handlers at the same path but different HTTP methods). Four multipart/binary endpoints exist and must be excluded from Orval generation permanently. All pagination uses `page` + `per_page` integer parameters — no cursor-based pagination exists, which means `useInfiniteQuery` hooks are out of scope for v9.0 (deferred to v9.1 ADV-01).

**Primary recommendation:** Install packages, run `cargo run` to produce the live OpenAPI JSON from the swagger endpoint, save it as `packages/api-server/openapi.json`, then run a formal audit script against that JSON to enumerate: (1) spec version header, (2) all operationIds with duplicate detection, (3) all multipart endpoints, (4) all paginated endpoints.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| orval | 8.5.3 | OpenAPI → TanStack Query + Zod codegen | Current latest; matches project requirement |
| axios | 1.13.6 | HTTP client used by Orval mutator | Current latest; required for custom auth mutator |
| zod | 3.25.x | Schema validation for generated types | v3 required — Orval Zod v4 compat bugs #2249/#2304 active |

**Version verification (npm view output):**
- `orval`: 8.5.3 (confirmed via `npm view orval version`)
- `axios`: 1.13.6 (confirmed via `npm view axios version`)
- `zod`: 4.3.6 is latest BUT must pin `^3.25` — see Locked Decisions

**Installation (in packages/web):**
```bash
cd packages/web
bun add orval@^8.5.3 axios@^1.13.6 zod@^3.25
```

Note: `orval` should be a `devDependency` since it's a codegen tool. `axios` and `zod` are runtime dependencies.

```bash
bun add -d orval@^8.5.3
bun add axios@^1.13.6 zod@^3.25
```

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | 5.90.11 (already installed) | Query client for generated hooks | Already present — no install needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| zod@^3.25 | zod@^4.x | zod v4 has active Orval incompatibility bugs #2249/#2304 — use v3 |
| axios | fetch (Orval default in v8) | Orval 8 switched default to fetch, but project needs custom auth mutator with Supabase JWT — axios is easier to wrap |

---

## Architecture Patterns

### Recommended Project Structure
```
packages/web/
├── orval.config.ts           # Codegen config (two blocks: react-query + zod)
├── lib/api/
│   ├── generated/            # Orval output — gitignored, never edit manually
│   │   ├── posts.ts          # Generated hooks per tag (mode: tags)
│   │   ├── feed.ts
│   │   └── ...
│   ├── mutator/
│   │   └── custom-instance.ts  # Supabase JWT + baseURL="" mutator
│   ├── client.ts             # EXISTING — to be replaced in Phase 40+
│   └── types.ts              # EXISTING — to be deleted in Phase 42
```

### Pattern 1: Orval Config Skeleton (Two Blocks)

**What:** Two separate Orval config blocks — one for react-query hooks, one for zod schemas.
**When to use:** Always in this project — react-query block generates hooks + axios calls; zod block generates standalone schema validators.

```typescript
// orval.config.ts — SKELETON (do not finalize until spec is audited)
import { defineConfig } from "orval";

export default defineConfig({
  decodedApi: {
    input: {
      target: "./packages/api-server/openapi.json",
      filters: {
        // Exclude tags containing test endpoints
        // mode: "exclude",
        // tags: ["test"],
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
        // Upload endpoints excluded here (see SPEC-03 section)
        operations: {
          uploadImage: { mock: { skip: true } },
          createPostWithoutSolutions: { mock: { skip: true } },
          createPostWithSolutions: { mock: { skip: true } },
          analyzeImage: { mock: { skip: true } },
        },
      },
    },
  },
  decodedApiZod: {
    input: {
      target: "./packages/api-server/openapi.json",
    },
    output: {
      client: "zod",
      target: "./lib/api/generated/zod",
      fileExtension: ".zod.ts",
    },
  },
});
```

Note: The actual exclusion mechanism for multipart endpoints in Orval 8 is via `input.filters` (tag-based) or `override.operations` (per-operationId). For full exclusion (no generated hook at all), an `input.override.transformer` that removes those paths from the spec is the most reliable approach.

### Pattern 2: Input Transformer for Multipart Exclusion

**What:** A JavaScript transformer function that removes multipart paths from the spec before Orval processes it.
**When to use:** When tag-based filtering is insufficient and specific endpoints must be fully excluded.

```typescript
// In orval.config.ts input.override
input: {
  target: "./packages/api-server/openapi.json",
  override: {
    transformer: (spec) => {
      // Remove multipart endpoints before generation
      const EXCLUDED_PATHS = [
        "/api/v1/posts/upload",
        "/api/v1/posts/analyze",
        "/api/v1/posts",       // POST only — tricky with path sharing
        "/api/v1/posts/with-solutions", // POST only
      ];
      // Note: path-level removal removes ALL methods. Per-method exclusion
      // requires removing the specific verb from the path object.
      return spec;
    },
  },
},
```

**Warning:** POST /api/v1/posts and POST /api/v1/posts/with-solutions share their path with GET /api/v1/posts (list_posts). You cannot simply remove the entire path — you must remove only the POST verb from those paths. This is a key complexity the planner must address.

### Anti-Patterns to Avoid
- **Editing generated files:** Orval overwrites them on every regeneration. All customizations go in the mutator.
- **Putting generated hooks in packages/shared:** Causes "No QueryClient" errors (TanStack #3595). Generated code stays in packages/web.
- **Using zod@^4.x:** Active incompatibility bugs with Orval #2249/#2304. Pin to ^3.25.
- **Setting baseURL to the real backend URL:** The Next.js proxy is the correct routing layer. mutator baseURL must be `""` (empty string).

---

## Spec Audit: What Will Be Found

### OpenAPI Version (SPEC-01)

**Finding (HIGH confidence):** utoipa 5.3 generates **OpenAPI 3.1.0** by default. The `openapi.json` produced by the running backend will have `"openapi": "3.1.0"` at the top level.

**Nullable pattern (HIGH confidence):** utoipa 5.x uses the OpenAPI 3.1 canonical null representation:
```json
{
  "oneOf": [
    { "type": "null" },
    { "$ref": "#/components/schemas/SomeType" }
  ]
}
```
This is NOT the OpenAPI 3.0 `"nullable": true` pattern. Orval 8.5 handles this correctly — fix for duplicate `| null` shipped in v7.5.0 (PR #1818, closed 2025-02-03) and is present in v8.x.

**Preprocessing script needed?** No — Orval 8.5.3 supports OpenAPI 3.1 nullable natively.

### operationId Audit (SPEC-02)

**Finding (HIGH confidence):** utoipa derives `operationId` from the Rust function name in `snake_case`. No explicit `operation_id` overrides were found in any handler file. This means:

| Rust function | Expected operationId in spec | Orval-generated hook name |
|---|---|---|
| `create_post_without_solutions` | `create_post_without_solutions` | `useCreatePostWithoutSolutions` |
| `home_feed` | `home_feed` | `useHomeFeed` |
| `list_posts` | `list_posts` | `useListPosts` |
| `upload_image` | `upload_image` | `useUploadImage` |

**Potential problem — duplicate operationIds:** Two handlers exist with the same name in different domains:
- `crate::domains::posts::handlers::list_posts` (GET /api/v1/posts)
- `crate::domains::admin::posts::list_posts` (GET /api/v1/admin/posts)

Both will generate operationId `list_posts` unless utoipa deduplicates by tag. This MUST be verified in the live spec. Similarly, `list_badges` appears in both badges and admin::badges.

**Handler/suffix issues:** No `Handler` suffix found in function names. No `snake_case` vs `camelCase` inconsistency to fix — utoipa uses Rust function name directly, Orval converts to camelCase.

**Tags:** All tags are correctly declared in openapi.rs. Every endpoint has a `tag = "..."` annotation.

### Multipart/Upload Endpoints (SPEC-03)

**Finding (HIGH confidence):** Exactly 4 multipart endpoints are registered in openapi.rs:

| Endpoint | Function | Path | HTTP Method | operationId |
|----------|----------|------|-------------|-------------|
| Create post (no solutions) | `create_post_without_solutions` | POST /api/v1/posts | POST | `create_post_without_solutions` |
| Create post (with solutions) | `create_post_with_solutions` | POST /api/v1/posts/with-solutions | POST | `create_post_with_solutions` |
| Upload image | `upload_image` | POST /api/v1/posts/upload | POST | `upload_image` |
| Analyze image | `analyze_image` | POST /api/v1/posts/analyze | POST | `analyze_image` |

**Critical path-sharing issue:** `/api/v1/posts` has both:
- GET (operationId `list_posts`) — KEEP in Orval
- POST (operationId `create_post_without_solutions`) — EXCLUDE from Orval

The exclusion strategy must remove only the POST verb from `/api/v1/posts`, not the entire path.

**orval.config.ts exclusion draft (transformer approach):**
```typescript
transformer: (spec) => {
  const pathsToRemoveVerb = {
    "/api/v1/posts": ["post"],             // keep get
    "/api/v1/posts/with-solutions": ["post"], // keep get
    "/api/v1/posts/upload": ["post"],
    "/api/v1/posts/analyze": ["post"],
  };
  for (const [path, verbs] of Object.entries(pathsToRemoveVerb)) {
    if (spec.paths?.[path]) {
      for (const verb of verbs) {
        delete spec.paths[path][verb];
      }
    }
  }
  return spec;
},
```

### Pagination Parameters (SPEC-05)

**Finding (HIGH confidence):** ALL paginated endpoints in the backend use **`page` + `per_page`** integer query parameters. No cursor-based or offset-based pagination exists.

**Paginated endpoints list (from utoipa annotations):**
| Endpoint | Parameters |
|----------|-----------|
| GET /api/v1/posts | page, per_page |
| GET /api/v1/feed | page, per_page |
| GET /api/v1/feed/trending | page, per_page |
| GET /api/v1/rankings | page, per_page |
| GET /api/v1/rankings/{category} | page, per_page |
| GET /api/v1/users/me/activities | page, per_page |
| GET /api/v1/admin/posts | page, per_page |
| GET /api/v1/admin/spots | page, per_page |
| GET /api/v1/admin/solutions | page, per_page |
| GET /api/v1/admin/badges | page, per_page |

**Impact on v9.0:** No cursor pagination means `useInfiniteQuery` generation (ADV-01) is out of scope for v9.0. The paginated endpoints use `PaginatedResponse<T>` with `PaginationMeta` (current_page, per_page, total_items, total_pages). Standard `useQuery` hooks suffice.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OpenAPI spec parsing | Custom YAML/JSON parser | Orval's built-in input parsing | Handles $ref resolution, discriminators, allOf/anyOf/oneOf |
| TypeScript type generation | Manual types from spec | Orval generated models | Types stay in sync with spec automatically |
| Zod schema generation | Handwritten schemas | Orval's `client: "zod"` config block | 150+ schemas auto-maintained |
| operationId deduplication | Manual rename | Backend PR to add explicit operationId in utoipa | utoipa supports `operation_id = "..."` attribute in `#[utoipa::path(...)]` |

**Key insight:** The spec audit exists to find issues that would break `orval generate` before any code is written. Do the audit first, fix issues second, configure Orval third.

---

## Common Pitfalls

### Pitfall 1: Duplicate operationId from same function name in different modules
**What goes wrong:** utoipa derives operationId from Rust function name. Two handlers named `list_posts` (in `posts` and `admin::posts` modules) will produce duplicate `list_posts` operationIds. Orval may silently pick one or error.
**Why it happens:** utoipa has no module-namespace awareness in its operationId derivation.
**How to avoid:** Run `jq '.paths | to_entries[] | .value | to_entries[] | .value.operationId' openapi.json | sort | uniq -d` on the live spec to find duplicates. Fix by adding explicit `operation_id = "admin_list_posts"` in the utoipa `#[utoipa::path]` attribute on the backend.
**Warning signs:** Generated Orval output has fewer files than expected, or types are mysteriously merged.

### Pitfall 2: POST /api/v1/posts shares path with GET /api/v1/posts
**What goes wrong:** A naive "exclude /api/v1/posts" approach removes the entire path, including the GET list_posts hook that SHOULD be generated.
**Why it happens:** OpenAPI paths are objects with HTTP verbs as keys — you must remove the verb, not the path.
**How to avoid:** Use a transformer that deletes only `spec.paths["/api/v1/posts"].post`, not `spec.paths["/api/v1/posts"]`.

### Pitfall 3: Orval 8 default HTTP client is fetch, not axios
**What goes wrong:** Without explicit `httpClient: "axios"` in the output config, Orval 8 generates fetch-based code. The project needs axios for the custom mutator.
**Why it happens:** Orval 8 changed the default from axios to fetch.
**How to avoid:** Always set `httpClient: "axios"` explicitly in the output block.

### Pitfall 4: zod v4 installed instead of v3
**What goes wrong:** If `bun add zod` is run without a version pin, zod@4.x gets installed. Orval's zod generator has active bugs with v4 (#2249, #2304).
**Why it happens:** zod v4.3.6 is currently the `latest` tag on npm.
**How to avoid:** Always pin `zod@^3.25` in the install command.

### Pitfall 5: Backend spec not running / wrong URL
**What goes wrong:** Spec audit requires the live backend to be running so the swagger JSON can be captured. If the backend isn't running, `GET http://localhost:3001/api-docs/openapi.json` fails.
**Why it happens:** The openapi.json doesn't exist as a static file — it's generated at runtime by utoipa-swagger-ui.
**How to avoid:** Start the backend with `cargo run` first, then `curl http://localhost:3001/api-docs/openapi.json > packages/api-server/openapi.json` to save a static copy for Orval to consume.

---

## Code Examples

### Fetching and saving the live OpenAPI spec
```bash
# Source: packages/api-server/src/main.rs line 118 — confirmed URL
# Start backend first: cd packages/api-server && cargo run
curl -s http://localhost:3001/api-docs/openapi.json | jq . > packages/api-server/openapi.json
```

### Auditing operationIds for duplicates
```bash
# Run after saving openapi.json
jq '[.paths | to_entries[] | .value | to_entries[] | .value.operationId] | sort | group_by(.) | map(select(length > 1)) | flatten' \
  packages/api-server/openapi.json
```

### Auditing all multipart endpoints
```bash
# Find all paths with multipart/form-data request bodies
jq '[.paths | to_entries[] | {path: .key, verbs: (.value | to_entries[] | select(.value.requestBody.content["multipart/form-data"] != null) | {verb: .key, operationId: .value.operationId})}]' \
  packages/api-server/openapi.json
```

### Verifying OpenAPI version in spec
```bash
jq '.openapi' packages/api-server/openapi.json
# Expected: "3.1.0"
```

### Checking for nullable field pattern
```bash
# Count oneOf patterns (OpenAPI 3.1 nullable style)
jq '[.. | objects | select(.oneOf != null)] | length' packages/api-server/openapi.json
# Count nullable:true (OpenAPI 3.0 style — should be 0)
jq '[.. | objects | select(.nullable == true)] | length' packages/api-server/openapi.json
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| Orval default HTTP client = axios | Default = fetch | Orval v8.0.0 | Must set `httpClient: "axios"` explicitly |
| CJS config files (orval.config.js) | ESM required (orval.config.mjs or type:module) | Orval v8.0.0 | Config file must be .ts or .mjs |
| OpenAPI 3.0 nullable: true | OpenAPI 3.1 type: null in oneOf | utoipa 5.x | Orval 8.x handles both; no preprocessing needed |
| zod camelCase schema names | zod PascalCase schema names | Orval v8.0.0 | `CreatePostBody` not `createPostBody` |

**Deprecated/outdated:**
- `override.coerceTypes`: Removed in Orval v8 — use `override.zod.coerce` instead.
- `override.useNativeEnums`: Removed in Orval v8 — use `enumGenerationType: 'enum'`.
- `override.fetch.explode`: Removed in Orval v8 — specify in OpenAPI spec instead.

---

## Open Questions

1. **Swagger endpoint URL** — RESOLVED
   - Confirmed: `packages/api-server/src/main.rs` line 118: `SwaggerUi::new("/swagger-ui").url("/api-docs/openapi.json", ...)`
   - Spec URL: `http://localhost:3001/api-docs/openapi.json`
   - No blocker — curl command in Code Examples is correct as-is

2. **Duplicate operationId resolution strategy**
   - What we know: `list_posts` exists in both `posts::handlers` and `admin::posts` modules; `list_badges` exists in both `badges::handlers` and `admin::badges`
   - What's unclear: Whether utoipa already deduplicates them automatically or whether the generated spec will have actual duplicates
   - Recommendation: Run the audit first; if duplicates exist, file a backend PR adding `operation_id = "adminListPosts"` attribute in the affected handlers

3. **Backend running in dev environment**
   - What we know: Backend requires database (SeaORM + PostgreSQL) and other services to start
   - What's unclear: Whether there's a way to get the static spec without running the full server (e.g., a `--print-openapi` CLI flag)
   - Recommendation: If full startup is not feasible locally, check if there's a dev/staging URL that serves the spec; alternatively implement a `cargo run --bin print-spec` helper

---

## Validation Architecture

> workflow.nyquist_validation is not set to false in .planning/config.json — section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright (packages/web) + cargo test (packages/api-server) |
| Config file | packages/web/playwright.config.ts (existing) |
| Quick run command | `cd packages/web && bun run typecheck` |
| Full suite command | `cd packages/api-server && cargo test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | bun install completes without error | smoke | `cd packages/web && bun install --frozen-lockfile` | ✅ bun.lock |
| SPEC-01 | spec openapi field equals "3.1.0" | smoke (bash) | `jq '.openapi' packages/api-server/openapi.json` | ❌ Wave 0 — openapi.json must be generated |
| SPEC-02 | zero duplicate operationIds in spec | smoke (bash) | See audit jq command above | ❌ Wave 0 — openapi.json required |
| SPEC-03 | orval.config.ts excludes multipart paths | manual | `orval --config orval.config.ts` then verify no multipart hooks generated | ❌ Wave 0 — config must be created |
| SPEC-05 | all pagination params are page+per_page | smoke (bash) | jq query on openapi.json | ❌ Wave 0 — openapi.json required |

### Sampling Rate
- **Per task commit:** `bun run typecheck` in packages/web
- **Per wave merge:** Full jq audit against openapi.json
- **Phase gate:** All 5 jq/smoke checks pass before Phase 40 begins

### Wave 0 Gaps
- [ ] `packages/api-server/openapi.json` — must be generated by running the backend and saving the swagger endpoint output
- [ ] `packages/web/orval.config.ts` — Phase 39 produces a draft/skeleton; Phase 40 finalizes it

---

## Sources

### Primary (HIGH confidence)
- `packages/api-server/Cargo.toml` — utoipa = { version = "5.3" } confirmed
- `packages/api-server/src/openapi.rs` — All 75 registered paths and schemas read directly
- `packages/api-server/src/utils/pagination.rs` — Pagination struct: `page` + `per_page` only
- `packages/api-server/src/domains/posts/handlers.rs` — 4 multipart handlers confirmed
- `packages/web/package.json` — Current installed packages; orval/axios/zod not yet installed
- `packages/api-server/src/main.rs` line 118 — SwaggerUi URL confirmed: `/api-docs/openapi.json`
- `npm view orval version` → 8.5.3 (verified 2026-03-23)
- `npm view axios version` → 1.13.6 (verified 2026-03-23)
- `npm view zod version` → 4.3.6 (latest) — but must pin ^3.25

### Secondary (MEDIUM confidence)
- [utoipa docs.rs](https://docs.rs/utoipa/latest/utoipa/) — Confirms OpenAPI 3.1 generation as default
- [Orval v8 changelog](https://orval.dev/docs/versions/v8/) — Confirms ESM migration, fetch default, nullable/OpenAPI 3.1 fix
- [Orval issue #1817](https://github.com/orval-labs/orval/issues/1817) — Duplicate `| null` bug fixed in v7.5.0 (present in 8.x)

### Tertiary (LOW confidence)
- Various WebSearch results on Orval input filters — filter mechanism is tag-based; per-path/operationId exclusion requires transformer

---

## Metadata

**Confidence breakdown:**
- Package versions: HIGH — verified via npm registry
- OpenAPI version (3.1.0): HIGH — utoipa 5.x documented behavior + confirmed via docs.rs
- Nullable handling: HIGH — Orval issue #1817 fix confirmed in 7.5.0+; v8.5.3 includes it
- operationId audit (duplicate risk): MEDIUM — identified candidate duplicates from source; live spec not yet available to confirm
- Multipart endpoint list: HIGH — read directly from openapi.rs source of truth
- Pagination parameters: HIGH — read directly from pagination.rs and handler annotations
- Orval exclusion strategy (transformer): MEDIUM — documented approach, needs testing against live spec

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (30 days — Orval and utoipa are active projects)
