# E2E Hardening Infra P0 Implementation Plan (#170)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Epic #170의 P0 인프라 스프린트 실행 — GitHub Actions E2E workflow 신설 + CI secret 주입 + baseline 측정 + 커버리지 재정의 + auth regression umbrella 이슈 생성.

**Architecture:** 새 workflow `e2e.yml`이 `pull_request` + `push: dev` 트리거로 `packages/web`의 playwright를 실행. secret은 `gh secret set`으로 repo에 주입. baseline + coverage definition + #179 이슈 body는 모두 docs/issue body로 문서화.

**Tech Stack:** GitHub Actions, Playwright, Bun, Supabase cloud DEV, gh CLI.

---

## File Structure

**Create:**
- `.github/workflows/e2e.yml` — CI workflow (Task 2)
- `docs/agent/e2e-coverage-definition.md` — "80%" 재정의 문서 (Task 8)
- `docs/agent/e2e-baseline-2026-04-30.md` — 첫 CI 실행 baseline (Task 6)
- `docs/superpowers/briefs/2026-04-30-e2e-infra-retro.md` — 회고 (Task 11)

**Modify:**
- GitHub Issue #162 body — 새 커버리지 정의 링크 (Task 9, via gh CLI)

**External actions (no repo file):**
- Repo secrets 주입 via `gh secret set` (Task 4)
- 새 이슈 #179 생성 via `gh issue create` (Task 10)

**Spec reference:** `docs/superpowers/specs/2026-04-23-e2e-hardening-reprioritization-design.md`

---

### Task 1: Feature branch 생성

**Files:** (no file changes)

- [ ] **Step 1: 현재 작업트리 상태 확인**

Run:
```bash
cd /Users/kiyeol/development/decoded/decoded-monorepo
git status --short
git branch --show-current
```
Expected: branch == `dev`, uncommitted .omc state files only (spec 커밋은 이미 반영됨).

- [ ] **Step 2: 새 feature branch 체크아웃**

Run:
```bash
cd /Users/kiyeol/development/decoded/decoded-monorepo
git checkout -b feat/170-e2e-infra-p0 dev
```
Expected: `Switched to a new branch 'feat/170-e2e-infra-p0'`.

---

### Task 2: `.github/workflows/e2e.yml` 작성

**Files:**
- Create: `.github/workflows/e2e.yml`

- [ ] **Step 1: workflow 파일 생성**

Create `/Users/kiyeol/development/decoded/decoded-monorepo/.github/workflows/e2e.yml`:

```yaml
name: E2E Tests

on:
  pull_request:
    paths:
      - 'packages/web/**'
      - 'packages/api-server/**'
      - '.github/workflows/e2e.yml'
  push:
    branches: [dev]

concurrency:
  group: e2e-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  playwright:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    env:
      NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.E2E_SUPABASE_ANON_KEY }}
      SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.E2E_SUPABASE_SERVICE_ROLE_KEY }}
      TEST_USER_EMAIL: ${{ secrets.E2E_TEST_USER_EMAIL }}
      TEST_USER_PASSWORD: ${{ secrets.E2E_TEST_USER_PASSWORD }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Install Playwright browsers
        working-directory: packages/web
        run: bunx playwright install --with-deps chromium

      - name: Run Playwright tests
        working-directory: packages/web
        run: bunx playwright test

      - name: Upload test-results on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: test-results-${{ github.run_id }}
          path: packages/web/test-results/
          retention-days: 7
```

**Rationale:**
- `paths` 필터로 web/api-server 변경 시에만 실행 → 빈번한 docs-only PR에는 무실행
- `concurrency` 그룹으로 같은 ref의 중복 실행 취소 → 비용 절감
- `timeout-minutes: 20` — 현재 spec 13개 + playwright install + dev server startup (120s timeout) 여유
- `bunx playwright install --with-deps` — Ubuntu 시스템 의존성(libnss3 등) 자동 설치
- upload-artifact `if: failure()` — 실패 시만 업로드. trace.zip + screenshot은 `test-results/`에 생성됨 (playwright.config.ts 기준)
- secrets 네이밍 `E2E_` 프리픽스 — 기존 `SUPABASE_*` secret과 격리해 DEV 환경 전용임을 명시

- [ ] **Step 2: YAML 문법 검증**

Run:
```bash
cd /Users/kiyeol/development/decoded/decoded-monorepo
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/e2e.yml'))" && echo OK
```
Expected: `OK` (YAML 문법 오류 없음).

