# Pitfalls Research

**Domain:** Monorepo consolidation — Rust backend subtree merge + Yarn 4 → bun migration + Turborepo introduction (decoded-app v8.0)
**Researched:** 2026-03-22
**Confidence:** HIGH (git subtree mechanics, bun lockfile issues), HIGH (turbo prune + bun Docker), MEDIUM (Expo Metro transitive deps), MEDIUM (Turborepo Rust task wrapping)

---

## Critical Pitfalls

Mistakes that cause data loss, broken CI, or force a full redo of the migration.

---

### Pitfall 1: Yarn Berry v4 Lockfile Has No Direct Migration Path to bun

**What goes wrong:**
`bun pm migrate` does not recognize the Yarn Berry (v4) lockfile format (`yarn.lock` in YAML-like berry syntax). Running `bun install` in a Yarn 4 workspace silently generates a fresh `bun.lock` without preserving resolved versions from the old lockfile. This means every dependency gets re-resolved from npm at current-available versions, which can introduce unexpected upgrades (a package bumped a minor that breaks an API, a transitive dep changed behavior). The `.yarn/cache/` zip files are also incompatible — bun ignores them.

**Why it happens:**
`bun pm migrate` targets npm's `package-lock.json` format. Berry introduced a custom lockfile syntax not shared by any other package manager. There is an open bun issue (#21356) tracking native Berry migration support but no ETA as of March 2026. Developers assume `bun install` reads and honors the existing lockfile, but it only honors its own `bun.lock` format.

**How to avoid:**
Use the three-step manual migration chain:

1. `pnpm import` — converts `yarn.lock` (berry) to `pnpm-lock.yaml` (pnpm understands berry format)
2. Delete `yarn.lock`
3. `bun install` — bun reads `pnpm-lock.yaml` and converts to `bun.lock`

After migration, do a full diff of key package versions (`react`, `next`, `@supabase/supabase-js`, `gsap`, etc.) between old lock and new to catch any silent version drift. Pin any drifted packages explicitly in `package.json` before proceeding.

**Warning signs:**

- `bun install` completes instantly on a fresh run with no existing `bun.lock` — this means it resolved everything from scratch, not from a cache
- Version numbers in `bun.lock` differ from versions in `yarn.lock`
- `bun pm migrate` exits with no output or with "unsupported lockfile format"
- `.yarn/cache/` directory still exists after bun migration (safe to delete, but indicates old cache was bypassed)

**Phase to address:** Phase 1 (Package manager migration). This is the first executable step — do not proceed to any subsequent phase until the lockfile migration is verified with a full install and build pass.

---

### Pitfall 2: `turbo prune` Corrupts `bun.lock` Files, Breaking Docker Builds

**What goes wrong:**
`turbo prune --docker` generates a pruned subset of the workspace for Docker layer caching. When using bun, Turborepo's pruning logic corrupts the `bun.lock` output in multiple ways: it inserts empty strings for GitHub-sourced dependencies, removes nested transitive dependencies, and generates non-deterministic output (optional peer packages reorder between runs). The result: `bun install --frozen-lockfile` inside the Docker build fails with parse errors or installs wrong versions silently. This affects Turborepo 2.5.x through 2.6.x (confirmed open issues #10782, #10783, #11007, #11074, #11266 as of March 2026).

**Why it happens:**
Turborepo's lockfile pruning is implemented in Rust (crates/turborepo-lockfiles). The `bun.lock` deserializer/serializer has bugs in the JSONC parsing path. The bun lockfile format changed from binary (bun.lockb) to text JSONC (bun.lock) in bun v1.2, and Turborepo's support for the new format is still incomplete. GitHub dependency entries use a different schema that the pruner mishandles.

**How to avoid:**
Do NOT use `turbo prune --docker` for the bun workspace until these issues are resolved upstream. Instead, copy the entire monorepo into the Docker build context and use `bun install --filter=<package>` to install only the relevant workspace's dependencies. Alternatively: use the "full install, build target package" Docker pattern without pruning:

```dockerfile
COPY . .
RUN bun install --frozen-lockfile
RUN bun run build --filter=@decoded/web
```

Track the turbo GitHub issue tracker before enabling `turbo prune` in CI — check for issues #11007 and #10782 resolution before switching.

**Warning signs:**

- `bun install --frozen-lockfile` fails inside Docker with "failed to parse lockfile: 'bun.lock'"
- Different `bun.lock` files generated across CI runs with identical inputs
- Docker layer cache never hits on the install step even with no dependency changes
- `turbo prune` output log shows warnings about "unknown lockfile entries"

**Phase to address:** Phase 4 (Docker and CI/CD integration). Establish Docker build pattern without `turbo prune` from the start. Document this as a known limitation in the CI setup. Revisit when turborepo releases a fix.

---

