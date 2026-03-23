# Phase 43: CI Hardening and Tooling - Research

**Researched:** 2026-03-24
**Domain:** CI/CD drift detection, git hooks, .gitignore strategy, Zod schema validation testing, agent tooling documentation
**Confidence:** HIGH

## Summary

Phase 43 closes the final loop of the v9.0 API generation project. The Orval codegen pipeline is fully operational — generated files exist in `packages/web/lib/api/generated/`, all hooks are migrated, and old manual API files are deleted. What remains is making the workflow durable: prevent spec drift from silently creeping in, stop generated files from being committed to git (currently only a `.gitkeep` is tracked), write Zod validation tests, and document the generated-code ownership rules for Claude Code and human reviewers.

The existing infrastructure is already partially wired: `packages/web/scripts/pre-push.sh` runs lint/format/typecheck but has no `generate:api && git diff --exit-code` step. The root `.gitignore` does not exclude `packages/web/lib/api/generated/`; only a `.gitkeep` sentinel is tracked, meaning all generated files currently live untracked on disk. Turborepo's `turbo.json` declares `generate:api` as a build dependency, but CI (GitHub Actions) has only a Telegram notification workflow — no CI linting/build/generation workflow exists at all. These gaps are exactly what CI-01 through CI-05, TEST-01, and TOOL-01 through TOOL-03 address.

**Primary recommendation:** Add `bun run generate:api && git diff --exit-code packages/web/lib/api/generated/` to `pre-push.sh`; add `packages/web/lib/api/generated/` to root `.gitignore` (keeping `.gitkeep`); write Zod parse tests using the existing generated schema file; document generated-code rules in CLAUDE.md.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CI-01 | 빌드 파이프라인에 generate:api 단계 추가 (prebuild 실행) | Turborepo `generate:api` task already wired as `build` dependency; pre-push.sh is the right place for local enforcement |
| CI-02 | Spec drift 감지 (generate && git diff --exit-code) pre-push 훅 추가 | pre-push.sh exists and is invoked by `.githooks/pre-push`; add generate + diff step |
| CI-03 | 생성 코드 .gitignore 설정 (packages/web/lib/api/generated/) | Only `.gitkeep` is tracked; add glob to root `.gitignore` while preserving `.gitkeep` |
| CI-04 | 백엔드 OpenAPI 스펙 변경 감지 및 프론트엔드 자동 재생성 trigger 프로세스 | Backend is a separate Rust/Axum workspace; no GitHub Actions CI workflow exists; cross-repo trigger must be documented as manual procedure |
| CI-05 | 마이그레이션 단계별 롤백 계획 (git branching strategy + pre-push validation) | Rollback is branch-level (GSD milestone branch pattern); document checkpoint strategy |
| TEST-01 | Zod 스키마 유효성 검증 테스트 (생성된 스키마 vs 실제 API 응답) | Generated Zod file exists at `lib/api/generated/zod/decodedApi.zod.ts` (2200 lines); no test runner installed yet; Vitest recommended |
| TOOL-01 | Claude Code 생성 파일 보호 메커니즘 (lib/api/generated/ 수정 시도 감지 및 차단/경고) | CLAUDE.md is the standard mechanism; `.claude/settings.json` can define ignore patterns |
| TOOL-02 | CLAUDE.md 업데이트 — 생성 코드 구조, 파일 소유권, generate 명령어 문서화 | CLAUDE.md exists and follows a well-defined format; add a "Generated API Code" section |
| TOOL-03 | 코드 리뷰어 에이전트 업데이트 — 생성 파일 스타일 스킵, 스키마 유효성 검사, scope drift 감지 규칙 | `.cursor/rules/monorepo.mdc` is the reviewer rule file; add generated-file rules there |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| bun | workspace:* | Script runner for generate:api + pre-push | Already the project's package manager |
| orval | ^8.5.3 | API codegen from OpenAPI spec | Already installed and configured |
| zod | ^3.25 | Schema validation | Already installed; pinned to v3 (not v4, see decisions) |
| vitest | latest | Unit test runner for Zod schema tests | Zero-config TS support; lighter than Jest in a Next.js bun project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vitest/coverage-v8 | latest | Coverage reporting | When coverage metrics are needed |
| msw | v2 | API response mocking for Zod tests | If testing against real API is not feasible in CI |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| vitest | jest | Jest requires more config in a bun/Next.js project; vitest has better ESM support |
| git diff --exit-code | custom hash comparison | git diff is simpler, language-agnostic, and standard; custom hashing is fragile |
| .gitignore glob | git rm --cached | .gitignore glob is idempotent and declarative; git rm --cached is one-time imperative |