대체 수단 (actionlint 설치되어 있다면):
```bash
actionlint .github/workflows/e2e.yml
```
Expected: 출력 없음 = 검증 통과.

- [ ] **Step 3: workflow 파일 커밋**

Run:
```bash
cd /Users/kiyeol/development/decoded/decoded-monorepo
git add .github/workflows/e2e.yml
git commit -m "ci(e2e): add Playwright workflow for PR + dev push (#170)

- triggers on pull_request (web/api-server paths) and dev push
- uses E2E_* secrets for Supabase cloud DEV + test user credentials
- uploads test-results/ artifact on failure (trace.zip + screenshots)
- concurrency group cancels in-progress runs for the same ref"
```
Expected: commit 생성, `.github/workflows/e2e.yml` 1 file changed.

---

### Task 3: Feature branch push

**Files:** (no file changes)

- [ ] **Step 1: 브랜치 push**

Run:
```bash
cd /Users/kiyeol/development/decoded/decoded-monorepo
git push -u origin feat/170-e2e-infra-p0
```
Expected: upstream 설정 + `Branch 'feat/170-e2e-infra-p0' set up to track 'origin/feat/170-e2e-infra-p0'`.

**주의:** push만 할 뿐 PR 생성은 Task 5에서. secret이 아직 없으므로 첫 실행은 실패함 (의도된 순서).

---

### Task 4: CI secret 주입 (유저 수행 구간)

**Files:** (no file changes — runtime 작업)

**⚠️ 이 태스크는 agentic worker가 아닌 유저(thxforall)가 수행합니다.** agent는 명령어를 준비하고 실행 확인만 담당.

- [ ] **Step 1: Supabase cloud DEV 프로젝트에서 E2E 전용 test user 생성**

절차 (Supabase Studio UI 수행):
1. https://supabase.com/dashboard/project/fvxchskblyhuswzlcmql/auth/users 접속
2. "Add user" → "Create new user"
3. Email: `e2e-test@decoded.style`
4. Password: 강력한 랜덤 (예: `openssl rand -base64 24`)
5. Auto Confirm User: 체크
6. 생성된 이메일/비번을 안전한 곳에 임시 저장 (다음 step에서 사용)

- [ ] **Step 2: repo secret 5개 주입**

Run (각 명령 실행 시 stdin으로 값 붙여넣기):
```bash
gh secret set E2E_SUPABASE_URL --repo decodedcorp/decoded
# 값: https://fvxchskblyhuswzlcmql.supabase.co

gh secret set E2E_SUPABASE_ANON_KEY --repo decodedcorp/decoded
# 값: Supabase Studio → Project Settings → API → anon public

gh secret set E2E_SUPABASE_SERVICE_ROLE_KEY --repo decodedcorp/decoded
# 값: Supabase Studio → Project Settings → API → service_role (⚠️ secret)

gh secret set E2E_TEST_USER_EMAIL --repo decodedcorp/decoded
# 값: e2e-test@decoded.style

gh secret set E2E_TEST_USER_PASSWORD --repo decodedcorp/decoded
# 값: Step 1에서 생성한 비번
```

**보안 주의:** 값을 **채팅에 붙여넣지 말 것**. `gh secret set` 명령은 stdin 프롬프트로 안전하게 입력.

- [ ] **Step 3: secret 주입 확인**

Run:
```bash
gh secret list --repo decodedcorp/decoded | grep '^E2E_'
```
Expected 출력 (5줄):
```
E2E_SUPABASE_ANON_KEY
E2E_SUPABASE_SERVICE_ROLE_KEY
E2E_SUPABASE_URL
E2E_TEST_USER_EMAIL
E2E_TEST_USER_PASSWORD
```

---

### Task 5: PR 생성 + 첫 CI 실행 트리거

**Files:** (no file changes)

- [ ] **Step 1: PR 생성**

