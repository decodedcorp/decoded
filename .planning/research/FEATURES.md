# Feature Research

**Domain:** Mixed-language monorepo — JS + Rust consolidation with bun migration (v8.0)
**Researched:** 2026-03-22
**Confidence:** MEDIUM overall. Turborepo multi-language support HIGH (official docs confirmed). Bun + Turborepo prune MEDIUM (known lockfile bug as of late 2025, canary fix in progress). Git subtree mechanics HIGH (well-documented). CI path filtering HIGH (multiple sources agree).

---

## Feature Landscape

### Table Stakes (Users Expect These)

"Users" here are the development team — engineers expect these to work correctly in a merged monorepo. Missing any of these = the repo feels broken, not consolidated.

| Feature                                                    | Why Expected                                                                                                                                                                                         | Complexity | Notes                                                                                                                                                                                                                                                |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **git subtree merge with history preserved**               | Losing Rust backend commit history defeats the point of consolidation. 44 DB migrations + 19 domains need traceable provenance.                                                                      | LOW        | `git subtree add --prefix=packages/backend <remote> main` — no squash. History becomes part of monorepo log. Future upstream pulls possible via `git subtree pull`.                                                                                  |
| **Single root `bun dev` starts both frontend and backend** | Engineers expect `bun dev` at root to start the full stack. Requiring two terminal windows is friction that defeats unified workflow.                                                                | MEDIUM     | Turborepo `bun run dev` at root → concurrent `next dev` (packages/web) + `cargo watch -x run` (packages/backend). Rust process managed as a side process, not a bun script directly.                                                                 |
| **Shared environment variable management**                 | Frontend (Next.js) and backend (Axum) share secrets like DATABASE_URL, Supabase keys, API tokens. Duplicating them across multiple .env files causes drift and secret sync failures.                 | MEDIUM     | Root `.env` + per-package `.env.local` for package-specific overrides. Turborepo `globalEnv` in `turbo.json` for cache keying. Docker Compose `env_file` references root `.env`.                                                                     |
| **Turborepo build orchestration**                          | Engineers expect `bun run build` at root to build in correct dependency order: shared → web → backend (or independent). Without orchestration, builds run sequentially or fail on missing artifacts. | MEDIUM     | `turbo.json` defines `build` pipeline. Rust package gets minimal `package.json` wrapper with `"build": "cargo build --release"`. Turborepo caches `target/release/` outputs.                                                                         |
| **Docker Compose unification**                             | Backend already has Docker multi-env setup. Frontend has none. Unified Compose brings the full stack up with one command for staging/prod parity.                                                    | MEDIUM     | Root `docker-compose.yml` with services: `web` (Next.js), `backend` (Rust/Axum), `db` (Postgres). Backend Dockerfile uses `cargo-chef` for layer caching. Per-env override files (`docker-compose.staging.yml`).                                     |
| **CI/CD path-based change detection**                      | Without path filtering, every commit rebuilds and re-tests the entire monorepo including the Rust backend — CI times balloon from minutes to 10–20 minutes.                                          | MEDIUM     | GitHub Actions: `paths:` filter per workflow. `dorny/paths-filter` for dynamic detection. Turborepo `--filter='...[origin/main]'` for incremental task runs. Separate workflows for `packages/web`, `packages/backend`, `packages/shared`.           |
| **Yarn 4 → bun workspace migration**                       | Existing `package.json` workspaces must be understood by bun. `yarn.lock` → `bun.lock` conversion. All `yarn workspace @decoded/web` scripts become `bun run --filter @decoded/web`.                 | HIGH       | bun 1.2+ supports `bun workspaces`. `packageManager` field changes to `"bun@1.3.10"`. Scripts in root `package.json` updated. `yarn.lock` removed; `bun install` regenerates lockfile. Mobile package (Expo) must be verified for bun compatibility. |

---

### Differentiators (Competitive Advantage)

Features that make this consolidation meaningfully better than a naive "copy files" approach.

