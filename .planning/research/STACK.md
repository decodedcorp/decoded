# Stack Research

**Domain:** Type-Safe API Client Generation — Orval + Zod for decoded-monorepo v9.0
**Researched:** 2026-03-23
**Confidence:** HIGH (Orval v8.5.3 verified from GitHub releases; zod v4.x verified from npm; axios 1.13.x verified from npm)

---

## Context: Existing Stack — Do Not Re-Research

Already installed and validated as of v8.0 monorepo consolidation. Zero changes to these:

| Package | Version | Status |
|---------|---------|--------|
| Next.js | 16.2.1 | Stays |
| React | 19.2.4 | Stays |
| TypeScript | 5.9.3 | Stays |
| @tanstack/react-query | 5.90.11 | Stays — Orval generates into this |
| bun | 1.3.10+ | Stays — package manager |
| Turborepo | (in use) | Stays — add `generate` task |
| Supabase | 2.86.0 | Stays — NOT being migrated this milestone |

The existing manual API client in `packages/web/lib/api/` uses raw `fetch` with a custom `apiClient()` wrapper that injects Supabase JWT tokens. Orval's generated client must integrate with the same auth pattern — not introduce a second HTTP client with a different auth mechanism.

---

## New Stack: What to Add

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| orval | ^8.5.3 | CLI that reads OpenAPI spec and emits TypeScript React Query hooks + Zod schemas | Industry standard for OpenAPI-to-TypeScript codegen as of 2025-2026; generates one hook per endpoint; supports react-query v5, Zod v3/v4, custom mutators; v8 is the current stable major; actively maintained (v8.5.3 released March 6, 2025) |
| zod | ^3.25 | Runtime validation library for generated schemas | Orval's Zod v4 support (added in Orval 7.10) has active edge-case bugs with certain string formats (issue #2249, #2304 as of July 2025); Zod v3 support in Orval is battle-tested and stable; use ^3.25 until Orval Zod v4 compatibility is confirmed stable |
| axios | ^1.13.6 | HTTP client used as the default by Orval-generated code | Orval's react-query generator defaults to axios for the underlying HTTP calls; interceptors allow injecting the Supabase JWT token centrally (one place vs per-call); current stable is 1.13.6 with full bun compatibility |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/axios | (bundled in axios 1.x) | TypeScript types | Included — no separate install needed since axios 1.x ships its own types |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| orval CLI (from `orval` package) | Run `orval` to regenerate API client from OpenAPI spec | Installed as dev dependency; invoked via `bun run generate:api` |
| `bunx orval` | One-off generation without global install | Works because orval ships a CLI binary |

---

## Architecture: Two-Config Pattern

Orval uses **two separate output configurations** in one `orval.config.ts` to generate react-query hooks AND Zod schemas in parallel without naming conflicts:

```typescript
// packages/web/orval.config.ts
import { defineConfig } from 'orval';

export default defineConfig({
  // Config 1: React Query hooks (primary — replaces lib/api/ files)
  decodedApi: {
    input: {
      target: 'https://dev.decoded.style/api-docs/openapi.json',
    },
    output: {
      mode: 'tags-split',           // One folder per OpenAPI tag (posts/, users/, etc.)
      target: 'lib/api/generated',  // Output directory for hooks
      schemas: 'lib/api/generated/model', // TypeScript type definitions
      client: 'react-query',        // Generates useQuery / useMutation hooks
      clean: true,                  // Delete stale generated files on each run
      prettier: true,               // Auto-format output
      override: {
        mutator: {
          path: './lib/api/custom-client.ts', // Custom axios instance with JWT injection
          name: 'customClient',
        },
        query: {
          useQuery: true,
          useMutation: true,
          signal: true,             // AbortController support
        },
      },
    },
  },

  // Config 2: Zod schemas for runtime validation (separate output to avoid conflicts)
  decodedApiZod: {
    input: {
      target: 'https://dev.decoded.style/api-docs/openapi.json',
    },
    output: {
      mode: 'tags-split',
      target: 'lib/api/generated',
      client: 'zod',               // Generates Zod schemas only (no hooks)
      fileExtension: '.zod.ts',    // Prevents naming collision with hook files
      override: {
        zod: {
          generate: {
            response: true,        // Validate API responses at runtime
            body: true,            // Validate request bodies before sending
            query: false,          // Skip query param schemas (less value, more noise)
          },
        },
      },
    },
  },
});
```