Run:
```bash
cd /Users/kiyeol/development/decoded/decoded-monorepo
gh pr create --repo decodedcorp/decoded --base dev --head feat/170-e2e-infra-p0 \
  --title "ci(e2e): add Playwright workflow for PR + dev push (#170)" \
  --body "$(cat <<'EOF'
## Summary

Epic #170의 P0 인프라 스프린트 첫 단계. GitHub Actions에 E2E workflow 신설.

## Changes

- `.github/workflows/e2e.yml` 신규 — pull_request (web/api-server paths) + dev push 트리거
- `E2E_*` secret 주입 (별건으로 repo admin이 수행 완료 전제)
- Playwright 실행 → 실패 시 test-results/ artifact 업로드

## Why

현재 CI에 E2E job이 없어 1,145줄 spec이 자동 회귀 방지 기능 0. pre-push의 \`RUN_E2E=1\`는 기본값 skip이라 개발자가 켜지 않으면 무효. PR-level gate를 만들어 앞으로 추가되는 모든 spec이 실제 gate 역할을 하도록 함.

## Baseline measurement

이 PR 머지 후 첫 CI 실행 결과를 `docs/agent/e2e-baseline-2026-04-30.md`에 기록 예정.

## Related

- Epic: #170
- Design spec: docs/superpowers/specs/2026-04-23-e2e-hardening-reprioritization-design.md
- Parent roadmap: #162

## Test plan

- [ ] CI에서 workflow 자체가 trigger됨 (Checks 탭 E2E Tests 등장)
- [ ] Playwright 실행 로그 노출
- [ ] 실패 시 test-results artifact 확인 가능

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
Expected: PR URL 출력. 

- [ ] **Step 2: PR 트리거된 CI run 확인**

Run (PR 생성 후 약 30초 대기):
```bash
sleep 30
gh run list --repo decodedcorp/decoded --workflow=e2e.yml --branch=feat/170-e2e-infra-p0 --limit=1
```
Expected: 1줄 출력 (status=`queued`/`in_progress`/`completed`, conclusion 빈 값 또는 success/failure).

만약 workflow가 트리거 안 됐으면 paths 필터 점검 (`.github/workflows/e2e.yml` 자체가 paths에 포함되므로 트리거되어야 정상).

---

### Task 6: Baseline 수집

**Files:**
- Create: `docs/agent/e2e-baseline-2026-04-30.md`

- [ ] **Step 1: CI run 완료 대기**

Run:
```bash
gh run watch --repo decodedcorp/decoded $(gh run list --repo decodedcorp/decoded --workflow=e2e.yml --branch=feat/170-e2e-infra-p0 --limit=1 --json databaseId --jq '.[0].databaseId')
```
Expected: run 완료 시까지 실시간 로그 출력.

- [ ] **Step 2: run 로그에서 pass/fail/skip 카운트 추출**

Run:
```bash
RUN_ID=$(gh run list --repo decodedcorp/decoded --workflow=e2e.yml --branch=feat/170-e2e-infra-p0 --limit=1 --json databaseId --jq '.[0].databaseId')
gh run view $RUN_ID --repo decodedcorp/decoded --log | grep -E "passed|failed|skipped|flaky" | tail -20
```
Expected: playwright `list` reporter 요약 라인 (예: `13 passed (2m 10s)` 또는 `5 passed, 3 failed, 2 skipped`).

실패한 spec 명 수집:
```bash
gh run view $RUN_ID --repo decodedcorp/decoded --log | grep -E "✘|×" | head -20
```

- [ ] **Step 3: baseline 문서 작성**

Create `/Users/kiyeol/development/decoded/decoded-monorepo/docs/agent/e2e-baseline-2026-04-30.md`:

```markdown
---
title: E2E Baseline (2026-04-30)
updated: 2026-04-30
related_issues: [170, 162]
---

# E2E Baseline 2026-04-30

첫 CI 실행 (`.github/workflows/e2e.yml`) 결과 스냅샷. 이후 커버리지 작업의 출발점.

## 실행 환경

- Workflow: `.github/workflows/e2e.yml`
- Run ID: `<step 2의 RUN_ID 채워넣기>`
- Trigger: PR feat/170-e2e-infra-p0 → dev
- Supabase: cloud DEV (project ref fvxchskblyhuswzlcmql)

## 결과

| 분류 | 개수 | 비고 |
|---|---|---|
| Pass | `<채워넣기>` | 즉시 회귀 방지 역할 시작 |
| Fail (flake/env) | `<채워넣기>` | 다음 스프린트 fix |
| Fail (spec bug) | `<채워넣기>` | 이슈 등록 후 백로그 |
| Skip | `<채워넣기>` | service key 없거나 조건부 skip |

**총 spec 개수:** `<채워넣기>` (`packages/web/tests/**/*.spec.ts`)

## 실패한 spec 목록

- `<spec 경로>` — 원인 분류 (flake / env / spec bug) + 후속 액션

## 다음 액션