**Installation (TEST-01 only):**
```bash
cd packages/web && bun add -D vitest @vitest/coverage-v8
```

No other new packages are required for CI-01 through CI-05 and TOOL-01 through TOOL-03.

## Architecture Patterns

### Recommended Project Structure

Phase 43 does not reorganize existing code. It adds:

```
packages/web/
├── scripts/
│   └── pre-push.sh          # Add: generate:api && git diff --exit-code step
├── lib/api/generated/
│   ├── .gitkeep             # Keep — directory sentinel for Turborepo outputs
│   └── zod/
│       └── decodedApi.zod.ts  # Zod schemas (2200 lines, single file per Orval config)
├── tests/
│   └── zod-validation.test.ts  # NEW — Zod schema parse tests (TEST-01)
└── vitest.config.ts           # NEW — if vitest not yet configured

.gitignore (root)
├── # Existing entries...
└── packages/web/lib/api/generated/   # NEW — exclude generated dir
    # EXCEPT .gitkeep (use negation pattern)

CLAUDE.md (root)
└── ## Generated API Code section   # NEW — TOOL-02
```

### Pattern 1: Spec Drift Detection in pre-push.sh

**What:** Run `generate:api` then check for uncommitted changes with `git diff --exit-code`. If the spec changed since last generation, git diff will detect differences in the generated files and exit non-zero, blocking the push.

**When to use:** Always — this is the core CI-02 requirement.

**How it fits the existing hook:**

The current `packages/web/scripts/pre-push.sh` has numbered sections (1=ESLint, 2=Prettier, 3=TypeScript, 4=Build). Add a step 0 (drift check runs before all others):

```bash
# Source: packages/web/scripts/pre-push.sh — add at top after cd
echo "=== 0. API Spec Drift Check ==="
bun run generate:api
git diff --exit-code packages/web/lib/api/generated/ || {
  echo "error: Generated API files are out of date. Commit the regenerated files or update the spec."
  exit 1
}
```

**Critical detail:** `bun run generate:api` resolves to `orval --config orval.config.ts`, which reads `../api-server/openapi.json` relative to `packages/web/`. The script already does `cd "$SCRIPT_DIR/.."` (i.e., `cd packages/web`), so the relative path resolves correctly.

**Critical detail 2:** Generated files must NOT be gitignored before this check runs — or `git diff` will show nothing because gitignored files are not tracked. The flow is: generate → diff → if clean, push is allowed. The .gitignore addition (CI-03) means that after this phase, git diff on the generated directory will be a no-op because none of those files are tracked. The correct long-term approach is:

**CI is the source of truth for generation, not git tracking.** Once files are gitignored, the pre-push drift check changes semantics: instead of "did you commit the generated files?", it becomes "does the current spec match what was generated?". This means the diff step compares against the local working tree, not the git index. This still works: `git diff` (without `--cached`) compares working tree against index; since generated files are untracked/ignored, it will show nothing unless the spec has changed and generation produced different output compared to what's currently on disk.

**Revised approach:** After adding .gitignore, the drift check becomes: generate fresh, then compare the freshly generated output with what's on disk using a file hash or diff of the directory. Alternatively, keep the pre-push step as-is and it will naturally catch drift because: if you changed the spec, re-running generate will update the generated files, and any consumers that broke will be caught by the TypeScript step.

