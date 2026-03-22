# Phase v3-03: AI Audit - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

관리자가 AI 분석 요청 목록을 검토하고 개별 결과를 수정할 수 있는 감사 화면 구축. 목록 조회, 상태 필터(대기/완료/오류/수정됨), 상세 뷰, 아이템 편집(추가/삭제/수정)을 포함한다. 모든 데이터는 mock 기반으로 동작한다.

</domain>

<decisions>
## Implementation Decisions

### 목록 뷰 레이아웃
- 테이블 형식 레이아웃 (카드/그리드 아님)
- 미니멀 정보 밀도: 썸네일 + 상태 뱃지 + 감지 아이템 수 + 요청 시간
- 기본 정렬: 최신 요청 순 (최근 분석이 맨 위)
- 페이지네이션 방식 (무한 스크롤 아님). URL 공유 가능

### 상세 뷰 전환 패턴
- 목록에서 항목 클릭 시 넓은 중앙 모달로 열림 (새 페이지 이동 아님)
- 모달 내부 좌우 분할: 왼쪽에 이미지, 오른쪽에 감지 아이템 목록
- 이미지 위에 기존 Hotspot 컴포넌트로 감지 위치 오버레이 표시
- Hotspot 클릭 시 해당 아이템 하이라이트

### 아이템 편집 인터랙션
- 인라인 편집 방식 (모달/폼 아님) — 목록에서 바로 필드 클릭하여 수정
- 아이템 추가: "+아이템 추가" 버튼 → 빈 행 추가되어 바로 입력
- 아이템 삭제: 즉시 삭제 + toast로 언두(되돌리기) 제공 (확인 다이얼로그 없음)
- 수정 후 상태가 "수정됨"으로 자동 변경

### Mock 데이터 구조
- 패션 도메인 카테고리: 상의, 하의, 신발, 가방, 액세서리 등
- 20~30건의 분석 요청 데이터
- djb2 해시 기반 결정론적 생성 (v3-02 대시보드와 동일 패턴)
- placeholder 이미지 사용 (picsum 또는 단색)

### Claude's Discretion
- 수정 가능한 아이템 필드 범위 (이름, 카테고리, 브랜드, 신뢰도, 위치 등에서 적절히 선택)
- 테이블 컬럼 세부 디자인 및 반응형 처리
- 모달 닫기/ESC 동작
- 상태 뱃지 색상 매핑
- 에러 상태 UI

</decisions>

<specifics>
## Specific Ideas

- 대시보드(v3-02)와 동일한 admin 컴포넌트 패턴 유지: data hook + display component + skeleton variant
- Hotspot 컴포넌트는 기존 디자인 시스템의 것을 재사용
- 인라인 편집은 빠른 감사 워크플로우를 위한 것 — 클릭 → 수정 → 다음 항목으로 빠르게 이동

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-ai-audit*
*Context gathered: 2026-02-19*