- flake/env 실패분 → 이번 스프린트 scope-out, 다음 스프린트 전 30분 스파이크
- spec bug 실패분 → GitHub issue 등록 (label: testing)
- pass 수치를 `docs/agent/e2e-coverage-definition.md`의 현재 커버리지 갱신에 반영
```

- [ ] **Step 4: baseline 문서 커밋**

Run:
```bash
cd /Users/kiyeol/development/decoded/decoded-monorepo
git add docs/agent/e2e-baseline-2026-04-30.md
git commit -m "docs(agent): add E2E CI baseline snapshot (2026-04-30)"
git push
```
Expected: 커밋 + PR에 자동 반영.

---

### Task 7: pre-push 정책 재확인

**Files:** (no file changes — 정책 결정 문서화)

- [ ] **Step 1: 현재 pre-push 동작 확인**

Run:
```bash
grep -A 3 "RUN_E2E" /Users/kiyeol/development/decoded/decoded-monorepo/packages/web/scripts/pre-push.sh
```
Expected: `${RUN_E2E:-}` 조건분기 + "기본 — 켜려면 RUN_E2E=1" 메시지 출력.

- [ ] **Step 2: 정책 유지 결정 기록**

No file change needed — 결정은 design spec `docs/superpowers/specs/2026-04-23-e2e-hardening-reprioritization-design.md`의 A4 섹션에 이미 문서화됨 ("현재 skip 유지, 6주 후 재평가"). 이 step은 단순히 확인만.

---

### Task 8: 커버리지 정의 재작성

**Files:**
- Create: `docs/agent/e2e-coverage-definition.md`

- [ ] **Step 1: 커버리지 정의 문서 작성**

Create `/Users/kiyeol/development/decoded/decoded-monorepo/docs/agent/e2e-coverage-definition.md`:

```markdown
---
title: E2E Coverage Definition
updated: 2026-04-30
related_issues: [162, 170]
status: draft-for-team-review
---

# E2E Coverage Definition

## 배경

#162의 "80% 커버리지 목표"는 Phase 4의 "~60개+ 테스트"로 설정되어 있었다. 이는 **테스트 개수 기준**이라 shallow `goto → expect(url)` 류 spec 대량 투입으로 숫자를 달성 가능한 vanity metric.

실제 프로덕션 회귀 방지가 목적이라면 **사용자 플로우의 mutation 검증률**이 분모·분자가 되어야 한다.

## 새 공식

```
coverage = (mutation-covered critical flows) / (total critical flows)
target = 80%
```

### "critical flow" 기준

- 사용자가 정기적으로 사용
- 깨지면 사용자에게 즉시 노출
- mutation 혹은 state 변화를 포함

### "mutation-covered" 기준

spec이 해당 플로우의 다음 **두 가지를 모두** assert해야 함:

1. **핵심 API mutation 호출** — POST/PUT/DELETE 요청 발행 확인 (`page.route` mock으로 가로채고 호출 여부 assert)
2. **UI 반영** — 성공 후 DOM/URL/상태 변화 assert

단순 `page.goto('/x') → expect(page.url()).toContain('/x')`만으로는 카운트 안 함.

## Critical Flow 인벤토리

| # | Flow | mutation | 현재 cover 여부 |
|---|---|---|---|
| 1 | 로그인 — email/password | auth session 생성 | 부분 — login.spec.ts |
| 2 | 로그인 — OAuth (Google) | OAuth callback | ❌ |
| 3 | 로그인 — Continue as Guest | guest session | ❌ |
| 4 | 로그아웃 | session 파기 | ❌ |
| 5 | 업로드 → 제출 → 포스트 생성 | POST /api/v1/posts | ❌ (modal만 cover) |
| 6 | 좋아요 toggle (POST/DELETE + 새로고침 유지) | POST/DELETE likes | ✅ engagement.spec.ts |
| 7 | 저장 toggle + Profile Saved 확인 | POST/DELETE saved | 부분 — Profile 탭 확인 없음 |
| 8 | 솔루션 채택 | POST /api/v1/solutions/{id}/adopt | ❌ |
| 9 | Profile 편집 → 저장 반영 | PUT /api/v1/users/{id} | ❌ |
| 10 | 공개 Profile Follow toggle | POST/DELETE follows | ❌ |
| 11 | Magazine 홈 → 상세 → 포스트 네비 | navigation only | ❌ |
| 12 | VTON 전체 플로우 | POST /api/v1/vton | ❌ |
| 13 | Admin entity CRUD (대표 1종) | POST/PUT admin entities | ❌ |
| 14 | Admin seed 승인/거절 | POST admin/candidates/approve | ❌ |
| 15 | 에러 — API 500 + retry | network failure → retry UI | ❌ |
| 16 | 에러 — 빈 상태 | empty state UI 렌더 | ❌ |
| 17 | 에러 — 권한 거부 (비로그인) | redirect /login | 부분 — navigation.spec.ts URL 체크만 |

