# [SCR-DISC-01] 홈 피드 (Home Feed)

| 항목 | 내용 |
|:---|:---|
| **문서 ID** | SCR-DISC-01 |
| **경로** | `/` |
| **작성일** | 2026-01-14 |
| **버전** | v1.0 |
| **상태** | 초안 |

---

## 1. 화면 개요

- **목적**: 이미지 피드를 Pinterest 스타일 그리드로 탐색, 무한 스크롤 지원
- **선행 조건**: 없음 (비로그인 상태 접근 가능)
- **후속 화면**: 이미지 상세 (모달 또는 전체 페이지)
- **관련 기능 ID**: [D-01](../spec.md#d-01-매거진-피드)

---

## 2. UI 와이어프레임

### 2.1 데스크톱 (≥768px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  [CMN-01 Header]                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ [LOGO] DECODED          [SEARCH]          [FILTER-BAR] [THEME] [MORE] │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │                                                                          ││
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐     ││
│  │  │[CARD-01│ │[CARD-02│ │[CARD-03│ │[CARD-04│ │[CARD-05│ │[CARD-06│     ││
│  │  │        │ │        │ │        │ │        │ │        │ │        │     ││
│  │  │  IMG   │ │  IMG   │ │  IMG   │ │  IMG   │ │  IMG   │ │  IMG   │     ││
│  │  │        │ │        │ │        │ │ (tall) │ │        │ │        │     ││
│  │  │ [BADGE]│ │        │ │ [BADGE]│ │        │ │        │ │ [BADGE]│     ││
│  │  └────────┘ └────────┘ └────────┘ │        │ └────────┘ └────────┘     ││
│  │  ┌────────┐ ┌────────┐ ┌────────┐ │        │ ┌────────┐ ┌────────┐     ││
│  │  │[CARD-07│ │[CARD-08│ │[CARD-09│ └────────┘ │[CARD-10│ │[CARD-11│     ││
│  │  │        │ │        │ │        │ ┌────────┐ │        │ │        │     ││
│  │  │  IMG   │ │  IMG   │ │  IMG   │ │[CARD-12│ │  IMG   │ │  IMG   │     ││
│  │  │        │ │ (tall) │ │        │ │        │ │        │ │        │     ││
│  │  │        │ │        │ │        │ │  IMG   │ │        │ │        │     ││
│  │  └────────┘ │        │ └────────┘ │        │ └────────┘ └────────┘     ││
│  │             └────────┘            └────────┘                            ││
│  │                                                                          ││
│  │  ... (Infinite Scroll - 하단 접근 시 추가 로딩)                          ││
│  │                                                                          ││
│  │  ┌────────────────────────────────────────────────────────────────────┐ ││
│  │  │                    [SKELETON] Loading...                           │ ││
│  │  └────────────────────────────────────────────────────────────────────┘ ││
│  │                                                                          ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 모바일 (<768px)

```
┌────────────────────────────────┐
│  [Header - Mobile]             │
│  [LOGO] [SEARCH] [FILTER-BTN]  │
├────────────────────────────────┤
│                                │
│  ┌────────────┐ ┌────────────┐ │
│  │ [CARD-01]  │ │ [CARD-02]  │ │
│  │            │ │            │ │
│  │    IMG     │ │    IMG     │ │
│  │            │ │            │ │
│  │  [BADGE]   │ │            │ │
│  └────────────┘ └────────────┘ │
│  ┌────────────┐ ┌────────────┐ │
│  │ [CARD-03]  │ │ [CARD-04]  │ │
│  │            │ │            │ │
│  │    IMG     │ │    IMG     │ │
│  │  (tall)    │ │            │ │
│  │            │ └────────────┘ │
│  │            │ ┌────────────┐ │
│  │            │ │ [CARD-05]  │ │
│  └────────────┘ │    IMG     │ │
│                 └────────────┘ │
│                                │
│  ... (Infinite Scroll)         │
│                                │
│  [Loading Spinner]             │
│                                │
└────────────────────────────────┘
```

---

## 3. UI 요소 정의

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---|:---|:---|
| **GRID** | 컨테이너 | ThiingsGrid | - Layout: Masonry (Pinterest style)<br>- Columns: 2 (mobile), 4-6 (desktop)<br>- Gap: 16px | GSAP 물리 기반 레이아웃<br>스크롤 시 가상화 (최대 300 노드) |
| **CARD-IMAGE** | 카드 | ImageCard | - BG: `surface-primary`<br>- Border-radius: 12px<br>- Aspect: dynamic (이미지 비율 유지) | **Click**: 이미지 상세 모달 열기<br>`/(.)images/[id]` (Intercepting Route)<br>**Hover**: 살짝 확대 (scale: 1.02) |
| **CARD-IMG** | 이미지 | 카드 이미지 | - Loading: eager (상위 6개), lazy (나머지)<br>- Placeholder: blur | 이미지 로드 완료 시 fade-in |
| **BADGE** | 뱃지 | 아이템 수 표시 | - Position: Bottom-right<br>- BG: `rgba(0,0,0,0.6)`<br>- Text: white | 아이템 개수 표시 (예: "3 items") |
| **SKELETON** | 스켈레톤 | 로딩 플레이스홀더 | - Animation: shimmer<br>- Shape: 카드와 동일 | 초기 로딩 및 추가 로딩 시 표시 |
| **SCROLL-TRIGGER** | Invisible | 무한 스크롤 트리거 | - Position: 하단 50px 전 | IntersectionObserver로 감지<br>→ 다음 페이지 데이터 로드 |

### 카드 상세 구조

```
┌─────────────────────────────────────────┐
│                                         │
│  [CARD-IMG]                             │
│  (이미지 원본 비율 유지)                │
│                                         │
│                            ┌──────────┐ │
│                            │ 3 items  │ │
│                            │ [BADGE]  │ │
│                            └──────────┘ │
└─────────────────────────────────────────┘
```

### 호버 상태

```
┌─────────────────────────────────────────┐
│  [HOVER STATE]                          │
│                                         │
│  • Scale: 1.02                          │
│  • Shadow: elevated                     │
│  • Cursor: pointer                      │
│  • Transition: 200ms ease-out           │
│                                         │
└─────────────────────────────────────────┘
```

---

## 4. 상태 정의

| 상태 | 조건 | UI 변화 |
|:---|:---|:---|
| **초기 로딩** | 페이지 첫 진입 | 스켈레톤 그리드 표시 (12개) |
| **데이터 표시** | 데이터 로드 완료 | 카드 그리드 + FLIP 애니메이션 |
| **추가 로딩** | 스크롤 트리거 감지 | 하단에 스켈레톤 카드 추가 |
| **빈 상태** | 검색/필터 결과 없음 | Empty State 컴포넌트 |
| **에러** | API 실패 | 에러 메시지 + 재시도 버튼 |
| **끝 도달** | hasNextPage: false | "더 이상 표시할 이미지가 없습니다" |

### 로딩 시퀀스

```
1. 페이지 진입
   ↓
2. SSR 초기 데이터 (50개) 표시
   ↓
3. 스크롤 시작
   ↓
4. 하단 50px 전 도달
   ↓
5. fetchNextPage() 호출
   ↓
6. 스켈레톤 표시 (로딩 중)
   ↓
7. 데이터 도착 → 카드 추가 렌더링
   ↓
8. 반복 (3-7)
```

### 데이터 병합 규칙

무한 스크롤에서 여러 페이지를 병합할 때 중복 제거 적용:

| 단계 | 처리 | 설명 |
|:---|:---|:---|
| 페이지 단위 | `deduplicateByImageId` | 어댑터 레벨에서 단일 페이지 내 중복 제거 (기본 활성화) |
| 클라이언트 병합 | `Set<id>` 필터링 | `flatMap` 후 ID 기반 중복 필터링 |

**구현 위치**:
- 페이지 단위: `packages/shared/supabase/queries/images-adapter.ts`
- 클라이언트 병합: `packages/web/app/HomeClient.tsx`

---

## 5. 데이터 요구사항

### 5.1 API 호출

| API | Method | Endpoint | 호출 시점 | 응답 |
|:---|:---:|:---|:---|:---|
| 초기 로드 | GET | `fetchUnifiedImages({ limit: 50 })` | SSR (Server) | `{ images: UiImage[], nextCursor }` |
| 추가 로드 | GET | `fetchUnifiedImages({ cursor, limit: 50 })` | 스크롤 트리거 | `{ images: UiImage[], nextCursor }` |
| 필터 적용 | GET | `fetchUnifiedImages({ filter, limit: 50 })` | 필터 변경 시 | `{ images: UiImage[], nextCursor }` |

### 5.2 상태 관리

| 스토어 | 키 | 타입 | 설명 |
|:---|:---|:---|:---|
| React Query | `["images", "infinite", filter]` | `QueryKey` | 이미지 데이터 캐시 |
| Zustand | `filterStore.activeFilter` | `string` | 현재 활성 필터 |
| Zustand | `searchStore.debouncedQuery` | `string` | 디바운스된 검색어 |
| Zustand | `transitionStore` | `object` | FLIP 애니메이션 상태 |

### 5.3 데이터 타입

```typescript
interface UiImage {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string;
  aspectRatio: number;  // height / width
  itemCount: number;
  accountId: string;
  createdAt: Date;
}

interface ImagePage {
  images: UiImage[];
  nextCursor: string | null;
  hasNextPage: boolean;
}
```

---

## 6. 에러 처리

| 에러 코드 | 상황 | 사용자 메시지 | 처리 방법 |
|:---:|:---|:---|:---|
| 500 | 서버 오류 | "이미지를 불러올 수 없습니다" | 재시도 버튼 표시 |
| Network | 네트워크 끊김 | "네트워크 연결을 확인해주세요" | 자동 재시도 (3회) |
| Timeout | 타임아웃 | "로딩이 지연되고 있습니다" | 재시도 버튼 |

---

## 7. 성능 최적화

| 영역 | 전략 | 구현 |
|:---|:---|:---|
| 이미지 로딩 | 상위 6개 eager, 나머지 lazy | `loading` attribute |
| DOM 제한 | 최대 300개 노드 | ThiingsGrid 가상화 |
| 캐싱 | staleTime: 60s, gcTime: 5min | React Query 설정 |
| 애니메이션 | GPU 가속 (transform, opacity) | CSS will-change |

---

## 8. 접근성 (A11y)

- **키보드 네비게이션**: Tab으로 카드 간 이동
- **스크린 리더**: 카드에 `aria-label="이미지, 아이템 N개"` 제공
- **포커스 표시**: 포커스 시 outline 표시
- **축소 모션**: `prefers-reduced-motion` 시 애니메이션 최소화

---

## 9. 컴포넌트 매핑

| UI 영역 | 컴포넌트 | 파일 경로 |
|:---|:---|:---|
| 페이지 | HomePage | `packages/web/app/page.tsx` |
| 클라이언트 | HomeClient | `packages/web/lib/components/HomeClient.tsx` |
| 그리드 | ThiingsGrid | `packages/web/lib/components/ThiingsGrid.tsx` |
| 카드 | CardCell | `packages/web/lib/components/CardCell.tsx` |
| 스켈레톤 | CardSkeleton | `packages/web/lib/components/CardSkeleton.tsx` |
| 헤더 | Header | `packages/web/lib/components/Header.tsx` |

---

## 10. 구현 체크리스트

- [ ] Masonry 그리드 레이아웃
- [ ] 무한 스크롤 구현
- [ ] 이미지 지연 로딩
- [ ] 카드 호버 효과
- [ ] 카드 클릭 → 상세 모달
- [ ] FLIP 애니메이션
- [ ] 스켈레톤 로딩
- [ ] 빈 상태 처리
- [ ] 에러 처리
- [ ] 반응형 대응
- [ ] 성능 최적화

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|:---|:---|:---|:---|
| v1.0 | 2026-01-14 | PM | 초기 작성 |
