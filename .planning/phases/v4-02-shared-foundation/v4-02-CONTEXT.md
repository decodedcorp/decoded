# Phase v4-02: Shared Foundation - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

모든 화면 spec이 공통으로 참조하는 기반 문서 5개를 작성한다. AI 에이전트가 임의 파일 경로를 추측하지 않고, 올바른 컴포넌트/스토어/API를 참조할 수 있게 하는 것이 핵심 목표.

산출물: `specs/_shared/` 하위 5개 파일
- component-registry.md
- data-models.md
- api-contracts.md
- store-map.md
- injection-guide.md

</domain>

<decisions>
## Implementation Decisions

### Component Registry 구조
- **형식:** Hybrid — 상단에 요약 테이블(컴포넌트명, 파일경로, 역할 1줄 요약) + 하단에 컴포넌트별 상세 섹션
- **Props 깊이:** Core + notable — 필수 props + 행동이 달라지는 주요 optional props 기록. 전체 props는 코드에서 참조
- **그룹핑:** 디자인 시스템 계층 — Primitive → Composite → Feature 구조 (Atomic Design 스타일)
- **소스 파일 경로:** 모든 컴포넌트에 `lib/design-system/` 하위 실제 파일 경로 명시

### Data Models & API Contracts
- **타입 형식:** TypeScript 코드 블록으로 타입 정의 복사 + 소스 파일 경로 명시. AI가 최신 타입은 코드에서 직접 확인 가능
- **데이터 범위:** API response 타입 + Zustand store state 타입 포함. 화면에서 실제 사용하는 데이터 중심
- **API 깊이:** Full OpenAPI 스타일 — route, method, query params, request body, response shape 모두 기록
- **소스 기준:** Claude's Discretion — 현재 코드를 읽어서 문서화

### Store Map 상세도
- **상태 기록:** 핵심 필드 + 상태 전이 다이어그램 — 주요 state 필드와 함께 상태가 어떻게 변하는지 흐름 기록
- **requestStore:** v4-02에서는 기본 정보만 기록, step enum 상세 검증은 v4-06(Creation-AI)에서 처리
- **화면 매핑:** Claude's Discretion — store → 화면 리스트 또는 매트릭스 중 적절한 방식 선택

### Injection Guide 프로토콜
- **작업 유형 분류:** Claude's Discretion — 실제 코드베이스 작업 패턴에 맞게 분류
- **파일 로딩 지시 형식:** Claude's Discretion — decision tree, 테이블 등 적절한 형식 선택
- **로딩 순서:** Claude's Discretion — 순서 명시 여부와 방식 판단
- **README 관계:** injection-guide.md가 single source of truth. README에서는 링크만 제공, 중복 제거

### Claude's Discretion
- Component registry의 사용 예시(usage example) 포함 범위 — 컴포넌트 복잡도에 따라 판단
- Store와 화면 간 매핑 표현 방식
- transitionStore FLIP 패턴의 store map 포함 범위
- Injection guide 전체 설계 (작업 유형, 로딩 형식, 순서)

</decisions>

<specifics>
## Specific Ideas

- v4-01-02에서 README에 injection guide quick-reference 테이블이 이미 존재 — injection-guide.md 작성 후 README는 링크로 교체
- requestStore step enum은 STATE.md에 "Before v4-06: Verify requestStore step enum values" 로 pending todo 등록됨
- transitionStore FLIP 패턴은 STATE.md에 "Before v4-04: Verify transitionStore shape + useFlipTransition.ts" 로 pending todo 등록됨

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: v4-02-shared-foundation*
*Context gathered: 2026-02-19*
