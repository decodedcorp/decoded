# Main Page C안 — Avant-Garde Editorial Layout

## Context

Stitch에서 생성한 아방가르드 에디토리얼 디자인 레퍼런스를 기반으로 메인 페이지 C안을 구현한다.
기존 main-b(scattered canvas), main-d(sticker bomb)와 동일한 패턴으로 `/lab/main-c`에서 실험 가능하도록 만든다.

## 디자인 특징 (Stitch 레퍼런스)

- **다크 배경** (#080808) + **neon-lime 액센트** (#eafd67)
- **거대한 에디토리얼 타이포그래피** (DECODED 히어로)
- **그레이스케일 이미지** → 호버 시 컬러 전환
- **비대칭 그리드 레이아웃** (12-column grid)
- **페이퍼 텍스처 그레인 오버레이**
- **패럴랙스 스크롤 효과** (GSAP ScrollTrigger)
- **마키 푸터** (무한 스크롤 텍스트)
- **mix-blend-difference 네비게이션**

## 파일 구조

```
packages/web/lib/components/main-c/
├── types.ts              — MainCPost 타입 정의
├── MainPageC.tsx          — 메인 컴포넌트 (전체 페이지 조합)
├── EditorialHero.tsx      — 히어로 섹션 (거대 타이포 + 메인 이미지)
├── MoodboardGrid.tsx      — 무드보드 섹션 (비대칭 이미지 그리드)
├── CuratedStory.tsx       — 스토리 섹션 (sticky 사이드바 + 갤러리)
├── MarqueeFooter.tsx      — 마키 푸터
├── GrainOverlay.tsx       — 페이퍼 텍스처 오버레이
└── index.ts               — Barrel exports

packages/web/lib/supabase/queries/main-c.server.ts  — 데이터 패칭
packages/web/app/lab/main-c/page.tsx                 — Lab 페이지
```

## 데이터 모델

main-d와 동일한 패턴 사용 (image → post_image → post 조인):

```typescript
// types.ts
export interface MainCPost {
  id: string;
  imageUrl: string;
  artistName: string | null;
}
```

서버 쿼리: `fetchMainCPostsServer()` — 7개 이미지를 랜덤 선택 (히어로 1 + 무드보드 2 + 스토리 4)

## 섹션별 구현 계획

### 1. EditorialHero (히어로)

- 전체 화면 히어로 (`min-h-screen`)
- "DECODED" 14vw 타이포 + neon-lime "DED" 이탤릭
- "FA_SHION" outline 텍스트
- 12-column grid: 메인 이미지 (col 6-12, 4:5 비율)
- 플로팅 디테일 이미지 (absolute, -bottom -left)
- 서브텍스트 (col 1-4)

### 2. MoodboardGrid (무드보드)

- 배경 거대 텍스트 "CORE" (30vw, opacity 2%)
- 좌측: "The New Symmetry" 타이포 블록
- 우측: 2개 이미지 비대칭 배치 (rotation ±2~3deg, 호버 시 0deg)
- 라벨 태그 (TS_01, OBJ_77)

### 3. CuratedStory (스토리)

- 좌측 sticky 사이드바: 제목 + 인용구 + 설명 텍스트
- 우측 갤러리:
  - 메인 피처 이미지 (3:4, grayscale → 호버 시 컬러)
  - 비대칭 쌍 (정사각형 이미지 + neon-lime 텍스트 블록)
  - 마무리 포트레이트 (neon-lime 보더 라인)

### 4. MarqueeFooter

- 고정 하단 바 (`fixed bottom-0`)
- CSS 애니메이션 무한 스크롤 텍스트
- neon-lime 도트 + "DECODED_CORE_STATION"

### 5. GrainOverlay

- 고정 페이퍼 텍스처 (SVG noise filter)
- opacity 0.03~0.045, pointer-events-none

## 스크롤 애니메이션

GSAP ScrollTrigger (이미 프로젝트에 GSAP 3.13 설치됨):

- `reveal-up`: 아래→위 fade in (y:60, opacity:0 → 원위치)
- `reveal-text`: 좌측에서 fade in (x:-20, opacity:0)
- 이미지 호버: scale(1.08) + brightness(1.1) CSS transition

## 기존 패턴 재사용

| 항목            | 재사용 소스                                                           |
| --------------- | --------------------------------------------------------------------- |
| 데이터 패칭     | `main-d.server.ts` 패턴 (getSharedClient, image→post_image→post 조인) |
| 타입 구조       | `main-d/types.ts` 패턴 (단일 소스)                                    |
| Lab 페이지      | `app/lab/main-d/page.tsx` 패턴 (force-dynamic, 에러 폴백)             |
| 그레인 오버레이 | `MainPageD.tsx` SVG noise 패턴                                        |
| Lab 레이아웃    | `app/lab/layout.tsx` (이미 존재)                                      |

## 검증 방법

1. `yarn dev` 실행 후 `/lab/main-c` 접속
2. 히어로 타이포그래피 + 이미지 렌더링 확인
3. 스크롤 시 GSAP 애니메이션 동작 확인
4. 이미지 hover 시 grayscale → color 전환 확인
5. 마키 푸터 무한 스크롤 확인
6. TypeScript 타입 체크: `yarn build` 또는 `npx tsc --noEmit`