**현재 커버리지 (2026-04-30):** 1 / 17 완전 + 3 / 17 부분 ≈ **~12%** (부분을 0.5로 계산)

**80% 달성까지:** 완전 cover 14개 / 17개 필요 → 현재 대비 +12~13개 critical flow 추가 작업.

## 운영 원칙

1. **새 critical flow는 이 문서에 추가될 때 PR 리뷰를 거친다** (기준 확장은 결정 포인트).
2. **spec 추가 시 이 표의 해당 row를 ✅로 체크** — 커버리지 수치의 single source of truth.
3. **shallow test는 카운트하지 않음** — 작성은 자유지만 커버리지 수치에 반영하지 않음.
4. **#162 본문은 이 문서로 링크** — 현재의 "60개 테스트" 표기는 "critical flow 80%"로 대체.

## 다음 액션

- #162 본문에 이 문서 링크 추가
- 팀 리뷰 후 status: draft-for-team-review → approved로 변경
- baseline 수치는 `docs/agent/e2e-baseline-2026-04-30.md` 참조
```

- [ ] **Step 2: 문서 커밋**

Run:
```bash
cd /Users/kiyeol/development/decoded/decoded-monorepo
git add docs/agent/e2e-coverage-definition.md
git commit -m "docs(agent): redefine E2E coverage as mutation-covered critical flows (#162)

- replaces vanity 'test count' target with 17 critical user flows
- defines 'mutation-covered' as API call assertion + UI reflection
- baseline measured at ~12% (1/17 complete + 3/17 partial)"
git push
```

---

### Task 9: #162 본문 edit

**Files:** (no local file — GitHub issue body)

- [ ] **Step 1: 기존 #162 본문 백업**

Run:
```bash
gh issue view 162 --repo decodedcorp/decoded --json body --jq '.body' > /tmp/issue-162-backup.md
echo "Backup size: $(wc -c < /tmp/issue-162-backup.md) bytes"
```
Expected: ~1000 bytes 이상의 백업 파일.

- [ ] **Step 2: #162 본문 edit — 커버리지 정의 링크 추가**

Run:
```bash
gh issue edit 162 --repo decodedcorp/decoded --body "$(cat <<'EOF'
## 배경

현재 프론트 E2E 커버리지: 페이지 로딩 확인 위주 (5개 spec 파일, ~300줄).
핵심 사용자 플로우에 대한 테스트가 없어 기능 변경 시 수동 검증에 의존.

## ⚠️ 2026-04-30 업데이트: 커버리지 정의 재작성

기존의 "테스트 개수 기준 80% (~60개+)"은 vanity metric으로 판단되어 폐기. 다음 정의로 대체:

**coverage = (mutation-covered critical flows) / (total critical flows) ≥ 80%**

