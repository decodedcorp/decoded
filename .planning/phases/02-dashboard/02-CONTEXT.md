# Phase v3-02: Dashboard - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

관리자가 서비스 핵심 지표를 한눈에 파악하고 트래픽 추이를 차트로 확인할 수 있는 대시보드 페이지. KPI 카드, 트래픽 차트, 오늘의 요약 섹션으로 구성. 데이터 분석이나 사용자 관리 기능은 별도 페이즈.

</domain>

<decisions>
## Implementation Decisions

### KPI 카드 구성
- Vercel Dashboard 스타일 레퍼런스 — 미니멀, 다크 테마 친화적, 깔끔한 카드
- 지표 구성, 변화량(Δ) 표시 여부, 레이아웃은 Claude 재량으로 결정 (로드맵 기준 DAU, MAU, 총 유저, 총 포스트, 총 솔루션)

### 차트 시각화
- 차트 라이브러리: **Recharts** (확정)
- 차트 타입(라인/바), 기간 선택 UI, 지표 배치(개별 vs 겹침)는 Claude 재량
- 로드맵 기준 지표: 일별 DAU, 검색 수, 클릭 수 추이

### 오늘의 요약 섹션
- 배치 위치, 표시 항목, 스타일, 타임스탬프 표시 여부 모두 Claude 재량
- 로드맵 기준 항목: 당일 신규 포스트, 솔루션, 클릭 수

### 데이터 소스 전략
- **실제 API 우선** — 기존 Supabase에서 가져올 수 있는 데이터(유저 수, 포스트 수, 솔루션 수 등)는 실제 데이터 사용
- 시계열 데이터(일별 DAU, 검색/클릭 추이 등) 존재 여부는 Claude가 기존 테이블 확인 후 판단, 없으면 mock
- 로딩 상태: **스켈레톤 로딩** (카드, 차트 모두), 에러 시 재시도 버튼

### Claude's Discretion
- KPI 카드 지표 구성 및 레이아웃 (Vercel Dashboard 레퍼런스 참고)
- KPI 변화량(Δ) 표시 여부 및 방식
- 차트 타입, 기간 선택 UI, 지표별 차트 분리 방식
- 오늘의 요약 섹션 전체 디자인 및 배치
- 차트 시계열 데이터 소스 (기존 테이블 확인 후 실제 or mock 판단)
- 데이터 자동 새로고침 여부 및 간격

</decisions>

<specifics>
## Specific Ideas

- "Vercel Dashboard 스타일" — 미니멀하고 정보 밀도 적절한 카드, 다크 테마에 잘 어울리는 디자인
- 스켈레톤 로딩으로 빈 화면 없이 자연스러운 UX 제공

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-dashboard*
*Context gathered: 2026-02-19*
