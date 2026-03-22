# Phase v3-05: Pipeline & Server Logs - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

관리자가 요청 파이프라인(업로드→분석→감지) 실행 현황을 조회하고, 서버 API 로그를 검색/필터/스트리밍할 수 있는 두 가지 뷰어 구축. 모든 데이터는 mock 기반. 실제 백엔드 연동은 별도 마일스톤.

</domain>

<decisions>
## Implementation Decisions

### 파이프라인 목록 레이아웃
- 테이블 행 형태로 파이프라인 목록 표시 (기존 관리자 패널 패턴과 일관성)
- 행 클릭 시 상세 펼침 방식은 Claude 재량 (아코디언 또는 사이드 패널)
- 단계별 상세 정보 밀도(상태/시간/로그/입출력) Claude 재량
- 정렬 및 필터(시간순, 상태별, 기간별) Claude 재량

### 로그 뷰어 표시 방식
- 컬럼 구성 Claude 재량 (핵심 5칸 기본, 필요 시 확장)
- 필터링 UX Claude 재량 (탭 기반 또는 드롭다운 조합)
- 에러 시각적 구분 방식 Claude 재량 (행 배경색 또는 상태 뱃지)
- 행 클릭 시 상세 수준 Claude 재량

### 실시간 스트리밍 UI
- 터미널/콘솔 스타일: 검은 배경에 모노스페이스 글꼴, 실제 터미널처럼 보이는 느낌
- 2-3초 간격 mock polling으로 새 로그 추가
- 페이지 내 배치 위치 Claude 재량
- 일시정지/재개 + 추가 컨트롤 Claude 재량

### 에러 추적 & 재시도
- 에러 파이프라인 필터 및 표시 방식 Claude 재량
- 재시도 버튼 동작(즉시 성공 vs 랜덤) Claude 재량
- 스택 트레이스 표시 여부 Claude 재량

### 페이지 구성
- 파이프라인과 서버 로그의 페이지 분리/통합 Claude 재량 (사이드바 구조에 맞게 결정)

### Claude's Discretion
- 파이프라인 상세 펼침 방식 (아코디언 vs 사이드 패널)
- 단계별 표시 정보 밀도
- 로그 테이블 컬럼 구성 및 필터 UX
- 에러 시각적 하이라이팅 방식
- 스트리밍 영역 페이지 내 위치 및 컨트롤 구성
- 재시도 mock 동작 방식
- 스택 트레이스 포함 여부
- 파이프라인/서버 로그 페이지 분리 또는 통합

</decisions>

<specifics>
## Specific Ideas

- 실시간 스트리밍 UI는 터미널/콘솔 느낌: 검은 배경 + 모노스페이스 글꼴 + tail -f 스타일
- 2-3초 간격 폴링으로 자연스러운 실시간 느낌 (초당 0.5개 정도 로그 추가)
- 파이프라인 목록은 테이블 형태 (AI Audit 테이블과 유사한 패턴)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-pipeline-server-logs*
*Context gathered: 2026-02-19*
