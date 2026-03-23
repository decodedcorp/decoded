# decoded-monorepo

Image/item discovery and curation platform with behavioral intelligence, editorial magazine system, virtual try-on, and AI-powered item detection.

## Layout

| Path | Role |
|------|------|
| `packages/web` | Next.js 16 app (main product UI) |
| `packages/shared` | Shared TypeScript types, Supabase queries, hooks |
| `packages/mobile` | Expo 54 React Native app |
| `packages/api-server` | Rust (Axum) — HTTP API, gRPC **client** to the AI service |
| `packages/ai-server` | Python (uv) — inference, metadata, gRPC **server** (legacy repo: decoded-ai) |

## Architecture

```text
decoded-monorepo/
├── packages/
│   ├── web/          Next.js 16 — frontend app
│   ├── shared/       Shared types, hooks, Supabase queries
│   ├── mobile/       Expo 54 — React Native app
│   ├── api-server/   Rust/Axum — REST + gRPC client to AI
│   └── ai-server/    Python — inference, gRPC (uv)
├── turbo.json        Turborepo task orchestration
├── bunfig.toml       bun config
└── package.json      Workspaces root (bun + thin wrappers for api/ai-server)
```

## Tech Stack

| Layer | Stack |
|-------|-------|
| **Frontend** | Next.js 16.2, React 19.2, TypeScript 5.9, Tailwind CSS 3.4, Zustand 5, React Query 5 |
| **API** | Rust, Axum 0.8, SeaORM 1.1, tokio, Meilisearch |
| **AI / gRPC** | Python 3.11+, uv, FastAPI, gRPC, Redis, ARQ (see `packages/ai-server`) |
| **Database** | Supabase (PostgreSQL), Cloudflare R2 (storage) |
| **Mobile** | Expo 54, React Native |
| **Build** | Turborepo, bun 1.3+, Node.js 22 LTS |
| **Testing** | Playwright (web), `cargo test` (api-server), `pytest` (ai-server) |
| **Linting** | ESLint 10, Prettier 3.6, `cargo clippy` / `flake8` where configured |

## Quick Start

### Prerequisites

- [bun](https://bun.sh) 1.3+
- [Rust](https://rustup.rs) (for `packages/api-server`)
- [uv](https://docs.astral.sh/uv/) (for `packages/ai-server`)

### Install (repo root)

```bash
git clone https://github.com/decodedcorp/decoded.git
cd decoded
bun install
```

### Frontend (`packages/web`)

```bash
cp packages/web/.env.local.example packages/web/.env.local
# Edit .env.local with your Supabase credentials

bun run dev
# or: bun run dev:web
```

### Rust API (`packages/api-server`)

```bash
cd packages/api-server
cp .env.example .env   # or .env.dev — see package docs
cargo build
cargo run
```

From repo root: `bun run dev:api-server` (uses `cargo watch`).  
Legacy aliases: `bun run dev:backend` / `bun run build:backend` → same as `*:api-server`.

### Python AI (`packages/ai-server`)

```bash
cd packages/ai-server
uv sync
uv run python -m src.main
```

From repo root: `bun run dev:ai-server` (requires `uv` on PATH).

Docker Compose lives under `packages/ai-server/`; **build context** is that directory. See [`packages/ai-server/README.md`](packages/ai-server/README.md).

### Monorepo scripts

```bash
bun run dev              # JS packages via Turborepo
bun run dev:api-server   # Rust API (cargo watch)
bun run dev:ai-server    # Python AI (uv)
bun run build            # Production build (Turborepo)
bun run lint             # Lint tasks where defined
```

## Packages (summary)

### `packages/web` — Next.js frontend

Image discovery, editorial magazine, VTON, social actions, admin, design system v2.0, OAuth via Supabase.

### `packages/ai-server` — Python AI / gRPC

Inference, link/image metadata, editorial pipelines, gRPC. **uv** Python project; not published to npm.

### `packages/api-server` — Rust API

REST API, SeaORM, Meilisearch, R2, JWT, OpenAPI. **Cargo** workspace; `package.json` exists only for Turborepo scripts.

### `packages/shared` — Shared library

Types, Supabase client/queries, hooks for web and mobile.

### `packages/mobile` — Expo app

Expo 54 React Native.

## Documentation

- **[CLAUDE.md](CLAUDE.md)** — conventions, routes, commands, design system
- **[docs/BACKEND-ONBOARDING.md](docs/BACKEND-ONBOARDING.md)** — API server in the monorepo
- **`packages/api-server/`** — Rust API docs, ADRs, `AGENTS.md`
- **`packages/ai-server/README.md`** — AI service architecture and Docker

## Environment variables

- Web: [`packages/web/.env.local.example`](packages/web/.env.local.example)
- API: `packages/api-server/.env.example` (copy to `.env` / `.env.dev` as needed)
- AI: `packages/ai-server/.env.example` and `.dev.env` (see `.gitignore` in that package)

### GitHub Actions (Telegram)

Workflow [`.github/workflows/telegram-notify.yml`](.github/workflows/telegram-notify.yml) posts to Telegram on `push` to `main`, new PRs (`opened`), new issues (`opened`), and manual `workflow_dispatch`. Add these **repository secrets**: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.

## License

Private