| Feature                                           | Value Proposition                                                                                                                                                                                                                  | Complexity | Notes                                                                                                                                                                                                                                        |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Turborepo remote caching**                      | Cache build artifacts (both JS and Rust) across CI runs and developer machines. Rust compilation is slow (~3–5 min cold). Remote cache eliminates cold rebuilds for unchanged code.                                                | MEDIUM     | Vercel Remote Cache (free tier available) or self-hosted. `turbo.json` `outputs` must include `target/release/` for Rust. `TURBO_TOKEN` + `TURBO_TEAM` env vars in CI. First run populates cache; subsequent runs skip compilation entirely. |
| **`just` or `Makefile` for cross-language tasks** | Turborepo orchestrates JS tasks. Rust tasks need `cargo`-native commands (`cargo test`, `cargo clippy`, `cargo fmt`). A `just` Justfile or root `Makefile` bridges the gap: `just test-all` runs both `bun test` and `cargo test`. | LOW        | `just` (Rust-based task runner) fits the Rust ecosystem natively. Alternative: root `Makefile`. Either gives team a single `make dev`, `make test`, `make lint` that calls into both toolchains.                                             |
| **cargo-watch for Rust hot reload**               | Equivalent of Next.js HMR for Rust backend. `cargo-watch -x run` rebuilds and restarts Axum server on file save. Without this, backend development requires manual `cargo run` after each change.                                  | LOW        | `cargo install cargo-watch`. Added to Docker dev image. `bun dev` script calls `cargo watch` as a child process (via `concurrently` or similar). Significantly improves Rust DX in the unified environment.                                  |
| **Shared type generation from OpenAPI spec**      | Backend already has OpenAPI spec at `dev.decoded.style`. Auto-generate TypeScript types from it into `packages/shared/` on build. Eliminates manual type synchronization between Rust API and Next.js frontend.                    | HIGH       | `openapi-typescript` CLI (well-maintained, 2026 current). Run as part of `prebuild` in `packages/shared`. Types land in `packages/shared/types/api.ts`. Frontend imports from `@decoded/shared`. This is the highest-value long-term payoff. |
| **`.nvmrc` / `rust-toolchain.toml` pinning**      | Pin exact Node.js and Rust toolchain versions in the repo root. Engineers joining the project get the same versions as CI. Prevents "works on my machine" failures especially important for Rust editions (2021/2024).             | LOW        | `.nvmrc` for Node (or `volta` field in `package.json`). `rust-toolchain.toml` already exists in backend — moves to `packages/backend/` or root. `bun` version pinned via `packageManager` field.                                             |

---

### Anti-Features (Commonly Requested, Often Problematic)

