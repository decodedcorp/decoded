# Stack Research

**Domain:** Monorepo Consolidation & Bun Migration — merging Rust/Axum backend into JS monorepo, Yarn 4 → bun, Turborepo orchestration (decoded-app v8.0)
**Researched:** 2026-03-22
**Confidence:** HIGH (bun 1.3.11 verified from official blog; Turborepo 2.7 verified from official blog; migration path for Yarn 4 → bun verified from GitHub issues)

---

## Context: Existing Stack — Do Not Re-Research

The following are already installed and validated. Zero changes needed:

| Package     | Version  | Status             |
| ----------- | -------- | ------------------ |
| Next.js     | 16.0.7   | Stays              |
| React       | 18.3.1   | Stays              |
| TypeScript  | 5.9.3    | Stays              |
| Yarn        | 4.9.2    | REPLACING with bun |
| Supabase    | 2.86.0   | Stays              |
| Zustand     | 4.5.7    | Stays              |
| React Query | 5.90.11  | Stays              |
| GSAP        | 3.13.0   | Stays              |
| Motion      | 12.23.12 | Stays              |
| Playwright  | 1.58.1   | Stays              |

---

## New Stack: What to Add

### Core Technologies

| Technology  | Version               | Purpose                                                | Why Recommended                                                                                                                                                                                                                   |
| ----------- | --------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| bun         | 1.3.11                | Package manager + JS runtime replacing Yarn 4          | 28x faster installs than npm on Linux; native workspaces; single binary with bundler/test runner; workspace-aware `--filter` flag; bun.lock text format (human-readable, git-diffable); official current version as of March 2026 |
| Turborepo   | 2.8.x (latest 2.8.20) | Build orchestration, task caching, change-detection CI | Task-level remote caching; `--affected` flag for CI (only rebuild changed packages); Devtools graph visualizer in 2.7; Rust engine internally for fast hashing; officially supports bun as package manager                        |
| git subtree | built-in git          | Merge backend repo with full commit history preserved  | Preserves upstream commit history in `packages/api-server/`; no extra tooling; prefixes all upstream commits under the subtree path; simpler than git submodules (no `.gitmodules` file, no special clone steps)                     |
| cargo-watch | 8.4.0                 | Rust hot-reload during development                     | Watches `src/` and re-runs `cargo run` on change; standard tool for Axum dev; pairs with `systemfd` for connection-preserving reload                                                                                              |

### Supporting Libraries / Dev Tools

| Tool              | Version                          | Purpose                                                       | When to Use                                                                                                                                                                          |
| ----------------- | -------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| concurrently      | 9.x                              | Run frontend + backend dev servers in one terminal            | `bun dev` at root delegates to `concurrently "bun --cwd packages/web dev" "cargo watch -x run --manifest-path packages/api-server/Cargo.toml"`; no process manager needed for local dev |
| systemfd          | 0.9.x (Rust crate)               | Socket passing for zero-downtime Axum reload                  | Optional: `systemfd --no-pid -s http::8080 -- cargo watch -x run` — preserves open connections when Axum binary reloads; useful if frontend dev frequently triggers API calls        |
| docker compose    | v2 (bundled with Docker Desktop) | Run all services (frontend, backend, Supabase local) together | Use for integration testing and CI; not required for day-to-day dev                                                                                                                  |
| oven-sh/setup-bun | GitHub Action                    | Install bun in CI                                             | Official GitHub Action from the bun team; replace `actions/setup-node` for JS steps                                                                                                  |

---

## Architecture Decision: Backend Stays Outside bun Workspace

**This is the most important constraint for this milestone.**

The Rust backend (`packages/api-server/`) must NOT be added to bun's `workspaces` array. Cargo manages the Rust workspace independently. bun only manages JS packages.

```json
// Root package.json — workspaces includes ONLY JS packages
{
  "name": "decoded",
  "private": true,
  "packageManager": "bun@1.3.11",
  "workspaces": ["packages/web", "packages/shared"]
}
```

Turborepo, however, CAN include the backend as a "package" — it just needs a `package.json` in `packages/api-server/` that exposes a `build` script wrapping `cargo build --release`.

