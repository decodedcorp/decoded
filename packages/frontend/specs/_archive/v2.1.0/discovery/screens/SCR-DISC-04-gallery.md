# [SCR-DISC-04] 미디어 갤러리 (Media Gallery)

| 항목 | 내용 |
|:---|:---|
| **문서 ID** | SCR-DISC-04 |
| **경로** | `/media/[id]` |
| **작성일** | 2026-01-14 |
| **버전** | v1.0 |
| **상태** | 초안 |

---

## 1. 화면 개요

- **목적**: 특정 미디어(드라마, 그룹, 영화 등)의 전용 갤러리 페이지로 관련 콘텐츠 집중 탐색
- **선행 조건**: 유효한 미디어 ID
- **후속 화면**: Cast 페이지, 이미지 상세
- **관련 기능 ID**: [D-03](../spec.md#d-03-media-gallery)

---

## 2. UI 와이어프레임

### 2.1 데스크톱 (≥768px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  [CMN-01 Header]                                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ [HERO-SECTION]                                                         │  │
│  │                                                                        │  │
│  │  ┌───────────────────────────────────────────────────────────────────┐ │  │
│  │  │                                                                   │ │  │
│  │  │  [HERO-IMAGE]                                                     │ │  │
│  │  │  (Background: Media Poster/Banner)                                │ │  │
│  │  │                                                                   │ │  │
│  │  │  ┌─────────────────────────────────────────────────────────────┐ │ │  │
│  │  │  │ [HERO-CONTENT]                                              │ │ │  │
│  │  │  │                                                             │ │ │  │
│  │  │  │  [TXT-CATEGORY] Drama                                       │ │ │  │
│  │  │  │                                                             │ │ │  │
│  │  │  │  [TXT-TITLE] 🎬 Squid Game                                  │ │ │  │
│  │  │  │                                                             │ │ │  │
│  │  │  │  [TXT-META] 2021 • Netflix • Thriller                       │ │ │  │
│  │  │  │                                                             │ │ │  │
│  │  │  │  [TXT-STATS] 456 items • 23 contributors                    │ │ │  │
│  │  │  │                                                             │ │ │  │
│  │  │  │  [TXT-DESC] Hundreds of cash-strapped players...            │ │ │  │
│  │  │  │                                                             │ │ │  │
│  │  │  └─────────────────────────────────────────────────────────────┘ │ │  │
│  │  │                                                                   │ │  │
│  │  └───────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ [SECTION-CAST]                                                         │  │
│  │ Featured Cast                                              [See all →] │  │
│  │                                                                        │  │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │  │
│  │ │[CAST-01] │ │[CAST-02] │ │[CAST-03] │ │[CAST-04] │ │[CAST-05] │      │  │
│  │ │ ┌──────┐ │ │ ┌──────┐ │ │ ┌──────┐ │ │ ┌──────┐ │ │ ┌──────┐ │      │  │
│  │ │ │Avatar│ │ │ │Avatar│ │ │ │Avatar│ │ │ │Avatar│ │ │ │Avatar│ │      │  │
│  │ │ └──────┘ │ │ └──────┘ │ │ └──────┘ │ │ └──────┘ │ │ └──────┘ │      │  │
│  │ │ Jung    │ │ │ Lee     │ │ │ Park    │ │ │ Wi      │ │ │ HoYeon │      │  │
│  │ │ Ho-yeon │ │ │ Jung-jae│ │ │ Hae-soo │ │ │ Ha-joon │ │ │ Jung   │      │  │
│  │ │ (67)    │ │ │ (45)    │ │ │ (32)    │ │ │ (28)    │ │ │ (24)   │      │  │
│  │ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │  │
│  │                                                                        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ [SECTION-ITEMS]                                                        │  │
│  │ All Items                                                 [Filter ▼]   │  │
│  │                                                                        │  │
│  │ ┌────────────────────────────────────────────────────────────────────┐ │  │
│  │ │ [GRID - ThiingsGrid]                                               │ │  │
│  │ │                                                                    │ │  │
│  │ │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │ │  │
│  │ │ │ [CARD]  │ │ [CARD]  │ │ [CARD]  │ │ [CARD]  │ │ [CARD]  │       │ │  │
│  │ │ │         │ │         │ │         │ │         │ │         │       │ │  │
│  │ │ │   IMG   │ │   IMG   │ │   IMG   │ │   IMG   │ │   IMG   │       │ │  │
│  │ │ │         │ │         │ │         │ │         │ │         │       │ │  │
│  │ │ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘       │ │  │
│  │ │                                                                    │ │  │
│  │ │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │ │  │
│  │ │ │ [CARD]  │ │ [CARD]  │ │ [CARD]  │ │ [CARD]  │ │ [CARD]  │       │ │  │
│  │ │ │   ...   │ │   ...   │ │   ...   │ │   ...   │ │   ...   │       │ │  │
│  │ │ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘       │ │  │
│  │ │                                                                    │ │  │
│  │ │ ... (Infinite Scroll)                                              │ │  │
│  │ │                                                                    │ │  │
│  │ └────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ [SECTION-RELATED]                                                      │  │
│  │ Related Media                                                          │  │
│  │                                                                        │  │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                   │  │
│  │ │[RELATED] │ │[RELATED] │ │[RELATED] │ │[RELATED] │                   │  │
│  │ │ [POSTER] │ │ [POSTER] │ │ [POSTER] │ │ [POSTER] │                   │  │
│  │ │ Title    │ │ Title    │ │ Title    │ │ Title    │                   │  │
│  │ │ Items: 45│ │ Items: 32│ │ Items: 28│ │ Items: 21│                   │  │
│  │ └──────────┘ └──────────┘ └──────────┘ └──────────┘                   │  │
│  │                                                                        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 모바일 (<768px)

```
┌────────────────────────────────────┐
│  [Header]                          │
│  [←]           Squid Game          │
├────────────────────────────────────┤
│                                    │
│  ┌──────────────────────────────┐  │
│  │ [HERO]                       │  │
│  │                              │  │
│  │  (Background Image)          │  │
│  │                              │  │
│  │  Drama                       │  │
│  │  🎬 Squid Game               │  │
│  │  2021 • Netflix              │  │
│  │                              │  │
│  │  456 items • 23 contributors │  │
│  │                              │  │
│  └──────────────────────────────┘  │
│                                    │
│  ─────────────────────────────────  │
│                                    │
│  Featured Cast                [→]  │
│                                    │
│  ┌────────┐ ┌────────┐ ┌────────┐  │
│  │[Avatar]│ │[Avatar]│ │[Avatar]│  │
│  │Jung    │ │Lee     │ │Park    │  │
│  │(67)    │ │(45)    │ │(32)    │  │
│  └────────┘ └────────┘ └────────┘  │
│  (horizontal scroll →)             │
│                                    │
│  ─────────────────────────────────  │
│                                    │
│  All Items               [Filter▼] │
│                                    │
│  ┌────────────┐ ┌────────────┐    │
│  │ [CARD]     │ │ [CARD]     │    │
│  │            │ │            │    │
│  │    IMG     │ │    IMG     │    │
│  │            │ │            │    │
│  └────────────┘ └────────────┘    │
│  ┌────────────┐ ┌────────────┐    │
│  │ [CARD]     │ │ [CARD]     │    │
│  │    ...     │ │    ...     │    │
│  └────────────┘ └────────────┘    │
│                                    │
│  ... (Infinite Scroll)             │
│                                    │
│  ─────────────────────────────────  │
│                                    │
│  Related Media                     │
│                                    │
│  ┌────────┐ ┌────────┐ ┌────────┐  │
│  │[POSTER]│ │[POSTER]│ │[POSTER]│  │
│  │Title   │ │Title   │ │Title   │  │
│  └────────┘ └────────┘ └────────┘  │
│  (horizontal scroll →)             │
│                                    │
└────────────────────────────────────┘
```

---

## 3. UI 요소 정의

### Hero 섹션

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---|:---|:---|
| **HERO-IMAGE** | 이미지 | 배경 이미지 | - Aspect: 16:9 (Desktop), 4:3 (Mobile)<br>- Overlay: 그라데이션 | - |
| **TXT-CATEGORY** | 텍스트 | 카테고리 | - Font: Caption<br>- Color: `text-muted` | - |
| **TXT-TITLE** | 텍스트 | 미디어 제목 | - Font: H1 (32px)<br>- Icon: 타입별 이모지 | - |
| **TXT-META** | 텍스트 | 메타 정보 | - Font: Body<br>- Format: 연도 • 플랫폼 • 장르 | - |
| **TXT-STATS** | 텍스트 | 통계 | - Font: Body Bold<br>- Format: N items • N contributors | - |
| **TXT-DESC** | 텍스트 | 설명 | - Font: Body<br>- Max: 2줄, ellipsis | 더보기 클릭 시 전체 표시 |

### Cast 섹션

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---|:---|:---|
| **SECTION-CAST** | 섹션 | 출연진 영역 | - Header: "Featured Cast" | 최대 6명 표시 (Desktop) |
| **CAST-CARD** | 카드 | 출연진 카드 | - Avatar: 80×80px<br>- Name: 1줄 ellipsis<br>- Count: 아이템 수 | **Click**: `/cast/:id`로 이동 |
| **BTN-SEEALL** | 버튼 | 전체 보기 | - Style: Text Link | **Click**: Cast 목록 모달/페이지 |

### Items 섹션

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---|:---|:---|
| **SECTION-ITEMS** | 섹션 | 아이템 그리드 | - Header: "All Items" | 무한 스크롤 |
| **SEL-FILTER** | 셀렉트 | 필터 드롭다운 | - Options: Latest, Popular, Cast별 | **Change**: 그리드 필터링 |
| **GRID** | 그리드 | ThiingsGrid | - Columns: 2 (Mobile), 4-5 (Desktop) | 무한 스크롤 지원 |
| **CARD-IMAGE** | 카드 | 이미지 카드 | - 홈 피드와 동일 | **Click**: 상세 모달 |

### Related Media 섹션

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---|:---|:---|
| **SECTION-RELATED** | 섹션 | 관련 미디어 | - Header: "Related Media" | 최대 4개 표시 |
| **RELATED-CARD** | 카드 | 미디어 카드 | - Poster: 100×150px<br>- Title: 1줄<br>- Items: 아이템 수 | **Click**: `/media/:id`로 이동 |

---

## 4. 상태 정의

| 상태 | 조건 | UI 변화 |
|:---|:---|:---|
| **로딩** | 페이지 첫 진입 | Hero 스켈레톤 + 그리드 스켈레톤 |
| **데이터 표시** | 미디어 정보 로드 완료 | 정상 렌더링 |
| **아이템 로딩** | 추가 아이템 로드 중 | 그리드 하단 스피너 |
| **필터 적용** | 필터 변경 | 그리드 새로고침 |
| **빈 결과** | 아이템 0개 | Empty State 표시 |
| **에러** | API 실패 | 에러 메시지 + 재시도 |
| **404** | 유효하지 않은 ID | Not Found 페이지 |

---

## 5. 데이터 요구사항

### 5.1 API 호출

| API | Method | Endpoint | 호출 시점 | 응답 |
|:---|:---:|:---|:---|:---|
| 미디어 상세 | GET | `/api/media/:id` | SSR | `{ media, cast[], stats }` |
| 아이템 목록 | GET | `/api/media/:id/posts?cursor&limit` | 무한 스크롤 | `{ images[], nextCursor }` |
| 관련 미디어 | GET | `/api/media/:id/related` | 페이지 로드 | `{ relatedMedia[] }` |

### 5.2 상태 관리

| 스토어 | 키 | 타입 | 설명 |
|:---|:---|:---|:---|
| React Query | `["media", id]` | `QueryKey` | 미디어 상세 캐시 |
| React Query | `["media", id, "posts", filter]` | `QueryKey` | 아이템 목록 캐시 |
| React Query | `["media", id, "related"]` | `QueryKey` | 관련 미디어 캐시 |
| URL State | `filter` | `string` | 현재 필터 상태 |

### 5.3 데이터 타입

```typescript
interface MediaDetail {
  id: string;
  type: 'group' | 'show' | 'drama' | 'movie';
  name: string;
  nameKo?: string;
  category: CategoryType;
  year?: number;
  platform?: string;
  genre?: string;
  description?: string;
  posterUrl?: string;
  bannerUrl?: string;
}

interface MediaStats {
  itemCount: number;
  contributorCount: number;
  viewCount: number;
}

interface MediaCast {
  id: string;
  name: string;
  nameKo?: string;
  profileImageUrl?: string;
  itemCount: number;  // 이 미디어에서의 아이템 수
  role?: string;      // 역할 (배우인 경우)
}

interface RelatedMedia {
  id: string;
  name: string;
  posterUrl?: string;
  itemCount: number;
}
```

---

## 6. 에러 처리

| 에러 코드 | 상황 | 사용자 메시지 | 처리 방법 |
|:---:|:---|:---|:---|
| 404 | 미디어 없음 | "Media not found" | Not Found 페이지 |
| 500 | 서버 오류 | "Failed to load media" | 재시도 버튼 |
| Empty | 아이템 없음 | "No items yet for this media" | 빈 상태 안내 |

---

## 7. 접근성 (A11y)

- **키보드 네비게이션**:
  - Tab: Hero → Cast → Filter → Grid 순 이동
  - Arrow Left/Right: Cast 가로 스크롤 (모바일)
- **스크린 리더**:
  - Hero에 `aria-label="미디어 정보"` 제공
  - Cast 카드에 `aria-label="출연진 이름, 아이템 N개"` 제공
- **이미지**: 모든 포스터/배너에 alt 텍스트 제공

---

## 8. 컴포넌트 매핑

| UI 영역 | 컴포넌트 | 파일 경로 |
|:---|:---|:---|
| 페이지 | MediaGalleryPage | `packages/web/app/media/[id]/page.tsx` |
| Hero | MediaHero | `packages/web/lib/components/media/MediaHero.tsx` |
| Cast 그리드 | CastGrid | `packages/web/lib/components/media/CastGrid.tsx` |
| Cast 카드 | CastCard | `packages/web/lib/components/media/CastCard.tsx` |
| 아이템 그리드 | ThiingsGrid | `packages/web/lib/components/grid/ThiingsGrid.tsx` |
| 관련 미디어 | RelatedMediaSection | `packages/web/lib/components/media/RelatedMediaSection.tsx` |
| 훅 | useMediaDetail | `packages/web/lib/hooks/useMediaDetail.ts` |

---

## 9. 구현 체크리스트

- [ ] 미디어 상세 페이지 레이아웃
- [ ] Hero 섹션 (배경 + 정보)
- [ ] Cast 그리드 (가로 스크롤)
- [ ] 아이템 그리드 + 무한 스크롤
- [ ] 필터 드롭다운 (Cast별, 정렬)
- [ ] 관련 미디어 섹션
- [ ] SSR + 캐싱 최적화
- [ ] 반응형 대응
- [ ] 404 처리
- [ ] 접근성 테스트

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|:---|:---|:---|:---|
| v1.0 | 2026-01-14 | PM | 초기 작성 |
