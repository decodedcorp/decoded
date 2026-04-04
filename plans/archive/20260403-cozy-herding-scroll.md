# Explore 오른쪽 패널 디자인 조정 (v2)

## Context

explore-preview 모달 드로어(카드 클릭 시 슬라이드인)의 디자인을 개선한다.
이전 작업에서 `EditorialPreviewHeader` 비주얼 헤더 + `MagazineItemsSection` compact 조정을 했으나, 추가 피드백 반영이 필요하다.

## 변경 사항 (4개)

### 1. EditorialPreviewHeader — pretext 타이틀 적용
- `useTextLayout` 훅으로 제목 높이 사전 계산 → `minHeight` 설정 (CLS 방지, 잘림 없음)
- 이미 MagazineTitleSection에서 사용하는 동일 패턴 적용

**파일:** `packages/web/lib/components/detail/EditorialPreviewHeader.tsx`
**참조:** `useTextLayout` from `@/lib/hooks/usePretext`

```tsx
const { containerRef: titleRef, height: titleHeight } = useTextLayout({
  text: title,
  font: '700 clamp(1.5rem, 3vw, 1.875rem) "Playfair Display", serif',
  lineHeight: 1.2 * 30,
});
// h2에 ref={titleRef}, style={{ minHeight: titleHeight }} 적용
```

### 2. EditorialPreviewHeader — "전체 에디토리얼 보기" 버튼
- description 아래, 구분선 위에 버튼 추가
- 클릭 시 `window.location.href = /posts/${postId}` (handleMaximize와 동일 패턴)
- prop 추가: `postId: string`

**파일:** `packages/web/lib/components/detail/EditorialPreviewHeader.tsx`
**파일:** `packages/web/lib/components/detail/ImageDetailContent.tsx` (postId 전달)

```tsx
// EditorialPreviewHeader에 추가
{postId && (
  <a href={`/posts/${postId}`} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
    전체 에디토리얼 보기
    <ArrowRight className="h-3 w-3" />
  </a>
)}
```

### 3. MagazineItemsSection — compact 모드 기존 레이아웃 복원 + 미세 조정만
이전 변경에서 교차 배치 제거 + Similar Items 숨김을 했으나, 기존 디자인이 더 좋다는 피드백.

**되돌릴 것:**
- 교차 배치(`md:flex-row-reverse`) 복원
- Similar Items 섹션 compact에서도 표시

**유지/조정:**
- 섹션 패딩: `px-4 py-8 md:px-6 md:py-10` (기존 py-12/py-16보다 약간만 축소)
- 아이템 간격: `space-y-10 md:space-y-12` (기존 12/16보다 약간만 축소)
- 이미지 너비: `md:w-52 lg:w-56` (기존 60/64보다 약간만 축소)
- 갭: `md:gap-8` (기존 gap-10보다 약간만 축소)
- 텍스트/버튼 크기: 기존 유지 (compact 전용 축소 제거)

**파일:** `packages/web/lib/components/detail/magazine/MagazineItemsSection.tsx`

### 4. 하단에 관련 매거진(MagazineRelatedSection) 표시
현재 `!isExplorePreview` 가드로 숨겨져 있음 → explore-preview에서도 표시하도록 가드 제거.

**파일:** `packages/web/lib/components/detail/ImageDetailContent.tsx`

변경:
```tsx
// Before
{!isExplorePreview && hasMagazine && relatedEditorials && relatedEditorials.length > 0 && (
  <MagazineRelatedSection relatedEditorials={relatedEditorials} />
)}
// After
{hasMagazine && relatedEditorials && relatedEditorials.length > 0 && (
  <MagazineRelatedSection relatedEditorials={relatedEditorials} />
)}
```

## 수정 파일 목록

| # | 파일 | 변경 |
|---|------|------|
| 1 | `EditorialPreviewHeader.tsx` | pretext 적용 + 버튼 추가 + postId prop |
| 2 | `ImageDetailContent.tsx` | postId 전달 + MagazineRelatedSection 가드 제거 |
| 3 | `MagazineItemsSection.tsx` | compact 변경 일부 되돌림 + 미세 조정만 |

## 검증

1. `bunx tsc --noEmit` — 타입 에러 없는지 확인
2. 로컬에서 explore → editorial 카드 클릭:
   - 상단: 대형 serif 타이틀 (잘림 없음) + description + "전체 에디토리얼 보기" 버튼
   - 아이템: 교차 배치 + Similar Items 표시 + 여백 미세 조정
   - 하단: 관련 매거진 카드 표시
3. "전체 에디토리얼 보기" 클릭 → 풀페이지 상세로 이동