```json
// packages/api-server/package.json — thin wrapper, not a bun workspace
{
  "name": "backend",
  "scripts": {
    "build": "cargo build --release",
    "dev": "cargo watch -x run",
    "check": "cargo check"
  }
}
```

**Why this works:** Turborepo reads `package.json` scripts from any directory — it is not restricted to bun workspace members. The backend `package.json` is not listed in root `workspaces`, so bun ignores it for dependency installation, but Turborepo can still orchestrate its tasks.

---

## Migration Path: Yarn 4 → bun

### Lock File Conversion (Critical)

There is **no direct Yarn 4 (Berry) → bun.lock migration tool** as of March 2026. PR #25245 in the bun repo is open but not yet merged. The approved community workaround uses pnpm as an intermediary:

```bash
# Step 1: Install pnpm temporarily
npm install -g pnpm

# Step 2: Convert yarn.lock (Berry) to pnpm lockfile
pnpm import

# Step 3: Delete yarn lockfile and Yarn config
rm yarn.lock
rm .yarnrc.yml

# Step 4: bun reads the pnpm lockfile and generates bun.lock
bun install

# Step 5: Remove pnpm lockfile, keep only bun.lock
rm pnpm-lock.yaml
```

Source: GitHub issue oven-sh/bun#21356 (MEDIUM confidence — community workaround, not official tool)

### Package Manager Field

Set `"packageManager": "bun@1.3.11"` in root `package.json`. Note: Corepack does NOT support bun yet (as of March 2026), so this field is informational only — it will not be enforced by Node.js tooling. For enforcement, add a `.bun-version` file:

```
# .bun-version
1.3.11
```

### Script Updates

All `yarn` commands in CI and scripts become `bun` equivalents:

| Old (Yarn 4)                 | New (bun)                        |
| ---------------------------- | -------------------------------- |
| `yarn install`               | `bun install`                    |
| `yarn workspace web add pkg` | `bun add --cwd packages/web pkg` |
| `yarn workspace web run dev` | `bun --filter=web dev`           |
| `yarn run lint`              | `bun run lint`                   |
| `yarn dlx turbo`             | `bunx turbo`                     |

---

## Turborepo Configuration

### turbo.json (Root)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "target/release/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "check": {
      "dependsOn": ["^check"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test:visual": {
      "dependsOn": ["build"],
      "outputs": ["test-results/**"]
    }
  },
  "globalPassThroughEnv": [
    "RUSTC_WRAPPER",
    "CARGO_INCREMENTAL",
    "CARGO_BUILD_JOBS",
    "RUSTFLAGS",
    "RUST_LOG",
    "DATABASE_URL"
  ]
}
```

**Key decisions:**

- `"persistent": true` on `dev` tells Turborepo the task runs forever (does not exit) — required for dev servers
- `"cache": false` on `dev` disables caching for the dev task (correct — live output must never be cached)
- `globalPassThroughEnv` exposes Rust-specific env vars to the backend task without making them part of the cache hash

### Running Tasks

```bash
# Full dev (frontend + backend)
bunx turbo dev

# Build all
bunx turbo build

# Only affected packages (CI)
bunx turbo build --affected

# Only frontend
bunx turbo build --filter=web

# Rust check only
bunx turbo check --filter=backend
```

---

## git subtree: Backend Merge

### Initial Merge Command

```bash
# Run from monorepo root
git subtree add \
  --prefix=packages/api-server \
  https://github.com/decodedcorp/backend \
  main \
  --squash
```

**`--squash` vs without:**

- `--squash`: condenses all upstream history into a single merge commit — cleaner monorepo history, but loses individual upstream commit granularity
- Without `--squash`: preserves every upstream commit scoped to `packages/api-server/` — full history available, but noisier `git log`

**Recommendation: use `--squash` for initial merge.** The backend has 44 migrations and 19 domains — full history import would pollute the monorepo log. Individual commit history remains available in the original backend repo.

### Subsequent Upstream Pulls

```bash
# Pull updates from backend repo after initial merge
git subtree pull \
  --prefix=packages/api-server \
  https://github.com/decodedcorp/backend \
  main \
  --squash
