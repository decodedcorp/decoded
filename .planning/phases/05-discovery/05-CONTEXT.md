# Phase v4-05: Screen Specs — Discovery - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Discovery 번들 4개 화면(Home, Search, Feed, Explore)의 screen spec을 현재 코드베이스 기준으로 재작성. 기존에 확인된 stale 파일경로(HomeClient, GlobalHeader)를 현재 경로로 교체. AI 에이전트가 해당 화면을 수정할 때 파일경로 오류 없이 올바른 컴포넌트를 참조할 수 있도록 문서화.

**Screens:**
- SCR-DISC-01: Home (Hero, trending, best, celebrity grid)
- SCR-DISC-02: Search (fullscreen overlay, multi-tab results)
- SCR-DISC-03: Feed (social feed timeline, FeedCardBase)
- SCR-DISC-04: Explore (category filter grid, filterStore)

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

All areas discussed were delegated to Claude's judgment. The following decisions should be guided by:
- Consistency with v4-04 Detail View specs (established patterns)
- 200-line spec limit compliance
- AI agent usability (what does an agent need to correctly modify these screens?)

#### Home Screen Complexity
- Claude decides: section-by-section vs flat wireframe format (optimize for 200-line limit)
- Claude decides: inline data source mapping vs reference to api-contracts.md
- Claude decides: stale path marker style (follow v4-04 inline ⚠️ pattern or adapt)
- Claude decides: animation documentation depth (trigger-level vs existence-level)

#### Search Overlay Behavior
- Claude decides: per-tab result layout vs generic pattern with variants table
- Claude decides: searchStore state diagram inline vs store-map.md reference
- Claude decides: platform-specific interaction details (follow v4.0 mobile-first template)
- Claude decides: overlay lifecycle documentation depth (mount/unmount, backdrop, scroll lock)

#### NOT-IMPL Handling
- Claude decides: marker style (follow v4-04 inline ⚠️ convention for consistency)
- Claude decides: mock-data vs missing distinction (single marker vs dual)
- Claude decides: STATE.md accumulation of significant NOT-IMPL findings (follow v4-04 pattern)
- Claude decides: flow doc cross-references for NOT-IMPL items

#### Cross-Screen Navigation
- Claude decides: inline nav context section vs FLW-01 reference only
- Claude decides: parallel route (@modal) mechanism documentation depth
- Claude decides: shared interaction patterns (document once vs per-spec)
- Claude decides: NavBar active state notation per spec

</decisions>

<specifics>
## Specific Ideas

No specific requirements — user delegated all formatting and documentation approach decisions to Claude. The guiding principle is **consistency with v4-04 patterns** and **optimizing for AI agent usability within 200-line limit**.

Key constraints from prior phases:
- EARS syntax for requirements (established in v4-01-02)
- Mobile-first ordering (mobile wireframe primary, desktop is adaptation delta)
- Component file paths must be verified against actual filesystem
- Anti-features to avoid: i18n sections, version history tables, copied TypeScript types, placeholder sections

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-discovery*
*Context gathered: 2026-02-19*