**Why two configs instead of one:**

- `client: 'react-query'` and `client: 'zod'` are mutually exclusive in a single config block
- Using `fileExtension: '.zod.ts'` in the zod config prevents file name collisions with hook files
- Both configs read from the same OpenAPI spec URL — no duplication of the source

### Custom Client (auth injection)

The `mutator` in Config 1 points to a custom axios instance that replicates the existing `apiClient()` auth pattern. This is the **only HTTP client** — the existing `lib/api/client.ts` fetch-based client is replaced by this:

```typescript
// packages/web/lib/api/custom-client.ts
import Axios, { AxiosRequestConfig } from 'axios';
import { supabaseBrowserClient } from '@/lib/supabase/client';

const INSTANCE = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
});

INSTANCE.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabaseBrowserClient.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export const customClient = <T>(config: AxiosRequestConfig): Promise<T> => {
  return INSTANCE(config).then(({ data }) => data);
};
```

**Key constraint:** The existing `lib/api/client.ts` routes through Next.js API proxy (`API_BASE_URL = ""`). The custom client must preserve this pattern — `baseURL` should be the empty string (routes through `/api/v1/...` proxy) not the direct Rust backend URL, unless the proxy is being removed in v9.0.

---

## Installation

```bash
# In packages/web — all are web-package-scoped dependencies
cd packages/web

# Dev dependency: Orval CLI
bun add -D orval

# Runtime: axios (HTTP client for generated code)
bun add axios

# Runtime: Zod (schema validation for generated schemas)
bun add zod
```

### Add generate script to packages/web/package.json

```json
{
  "scripts": {
    "generate:api": "orval"
  }
}
```

### Add to turbo.json (root)

```json
{
  "tasks": {
    "generate:api": {
      "cache": false,
      "outputs": ["lib/api/generated/**"]
    }
  }
}
```

The `cache: false` is intentional — generated output should always re-run against the live spec. If the spec is stable, change to `"inputs": ["orval.config.ts"]` with cache enabled.

### Add generated files to .gitignore

```
# Orval generated files — committed only if you want stable snapshots
packages/web/lib/api/generated/
```

Decision point: whether to commit generated files (stable snapshot) or gitignore them (always regenerate). Recommendation: **gitignore and regenerate in CI `prebuild`**, same pattern as GraphQL codegen.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| orval | openapi-typescript + openapi-fetch | If project wants zero-dependency type generation without hooks; openapi-typescript generates types only; no hooks, no Zod — requires more manual wiring |
| orval | openapi-zod-client (astahmer) | If project uses zodios HTTP client instead of axios/react-query; heavier dependency; smaller community |
| orval | swagger-typescript-api | Older tool, less active maintenance, no Zod integration; avoid |
| axios (via Orval default) | fetch (native) | Use native fetch if axios interceptors are overkill; Orval supports `httpClient: 'fetch'` but `runtimeValidation: true` with fetch is a newer feature with less battle-testing; axios + interceptors is the proven path for auth injection |
| zod v3 | zod v4 | Use zod v4 when Orval's compatibility layer fully stabilizes (track issue #2042 and #2249); as of March 2026, v4 has edge-case bugs in Orval's generated output for certain OpenAPI string formats |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| A second HTTP client library (e.g., ky, got, unfetch) | Project already uses native fetch in lib/api/; Orval generated code uses axios; adding a third HTTP client would create three competing patterns | Use axios exclusively for generated code; keep Supabase client (which manages its own HTTP) separate |
| openapi-generator (Java CLI) | Requires JVM; generates verbose boilerplate Java-style code; no bun integration | Orval (Node.js, bun-compatible CLI) |
| rtk-query codegen | Only useful if project uses Redux Toolkit; this project uses Zustand + React Query — RTK Query would be a conflicting state layer | N/A |
| @orval/zod (separate npm scope package) | This is Orval's internal monorepo package — not intended for direct installation by consumers; the `orval` package includes the zod generator | Just install `orval` — it includes all generators |
| Global orval install (`bun add -g orval`) | Global tool versions can drift from project's pinned version; different devs get different outputs | Use local devDependency + `bun run generate:api` script |
| Committing the OpenAPI spec JSON locally | The spec lives at `https://dev.decoded.style`; downloading and committing creates a stale local copy that diverges | Point `input.target` at the live URL directly; fail fast if backend is unreachable |