**Simplest correct approach for CI-02 + CI-03 combined:**

```bash
echo "=== 0. API 스펙 Drift 검사 ==="
# Always regenerate — Turborepo caches this, so it's fast if spec hasn't changed
bun run generate:api
# TypeScript check (step 3) will catch if generated types don't match consumers
```

The TypeScript check is the actual safety net. The `generate:api` step in pre-push ensures generated files are always fresh before typecheck runs.

### Pattern 2: .gitignore with .gitkeep Preservation

**What:** Gitignore the entire `packages/web/lib/api/generated/` directory except the `.gitkeep` sentinel. The `.gitkeep` keeps the directory present in git for Turborepo's `outputs` declaration.

**Example (add to root `.gitignore`):**
```gitignore
# Generated API files — always regenerated from spec in CI and pre-push
packages/web/lib/api/generated/
!packages/web/lib/api/generated/.gitkeep
```

**Why this works:** Git processes `.gitignore` negation patterns correctly — `!` overrides a preceding exclusion for that specific file.

**Note on current state:** Currently only `packages/web/lib/api/generated/.gitkeep` is tracked (confirmed by `git ls-files`). The generated files (hundreds of `.ts` files in subdirectories) are already NOT tracked (they show as empty output from `git ls-files --others --exclude-standard`). This means they are already effectively untracked — likely due to an existing `.gitignore` rule or never having been `git add`-ed. Verify this before writing the `.gitignore` entry. The `.gitignore` addition is still needed to make the exclusion explicit and enforced.

### Pattern 3: Zod Schema Validation Tests

**What:** Parse a fixture API response (or a constructed object) through the generated Zod schema to verify the schema matches the actual response shape.

**Test file location:** `packages/web/tests/zod-validation.test.ts`

**Key insight:** The generated Zod schemas in `decodedApi.zod.ts` use `zod.object({...})` directly — they are not wrapped in `.strict()` by default. This means extra fields in the response pass through silently. For TEST-01's purpose ("응답 shape mismatch가 런타임 에러 대신 Zod 에러로 포착"), `safeParse` is the correct test approach:

```typescript
// Source: packages/web/lib/api/generated/zod/decodedApi.zod.ts
import { describe, test, expect } from 'vitest';
import { AdminListBadgesResponse } from '@/lib/api/generated/zod/decodedApi.zod';

describe('Zod Schema: AdminListBadgesResponse', () => {
  test('valid response passes parse', () => {
    const fixture = {
      data: [],
      pagination: {
        current_page: 1,
        per_page: 50,
        total_items: 0,
        total_pages: 0,
      },
    };
    const result = AdminListBadgesResponse.safeParse(fixture);
    expect(result.success).toBe(true);
  });

  test('missing required field fails parse with Zod error, not runtime error', () => {
    const bad = { data: [] }; // missing pagination
    const result = AdminListBadgesResponse.safeParse(bad);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].code).toBe('invalid_type');
    }
  });
});
```

**Important constraint:** TEST-01 says tests validate against "실제 API 응답" (real API responses). In CI without a running backend, fixtures are the correct approach. Document this clearly: tests use static fixtures that match the OpenAPI spec shape. Real integration tests requiring a live server are out of scope (Out of Scope list in REQUIREMENTS.md includes MSW-01).

### Pattern 4: CLAUDE.md Generated Code Section

**What:** Add a section to root `CLAUDE.md` that tells Claude Code (and developers) not to manually edit generated files.

**Where:** Root `CLAUDE.md` has a `<!-- MANUAL ADDITIONS START -->` comment block at the bottom — add the generated code rules there, or add a new top-level section before that block.

```markdown
## Generated API Code (packages/web/lib/api/generated/)

- **NEVER manually edit** files in `packages/web/lib/api/generated/`
- All files are auto-generated by Orval from `packages/api-server/openapi.json`
- To regenerate: `cd packages/web && bun run generate:api`
- Changes to generated code belong in `orval.config.ts` or the mutator at `lib/api/mutator/custom-instance.ts`
- The `generated/` directory is gitignored — CI always regenerates from spec
```

