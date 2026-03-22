# Phase v4-08: Next Version Draft - Context

**Gathered:** 2026-02-20
**Status:** Ready for planning

<domain>
## Phase Boundary

DRAFT 상태의 미래 서비스 방향 문서 4종(NEXT-01~04)을 `specs/_next/`에 작성한다. 현재 코드베이스 기준의 구현 spec이 아닌, 승인 전 방향성 초안이다. 코드 변경 없음.

</domain>

<decisions>
## Implementation Decisions

### 문서 깊이와 형식
- 방향성 메모 수준 (50줄 이내 목표). PRD나 상세 spec이 아닌 핵심 컨셉/목표/대략적 범위만 담는 초안
- 4개 문서 모두 동일한 통일 템플릿 사용 (섹션 구성은 Claude 재량)
- 대상 독자: 내부 의사결정용 + 나중에 AI 에이전트 컨텍스트 주입용 (둘 다)

### 소스 자료
- 기존 자료 없음 — ROADMAP.md의 NEXT-01~04 요구사항 설명 + FLW-05 VTON 드래프트를 참고하여 Claude가 생성
- NEXT-01 서비스 아이덴티티: "넥스트 제너레이션 매거진" 방향 — 현재 decoded의 이미지/아이템 디스커버리 컨셉을 매거진 포맷으로 고도화 (에디토리얼 큐레이션 + AI 추천)

### DRAFT 경계 표시
- 경고문 위치/강도: Claude 재량
- 파일 네이밍: ROADMAP 명시대로 (NEXT-01-service-identity.md, NEXT-02-vton-spec.md, NEXT-03-dynamic-ui.md, NEXT-04-commerce-bridge.md)
- injection-guide.md에 NEXT-* 파일 로딩 규칙 추가 필요 — "NEXT-* 파일은 현재 구현용으로 주입하지 말 것" 류의 가드레일

### 4개 문서 간 관계
- NEXT-01(Service Identity)이 기반 문서. 서비스 전체 방향을 정의하고 NEXT-02~04는 그 위에 세부 기능을 정의
- NEXT-02~04 간 관계: Claude 재량으로 판단
- 상호 참조 여부: Claude 재량 (필요한 경우에만)
- 현재 구현 spec(SCR-*, FLW-*) 참조 여부: Claude 재량 (자연스러운 연결이 있을 때만)

### Claude's Discretion
- 통일 템플릿의 구체적 섹션 구성
- DRAFT 경고문 위치와 문구
- NEXT-02~04 간 의존성 관계
- 상호 참조 및 기존 spec 참조 여부/방식
- 분리 장치 (디렉토리 + 파일 내 경고문 외 추가 장치 필요 여부)

</decisions>

<specifics>
## Specific Ideas

- 서비스 아이덴티티: "넥스트 제너레이션 매거진" — 기존 decoded 이미지/아이템 디스커버리를 매거진 포맷으로 고도화
- 모든 NEXT-* 문서는 승인 전까지 DRAFT이며, 현재 구현과 혼동되어서는 안 됨
- injection-guide에 NEXT-* 가드레일 추가는 이 페이즈 범위에 포함

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-next-version-draft*
*Context gathered: 2026-02-20*
