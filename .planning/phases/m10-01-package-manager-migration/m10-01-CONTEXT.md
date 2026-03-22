# Phase m10-01: Package Manager Migration - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Yarn 4를 bun으로 완전 교체한다 — lockfile, workspace 설정, scripts, 캐시 전부 전환. packages/web, packages/shared, packages/mobile 모두 bun으로 동작하며, dev 서버와 프로덕션 빌드가 정상 작동한다. Turborepo, backend 병합, CI/CD는 이후 페이즈에서 처리.

</domain>

<decisions>
## Implementation Decisions

### 마이그레이션 전략

- **Clean install 방식** — yarn.lock 삭제 후 bun install로 새로 설치 (pnpm 중간 단계 불필요)
- 마이그레이션 전 `yarn list --json`으로 현재 의존성 버전 스냅샷 기록 (문제 시 비교용)
- **별도 브랜치** (feat/bun-migration)에서 진행. 실패 시 브랜치 삭제로 깨끗한 롤백

### Yarn 아티팩트 처리

- `.yarnrc.yml` 삭제
- `.yarn/` 디렉토리 전체 삭제 (캐시 zip 파일들 포함)
- `yarn.lock` 삭제
- root `package.json`의 `"packageManager"` → `"bun@1.3.10"`으로 변경

### Workspace 설정

- `"workspaces": ["packages/*"]` glob → `["packages/web", "packages/shared", "packages/mobile"]` 명시적 리스트로 변경
- 이유: 이후 페이즈에서 packages/backend (Rust) 추가 시 bun workspace에 포함되지 않도록 보장
- `bunfig.toml` 생성 — node-modules linker + publicHoistPattern (Expo Metro 호환성)

### Expo/Mobile 처리

- packages/mobile (Expo 54)도 함께 bun 전환 (제외하지 않음)
- mobile은 실제 사용 중인 앱
- Metro bundler 호환성 이슈 시 bunfig.toml의 publicHoistPattern으로 대응

### 문서 업데이트

- CLAUDE.md + README의 yarn 명령어를 bun으로 변경
- package.json scripts (dev, build, lint, format 등) 변경 없음 (이미 bun 호환)

### Claude's Discretion

- bunfig.toml의 구체적 설정값
- .gitignore 업데이트 범위
- 의존성 버전 충돌 시 해결 방법

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 마이그레이션 리서치

- `.planning/research/STACK.md` — bun 버전, lockfile 형식, pnpm workaround 불필요 결론
- `.planning/research/PITFALLS.md` — Expo Metro 호환성 (publicHoistPattern), GSAP 레지스트리 (해당 없음 확인)
- `.planning/research/SUMMARY.md` — 전체 리서치 종합

### 프로젝트 설정

- `package.json` (root) — 현재 workspaces, packageManager 설정
- `.yarnrc.yml` — 삭제 대상 Yarn 설정
- `packages/web/package.json` — web 의존성 목록
- `packages/shared/package.json` — shared 의존성 (peer deps)
- `packages/mobile/package.json` — mobile/Expo 의존성

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- 없음 — 이 페이즈는 패키지 매니저 인프라 변경이므로 기존 코드 재사용 없음

### Established Patterns

- **node-modules linker**: 현재 Yarn 4도 node-modules 방식 사용 → bun 전환 시 동일 패턴 유지
- **workspace:\* 프로토콜**: packages/web, packages/mobile 모두 `"@decoded/shared": "workspace:*"` 사용 → bun도 동일 프로토콜 지원
- **scripts**: dev/build/lint 등 scripts에 yarn 하드코딩 없음 → bun 전환 시 수정 불필요

### Integration Points

- **root package.json scripts**: `"yarn workspace @decoded/web dev"` → `"bun run --filter @decoded/web dev"` 형태로 변경 필요
- **CI workflows**: 현재 GitHub Actions에서 yarn 사용 시 bun으로 변경 필요 (이후 m10-04에서 처리)

</code_context>

<specifics>
## Specific Ideas

- GSAP은 공개 npm 패키지 사용 확인됨 — Club 프라이빗 레지스트리 우려 해소
- Clean install 방식 선택으로 pnpm 중간 단계 불필요 — 더 간단한 전환

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: m10-01-package-manager-migration_
_Context gathered: 2026-03-22_
