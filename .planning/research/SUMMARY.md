# Project Research Summary

**Project:** decoded-app v8.0 — Monorepo Consolidation & Bun Migration
**Domain:** Mixed-language monorepo (JS/TS + Rust/Axum) consolidation with package manager migration
**Researched:** 2026-03-22
**Confidence:** MEDIUM-HIGH overall (core patterns verified from official sources; bun+Turborepo edge cases have known active bugs)

---

## Executive Summary

This milestone consolidates a separately-maintained Rust/Axum backend into the existing decoded-app JS monorepo, simultaneously migrating from Yarn 4 to bun as the package manager, and introducing Turborepo for unified build orchestration. The end state is a single repository where `bunx turbo dev` starts both the Next.js frontend and the Rust backend concurrently, with path-based CI that only rebuilds affected packages. The current JS stack (Next.js 16, React 18, TypeScript 5.9, Supabase, Zustand, React Query, GSAP) is unchanged — only the tooling layer changes.

The recommended approach follows a strict sequencing: git subtree merge first (before any tooling changes), then Yarn-to-bun lockfile migration, then Turborepo configuration, then Docker/CI unification. This order matters because each step depends on the previous: Turborepo requires knowing the package manager, and Docker CI requires knowing the final build commands. The critical architectural constraint is that the Rust backend (`packages/api-server/`) must remain outside bun's `workspaces` array — a thin `package.json` wrapper makes it visible to Turborepo without confusing bun's dependency resolver.

The primary risks are: (1) the Yarn 4 Berry lockfile has no direct migration path to bun and requires a pnpm intermediary, which can silently drift package versions; (2) `turbo prune --docker` is currently broken with bun (active GitHub issues) and must be avoided; (3) GSAP Club private registry authentication has a known bun bug requiring a project-level `bunfig.toml` fix. None of these risks are blockers, but each has a specific mitigation that must be applied proactively rather than reactively.

---

## Key Findings

### Recommended Stack

The existing JS stack is fully preserved. New additions are minimal and focused on tooling:

**Core technologies added:**

- **bun 1.3.11**: Replaces Yarn 4 as package manager and JS runtime — 28x faster installs, native workspace support, text-format `bun.lock` that is git-diffable. Critical: Yarn 4 Berry lockfile requires pnpm as an intermediary for migration.
- **Turborepo 2.8.x**: Build orchestration and task caching across JS and Rust packages. Turborepo officially supports bun. Backend participates via a thin `package.json` wrapper that exposes `cargo build/test/dev` as npm scripts.
- **git subtree (built-in)**: Merges the Rust backend repo into `packages/api-server/` with full commit history. Preferred over git submodules: no detached HEAD, no extra clone steps, upstream sync via `git subtree pull`.
- **cargo-watch 8.4.0**: Rust hot-reload during development (`cargo watch -x run`). Equivalent of HMR for the Axum server.
- **concurrently 9.x**: Runs Next.js dev server and Rust backend concurrently from a single root `bun dev` command.

**Version compatibility confirmed:**

- bun@1.3.11 + Turborepo 2.8.x: fully compatible
- bun@1.3.11 + Next.js 16: compatible
- Turborepo 2.8.x + Rust via package.json wrapper: confirmed working pattern

### Expected Features

**Must have (P1 — required for v8.0 milestone):**

- git subtree merge with full Rust commit history preserved in `packages/api-server/`
- Single `bunx turbo dev` starts both Next.js and Rust backend concurrently
- Yarn 4 to bun lockfile migration (yarn.lock deleted, bun.lock committed)
- Root `turbo.json` with build/dev/lint task graph covering all packages
- Shared environment variable management (per-package `.env.local`, not a single root file)
- Docker Compose unification (web + backend + Postgres + Meilisearch, single `docker compose up`)

**Should have (P2 — add after P1 is stable):**