### Pitfall 3: git subtree Merge Fails with "Refusing to Merge Unrelated Histories"

**What goes wrong:**
`git subtree add --prefix=packages/api-server <remote> <branch>` on an active monorepo with commits fails with `fatal: refusing to merge unrelated histories`. This error is thrown because the backend repo has no common ancestor with the frontend monorepo. If the developer works around this with `--allow-unrelated-histories` improperly, they can produce a merge commit that rewrites all backend file paths incorrectly, causing the `packages/api-server/` prefix to be doubled or omitted in the tree.

**Why it happens:**
`git subtree add` internally calls `git merge -s ours` to import the foreign tree. Without shared history, git refuses by default. The `--squash` flag avoids the history issue by collapsing all backend commits into one import commit — but if the developer uses `--squash` on the initial add and then omits `--squash` on subsequent `git subtree pull` updates, git cannot reconcile the squashed vs. full history and produces conflicts.

**How to avoid:**
Choose ONE strategy and apply it consistently:

- **With history (recommended for this migration):** `git subtree add --prefix=packages/api-server <backend-remote> main` — requires no `--squash`. If "unrelated histories" appears, verify the remote was added correctly (`git remote add backend <url>`) and that `git fetch backend` ran before the subtree add.
- **Without history (squash):** `git subtree add --prefix=packages/api-server <backend-remote> main --squash` — all future updates MUST also use `--squash`. Never mix squash and non-squash on the same subtree prefix.

Verify the prefix after merge: `git ls-tree HEAD packages/api-server/ | head -5` should show Cargo.toml, src/, etc. at the correct depth.

**Warning signs:**

- `fatal: refusing to merge unrelated histories` — run `git remote -v` to confirm backend remote is registered and fetched
- Files appear at `packages/api-server/packages/api-server/` (doubled prefix) — indicates a wrong `--prefix` value during the merge
- `Cargo.toml` appears at repo root instead of `packages/api-server/` — prefix was omitted from the `git subtree add` command
- `git log --oneline packages/api-server/ | head -10` shows no commits — subtree was added but history was not imported

**Phase to address:** Phase 2 (git subtree merge). This is a one-time irreversible operation on the active repo. Do it on a dedicated branch (`git checkout -b feat/backend-subtree-merge`) and verify the tree structure before merging to main.

---

### Pitfall 4: Backend's `pre-push` Hook and `justfile` Break After Subtree Move

**What goes wrong:**
The Rust backend repo has a `pre-push` hook (`.git/hooks/pre-push`) that runs `cargo test`, `cargo deny`, `cargo-tarpaulin`, and lint checks before every push. After `git subtree add`, those hooks live at `packages/api-server/.git/hooks/` — but git only runs hooks from `.git/hooks/` at the repository root. The backend hooks are completely silenced. Developers believe their code passed the pre-push checks, but they did not run. Additionally, the backend's `justfile` contains `cd src && cargo build` style relative paths that break when invoked from the monorepo root.

**Why it happens:**
git hooks are stored in the `.git/hooks/` directory of the specific git repo. Subtree merges move files but not the `.git/` directory — the backend's `.git/` is absorbed into the parent monorepo's `.git/`. The hooks that lived at the backend repo root simply cease to exist as hooks. The `justfile` relative path issue is because `just` resolves paths relative to the `justfile` location, but if the `justfile` relies on being at the repo root for things like `cargo build` (which needs the workspace `Cargo.toml`), running it from `packages/api-server/` works but running it from the monorepo root does not.

**How to avoid:**

- After the subtree merge, copy the backend hooks into the monorepo root `.git/hooks/` or (better) use a tool like `husky` or `lefthook` to manage hooks centrally. The hook scripts themselves should be updated to `cd packages/api-server && cargo test`.
- Update the `justfile` to use absolute paths from the monorepo root or add a `set working-directory := "packages/api-server"` at the top. Test all `just <task>` commands from the monorepo root before merge sign-off.
- Add `cargo-deny` and `cargo-tarpaulin` invocations to the CI pipeline explicitly, since pre-push hooks no longer run in CI regardless.

**Warning signs:**

- `git push` completes immediately without printing any cargo test output (hook not running)
- `just build` from monorepo root fails with "no workspace found" or "file not found" errors
- CI catches Rust errors that pre-push should have caught locally — indicates hooks are dead

**Phase to address:** Phase 2 (git subtree merge) and Phase 3 (unified dev environment). Audit hooks and justfile immediately after the subtree merge, before any other developer works in the monorepo.

---

### Pitfall 5: Expo Metro Bundler Cannot Resolve Transitive Dependencies Installed by bun

