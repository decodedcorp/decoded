# Phase m10-01: Package Manager Migration - Research

**Researched:** 2026-03-22
**Domain:** Yarn 4 Berry to bun package manager migration in a JS monorepo (Next.js + Expo)
**Confidence:** HIGH

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Clean install strategy** — delete yarn.lock, run `bun install` fresh (no pnpm intermediary step)
- **Separate branch** — `feat/bun-migration`; branch delete = clean rollback
- **Dependency snapshot first** — `yarn list --json` before any change for version comparison
- **Explicit workspace list** — `["packages/web", "packages/shared", "packages/mobile"]`, NOT `"packages/*"` glob
- **bunfig.toml** — create at project root with node-modules linker + publicHoistPattern for Expo Metro
- **packageManager field** — `"bun@1.3.10"` (locally installed version, not 1.3.11)
- **Yarn artifact removal** — delete `.yarnrc.yml`, `.yarn/` directory entirely, `yarn.lock`
- **packages/mobile included** — Expo 54 migrated alongside web and shared
- **Documentation update** — CLAUDE.md + README yarn commands replaced with bun equivalents
- **package.json scripts** — NO changes needed (already bun-compatible)

### Claude's Discretion

- `bunfig.toml` specific configuration values
- `.gitignore` update scope
- Dependency version conflict resolution approach

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope. CI/CD changes deferred to m10-04.
</user_constraints>

---

<phase_requirements>

## Phase Requirements

| ID     | Description                                             | Research Support                                                                                     |
| ------ | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| PKG-01 | bun install succeeds for packages/web, shared, mobile   | bun workspace protocol `workspace:*` confirmed compatible; node-modules linker ensures compatibility |
| PKG-02 | Yarn artifacts removed (.yarnrc.yml, .yarn/, yarn.lock) | Clean file list confirmed: `.yarn/cache/`, `.yarn/install-state.gz`, `.yarnrc.yml`, `yarn.lock`      |
| PKG-03 | bun.lock generated and tracked in git                   | bun generates `bun.lock` (text JSONC format since v1.2) automatically on first `bun install`         |
| PKG-04 | `bun run dev` starts Next.js dev server                 | Root scripts use `yarn workspace` syntax — must update to `bun --filter` equivalents                 |
| PKG-05 | `bun run build` production build succeeds               | Same as PKG-04; scripts need updating; GSAP public npm confirmed (no private registry needed)        |

</phase_requirements>

---

## Summary

This phase replaces Yarn 4 Berry with bun 1.3.10 as the package manager for the entire JS monorepo (packages/web, packages/shared, packages/mobile). It is a clean infrastructure swap: application code does not change, only tooling configuration. The bun.lock file replaces yarn.lock and all Yarn-specific artifacts are removed.

The user has chosen a clean install strategy (delete yarn.lock, run `bun install` fresh) rather than the pnpm-intermediary migration path documented in the milestone PITFALLS.md. This is simpler but requires a mandatory pre-migration version snapshot (`yarn list --json`) and a post-migration version diff to catch any silent dependency drift. This is the most critical validation step of the phase.

Two non-trivial concerns exist for this specific project: (1) the root `package.json` scripts currently use `yarn workspace @decoded/web ...` syntax which must be updated to bun equivalents, and (2) packages/mobile (Expo 54) uses Metro bundler which has known issues with bun's semi-isolated node_modules — preemptive `bunfig.toml` configuration mitigates this.

**Primary recommendation:** Create the feature branch, snapshot dependencies, perform clean migration, update root scripts, create bunfig.toml with publicHoistPattern, verify all three packages install and build cleanly, then update docs.

---

## Standard Stack

### Core

| Library | Version | Purpose                      | Why Standard                                                                                        |
| ------- | ------- | ---------------------------- | --------------------------------------------------------------------------------------------------- |
| bun     | 1.3.10  | Package manager + JS runtime | User-pinned version; locally installed; official bun workspaces with `workspace:*` protocol support |

### Supporting Configuration Files

| File                | Purpose                                                 | When to Use                                             |
| ------------------- | ------------------------------------------------------- | ------------------------------------------------------- |
| `bunfig.toml`       | bun configuration (linker, hoisting, scopes)            | Required: node-modules linker + Expo publicHoistPattern |
| `.bun-version`      | Pin bun version for tooling                             | Optional but recommended for team consistency           |
| `.gitignore` update | Remove Yarn-specific entries, keep bun cache exclusions | Required during migration                               |

### Yarn Command Equivalents

