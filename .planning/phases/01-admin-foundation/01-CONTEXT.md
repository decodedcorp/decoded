# Phase v3-01: Admin Foundation - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

관리자 사용자만 `/admin` 경로에 접근할 수 있으며, 일관된 관리자 전용 UI 레이아웃이 제공된다. 인증 미들웨어, admin 라우트 보호, 사이드바 네비게이션 레이아웃을 구축한다. 대시보드/감사/비용/로그 등 실제 페이지 콘텐츠는 이후 페이즈에서 구현.

</domain>

<decisions>
## Implementation Decisions

### Admin Layout 구조
- 좌측 고정 사이드바 + 우측 메인 콘텐츠 영역 구조
- 모바일에서는 사이드바를 숨기고 햄버거 메뉴로 오버레이 표시
- 사이드바는 다크 테마 (어두운 배경 + 밝은 텍스트)
- 사이드바 너비는 컴팩트 (200-220px) — 콘텐츠 영역 넓게 확보

### 인증 & 접근 차단 UX
- 비관리자가 `/admin` 접근 시 조용히 홈(메인) 페이지로 리다이렉트 — 토스트/알림 없음
- 관리자 패널 존재 자체를 비관리자에게 노출하지 않음
- 세션 만료/로그아웃 시 즉시 로그인 페이지로 이동
- `is_admin` 검증은 미들웨어 + 레이아웃 이중 체크 (클라이언트 사이드 우회 방지)

### 네비게이션 구성
- 메뉴 순서는 로드맵 순서: 대시보드 → AI 감사 → AI 비용 → 파이프라인 로그 → 서버 로그
- 각 메뉴 항목에 아이콘 + 텍스트 함께 표시
- 활성 메뉴 항목은 배경 하이라이트로 표시 (다크 사이드바에 밝은 배경)
- 사이드바 하단에 관리자 이름 + 로그아웃 버튼 배치

### 기존 앱과의 전환
- 기존 앱 헤더에 관리자에게만 보이는 작은 Admin 아이콘/텍스트 링크 추가
- 관리자 패널은 기존 앱과 완전히 별개의 레이아웃 (기존 헤더/네비바 없음)
- 사이드바 상단에 "Back to App" 링크로 일반 앱 복귀

### Claude's Discretion
- 사이드바 아이콘 선택 (Lucide React에서 적절한 아이콘)
- 다크 사이드바 구체적 색상값
- 햄버거 메뉴 애니메이션
- 콘텐츠 영역 배경색/패딩
- 반응형 브레이크포인트 (기존 앱 패턴 참고)

</decisions>

<specifics>
## Specific Ideas

- 사이드바 다크 테마로 콘텐츠 영역과 시각적 분리감 확보
- 컴팩트 사이드바(200-220px)로 데이터 중심 콘텐츠에 충분한 공간 제공
- 비관리자에게 admin 패널 존재 자체를 노출하지 않는 보안 접근

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-admin-foundation*
*Context gathered: 2026-02-19*