| Feature                                      | Why Requested                                                                                                                     | Why Problematic                                                                                                                                                                                                                                                                          | Alternative                                                                                                                                                                                                                                             |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`turbo prune` for Docker builds with bun** | Turborepo's `prune` command generates a minimal lockfile subset for Docker layer caching. Engineers want optimized Docker builds. | As of late 2025, `turbo prune` with bun generates corrupted `bun.lock` files (GitHub issue #11007, #11266). `--frozen-lockfile` fails in pruned Docker contexts. This is an active bug, not a stable feature.                                                                            | Use `COPY packages/backend/ packages/backend/ COPY packages/web/ packages/web/` directly in multi-stage Dockerfiles without `turbo prune`. Accept slightly larger Docker layers until the bun prune bug is fixed. Revisit in Turborepo 2.x canary.      |
| **Cargo workspace at repo root**             | "One workspace to rule them all" — makes `cargo build` work from root.                                                            | Cargo workspaces and bun workspaces are separate systems. Trying to merge them at the root (`[workspace]` in root `Cargo.toml`) causes confusion: bun ignores Cargo, but developers expect `cargo build` at root. Adds `Cargo.lock` at root which conflicts with JS tooling assumptions. | Keep `Cargo.toml` (workspace root) inside `packages/backend/`. `cargo build` runs from `packages/backend/`. Turborepo wraps it via `package.json` script. Clean separation — each tool has its own root.                                                |
| **git submodule instead of subtree**         | "Keep backend as a separate repo, just reference it" — preserves ability to push upstream easily.                                 | Submodules require every developer to run `git submodule update --init` after cloning. CI pipelines need explicit submodule init steps. Detached HEAD state causes confusion. Most engineers find submodules confusing in practice.                                                      | git subtree gives the same history preservation and upstream-sync capability via `git subtree pull`, but the backend code lives directly in the tree. No extra init step. No detached HEAD. Simpler workflow at the cost of slightly larger clone size. |
| **Single `.env` for all packages at root**   | "One file is simpler than N files" — easier to audit secrets.                                                                     | Next.js requires `.env.local` in the package directory (or project root relative to `next.config.js`). Axum reads env vars from the shell or its own `.env`. A single root file requires custom loading logic in both runtimes and is not a standard pattern for either.                 | Root `.env` for truly shared secrets (DATABASE*URL, shared API keys). Per-package `.env.local` for package-specific config (NEXT_PUBLIC*\* for web, LOG_LEVEL for backend). Docker Compose `env_file` combines both using array syntax.                 |
| **Nx instead of Turborepo**                  | Nx has first-class multi-language support, explicit Rust plugin, and more granular task control.                                  | The project already decided on Turborepo (PROJECT.md Key Decisions). Switching to Nx at this point adds ~1 week of migration overhead with no immediate benefit. Turborepo's multi-language support via `package.json` wrapper is sufficient for one Rust service.                       | Stay with Turborepo. Use `package.json` wrapper pattern for `packages/backend/` as documented in official Turborepo multi-language guide. If Rust backend grows to 3+ services, re-evaluate Nx or Moon at that point.                                   |
| **bun as Rust build runner**                 | "bun can run scripts so let bun manage cargo"                                                                                     | bun `package.json` scripts that call `cargo` work fine for simple cases, but bun does not understand Rust toolchain requirements, `rust-toolchain.toml`, or Cargo feature flags. Using bun as the primary interface for Rust builds obscures build failures.                             | Use `cargo` directly for Rust builds. bun/Turborepo calls `cargo build --release` as an opaque shell command. Turborepo caches the output directory. Rust engineers run `cargo` commands natively in `packages/backend/`.                               |

---

## Feature Dependencies

```
[git subtree merge]
    └──required by──> [Unified development workflow]
                          └──required by──> [Single bun dev command]
                          └──required by──> [Docker Compose unification]

[bun workspace migration]
    └──required by──> [Turborepo build orchestration]
                          └──required by──> [Remote caching]
                          └──required by──> [CI/CD path-based detection]

[Turborepo build orchestration]
    └──enhances──> [Docker Compose unification]   (turbo run build feeds Docker)

[Shared env var management]
    └──required by──> [Single bun dev command]  (both services need secrets)
    └──required by──> [Docker Compose unification]

[openapi-typescript type generation]
    └──requires──> [packages/shared package exists]
    └──requires──> [Backend OpenAPI spec stable]
    └──enhances──> [bun workspace migration]  (types auto-flow through workspaces)

[cargo-watch]
    └──enhances──> [Single bun dev command]  (hot reload for Rust)
    └──conflicts──> [Docker dev mode]  (cargo-watch runs natively, not in container for local dev)
```

### Dependency Notes

- **git subtree must happen before any tooling changes.** Once the backend code lands in `packages/backend/`, bun migration and Turborepo setup can reference it. Doing bun migration before subtree merge means updating configuration twice.
- **bun workspace migration must happen before Turborepo setup.** Turborepo reads `packageManager` from root `package.json` to determine which package manager to use. Setting up `turbo.json` before migrating to bun produces ambiguous behavior.
- **OpenAPI type generation is independent.** It can be added in any phase after `packages/shared` exists. It is the highest-value long-term feature but not required for unified dev workflow.
- **cargo-watch conflicts with Docker-first development.** Choose one local dev model: either run services natively (cargo-watch + bun dev) or run all services in Docker Compose. Docker dev introduces rebuild latency on every Rust change. Native dev is faster but requires both Rust toolchain and bun installed locally.