**What goes wrong:**
bun's default `node_modules` installation strategy does not fully hoist all transitive dependencies to the root `node_modules/`. Some packages are stored under `node_modules/.bun/<package>/node_modules/`. Metro bundler (used by Expo) has a static resolution strategy: it looks in `node_modules/` at the root and at each package's own `node_modules/`, but does NOT look in `node_modules/.bun/`. Metro throws "Cannot find module 'promise'" or similar errors for deeply nested transitive dependencies. This was confirmed in bun issue #25870 with React Native as recently as January 2026.

**Why it happens:**
Metro's module resolution is Node-compatible but not identical to Node's algorithm. It does not follow symlinks into `.bun/` subdirectories. The npm/yarn node-modules linker fully hoists transitive deps to the root, so Metro never encountered this before. When bun changed from fully hoisting to semi-isolated installs, Metro was not updated to match.

**How to avoid:**
Add `publicHoistPattern` to `bunfig.toml` to force hoisting of React Native's critical transitive deps:

```toml
[install]
# Force hoist packages Metro needs to resolve
publicHoistPattern = ["*"]
```

If full hoisting causes conflicts, scope it: `publicHoistPattern = ["react", "react-native", "@babel/*", "metro*"]`

Additionally, ensure `packages/mobile/metro.config.js` uses `@expo/metro-config` (not a custom config) — from Expo SDK 52+, `@expo/metro-config` includes automatic monorepo support that adds workspace packages to Metro's `watchFolders` and `resolver.nodeModulesPaths`. Never write a manual Metro resolver when the Expo version provides one.

**Warning signs:**

- `expo start` throws "Cannot find module 'X'" for a package that IS in `node_modules/` (but only under `.bun/`)
- Build error only occurs after switching from yarn to bun — same code worked before migration
- `find node_modules -name "promise" -type d` returns only paths under `node_modules/.bun/` not at root
- `bun install --verbose` shows packages being installed to non-root locations

**Phase to address:** Phase 1 (Package manager migration). Verify Expo builds successfully under bun before proceeding to Turborepo integration. Use `bunfig.toml` publicHoistPattern as a preemptive fix.

---

### Pitfall 6: Turborepo Cannot Directly Orchestrate Cargo — Requires package.json Wrapper

**What goes wrong:**
Turborepo discovers tasks via `package.json` scripts. A `packages/api-server/` directory with only a `Cargo.toml` and no `package.json` is invisible to Turborepo — it will not appear in the workspace, and `turbo run build` will not trigger a Cargo build. Developers mistakenly add `packages/api-server` to the bun workspace `packages` glob and expect Turborepo to detect Rust projects natively.

**Why it happens:**
Turborepo is a JavaScript task runner. Multi-language support works only through the JavaScript conventions: the non-JS package must have a `package.json` with scripts that shell out to the actual build tool. This is explicitly documented in Turborepo's multi-language guide. There is no native Cargo resolver in turbo. The decision in PROJECT.md notes "Backend stays outside Yarn workspace" — this means the Cargo workspace is independent, but a thin `package.json` wrapper in `packages/api-server/` is still needed for Turborepo task orchestration.

**How to avoid:**
Create `packages/api-server/package.json` with wrapper scripts:

```json
{
  "name": "@decoded/backend",
  "private": true,
  "scripts": {
    "build": "cargo build --release",
    "dev": "cargo watch -x run",
    "test": "cargo test",
    "lint": "cargo clippy -- -D warnings",
    "check": "cargo check"
  }
}
```

Then declare the Cargo output artifacts in `turbo.json`:

```json
{
  "tasks": {
    "@decoded/backend#build": {
      "inputs": ["src/**/*.rs", "Cargo.toml", "Cargo.lock"],
      "outputs": ["target/release/decoded-backend"],
      "cache": true
    }
  }
}
```

Note: The `target/` directory is very large. Configure `.turbo/` to exclude it from remote cache if costs matter: `"outputs": ["target/release/decoded-backend"]` (binary only, not the full target dir).

Do NOT add `packages/api-server` to bun's `workspaces` field in root `package.json` — bun will attempt to install a `package.json`-declared workspace as a JS package. Keep the bun workspace limited to JS packages; Turborepo can orchestrate the backend `package.json` scripts separately via the `globalDependencies` or direct `--filter` flags.

**Warning signs:**

- `turbo run build` output shows only `@decoded/web` and `@decoded/shared` — backend is missing from the task graph
- `turbo ls` does not show `@decoded/backend` in the package list
- Running `turbo run build --filter=@decoded/backend` exits with "No tasks were run"
- `cargo build` target artifacts are missing after a successful `turbo run build`

**Phase to address:** Phase 3 (Turborepo integration). Define the `packages/api-server/package.json` wrapper before writing any `turbo.json` tasks — the task graph cannot be validated without it.

---

### Pitfall 7: Turborepo Cache Invalidation is Blind to Cargo.lock Changes by Default

