# Phase v2-09: Documentation & Polish - Context

**Gathered:** 2026-02-05
**Status:** Ready for planning

<domain>
## Phase Boundary

디자인 시스템 문서화 완료 및 모든 페이지의 시각적 일관성 검증. decoded.pen을 기준으로 구현 상태를 비교하고, 발견된 차이점을 pixel-perfect 수준으로 수정. 새로운 기능 추가 없이 문서와 시각적 품질에만 집중.

</domain>

<decisions>
## Implementation Decisions

### 문서 구조
- **위치**: docs/design-system/에 문서 작성, decoded.pen을 primary reference로 참조
- **형식**: Markdown + 코드 스니펫, 시각 예시는 decoded.pen 링크로 대체
- **언어**: 한국어로 작성
- **깊이**: Full reference — 모든 토큰 값, 모든 props, 포괄적인 예시 포함

### 업데이트 범위
- **Codebase docs**: .planning/codebase/ 전체 (STACK, ARCHITECTURE, STRUCTURE, CONVENTIONS 등)
- **Specs**: specs/ 폴더의 모든 컴포넌트 스펙에 v2.0 구현 노트 추가
- **CLAUDE.md**: 디자인 시스템 섹션 추가 (import paths, 컴포넌트 사용법, 토큰 참조)
- **기타**: README.md (packages/web), docs/api/ 가이드도 함께 업데이트

### Visual QA 접근법
- **방법**: Hybrid — Playwright 자동 스크린샷 + 수동 리뷰
- **Breakpoints**: All Tailwind breakpoints (375px, 640px, 768px, 1024px, 1280px, 1440px)
- **대상 페이지**: Claude 판단 — 중요 페이지 우선 선정
- **스크린샷 저장**: docs/qa-screenshots/에 커밋하여 시각적 히스토리 유지

### Polish 우선순위
- **기준**: decoded.pen과 현재 구현 간 delta 확인
- **타입**: 모든 유형 동등하게 처리 (spacing, typography, color, alignment)
- **애니메이션**: 포함 — 페이지, 모달, 스크롤 트랜지션 리뷰 및 정제
- **품질 기준**: Pixel perfect — decoded.pen과 정확히 일치

### Claude's Discretion
- QA 대상 페이지 선정 (중요도 기반)
- 문서 섹션 구성 및 예시 코드 선택
- 스크린샷 파일명 규칙

</decisions>

<specifics>
## Specific Ideas

- decoded.pen이 디자인의 single source of truth
- 문서에서 시각 예시 필요 시 decoded.pen 링크로 대체 (스크린샷 임베드 대신)
- 코드베이스 문서는 v2.0 디자인 시스템 구조를 반영해야 함
- CLAUDE.md에 디자인 시스템 import path와 사용 가이드라인 추가

</specifics>

<deferred>
## Deferred Ideas

None — 논의가 phase scope 내에서 유지됨

</deferred>

---

*Phase: v2-09-documentation-polish*
*Context gathered: 2026-02-05*