---

## MVP Definition

This milestone is infrastructure, not a user-facing feature. "MVP" means: the minimum changes that produce a working unified development environment.

### Launch With (v1 — unified monorepo)

- [ ] **git subtree merge** — `packages/backend/` with full Rust history. Non-destructive, reversible.
- [ ] **bun workspace migration** — `package.json` `packageManager` updated, `yarn.lock` → `bun.lock`, existing scripts verified working.
- [ ] **Root `turbo.json` with build/dev/lint pipelines** — `packages/web` and `packages/backend` both registered as packages.
- [ ] **Single `bun dev` command** — starts Next.js dev server + Rust backend (via `cargo watch` or simple `cargo run`).
- [ ] **Root `.env` + per-package `.env.local` structure** — engineers know exactly where each secret lives.
- [ ] **Docker Compose unified** — `docker compose up` starts web + backend + db. Works for staging/prod.

### Add After Validation (v1.x)

- [ ] **CI/CD path-based change detection** — add `dorny/paths-filter` and separate workflows once team confirms the unified setup is stable.
- [ ] **Turborepo remote caching** — connect Vercel Remote Cache after the CI workflow is confirmed working.
- [ ] **`just` / `Makefile` cross-language tasks** — convenience layer once base is stable.

### Future Consideration (v2+)

- [ ] **OpenAPI → TypeScript type generation** — high value but requires OpenAPI spec stabilization and `packages/shared` structure agreed upon.
- [ ] **Rust-native CI caching** — `sccache` or `cargo-cache` for Rust build artifact caching in CI (independent of Turborepo remote cache).

---

## Feature Prioritization Matrix

| Feature                                  | Dev Team Value | Implementation Cost | Priority |
| ---------------------------------------- | -------------- | ------------------- | -------- |
| git subtree merge (history preserved)    | HIGH           | LOW                 | P1       |
| bun workspace migration                  | HIGH           | MEDIUM              | P1       |
| Turborepo build orchestration            | HIGH           | MEDIUM              | P1       |
| Single `bun dev` unified command         | HIGH           | MEDIUM              | P1       |
| Shared env var management                | HIGH           | LOW                 | P1       |
| Docker Compose unification               | HIGH           | MEDIUM              | P1       |
| CI/CD path-based change detection        | HIGH           | MEDIUM              | P2       |
| cargo-watch for Rust hot reload          | MEDIUM         | LOW                 | P2       |
| Turborepo remote caching                 | MEDIUM         | LOW                 | P2       |
| `just` / `Makefile` cross-language tasks | MEDIUM         | LOW                 | P2       |
| `.nvmrc` / `rust-toolchain.toml` pinning | LOW            | LOW                 | P2       |
| OpenAPI → TypeScript type generation     | HIGH           | HIGH                | P3       |
| Rust-native CI caching (sccache)         | MEDIUM         | MEDIUM              | P3       |

**Priority key:**

- P1: Required for v8.0 milestone completion
- P2: Should add within v8.0 once P1 is stable
- P3: High value but deferred — separate milestone or v8.1

---

## Ecosystem Reference

The mixed-language monorepo pattern is well-established in 2026. Key reference implementations:

| Pattern                                           | Used By                           | Our Approach                                             |
| ------------------------------------------------- | --------------------------------- | -------------------------------------------------------- |
| Turborepo multi-language via package.json wrapper | Vercel, community                 | Rust `packages/backend/package.json` wraps `cargo build` |
| git subtree for repo consolidation                | Common in OSS monorepo migrations | `git subtree add --prefix=packages/backend`              |
| Docker Compose with per-language Dockerfiles      | Standard industry practice        | Root `docker-compose.yml`, per-service Dockerfiles       |
| Path-based CI with `dorny/paths-filter`           | GitHub community standard         | Separate workflows per `packages/*` directory            |
| bun workspaces (Yarn 4 replacement)               | Growing adoption 2025–2026        | `packageManager: "bun@1.3.10"` in root `package.json`    |