**What goes wrong:**
Turborepo hashes the `inputs` glob to determine cache validity. If `inputs` in `turbo.json` does not explicitly include `Cargo.lock` and all relevant `.rs` files, Turborepo will serve a cache hit even after a dependency update (adding a new crate, bumping a version in `Cargo.toml`). The compiled binary is stale but Turborepo does not know it. This is the inverse of the more common "cache never hits" problem — here the cache hits when it should miss.

**Why it happens:**
Turborepo's default `inputs` is "all files not in `.gitignore`". The `target/` directory IS in `.gitignore`, so Turborepo excludes it from hashing (correct). However, if the developer does not explicitly list `Cargo.lock` in inputs for the backend task, and `Cargo.lock` is committed to git (which it should be for applications), then a `Cargo.lock` change may not be captured by the default glob. Default glob behavior depends on the exact Turborepo version — explicit `inputs` is always safer.

**How to avoid:**
Be explicit in `turbo.json` backend task inputs:

```json
"inputs": [
  "src/**/*.rs",
  "Cargo.toml",
  "Cargo.lock",
  "build.rs",
  "migrations/**/*.sql"
]
```

Include `migrations/**/*.sql` if the backend has Sea-ORM migrations — a migration change affects the binary behavior even without Rust code changes.

Test cache invalidation manually after setup: make a trivial change to `Cargo.toml` (add a comment), run `turbo run build`, confirm a cache miss. Then revert, run again, confirm a cache hit.

**Warning signs:**

- `turbo run build` shows `>>> FULL TURBO` (cache hit) after adding a new Cargo dependency
- Binary behavior differs from source code (old binary being served from cache)
- `turbo run build --verbosity=2` shows a hash that does not change after modifying `Cargo.lock`

**Phase to address:** Phase 3 (Turborepo integration). Validate cache invalidation behavior for the backend task explicitly before declaring phase complete.

---

### Pitfall 8: Environment Variable Naming Conflicts Between Frontend and Backend

**What goes wrong:**
Both the Next.js frontend and the Rust/Axum backend likely use `DATABASE_URL`, `PORT`, `JWT_SECRET`, `API_URL`, or similar names. In a unified monorepo dev environment where both processes start from the same shell session (e.g., `bun run dev` triggering both), one process's env var can bleed into the other if the dev script uses a shared `.env` file at the monorepo root. Worse: `NEXT_PUBLIC_*` variables leaked to the backend process (harmless), but backend-only secrets like database credentials leaking into the Next.js server process could be exposed to client components that do `process.env.DATABASE_URL`.

**Why it happens:**
Turborepo does NOT load `.env` files into task runtime by default — this is intentional. However, if the dev script uses `dotenv-cli` or a shell `source .env` at the root, all variables are exported to all child processes. The monorepo root is also a tempting place to put a "shared" `.env.local`, which then applies to every package.

**How to avoid:**

- Never create `.env.local` at the monorepo root. Each package has its own `.env.local` in `packages/web/.env.local` and `packages/api-server/.env.local`.
- Use `turbo.json` `env` and `dotEnv` fields per-task to declare which variables each task uses — this also correctly busts the Turborepo cache when env values change:

```json
{
  "tasks": {
    "@decoded/web#build": {
      "env": ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_API_URL"],
      "dotEnv": [".env.local"]
    },
    "@decoded/backend#dev": {
      "env": ["DATABASE_URL", "JWT_SECRET", "PORT"],
      "dotEnv": [".env.local"]
    }
  }
}
```

- If variable names conflict (both use `PORT`), rename to avoid ambiguity: backend uses `BACKEND_PORT`, frontend uses `WEB_PORT`.

**Warning signs:**

- `packages/web` build logs show `DATABASE_URL` or other backend secrets in the Next.js environment
- Rust binary panics on startup because `PORT=3000` (set for Next.js) conflicts with `PORT=8080` (expected by Axum)
- `NEXT_PUBLIC_*` variables appear in the backend process env (not harmful but indicates shared env loading)
- `.env.local` at the monorepo root (a file that should not exist)

**Phase to address:** Phase 3 (Unified dev environment) and Phase 4 (Docker/CI). Establish the per-package `.env.local` convention before wiring up the unified `bun dev` command.

---

### Pitfall 9: GSAP Club License Breaks Under bun's Private Registry Token Handling

**What goes wrong:**
The decoded-app uses GSAP 3.13 (confirmed in `CLAUDE.md`). GSAP Club/Business members install GSAP's premium plugins from a private npm registry (`https://npm.greensock.com`). The `.npmrc` token format for Yarn 4 uses `//npm.greensock.com/:_authToken=TOKEN`. bun reads `.npmrc` for token authentication as of v1.1.18+, but there is a confirmed bun bug (#9804) where tokens in a global `bunfig.toml` are not respected for scoped package installs when the project-level config is also present — tokens are silently ignored and install falls back to unauthenticated, causing a 401.