| Old (Yarn 4)                         | New (bun)                              |
| ------------------------------------ | -------------------------------------- |
| `yarn install`                       | `bun install`                          |
| `yarn workspace @decoded/web dev`    | `bun run --filter @decoded/web dev`    |
| `yarn workspace @decoded/web build`  | `bun run --filter @decoded/web build`  |
| `yarn workspace @decoded/web lint`   | `bun run --filter @decoded/web lint`   |
| `yarn workspace @decoded/web format` | `bun run --filter @decoded/web format` |
| `yarn install --immutable`           | `bun install --frozen-lockfile`        |
| `yarn dlx <pkg>`                     | `bunx <pkg>`                           |
| `yarn add -D <pkg> -W`               | `bun add -D <pkg>` (at workspace root) |

**Version verification:** bun 1.3.10 is locally installed (confirmed). Latest release is 1.3.11. User decision pins to 1.3.10 — no conflict.

---

## Architecture Patterns

### Workspace Configuration (root package.json)

```json
{
  "name": "decoded-monorepo",
  "private": true,
  "workspaces": ["packages/web", "packages/shared", "packages/mobile"],
  "packageManager": "bun@1.3.10",
  "scripts": {
    "dev": "bun run --filter @decoded/web dev",
    "build": "bun run --filter @decoded/web build",
    "start": "bun run --filter @decoded/web start",
    "lint": "bun run --filter @decoded/web lint",
    "format": "bun run --filter @decoded/web format",
    "format:check": "bun run --filter @decoded/web format:check"
  },
  "dependencies": {
    "class-variance-authority": "^0.7.1"
  }
}
```

**Key change:** `"packages/*"` glob replaced with explicit list. Reason: packages/api-server (Rust) will be added in m10-02 and must NOT be a bun workspace member.

### bunfig.toml (project root)

```toml
# Source: bun docs - https://bun.sh/docs/runtime/bunfig
[install]
# Use node-modules linker for Next.js + Expo compatibility
# (matches existing Yarn 4 nodeLinker: node-modules behavior)
strategy = "hoisted"

# Force hoisting for Expo Metro bundler compatibility
# Metro cannot resolve packages under node_modules/.bun/ symlinks
# Source: bun issue #25870, Pitfall 5 in PITFALLS.md
publicHoistPattern = ["*"]
```

**Note on publicHoistPattern scope:** Starting with `["*"]` (full hoisting) matches Yarn 4's `nodeLinker: node-modules` behavior exactly. If package conflicts emerge after install, narrow to: `["react", "react-native", "@babel/*", "metro*", "expo*"]`

### .yarnrc.yml Peer Dep Extension — Must Replicate

The current `.yarnrc.yml` has a `packageExtensions` entry for `@tailwindcss/postcss`:

```yaml
packageExtensions:
  "@tailwindcss/postcss@*":
    peerDependencies:
      "tailwindcss": "*"
```

This Yarn-specific feature must be replicated in bun. The bun equivalent is in `bunfig.toml`:

```toml
[install.peer-dependencies]
# Replaces .yarnrc.yml packageExtensions
"@tailwindcss/postcss" = { peer = { tailwindcss = "*" } }
```

If bun does not support this peer extension format, the alternative is to add `tailwindcss` as a direct dependency in the package that needs it, or accept that bun may resolve peer deps differently.

### Migration Execution Order

```
1. Create branch: git checkout -b feat/bun-migration
2. Snapshot: yarn list --json > /tmp/yarn-deps-snapshot.json
3. Update root package.json:
   - workspaces: explicit list
   - packageManager: "bun@1.3.10"
   - scripts: yarn workspace → bun run --filter
4. Create bunfig.toml at project root
5. Delete Yarn artifacts:
   - rm .yarnrc.yml
   - rm -rf .yarn/
   - rm yarn.lock
6. Run: bun install
7. Verify bun.lock created
8. Diff versions: compare bun.lock with yarn-deps-snapshot.json
9. Pin any drifted packages in package.json
10. Test: bun run dev (Next.js at localhost:3000)
11. Test: bun run build (production build)
12. Update docs: CLAUDE.md + README
13. Update .gitignore
14. git add bun.lock + all changed files
15. Commit and push feat/bun-migration
```

### .gitignore Updates

Remove Yarn-specific entries, add bun entries:

```gitignore
# Remove these (Yarn-specific):
# .yarn/cache
# .yarn/unplugged
# .yarn/build-state.yml
# .yarn/install-state.gz

# Add these (bun):
# bun cache is in ~/.bun/install/cache (global, not project-level)
# No project-level bun cache to ignore

# Keep:
node_modules/
```