---

## Bun Compatibility Notes

- `orval` CLI is a Node.js binary distributed via npm; bun can install and run it without issues (`bunx orval` or via `bun run generate:api` script)
- `axios` v1.x explicitly added a `bun` condition to its `exports` field — loads the Node.js build (not browser build) when running under bun
- `zod` v3.x has no bun-specific issues — pure TypeScript library
- Turborepo's `generate:api` task can include orval as a pipeline step with `dependsOn: []` (runs independently, not part of build chain unless spec changes trigger builds)

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| orval@^8.5.3 | @tanstack/react-query@^5 | Orval v8 targets TanStack Query v5 API (useQuery, useMutation signatures); v4 React Query would require Orval v6/v7 |
| orval@^8.5.3 | zod@^3.25 | Stable; v3 is the fully-tested path |
| orval@^8.5.3 | zod@^4.x | Beta-level support added in Orval 7.10; active edge-case bugs as of late 2025 (string format schemas); validate before adopting |
| orval@^8.5.3 | TypeScript@^5.9 | Compatible; Orval generates modern TypeScript |
| orval@^8.5.3 | Next.js@^16 | No framework-level conflict; generated files are plain TypeScript; `app/` Router compatible |
| axios@^1.13.6 | bun@^1.3 | Compatible; axios 1.x ships `bun` export condition |
| zod@^3.25 | React 19 | No dependency on React; pure schema library |

---

## Sources

- https://github.com/orval-labs/orval/releases — Orval v8.5.3 release date (March 6, 2025), latest stable (HIGH confidence — official repo)
- https://deepwiki.com/orval-labs/orval/5-zod-schema-validation — Orval Zod architecture: two-phase generation, @orval/zod internal package, Zod v3/v4 compatibility layer (MEDIUM confidence — DeepWiki analysis of official repo)
- https://www.orval.dev/reference/configuration/output — Output config: `client`, `mode`, `override.zod`, `override.query`, `override.mutator`, `fileExtension` (HIGH confidence — official docs)
- https://github.com/orval-labs/orval/blob/master/samples/react-query/custom-fetch/orval.config.ts — Official sample: react-query + custom fetch mutator pattern (HIGH confidence — official sample)
- https://www.orval.dev/guides/client-with-zod — Two-config pattern for react-query + zod parallel generation; `.zod.ts` extension to avoid conflicts (HIGH confidence — official guide)
- https://x.com/SoartecL/status/1920068137266954374 — Orval Zod v4 support added in 7.10 (MEDIUM confidence — official team tweet)
- https://github.com/orval-labs/orval/issues/2249 — Orval Zod v4 string format edge-case bug (July 2025) (HIGH confidence — official issue tracker)
- https://github.com/orval-labs/orval/issues/2304 — Orval Zod v4 + Hono validator error (HIGH confidence — official issue tracker)
- https://www.npmjs.com/package/zod — Zod v4.3.6 latest, v3 still active and stable (HIGH confidence — official npm registry)
- https://github.com/axios/axios/releases — Axios 1.13.6 latest as of March 2026 (HIGH confidence — official GitHub releases)
- https://prototyp.digital/blog/generating-api-client-openapi-swagger-definitions — Complete orval.config example with tags-split, custom mutator, react-query (MEDIUM confidence — community article, verified against official docs)

---

*Stack research for: decoded-monorepo v9.0 Type-Safe API Generation (Orval + Zod)*
*Researched: 2026-03-23*