```

### What to Keep From the Backend Repo

| File                 | Action                                                                      |
| -------------------- | --------------------------------------------------------------------------- |
| `Cargo.toml`         | Keep — Cargo workspace root                                                 |
| `Cargo.lock`         | Keep — NEVER add to .gitignore; Cargo.lock for binaries should be committed |
| `src/`               | Keep — all Rust source                                                      |
| `.env.example`       | Keep — merge into root `.env.local.example`                                 |
| `Dockerfile`         | Keep at `packages/api-server/Dockerfile`                                       |
| `.github/workflows/` | Archive — replace with monorepo-level CI                                    |
| `README.md`          | Archive or merge into root                                                  |

---

## CI/CD: GitHub Actions with bun + Turborepo

### Root Workflow Pattern

```yaml
# .github/workflows/ci.yml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Required for --affected to work

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: 1.3.11

      - name: Install JS dependencies
        run: bun install

      - name: Install Rust toolchain
        uses: dtolnay/rust-toolchain@stable

      - name: Run affected builds
        run: bunx turbo build --affected
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
          TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
```

**Key notes:**

- `fetch-depth: 0` is required — Turborepo's `--affected` compares against base branch; shallow clones break this
- `dtolnay/rust-toolchain@stable` is the canonical GitHub Action for installing Rust — faster than `rustup` manual install because it caches toolchain components
- `TURBO_TOKEN` + `TURBO_TEAM` enable Vercel Remote Cache — dramatically reduces CI time after first run

### Path-Based Triggering

Turborepo's `--affected` flag handles change detection internally. You do NOT need `dorny/paths-filter` or manual path matching — Turborepo compares the PR head vs base and only runs tasks for changed packages.

---

## Installation

```bash
# 1. Install bun globally (replace Yarn 4)
curl -fsSL https://bun.sh/install | bash
# or via brew: brew install bun

# 2. Install Turborepo (dev dependency at root)
bun add -D turbo -w

# 3. Install concurrently (dev dependency at root)
bun add -D concurrently -w

# 4. Install cargo-watch (Rust tool, separate from bun)
cargo install cargo-watch

# 5. (Optional) Install systemfd for connection-preserving reload
cargo install systemfd

