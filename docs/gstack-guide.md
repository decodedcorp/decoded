# gstack 팀 가이드

> gstack은 AI 코딩 도구(Claude Code, Cursor 등)에 스프린트 워크플로우를 부여하는 오픈소스 스킬 세트입니다.
> 28개 슬래시 커맨드가 Think → Plan → Build → Review → Test → Ship → Reflect 순서로 작동합니다.

## 빠른 시작

### Claude Code 사용자

```bash
# 1. 레포 pull 후 한 번만 실행
cd .claude/skills/gstack && ./setup

# 2. 바로 사용 가능
# Claude Code 채팅에서:
/office-hours    # 제품 방향 진단
/review          # 코드 리뷰
/qa              # 브라우저 QA 테스트
```

### Cursor 사용자

```bash
# git pull만 하면 .agents/skills/gstack-*/SKILL.md가 자동 감지됨
# Cursor 채팅에서:
@gstack-review      # 코드 리뷰
@gstack-qa          # QA 테스트
@gstack-office-hours # 제품 진단
```

> Cursor에서 브라우저 자동화(`/browse`, `/qa`)를 쓰려면 bun 설치 후 `cd .claude/skills/gstack && ./setup` 필요

---

## 스프린트 워크플로우

```
Think → Plan → Build → Review → Test → Ship → Reflect
```

각 단계의 스킬이 이전 단계의 결과를 자동으로 참조합니다.

### 1. Think (생각)

| 커맨드 | 역할 | 언제 쓰나 |
|--------|------|-----------|
| `/office-hours` | YC Office Hours 파트너 | 새 기능/제품 아이디어가 있을 때. 6가지 질문으로 수요 검증, 전제 도전, 대안 생성. 디자인 문서 출력. |

### 2. Plan (계획)

| 커맨드 | 역할 | 언제 쓰나 |
|--------|------|-----------|
| `/plan-ceo-review` | CEO / 창업자 | 스코프를 재검토하고 싶을 때. 4가지 모드: Expansion, Selective, Hold, Reduction |
| `/plan-eng-review` | 엔지니어링 매니저 | 아키텍처, 데이터 흐름, 엣지 케이스, 테스트 계획을 확정할 때 |
| `/plan-design-review` | 시니어 디자이너 | UI/UX 디자인 차원별 0-10 평가 + 개선안 |
| `/design-consultation` | 디자인 파트너 | 디자인 시스템을 처음부터 만들 때 |
| `/autoplan` | 자동 리뷰 파이프라인 | CEO → Design → Eng 리뷰를 순차 자동 실행 |

### 3. Build (구현)

| 커맨드 | 역할 | 언제 쓰나 |
|--------|------|-----------|
| `/browse` | 브라우저 자동화 | 웹사이트 테스트, 폼 작성, 스크린샷 등 (Playwright 기반) |

### 4. Review (리뷰)

| 커맨드 | 역할 | 언제 쓰나 |
|--------|------|-----------|
| `/review` | 스태프 엔지니어 | PR 전 코드 리뷰. 프로덕션 버그 자동 발견 + 수정 |
| `/design-review` | 디자이너 겸 코더 | 디자인 감사 + 직접 코드 수정. 커밋 포함 |
| `/cso` | 보안 담당자 | OWASP Top 10 + STRIDE 보안 감사 |

### 5. Test (테스트)

| 커맨드 | 역할 | 언제 쓰나 |
|--------|------|-----------|
| `/qa` | QA 리드 | 실제 브라우저를 열어 클릭, 입력, 검증. 버그 발견 시 자동 수정 |
| `/qa-only` | QA 리포트 | `/qa`와 동일하지만 수정 없이 리포트만 생성 |

### 6. Ship (배포)

| 커맨드 | 역할 | 언제 쓰나 |
|--------|------|-----------|
| `/ship` | 릴리스 엔지니어 | 테스트 실행 → 커버리지 확인 → PR 생성까지 한 번에 |
| `/land-and-deploy` | 배포 매니저 | 머지 → 배포 → 카나리 검증 |

