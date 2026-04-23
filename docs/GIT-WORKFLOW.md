# Git Workflow

decoded 팀 git 워크플로우 가이드. 이 문서가 source of truth입니다.

## 브랜치 네이밍

| 접두사 | 용도 | 예시 |
|--------|------|------|
| `feat/` | 새 기능 | `feat/vton-modal` |
| `fix/` | 버그 수정 | `fix/infinite-scroll-crash` |
| `docs/` | 문서 | `docs/api-guide` |
| `refactor/` | 리팩토링 | `refactor/auth-store` |
| `chore/` | 유지보수 | `chore/upgrade-eslint-10` |
| `test/` | 테스트 추가 | `test/usePosts-unit` |
| `ci/` | CI/CD 변경 | `ci/frontend-pre-push` |

## 커밋 컨벤션

Conventional Commits 형식을 사용합니다.

```
type(scope): description
```

### 타입

| 타입 | 설명 |
|------|------|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `docs` | 문서 변경 |
| `refactor` | 리팩토링 (동작 변경 없음) |
| `test` | 테스트 추가/수정 |
| `chore` | 빌드, 의존성, 설정 |
| `ci` | CI/CD 변경 |
| `perf` | 성능 개선 |
| `style` | 포맷팅 (동작 변경 없음) |

### Scope

패키지 또는 기능 이름: `web`, `api-server`, `ai-server`, `shared`, `auth`, `feed`, `vton` 등

### 예시

```
feat(web): add virtual try-on modal with lazy loading
fix(api-server): handle null user_id in badge calculation
docs(shared): update Supabase query usage guide
chore(web): upgrade React Query to v5.90
ci: add frontend pre-push hook with ESLint and tsc
```

## PR 컨벤션

### 제목

커밋 컨벤션과 동일한 형식:
```
type(scope): short description
```

### 설명 템플릿

```markdown
## Summary
- 변경 사항 1-3줄 요약

## Changes
- 구체적 변경 내용 리스트

## Test Plan
- [ ] 테스트 항목 1
- [ ] 테스트 항목 2
```

## Pre-push 체크

### 설치 (최초 1회)

```bash
just hook
# 또는: git config core.hooksPath .githooks
```

### 체크 항목

| 패키지 | 체크 | 기본 동작 |
|--------|------|-----------|
| **web** | ESLint → Prettier → TypeScript | 항상 실행 |
| **api-server** | fmt → clippy → test → deny → tarpaulin → migration-sync | 항상 실행 |
| **ai-server** | flake8 → black → pytest | `RUN_AI_SERVER_CI=1`일 때만 |

### 스킵 (긴급 시)

```bash
SKIP_FE_CI=1 git push              # web만 스킵
SKIP_AI_SERVER_CI=1 git push        # ai-server만 스킵
SKIP_FE_CI=1 SKIP_AI_SERVER_CI=1 git push  # 둘 다 스킵
```

### 수동 실행

```bash
bun run ci:local        # 전체 (push 훅과 동일)
just ci-web             # web만
```

## 브랜치 전략

```
feature/* ──PR──▶ dev ──PR──▶ main (production)
fix/*     ──PR──▶ dev ──PR──▶ main
hotfix/*  ──PR──▶ main (긴급 시에만)
```

| 브랜치 | 역할 | push 정책 |
|--------|------|-----------|
| `main` | 프로덕션. Vercel 자동 배포 | **직접 push 금지**, PR 머지만 허용 |
| `dev` | 통합 개발 브랜치 | 팀원 push 허용, feature 브랜치 PR 머지 |
| `feature/*`, `fix/*` 등 | 작업 브랜치 | dev에서 분기, dev로 PR |

### 워크플로우

1. `dev`에서 작업 브랜치 생성: `git checkout -b feat/<issue#>-xxx dev`
2. **즉시 Draft PR 생성** — 프로젝트 보드가 자동으로 **In Progress** 전환
3. 작업 완료 → Draft 해제 → 리뷰 요청
4. 리뷰 통과 후 `dev`에 머지 → 프로젝트 보드 자동 **Done** + 이슈 close
5. 릴리스 준비 시 `dev` → `main` PR 생성
6. CI 체크 통과 + 리뷰 후 `main`에 머지 → Vercel 자동 배포

## 프로젝트 보드 자동 추적

