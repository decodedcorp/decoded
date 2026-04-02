---
phase: quick-260402-jjo
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/lib/components/explore/TrendingArtistsSection.tsx
  - packages/web/lib/components/ThiingsGrid.tsx
autonomous: true
requirements: [QUICK-260402-jjo]
must_haves:
  truths:
    - "Explore page 첫 렌더링시 ThiingsGrid 하단에 빈 공간이 없다"
    - "TrendingArtistsSection 로딩 중에도 레이아웃이 동일한 높이를 유지한다"
    - "TrendingArtistsSection 데이터 로드 완료 후 ThiingsGrid 영역이 재계산된다"
  artifacts:
    - path: "packages/web/lib/components/explore/TrendingArtistsSection.tsx"
      provides: "Loading skeleton placeholder instead of null return"
    - path: "packages/web/lib/components/ThiingsGrid.tsx"
      provides: "ResizeObserver wired to updateGridItems on container resize"
  key_links:
    - from: "TrendingArtistsSection (loading state)"
      to: "flex layout height"
      via: "fixed-height skeleton div instead of null"
      pattern: "h-\\[.*\\].*skeleton"
    - from: "ThiingsGrid containerRef"
      to: "updateGridItems"
      via: "ResizeObserver callback"
      pattern: "ResizeObserver"
---

<objective>
Explore 페이지 첫 렌더링시 하단 빈 공간 버그를 수정한다.

Purpose: TrendingArtistsSection이 loading 중 null을 반환하면 flex-1 그리드 영역이 더 크게 측정되고, 데이터 로드 후 섹션이 나타나면 그리드 영역이 줄어드는데 ThiingsGrid는 physics 엔진이 정지 상태일 때 container 크기를 재계산하지 않아 빈 공간이 발생한다.

Output:
1. TrendingArtistsSection — 로딩 중 null 대신 동일 높이 skeleton 렌더링
2. ThiingsGrid — ResizeObserver로 container 크기 변화 감지 → updateGridItems 재호출
</objective>

<execution_context>
@$HOME/.claude-pers/get-shit-done/workflows/execute-plan.md
@$HOME/.claude-pers/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/web/lib/components/explore/TrendingArtistsSection.tsx
@packages/web/lib/components/ThiingsGrid.tsx
@packages/web/app/explore/ExploreClient.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: TrendingArtistsSection — null 대신 고정 높이 skeleton 반환</name>
  <files>packages/web/lib/components/explore/TrendingArtistsSection.tsx</files>
  <action>
현재 코드 (line 12-14):
```tsx
if (isLoading || !artists || artists.length < 3) {
    return null;
}
```

이 조건을 분리해서 `isLoading` 일 때는 실제 section과 동일한 높이를 가진 skeleton placeholder를 렌더링하도록 변경한다. 데이터가 없거나 3개 미만일 때(`!artists || artists.length < 3`)는 여전히 null 반환.

변경 후 구조:
```tsx
if (isLoading) {
  // 실제 section과 동일한 구조/높이 유지: px-4 py-3 border-b + label(10px+mb-2) + scroll row(~40px) + pb-1
  // 대략 h-[72px] 정도의 skeleton
  return (
    <section className="px-4 py-3 border-b border-border flex-shrink-0 h-[72px] animate-pulse">
      <div className="h-2.5 w-24 bg-muted rounded mb-2" />
      <div className="flex gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-12 h-12 rounded-full bg-muted flex-shrink-0" />
        ))}
      </div>
    </section>
  );
}

if (!artists || artists.length < 3) {
  return null;
}
```

실제 섹션 높이를 맞추는 것이 핵심 — animate-pulse는 Tailwind CSS에 기본 포함되어 있으므로 별도 설치 불필요.
  </action>
  <verify>
    <automated>cd /Users/kiyeol/development/decoded/decoded-monorepo && bun --filter @decoded/web run typecheck 2>&1 | tail -20</automated>
  </verify>
  <done>isLoading 상태에서 null 대신 ~72px 높이 skeleton section이 렌더링됨. 데이터 없음/3개 미만이면 여전히 null 반환. 타입체크 통과.</done>
</task>

<task type="auto">
  <name>Task 2: ThiingsGrid — ResizeObserver로 container 리사이즈 감지</name>
  <files>packages/web/lib/components/ThiingsGrid.tsx</files>
  <action>
ThiingsGrid class component에 ResizeObserver를 추가하여 container 크기가 변할 때 updateGridItems()를 재호출한다.

1. class 필드 추가 (기존 private 필드들 아래):
```tsx
private resizeObserver: ResizeObserver | null = null;
```

2. componentDidMount() 내부, 기존 이벤트 리스너 등록 아래에 추가:
```tsx
if (typeof ResizeObserver !== 'undefined' && container) {
  this.resizeObserver = new ResizeObserver(() => {
    this.updateGridItems();
  });
  this.resizeObserver.observe(container);
}
```

3. componentWillUnmount() 내부, 기존 cleanup 아래에 추가:
```tsx
this.resizeObserver?.disconnect();
this.resizeObserver = null;
```

주의: ResizeObserver callback은 매우 빈번하게 호출될 수 있으나 updateGridItems 내부에 `needsUpdate` guard가 이미 있어 실제 setState 호출은 변화가 있을 때만 발생함 — debounce 불필요.

`typeof ResizeObserver !== 'undefined'` 가드는 SSR 환경 안전성을 위해 필수.
  </action>
  <verify>
    <automated>cd /Users/kiyeol/development/decoded/decoded-monorepo && bun --filter @decoded/web run typecheck 2>&1 | tail -20</automated>
  </verify>
  <done>ResizeObserver가 componentDidMount에서 containerRef에 연결되고 componentWillUnmount에서 disconnect됨. 타입체크 통과.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
    1. TrendingArtistsSection: 로딩 중 null → skeleton placeholder (고정 높이 ~72px)
    2. ThiingsGrid: ResizeObserver로 container 크기 변화 감지 → updateGridItems 재호출
  </what-built>
  <how-to-verify>
    1. `just local-fe`로 개발 서버 실행
    2. http://localhost:3000/explore 접속
    3. 첫 로드 시: TrendingArtistsSection 영역에 skeleton placeholder가 보이는지 확인 (빈 공간 없음)
    4. 데이터 로드 완료 후: skeleton → 실제 아티스트 카드로 교체되는지 확인
    5. 전환 시 ThiingsGrid 하단에 빈 공간이 생기지 않는지 확인
    6. 페이지를 hard refresh (Cmd+Shift+R)해서 첫 렌더링 재현 후 빈 공간 없는지 재확인
  </how-to-verify>
  <resume-signal>시각적으로 확인 후 "approved" 또는 발견된 이슈 설명</resume-signal>
</task>

</tasks>

<verification>
- TypeScript typecheck passes: `bun --filter @decoded/web run typecheck`
- TrendingArtistsSection에 `return null` 이 isLoading 조건에서 제거됨: `grep -n "isLoading" packages/web/lib/components/explore/TrendingArtistsSection.tsx`
- ThiingsGrid에 ResizeObserver 등록 확인: `grep -n "ResizeObserver" packages/web/lib/components/ThiingsGrid.tsx`
</verification>

<success_criteria>
- Explore 페이지 첫 렌더링시 TrendingArtistsSection 영역이 skeleton으로 고정 높이 유지
- TrendingArtistsSection 데이터 로드 완료 후 ThiingsGrid가 자동으로 재계산되어 빈 공간 없음
- TypeScript 타입체크 통과
</success_criteria>

<output>
After completion, create `.planning/quick/260402-jjo-explore/260402-jjo-SUMMARY.md`
</output>
