# Phase v4-03: Flow Documents - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

4개 주요 사용자 여정(Discovery, Detail, Creation, User)을 화면 간 네비게이션 계약으로 문서화하고, VTON DRAFT 플로우 1개를 작성한다. 플로우는 "어떤 화면에서 어떤 화면으로, 언제" 전환되는지를 기록하며, "그 화면이 어떻게 동작하는지"는 screen spec(v4-04~07)의 영역이다.

</domain>

<decisions>
## Implementation Decisions

### 플로우 문서 구조
- **포맷: Mermaid + 테이블 혼합** — 전체 흐름은 Mermaid stateDiagram/flowchart로 시각화, 각 전환 상세는 테이블로 구조화
- 200라인 제한 (screen spec과 동일). 긴 플로우는 분리하여 제한 준수
- 테이블 열 구성은 Claude's Discretion (기본 4열 vs 확장 5열 등)
- Entry/Exit point 표현 방식은 Claude's Discretion (별도 섹션 vs Mermaid 내 표현)

### 상태 전이 깊이
- 플로우 = what/when 레벨. store 변화 깊이, API 호출 포함 여부, 에러 상태 포함 범위는 Claude's Discretion
- 상세한 store state shape, UI 동작, 컴포넌트 매핑은 screen spec 영역

### 화면 spec 상호참조
- **책임 경계: 플로우 = what/when, screen spec = how** — 플로우는 "어떤 화면에서 어떤 화면으로, 언제"만 다루고, UI/컴포넌트/상태 상세는 screen spec
- **실제 라우트 경로 포함** — 각 화면에 Next.js route 경로를 명시 (/images/[id], /posts/[id] 등)
- screen spec 참조 형식, _shared/ 파일 참조 방식, 플로우 간 교차 참조 형식, Dependencies 섹션 포함 여부, 컴포넌트 언급 방식은 Claude's Discretion

### VTON DRAFT 범위
- FLW-05 작성 수준, 코드베이스 참조 여부, 승인 전 사용 제한 방식, 기존 플로우와의 연결점 포함 여부는 Claude's Discretion
- ROADMAP에 명시된 대로 DRAFT 상태로 표시되어야 함

### Claude's Discretion
- 테이블 열 구성 (From→To, Trigger, Store Changes, Data Fetched, Error State 등에서 선택)
- Entry/Exit point 표현 방식
- Store 변화 기록 깊이 (store 이름만 vs 핵심 필드 vs 전체 shape)
- API 호출 포함 여부 및 깊이
- 에러/예외 분기 포함 범위 (happy path only vs 주요 분기)
- 플로우 간 교차 참조 형식 (크로스 레퍼런스 vs 중복 기술)
- screen spec 참조 형식 (확정 경로 vs ID만)
- _shared/ 파일 참조 형식 (직접 링크 vs 파일명만)
- Dependencies 섹션 포함 여부
- 컴포넌트 언급 시 표현 방식
- FLW-05 VTON DRAFT 전체 작성 전략

</decisions>

<specifics>
## Specific Ideas

- 플로우는 네비게이션 계약 — "어떤 화면에서 어떤 화면으로, 언제" 수준의 문서
- 이후 screen spec(v4-04~07)이 이 플로우 파일을 참조하여 각 화면의 상세 동작을 기술
- FLW-05 VTON은 ROADMAP에 "DRAFT 상태로 표시되어 별도 파일에 초안이 존재하며, 승인 전까지 참조 파일로만 사용" 명시

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: v4-03-flow-documents*
*Context gathered: 2026-02-19*
