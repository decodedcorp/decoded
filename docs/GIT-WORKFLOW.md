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

## Main 브랜치 보호

- **직접 push 금지**: pre-push 훅이 `main`/`master` push를 차단
- **PR 머지만 허용**: 브랜치 → PR → 리뷰 → 머지

## 리뷰 프로세스

1. 브랜치에서 작업 완료
2. `/review` 실행 — Claude code-reviewer로 자동 리뷰
3. P0(차단 이슈) 모두 해결
4. PR 생성
5. 팀원 리뷰
6. 승인 후 머지

## 릴리스 플로우

현재는 main 머지 시 자동 배포 (Vercel). 별도 릴리스 브랜치 없음.
