# Backend Developer Onboarding — decoded-monorepo

## 레포 변경사항

기존 `decodedcorp/backend` 레포가 `decoded-monorepo`의 `packages/api-server/`로 subtree 병합되었습니다.
Git history는 보존되어 있습니다.

**새 레포**: https://github.com/decodedcorp/decoded-monorepo

## 구조

```
decoded-monorepo/
├── packages/
│   ├── web/          ← Next.js 16 프론트엔드 (bun workspace)
│   ├── shared/       ← 공유 타입/쿼리 (bun workspace)
│   ├── mobile/       ← Expo 54 (bun workspace)
│   ├── api-server/   ← Rust/Axum API (Cargo; thin package.json for Turborepo)
│   └── ai-server/    ← Python AI / gRPC (Poetry; former decoded-ai)
├── package.json      ← bun workspaces + Turborepo 패키지 엔트리
├── turbo.json        ← Turborepo (build/dev/lint/test)
└── bunfig.toml       ← bun 설정
```

## 백엔드 개발자가 알아야 할 것

### 1. API 서버는 Cargo 중심

- `packages/api-server/`는 루트 workspaces에 **이름만 올라가 있어** Turborepo가 `build`/`lint` 등을 볼 수 있게 한 것이다. **Rust 의존성은 여전히 Cargo**로 관리한다.
- 빌드: `cd packages/api-server && cargo build`
- `bun install`은 이 패키지에 npm 의존성을 추가하지 않는다(빈 메타 패키지).

### 2. 빌드 & 실행

```bash
# 클론
git clone https://github.com/decodedcorp/decoded-monorepo.git
cd decoded-monorepo/packages/api-server

# 기존과 동일
cargo build
cargo run
cargo test

# just 사용 (기존과 동일)
just dev
```

### 3. 루트에서 실행하는 경우

```bash
# 루트 스크립트 (권장 이름)
bun run build:api-server   # = cd packages/api-server && cargo build --release
bun run dev:api-server     # = cd packages/api-server && cargo watch -x run
# 하위 호환
bun run build:backend      # → build:api-server
bun run dev:backend        # → dev:api-server
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
| 경로 | `/` (루트) | `packages/api-server/` |
| 프론트엔드 | 별도 레포 | 같은 레포 `packages/web/` |
| PR | 백엔드 전용 | 모노레포 통합 PR |

### 6. Git 워크플로우

```bash
# 백엔드만 작업하는 경우
git checkout -b feat/backend-xxx
cd packages/api-server
# 작업 ...
git add packages/api-server/
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

- `packages/api-server/README.md` — 기술 스택, 빠른 시작
- `packages/api-server/REQUIREMENT.md` — 요구사항 명세
- `packages/api-server/AGENT.md` — 개발 가이드
- `packages/api-server/docs/TESTING.md` — 테스트 가이드
- `packages/api-server/docs/GIT_WORKFLOW.md` — Git 훅, 브랜치 정책