Note: `bun.lock` should NOT be in .gitignore — it must be committed (PKG-03).

---

## Don't Hand-Roll

| Problem                         | Don't Build                           | Use Instead                              | Why                                                                      |
| ------------------------------- | ------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| Workspace package filtering     | Custom shell scripts with find/grep   | `bun run --filter @decoded/web <script>` | bun's built-in workspace filter handles dependency ordering              |
| Lock file version freeze for CI | Custom lockfile comparison scripts    | `bun install --frozen-lockfile`          | bun's native frozen install fails fast if bun.lock is out of sync        |
| Expo Metro module resolution    | Custom Metro resolver config          | `bunfig.toml` publicHoistPattern         | bun's hoisting config is the correct fix; Metro config hacks are brittle |
| Peer dependency enforcement     | Manual package.json peer dep listings | `bunfig.toml` peer-dependency extensions | bun handles peer dep resolution natively with config                     |

**Key insight:** The entire migration is configuration changes, not code. Every "custom solution" impulse should be redirected to bun's documented configuration knobs.

---

## Common Pitfalls

### Pitfall 1: Silent Dependency Version Drift (Clean Install Risk)

**What goes wrong:** `bun install` on a directory with no existing `bun.lock` resolves ALL packages fresh from the registry at current-available versions. Packages with `^` semver ranges (which almost all packages in this project use) may resolve to newer minor/patch versions than what Yarn 4 had locked. This can break builds silently — a dependency bumped its API in a minor version.

**Why it happens:** The user has chosen clean install (no pnpm intermediary). This is the tradeoff: simpler migration path, but no lockfile inheritance.

**How to avoid:** The pre-migration `yarn list --json` snapshot is mandatory. After `bun install`, run a version comparison:

```bash
# Before migration (save snapshot)
yarn list --json > /tmp/yarn-deps-snapshot.json

# After migration (compare key packages)
bun pm ls --all 2>/dev/null | grep -E "next|react |@supabase|gsap|motion|zustand|@tanstack"
```

Manually verify these critical packages resolve to the same major.minor:

- `next` (16.0.7 — exact, should not drift)
- `react` / `react-dom` (18.3.x)
- `@supabase/supabase-js` (2.86.x)
- `gsap` (3.13.x)
- `motion` (12.23.x)
- `zustand` (4.5.x)
- `@tanstack/react-query` (5.90.x)

If drift detected: add exact version pin in the relevant `package.json` before proceeding.

**Warning signs:**

- Build errors referencing API changes in a package you didn't intend to upgrade
- TypeScript errors on packages that were previously clean
- `bun install` output shows `100+ packages added` when you expect the same count as before

### Pitfall 2: Root Scripts Still Use `yarn workspace` After Migration

**What goes wrong:** The current root `package.json` uses `"dev": "yarn workspace @decoded/web dev"`. After migration, running `bun run dev` from root will invoke `yarn workspace ...` — which either calls the system Yarn installation (if any) or fails with "command not found". The Next.js dev server never starts.

**Why it happens:** This is a manual step that is easy to forget. bun doesn't auto-translate Yarn script syntax.

**How to avoid:** Update root `package.json` scripts as part of step 3 in the migration sequence (before running `bun install`). Use `bun run --filter @decoded/web dev` syntax.

**Warning signs:** `bun run dev` fails with "yarn: command not found" or "workspace: unknown command"

### Pitfall 3: Expo Metro Cannot Resolve bun Semi-Isolated Transitive Deps

**What goes wrong:** bun's default install strategy places some transitive dependencies under `node_modules/.bun/` rather than fully hoisting them. Expo's Metro bundler resolves modules with a static algorithm that does not follow symlinks into `.bun/`. Result: `expo start` throws "Cannot find module 'X'" for packages that exist but are in the wrong location.

**Why it happens:** bun changed from fully hoisting (matching npm/yarn behavior) to semi-isolated installs. Expo SDK 54 has built-in monorepo support but relies on standard node_modules resolution paths.

**How to avoid:** `bunfig.toml` with `publicHoistPattern = ["*"]` forces full hoisting, matching Yarn 4's `nodeLinker: node-modules` behavior exactly. This is a preemptive fix — apply it before `bun install`, not after seeing the error.

**Warning signs:**

- `expo start` throws "Cannot find module" for a package in `node_modules/` (but only under `.bun/`)
- Error only appears after switching from yarn — the package existed before

### Pitfall 4: .yarn/ Directory Has Files That Must All Be Deleted

**What goes wrong:** Partial deletion of `.yarn/` leaves Yarn state files that can confuse subsequent tools. The directory contains `cache/` (zip files) and `install-state.gz`.