**Why it happens:**
bun's registry token resolution priority between `bunfig.toml`, `.npmrc`, and environment variables was inconsistent in early 1.3.x releases. The interaction with scoped private registries (like GSAP's) triggers a code path where the project-level config overrides the global config instead of merging.

**How to avoid:**
Use `bunfig.toml` at the project root (not global) for GSAP's registry:

```toml
[install.scopes]
"@gsap" = { registry = "https://npm.greensock.com", token = "$GSAP_TOKEN" }
```

Set `GSAP_TOKEN` as a CI secret and in `.env.local` (never commit the actual token). Validate with `bun install --dry-run` after setup to confirm the GSAP packages resolve from the private registry and not from npm.greensock.com fallback path. In CI, add the token to GitHub Actions secrets and reference via `${{ secrets.GSAP_TOKEN }}`.

**Warning signs:**

- `bun install` exits with `401 Unauthorized` or silently installs the free GSAP tier instead of club tier
- Premium GSAP plugins (`DrawSVGPlugin`, `MorphSVGPlugin`) are missing from `node_modules/@gsap/` after install
- `bun install --verbose` shows GSAP packages fetching from `registry.npmjs.org` instead of `npm.greensock.com`
- Build fails with "GSAP Club license required" runtime error

**Phase to address:** Phase 1 (Package manager migration). Verify GSAP Club install works under bun before declaring the migration complete — this is a blocking issue since the app uses GSAP extensively.

---

### Pitfall 10: Docker Build Context Path Must Change After Backend Moves to Monorepo Subdir

**What goes wrong:**
The backend currently has its own `Dockerfile` at the repo root, with `COPY . .` and `cargo build --release` assuming the context root is the backend project root. After `git subtree add --prefix=packages/api-server`, the backend source lives at `packages/api-server/`. If the old `Dockerfile` is simply copied to `packages/api-server/Dockerfile` without updating `COPY` paths, the build breaks: `COPY Cargo.toml .` copies the wrong file (the root `package.json` area), and multi-stage build `COPY --from=builder /app/target/...` paths are wrong.

Additionally, if CI uses `docker build -f packages/api-server/Dockerfile .` (context at repo root), all `COPY` statements must be prefixed with `packages/api-server/`. If CI uses `docker build -f Dockerfile packages/api-server/` (context at subdir), the `COPY` statements stay as-is but you cannot reference files from the monorepo root (e.g., shared config files).

**Why it happens:**
Docker's build context is the directory passed as the last argument (or `.`). All `COPY` paths are relative to that context root. Moving the Dockerfile to a subdirectory without updating the build context invocation silently uses the wrong files.

**How to avoid:**
Choose ONE consistent Docker context strategy for the backend and document it:

**Option A — Context at monorepo root** (recommended, allows future shared base images):

```bash
docker build -f packages/api-server/Dockerfile --build-arg BACKEND_DIR=packages/api-server .
```

Update `Dockerfile` COPY statements: `COPY packages/api-server/Cargo.toml ./Cargo.toml`

**Option B — Context at backend subdir** (simpler if no shared files needed):

```bash
docker build -f packages/api-server/Dockerfile packages/api-server/
```

No COPY path changes needed, but cannot access monorepo root files.

Update CI `docker-compose.yml` and GitHub Actions workflow `docker build` commands in the same commit as the Dockerfile move. Test the Docker build locally before merging.

**Warning signs:**

- `COPY failed: file not found in build context or excluded by .dockerignore` for `Cargo.toml`
- Docker build succeeds but produces a binary compiled from wrong source (check with `docker run --rm <image> ./decoded-backend --version`)
- CI Docker build passes but runtime crashes with "no such file" for static assets or migrations

**Phase to address:** Phase 4 (Docker and CI/CD integration). Update Dockerfile and CI workflow in the same PR as the git subtree merge to prevent a state where backend Docker builds are broken on main.

---

## Technical Debt Patterns

Shortcuts that seem reasonable at implementation time but create long-term problems.

| Shortcut                                                                | Immediate Benefit                                 | Long-term Cost                                                                           | When Acceptable                                                              |
| ----------------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Use `turbo prune --docker` with bun                                     | Smaller Docker layers, standard Turborepo pattern | Broken `--frozen-lockfile` installs, non-deterministic bun.lock (open bugs)              | Never until upstream fix is confirmed                                        |
| Put `.env.local` at monorepo root                                       | One file to manage all env vars                   | Backend secrets leak to Next.js build; frontend NEXT_PUBLIC vars leak to backend process | Never                                                                        |
| Skip `--squash` on subtree add, use it on subsequent pulls              | Cleaner commit history on the pulls               | git subtree cannot reconcile squash vs. full history; future pulls fail with conflicts   | Never — be consistent from first add                                         |
| Mix `bun install` and `yarn install` in different packages              | Keeps Expo working if bun breaks Metro            | Dual lockfiles (`yarn.lock` + `bun.lock`), dependency version drift between packages     | Only as temporary workaround during Phase 1; must be resolved before Phase 2 |
| Add all `packages/` to bun workspaces including backend                 | Single `bun install` does everything              | bun tries to resolve the Cargo workspace as a JS package; install errors                 | Never — keep Cargo workspace independent                                     |
| Global `will-change` equivalent: `outputs: ["target/**"]` in turbo.json | Turborepo caches all compilation intermediates    | `target/` can be 2–10 GB; remote cache costs explode                                     | Never — cache only the final binary `target/release/decoded-backend`         |