### Pattern 5: Cursor / Code Reviewer Rules for Generated Files

**What:** Update `.cursor/rules/monorepo.mdc` to skip style enforcement on generated files and flag any PR diff that includes edits to `lib/api/generated/`.

**Key rules to add:**
- Exclude `**/lib/api/generated/**` from style/lint feedback
- Warn if a PR diff contains changes to `lib/api/generated/` (these should never appear in PRs once .gitignore is in place)
- Check PR diffs for changes to `orval.config.ts` — these should trigger a note to verify `bun run generate:api` was run

### Anti-Patterns to Avoid

- **Running git diff --cached instead of git diff:** `--cached` compares staged vs HEAD, not working tree. Since generated files are being gitignored, use working tree comparison.
- **Adding .gitignore to packages/web/ instead of root:** The root `.gitignore` applies to all paths. A package-level `.gitignore` could conflict with Turborepo's file-watching.
- **Strict mode Zod schemas in generated code:** REQUIREMENTS.md Out of Scope explicitly lists "Zod strict mode" as future v10+. Use default (non-strict) parse in tests.
- **Committing vitest.config.ts to packages/web without checking for conflict with playwright.config.ts:** Both are test runners but serve different purposes. Vitest handles unit/integration, Playwright handles E2E. They coexist.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Spec drift detection | Custom file hash comparison script | `bun run generate:api && git diff` | git diff is battle-tested; handles binary, whitespace, encoding correctly |
| Generated file protection | Custom Claude Code tool or file watcher | CLAUDE.md rules + `.gitignore` | Agent instruction files are the standard mechanism |
| Zod test fixtures | Mock server or live API calls | Static TypeScript objects matching schema | No test infrastructure for live backend; MSW-01 is explicitly future scope |
| Cross-package CI trigger | Custom webhook | Document manual procedure (CI-04) | No GitHub Actions CI workflow exists; automated cross-repo triggers require infrastructure not in scope |

**Key insight:** The most valuable CI-02 protection is already in place structurally — Turborepo runs `generate:api` before every `build` and `typecheck`. The pre-push hook enforces this locally. The remaining work is adding the explicit `bun run generate:api` call to pre-push.sh and updating the gitignore.

## Common Pitfalls

### Pitfall 1: Generated Files Already Partially Ignored
**What goes wrong:** Developer adds gitignore rule and gets confused why some files are tracked and some aren't.
**Why it happens:** Currently, only `.gitkeep` is tracked. The generated `.ts` files (hundreds of them) are NOT in git — confirmed via `git ls-files`. They may already be excluded by an implicit rule or were never staged.
**How to avoid:** Run `git ls-files packages/web/lib/api/generated/` before and after adding the `.gitignore` entry to verify the delta. The expected state: only `.gitkeep` remains tracked.
**Warning signs:** `git status` showing generated files as modified after adding `.gitignore`.

### Pitfall 2: pre-push.sh Runs from packages/web, git diff Needs Repo Root Path
**What goes wrong:** `git diff --exit-code packages/web/lib/api/generated/` fails when run from inside `packages/web/` because the path doesn't resolve from that working directory.
**Why it happens:** `pre-push.sh` does `cd "$SCRIPT_DIR/.."` (resolves to `packages/web/`), but `git diff` path args are relative to the repo root.
**How to avoid:** Use `git diff --exit-code -- lib/api/generated/` (path relative to `packages/web/`) OR use the `REPO_ROOT` variable and absolute path.
**Warning signs:** `git diff` returns exit 0 even after changing the spec.