**How to avoid:** Use `rm -rf .yarn/` — remove the entire directory, not individual files. Verify it is gone:

```bash
ls .yarn/ 2>&1  # should show "No such file or directory"
```

**Warning signs:** After migration, `ls .yarn/` still shows content.

### Pitfall 5: bun.lock Not Committed / Added to .gitignore

**What goes wrong:** If `.gitignore` has a `*.lock` or `bun.lock` entry (sometimes added by IDE tooling), the bun.lock file is not tracked by git. CI with `--frozen-lockfile` will fail because the lockfile is absent.

**How to avoid:** After `bun install`, check `git status` to confirm `bun.lock` appears as an untracked file (not ignored). Explicitly add it: `git add bun.lock`.

**Warning signs:** `git status` shows `bun.lock` as "ignored" rather than "untracked"

---

## Code Examples

Verified patterns from official sources and project context:

### Root package.json (Final State)

```json
{
  "name": "decoded-monorepo",
  "private": true,
  "workspaces": ["packages/web", "packages/shared", "packages/mobile"],
  "packageManager": "bun@1.3.10",
  "scripts": {
    "dev": "bun run --filter @decoded/web dev",
    "build": "bun run --filter @decoded/web build",
    "start": "bun run --filter @decoded/web start",
    "lint": "bun run --filter @decoded/web lint",
    "format": "bun run --filter @decoded/web format",
    "format:check": "bun run --filter @decoded/web format:check"
  },
  "dependencies": {
    "class-variance-authority": "^0.7.1"
  }
}
```

### bunfig.toml (Complete)

```toml
# Source: https://bun.sh/docs/runtime/bunfig
[install]
strategy = "hoisted"
publicHoistPattern = ["*"]

# Peer dependency extension (replaces .yarnrc.yml packageExtensions)
# Enables @tailwindcss/postcss to accept tailwindcss as a peer dep
[install.peer-dependencies]
"@tailwindcss/postcss" = { peer = { tailwindcss = "*" } }
```

### Verify bun.lock Is Tracked After Migration

```bash
# After bun install:
git status bun.lock          # Should show "untracked" not "ignored"
git add bun.lock
git ls-files bun.lock        # Should show: bun.lock
```

### CI Frozen Install Command

```bash
# For any future CI workflow (m10-04 scope, but planner should know the syntax)
bun install --frozen-lockfile
```

### Verify Dev Server After Migration (PKG-04)

```bash
bun run dev
# Expected: Next.js server starts on localhost:3000
# Watch for: any "Cannot find module" errors (indicate version drift or hoisting issues)
```

### Verify Production Build After Migration (PKG-05)

```bash
bun run build
# Expected: Next.js build completes with no errors
# Watch for: TypeScript errors from drifted dep versions
```

---

## State of the Art

| Old Approach                             | Current Approach                        | When Changed  | Impact                                    |
| ---------------------------------------- | --------------------------------------- | ------------- | ----------------------------------------- |
| Yarn 4 Berry `yarn workspace X`          | `bun run --filter X`                    | bun migration | Root scripts must be updated              |
| `.yarnrc.yml` `nodeLinker: node-modules` | `bunfig.toml` `strategy = "hoisted"`    | bun migration | Equivalent behavior, different file       |
| `.yarnrc.yml` `packageExtensions`        | `bunfig.toml` peer-dep extensions       | bun migration | Replaces Yarn-specific peer dep injection |
| `yarn.lock` (YAML-like Berry format)     | `bun.lock` (JSONC text format)          | bun v1.2+     | Human-readable, git-diffable              |
| `.yarn/cache/` zip files                 | Global bun cache `~/.bun/install/cache` | bun migration | No project-level cache directory needed   |
| `yarn install --immutable`               | `bun install --frozen-lockfile`         | bun migration | Same semantics, different flag name       |

**Deprecated/outdated:**

- `.yarnrc.yml`: Yarn 4-specific, delete entirely
- `yarn.lock`: Berry format, not readable by bun, delete
- `.yarn/` directory: Yarn PnP cache and install state, delete entirely

---

## Open Questions

1. **bunfig.toml peer-dependency extension syntax**
   - What we know: bun supports `bunfig.toml` for configuration; `.yarnrc.yml` `packageExtensions` has no documented bun equivalent
   - What's unclear: Whether `[install.peer-dependencies]` is a valid bun config section, or if the `@tailwindcss/postcss` peer dep issue resolves itself under bun's native resolver
   - Recommendation: If `bunfig.toml` peer-dep extension is not supported, try `bun install` first without it — bun may resolve the peer dep automatically. If build fails with peer dep warnings, add `tailwindcss` as a direct devDependency in the affected package instead.