### 7. Monitor (모니터링)

| 커맨드 | 역할 | 언제 쓰나 |
|--------|------|-----------|
| `/canary` | 배포 후 모니터링 | 배포 후 이상 감지 루프 |
| `/benchmark` | 성능 감시 | 성능 회귀 탐지 |

### 8. Debug (디버깅)

| 커맨드 | 역할 | 언제 쓰나 |
|--------|------|-----------|
| `/investigate` | 체계적 디버거 | 근본 원인 분석. 3번 실패하면 자동 에스컬레이션 |

### 9. Reflect (회고)

| 커맨드 | 역할 | 언제 쓰나 |
|--------|------|-----------|
| `/retro` | 스프린트 회고 | 브랜치 작업 요약, LOC, 커밋 분석, 개선점 도출 |
| `/document-release` | 문서 엔지니어 | 배포 후 문서 업데이트 |

### 10. Safety (안전장치)

| 커맨드 | 역할 | 언제 쓰나 |
|--------|------|-----------|
| `/careful` | 위험 작업 방지 | 파괴적 명령어(rm -rf, force push 등) 실행 전 경고 |
| `/freeze` | 코드 동결 | 특정 파일/디렉토리 변경 금지 |
| `/guard` | 가드레일 | freeze + careful 동시 적용 |
| `/unfreeze` | 동결 해제 | freeze 해제 |

### 11. Utility

| 커맨드 | 역할 | 언제 쓰나 |
|--------|------|-----------|
| `/gstack-upgrade` | gstack 업데이트 | 새 버전으로 업그레이드 |
| `/codex` | 멀티 AI 의견 | 다른 AI 모델의 세컨드 오피니언 |
| `/connect-chrome` | Chrome 연결 | 브라우징용 Chrome 연결 |

---

## 추천 워크플로우

### 새 기능 개발

```
/office-hours          # 1. 아이디어 정리 + 디자인 문서
/plan-eng-review       # 2. 아키텍처 확정
(구현)                  # 3. 코드 작성
/review                # 4. 코드 리뷰
/qa https://localhost:3000  # 5. QA 테스트
/ship                  # 6. PR 생성 + 배포
```

### 빠른 버그 수정

```
/investigate           # 1. 근본 원인 분석
(수정)                  # 2. 코드 수정
/review                # 3. 리뷰
/ship                  # 4. 배포
```

### PR 전 체크

```
/review                # 코드 품질 + 버그
/cso                   # 보안 감사
/qa                    # 브라우저 테스트
/ship                  # PR 생성
```

---

## 팀 합의 사항

### 필수 사용 (모든 PR)
- `/review` — PR 생성 전 최소 1회 실행

### 권장 사용
- `/qa` — UI 변경이 있는 PR
- `/plan-eng-review` — 새 기능 또는 아키텍처 변경
- `/cso` — 인증, 결제, 개인정보 관련 변경

### 선택 사용
- `/office-hours` — 새 제품/기능 아이디어
- `/retro` — 스프린트 종료 시
- `/design-review` — 디자인 시스템 변경

---

## 문제 해결

### 스킬이 인식되지 않을 때
```bash
cd .claude/skills/gstack && ./setup
```

### browse/QA가 안 될 때
```bash
# bun 설치 확인
bun --version
# Playwright Chromium 설치
cd .claude/skills/gstack && bunx playwright install chromium
```

### 업데이트
```bash
# 최신 gstack으로 업데이트
cd .claude/skills/gstack && git pull origin main && ./setup
```

---

## 참고

- [gstack GitHub](https://github.com/garrytan/gstack) — 소스 코드 및 공식 문서
- [Boil the Lake](https://garryslist.org/posts/boil-the-ocean) — gstack 철학: AI 시대에는 완전한 구현이 거의 무료
- 디자인 문서 저장 위치: `~/.gstack/projects/` (로컬, 팀 간 공유 안 됨)