[decoded-monorepo 프로젝트 #3](https://github.com/orgs/decodedcorp/projects/3)의 활성 자동화:

| 트리거 | 전환 |
|--------|------|
| 신규 이슈/PR 생성 | Todo로 자동 추가 |
| **PR이 이슈에 링크됨** (`Closes #N`) | **In Progress** |
| PR 머지 | Done + 이슈 자동 close |

### 중요

- **브랜치 생성만으로는 전환 안 됨** — Draft PR 필요
- 브랜치 이름에 이슈 번호 포함 권장: `feat/27-follow-api`
- 리뷰 전이라도 Draft PR을 먼저 올려 진행 가시화

### 숏컷: `scripts/start-issue.sh`

```bash
./scripts/start-issue.sh 27
# → feat/27-<이슈-슬러그> 브랜치 생성
# → 빈 commit으로 초기화
# → Draft PR 생성 (Closes #27 포함)
# → 프로젝트 보드가 자동으로 In Progress 전환
```

`type`을 fix/chore 등으로 바꾸려면: `./scripts/start-issue.sh 27 fix`

### 긴급 핫픽스

프로덕션 장애 시에만 `hotfix/*` → `main` 직접 PR 허용. 머지 후 `dev`에도 반영 필수.

## Main 브랜치 보호

- **직접 push 금지**: pre-push 훅이 `main`/`master` push를 차단
- **PR 머지만 허용**: `dev` → `main` PR만 허용 (긴급 hotfix 제외)
- **GitHub branch protection**: CI checks required

## 리뷰 프로세스

1. 작업 브랜치에서 개발 완료
2. `/review` 실행 — Claude code-reviewer로 자동 리뷰
3. P0(차단 이슈) 모두 해결
4. `dev`로 PR 생성
5. 팀원 리뷰 + 승인 후 머지
6. 릴리스 시 `dev` → `main` PR 생성 및 머지

## 릴리스 플로우

`dev` → `main` PR 머지 시 Vercel 자동 배포. 별도 릴리스 브랜치 없음.

## 워크트리 (병렬 피처 작업)

여러 피처/버그를 동시에 진행하거나, 장시간 dev 서버 없이 코드만 만지는 경우 [git worktree](https://git-scm.com/docs/git-worktree)를 사용.

### 기본 사용

```bash
# 1) 워크트리 생성 — dev 기준 새 feature 브랜치
git worktree add .worktrees/149-search-fix -b feature/149-search-fix dev

# 2) 부트스트랩 — env 심볼릭 링크 + bun install
just worktree-setup .worktrees/149-search-fix

# 3) 여러 워크트리 동시에 dev 서버 띄우려면 포트 분리
just worktree-setup .worktrees/148-editorial-og 3001
```

### 폴더 규칙

- **위치**: `.worktrees/<branch-slug>/` (gitignored, 하이든 폴더)
- **이름**: 이슈 번호 + 짧은 슬러그 (`149-search-fix`)
- **브랜치**: `feature/<issue>-<slug>` 또는 `fix/*`
- 메인 워크트리에서는 부트스트랩 실행하지 않음 (스크립트가 거부함)

### 부트스트랩이 하는 일

`scripts/worktree-bootstrap.sh` = `just worktree-setup`:

1. 메인 워크트리에서 `.env.local`, `.env.backend.dev`, `packages/web/.playwright/`를 **심볼릭 링크** (수정이 즉시 모든 워크트리에 반영됨)
2. `bun install` 실행 (워크트리 node_modules 동기화)
3. `--port <N>` 지정 시 `packages/web/.env.local.port` 메모 파일 + `PORT=<N> bun dev` 안내

### 수동 QA 패턴

- **단일 수정 QA**: 해당 워크트리에서 바로 `bun dev` (포트 3000)
- **여러 수정 합쳐서 QA**: 메인 워크트리에 `qa/*` 브랜치 만들어 피처 브랜치들 머지 → QA → PR 각자 올림
- **병렬 QA**: 각 워크트리에 포트 다르게 (3001/3002) 부트스트랩 → 동시에 `bun dev`

### 정리

```bash
# 브랜치 유지 + 폴더 삭제
git worktree remove .worktrees/149-search-fix

# 브랜치까지 삭제
git worktree remove .worktrees/149-search-fix
git branch -D feature/149-search-fix
```
