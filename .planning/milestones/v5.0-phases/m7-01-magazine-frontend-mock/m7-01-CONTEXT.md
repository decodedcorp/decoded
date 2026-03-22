# Phase Context: M7-01 Magazine Frontend (Mock-First)

## Decisions (LOCKED)

- **Routing:** `/magazine`, `/magazine/personal`, `/collection` — NavBar에 추가 (not /lab/)
- **Scope:** Mock 데이터로 선행 구현. 백엔드 API 없이 프론트엔드만.
- **Exclude:** explore, main 페이지는 건드리지 않음
- **Theme:** Deep Black (#050505) / Neon Chartreuse (#eafd67) — specs 그대로
- **GSAP:** 이미 설치된 gsap@3.13.0 활용. ScrollTrigger 플러그인 등록 추가.

## Claude's Discretion

- Variable font 선택 (DecodingText용)
- Particle 구현 방식 (Canvas vs DOM)
- Mock 데이터 구조 및 샘플 콘텐츠
- Wave 분배 및 세부 태스크 분할
- 컴포넌트 내부 구현 패턴

## Deferred Ideas (Out of Scope)

- 실제 API 연동
- Credit 시스템 실제 동작
- 인증 게이트 (authStore 연동)
- Share/Export 기능
- 필터링 기능 (By Date, By Mood)

## Reference Specs

- SCR-MAG-01: Daily Editorial Cover
- SCR-MAG-02: Personal Issue Generation (Decoding Ritual)
- SCR-COL-01: My Collection Bookshelf
- FLW-06: Magazine Rendering Flow
