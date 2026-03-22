# Phase m9-01: Canvas Scaffold & Data Wiring - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning
**Source:** Reference image + existing main-b codebase analysis

<domain>
## Phase Boundary

Phase m9-01은 `/lab/main-d` 경로에 sticker-bomb 콜라주 스타일의 다크 캔버스를 구축한다.
실제 포스트/아이템 데이터가 폴라로이드 카드로 표시되며, 하단 네비게이션이 포함된다.

이 Phase에서는 인터랙션(드래그, StickerPeel)과 비주얼 폴리시(워드마크, 데코레이터)를 포함하지 않는다 — 그것은 m9-02, m9-03의 영역이다.

</domain>

<decisions>
## Implementation Decisions

### 캔버스 배경

- 배경색 #0d0d0d (기존 main-b와 동일)
- SVG feTurbulence grain 텍스처 오버레이 (main-b의 인라인 SVG 패턴 재사용)
- Lenis smooth scroll은 이 Phase에서 불필요 — 캔버스가 viewport 높이에 fit하므로 스크롤 없음
- 단, 모바일에서 카드가 많을 경우 세로 스크롤이 필요할 수 있으므로 overflow-y-auto 준비

### 폴라로이드 카드

- **참고 이미지 기준**: 흰 테두리(~4-6px)로 감싼 사진, 하단에 약간 더 두꺼운 여백 (폴라로이드 느낌)
- 카드마다 고유한 회전 각도 (-12° ~ +12° 범위)
- 카드마다 그림자 (drop-shadow, 약간 퍼진 느낌)
- 카드 크기: clamp(100px, 15vw, 220px) — 다양한 크기 허용 (참고 이미지에서 카드 크기가 제각각)
- 일부 카드는 더 크게, 일부는 작게 — 시드 기반 크기 변동

### Scatter 레이아웃 엔진

- djb2 해시 기반 시드 PRNG — post.id를 시드로 사용하여 결정론적 위치/회전 생성
- SSR에서 생성한 위치 = 클라이언트 hydration 위치 (Math.random() 사용 금지)
- 캔버스를 대략적인 그리드 영역으로 나누되 (3x3 또는 4x3), 영역 내에서 랜덤 오프셋으로 자연스러운 scatter
- 카드 간 겹침 허용 — 콜라주 느낌의 핵심
- z-index도 시드 기반으로 결정 (일부 카드가 다른 카드 위에 겹쳐짐)

### 데이터 소스

- main-b의 `fetchMainBPostServer` 패턴 재사용하되, 여러 포스트를 가져오도록 확장
- 포스트 8~15개 + 아이템 데이터
- 기존 `packages/shared/supabase/queries/images.ts` 또는 `main-b.server.ts` 기반
- trending keywords는 m9-03 워드마크에서 사용 — 이 Phase에서는 fetch만

### 하단 네비게이션

- main-b의 BottomNav 패턴 재사용 (동일한 glass morphism + neon accent 스타일)
- 참고 이미지: SHOP / CANVAS / ABOUT / CART — 하지만 실제로는 기존 앱 네비게이션 유지
- 네비게이션 아이템: Home, Search, Editorial, Profile (기존 main-b와 동일)
- BottomNav를 공유 컴포넌트로 추출하거나 복사

### Claude's Discretion

- 파일 구조: `lib/components/main-d/` 디렉토리
- 컴포넌트 분할 방식 (모노리틱 vs 세분화)
- 정확한 scatter 알고리즘 구현 세부사항
- 카드 수와 로딩 전략

</decisions>

<specifics>
## Specific Ideas

### 참고 이미지에서 관찰된 디테일

1. 카드들이 서로 겹치며 다양한 크기와 각도로 배치됨 — 정돈된 그리드가 아닌 자유로운 scatter
2. 중앙 영역에 카드가 밀집되어 있고, 가장자리로 갈수록 흩어짐
3. 일부 카드는 흑백, 일부는 컬러 — Phase m9-01에서는 모두 원본 컬러 유지
4. 카드 사이에 네온 악센트 데코레이터가 있지만, 이는 m9-03 영역
5. 하단 네비게이션은 반투명 배경 + 아이콘 + 텍스트 구조

### 기존 main-b에서 재사용 가능한 패턴

- `#0d0d0d` 배경 + grain 텍스처 SVG (인라인)
- BottomNav 컴포넌트 구조 (glass morphism, neon hover)
- Z-index 레이어링 시스템
- `fetchMainBPostServer` 서버 쿼리 패턴

</specifics>

<deferred>
## Deferred Ideas

- StickerPeel 애니메이션 → m9-02
- GSAP Draggable 인터랙션 → m9-02
- hover lift 효과 → m9-02
- DECODED 워드마크 → m9-03
- 네온 데코레이터 → m9-03
- 말풍선 가격태그 → m9-03
- 테이프/washi 데코레이터 → m9-03

</deferred>

---

_Phase: m9-01-canvas-scaffold-data-wiring_
_Context gathered: 2026-03-19 via reference image analysis_
