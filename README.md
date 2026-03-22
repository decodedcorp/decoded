# decoded-monorepo

Image/item discovery and curation platform with behavioral intelligence, editorial magazine system, virtual try-on, and AI-powered item detection.

## Architecture

```
decoded-monorepo/
├── packages/
│   ├── web/        Next.js 16 — frontend app
│   ├── shared/     Shared types, hooks, Supabase queries
│   ├── mobile/     Expo 54 — React Native app
│   └── backend/    Rust/Axum — API server
├── turbo.json      Turborepo task orchestration
├── bunfig.toml     bun config
└── package.json    Workspaces root
```

## Tech Stack

| Layer | Stack |
|-------|-------|
| **Frontend** | Next.js 16.2, React 19.2, TypeScript 5.9, Tailwind CSS 3.4, Zustand 5, React Query 5 |
| **Backend** | Rust, Axum 0.8, SeaORM 1.1, tokio, Meilisearch |
| **Database** | Supabase (PostgreSQL), Cloudflare R2 (storage) |
| **Mobile** | Expo 54, React Native |
| **Build** | Turborepo, bun 1.3+, Node.js 22 LTS |
| **Testing** | Playwright |
| **Linting** | ESLint 10, Prettier 3.6 |

## Quick Start

### Prerequisites

- [bun](https://bun.sh) 1.3+
- [Rust](https://rustup.rs) (for backend)

### Frontend (packages/web)

```bash
# Install dependencies
bun install

# Set up environment variables
cp packages/web/.env.local.example packages/web/.env.local
# Edit .env.local with your Supabase credentials

# Start dev server
bun run dev
```

### Backend (packages/backend)

```bash
cd packages/backend

# Build
cargo build

# Run server
cargo run
```

### Full Monorepo

```bash
# Build all packages (via Turborepo)
bun run build

# Lint all packages
bun run lint
```

## Packages

### `packages/web` — Next.js Frontend

Main web application with:
- Image discovery and curation grid
- AI-powered item detection and fashion scan
- Editorial magazine system with curated content
- Virtual try-on (VTON) via GCP
- Social actions (like, save, comment)
- Admin dashboard (AI cost, audit, pipeline monitoring)
- Design system v2.0 (36 components)
- OAuth auth (Kakao, Google, Apple) via Supabase

### `packages/backend` — Rust API Server

REST API built with:
- Axum web framework
- SeaORM + PostgreSQL
- Meilisearch for search
- Cloudflare R2 for storage
- JWT authentication
- OpenAPI spec generation

### `packages/shared` — Shared Library

Cross-package shared code:
- TypeScript types and interfaces
- Supabase client and queries
- Shared hooks

### `packages/mobile` — Expo App

React Native mobile app (Expo 54).

## Development

```bash
bun run dev          # Dev server (all packages via Turborepo)
bun run build        # Production build
bun run lint         # ESLint

cd packages/backend
cargo build          # Build Rust backend
cargo test           # Run backend tests
```

## Environment Variables

See [`packages/web/.env.local.example`](packages/web/.env.local.example) for required variables.

## License

Private