---

## Integration Gotchas

Common mistakes when connecting these specific tools together.

| Integration                            | Common Mistake                                                                                      | Correct Approach                                                                                                                                                   |
| -------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| bun + Turborepo                        | Using `bun create turbo` which sets up with Turbopack (causes TurbopackInternalError with bun)      | Initialize Turborepo manually with `bunx turbo init`; do not use Turbopack dev mode with bun                                                                       |
| turbo.json + Cargo                     | Declaring `"@decoded/backend"` as a task dependency without a `package.json` in `packages/api-server/` | Always create the thin `package.json` wrapper first; verify with `turbo ls`                                                                                        |
| bun workspace + `workspace:*` protocol | Changing `"@decoded/shared": "workspace:*"` to a version number during migration                    | bun supports `workspace:*` natively — keep as-is, no changes needed                                                                                                |
| git subtree + active development       | Doing the subtree add on `main` directly                                                            | Always do subtree operations on a dedicated feature branch; verify tree structure before merge to main                                                             |
| pre-push hooks + monorepo              | Assuming backend hooks still run after subtree merge                                                | Backend `.git/hooks/` is absorbed — hooks must be re-registered at monorepo root via lefthook or husky                                                             |
| GitHub Actions + mixed language CI     | Using `turbo run test` for both JS and Rust tests in a single job                                   | Use `dorny/paths-filter` to dispatch separate jobs: one for `packages/api-server/**` changes (runs `cargo test`), one for `packages/web/**` changes (runs `bun test`) |
| bun + GSAP private registry            | Putting GSAP token in global `~/.bunfig.toml`                                                       | Put token in project-level `bunfig.toml` using `$GSAP_TOKEN` env var reference                                                                                     |
| Turborepo + dotenv                     | Using `dotenv-cli` in root `dev` script to load all env vars                                        | Use per-task `dotEnv` in `turbo.json`; never load a shared root `.env`                                                                                             |

---

## Performance Traps

Patterns that work at small scale but create CI cost or slow build problems.

| Trap                                                                           | Symptoms                                                       | Prevention                                                                                      | When It Breaks                                                                           |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Caching entire `target/` directory in Turborepo remote cache                   | Cache upload takes 10+ minutes per CI run; storage costs spike | Output only the final binary: `"outputs": ["target/release/decoded-backend"]`                   | From first CI run — `target/` is typically 2–10 GB                                       |
| Running `cargo build` and `bun build` sequentially in CI                       | Total CI time = Rust compile + JS build (can be 15+ min)       | Use `turbo run build` with `--parallel` flag; Turborepo runs independent tasks concurrently     | Every CI run until parallelized                                                          |
| `bun install --frozen-lockfile` on a CI machine without a cache                | Full install on every push (slow, no reuse)                    | Cache `~/.bun/install/cache` in GitHub Actions using `actions/cache` with `bun.lock` as the key | Every CI run until cache is added                                                        |
| Metro bundle including all monorepo workspace packages in watchFolders         | `expo start` startup time grows with every package added       | Explicitly limit `watchFolders` to only `packages/mobile` and `packages/shared`                 | When `packages/api-server` is added to workspace — metro does not need to watch Rust source |
| Turborepo not configured for `env` vars → cache never busts on secret rotation | Stale build artifacts served after rotating DB password        | Declare all env vars that affect output in `turbo.json` `env` field per task                    | Any time a secret is rotated without code change                                         |

---

## Security Mistakes

Migration-specific security issues beyond general web security.

| Mistake                                                                                               | Risk                                               | Prevention                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Committing `packages/api-server/.env.local` with `DATABASE_URL` or `JWT_SECRET` during the subtree merge | Production credentials in git history, permanently | Add `packages/api-server/.env*` to root `.gitignore` immediately after subtree merge; audit with `git log --all --full-history -- "**/.env*"` |
| Exposing GSAP Club auth token in `bunfig.toml` committed to repo                                      | Token abuse, potential GSAP license violation      | Only `$ENV_VAR_REFERENCE` in committed `bunfig.toml`; actual token only in `.env.local` and CI secrets                                     |
| Backend `packages/api-server/Dockerfile` copying `.env.local` into image via `COPY . .`                  | Secrets baked into Docker image layer              | Add `.env*` to `packages/api-server/.dockerignore`; inject secrets at runtime via environment variables                                       |
| CI job with access to both frontend deploy secrets AND backend DB secrets                             | One compromised step affects both systems          | Separate GitHub Actions jobs for frontend deployment (Vercel token) and backend deployment (DB credentials) — different secret scopes      |

