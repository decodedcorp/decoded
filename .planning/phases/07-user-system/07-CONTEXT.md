# Phase v4-07: Screen Specs — User System - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

User System 번들의 3개 화면 spec 작성: login, profile, earnings. authStore 상태 기준으로 인증 조건부 렌더링 패턴을 정확하게 문서화한다. 이전 phase들과 동일한 v4.0 spec 규칙 적용 (EARS 구문, 모바일 퍼스트, 200라인 제한, 검증된 파일경로).

</domain>

<decisions>
## Implementation Decisions

### Login flow (SCR-USER-01)
- Google OAuth만 문서화 — Kakao, Apple은 코드에 존재하지만 spec 범위 밖
- 에러/엣지 케이스 처리: Claude가 코드 확인 후 구현된 것만 문서화, 미구현은 NOT-IMPL 표시
- 로그인 후 리다이렉트: Claude가 현재 redirect 로직 확인하여 문서화
- Guest/anonymous 접근 패턴: Claude가 코드 구조 기반으로 적절히 포함 여부 결정

### Profile screen (SCR-USER-02)
- Own-profile vs other-user profile: Claude가 코드 확인하여 구현 상태 문서화
- Activity tabs 구성: Claude가 현재 탭 구현 확인하여 문서화
- Badge/stats 상세도: Claude가 구현 상태에 따라 결정 — 실제 동작하는 것은 full doc, stub은 NOT-IMPL
- Profile edit: Claude가 편집 기능 존재 여부 확인 후 포함 결정

### Earnings & tracking (SCR-USER-03)
- 구현 상태: Claude가 코드베이스에서 실제 구현 수준 확인 (실 데이터 vs mock/stub)
- 대상 사용자: Claude가 코드에서 접근 권한 패턴 확인
- Affiliate 메커니즘: Claude가 screen spec 범위에 적합한 수준으로 결정 (대시보드 표시 중심)
- Period selector: Claude가 현재 구현 문서화

### Auth-conditional patterns (cross-cutting)
- 문서화 방식: Claude가 inline vs shared reference 중 최적 접근 결정
- 미인증 접근 동작: Claude가 현재 auth guard 구현 확인
- Session expiry: Claude가 screen spec 범위에 적합한 수준으로 결정
- authStore shape: 연구/계획 단계에서 검증 (STATE.md pending todo 항목)

### Claude's Discretion
- 대부분의 구현 세부사항이 Claude 재량 — 사용자가 명시한 유일한 고정 결정은 **Google OAuth만 문서화**
- 나머지 모든 영역은 코드 확인 후 구현 상태 기반으로 문서화 방식 결정
- v4.0 기존 패턴 (이전 phase 스타일) 유지하되 User System 도메인에 맞게 조정

</decisions>

<specifics>
## Specific Ideas

- "일단 구글만" — OAuth provider 중 Google만 spec 범위. Kakao/Apple은 코드에 존재해도 spec에서 제외
- 이전 phase에서 확립된 NOT-IMPL 패턴 계속 사용 (UI-only stub, mock data, disconnected store 등 표시)
- STATE.md pending todo: "Before v4-07: Verify authStore user/session type + auth-conditional rendering patterns" — 연구 단계에서 반드시 수행

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-user-system*
*Context gathered: 2026-02-19*