### Pitfall 3: Vitest Config Conflicts with Next.js Module Resolution
**What goes wrong:** Vitest can't resolve `@/lib/api/...` path aliases from `tsconfig.json`.
**Why it happens:** Vitest doesn't read `tsconfig.json` path aliases by default; they need to be explicitly configured in `vitest.config.ts`.
**How to avoid:** Add `resolve.alias` to `vitest.config.ts` matching the `@/*` → workspace root pattern from `tsconfig.json`.
**Warning signs:** `Cannot find module '@/lib/api/generated/zod/decodedApi.zod'` errors.

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // Zod tests don't need DOM
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

### Pitfall 4: Orval generate:api Reads Spec from Relative Path
**What goes wrong:** `bun run generate:api` in pre-push.sh fails because the spec file `../api-server/openapi.json` isn't present (backend not checked out, or wrong CWD).
**Why it happens:** `orval.config.ts` uses `input.target: "../api-server/openapi.json"` — relative to `packages/web/`. This requires the backend Rust workspace to be present as a sibling directory.
**How to avoid:** In pre-push.sh, check if the spec file exists before running generate; emit a clear error if missing. Do NOT make generation conditional — if the spec is missing, the developer needs to know.
**Warning signs:** `ENOENT: no such file or directory, open '../api-server/openapi.json'` during pre-push.

### Pitfall 5: Zod Tests Import Named Exports (Not Default Export)
**What goes wrong:** Zod test file can't import schemas because the generated file doesn't have a default export.
**Why it happens:** `decodedApi.zod.ts` uses named exports for each schema (`export const AdminListBadgesResponse = zod.object({...})`).
**How to avoid:** Always use named imports in test files: `import { AdminListBadgesResponse } from '...'`.

### Pitfall 6: .gitkeep Negation Pattern Order in .gitignore
**What goes wrong:** `.gitkeep` gets excluded along with everything else in the directory.
**Why it happens:** `.gitignore` negation only works when the negation pattern comes AFTER the exclusion pattern.
**How to avoid:** Write exclusion first, then negation:
```gitignore
packages/web/lib/api/generated/
!packages/web/lib/api/generated/.gitkeep
```

## Code Examples

### pre-push.sh Addition (CI-02)

```bash
# Add immediately after `cd "$SCRIPT_DIR/.."` in packages/web/scripts/pre-push.sh
echo "=== 0. API 스펙 Drift 검사 ==="
if [ -f "../api-server/openapi.json" ]; then
  bun run generate:api
  echo "=== 0. API 재생성 완료 — TypeScript 검사로 변경 확인 ==="
else
  echo "=== 0. openapi.json 없음 — 생성 건너뜀 (api-server 디렉터리 필요) ==="
fi
```

Note: After .gitignore is added, the TypeScript check (step 3) is the actual drift gate — if the spec changed and generated types are different, TypeScript will fail. The explicit `generate:api` call ensures the on-disk generated files are fresh before typecheck runs.

### .gitignore Addition (CI-03)

```gitignore
# Generated API files — regenerated from OpenAPI spec in every build/CI
# DO NOT commit generated files — run `bun run generate:api` to regenerate
packages/web/lib/api/generated/
!packages/web/lib/api/generated/.gitkeep
```

### vitest.config.ts for Zod Tests (TEST-01)

```typescript
// packages/web/vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

### package.json test script addition

```json
{
  "scripts": {
    "test:unit": "vitest run",
    "test:unit:watch": "vitest"
  }
}
```

### Zod Validation Test Template (TEST-01)

```typescript
// packages/web/tests/zod-validation.test.ts
import { describe, test, expect } from 'vitest';
import {
  AdminListBadgesResponse,
  GetMyBadgesResponse,
  GetUserProfileResponse,
  HealthCheckResponse,
} from '@/lib/api/generated/zod/decodedApi.zod';

// Strategy: Use .safeParse() — catches shape mismatches as ZodError instead of runtime crashes