2. **packages/mobile Expo 54 + bun compatibility**
   - What we know: Expo 54 has built-in monorepo support; `publicHoistPattern = ["*"]` is the documented fix for Metro resolution issues; bun bug #25870 was reported Jan 2026
   - What's unclear: Whether bun 1.3.10 already fixed the Metro resolution issue in a patch (the bug was filed against an earlier version)
   - Recommendation: Apply `publicHoistPattern = ["*"]` preemptively. If Expo builds cleanly, no further action needed. If Metro errors occur despite hoisting, narrow `publicHoistPattern` to `["react*", "react-native*", "@babel/*", "metro*", "expo*"]`.

---

## Validation Architecture

> `workflow.nyquist_validation` is absent from config.json — treating as enabled.

### Test Framework

| Property           | Value                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------- |
| Framework          | Playwright 1.58.1 (existing)                                                             |
| Config file        | `packages/web/playwright.config.ts` (if exists) or via `package.json` test:visual script |
| Quick run command  | `bun run build` (compile-time validation)                                                |
| Full suite command | `bun run --filter @decoded/web test:visual`                                              |

### Phase Requirements → Test Map

| Req ID | Behavior                             | Test Type  | Automated Command                            | File Exists?                   |
| ------ | ------------------------------------ | ---------- | -------------------------------------------- | ------------------------------ |
| PKG-01 | bun install completes without errors | smoke      | `bun install 2>&1; echo "Exit: $?"`          | ❌ Wave 0 — run manually       |
| PKG-02 | Yarn artifacts absent from repo      | smoke      | `ls .yarnrc.yml .yarn/ yarn.lock 2>&1`       | ❌ Wave 0 — run manually       |
| PKG-03 | bun.lock exists and is git-tracked   | smoke      | `git ls-files bun.lock`                      | ❌ Wave 0 — run manually       |
| PKG-04 | Next.js dev server starts            | smoke      | `bun run dev` (manual verify localhost:3000) | ❌ Wave 0 — manual only        |
| PKG-05 | Production build succeeds            | unit/build | `bun run build`                              | ❌ Wave 0 — run as build check |

### Sampling Rate

- **Per task commit:** `bun install && bun run build`
- **Per wave merge:** `bun install --frozen-lockfile && bun run build && bun run lint`
- **Phase gate:** All 5 PKG requirements verified before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] No automated test files needed — all PKG requirements are infrastructure/smoke checks
- [ ] Verification script: manual checklist execution (install, artifact removal, lockfile, dev, build)
- [ ] Framework install: bun 1.3.10 already installed on system — no install step needed

_(All PKG requirements are infrastructure smoke checks, not unit tests. No new test files needed.)_

---

## Sources

### Primary (HIGH confidence)

- https://bun.sh/docs/install/workspaces — bun workspaces `workspace:*` protocol, `--filter` flag
- https://bun.sh/docs/runtime/bunfig — bunfig.toml configuration (strategy, publicHoistPattern)
- https://bun.sh/docs/cli/install — `bun install --frozen-lockfile` documentation
- Project `.planning/research/PITFALLS.md` — Pitfall 5 (Expo Metro), Pitfall 9 (GSAP registry)
- Project `.planning/research/STACK.md` — Migration path, command equivalents, workspace architecture

### Secondary (MEDIUM confidence)

- Project `.planning/research/SUMMARY.md` — Phase 1 must-avoids, version compatibility table
- https://github.com/oven-sh/bun/issues/25870 — Expo Metro + bun resolution issue (Jan 2026)
- https://github.com/oven-sh/bun/issues/9804 — GSAP private registry token bug (mitigated: GSAP confirmed as public npm in this project)

### Tertiary (LOW confidence)

- GSAP public npm confirmation: CONTEXT.md `<specifics>` — "GSAP은 공개 npm 패키지 사용 확인됨" — eliminates Pitfall 9 (private registry) entirely for this project

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — bun 1.3.10 locally installed, confirmed version; bunfig.toml syntax from official docs
- Architecture: HIGH — workspace protocol `workspace:*` is bun-native; explicit package list is the correct pattern; scripts are straightforward `yarn workspace` → `bun --filter` substitution
- Pitfalls: HIGH — all pitfalls derived from PITFALLS.md (milestone research) + project-specific observations (root scripts use `yarn workspace`, `.yarn/` contains specific files, `.yarnrc.yml` has packageExtensions)

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (bun 1.3.x stable; no major breaking changes expected)