상세: [docs/agent/e2e-coverage-definition.md](https://github.com/decodedcorp/decoded/blob/dev/docs/agent/e2e-coverage-definition.md)

현재 baseline: ~12% (1/17 완전 cover + 3/17 부분). 80% 달성까지 약 +12 critical flow 필요.

## 사전 작업

- [x] Supabase에 email/password 테스트 계정 생성 (`e2e-test@decoded.style`)
- [x] `.env.local`에 `TEST_USER_EMAIL`, `TEST_USER_PASSWORD` 설정
- [x] `Justfile`에 `e2e`, `e2e-only` 타스크 추가
- [x] 핵심 컴포넌트에 `data-testid` 속성 추가
- [x] GitHub Actions에 E2E workflow (#170 P0 인프라 스프린트)

## 점진적 확대 로드맵

### Phase 1: 핵심 소비+생성 플로우 (~15개 테스트) — 진행 중

**콘텐츠 소비 (`content-consumption.spec.ts`)** ✅
- Explore 페이지 로딩 + 그리드
- 검색, 정렬
- 포스트 상세 진입
- 스팟/솔루션 목록 표시
- 피드 무한스크롤

**콘텐츠 생성 (`content-creation.spec.ts`)** — 부분
- 업로드 페이지 + 이미지 선택 ✅
- 스팟 배치 (이미지 클릭) ⚠️
- 솔루션 입력 폼 ❌
- 포스트 제출 ❌ (#171 submit mutation tail)

**참여 (`engagement.spec.ts`)** — 부분
- 좋아요/저장 토글 ✅
- 솔루션 채택 ❌

### Phase 2: 프로필, 에디토리얼, 매거진 (~25개)
### Phase 3: Admin, 엣지 케이스, 에러 핸들링 (~40개)
### Phase 4: 80% critical flow cover

## 관련

- #170 — 프론트엔드 E2E 핵심 기능 커버리지 확대 Epic
- #158 — Supabase 직접 호출 마이그레이션
- `docs/agent/e2e-coverage-definition.md` — 새 커버리지 정의
- `docs/agent/e2e-baseline-2026-04-30.md` — CI baseline
EOF
)"
```
Expected: `https://github.com/decodedcorp/decoded/issues/162` URL 출력.

- [ ] **Step 3: edit 반영 확인**

Run:
```bash
gh issue view 162 --repo decodedcorp/decoded --json body --jq '.body' | head -20
```
Expected: 업데이트된 본문 앞부분 — "⚠️ 2026-04-30 업데이트: 커버리지 정의 재작성" 헤더 포함.

---

### Task 10: Auth regression umbrella 이슈 #179 생성

**Files:** (no local file — GitHub issue body)

- [ ] **Step 1: 이슈 본문 준비 + 생성**

Run:
```bash
gh issue create --repo decodedcorp/decoded \
  --title "test(web): Auth regression safety net — E2E umbrella (P1)" \
  --label "testing,frontend" \
  --body "$(cat <<'EOF'
## 배경

최근 48h에 auth/admin 관련 프로덕션 fix PR **8건** 머지:
- #313/#314 — \`auth.users\` insert trigger restore + checkIsAdmin maybeSingle
- #319 — admin supabase 세션 토큰 포워딩
- #321 — admin middleware layer order
- #322 — admin logout redirect
- #296/#298/#310 — Continue as Guest 세션 지속성
- #297 — OAuth redirect URL

기존 1,145줄 E2E spec 중 **이 중 어떤 것도 잡을 수 있는 spec이 없음** (navigation.spec.ts는 URL만 체크, engagement는 auth mock 처리, admin/magazine-approval은 대부분 CI에서 skip).

각 PR은 one-off fix로 닫혔고 umbrella 이슈나 회귀 방지 체크리스트가 없어 **같은 유형의 버그가 재발할 구조적 리스크** 존재.

## 목적

최근 auth 회귀를 **E2E 회귀 테스트로 전환**해 동일 버그의 재발을 자동 감지.

## 체크리스트 — 회귀 테스트 대상

각 항목은 Playwright spec 추가 + 필요 시 \`data-testid\` 컴포넌트 수정 포함.

- [ ] **게스트 세션 지속성** (#296/#298/#310 회귀 방지)
  - Continue as Guest → hard navigation (\`window.location.href = '/profile'\`) → 세션 유지 확인
  - intercept route 통과 후에도 게스트 session 보존

- [ ] **OAuth redirect URL** (#297 회귀 방지)
  - Google OAuth 시작 → callback 경로로 복귀 → 세션 활성 확인
  - Supabase site_url / redirect_urls 설정 검증 포함

- [ ] **Admin middleware layer order** (#321 회귀 방지)
  - 비로그인 → /admin 접근 → /admin/login 리다이렉트
  - admin 로그인 후 /admin 접근 → 대시보드 렌더링
  - non-admin 일반 유저 → /admin 접근 → 403 또는 리다이렉트

- [ ] **Admin 세션 토큰 포워딩** (#319 회귀 방지)
  - admin 로그인 후 rust admin endpoint (예: GET /api/admin/...) 호출 → 200 응답
  - Authorization 헤더에 Supabase 세션 토큰 포함 확인 (\`page.route\` intercept)

- [ ] **Admin 로그아웃 리다이렉트** (#322 회귀 방지)
  - /admin 진입 후 로그아웃 버튼 클릭 → /admin/login으로 이동 (/로 안 감)

- [ ] **\`auth.users\` insert trigger** (#313/#314 회귀 방지)
  - 신규 가입 플로우 → \`public.users\` row 자동 생성 확인 (Supabase 쿼리 또는 /api/v1/users/me 200 응답)

- [ ] **\`checkIsAdmin\` maybeSingle 처리** (#313 회귀 방지)
  - admin 레코드 없는 일반 유저로 admin 라우트 접근 → 500 에러 안 터지고 403/리다이렉트로 처리

## data-testid 작업 (선행)

위 플로우에 필요한 testid가 없으면 컴포넌트 수정:
- \`LogoutButton\` on /admin
- \`AdminLoginForm\`
- \`GuestCTAButton\`
- \`OAuthGoogleButton\` redirect state

## 출력

- \`packages/web/tests/auth-safety-net.spec.ts\` (신규, 예상 ~200줄)
- \`packages/web/tests/admin/auth.spec.ts\` (신규, ~150줄)
- \`docs/agent/e2e-coverage-definition.md\` 의 flow #1~#4, #13~#17 체크 업데이트

## 우선순위

**P1** — 실증적 회귀가 가장 잦은 영역. #170 Epic 아래 최우선.

## 관련

- Epic: #170
- Coverage definition: \`docs/agent/e2e-coverage-definition.md\`
- 원본 fix PR: #313 #314 #319 #321 #322 #297 #310 #298 #296
- Design spec: \`docs/superpowers/specs/2026-04-23-e2e-hardening-reprioritization-design.md\`
EOF
)"
```
Expected: 새 이슈 URL 출력 (형식: `https://github.com/decodedcorp/decoded/issues/NEW_ID`).

- [ ] **Step 2: 이슈 번호를 spec 문서에 반영**

Run (위 step에서 받은 실제 이슈 번호를 `NEW_ID`로 치환):
```bash
ACTUAL_ID=$(gh issue list --repo decodedcorp/decoded --search "Auth regression safety net" --state open --json number --jq '.[0].number')
echo "New issue number: #${ACTUAL_ID}"
```

Edit `/Users/kiyeol/development/decoded/decoded-monorepo/docs/superpowers/specs/2026-04-23-e2e-hardening-reprioritization-design.md`:

모든 `#179` 문자열을 `#${ACTUAL_ID}` 로 replace (grep으로 확인):
```bash
grep -n "#179" /Users/kiyeol/development/decoded/decoded-monorepo/docs/superpowers/specs/2026-04-23-e2e-hardening-reprioritization-design.md
# 각 라인을 실제 ID로 수정
```

단, 만약 실제 ID가 179와 같다면 수정 불필요.

- [ ] **Step 3: 수정사항 커밋 (실제 ID가 179와 다른 경우만)**

Run (차이 있을 때만):
```bash
cd /Users/kiyeol/development/decoded/decoded-monorepo
git add docs/superpowers/specs/2026-04-23-e2e-hardening-reprioritization-design.md
git commit -m "docs(specs): update auth umbrella issue reference to #${ACTUAL_ID}"
git push
```

---

### Task 11: 스프린트 회고 노트

**Files:**
- Create: `docs/superpowers/briefs/2026-04-30-e2e-infra-retro.md`

- [ ] **Step 1: 회고 파일 생성**

Create `/Users/kiyeol/development/decoded/decoded-monorepo/docs/superpowers/briefs/2026-04-30-e2e-infra-retro.md`:

```markdown
---
title: E2E Infra P0 스프린트 회고 (2026-04-24 ~ 04-30)
updated: 2026-04-30
related_issues: [170, 162]
---

# E2E Infra P0 스프린트 회고

**기간:** 2026-04-24 목 ~ 2026-04-30 수
**스코프:** Epic #170의 P0 인프라 스프린트
**담당:** thxforall (solo)

## 목표 대비 달성

| 목표 (DoD) | 달성 |
|---|---|
| GitHub Actions e2e.yml 존재 + PR/dev push 트리거 | `<채워넣기>` |
| 기존 13개 spec CI baseline 측정 | `<채워넣기>` |
| "80% 커버리지" 재정의 문서화 | `<채워넣기>` |
| Auth regression umbrella 이슈 #179 생성 | `<채워넣기>` |
| 새 feature spec 추가 (Non-goal) | 의도대로 없음 |

## Blocker / 우회

- `<채워넣기>` — 예: secret 주입이 repo admin 권한 이슈로 지연, test user 생성 중 Supabase RLS 문제 등

## 숫자

- CI 첫 실행 결과: `<Pass N / Fail N / Skip N>`
- 실행 시간: `<분>` (예상 ~5분)
- 실패한 spec 중 flake/env: N개, spec bug: N개

## Learning

- `<채워넣기>` — 예: reuseExistingServer 옵션이 CI에서 어떻게 동작했는지, supabase cloud DEV의 E2E 트래픽 영향 등

## 다음 스프린트 추천 순서

1. **#179 Auth safety net 실행** (P1, 추정 2주)
2. **#171 Submit mutation tail** (P1, 추정 1주)
3. **#177 에러/권한** (P1로 승격, 추정 1주)

위 3개가 완료되면 critical flow 커버리지 ~50% 도달 예상 (17개 중 +5~6개 추가).

## Open questions

- `<채워넣기>` — 예: admin/magazine-approval.spec.ts의 CI skip 조건을 제거할지 별건?
- `<채워넣기>` — 예: pre-push RUN_E2E 기본 on 전환 6주 후 재평가 항목 상기
```

- [ ] **Step 2: 회고 파일 커밋 + PR 업데이트**

Run:
```bash
cd /Users/kiyeol/development/decoded/decoded-monorepo
git add docs/superpowers/briefs/2026-04-30-e2e-infra-retro.md
git commit -m "docs(retro): E2E Infra P0 sprint retrospective (2026-04-30)"
git push
```

**주의:** `<채워넣기>` placeholder는 스프린트 **종료 시점에 실제 수치/사실로 교체**. 이 task를 완료로 체크하려면 placeholder가 모두 채워진 상태여야 함.

---

### Task 12: PR 머지 + Epic #170 코멘트

**Files:** (no file changes)

- [ ] **Step 1: PR 상태 확인 (모든 체크 그린인지)**

Run:
```bash
cd /Users/kiyeol/development/decoded/decoded-monorepo
gh pr status --repo decodedcorp/decoded
```
Expected: feat/170-e2e-infra-p0 PR이 "All checks were successful" 상태.

만약 E2E 체크에서 실패가 남아있으면 Task 6의 flake/env 분류 기준으로 scope-out 판단 후 진행 (실패 spec 목록을 baseline 문서에 기록).

- [ ] **Step 2: PR 머지**

Run:
```bash
PR_NUMBER=$(gh pr view --repo decodedcorp/decoded --json number --jq '.number')
gh pr merge $PR_NUMBER --repo decodedcorp/decoded --merge --delete-branch
```
Expected: PR merged + feat/170-e2e-infra-p0 원격 브랜치 삭제.

**주의:** 머지 전에 유저 확인. PR 머지는 shared state 변경이므로 `gh pr merge` 실행 전 사용자에게 컨펌 요청.

- [ ] **Step 3: Epic #170에 P0 완료 코멘트**

Run:
```bash
gh issue comment 170 --repo decodedcorp/decoded --body "$(cat <<'EOF'
## P0 인프라 스프린트 완료 (2026-04-30)

### 달성
- GitHub Actions \`e2e.yml\` 신설 → PR + dev push 트리거
- CI baseline 측정: \`docs/agent/e2e-baseline-2026-04-30.md\`
- 커버리지 정의 재작성: \`docs/agent/e2e-coverage-definition.md\` (테스트 개수 → critical flow 기준)
- Auth regression umbrella 이슈 생성 → \`#179\`
- #162 본문에 새 커버리지 정의 반영

### 실증 baseline
- **현재 커버리지: ~12%** (1/17 complete + 3/17 partial)
- 80% 달성까지 +12~13 critical flow 필요

### 다음 스프린트 추천 순서
1. #179 Auth safety net (P1)
2. #171 Submit mutation tail (P1)
3. #177 에러/권한 (P1로 승격)

### 참조
- Design spec: \`docs/superpowers/specs/2026-04-23-e2e-hardening-reprioritization-design.md\`
- Implementation plan: \`docs/superpowers/plans/2026-04-23-170-e2e-hardening-infra-p0.md\`
- Retro: \`docs/superpowers/briefs/2026-04-30-e2e-infra-retro.md\`
EOF
)"
```
Expected: 코멘트 URL 출력.

---

## 최종 체크리스트

스프린트 종료 시점에 다음 모두 달성됐는지 확인:

- [ ] `.github/workflows/e2e.yml` on dev branch
- [ ] 5개 E2E_* secret이 repo에 주입됨
- [ ] 첫 CI run 완료 + baseline 기록됨
- [ ] `docs/agent/e2e-coverage-definition.md` 커밋됨
- [ ] `docs/agent/e2e-baseline-2026-04-30.md` 커밋됨
- [ ] #162 본문 edit 반영
- [ ] 새 이슈 (umbrella auth safety net) 생성됨 + Epic #170 아래 링크됨
- [ ] `docs/superpowers/briefs/2026-04-30-e2e-infra-retro.md` 실제 수치로 채워짐
- [ ] PR merged to dev
- [ ] Epic #170에 완료 코멘트 등록됨