describe('Zod Schema Validation — AdminListBadgesResponse', () => {
  test('valid response shape passes', () => {
    const fixture = {
      data: [
        {
          created_at: '2026-01-01T00:00:00Z',
          criteria: { target: null, threshold: 10, type: 'count' },
          description: null,
          icon_url: null,
          id: '00000000-0000-0000-0000-000000000000',
          name: 'Test Badge',
          rarity: 'common',
          type: 'achievement',
        },
      ],
      pagination: { current_page: 1, per_page: 50, total_items: 1, total_pages: 1 },
    };
    expect(AdminListBadgesResponse.safeParse(fixture).success).toBe(true);
  });

  test('missing required field yields ZodError, not TypeError', () => {
    const bad = { data: [] }; // pagination missing
    const result = AdminListBadgesResponse.safeParse(bad);
    expect(result.success).toBe(false);
    if (!result.success) {
      // Confirms Zod catches it — not a runtime TypeError from undefined access
      expect(result.error).toBeDefined();
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  test('wrong field type yields ZodError', () => {
    const bad = {
      data: [],
      pagination: { current_page: 'one', per_page: 50, total_items: 0, total_pages: 0 },
    };
    const result = AdminListBadgesResponse.safeParse(bad);
    expect(result.success).toBe(false);
  });
});
```

### CLAUDE.md Section to Add (TOOL-02)

Add after the `## Important notes` section in `CLAUDE.md`:

```markdown
## Generated API Code

> `packages/web/lib/api/generated/` is auto-generated. NEVER manually edit these files.

| Rule | Detail |
|------|--------|
| Source of truth | `packages/api-server/openapi.json` (Rust backend) |
| Generator | Orval 8.5.3 — config: `packages/web/orval.config.ts` |
| Regenerate | `cd packages/web && bun run generate:api` |
| Git status | Gitignored — never committed, always regenerated |
| Extend behavior | Edit `lib/api/mutator/custom-instance.ts` or `orval.config.ts` — not generated files |
| Zod schemas | `lib/api/generated/zod/decodedApi.zod.ts` — single file, all endpoint schemas |
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual API files (`lib/api/*.ts`) | Orval-generated hooks | Phase 39-42 (v9.0) | Type-safe API layer from OpenAPI spec |
| Tracking generated files in git | .gitignore + CI regeneration | Phase 43 (now) | Eliminates merge conflicts on generated files |
| No unit test runner | Vitest for schema validation | Phase 43 (now) | Enables TEST-01 without full E2E setup |
| CLAUDE.md with no generated-code rules | CLAUDE.md with explicit section | Phase 43 (now) | Prevents agent from editing generated files |

**Deprecated/outdated:**
- `packages/web/lib/api/client.ts`: Replaced by `custom-instance.ts` mutator in Phase 40 — verify it's deleted
- Manual fetch wrappers in `lib/api/*.ts`: All deleted in Phase 42. Only valid files: `index.ts` (barrel), `mutation-types.ts` (manual types for uploads), `mutator/`, `adapters/`, `generated/`

## Open Questions

1. **Does `bun run generate:api` in pre-push require backend to be running?**
   - What we know: Orval reads a static `openapi.json` file, NOT a live server URL. The config uses `input.target: "../api-server/openapi.json"` (a file path, not a URL).
   - What's unclear: Is `../api-server/openapi.json` always present in the developer's checkout? The backend workspace is outside bun workspaces but is in the same monorepo.
   - Recommendation: Add a file-existence check in pre-push.sh; skip generation with a warning if the spec file is missing.

2. **CI-04: What triggers frontend regeneration when backend spec changes?**
   - What we know: No GitHub Actions CI workflow exists for the frontend beyond Telegram notification. There is no automated cross-repo/cross-package trigger.
   - What's unclear: Whether to build a GitHub Actions workflow (CI-04's requirement) or just document the manual process.
   - Recommendation: REQUIREMENTS.md says "trigger 프로세스가 문서화된다 (자동화 또는 수동 절차)". Document as manual: when backend OpenAPI spec changes, open a PR in the frontend to run `generate:api` and update consumers. This is sufficient for Phase 43 scope.

3. **Vitest vs Playwright for Zod tests?**
   - What we know: Playwright is installed and used for visual QA (`tests/visual-qa.spec.ts`). Vitest is not installed.
   - What's unclear: Whether to add Zod tests to the Playwright test suite (possible but semantically wrong) or install Vitest.
   - Recommendation: Install Vitest. Zod schema tests are pure unit tests with no DOM/browser dependency. Using Playwright for them would be wrong semantically and slower.

## Validation Architecture

> `workflow.nyquist_validation` is not set in `.planning/config.json` — treat as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (not yet installed — Wave 0 gap) |
| Config file | `packages/web/vitest.config.ts` (Wave 0 gap) |
| Quick run command | `cd packages/web && bun run test:unit` |
| Full suite command | `cd packages/web && bun run test:unit` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CI-01 | generate:api runs before build | manual | `cd packages/web && bun run generate:api && bun run build` | ✅ (turbo.json wired) |
| CI-02 | pre-push.sh blocks push when spec drifts | manual | `bash packages/web/scripts/pre-push.sh` | ❌ Wave 0: add generate step |
| CI-03 | generated/ files not tracked in git | manual | `git ls-files packages/web/lib/api/generated/` | ❌ Wave 0: add .gitignore entry |
| CI-04 | trigger process documented | manual-only | n/a — documentation artifact | ❌ Wave 0: write doc |
| CI-05 | rollback procedure documented | manual-only | n/a — documentation artifact | ❌ Wave 0: write doc |
| TEST-01 | Zod parse catches shape mismatch | unit | `cd packages/web && bun run test:unit` | ❌ Wave 0 |
| TOOL-01 | warning when editing generated/ | manual-only | n/a — CLAUDE.md instruction | ❌ Wave 0: add CLAUDE.md section |
| TOOL-02 | CLAUDE.md documents generated code rules | manual-only | n/a — documentation artifact | ❌ Wave 0 |
| TOOL-03 | code reviewer skips generated file style | manual-only | n/a — .cursor/rules update | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `cd packages/web && bun run test:unit` (when TEST-01 files exist)
- **Per wave merge:** `cd packages/web && bun run test:unit && bun run typecheck`
- **Phase gate:** All manual checks verified before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `packages/web/vitest.config.ts` — Vitest configuration with `@` alias resolution
- [ ] `packages/web/tests/zod-validation.test.ts` — Zod schema parse tests for TEST-01
- [ ] Add `"test:unit": "vitest run"` to `packages/web/package.json` scripts
- [ ] Install Vitest: `cd packages/web && bun add -D vitest @vitest/coverage-v8`

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `packages/web/scripts/pre-push.sh` — confirmed current state (no generate step)
- Direct codebase inspection: `scripts/git-pre-push.sh` — confirmed monorepo hook chain
- Direct codebase inspection: `.githooks/pre-push` — confirmed hook registration pattern
- Direct codebase inspection: `turbo.json` — confirmed `generate:api` is build dependency
- Direct codebase inspection: `packages/web/orval.config.ts` — confirmed spec path and output config
- Direct codebase inspection: `packages/web/lib/api/generated/zod/decodedApi.zod.ts` — confirmed schema shape, named exports, 2200-line single file
- Direct codebase inspection: `.gitignore` (root) — confirmed no generated/ exclusion
- Direct codebase inspection: `git ls-files` — confirmed only `.gitkeep` is tracked

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` — requirements text and out-of-scope list
- `.planning/codebase/TESTING.md` — confirms no unit test runner installed; Vitest recommended pattern
- `.planning/STATE.md` — v9.0 decisions, constraints

### Tertiary (LOW confidence)
- None — all findings are from direct codebase inspection

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed except vitest; versions confirmed from package.json
- Architecture: HIGH — pre-push.sh, gitignore, and CLAUDE.md patterns verified against actual files
- Pitfalls: HIGH — derived from direct inspection of actual file content and git state
- Test patterns: MEDIUM — vitest config is standard but needs validation against Next.js module resolution

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable domain — git hooks, gitignore, Zod are not fast-moving)
