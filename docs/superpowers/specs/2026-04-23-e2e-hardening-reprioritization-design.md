---
title: E2E Hardening 로드맵 재우선순위화 — 인프라 퍼스트 (Epic #170)
owner: human
status: draft
updated: 2026-04-23
tags: [testing, infrastructure, hardening]
related_issues: [170, 171, 172, 173, 174, 175, 176, 177, 162]
---

# E2E Hardening 로드맵 재우선순위화 — 인프라 퍼스트 (Epic #170)

## 배경

Epic #170(프론트엔드 E2E 핵심 기능 커버리지 확대)의 자식 이슈 우선순위를 재평가하던 중, **P1~P3 재배열 자체가 상위 문제의 증상**임이 드러났다. 기존 접근은 "어떤 플로우를 먼저 테스트할지"를 다뤘지만, 실제 병목은 아래 세 가지다.

### 발견된 구조적 문제 3가지

1. **CI에서 E2E가 실행되지 않는다**
   - `.github/workflows/` 인벤토리: `claude-review` · `daily-digest` · `deploy-backend` · `health-check` · `telegram-notify` · `wiki-lint` — **playwright job 0개**.
   - `SUPABASE_SERVICE_ROLE_KEY` CI secret 주입 흔적 없음.
   - 유일한 게이트는 `packages/web/scripts/pre-push.sh`의 `RUN_E2E=1` 환경변수 — 기본값 skip.
   - 결과: 1,145줄의 E2E spec은 자동 회귀 방지 기능이 사실상 0. PR merge 시점에 실행되지 않으면 Epic #170을 완수해도 실효가 제한적.

2. **"80% 커버리지" 타겟이 vanity metric**
   - #162 본문: Phase 4 `~60개+ (80% 목표)` — 분모가 **테스트 개수**임.
   - 분모가 routes/flows/mutations가 아니라 개수이므로, shallow `page.goto → expect(url)` 류 spec 40개 추가로 숫자 달성 가능.
   - 숫자가 올라도 최근 8건(#313/#314/#319/#321/#322/#297/#310/#298) 같은 auth regression은 계속 새어 나갈 수 있음.

3. **Auth regression이 클래스로 추적되지 않는다**
   - 최근 48시간에 auth/admin 관련 프로덕션 fix PR 8개 머지.
   - 각각은 one-off fix로 닫힘 — umbrella 이슈나 회귀 방지 체크리스트 없음.
   - 결과: 같은 유형의 버그가 다음 배포에서도 재발할 가능성이 구조적으로 열려 있음.

### 재우선순위화의 실제 의미

위 세 문제를 해결하지 않고 Epic #170의 P1~P3만 재배열하면, **어떤 순서로 작업해도 회귀 방지 ROI가 제한**된다. 따라서 이번 스프린트는 새 spec 추가가 아니라 **인프라 P0를 신설해 앞으로 추가되는 모든 spec이 실제 gate 역할을 하도록** 만든다.

## 목표 (1주 스프린트: 2026-04-24 ~ 2026-04-30)

스프린트 종료 시점 상태:

1. GitHub Actions에 E2E workflow 존재 + 모든 PR + `dev` push에서 실행됨
2. 기존 13개 spec의 CI baseline 측정됨 (pass/fail/skip 수치)
3. "80% 커버리지"가 **mutation-covered critical flows / total critical flows** 공식으로 재정의됨
4. Auth regression umbrella 이슈 `#179` 생성 + 체크리스트 완성
5. (Non-goal) 새 feature spec 추가 없음 — 다음 스프린트부터

## 현재 상태 (2026-04-23 기준)

### Epic #170 자식 이슈

| # | 우선순위 | 제목 | 상태 | 실질 커버리지 |
|---|---|---|---|---|
| #171 | P1 | 업로드 전체 플로우 E2E | OPEN | ~30% — PR #248이 modal lifecycle만 cover, Submit → POST 검증 없음 |
| #172 | P1 | Engagement mutation 검증 | CLOSED (2026-04-10) | ~60% — adopt/auth-guard/persistence 브랜치 미커버, closed는 PR merge 기준 |
| #173 | P2 | VTON 플로우 E2E | OPEN | 0 |
| #174 | P2 | Editorial/Magazine 상세 E2E | OPEN | 0 (admin/magazine-approval은 별건) |
| #175 | P2 | Profile 편집·통계·활동 E2E | OPEN | 0 |
| #176 | P3 | Admin 대시보드 E2E | OPEN | 부분 — admin/magazine-approval.spec.ts (단, CI 미실행 시 test.skip) |
| #177 | P3 | 에러 상태 + 권한 검증 E2E | OPEN | 0 |

**체크리스트 가중 실질 커버리지: ~10-12%** (이슈 단위 20% 주장은 스코프 편차 무시한 과대 계상).

### 실제 spec 인벤토리 (`packages/web/tests/`, 총 1,145줄)

```
ai-pipeline.spec.ts         123
api-migration.spec.ts       119
content-consumption.spec.ts  63
content-creation.spec.ts     38
engagement.spec.ts          158   # #172 close 근거
login.spec.ts                45
navigation.spec.ts           41
post-navigation-perf.spec.ts 208
upload-direct.spec.ts        28   # PR #248 (modal lifecycle)
upload-draft.spec.ts         38   # PR #248
upload-intercept.spec.ts     60   # PR #248
upload-mobile.spec.ts        27   # PR #248
visual-qa.spec.ts            47
admin/magazine-approval.spec.ts 150   # service-role key 없으면 test.skip
```

## 설계 — P0 인프라 작업 분해

### A1. `.github/workflows/e2e.yml` 신설

**트리거:**
- `pull_request` (paths filter: `packages/web/**`, `packages/api-server/**`)
- `push: branches: [dev]`

**러너:** `ubuntu-latest`, 타임아웃 15분

**스텝:**
1. `actions/checkout@v4`
2. `oven-sh/setup-bun@v1`
3. `bun install`
4. `bunx playwright install --with-deps chromium`
5. web 워크스페이스에서 `bun x playwright test`
6. `actions/upload-artifact@v4` — 실패 시 `test-results/` + `playwright-report/` 업로드

**환경 분기:**
- Supabase cloud DEV 엔드포인트 사용 (self-hosted는 로컬 전용)
- 환경변수는 workflow의 `env:` 블록에서 `${{ secrets.* }}`로 주입. `NEXT_PUBLIC_*`는 빌드 타임에 읽히므로 `bun install` + playwright 실행 전에 주입 필수

**Why:** pre-push만으로는 개발자가 `RUN_E2E=1` 안 주면 무효. PR 레벨 gate가 필요.

### A2. CI secret 주입

**필요 secret:**
- `SUPABASE_SERVICE_ROLE_KEY` — admin spec의 service role 인증
- `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` — `tests/auth.setup.ts`가 사용하는 E2E 전용 계정
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — cloud DEV 엔드포인트

**수행 방법:** `gh secret set <NAME> --repo decodedcorp/decoded` (repo admin 권한 필요)

**보안 체크:** secret 값은 대화에 붙여넣지 않고 명령어 기반 주입.

### A3. 첫 CI 실행 + baseline 수집

**절차:**
1. A1/A2 머지 후 첫 PR 트리거로 실행
2. 결과 기록: pass / fail / skip 개수 + 실패 spec 리스트
3. 실패 spec은 이번 스프린트 fix scope-out — 다음 스프린트 백로그로 이전
4. 결과를 `docs/agent/e2e-baseline-2026-04-30.md`에 기록

**분류:**
- **Pass**: 즉시 회귀 방지 역할 시작
- **Fail (flake/env)**: 인프라 이슈 — 다음 스프린트 fix
- **Fail (spec bug)**: 로직 결함 — 이슈 등록 후 백로그
- **Skip (service key 등)**: A2 주입 후 재평가

### A4. pre-push 훅 기본값 정책

**결정:** 현재 `RUN_E2E` 기본 skip 유지.

**이유:** 로컬 개발 속도(훅 실행 시간) > 로컬 pre-push의 한계적 회귀 방지 가치. CI가 primary gate가 되면 pre-push는 옵션.

**후속:** 6주 후 재평가.

### A5. 커버리지 정의 재작성 (`docs/agent/e2e-coverage-definition.md`)

**신 공식:**

```
coverage = (mutation-covered critical flows) / (total critical flows)
target = 80%
```

**"critical flow" 1차 인벤토리:**

1. 로그인 — email/password
2. 로그인 — OAuth (Google)
3. 로그인 — Continue as Guest
4. 로그아웃
5. 업로드 — 파일 선택 → User-type 선택 → 분기 완주 → Submit → POST `/api/v1/posts` → 리다이렉트
6. Engagement — 좋아요 toggle (POST/DELETE + 새로고침 유지)
7. Engagement — 저장 toggle (+ Profile Saved 탭 확인)
8. Engagement — 솔루션 채택 (POST + UI 반영)
9. Profile — 본인 프로필 편집 → 저장 → 반영
10. Profile — 공개 프로필 Follow toggle
11. Magazine — 홈 EditorialCarousel → 상세 → 포스트 상세 네비게이션
12. VTON — 모달 진입 → 사진 업로드 → Try On → 결과 표시
13. Admin — entity CRUD (artist/brand/group-members 중 1개 대표 플로우)
14. Admin — seed 승인/거절
15. 에러 — API 500 → 에러 UI + retry
16. 에러 — 빈 상태 (empty state UI)
17. 에러 — 권한 거부 (비로그인 → /login 리다이렉트)

**"mutation-covered" 기준:**
- spec이 해당 플로우의 핵심 API mutation (POST/PUT/DELETE)의 **호출 + UI 반영**을 모두 assert
- 단순 `page.goto → expect(url)`만으로는 카운트 안 함
- `page.route` mock으로 대체한 경우 — 실 요청 어썬션이 있어야 인정

**baseline (현재):** 총 17개 critical flow 중 mutation-covered = **2개** (좋아요·저장) ≈ **~12%**. 80% 달성까지 약 12개 flow 추가 필요.

**변경 반영:** #162 본문을 이 정의로 edit.

### A6. 새 이슈 `#179: Auth regression safety net`

**라벨:** `testing` + `frontend` + `P1`
**Epic 링크:** #170

**체크리스트 (기존 프로덕션 fix를 회귀 테스트로 변환):**
- [ ] 게스트 세션 지속성 — Continue as Guest → hard navigation → 세션 유지 (#296/#298/#310 회귀)
- [ ] OAuth redirect URL — Google 로그인 → redirect 복귀 → 세션 활성 (#297 회귀)
- [ ] Admin middleware layer order — 비로그인 → /admin → /admin/login 리다이렉트 + admin 로그인 → /admin 접근 성공 (#321 회귀)
- [ ] Admin 세션 토큰 포워딩 — admin 로그인 후 rust admin endpoint 호출 성공 (#319 회귀)
- [ ] Admin 로그아웃 리다이렉트 — /admin에서 logout → /admin/login 이동 (#322 회귀)
- [ ] `auth.users` insert trigger — 신규 가입 → public.users row 생성 (#313/#314 회귀)
- [ ] `checkIsAdmin` maybeSingle 처리 — admin 레코드 없는 사용자에게 500 안 터짐 (#313 회귀)

**data-testid 작업 포함:** 위 플로우에 필요한 testid가 없으면 컴포넌트 수정도 이 이슈 scope.

**본 스프린트 scope:** 이슈 생성 + 체크리스트 확정만. 실제 spec 작성은 다음 스프린트.

### A7. 회고 노트

**위치:** `.omc/notepad.md` 또는 `docs/superpowers/briefs/2026-04-30-e2e-infra-retro.md`

**포함:**
- 이번 스프린트 blocker
- A3 baseline 결과 요약
- 다음 스프린트 추천 (A6 실행 + #171 submit mutation tail + #177 에러/권한)

## 타임박스 일정 (2026-04-24 ~ 2026-04-30)

| 일자 | 작업 |
|---|---|
| 목 04-24 | A1 workflow 파일 작성 + 로컬 dry-run |
| 금 04-25 | A2 secret 주입 + 첫 CI 트리거 |
| 월 04-28 | A3 baseline 수집 + 분류 |
| 화 04-29 | A5 커버리지 정의 문서 + #162 edit |
| 수 04-30 | A6 #179 이슈 등록 + A7 회고 |

## 리스크 + 대응

| 리스크 | 확률 | 영향 | 대응 |
|---|---|---|---|
| repo secret 주입 권한 블로커 | 저 | 고 | 본인이 `gh secret set` 직접 실행 (thxforall이 admin 권한 보유 전제) |
| 첫 CI 실행 시 다수 spec 실패 | 중 | 중 | Day 2 30분 스파이크 → 실패분 scope-out 후 백로그 이전 |
| Cloud DEV seed 오염 | 중 | 중 | `tests/fixtures/cleanup.ts` 추가 + 전용 test-user 격리 |
| "80% 재정의" 팀 합의 없이 단독 진행 | 중 | 고 | PR에 RFC 태그 + 리뷰 요청. #162 edit은 리뷰 후 실행 |
| auth umbrella #179 스코프 팽창 | 저 | 중 | 이번 스프린트는 **이슈만 생성**, 실행은 다음 스프린트 |

## Out of Scope

- 새 feature spec (#171/#173/#175 등) 작성 — 다음 스프린트
- pre-push `RUN_E2E=1` 기본값 전환 — 6주 후 재평가
- `admin/magazine-approval.spec.ts`의 `test.skip` 조건 제거 — 별건
- cypress/vitest 마이그레이션 등 툴 변경 — 논외
- backend E2E (api-server) — 본 epic은 프론트 한정

## 다음 스프린트 preview (참고)

이번 스프린트 완료 후 다음 순서 권장:

1. **#179 Auth safety net** 실행 (P1) — 실증 회귀 방지가 가장 큰 이슈
2. **#171 Submit mutation tail** (P1) — 업로드 포스트 생성 mutation
3. **#177 에러/권한** (P1로 승격) — 안전망
4. **#173 VTON** (P2, 단 AI mock 스파이크 선행)
5. **#175 Profile** (P2, testid 작업 포함)
6. **#176 Admin entity CRUD** (P3)
7. **#174 Magazine 상세** (P3)

## 참고

- Epic: https://github.com/decodedcorp/decoded/issues/170
- Parent roadmap: https://github.com/decodedcorp/decoded/issues/162
- 최근 auth fix PR: #313 #314 #319 #321 #322 #297 #310 #298 #296
- 관련 문서: `docs/agent/web-routes-and-features.md`, `packages/web/scripts/pre-push.sh`
