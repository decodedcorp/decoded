# Phase v4-04: Screen Specs — Detail View - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Detail View 번들의 4개 화면 screen spec을 현재 코드 기준으로 작성. AI 에이전트가 해당 화면 수정 시 파일경로 오류 없이 올바른 컴포넌트를 참조할 수 있게 한다. 코드 변경 없는 documentation-only 작업.

대상 파일:
- `specs/screens/detail/SCR-VIEW-01-post-detail.md`
- `specs/screens/detail/SCR-VIEW-02-spot-hotspot.md`
- `specs/screens/detail/SCR-VIEW-03-item-solution.md`
- `specs/screens/detail/SCR-VIEW-04-related-content.md`

</domain>

<decisions>
## Implementation Decisions

### 4개 스크린 경계 분할

- **VIEW-01 (Post Detail)** = 페이지 전체 레이아웃 — Hero, 메타데이터, 썸네일 배치. `/images/[id]`와 `/posts/[id]` 두 route 모두 포함 (공통점 + 차이점 섹션)
- **VIEW-02 (Spot Hotspot)** = 인터랙션 레이어 — Hotspot 오버레이, 탭/선택/애니메이션, SpotDetail 패널 진입까지
- **VIEW-03 (Item/Solution)** = 쇼핑 연결 — 아이템/솔루션 상세 + 외부 쇼핑 링크 동작
- **VIEW-04 (Related Content)** = 콘텐츠 추천 — "More from this Look" 관련 콘텐츠 그리드/캐러셀
- 경계 원칙: VIEW-01 = 페이지, VIEW-02 = 인터랙션 오버레이, VIEW-03 = 쇼핑 연결, VIEW-04 = 추천 영역
- 교차 참조: ID + 핵심 계약 1줄 형식 (예: `See: SCR-VIEW-02 — tap triggers spot-selected state, panel opens with solutions`)

### 와이어프레임 & 컴포넌트 깊이

- ASCII 와이어프레임: **컴포넌트 레벨 상세** — 버튼, 텍스트, 아이콘 위치까지 표시
- 컴포넌트 트리: **2단계까지** — 페이지 직계 자식 + 그 안의 주요 디자인 시스템 컴포넌트
- 모바일 + 데스크탑 **둘 다** 와이어프레임 포함
- 라인 제한: **300라인까지 허용** (두 포맷 포함 justification)
- 데스크탑 적응: ASCII 와이어프레임 별도 + 텍스트 델타 설명
- 브레이크포인트별 컴포넌트 대체는 **테이블 형식**으로 기록:

```
| Element    | Mobile          | Desktop          |
|------------|-----------------|------------------|
| SpotDetail | BottomSheet     | Side Panel       |
| Grid       | 2-col           | 4-col            |
```

- 파일경로: 디자인 시스템 컴포넌트는 **component-registry 참조**, 비-DS 컴포넌트만 직접 경로 기록

### FLIP 애니메이션 & transitionStore

- transitionStore shape는 **spec 작성 전에 리서처가 실제 코드에서 검증** (STATE.md 펜딩 투두 실행)
- 상태 전이 표현: **EARS 요구사항으로 변환** — "When [hotspot tapped], the system shall [show SpotDetail panel]" 형식
- FLIP 애니메이션 기술 수준과 useFlipTransition 훅 포함 여부: Claude's Discretion (FLW-02와 중복 없이)

### 현재 구현 vs 의도된 동작

- Spec 범위: **as-is + should-be** — 구현된 것 + 설계 의도 모두 포함
- 미구현 기능: EARS 요구사항 뒤에 태그 — `✅` (구현됨) / `⚠️ NOT-IMPL` (미구현) / `📋 PLANNED` (계획됨)
- Related Content(VIEW-04) 추천 로직 구현 상태: **리서처에서 확인 필요** (사용자 불확실)
- STALE-PATHS-AUDIT.md의 Detail View 관련 stale 경로: 리서처가 현재 코드와 대조 검증 후, spec에 `⚠️ stale: 이전 경로` / `✅ verified: 현재 경로` 병기

### Claude's Discretion

- FLIP 애니메이션 기술 수준 (FLW-02 참조 vs 화면 spec 내 시퀀스 포함)
- useFlipTransition 훅 시그니처 포함 여부
- v4-01 screen spec 템플릿의 Detail View 특성 맞춤 조정 여부
- 200 vs 300 라인 범위 내에서 각 spec별 정보 밀도 조절

</decisions>

<specifics>
## Specific Ideas

- `/images/[id]`를 기본 route로 작성하고, `/posts/[id]`는 차이점 델타 섹션으로 추가
- 브레이크포인트 테이블은 SpotDetail(BottomSheet→SidePanel), Grid(2→4col), Hero(full→centered) 패턴 참고
- EARS 요구사항 + 구현 상태 태그 조합으로 미래 개발 시 "무엇이 빠져있는지" AI가 바로 파악 가능하게

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: v4-04-screen-specs-detail-view*
*Context gathered: 2026-02-19*
