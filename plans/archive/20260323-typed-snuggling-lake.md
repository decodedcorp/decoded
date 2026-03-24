# Frontend CI/CD + Code Review + Git Workflow

## Context

백엔드(api-server)는 6단계 pre-push CI가 구현되어 있지만, 프론트엔드는 TODO 상태.
코드리뷰 자동화와 팀 git 워크플로우 문서도 부재. 이 세 가지를 한번에 구성한다.

**방침**: GitHub Actions CI 없이 로컬 pre-push 훅만 사용 (백엔드와 동일 패턴).

---

## Part 1: Frontend Pre-push Hook

api-server 패턴(`packages/api-server/scripts/pre-push.sh`)을 그대로 따른다.

### 변경 파일

| 파일 | 작업 |
|------|------|
| `packages/web/scripts/pre-push.sh` | **신규** — 프론트 CI 스크립트 |
| `scripts/git-pre-push.sh` | **수정** — TODO 블록(33-35줄) → web pre-push 호출로 교체 |
| `packages/web/package.json` | **수정** — `typecheck` 스크립트 추가 |
| `Justfile` | **수정** — `ci-web` 레시피 추가 |

### `packages/web/scripts/pre-push.sh` 체크 순서

| 순서 | 체크 | 명령어 | 실패 시 |
|:---:|------|--------|---------|
| 1 | ESLint | `bun run lint` | push 차단 |
| 2 | Prettier | `bun run format:check` | push 차단 |
| 3 | TypeScript | `bun run typecheck` (`tsc --noEmit`) | push 차단 |
| 4 | Build | `bun run build` | `RUN_FE_BUILD=1`일 때만 실행 |

- `SKIP_FE_CI=1 git push`로 건너뛰기 가능 (긴급 시)
- 빠른 실패 순서: lint → format → tsc (느린 것 뒤로)

### `scripts/git-pre-push.sh` 수정 (33-35줄)

기존:
```bash
echo "=== [monorepo] 프론트 CI 슬롯 (미구현) ==="
# TODO(@frontend): eslint / turbo / tsc 등
true
```

변경 (ai-server 패턴 미러링):
```bash
if [[ -n "${SKIP_FE_CI:-}" ]]; then
  echo "=== [monorepo] web CI 건너뜀 (SKIP_FE_CI) ==="
else
  echo "=== [monorepo] web 로컬 CI ==="
  bash "$REPO_ROOT/packages/web/scripts/pre-push.sh"
fi
```

---

## Part 2: Claude Code Review (Skill + Agent)

### 변경 파일

| 파일 | 작업 |
|------|------|
| `.claude/agents/code-reviewer.md` | **신규** — 리뷰 서브에이전트 |
| `.claude/skills/code-review/SKILL.md` | **신규** — `/review` 스킬 |

### Agent: `code-reviewer.md`

- `allowed-tools: Read, Grep, Glob, Bash`
- `model: claude-sonnet-4-20250514`
- git diff로 변경 파일 분석 → 6개 카테고리 검증

**리뷰 체크리스트:**

| 카테고리 | 심각도 | 검사 항목 |
|----------|:------:|----------|
| 보안 | P0 | 하드코딩 시크릿, XSS, 미검증 입력 |
| 타입 안전성 | P0 | `any` 사용, unsafe assertion, null 미처리 |
| 성능 | P1 | 불필요한 리렌더, 누락된 memo/useCallback, 큰 번들 임포트 |
| 디자인 시스템 | P1 | 직접 색상/간격값, DS 컴포넌트 미사용 |
| 네이밍 | P2 | 파일명(PascalCase), 훅(use 접두사), 스토어(Store 접미사) |
| 코드 품질 | P2 | console.log, 주석 처리된 코드, 에러 핸들링 누락 |

**출력**: P0/P1/P2 구조화된 리뷰 리포트 (spec-reviewer 포맷 동일)

### Skill: `code-review/SKILL.md`

- 트리거: `/review`, "코드 리뷰", "PR 리뷰", "변경사항 검토"
- `code-reviewer` 에이전트에 위임
- 참조: `.planning/codebase/CONVENTIONS.md`, `lib/design-system/`

---

## Part 3: Git Workflow (Docs + Skill)

### 변경 파일

| 파일 | 작업 |
|------|------|
| `docs/GIT-WORKFLOW.md` | **신규** — 팀 git 워크플로우 문서 (source of truth) |
| `.claude/skills/git-workflow/SKILL.md` | **신규** — 워크플로우 가이드 스킬 |

### `docs/GIT-WORKFLOW.md` 내용

1. **브랜치 네이밍**: `feat/`, `fix/`, `docs/`, `refactor/`, `chore/`, `test/` 접두사
2. **커밋 컨벤션**: Conventional Commits (`type(scope): description`)
3. **PR 컨벤션**: 제목 형식, 설명 템플릿 (Summary / Changes / Test Plan)
4. **Pre-push 체크**: `just hook` 설치, 스킵 방법, 수동 실행
5. **Main 보호**: 직접 push 차단, PR 머지만 허용
6. **리뷰 프로세스**: `/review` → 인간 리뷰 → P0 해결 → 머지

### Skill: `git-workflow/SKILL.md`

- 트리거: "브랜치 이름", "커밋 컨벤션", "PR 준비"
- `docs/GIT-WORKFLOW.md` 참조하여 컨벤션 검증/안내
- 브랜치명 검증, 커밋 메시지 검증, PR 준비 상태 체크

---

## Part 4: CLAUDE.md 업데이트

`CLAUDE.md`의 Commands 섹션 뒤에 추가:

- **Frontend CI** 섹션: 체크 항목, 실행/스킵 명령어
- **Git Workflow** 섹션: `docs/GIT-WORKFLOW.md` 참조 + 핵심 규칙 요약
- **Key File Locations** 테이블에 추가:
  - `packages/web/scripts/pre-push.sh` — Frontend CI
  - `docs/GIT-WORKFLOW.md` — Git 워크플로우

---

## 구현 순서

```
Track A (Frontend CI)        Track B (Code Review)       Track C (Git Workflow)
─────────────────────        ────────────────────        ─────────────────────
1. web/package.json          4. agents/code-reviewer.md  6. docs/GIT-WORKFLOW.md
   (typecheck 스크립트)
2. web/scripts/pre-push.sh   5. skills/code-review/      7. skills/git-workflow/
3. scripts/git-pre-push.sh      SKILL.md                    SKILL.md
   + Justfile

                    ↓ 세 트랙 완료 후 ↓
                 8. CLAUDE.md 업데이트
                 9. 검증 (bun run ci:local)
```

Track A/B/C는 독립적이므로 병렬 작업 가능.

## 검증

1. `bash packages/web/scripts/pre-push.sh` — 4개 체크 통과 확인
2. `bun run ci:local` — 전체 모노레포 CI (web + api-server) 동작 확인
3. `SKIP_FE_CI=1 bun run ci:local` — 스킵 동작 확인
4. `/review` 스킬 트리거 확인
5. `just ci-web` 레시피 동작 확인
