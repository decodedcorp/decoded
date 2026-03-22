# Phase v3-04: AI Cost Monitoring - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

관리자가 AI API 호출 수, 토큰 사용량, 비용 추정을 기간별로 모니터링할 수 있는 페이지 구축. 모든 데이터는 mock data로 동작. 예산 관리, 알림, 실제 API 연동은 범위 밖.

</domain>

<decisions>
## Implementation Decisions

### Overview layout
- Claude's discretion: KPI cards vs chart-first layout, page structure (single scroll vs tabs), visual style
- Constraint: should feel consistent with existing admin pages (v3-02 Dashboard pattern)
- Claude's discretion: KPI card count and content

### Chart design
- Claude's discretion: token usage chart type (stacked area vs separate lines)
- Claude's discretion: API call chart type (bar vs line)
- Claude's discretion: model-level color breakdown vs aggregate
- Claude's discretion: total number of chart sections
- Constraint: use recharts (already installed from v3-02)

### Period & filtering
- Claude's discretion: date range presets (e.g., 7d/30d/90d, with or without custom picker)
- Claude's discretion: model filter (dropdown vs always show all)
- Claude's discretion: previous period comparison (delta display on KPIs)
- Claude's discretion: global vs per-chart period selector
- Reference: v3-02 Dashboard uses page-level period selector pattern

### Cost estimation display
- Currency: USD ($) format for all cost displays
- AI model list: placeholder for now — user will specify exact models later
- Claude's discretion: cost breakdown format (table vs cards)
- Claude's discretion: budget/threshold indicator inclusion

### Claude's Discretion
- Page layout structure and KPI selection
- All chart types and visual treatments
- Period selector presets and filtering approach
- Cost breakdown format
- Model breakdown approach in charts
- Budget indicator inclusion
- Skeleton/loading/error states

</decisions>

<specifics>
## Specific Ideas

- Currency must be USD ($) — AI API costs are priced in dollars
- AI model list will be specified by user later — use placeholder models during planning/research
- Should maintain visual consistency with v3-02 Dashboard page
- Mock data should provide realistic cost ranges for AI API usage

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-ai-cost-monitoring*
*Context gathered: 2026-02-19*
