# OpenAPI Spec Change Process & Rollback Strategy

## When Backend Spec Changes (CI-04)

No automated cross-package CI trigger exists. When the backend team updates the OpenAPI spec:

### Process

1. **Backend updates spec**: Rust/Axum endpoint added/changed in `packages/api-server/`
2. **Export updated spec**: `cd packages/api-server && cargo run -- --export-openapi > openapi.json`
3. **Regenerate frontend hooks**: `cd packages/web && bun run generate:api`
4. **Check for breaking changes**: `cd packages/web && bun run typecheck`
   - If typecheck passes: the spec change is backward-compatible
   - If typecheck fails: update consumers (hooks, components) to match new types
5. **Run pre-push validation**: `bash packages/web/scripts/pre-push.sh`
6. **Commit and PR**: Commit consumer changes (NOT generated files -- they are gitignored)

### Detection Signals

| Signal | Meaning |
|--------|---------|
| `bun run typecheck` fails after `generate:api` | Spec changed in a breaking way |
| New hook appears in generated/ | New endpoint added |
| Hook params/return type changed | Endpoint signature changed |
| Hook disappears from generated/ | Endpoint removed or operationId renamed |

### Who Triggers

- Same developer if working across backend + frontend
- Backend developer notifies frontend developer via PR comment or Slack if separate
- Pre-push hook catches stale generation automatically

## Rollback Strategy (CI-05)

### During Migration (Phases 39-42, now complete)

The migration followed atomic per-endpoint rollback:
- Each phase migrated a domain (badges, posts, users, etc.)
- Each plan was a git commit boundary
- Rollback = `git revert` the plan's commit range

### Post-Migration (Phase 43+)

If a spec regeneration breaks the frontend:

1. **Immediate**: Revert to the last known-good `openapi.json`
   ```bash
   git checkout HEAD~1 -- packages/api-server/openapi.json
   cd packages/web && bun run generate:api
   bun run typecheck  # should pass now
   ```

2. **If generated hooks have new consumers**: Revert the consumer changes too
   ```bash
   git stash  # save work in progress
   git checkout HEAD~1 -- packages/api-server/openapi.json
   cd packages/web && bun run generate:api
   git stash pop  # restore WIP, resolve conflicts
   ```

3. **Nuclear option**: Reset to the branch point
   ```bash
   git log --oneline -10  # find the last stable commit
   git reset --soft <stable-commit>  # keep changes staged
   # Review what changed, selectively re-commit
   ```

### Pre-Push Safety Net

The pre-push hook (`packages/web/scripts/pre-push.sh`) runs:
1. Step 0: `bun run generate:api` (regenerates from current spec)
2. Step 1: ESLint
3. Step 2: Prettier
4. Step 3: TypeScript typecheck (catches spec drift)
5. Step 4: Build (optional, `RUN_FE_BUILD=1`)

If Step 3 fails after Step 0, the spec and consumers are out of sync. Fix consumers or revert the spec.

### Key Constraint

- Generated files are **gitignored** -- they are never committed
- Every developer and CI must run `bun run generate:api` to produce them
- The `openapi.json` file IS committed and is the source of truth
- Rollback always means reverting `openapi.json` + re-running generation