---

## "Looks Done But Isn't" Checklist

Things that appear complete in isolation but are broken in integration.

- [ ] **Lockfile migration verified:** `bun install` succeeds AND `bun run build` (packages/web) produces a working Next.js build — not just "install completes"
- [ ] **Expo build verified:** `cd packages/mobile && bun run ios` launches the Expo app without Metro "Cannot find module" errors
- [ ] **GSAP Club packages verified:** `ls node_modules/@gsap/` shows premium plugins after `bun install` (not just free tier)
- [ ] **Subtree path verified:** `git ls-tree HEAD packages/api-server/ | grep Cargo.toml` returns exactly one result at depth 1
- [ ] **Turborepo task graph verified:** `turbo ls` shows `@decoded/backend`, `@decoded/web`, `@decoded/shared`, `@decoded/mobile` in the package list
- [ ] **Backend task caches correctly:** Change a `.rs` file → `turbo run build --filter=@decoded/backend` = cache miss; revert → cache hit
- [ ] **Backend task does NOT cache across env changes:** Change `DATABASE_URL` → `turbo run build --filter=@decoded/backend` = cache miss
- [ ] **Hooks are running:** `git push` to a test branch prints cargo test output (not silent completion)
- [ ] **Docker build succeeds with correct binary:** `docker build -f packages/api-server/Dockerfile . && docker run --rm <image> ./decoded-backend --version` prints the correct version
- [ ] **No shared root .env.local:** `ls .env.local` returns "No such file" at monorepo root
- [ ] **CI path filtering works:** Push a change to only `packages/api-server/src/` → only the Rust CI job runs, not the full Next.js test suite

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall                                                  | Recovery Cost | Recovery Steps                                                                                                                                                   |
| -------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Yarn Berry lockfile not migrated cleanly (version drift) | MEDIUM        | Pin drifted packages in `package.json` with exact versions; run `bun install` again; full regression test of affected packages                                   |
| `turbo prune` corrupted `bun.lock` in CI                 | LOW           | Switch Docker pattern to full-copy (no `turbo prune`); update all Dockerfiles and CI configs; cache bun install separately                                       |
| git subtree with wrong prefix (files at wrong path)      | HIGH          | Cannot easily undo a merged subtree; safest recovery is `git revert <subtree-merge-commit>` then redo on the correct branch with verified prefix                 |
| Backend hooks silenced after subtree merge               | LOW           | Register hooks via `lefthook install` or manually copy hook scripts to `.git/hooks/`; add `cargo test` to CI as authoritative gate                               |
| Metro cannot resolve transitive deps                     | LOW           | Add `publicHoistPattern = ["*"]` to `bunfig.toml`; run `bun install` again; restart Metro with `--reset-cache`                                                   |
| GSAP private registry 401                                | LOW           | Verify `bunfig.toml` has project-level scope config (not global); confirm `$GSAP_TOKEN` env var is set; run `bun install --verbose` to trace registry resolution |
| Docker context wrong after subtree move                  | MEDIUM        | Update all `COPY` paths in `packages/api-server/Dockerfile` to match chosen context strategy; test locally before CI push                                           |
| Turborepo cache never invalidates for Cargo changes      | LOW           | Add `Cargo.lock` and `Cargo.toml` explicitly to `inputs` in `turbo.json`; run `turbo run build --force` once to repopulate cache                                 |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall                                              | Prevention Phase                                 | Verification                                                                     |
| ---------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- | ---------------------------------- |
| Yarn Berry → bun lockfile migration (no direct path) | Phase 1: Package manager migration               | `bun install` + full build pass; version diff of key packages                    |
| GSAP Club private registry under bun                 | Phase 1: Package manager migration               | `ls node_modules/@gsap/` shows premium plugins after `bun install`               |
| Expo Metro transitive dep resolution                 | Phase 1: Package manager migration               | `expo start` launches without module resolution errors                           |
| `workspace:*` protocol compatibility                 | Phase 1: Package manager migration               | `@decoded/shared` resolves correctly in both web and mobile workspaces           |
| git subtree "unrelated histories" error              | Phase 2: Backend subtree merge                   | `git ls-tree HEAD packages/api-server/                                              | grep Cargo.toml` returns one entry |
| git subtree prefix doubled/missing                   | Phase 2: Backend subtree merge                   | Manual tree inspection before merging feature branch to main                     |
| Backend pre-push hooks silenced                      | Phase 2: Backend subtree merge + Phase 3 dev env | `git push` prints cargo test output                                              |
| `justfile` relative paths broken                     | Phase 2: Backend subtree merge                   | `just build` from monorepo root succeeds                                         |
| Rust `package.json` wrapper missing for Turborepo    | Phase 3: Turborepo integration                   | `turbo ls` shows `@decoded/backend`                                              |
| Turborepo cache blind to `Cargo.lock` changes        | Phase 3: Turborepo integration                   | Cache miss after `Cargo.lock` modification confirmed manually                    |
| Environment variable naming conflicts                | Phase 3: Unified dev environment                 | No `DATABASE_URL` in Next.js process env; no `NEXT_PUBLIC_*` in Rust process env |
| `turbo prune` corrupts `bun.lock` in Docker          | Phase 4: Docker and CI/CD                        | Docker build succeeds with `--frozen-lockfile` using full-copy pattern           |
| Docker build context wrong after subtree move        | Phase 4: Docker and CI/CD                        | `docker build` produces correct binary; `--version` output verified              |
| CI not dispatching separate jobs per language        | Phase 4: Docker and CI/CD                        | Push Rust-only change → only Rust CI job triggers                                |