# 6. Migrate lock file (one-time)
npm install -g pnpm && pnpm import && rm yarn.lock .yarnrc.yml && bun install && rm pnpm-lock.yaml
```

---

## Alternatives Considered

| Recommended          | Alternative            | When to Use Alternative                                                                                                                         |
| -------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| bun workspaces       | pnpm workspaces        | If team is on Windows and bun Windows support is not mature enough; pnpm workspace + Turborepo is the "safe" 2026 choice                        |
| git subtree --squash | git submodules         | Never for this use case — submodules require special clone steps and confuse contributors; subtree is superior for monorepo consolidation       |
| git subtree --squash | josh / git-filter-repo | If full commit history preservation is required; josh scales better for very large repos, but adds tooling complexity not needed here           |
| Turborepo            | Nx                     | If project needs code generators, advanced plugins, or large team governance features; Nx is heavier but more powerful for enterprise monorepos |
| Turborepo            | Makefiles              | If team prefers language-agnostic task runners; Makefiles have no dependency graph or caching — not suitable here                               |
| concurrently         | overmind               | overmind (requires tmux) is better for terminal multiplexing; concurrently is simpler and works in all terminals including CI                   |
| cargo-watch          | watchexec              | watchexec is more general; cargo-watch is Cargo-native and auto-handles `cargo` subcommand syntax — prefer for Rust projects                    |

---

## What NOT to Use

| Avoid                                                          | Why                                                                                              | Use Instead                                                                                |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Adding `packages/api-server` to bun `workspaces`                  | bun would attempt to install Cargo crates as npm dependencies — will fail silently or error      | Keep backend out of `workspaces`; give it a thin `package.json` for Turborepo scripts only |
| `yarn.lock` after migration                                    | bun will NOT use yarn.lock; leaving it causes confusion about which lockfile is authoritative    | Delete `yarn.lock` and `.yarnrc.yml` as part of migration; commit `bun.lock` instead       |
| `--no-squash` on initial subtree merge (44 migrations backend) | Imports ~1000+ commits into monorepo log, making `git log` noisy                                 | Use `--squash` for initial merge; future pulls can be --squash too                         |
| `npm` or `npx` after bun migration                             | Invoking npm after bun migration generates a `package-lock.json` and breaks bun.lock consistency | Use `bun` / `bunx` everywhere; add `.npmrc` rule if needed to block npm usage              |
| Turborepo `--filter` with Yarn catalog syntax after migration  | Yarn 4 catalogs are not bun-native; migrating resolves versions into standard semver ranges      | After migration, standard version ranges work; no catalog-specific Turborepo config needed |
| Corepack for bun version enforcement                           | Corepack does not support bun as of March 2026                                                   | Use `.bun-version` file + CI `oven-sh/setup-bun@v2` with explicit version pinning          |

---

## Stack Patterns by Variant

**If running dev locally (day-to-day):**

- Use `bunx turbo dev` from repo root
- Turborepo runs `packages/web` Next.js dev server + `packages/api-server` cargo-watch concurrently
- No Docker needed for local dev

**If running integration tests or full-stack CI:**

- Use `docker compose up` to spin up backend + Supabase local + Next.js in containers
- Turborepo handles build ordering; Docker Compose handles runtime networking

**If the backend repo has ongoing parallel development during migration:**

- Keep using `git subtree pull --prefix=packages/api-server ... --squash` for syncing upstream changes
- Once the backend team is fully working from the monorepo, the original repo becomes read-only

**If Cargo.lock conflicts during subtree merge:**

- DO NOT delete Cargo.lock — it is intentional for binary crates
- Resolve conflicts manually by accepting the most recent Cargo.lock version
- Run `cargo check` after resolution to verify dependency graph

---

## Version Compatibility

| Package           | Compatible With          | Notes                                                                                                                        |
| ----------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| bun@1.3.11        | Turborepo 2.8.x          | Confirmed: Turborepo officially supports bun; `bunx turbo` works                                                             |
| bun@1.3.11        | Next.js 16               | Compatible; bun can run Next.js dev and build commands directly                                                              |
| bun@1.3.11        | Yarn 4 workspaces format | Partially compatible — workspace globs in package.json are the same format; lock file is NOT compatible (requires migration) |
| Turborepo 2.8.x   | Rust-based tasks         | Compatible via `package.json` script wrapper; Turborepo does not natively parse Cargo.toml but can run `cargo` scripts       |
| cargo-watch@8.4.0 | Axum (Rust)              | Standard pairing; watches `src/` and re-runs `cargo run`                                                                     |
| git subtree       | Git history preservation | Built into git — no version constraint; available on all platforms                                                           |

---

## Sources

- https://bun.com/blog/bun-v1.3.11 — bun 1.3.11 official release notes (HIGH confidence — official source)
- https://bun.com/docs/pm/workspaces — bun workspaces documentation (HIGH confidence — official docs)
- https://turborepo.dev/blog/turbo-2-7 — Turborepo 2.7 release with Devtools and bun support (HIGH confidence — official blog)
- https://turborepo.dev/docs/reference/configuration — turbo.json globalPassThroughEnv, persistent, cache options (HIGH confidence — official docs)
- https://turborepo.dev/docs/crafting-your-repository/constructing-ci — GitHub Actions CI patterns with --affected (HIGH confidence — official docs)
- https://github.com/oven-sh/bun/issues/21356 — Yarn 4 (Berry) to bun.lock migration status and pnpm intermediary workaround (MEDIUM confidence — community workaround, PR #25245 pending)
- https://github.com/vercel/turborepo/issues/683 — Turborepo support for Rust/non-JS backends via package.json wrappers (MEDIUM confidence — community discussion)
- https://github.com/spa5k/monorepo-typescript-rust — Working example of Turborepo + Rust backend in monorepo using pnpm (MEDIUM confidence — community example)
- https://crates.io/crates/cargo-watch — cargo-watch 8.4.0 current version (HIGH confidence — official crates.io registry)
- https://socket.dev/blog/bun-1-2-19-adds-isolated-installs-for-better-monorepo-support — Bun isolated installs for monorepos (MEDIUM confidence — verified secondary source)
- https://medium.com/@andrejkurocenko/merging-multiple-repositories-into-a-monorepo-using-git-subtree-without-losing-history-0c019046498e — git subtree merge pattern for history-preserving consolidation (MEDIUM confidence — community article)

---

_Stack research for: decoded-app v8.0 Monorepo Consolidation & Bun Migration_
_Researched: 2026-03-22_
