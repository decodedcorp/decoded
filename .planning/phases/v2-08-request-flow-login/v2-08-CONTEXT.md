# Phase v2-08: Request Flow & Login - Context

**Gathered:** 2026-02-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Request 플로우 (Upload → Detection → Details) 및 로그인 페이지에 decoded.pen 디자인 시스템을 적용합니다. 기존 기능은 모두 유지하며 디자인/레이아웃만 변경합니다.

**Scope:**
- Request Upload, Detection, Details 페이지 decoded.pen 스타일링
- 페이지 전환 애니메이션 (step 간 전환)
- Login 페이지는 현재 디자인 유지 (OAuth 버튼만 Google로 단순화)

**Out of scope:**
- Login 페이지 레이아웃 변경 (현재 유지)
- Kakao, Apple OAuth (나중에 추가 예정)
- Submit 단계 분리 (Details에 통합됨)

</domain>

<decisions>
## Implementation Decisions

### Step Indicator
- **3 dots** (decoded.pen 스펙 준수, Submit은 Details에 통합)
- **dots only** (연결선 없음, gap 8px)
- **8px 고정 크기** (현재 step 확대 효과 없음)
- **완료된 step도 Primary 색상 유지**
- 미완료 step은 #3D3D3D (muted)

### Page Transition Animation
- **전진:** 오른쪽에서 슬라이드 인 (새 페이지가 오른쪽에서 진입)
- **후진:** 역방향 슬라이드 (이전 페이지가 왼쪽에서 진입)
- **Duration:** 0.2초 (빠른 전환)
- **Easing:** ease-out
- AnimatePresence + motion.div 패턴 사용

### Login Page
- **현재 디자인 유지** (레이아웃, 배경, 스타일 변경 없음)
- **DomeGallery 배경 유지**
- **OAuth 버튼:** Google만 유지 (Kakao, Apple은 나중에 추가 예정)
- **Guest 로그인 유지**

### Request Flow Header
- **decoded.pen 스타일 적용**
- 56px 높이
- 레이아웃: back 아이콘 | StepIndicator (중앙) | close 아이콘
- 기존 RequestFlowHeader 컴포넌트 업데이트

### Upload Step (Step 1)
- **DropZone:** decoded.pen 스타일 적용
  - 디자인 시스템 border, icon, typography 사용
  - dashed border 스타일
  - Upload 아이콘 + 설명 텍스트
- ImagePreviewGrid는 기존 기능 유지, 스타일만 토큰 적용

### Detection Step (Step 2)
- **데스크톱:** 2-column 레이아웃
  - 왼쪽: 이미지 + SpotMarker 오버레이
  - 오른쪽: 감지된 아이템 리스트 (DetectedItemCard)
- **모바일:** 풀스크린 이미지 위에 오버레이 방식 유지
- SpotMarker, DetectedItemCard에 디자인 토큰 적용

### Details Step (Step 3)
- **데스크톱:** 2-column grid로 폼 필드 배치
  - MediaSourceInput, ArtistInput 등 2열 배치
  - DescriptionInput은 full-width
- **모바일:** 세로 스택 (기존 유지)
- Input 컴포넌트는 v2-02에서 만든 디자인 시스템 Input 사용
- Submit 버튼은 Details 페이지 하단에 포함 (별도 단계 없음)

### Claude's Discretion
- SpotMarker 호버/선택 상태 애니메이션
- DetectedItemCard 스켈레톤 로딩 디자인
- 폼 유효성 검사 에러 표시 방식
- 이미지 로딩 중 placeholder 스타일

</decisions>

<specifics>
## Specific Ideas

- decoded.pen의 StepIndicator는 3 dot (8px, gap 8px)으로 심플
- Request Flow Header에서 뒤로가기는 arrow-left 아이콘, 닫기는 x 아이콘
- OAuth 버튼은 decoded.pen 스펙: 320px 너비, 52px 높이, 12px border-radius
- 전환 애니메이션은 기존 v2-06, v2-07에서 사용한 AnimatePresence 패턴 활용

</specifics>

<deferred>
## Deferred Ideas

- Kakao OAuth 추가 — 나중에 Supabase Auth 설정 후
- Apple OAuth 추가 — 나중에 Supabase Auth 설정 후
- Login 페이지 2-column 레이아웃 (데스크톱) — v2.1 이후

</deferred>

---

*Phase: v2-08-request-flow-login*
*Context gathered: 2026-02-05*
