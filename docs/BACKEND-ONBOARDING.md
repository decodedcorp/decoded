# Backend Developer Onboarding — decoded-monorepo

## 레포 변경사항

기존 `decodedcorp/backend` 레포가 `decoded-monorepo`의 `packages/backend/`로 subtree 병합되었습니다.
Git history는 보존되어 있습니다.

**새 레포**: https://github.com/decodedcorp/decoded-monorepo

## 구조

```
decoded-monorepo/
├── packages/
│   ├── web/        ← Next.js 16 프론트엔드 (bun workspace)
│   ├── shared/     ← 공유 타입/쿼리 (bun workspace)
│   ├── mobile/     ← Expo 54 (bun workspace)
│   └── backend/    ← Rust/Axum API (Cargo workspace, 독립 빌드)
├── package.json    ← bun workspaces (web, shared, mobile만 포함)
├── turbo.json      ← Turborepo (build/dev/lint/test)
└── bunfig.toml     ← bun 설정
```

## 백엔드 개발자가 알아야 할 것

### 1. 백엔드는 독립적

- `packages/backend/`는 bun workspace에 **포함되지 않음**
- Cargo workspace로 독립 빌드: `cd packages/backend && cargo build`
- 프론트엔드 의존성(`bun install`)과 무관하게 동작

### 2. 빌드 & 실행

```bash
# 클론
git clone https://github.com/decodedcorp/decoded-monorepo.git
cd decoded-monorepo/packages/backend

# 기존과 동일
cargo build
cargo run
cargo test

# just 사용 (기존과 동일)
just dev
```

### 3. 루트에서 실행하는 경우

```bash
# Turborepo 경유 (turbo.json에 등록됨)
bun run build:backend   # = cd packages/backend && cargo build --release
bun run dev:backend     # = cd packages/backend && cargo watch -x run
```

### 4. 변경되지 않은 것

- Cargo.toml, Cargo.lock — 동일
- src/ 구조 — 동일
- justfile — 동일
- docker/ — 동일
- .env 설정 — 동일
- pre-push hook — 동일 (cargo-deny, cargo-tarpaulin)

### 5. 변경된 것

| 항목 | 이전 | 현재 |
|------|------|------|
| 레포 | `decodedcorp/backend` | `decodedcorp/decoded-monorepo` |
| 경로 | `/` (루트) | `packages/backend/` |
| 프론트엔드 | 별도 레포 | 같은 레포 `packages/web/` |
| PR | 백엔드 전용 | 모노레포 통합 PR |

### 6. Git 워크플로우

```bash
# 백엔드만 작업하는 경우
git checkout -b feat/backend-xxx
cd packages/backend
# 작업 ...
git add packages/backend/
git commit -m "feat(backend): ..."
git push -u origin feat/backend-xxx
# PR 생성
```

### 7. 사전 요구사항

- **Rust 1.81+** (rustup)
- **cargo-deny**, **cargo-tarpaulin** (pre-push hook)
- **sea-orm-cli** (마이그레이션)
- **just** (선택, 편의 명령)
- **Docker** (선택, 로컬 DB/Meilisearch)

프론트엔드 빌드가 필요 없다면 `bun install`은 실행하지 않아도 됩니다.

## 기존 문서

백엔드 상세 문서는 기존과 동일한 위치에 있습니다:

- `packages/backend/README.md` — 기술 스택, 빠른 시작
- `packages/backend/REQUIREMENT.md` — 요구사항 명세
- `packages/backend/AGENT.md` — 개발 가이드
- `packages/backend/docs/TESTING.md` — 테스트 가이드
- `packages/backend/docs/GIT_WORKFLOW.md` — Git 훅, 브랜치 정책
