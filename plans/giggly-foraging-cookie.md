# Hero Scattered Collage 구현 계획

## Context
현재 hero는 단일 인물 이미지 + CircularGallery 구조. 사용자가 여러 이미지가 비정형으로 흩어져 떠있는 scattered collage 스타일로 변경 요청. 회전, 겹침, floating 애니메이션 포함.

## 변경 파일

### 1. `packages/web/lib/components/main-renewal/MainHero.tsx` — 전면 재작성
- 단일 인물 이미지 → 6~8개 이미지 scattered collage
- 각 이미지: 사전 정의된 위치/크기/회전값 (큰 것 2개, 중간 3개, 작은 것 2~3개)
- GSAP floating 애니메이션: 각 이미지가 독립적으로 미세하게 떠다님 (y ±8px, duration 3~5s, stagger)
- 클릭 시 해당 포스트로 이동 (`ctaLink`)
- neon glow 배경 유지, gradient overlay 유지
- Props 변경: `data: MainHeroData` → `images: FloatingHeroImage[]`

```ts
interface FloatingHeroImage {
  id: string;
  imageUrl: string;
  label?: string;
  link: string;
}
```

레이아웃 슬롯 (7개, 위치는 % 기반):
| Slot | Position        | Size          | Rotation |
|------|----------------|---------------|----------|
| 0    | left:8%, top:10%   | w-[28vw] h-[35vh] | -3deg |
| 1    | left:55%, top:5%   | w-[22vw] h-[28vh] | 2deg  |
| 2    | left:35%, top:30%  | w-[20vw] h-[25vh] | -1deg |
| 3    | left:70%, top:35%  | w-[18vw] h-[24vh] | 3deg  |
| 4    | left:5%, top:55%   | w-[16vw] h-[22vh] | 1deg  |
| 5    | left:48%, top:58%  | w-[24vw] h-[30vh] | -2deg |
| 6    | left:78%, top:62%  | w-[15vw] h-[20vh] | 2deg  |

모바일: 4개만 표시 (slot 0~3), 크기 vw 확대

### 2. `packages/web/lib/components/main-renewal/types.ts`
- `FloatingHeroImage` 타입 추가
- `MainHeroData` 유지 (다른 곳에서 참조할 수 있으므로)

### 3. `packages/web/lib/components/main/HeroItemSync.tsx` — 간소화
- `MainHero`에 모든 post 이미지를 `FloatingHeroImage[]`로 전달
- CircularGallery, 화살표 nav, post counter 제거 (이미 모든 이미지가 hero에 보이므로)
- `heroPosts` → `images` 매핑만 수행

### 4. `packages/web/lib/components/main-renewal/index.ts`
- export 업데이트 (FloatingHeroImage 타입)

## 유지하는 것
- neon glow 배경 효과 (animate-neon-drift)
- gradient overlay (상단/하단)
- noise grain
- image-proxy URL 패턴

## 제거하는 것
- CircularGallery 연동 (HeroItemSync에서)
- 단일 인물 이미지 중앙 배치
- SpotCard 어노테이션 (scattered에서는 시각적 노이즈)
- 마우스 패럴랙스 (이미지 개별 floating으로 대체)

## 검증
- `bun run typecheck` — 타입 오류 없음
- dev 서버에서 hero 영역에 여러 이미지 scattered 확인
- 모바일 뷰포트에서 4개 이미지 레이아웃 확인
- 이미지 클릭 시 포스트 페이지 이동 확인