- CI/CD path-based change detection (separate GitHub Actions workflows per language)
- Turborepo remote caching via Vercel Remote Cache (saves 2-4 min per CI run)
- cargo-watch for Rust hot reload in dev (native, not Docker-based)
- `actions/cache` for Rust `target/` directory in backend CI workflow
- `.nvmrc` / `rust-toolchain.toml` toolchain pinning

**Defer (P3 — separate milestone):**

- OpenAPI to TypeScript type generation (`openapi-typescript` from backend's existing spec) — high long-term value but requires OpenAPI spec stabilization and `packages/shared` structure agreement
- Rust-native CI caching with `sccache`

### Architecture Approach

The monorepo follows a clear dual-workspace model: bun manages JS packages (`packages/web`, `packages/shared`, `packages/mobile`); Cargo manages the Rust workspace (`packages/api-server/Cargo.toml`) independently. The two systems never merge — Turborepo bridges them by treating the backend's thin `package.json` as an entry point for task orchestration without adding it to bun's `workspaces`.

**Major components:**

1. **Root `package.json`**: bun workspace declaration listing only JS packages explicitly (not a glob — prevents accidental backend inclusion)
2. **`turbo.json`**: Task dependency graph with `cache: false` on all backend tasks (Turborepo cannot hash Cargo inputs intelligently; Cargo's own incremental compilation handles Rust caching)
3. **`packages/api-server/package.json`**: Thin Turborepo adapter wrapping `cargo build`, `cargo dev`, `cargo test`, `cargo clippy` as npm scripts
4. **`packages/web/.env.local`**: Next.js env vars (not monorepo root — Next.js resolves from its own CWD)
5. **`docker-compose.yml` (root)**: Backend + Postgres + Meilisearch for dev/staging; backend dev script invokes Docker so frontend engineers don't need Rust installed locally
6. **`.github/workflows/backend-ci.yml` + `frontend-ci.yml`**: Separate CI workflows with path-based triggers to avoid running Rust toolchain on every frontend PR

**Build order (Turborepo-resolved):**

- Phase 1 (parallel): `packages/shared#build` + `packages/api-server#build`
- Phase 2 (parallel, after shared): `packages/web#build` + `packages/mobile#build`

### Critical Pitfalls

1. **Yarn 4 Berry lockfile has no direct bun migration path** — use pnpm as intermediary (`pnpm import` then `bun install` then delete pnpm-lock.yaml). After migration, diff key package versions against old lockfile to catch silent version drift. Address in Phase 1.

2. **`turbo prune --docker` corrupts `bun.lock`** — active bugs in Turborepo 2.5-2.6 (issues #10782, #11007, #11266). Never use `turbo prune` with bun until upstream fix is confirmed. Use full `COPY . .` + `bun install --frozen-lockfile` in Dockerfiles instead. Address in Phase 4.

3. **git subtree merge strategy must be consistent** — choose squash or no-squash on initial `git subtree add` and apply the same flag on all subsequent `git subtree pull` calls. Mixing them causes irreconcilable conflicts. Use a dedicated feature branch for the merge; verify file tree before merging to main. Address in Phase 2.

4. **GSAP Club private registry authentication breaks under bun** — bun bug (#9804) causes token from global `bunfig.toml` to be silently ignored. Fix: use project-level `bunfig.toml` with `[install.scopes]` and `$GSAP_TOKEN` env var reference. Must verify before declaring Phase 1 complete.

5. **Turborepo cache invalidation misses Cargo.lock changes** — explicitly list `src/**/*.rs`, `Cargo.toml`, `Cargo.lock`, and `migrations/**/*.sql` in backend task `inputs` in `turbo.json`. Validate cache invalidation manually after setup. Address in Phase 3.

6. **Backend pre-push hooks and justfile break after subtree merge** — backend's `.git/hooks/` is absorbed into the monorepo `.git/`. Hooks silently stop running. Re-register via lefthook or husky at monorepo root, updating hook scripts to `cd packages/api-server && cargo test`. Address immediately after Phase 2.

7. **Expo Metro cannot resolve bun's semi-isolated transitive deps** — add `publicHoistPattern = ["*"]` (or scoped pattern) to `bunfig.toml` to force hoisting. Verify Expo builds under bun before Phase 2. Address in Phase 1.

---

## Implications for Roadmap

Based on the dependency graph discovered in research, the migration must follow a strict sequential order for the first 3 phases. Phase 4 can partially overlap Phase 3.

### Phase 1: Package Manager Migration (Yarn 4 to bun)

**Rationale:** All subsequent phases depend on bun being the established package manager. Turborepo reads `packageManager` from `package.json` to determine lockfile semantics. The Expo Metro issue must be confirmed working before adding more complexity.

**Delivers:** `bun install` works across all JS workspaces; `bun.lock` committed; `yarn.lock` and `.yarnrc.yml` deleted; GSAP Club registry working; Expo Metro working.

**Addresses:** Yarn-to-bun migration (P1), GSAP private registry fix (critical blocker), Expo/Metro compatibility fix.

**Must avoid:**

- Running `bun install` before deleting `yarn.lock` (silently re-resolves all deps to latest versions)
- Adding `packages/api-server` to bun workspaces glob
- Keeping both `yarn.lock` and `bun.lock` simultaneously (CI confusion)
- Using `npm` or `npx` after migration (generates `package-lock.json`, breaks `bun.lock` consistency)

**Research flag:** Standard pattern — no additional research needed. Official bun docs cover all steps. GSAP fix is well-documented in PITFALLS.md.

---

### Phase 2: Backend Repo Merge (git subtree)

**Rationale:** Backend code must exist in `packages/api-server/` before Turborepo can be configured to orchestrate it. This is the only irreversible step — do it on a dedicated branch.

**Delivers:** `packages/api-server/` with full Rust source, Cargo.toml, existing Dockerfile. Commit history preserved (or squash-merged). File tree verified. Hooks re-registered.

**Addresses:** git subtree merge (P1 table stakes), Docker context path update, justfile path fix, pre-push hook re-registration.

**Must avoid:**

- Mixing squash and non-squash strategies across initial merge and future pulls
- Doing the subtree add directly on `main` — use `feat/backend-subtree-merge` branch
- Forgetting to update Docker `COPY` paths to `packages/api-server/` prefix
- Leaving pre-push hooks dead without re-registering

**Research flag:** Standard pattern — official GitHub docs and git subtree documentation are comprehensive. PITFALLS.md covers all known edge cases.

---

### Phase 3: Turborepo Integration + Unified Dev Environment

**Rationale:** With bun migrated and backend code in place, Turborepo can now be configured with the correct package manager and a real `packages/api-server/package.json` to orchestrate. The unified `bunx turbo dev` command is the primary deliverable of the entire milestone.

**Delivers:** `turbo.json` with build/dev/lint/test task graph; `packages/api-server/package.json` wrapper; `bunx turbo dev` starts Next.js + Rust concurrently; per-package `.env.local` convention established.

**Addresses:** Turborepo build orchestration (P1), single `bun dev` command (P1), shared env var management (P1), cargo-watch for Rust hot reload (P2).

**Must avoid:**

- Adding `packages/api-server` to bun `workspaces` (bun will try to install Cargo dependencies as npm packages)
- Using a glob `"packages/*"` in root `workspaces` (accidentally includes backend)
- Placing `.env.local` at monorepo root (Next.js won't find it; backend secrets leak to frontend)
- Caching `target/**` in Turborepo outputs (2-10 GB kills remote cache economics — cache only final binary)
- Setting backend `inputs` in `turbo.json` without explicitly including `Cargo.lock`

**Research flag:** The Turborepo + Rust integration pattern is community-established, not officially first-class. Verify task graph with `turbo ls` and `turbo run build --dry-run` before declaring phase complete. Cache invalidation validation is a required verification step.

---

### Phase 4: Docker Compose Unification + CI/CD

**Rationale:** Once the unified dev environment works locally, the Docker and CI layers need to be updated to match. Lower risk than earlier phases because they don't affect the core tooling decisions.

**Delivers:** Root `docker-compose.yml` with all services; path-based GitHub Actions workflows (separate `backend-ci.yml` and `frontend-ci.yml`); `actions/cache` for Cargo artifacts; Turborepo remote caching connected.

**Addresses:** Docker Compose unification (P1), CI/CD path-based change detection (P2), Turborepo remote caching (P2), `actions/cache` for Rust builds.

**Must avoid:**

- Using `turbo prune --docker` with bun (corrupts bun.lock — active upstream bug)
- Using a single CI job for both Rust and JS toolchains (wastes 2-3 min on every frontend-only PR)
- Omitting `fetch-depth: 0` in GitHub Actions (Turborepo `--affected` requires full git history)
- Caching entire `target/` directory — output only `target/release/decoded-backend`

**Research flag:** Standard CI patterns. `dorny/paths-filter`, `dtolnay/rust-toolchain`, and `oven-sh/setup-bun` are all official, actively maintained. The `turbo prune` bug is the main gotcha — documented in PITFALLS.md with workaround.

---

### Phase 5: Developer Experience Polish

**Rationale:** After the core migration is stable and validated, add quality-of-life improvements that reduce friction for the team.

**Delivers:** `rust-toolchain.toml` pinning; Makefile or `just` cross-language task shortcuts (`just test-all`, `just lint`); `.bun-version` file; updated documentation.

**Addresses:** Toolchain pinning (P2), cross-language task convenience layer (P2).

**Research flag:** Standard patterns, no research needed.

---

### Phase Ordering Rationale

- **Phase 1 before Phase 2**: Turborepo reads `packageManager` from `package.json` — setting up `turbo.json` with Yarn as the manager and then migrating to bun later causes ambiguous CI behavior and requires updating turbo config twice.
- **Phase 2 before Phase 3**: `packages/api-server/package.json` wrapper cannot be written until the Cargo source exists at `packages/api-server/`. Writing it against an empty directory produces a Turborepo task that always fails.
- **Phase 3 before Phase 4**: Docker and CI build commands are derived from the final `turbo.json` task structure. Locking in Docker before the task graph is finalized means updating Dockerfiles twice.
- **Phase 4 overlaps Phase 5**: DX polish can begin as Phase 4 CI work stabilizes — no hard dependency between them.

### Research Flags

**Needs deeper research during planning:**

- **Phase 3 (Turborepo + Rust cache behavior)**: The `@decoded/backend#build` cache input/output semantics are not officially documented by Turborepo for Cargo. Validate experimentally before declaring production-ready — run a manual cache invalidation test after Cargo.lock modification.
- **Phase 1 (Expo/Metro + bun compatibility)**: MEDIUM confidence. If `publicHoistPattern = ["*"]` causes unexpected dependency conflicts in `packages/web`, a scoped pattern is needed. Verify empirically in Phase 1 against actual Expo SDK version.

**Standard patterns (skip research-phase):**

- **Phase 2 (git subtree)**: Mechanics are well-documented in official GitHub docs. PITFALLS.md covers all known edge cases.
- **Phase 4 (GitHub Actions CI)**: `dorny/paths-filter`, `dtolnay/rust-toolchain`, `oven-sh/setup-bun` — all official, actively maintained, HIGH confidence.
- **Phase 5 (DX polish)**: Entirely standard tooling configuration with no novel integration points.

---

## Confidence Assessment

| Area         | Confidence | Notes                                                                                                                                                                                               |
| ------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stack        | HIGH       | bun 1.3.11 and Turborepo 2.8.x verified from official blogs; migration path verified from GitHub issues (pnpm intermediary is community workaround, not official tool)                              |
| Features     | MEDIUM     | Turborepo multi-language HIGH (official docs); bun+Turborepo prune is a KNOWN ACTIVE BUG (do not use); git subtree HIGH; Expo/Metro MEDIUM (active bun bug #25870)                                  |
| Architecture | MEDIUM     | Dual workspace pattern (bun JS + Cargo Rust) is community-established via multiple sources; Turborepo native Rust support is an open RFC (#683) — wrapper pattern is the only viable approach today |
| Pitfalls     | HIGH       | git subtree and bun lockfile issues verified from official sources and firsthand GitHub issue reports; GSAP registry bug confirmed in bun issue #9804                                               |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Yarn 4 Berry lockfile version drift**: After `pnpm import` + `bun install`, diff key package versions against the old lockfile. No automated tool exists for this — it is a manual verification step. Pin any drifted packages before Phase 2 begins.
- **Turborepo `--affected` baseline on first adoption**: On first `turbo run build --affected` invocation, there is no prior baseline so it rebuilds everything. This is expected behavior. After the first full build populates the remote cache, subsequent `--affected` runs skip unchanged packages.
- **`turbo prune --docker` resolution timeline**: Active bun.lock corruption bugs (#10782, #11007) remain open as of March 2026. Monitor Turborepo release notes before enabling pruned Docker builds. Current full-COPY workaround is stable.
- **Expo mobile package bun compatibility**: MEDIUM confidence only. Verify empirically in Phase 1 — `publicHoistPattern = ["*"]` may no longer be needed if bun fixed the Metro resolution issue in a later patch.

---

## Sources

### Primary (HIGH confidence)

- https://bun.com/blog/bun-v1.3.11 — bun 1.3.11 official release notes
- https://bun.com/docs/pm/workspaces — bun workspaces documentation
- https://turborepo.dev/blog/turbo-2-7 — Turborepo 2.7 with bun support confirmation
- https://turborepo.dev/docs/reference/configuration — turbo.json globalEnv, persistent, cache options
- https://turborepo.dev/docs/crafting-your-repository/constructing-ci — GitHub Actions CI with --affected
- https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository — workspace requirements
- https://turborepo.dev/docs/crafting-your-repository/using-environment-variables — globalEnv, passThroughEnv
- https://turborepo.dev/blog/turbo-2-6 — Turborepo 2.6 bun lockfile stable support
- https://crates.io/crates/cargo-watch — cargo-watch 8.4.0 current version
- https://docs.github.com/en/get-started/using-git/about-git-subtree-merges — official git subtree documentation
- https://github.com/dorny/paths-filter — GitHub Actions path filtering (widely adopted, actively maintained)

### Secondary (MEDIUM confidence)

- https://github.com/oven-sh/bun/issues/21356 — Yarn 4 Berry to bun.lock migration status and pnpm workaround
- https://github.com/vercel/turborepo/issues/683 — Turborepo Rust/non-JS backend RFC (open as of Oct 2025)
- https://github.com/vercel/turborepo/issues/11007 — turbo prune bun lockfile corruption (active bug)
- https://github.com/vercel/turborepo/issues/11266 — second turbo prune corruption confirmation
- https://github.com/spa5k/monorepo-typescript-rust — working TypeScript + Rust + Turborepo reference (pnpm, patterns transferable)
- https://medium.com/@andrejkurocenko/merging-multiple-repositories-into-a-monorepo-using-git-subtree-without-losing-history-0c019046498e — git subtree merge pattern
- https://socket.dev/blog/bun-1-2-19-adds-isolated-installs-for-better-monorepo-support — bun isolated installs for monorepos
- https://www.fgbyte.com/blog/02-bun-turborepo-hell/ — practitioner experience with bun+Turborepo edge cases

### Tertiary (LOW confidence, corroborating)

- https://www.pkgpulse.com/blog/best-monorepo-tools-2026 — ecosystem overview (blog, corroborates Turborepo recommendation)
- https://dev.to/pockit_tools/github-actions-in-2026-the-complete-guide-to-monorepo-cicd-and-self-hosted-runners-1jop — GitHub Actions monorepo CI patterns

---

_Research completed: 2026-03-22_
_Ready for roadmap: yes_