---

## Dependencies on Existing Codebase

| Existing Asset                       | How v8.0 Touches It                                                                                                               |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Root `package.json` (`yarn@4.9.2`)   | `packageManager` field changes to `bun@1.3.10`. Workspaces array unchanged.                                                       |
| `yarn.lock`                          | Deleted. `bun install` generates `bun.lock` as replacement.                                                                       |
| `.yarnrc.yml`                        | Removed. bun uses `.bunfig.toml` for equivalent config.                                                                           |
| `packages/web/package.json` scripts  | `yarn workspace @decoded/web` calls replaced by `bun run --filter @decoded/web` in root scripts.                                  |
| `packages/shared/`                   | Unchanged — bun treats it as a workspace package identically to yarn.                                                             |
| `packages/mobile/` (Expo)            | Verify Expo SDK compatibility with bun before migrating. Expo has bun support but some plugins use postinstall hooks that differ. |
| Frontend `API_BASE_URL` env var      | Already proxies ~70% of API calls to Rust backend. No change needed post-merge.                                                   |
| GitHub Actions `.github/workflows/`  | New path-filter logic added. Existing workflows updated from `yarn` to `bun` commands.                                            |
| Backend Docker setup (separate repo) | Dockerfile and docker-compose files move to `packages/backend/` in monorepo. Root `docker-compose.yml` references them.           |

---

## Sources

- [Turborepo Multi-Language Guide](https://turborepo.dev/docs/guides/multi-language) — official documentation. HIGH confidence. Package.json wrapper pattern for Rust/Cargo confirmed.
- [Turborepo with Docker](https://turborepo.dev/docs/guides/tools/docker) — official Docker guide. HIGH confidence. `turbo prune` limitations with bun noted.
- [turbo prune bun lockfile bug #11007](https://github.com/vercel/turborepo/issues/11007) — active GitHub issue. HIGH confidence (firsthand report). Do NOT use turbo prune with bun until resolved.
- [turbo prune bun lockfile corruption #11266](https://github.com/vercel/turborepo/issues/11266) — second confirmation of same bug.
- [Turborepo 2.5 release — bun prune support](https://turborepo.com/blog/turbo-2-5) — bun prune added in 2.5, but lockfile bugs remain. MEDIUM confidence.
- [Bun workspaces guide](https://bun.com/docs/guides/install/workspaces) — official bun docs. HIGH confidence.
- [dorny/paths-filter](https://github.com/dorny/paths-filter) — GitHub Actions path filtering. HIGH confidence (widely adopted, actively maintained).
- [git subtree merge without losing history](https://medium.com/@andrejkurocenko/merging-multiple-repositories-into-a-monorepo-using-git-subtree-without-losing-history-0c019046498e) — practical guide. MEDIUM confidence.
- [GitHub Docs: git subtree merges](https://docs.github.com/en/get-started/using-git/about-git-subtree-merges) — official GitHub docs. HIGH confidence.
- [Best Monorepo Tools 2026 — PkgPulse](https://www.pkgpulse.com/blog/best-monorepo-tools-2026) — ecosystem overview. LOW confidence (blog, not official source), corroborates Turborepo recommendation.
- [Dealing with Turborepo + Bun Hell — fgbyte](https://www.fgbyte.com/blog/02-bun-turborepo-hell/) — practitioner experience. MEDIUM confidence. Corroborates workspace dependency issues.
- [GitHub Actions monorepo CI/CD 2026](https://dev.to/pockit_tools/github-actions-in-2026-the-complete-guide-to-monorepo-cicd-and-self-hosted-runners-1jop) — patterns guide. MEDIUM confidence.

---

_Feature research for: v8.0 Monorepo Consolidation & Bun Migration — decoded-app (JS + Rust mixed-language monorepo)_
_Researched: 2026-03-22_
