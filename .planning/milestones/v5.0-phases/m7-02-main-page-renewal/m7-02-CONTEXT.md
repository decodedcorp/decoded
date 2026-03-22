# Phase m7-02: Main Page Renewal — Playful Magazine Landing - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning
**Source:** User discussion (Cinema-to-Action concept)

<domain>
## Phase Boundary

메인페이지(`/`)를 "정적인 웹을 넘어선 플레이풀(Playful)한 잡지 경험"으로 리뉴얼. Mock 데이터 기반 프론트엔드 선행 구현. `/magazine`, `/collection` 등 m7-01 경로는 건드리지 않음.

</domain>

<decisions>
## Implementation Decisions

### Service Philosophy
- **선(先) 체험, 후(後) 가입**: 로그인 없이 AI 생성 데일리 에디토리얼을 먼저 감상
- **소프트 월(Soft Wall)**: '나만의 매거진 만들기', 'AI 시착(Try-on)' 등 개인화 기능 사용 시 자연스러운 로그인 유도

### Layout & Business Logic (SCR-MAG-01 기반)
- **제로 템플릿(Zero-Template)**: 고정 헤더/푸터 없이, AI `layout_json` 좌표값에 따라 동적 캔버스 배치
- **히어로 섹션 (The Hook)**: 타이틀에 마우스 반응형 Tilt 애니메이션, 배경에 #eafd67 Glow + 노이즈 효과
- **퍼스널라이즈 배너**: "당신의 핀터레스트를 한 권의 잡지로" 문구 + 이미지 빨려 들어가는 애니메이션
- **다이내믹 그리드**: Masonry Grid + 스크롤 시 Parallax 효과

### Visual & Interaction
- **테마 컬러**: Deep Black (#050505) + Neon Chartreuse (#eafd67)
- **아이템 스팟**: 화보 속 아이템 hover 시 네온 Glow + 브랜드/가격 팝업
- **GSAP Stagger**: 모든 컴포넌트 순차 등장 (영화 같은 진입 시퀀스)
- **Smart Navigation**: 스크롤에 따라 투명도 변화/숨김 처리

### Technical
- m7-01의 theme system (#eafd67, Deep Black) 재사용
- m7-01의 MagazineRenderer 레이아웃 엔진 이식/공유
- GSAP 3.13.0 + ScrollTrigger 활용
- Mock 데이터 기반 (실제 API 연동 제외)

### Claude's Discretion
- Hero Tilt 구현 방식 (CSS transform vs GSAP)
- Masonry Grid 라이브러리 선택 (CSS Grid vs react-masonry-css)
- Parallax 구현 방식 (GSAP ScrollTrigger vs Lenis)
- Noise/Glow 효과 구현 (CSS filter vs Canvas)
- layout_json mock 데이터 구조 설계
- 컴포넌트 분할 및 파일 구조
- Wave 분배 및 병렬 실행 전략

</decisions>

<specifics>
## Specific Ideas

- Hero title: 'NEWJEANS' 같은 셀럽 이름을 크게 표시
- Glow color: #eafd67 (Neon Chartreuse)
- Background: #050505 (Deep Black)
- 퍼스널라이즈 배너 카피: "당신의 핀터레스트를 한 권의 잡지로"
- 아이템 스팟 = Spotern (기존 spot 시스템 연계)

</specifics>

<deferred>
## Deferred Ideas

- 실제 AI API 연동 (layout_json 생성)
- Credit 시스템 실제 동작
- 인증 게이트 실제 연동 (authStore)
- Share/Export 기능
- 필터링 기능 (By Date, By Mood)
- Try-on(VTON) 실제 연동

</deferred>

---

*Phase: m7-02-main-page-renewal*
*Context gathered: 2026-03-05 via user discussion*
