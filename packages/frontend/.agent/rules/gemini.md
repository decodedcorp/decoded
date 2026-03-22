---
trigger: always_on
glob:
description: decoded-app 프로젝트 개발 가이드라인
---

# decoded-app Development Guidelines

## Overview
Modern web application for image/item discovery and curation with advanced filtering, detail views, and scroll animations. Features AI-powered item detection, social feed, and comprehensive design system (v2.0).

## Tech Stack
- **Frontend**: Next.js 16.0.7, React 18.3.1, TypeScript 5.9.3
- **Styling**: Tailwind CSS 3.4.18, CVA 0.7.1, tailwind-merge 3.4.0
- **State**: Zustand 4.5.7, React Query 5.90.11, React Query DevTools 5.91.1
- **Backend**: Supabase 2.86.0, Auth Helpers 0.15.0
- **Animations**: GSAP 3.13.0, Motion 12.23.12, Lenis 1.3.15, @use-gesture/react 10.3.1
- **UI Libraries**: Lucide React 0.555.0, React Icons 5.5.0, Radix UI, Sonner 2.0.7
- **3D/Media**: Three.js 0.167.1, browser-image-compression 2.0.2
- **Theme**: next-themes 0.4.6
- **Linting**: ESLint 9.39.1 (flat config), Prettier 3.6.2
- **Package Manager**: Yarn 4.9.2 (node-modules linker)

## Project Structure
```text
packages/web/
├── app/                    # Next.js App Router pages
│   ├── @modal/             # Parallel route for modals
│   ├── api/v1/             # API routes (posts, users, categories)
│   ├── explore/            # Explore grid view
│   ├── feed/               # Social feed
│   ├── images/             # Image discovery & detail
│   ├── login/              # OAuth authentication
│   ├── posts/              # Post detail
│   ├── profile/            # User profile
│   ├── request/            # Upload & AI detection flow
│   ├── search/             # Full-screen search overlay
│   └── lab/                # Experimental features
├── lib/
│   ├── api/                # API client functions
│   ├── components/         # Feature-based components
│   │   ├── ui/             # Primitive UI (Card, Button, BottomSheet)
│   │   ├── design-system/  # v2.0 Design System
│   │   ├── main/           # Home page sections
│   │   ├── search/         # Search overlay & results
│   │   ├── detail/         # Image/post detail views
│   │   ├── request/        # Upload flow components
│   │   ├── explore/        # Explore grid
│   │   ├── feed/           # Feed components
│   │   ├── profile/        # Profile sections
│   │   └── auth/           # Auth components
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # Zustand state stores
│   ├── supabase/           # Supabase client + queries
│   └── utils/              # Utility functions
└── __tests__/              # Test files

packages/shared/            # Shared types, hooks, utilities
specs/                      # Feature specifications
docs/                       # Documentation
.planning/                  # GSD workflow artifacts
```

## Key File Locations

| Area | Location | Description |
|------|----------|-------------|
| **Auth** | `lib/stores/authStore.ts` | OAuth (Kakao, Google, Apple) + session |
| **Search State** | `lib/stores/searchStore.ts` | Search query, filters, results |
| **API Client** | `lib/api/` | Backend API calls (posts, users, categories) |
| **API Routes** | `app/api/v1/` | Next.js API proxy & server logic |
| **Supabase** | `lib/supabase/queries/` | DB queries (server/client) |
| **Design System** | `lib/design-system/` | v2.0 components & tokens |
| **Components** | `lib/components/` | Feature components |
| **Hooks** | `lib/hooks/` | Custom hooks |
| **Stores** | `lib/stores/` | Zustand stores |

## Commands
```bash
yarn dev              # Development server
yarn build            # Production build
yarn start            # Start production server
yarn lint             # ESLint
yarn format           # Prettier formatting
yarn format:check     # Check Prettier formatting
```

## Code Style
- TypeScript strict mode enabled
- ESLint + Prettier applied
- Conventional Commits format

## Important Notes
- Uses Yarn 4 with node-modules linker - use `yarn` commands (not npm)
- ESLint 9 with flat config (eslint.config.mjs)
- Environment variables: .env.local (gitignored, see .env.local.example)
- Supabase integration required for data/auth

## Codebase Documentation

상세한 코드베이스 분석은 `.planning/codebase/`에서 확인:

| 문서 | 내용 |
|------|------|
| [STACK.md](.planning/codebase/STACK.md) | 기술 스택, 의존성, 설정 |
| [ARCHITECTURE.md](.planning/codebase/ARCHITECTURE.md) | 시스템 아키텍처, 레이어, 데이터 흐름 |
| [STRUCTURE.md](.planning/codebase/STRUCTURE.md) | 디렉토리 구조, 파일 위치 |
| [CONVENTIONS.md](.planning/codebase/CONVENTIONS.md) | 코딩 컨벤션, 네이밍 패턴 |
| [TESTING.md](.planning/codebase/TESTING.md) | 테스트 구조, 패턴 |
| [INTEGRATIONS.md](.planning/codebase/INTEGRATIONS.md) | 외부 서비스, API 연동 |
| [CONCERNS.md](.planning/codebase/CONCERNS.md) | 기술 부채, 주의 사항 |

## Documentation
- **[docs/README.md](docs/README.md)** - 문서 인덱스
- **[.planning/](.planning/)** - GSD 워크플로우 아티팩트
- docs/adr/ - Architecture Decision Records
- docs/api/ - API integration guides
- docs/ai-playbook/ - AI tool usage guides
- docs/design-system/ - Design tokens

## Antigravity Rules
- **[.antigravity/rules.md](file:///Users/kiyeol/development/decoded/decoded-app/.antigravity/rules.md)** - Autonomous execution policy and language preferences.