---

## Sources

- bun issue #21356: "Support migrating yarn.lock berry (v4) lockfiles to bun.lock" — HIGH confidence — [https://github.com/oven-sh/bun/issues/21356](https://github.com/oven-sh/bun/issues/21356)
- Turborepo issue #11007: "`bun` + `turbo prune` generate different `bun.lock` files" — HIGH confidence — [https://github.com/vercel/turborepo/issues/11007](https://github.com/vercel/turborepo/issues/11007)
- Turborepo issue #10782: "Pruning with --docker creates different bun lockfile each time" — HIGH confidence — [https://github.com/vercel/turborepo/issues/10782](https://github.com/vercel/turborepo/issues/10782)
- Turborepo issue #11266: "turbo prune corrupts bun.lock for GitHub dependencies" — HIGH confidence — [https://github.com/vercel/turborepo/issues/11266](https://github.com/vercel/turborepo/issues/11266)
- Turborepo issue #10038: "Beta support for Bun seems to be broken" (Turbopack + bun) — HIGH confidence — [https://github.com/vercel/turborepo/issues/10038](https://github.com/vercel/turborepo/issues/10038)
- bun issue #25870: "Metro bundler can't resolve transitive dependencies (react-native compatibility)" — HIGH confidence — [https://github.com/oven-sh/bun/issues/25870](https://github.com/oven-sh/bun/issues/25870)
- Expo SDK 54 changelog: official bun support added, `autolinkingModuleResolution` option — MEDIUM confidence — [https://expo.dev/changelog/sdk-54](https://expo.dev/changelog/sdk-54)
- Turborepo multi-language guide: package.json wrapper required for non-JS projects — HIGH confidence — [https://turborepo.dev/docs/guides/multi-language](https://turborepo.dev/docs/guides/multi-language)
- bun issue #9804: "global bunfig.toml token for custom scoped registry not respected" — MEDIUM confidence — [https://github.com/oven-sh/bun/issues/9804](https://github.com/oven-sh/bun/issues/9804)
- GSAP community: Bun private registry auth for Club members — MEDIUM confidence — [https://gsap.com/community/forums/topic/41053-support-for-pnpm-bun-for-club-members/](https://gsap.com/community/forums/topic/41053-support-for-pnpm-bun-for-club-members/)
- git subtree official documentation: `--allow-unrelated-histories`, prefix behavior — HIGH confidence — [https://manpages.ubuntu.com/manpages/trusty/en/man1/git-subtree.1.html](https://manpages.ubuntu.com/manpages/trusty/en/man1/git-subtree.1.html)
- Turborepo environment variables guide: `dotEnv` field, per-task env declaration — HIGH confidence — [https://turborepo.dev/docs/crafting-your-repository/using-environment-variables](https://turborepo.dev/docs/crafting-your-repository/using-environment-variables)
- dorny/paths-filter GitHub Actions action: path-based CI dispatch — HIGH confidence — [https://github.com/dorny/paths-filter](https://github.com/dorny/paths-filter)
- bun lockfile documentation: format evolution, `bun.lock` JSONC format (v1.2+) — HIGH confidence — [https://bun.com/docs/pm/lockfile](https://bun.com/docs/pm/lockfile)
- PROJECT.md: confirmed Yarn 4.9.2, node-modules linker, GSAP 3.13, Rust backend details — HIGH confidence (first-party)
- CLAUDE.md: confirmed packages structure (web, mobile, shared), workspace:\* usage — HIGH confidence (first-party)

---

_Pitfalls research for: Monorepo consolidation (Rust backend subtree merge + Yarn 4 → bun + Turborepo) — decoded-app v8.0_
_Researched: 2026-03-22_
