# Requirements: decoded-app

**Defined:** 2026-03-22
**Core Value:** 완전한 사용자 경험 — 모든 페이지가 실제 데이터로 동작하며 일관된 디자인 시스템 적용

## v8.0 Requirements

Requirements for Monorepo Consolidation & Bun Migration. Each maps to roadmap phases.

### Package Manager Migration

- [x] **PKG-01**: bun install이 packages/web, shared, mobile 모두에서 성공
- [x] **PKG-02**: Yarn 아티팩트 제거 (.yarnrc.yml, .yarn/, yarn.lock) 완료
- [x] **PKG-03**: bun.lock이 생성되고 git에 추적됨
- [ ] **PKG-04**: `bun run dev`로 Next.js dev 서버 정상 기동
- [ ] **PKG-05**: `bun run build`로 프로덕션 빌드 성공

### Backend Repository Merge

- [ ] **MERGE-01**: Backend 코드가 `packages/backend/`에 git subtree로 병합됨 (history 보존)
- [ ] **MERGE-02**: Backend Cargo build가 `packages/backend/` 내에서 독립 성공
- [ ] **MERGE-03**: Backend hooks/justfile 경로가 새 위치에 맞게 수정됨

### Build Orchestration

- [ ] **BUILD-01**: turbo.json이 설정되고 `bunx turbo run build`가 전체 빌드 실행
- [ ] **BUILD-02**: Backend에 thin package.json 래퍼가 추가되어 Turborepo가 Cargo 빌드를 오케스트레이션
- [ ] **BUILD-03**: `bunx turbo run dev`로 프론트+백 동시 기동
- [ ] **BUILD-04**: Turborepo 캐시가 JS 패키지에서 동작 (backend은 cache: false)

### Infrastructure

- [ ] **INFRA-01**: 통합 `.env.local.example`에 프론트+백 환경변수 문서화
- [ ] **INFRA-02**: Docker 컨텍스트가 `packages/backend/` 기준으로 동작
- [ ] **INFRA-03**: 루트 docker-compose.dev.yml로 전체 스택 기동 가능

### CI/CD

- [ ] **CICD-01**: GitHub Actions가 path-based 변경 감지로 프론트/백 분리 빌드
- [ ] **CICD-02**: Backend CI에서 cargo fmt + clippy + test 실행
- [ ] **CICD-03**: Frontend CI에서 bun install + turbo build + lint 실행

## Future Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### API Proxy Cleanup

- **PROXY-01**: Next.js API proxy 라우트를 직접 backend 호출로 전환 검토
- **PROXY-02**: 개발환경 next.config rewrites 설정으로 프록시 단순화

### Shared Types

- **TYPES-01**: Backend OpenAPI spec에서 TypeScript 타입 자동 생성
- **TYPES-02**: packages/shared에 생성된 타입 통합

### Production Deploy

- **DEPLOY-01**: Vercel + 별도 backend 서버 통합 배포 전략
- **DEPLOY-02**: 프로덕션 환경변수 관리 자동화

## Out of Scope

| Feature                    | Reason                                       |
| -------------------------- | -------------------------------------------- |
| Backend 코드 리팩토링      | 있는 그대로 병합, 코드 변경 없음             |
| API 프록시 라우트 제거     | 병합 후 별도 마일스톤에서 검토               |
| 프로덕션 배포 전략 변경    | 현재 배포 방식 유지, 추후 결정               |
| Turborepo remote caching   | Vercel 연동 필요, 별도 설정                  |
| Backend test coverage 개선 | 기존 테스트 그대로 유지                      |
| turbo prune Docker 최적화  | bun + turbo prune 버그로 불가 (이슈 추적 중) |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase  | Status  |
| ----------- | ------ | ------- |
| PKG-01      | m10-01 | Complete |
| PKG-02      | m10-01 | Complete |
| PKG-03      | m10-01 | Complete |
| PKG-04      | m10-01 | Pending |
| PKG-05      | m10-01 | Pending |
| MERGE-01    | m10-02 | Pending |
| MERGE-02    | m10-02 | Pending |
| MERGE-03    | m10-02 | Pending |
| BUILD-01    | m10-03 | Pending |
| BUILD-02    | m10-03 | Pending |
| BUILD-03    | m10-03 | Pending |
| BUILD-04    | m10-03 | Pending |
| INFRA-01    | m10-03 | Pending |
| INFRA-02    | m10-04 | Pending |
| INFRA-03    | m10-04 | Pending |
| CICD-01     | m10-04 | Pending |
| CICD-02     | m10-04 | Pending |
| CICD-03     | m10-04 | Pending |

**Coverage:**

- v8.0 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---

_Requirements defined: 2026-03-22_
_Last updated: 2026-03-22 — traceability completed (18/18 mapped to m10-01 through m10-04)_
