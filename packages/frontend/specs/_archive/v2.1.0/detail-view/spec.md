# 상세 & 인터랙션

> 기능: V-01 ~ V-06
> 상태: 70% 구현됨 (V-01, V-02 완료)
> 의존성: 아이템 감지 파이프라인

---

## 개요

상세 기능은 게시물과 아이템의 표시를 처리하며, 시각적 요소를 제품 정보와 연결하는 스팟 시스템을 포함합니다. 인터랙션 기능은 투표와 댓글을 통해 커뮤니티 참여를 가능하게 합니다.

### 관련 화면
- `/images/[id]` - 풀페이지 상세 뷰
- `/@modal/(.)images/[id]` - 모달 상세 뷰 (intercepting route)

### 현재 구현 상태
- `app/images/[id]/page.tsx` - 풀페이지 라우트
- `app/@modal/(.)images/[id]/page.tsx` - 모달 라우트
- `lib/components/detail/ImageDetailContent.tsx` - 공유 상세 로직
- `lib/components/detail/ItemDetailCard.tsx` - 아이템 카드
- `lib/components/detail/ConnectorLayer.tsx` - 스팟 연결선

---

## 기능

### V-01 반응형 상세 뷰

- **설명**: 모바일은 바텀 시트로 표시; 웹은 분할 모달 뷰로 표시
- **우선순위**: P0
- **상태**: **구현됨** ✅
- **의존성**: 없음

#### 현재 구현 상태
- 웹용 모달 intercepting route
- 직접 네비게이션/모바일용 풀페이지
- 공유 컨텐츠 컴포넌트

#### 인수 조건
- [x] 모바일: 스크롤 가능한 콘텐츠의 풀페이지 뷰
- [x] 웹: 왼쪽에 이미지, 오른쪽에 상세 정보가 있는 모달 오버레이
- [x] 스와이프/클릭으로 이미지 간 네비게이션
- [x] 닫기 버튼으로 피드로 돌아가기
- [x] 상세 보기 시 URL 업데이트
- [x] 뒤로가기 버튼 정상 동작

#### 관련 파일
- `app/images/[id]/page.tsx`
- `app/@modal/(.)images/[id]/page.tsx`
- `lib/components/detail/ImageDetailPage.tsx`
- `lib/components/detail/ImageDetailModal.tsx`
- `lib/components/detail/ImageDetailContent.tsx`

#### 향후 개선사항
- [ ] 모바일 스와이프 제스처
- [ ] 키보드 네비게이션 (←/→)
- [ ] 인접 이미지 프리로드

---

### V-02 스팟 인터랙션

- **설명**: 아이템 좌표에 스팟을 이미지에 표시; 스팟 클릭 시 아이템 카드 하이라이트
- **우선순위**: P0
- **상태**: **구현됨** ✅
- **의존성**: 바운딩 박스가 있는 아이템 감지

#### 현재 구현 상태
- `ImageCanvas.tsx` - 스팟 렌더링 + 스포트라이트 효과
- `ConnectorLayer.tsx` - 스팟에서 카드로 SVG 베지에 곡선 연결선
- `ItemDetailCard.tsx` - 호버/클릭 인터랙션 핸들러
- `InteractiveShowcase.tsx` - 전체 조합 및 ScrollTrigger 연동
- `useNormalizedItems.ts` - 좌표 정규화 훅
- 아이템에 `center` 좌표 있음 (정규화 0-1)

#### 인수 조건
- [x] 이미지의 정확한 위치에 스팟 표시 (`ImageCanvas.tsx` - 정규화 좌표 기반)
- [x] 아이템 목록과 일치하는 번호 레이블 사용 (인덱스 라벨 01, 02, 03...)
- [x] 스팟 클릭 시 해당 아이템 카드로 스크롤 및 하이라이트 (ScrollTrigger 연동)
- [x] 아이템 카드 클릭 시 해당 스팟 하이라이트 (`onActivate`/`onDeactivate`)
- [x] 스팟과 카드 모두에 호버 상태 (스포트라이트 효과)
- [x] 모바일: 탭 인터랙션 부드럽게 동작 (40vh fixed + scrolling cards)
- [x] 호버/선택 시 연결선 애니메이션 (`ConnectorLayer.tsx` - dash array + glow)
- [x] 다양한 이미지 크기에서 스팟 적절히 스케일 (`object-fit: cover` 보정)

#### 향후 개선사항
- [ ] 스팟 개수 제한 (10개 초과 시 UI 처리)
- [ ] 스팟 겹침 방지 알고리즘

#### UI/UX 요구사항

**스팟 디자인**:
```
    ┌───┐
    │ 1 │  ← 번호가 있는 원 (24px)
    └─┬─┘
      │    ← 연결선
      ▼
   [item]
```

**인터랙션 상태**:
```
Default:     ●1 (흰색 채우기, 어두운 테두리)
Hover:       ●1 (primary 색상 채우기)
Selected:    ●1 (primary 채우기, glow 효과)
Connected:   ●1──────[카드 하이라이트됨]
```

**분할 뷰 레이아웃**:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌────────────────────────┐  ┌────────────────────────────────┐│
│  │                        │  │ Item Details                   ││
│  │      [Image]           │  │                                ││
│  │         ●1             │  │ ┌────────────────────────────┐││
│  │              ●2        │  │ │ 1. Jacket                  │││
│  │     ●3                 │  │ │    Brand Name              │││
│  │                        │  │ │    $299                    │││
│  │                        │  │ └────────────────────────────┘││
│  │                        │  │ ┌────────────────────────────┐││
│  │                        │  │ │ 2. Bag              ●      │││
│  │                        │  │ │    Brand Name       ← dot  │││
│  └────────────────────────┘  │ └────────────────────────────┘││
│                              │                                ││
│                              └────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

#### 데이터 요구사항
- 아이템 `center` 좌표 (이미 존재)
- 아이템 순서/번호 매기기

#### 구현 노트
```typescript
// lib/components/detail/SpotOverlay.tsx
interface Spot {
  itemId: string;
  index: number;
  position: { x: number; y: number }; // 정규화 0-1
}

function SpotOverlay({ spots, selectedSpotId, onSpotClick }: Props) {
  return (
    <div className="absolute inset-0">
      {spots.map(spot => (
        <SpotMarker
          key={spot.itemId}
          index={spot.index}
          style={{
            left: `${spot.position.x * 100}%`,
            top: `${spot.position.y * 100}%`,
          }}
          isSelected={spot.itemId === selectedSpotId}
          onClick={() => onSpotClick(spot.itemId)}
        />
      ))}
    </div>
  );
}
```

#### 구현된 파일
- `lib/components/detail/ImageCanvas.tsx` - 스팟 렌더링 + 스포트라이트 + Pan/Zoom
- `lib/components/detail/ConnectorLayer.tsx` - SVG 베지에 곡선 연결선
- `lib/components/detail/ItemDetailCard.tsx` - 인터랙션 핸들러 + 매거진 스타일 카드
- `lib/components/detail/InteractiveShowcase.tsx` - 전체 조합 (sticky split)
- `lib/hooks/useNormalizedItems.ts` - 좌표 정규화 훅
- `lib/components/detail/types.ts` - 타입 정의 및 유틸리티

---

### V-03 듀얼 매치 리스트

- **설명**: "The Original" (정확한 매치) vs "The Vibe" (비슷하면서 저렴한 대안) 표시
- **우선순위**: P0
- **상태**: 미시작
- **의존성**: V-02 (스팟 시스템), 아이템 match_type 필드

#### 인수 조건
- [ ] "Original"과 "Vibe" 섹션으로 아이템 그룹화
- [ ] 섹션 간 명확한 시각적 구분
- [ ] "Original"에 정확한 제품과 브랜드/가격 표시
- [ ] "Vibe"에 유사 대안 표시 (보통 더 저렴)
- [ ] 가격 비교 표시
- [ ] 사용자가 "Vibe" 제안 제출 가능
- [ ] 투표로 최고의 "Vibe" 매치 결정

#### UI/UX 요구사항

**듀얼 매치 레이아웃**:
```
┌─────────────────────────────────────────┐
│  👗 Item #1: Jacket                     │
│                                         │
│  THE ORIGINAL                           │
│  ┌─────────────────────────────────┐   │
│  │ [Img] Celine Triomphe Jacket    │   │
│  │       $2,850                    │   │
│  │       [Buy Original →]          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  THE VIBE                    +Add Vibe  │
│  ┌─────────────────────────────────┐   │
│  │ [Img] Zara Structured Blazer    │   │
│  │       $129          ▲12 ▼2      │   │
│  │       [Buy Vibe →]              │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ [Img] H&M Premium Jacket        │   │
│  │       $89           ▲8 ▼1       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Show 2 more vibes]                   │
└─────────────────────────────────────────┘
```

#### 데이터 요구사항
- 아이템 `match_type`: 'original' | 'vibe'
- `original_item_id`로 아이템 연결 (vibe가 original 참조)
- vibe 아이템별 투표 수

#### 구현 노트
```typescript
interface ItemGroup {
  original: Item;
  vibes: ItemWithVotes[];
}

// original로 아이템 그룹화
function groupItems(items: Item[]): ItemGroup[] {
  const originals = items.filter(i => i.matchType === 'original');
  return originals.map(original => ({
    original,
    vibes: items.filter(i =>
      i.matchType === 'vibe' &&
      i.originalItemId === original.id
    ).sort((a, b) => b.voteScore - a.voteScore)
  }));
}
```

#### 생성/수정할 파일
- `lib/components/detail/DualMatchSection.tsx`
- `lib/components/detail/OriginalItemCard.tsx`
- `lib/components/detail/VibeItemCard.tsx`
- `lib/components/detail/AddVibeButton.tsx`

---

### V-04 스마트 태그 (브레드크럼)

- **설명**: 상세 뷰 상단에 "Squid Game > Sae-byeok > Training Suit" 같은 컨텍스트 태그 표시
- **우선순위**: P0
- **상태**: 미시작
- **의존성**: D-02 (계층적 필터), 게시물 메타데이터

#### 인수 조건
- [ ] 상세 뷰 상단에 태그 표시
- [ ] 표시: Media > Cast > Context
- [ ] 각 태그 클릭 가능 (필터링된 피드로 네비게이션)
- [ ] 가용 메타데이터에 따라 태그 적응
- [ ] 디자인 시스템과 일치하는 비주얼 스타일링

#### UI/UX 요구사항

**태그 표시**:
```
┌─────────────────────────────────────────────────────────────┐
│  🎬 Squid Game  ›  👤 Jung Ho-yeon  ›  🏃 Training Scene   │
│  ↑ 클릭 가능      ↑ 클릭 가능          ↑ 클릭 가능          │
└─────────────────────────────────────────────────────────────┘
```

**부분 태그** (모든 메타데이터가 없을 때):
```
┌─────────────────────────────────────────────────────────────┐
│  🎵 BLACKPINK  ›  👤 Jisoo                                  │
└─────────────────────────────────────────────────────────────┘
```

#### 데이터 요구사항
- `media_id`, `cast_ids`, `context_type`이 있는 게시물
- 조인된 media와 cast 데이터

#### 구현 노트
```typescript
// lib/components/detail/SmartTags.tsx
interface SmartTagsProps {
  media?: Media;
  cast?: Cast[];
  contextType?: ContextType;
}

function SmartTags({ media, cast, contextType }: SmartTagsProps) {
  const tags: Tag[] = [];

  if (media) {
    tags.push({
      icon: media.type === 'group' ? '🎵' : '🎬',
      label: media.name,
      href: `/media/${media.id}`
    });
  }

  if (cast?.[0]) {
    tags.push({
      icon: '👤',
      label: cast[0].name,
      href: `/cast/${cast[0].id}`
    });
  }

  if (contextType) {
    tags.push({
      icon: contextIcons[contextType],
      label: contextLabels[contextType],
      href: `/?context=${contextType}`
    });
  }

  return <TagBreadcrumb tags={tags} />;
}
```

#### 생성/수정할 파일
- `lib/components/detail/SmartTags.tsx`
- `lib/components/detail/TagBreadcrumb.tsx`
- `ImageDetailContent.tsx`에 추가

---

### V-05 구매 링크 (아웃링크)

- **설명**: "Buy" 버튼이 추적이 포함된 어필리에이트 링크를 새 탭에서 열기
- **우선순위**: P0
- **상태**: 미시작
- **의존성**: S-05 (클릭 트래커), S-03 (딥 링크 생성기)

#### 인수 조건
- [ ] 각 아이템 카드에 "Buy" 버튼 표시
- [ ] 클릭 시 새 탭에서 어필리에이트 링크 열기
- [ ] 분석용 클릭 이벤트 로깅
- [ ] 사용자 귀속 추적 (로그인 시)
- [ ] 추적 링크 생성 중 로딩 상태
- [ ] 링크 생성 실패 시 에러 처리
- [ ] 모바일: 인앱 브라우저 또는 외부 브라우저에서 열기

#### UI/UX 요구사항

**Buy 버튼**:
```
┌────────────────────────────────────┐
│ [Buy Now →]    또는    [View Item →] │
└────────────────────────────────────┘

상태:
- Default: Primary 색상, "Buy Now →"
- Hover: 더 어두운 색조
- Loading: 스피너 + "Opening..."
- 링크 없음: "View Item" (어필리에이트 없이 제품 페이지 열기)
```

**가격 표시**:
```
₩ 299,000
$299.00 USD  ← 가능하면 둘 다 표시
```

#### 데이터 요구사항
- 아이템 `purchase_url`
- 어필리에이트 코드 주입
- 클릭 이벤트 로깅

#### 구현 노트
```typescript
// lib/utils/affiliateLink.ts
async function generateAffiliateLink(item: Item, userId?: string): Promise<string> {
  const baseUrl = item.purchaseUrl;
  const trackingParams = new URLSearchParams({
    utm_source: 'decoded',
    utm_medium: 'affiliate',
    item_id: item.id,
    ...(userId && { user_id: userId })
  });

  // 클릭 이벤트 로깅
  await logClickEvent({
    itemId: item.id,
    userId,
    originalUrl: baseUrl
  });

  return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${trackingParams}`;
}
```

#### 생성/수정할 파일
- `lib/components/detail/BuyButton.tsx`
- `lib/utils/affiliateLink.ts`
- `lib/hooks/useTrackClick.ts`
- `app/api/track/click/route.ts` - 클릭 로깅 엔드포인트

---

### V-06 투표 & 댓글

- **설명**: 사용자가 아이템 정확도에 투표하고 댓글 남기기
- **우선순위**: P0
- **상태**: 미시작
- **의존성**: U-01 (인증)

#### 인수 조건

**투표**:
- [ ] 각 아이템에 "Accurate" / "Inaccurate" 투표 버튼
- [ ] 사용자당 아이템별 한 번만 투표 가능
- [ ] 투표 수 표시
- [ ] 정확도 퍼센트 계산
- [ ] 투표 변경 가능
- [ ] 투표에 로그인 필요

**댓글**:
- [ ] 아이템 아래 댓글 섹션
- [ ] 스레드 답글 지원
- [ ] 마크다운 포맷팅 (기본)
- [ ] 본인 댓글 수정
- [ ] 본인 댓글 삭제
- [ ] 부적절한 댓글 신고
- [ ] 댓글에 로그인 필요

#### UI/UX 요구사항

**투표 UI**:
```
┌────────────────────────────────────────────┐
│ Is this identification accurate?           │
│                                            │
│ [👍 Accurate (47)]   [👎 Inaccurate (3)]  │
│                                            │
│ 94% accuracy                               │
└────────────────────────────────────────────┘

투표 후 상태:
┌────────────────────────────────────────────┐
│ [👍 Accurate (48)] ✓   [👎 Inaccurate (3)]│
└────────────────────────────────────────────┘
```

**댓글 UI**:
```
┌────────────────────────────────────────────┐
│ 💬 Comments (12)                           │
├────────────────────────────────────────────┤
│ [Avatar] user123 • 2 hours ago             │
│ I think this is actually from the 2023    │
│ collection, not 2024.                      │
│ [Reply] [Report]                           │
│                                            │
│   ↳ [Avatar] original_poster • 1 hour ago │
│     Thanks for the correction! Updated.   │
│     [Reply] [Report]                       │
│                                            │
│ [Avatar] fashionista • 5 hours ago        │
│ Great find! 🔥                            │
│ [Reply] [Report]                           │
├────────────────────────────────────────────┤
│ [Add a comment...]            [Post]       │
└────────────────────────────────────────────┘
```

#### 데이터 요구사항

**Vote 테이블**:
```sql
CREATE TABLE vote (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES user(id),
  item_id UUID REFERENCES item(id),
  type VARCHAR(20), -- 'accurate' | 'inaccurate'
  created_at TIMESTAMPTZ,
  UNIQUE(user_id, item_id)
);
```

**Comment 테이블**:
```sql
CREATE TABLE comment (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES user(id),
  target_type VARCHAR(20), -- 'post' | 'item'
  target_id UUID,
  content TEXT,
  parent_id UUID REFERENCES comment(id),
  status VARCHAR(20) DEFAULT 'visible',
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### API 엔드포인트
```
POST /api/items/:id/vote
  body: { type: 'accurate' | 'inaccurate' }

DELETE /api/items/:id/vote

GET /api/items/:id/comments?page=1
POST /api/items/:id/comments
  body: { content: string, parentId?: string }

PATCH /api/comments/:id
  body: { content: string }

DELETE /api/comments/:id

POST /api/comments/:id/report
  body: { reason: string }
```

#### 생성/수정할 파일
- `lib/components/detail/VotingSection.tsx`
- `lib/components/detail/VoteButton.tsx`
- `lib/components/detail/CommentSection.tsx`
- `lib/components/detail/CommentItem.tsx`
- `lib/components/detail/CommentForm.tsx`
- `lib/hooks/useVote.ts`
- `lib/hooks/useComments.ts`
- `app/api/items/[id]/vote/route.ts`
- `app/api/items/[id]/comments/route.ts`
- `app/api/comments/[id]/route.ts`

---

## 데이터 모델

전체 타입 정의는 [data-models.md](./data-models.md)를 참조하세요.

### 상세 & 인터랙션의 주요 타입

```typescript
interface ItemWithVotes extends Item {
  votes: {
    accurateCount: number;
    inaccurateCount: number;
    accuracyScore: number;
    userVote?: 'accurate' | 'inaccurate';
  };
}

interface Comment {
  id: string;
  userId: string;
  user: { displayName: string; avatarUrl: string };
  content: string;
  parentId?: string;
  replies?: Comment[];
  createdAt: Date;
  updatedAt: Date;
}

interface Vote {
  userId: string;
  itemId: string;
  type: 'accurate' | 'inaccurate';
}
```

---

## 마이그레이션 경로

### 1단계: 스팟 시스템 완성
1. SpotOverlay 컴포넌트 완성
2. 클릭-투-스크롤 인터랙션 추가
3. 다양한 이미지 크기에서 테스트

### 2단계: 스마트 태그
1. 게시물에 메타데이터 추가
2. SmartTags 컴포넌트 구축
3. 네비게이션 링크 추가

### 3단계: 듀얼 매치
1. 아이템에 match_type 추가
2. 그룹화된 아이템 표시 구축
3. "Add Vibe" 흐름 추가

### 4단계: 구매 & 투표
1. 클릭 추적 구현
2. 어필리에이트 링크가 있는 buy 버튼 구축
3. 투표 시스템 구현
4. 댓글 섹션 추가

---

## 성능 고려사항

- 스팟 위치는 한 번 계산하고 캐시해야 함
- 댓글은 페이지네이션되어야 함
- 투표 수는 eventually consistent 가능 (optimistic update 사용)
- 상세 뷰에서 이미지는 priority 로딩 필요

---

## 컴포넌트 매핑 (상세 구현 참조)

> 이 섹션은 각 UI 요소가 실제 코드에서 어떻게 구현되는지 매핑합니다.

### V-01 반응형 상세 뷰 - 컴포넌트 매핑

#### 모달 vs 풀페이지 라우팅 구조

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        ROUTING ARCHITECTURE                                 │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  URL: /images/[id]                                                         │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ Case 1: Soft Navigation (카드 클릭)                                 │  │
│  │                                                                      │  │
│  │ CardCell.tsx onClick                                                 │  │
│  │      │                                                               │  │
│  │      ▼                                                               │  │
│  │ transitionStore.prepare(rect, imageId)                              │  │
│  │      │                                                               │  │
│  │      ▼                                                               │  │
│  │ router.push(`/(.)images/${id}`, { scroll: false })                  │  │
│  │      │                                                               │  │
│  │      ▼                                                               │  │
│  │ Intercepting Route 활성화                                           │  │
│  │ app/@modal/(.)images/[id]/page.tsx                                  │  │
│  │      │                                                               │  │
│  │      ▼                                                               │  │
│  │ ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │ │                    MODAL OVERLAY                                │ │  │
│  │ │  ┌─────────────────────────────────────────────────────────┐   │ │  │
│  │ │  │ 배경 피드 (blur + dim)                                   │   │ │  │
│  │ │  │                                                          │   │ │  │
│  │ │  │     ┌────────────────────────────────────────────┐      │   │ │  │
│  │ │  │     │          ImageDetailModal.tsx             │      │   │ │  │
│  │ │  │     │                                            │      │   │ │  │
│  │ │  │     │  ┌──────────────────────────────────────┐ │      │   │ │  │
│  │ │  │     │  │    ImageDetailContent.tsx           │ │      │   │ │  │
│  │ │  │     │  │    (공유 컨텐츠 컴포넌트)           │ │      │   │ │  │
│  │ │  │     │  └──────────────────────────────────────┘ │      │   │ │  │
│  │ │  │     │                                            │      │   │ │  │
│  │ │  │     └────────────────────────────────────────────┘      │   │ │  │
│  │ │  │                                                          │   │ │  │
│  │ │  └─────────────────────────────────────────────────────────┘   │ │  │
│  │ └─────────────────────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ Case 2: Hard Navigation (직접 URL 접근, 새로고침)                   │  │
│  │                                                                      │  │
│  │ Direct URL: /images/[id]                                            │  │
│  │      │                                                               │  │
│  │      ▼                                                               │  │
│  │ app/images/[id]/page.tsx (Full Page)                                │  │
│  │      │                                                               │  │
│  │      ▼                                                               │  │
│  │ ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │ │                    FULL PAGE VIEW                               │ │  │
│  │ │                                                                  │ │  │
│  │ │  ┌────────────────────────────────────────────────────────────┐ │ │  │
│  │ │  │              ImageDetailPage.tsx                           │ │ │  │
│  │ │  │                                                             │ │ │  │
│  │ │  │  ┌────────────────────────────────────────────────────────┐│ │ │  │
│  │ │  │  │    ImageDetailContent.tsx                              ││ │ │  │
│  │ │  │  │    (공유 컨텐츠 컴포넌트)                              ││ │ │  │
│  │ │  │  └────────────────────────────────────────────────────────┘│ │ │  │
│  │ │  │                                                             │ │ │  │
│  │ │  └────────────────────────────────────────────────────────────┘ │ │  │
│  │ └─────────────────────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│ 파일 구조:                                                                 │
│ packages/web/app/                                                          │
│ ├── @modal/                                                                │
│ │   └── (.)images/                                                         │
│ │       └── [id]/                                                          │
│ │           └── page.tsx  ← Intercepting Route (모달)                     │
│ │                                                                          │
│ └── images/                                                                │
│     └── [id]/                                                              │
│         └── page.tsx      ← Full Page Route                               │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

#### 데스크톱 분할 뷰 레이아웃

```
┌────────────────────────────────────────────────────────────────────────────┐
│ DESKTOP DETAIL VIEW (ImageDetailContent.tsx)                               │
│                                                                            │
│ ┌─────────────────────────────┬──────────────────────────────────────────┐ │
│ │                             │                                          │ │
│ │      IMAGE SECTION          │         ITEM SECTION                     │ │
│ │                             │                                          │ │
│ │ ┌─────────────────────────┐ │  ┌────────────────────────────────────┐ │ │
│ │ │                         │ │  │ SmartTags.tsx                      │ │ │
│ │ │    InteractiveShowcase  │ │  │ ┌──────────────────────────────┐  │ │ │
│ │ │        .tsx             │ │  │ │ 🎬 Squid Game › 👤 호연 › 🏃 │  │ │ │
│ │ │                         │ │  │ └──────────────────────────────┘  │ │ │
│ │ │  ┌───────────────────┐  │ │  └────────────────────────────────────┘ │ │
│ │ │  │                   │  │ │                                          │ │
│ │ │  │    [이미지]       │  │ │  ┌────────────────────────────────────┐ │ │
│ │ │  │       ●1          │  │ │  │ ItemList.tsx                       │ │ │
│ │ │  │            ●2     │  │ │  │                                    │ │ │
│ │ │  │    ●3             │  │ │  │ ┌────────────────────────────────┐│ │ │
│ │ │  │                   │  │ │  │ │ 1. ItemDetailCard.tsx          ││ │ │
│ │ │  └───────────────────┘  │ │  │ │ ┌────────────────────────────┐││ │ │
│ │ │                         │ │  │ │ │ [Img] Celine Jacket        │││ │ │
│ │ │  ┌───────────────────┐  │ │  │ │ │       $2,850               │││ │ │
│ │ │  │ SpotOverlay.tsx    │  │ │  │ │ │       [Buy →]              │││ │ │
│ │ │  │ (스팟 오버레이)     │  │ │  │ │ └────────────────────────────┘││ │ │
│ │ │  └───────────────────┘  │ │  │ └────────────────────────────────┘│ │ │
│ │ │                         │ │  │                                    │ │ │
│ │ │  ┌───────────────────┐  │ │  │ ┌────────────────────────────────┐│ │ │
│ │ │  │ ConnectorLayer    │  │ │  │ │ 2. ItemDetailCard.tsx          ││ │ │
│ │ │  │ (스팟-카드 연결선)  │  │ │  │ │ ┌────────────────────────────┐││ │ │
│ │ │  └───────────────────┘  │ │  │ │ │ [Img] Prada Bag            │││ │ │
│ │ │                         │ │  │ │ │       $1,950               │││ │ │
│ │ └─────────────────────────┘ │  │ │ └────────────────────────────┘││ │ │
│ │                             │  │ └────────────────────────────────┘│ │ │
│ │ width: 60%                  │  │                                    │ │ │
│ │                             │  │ width: 40%                        │ │ │
│ │                             │  └────────────────────────────────────┘ │ │
│ │                             │                                          │ │
│ └─────────────────────────────┴──────────────────────────────────────────┘ │
│                                                                            │
│ 컴포넌트 트리:                                                             │
│ ImageDetailContent.tsx                                                     │
│ ├── InteractiveShowcase.tsx (이미지 + 스팟 + 연결선)                        │
│ │   ├── Image (next/image)                                                │
│ │   ├── SpotOverlay.tsx                                                    │
│ │   │   └── SpotMarker.tsx (×N)                                           │
│ │   └── ConnectorLayer.tsx (SVG)                                         │
│ │                                                                          │
│ └── ItemSection.tsx (아이템 목록)                                         │
│     ├── SmartTags.tsx                                                      │
│     └── ItemList.tsx                                                       │
│         └── ItemDetailCard.tsx (×N)                                       │
│             ├── ItemImage                                                  │
│             ├── ItemInfo                                                   │
│             ├── VotingSection.tsx                                          │
│             └── BuyButton.tsx                                              │
│                                                                            │
│ 상태 관리:                                                                 │
│ - selectedSpotId: 로컬 state (useState)                                    │
│ - imageData: React Query cache                                             │
│ - items: useNormalizedItems() 훅                                          │
│ - transitionState: transitionStore (GSAP 애니메이션)                      │
└────────────────────────────────────────────────────────────────────────────┘
```

#### GSAP FLIP 전환 애니메이션

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    FLIP ANIMATION SEQUENCE                                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  [1. CAPTURE] 카드 클릭 시                                                 │
│       │                                                                    │
│       ▼                                                                    │
│  CardCell.tsx:onClick                                                      │
│       │                                                                    │
│       ├─── GSAP Flip.getState(cardElement) ────────────────┐              │
│       │         │                                          │              │
│       │         ▼                                          │              │
│       │    원본 위치/크기 저장                              │              │
│       │    {                                               │              │
│       │      x, y, width, height,                          │              │
│       │      scaleX, scaleY, rotation                      │              │
│       │    }                                               │              │
│       │                                                    │              │
│       ├─── transitionStore.prepare(state, imageId) ───────┤              │
│       │                                                    │              │
│       ▼                                                    │              │
│  [2. NAVIGATE] 라우트 변경                                  │              │
│       │                                                    │              │
│       ├─── router.push(`/(.)images/${id}`) ───────────────┤              │
│       │                                                    │              │
│       ▼                                                    │              │
│  [3. ANIMATE] 모달 마운트 시                                │              │
│       │                                                    │              │
│       ├─── ImageDetailModal.tsx:useEffect ────────────────┤              │
│       │         │                                          │              │
│       │         ▼                                          │              │
│       │    Flip.from(storedState, {                        │              │
│       │      duration: 0.5,                                │              │
│       │      ease: "power2.out",                           │              │
│       │      scale: true,                                  │              │
│       │      absolute: true,                               │              │
│       │      onComplete: () => {                           │              │
│       │        transitionStore.complete()                  │              │
│       │      }                                             │              │
│       │    })                                              │              │
│       │         │                                          │              │
│       │         ▼                                          │              │
│       │    ┌────────────────────────────────────────┐      │              │
│       │    │                                        │      │              │
│       │    │  카드 위치 ───────────▶ 모달 위치      │      │              │
│       │    │                                        │      │              │
│       │    │  [Small]          [Large + Details]   │      │              │
│       │    │     ↗                    ↗            │      │              │
│       │    │      \                  /             │      │              │
│       │    │       \────────────────/              │      │              │
│       │    │         FLIP Animation                │      │              │
│       │    │                                        │      │              │
│       │    └────────────────────────────────────────┘      │              │
│       │                                                    │              │
│       ▼                                                    │              │
│  [4. REVERSE] 모달 닫기 시                                  │              │
│       │                                                    │              │
│       ├─── onClose 또는 router.back() ────────────────────┤              │
│       │         │                                          │              │
│       │         ▼                                          │              │
│       │    Flip.from(modalState, {                         │              │
│       │      duration: 0.4,                                │              │
│       │      ease: "power2.in",                            │              │
│       │      targets: originalCard,                        │              │
│       │      onComplete: () => {                           │              │
│       │        transitionStore.reset()                     │              │
│       │      }                                             │              │
│       │    })                                              │              │
│       │                                                    │              │
│       ▼                                                    │              │
│  [5. CLEANUP] 애니메이션 완료                               │              │
│                                                            │              │
└────────────────────────────────────────────────────────────────────────────┘

transitionStore 상태:
┌────────────────────────────────────────────────────────────┐
│ {                                                          │
│   isTransitioning: boolean,                                │
│   sourceState: Flip.State | null,                         │
│   targetImageId: string | null,                           │
│   prepare: (state, id) => void,                           │
│   complete: () => void,                                    │
│   reset: () => void                                        │
│ }                                                          │
└────────────────────────────────────────────────────────────┘
```

---

### V-02 스팟 인터랙션 - 컴포넌트 매핑

#### 스팟 시스템 상세 구조

```
┌────────────────────────────────────────────────────────────────────────────┐
│ SPOT INTERACTION SYSTEM                                                      │
│                                                                            │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ InteractiveShowcase.tsx                                                │ │
│ │                                                                        │ │
│ │  ┌────────────────────────────────────────┐                           │ │
│ │  │ 이미지 컨테이너 (position: relative)   │                           │ │
│ │  │                                         │                           │ │
│ │  │  ┌─────────────────────────────────┐   │                           │ │
│ │  │  │ <Image />                       │   │                           │ │
│ │  │  │ priority={true}                 │   │                           │ │
│ │  │  │ onLoad → setImageLoaded(true)   │   │                           │ │
│ │  │  └─────────────────────────────────┘   │                           │ │
│ │  │                                         │                           │ │
│ │  │  ┌─────────────────────────────────┐   │                           │ │
│ │  │  │ SpotOverlay.tsx                  │   │  ← position: absolute    │ │
│ │  │  │ (inset: 0)                      │   │     pointer-events: none │ │
│ │  │  │                                  │   │     (개별 스팟만 이벤트)   │ │
│ │  │  │  ●1 ──────────────────────────────────▶ SpotMarker #1          │ │
│ │  │  │       left: 32%                  │   │    onClick → select(1)  │ │
│ │  │  │       top: 45%                   │   │                          │ │
│ │  │  │                                  │   │                          │ │
│ │  │  │            ●2 ────────────────────────▶ SpotMarker #2          │ │
│ │  │  │                 left: 67%        │   │    onClick → select(2)  │ │
│ │  │  │                 top: 28%         │   │                          │ │
│ │  │  │                                  │   │                          │ │
│ │  │  │    ●3 ────────────────────────────────▶ SpotMarker #3          │ │
│ │  │  │         left: 23%                │   │    onClick → select(3)  │ │
│ │  │  │         top: 72%                 │   │                          │ │
│ │  │  │                                  │   │                          │ │
│ │  │  └─────────────────────────────────┘   │                           │ │
│ │  │                                         │                           │ │
│ │  └────────────────────────────────────────┘                           │ │
│ │                                                                        │ │
│ │  ┌────────────────────────────────────────┐                           │ │
│ │  │ ConnectorLayer.tsx (SVG)               │  ← position: absolute    │ │
│ │  │                                         │     pointer-events: none │ │
│ │  │  <svg viewBox="0 0 100 100">           │                           │ │
│ │  │    <path                               │                           │ │
│ │  │      d="M 32,45 Q 50,45 68,45"         │  ← 스팟1 → 카드1 연결      │ │
│ │  │      stroke={selected ? 'primary' :    │                           │ │
│ │  │              'gray'}                   │                           │ │
│ │  │      strokeDasharray={selected ?       │                           │ │
│ │  │                       "none" : "4,4"} │                           │ │
│ │  │    />                                  │                           │ │
│ │  │    ...                                 │                           │ │
│ │  │  </svg>                                │                           │ │
│ │  │                                         │                           │ │
│ │  └────────────────────────────────────────┘                           │ │
│ │                                                                        │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│ 컴포넌트 파일 위치 (실제 구현):                                            │
│ packages/web/lib/components/detail/                                        │
│ ├── InteractiveShowcase.tsx  - 전체 조합 + ScrollTrigger                  │
│ ├── ImageCanvas.tsx          - 스팟 렌더링 + 스포트라이트 (SpotOverlay 통합) │
│ ├── ItemDetailCard.tsx       - 인터랙션 핸들러                            │
│ ├── ConnectorLayer.tsx       - SVG 베지에 곡선 연결선                     │
│ └── types.ts                 - 좌표 정규화 유틸리티                        │
│                                                                            │
│ packages/web/lib/hooks/                                                    │
│ └── useNormalizedItems.ts    - 좌표 정규화 훅                             │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

#### 스팟 상태 및 스타일 (ImageCanvas.tsx에서 구현)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ SPOT STATES (ImageCanvas.tsx)                                               │
│                                                                            │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ STATE: default                                                         │ │
│ │                                                                        │ │
│ │    ┌───┐                                                               │ │
│ │    │ 1 │   bg: white                                                   │ │
│ │    └───┘   border: 2px solid gray-400                                 │ │
│ │            size: 24px                                                  │ │
│ │            font: 12px bold                                             │ │
│ │            shadow: sm                                                  │ │
│ │            transform: scale(1)                                         │ │
│ │                                                                        │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ STATE: hover                                                           │ │
│ │                                                                        │ │
│ │    ┌───┐                                                               │ │
│ │    │ 1 │   bg: primary-100                                             │ │
│ │    └───┘   border: 2px solid primary                                  │ │
│ │            size: 24px → 28px (transition 150ms)                       │ │
│ │            shadow: md                                                  │ │
│ │            transform: scale(1.1)                                       │ │
│ │            cursor: pointer                                             │ │
│ │                                                                        │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ STATE: selected                                                        │ │
│ │                                                                        │ │
│ │    ╭───╮                                                               │ │
│ │    │ 1 │   bg: primary                                                 │ │
│ │    ╰───╯   border: 2px solid primary-dark                             │ │
│ │      │     color: white                                                │ │
│ │      │     size: 32px                                                  │ │
│ │      │     shadow: lg + glow effect                                    │ │
│ │      │     transform: scale(1.2)                                       │ │
│ │      │                                                                 │ │
│ │      │     ring: 0 0 0 4px primary/30 (GSAP 애니메이션)               │ │
│ │      │                                                                 │ │
│ │      └─── 선택 시 카드로 스크롤                                        │ │
│ │                                                                        │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│ 좌표 변환:                                                                 │
│ item.center = { x: 0.32, y: 0.45 }  (정규화된 0-1 값)                     │
│      ↓                                                                     │
│ style = {                                                                  │
│   left: `${0.32 * 100}%`,  // 32%                                         │
│   top: `${0.45 * 100}%`,   // 45%                                         │
│   transform: 'translate(-50%, -50%)'  // 중앙 정렬                        │
│ }                                                                          │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

#### 스팟-카드 인터랙션 이벤트 흐름

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    SPOT-CARD INTERACTION EVENT FLOW                        │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [FLOW A: 스팟 클릭 → 카드 하이라이트]                                     │
│                                                                          │
│  SpotMarker #2 onClick                                                    │
│       │                                                                  │
│       ▼                                                                  │
│  InteractiveShowcase.tsx                                                 │
│       │                                                                  │
│       ├─── setSelectedSpotId(item2.id) ──────────────────────┐            │
│       │                                                      │            │
│       │    상태 변경으로 인한 리렌더링:                        │            │
│       │                                                      │            │
│       ├─── SpotMarker #2: isSelected={true}                   │            │
│       │         └─── selected 스타일 적용                     │            │
│       │                                                      │            │
│       ├─── ConnectorLayer: 연결선 #2 활성화                  │            │
│       │         └─── stroke: primary, dasharray: none        │            │
│       │                                                      │            │
│       └─── ItemList: item #2 하이라이트                       │            │
│             │                                                │            │
│             ▼                                                │            │
│       ItemDetailCard #2                                      │            │
│             │                                                │            │
│             ├─── ref.scrollIntoView({ behavior: 'smooth' })  │            │
│             │                                                │            │
│             └─── className: ring-2 ring-primary              │            │
│                                                              │            │
│                                                                          │
│  [FLOW B: 카드 클릭 → 스팟 하이라이트]                                     │
│                                                                          │
│  ItemDetailCard #3 onClick                                               │
│       │                                                                  │
│       ▼                                                                  │
│  InteractiveShowcase.tsx                                                 │
│       │                                                                  │
│       ├─── setSelectedSpotId(item3.id) ──────────────────────┐            │
│       │                                                      │            │
│       │    상태 변경:                                         │            │
│       │                                                      │            │
│       ├─── SpotMarker #3: isSelected={true}                   │            │
│       │         │                                            │            │
│       │         └─── GSAP 펄스 애니메이션                     │            │
│       │              gsap.to(spot, {                         │            │
│       │                scale: 1.3,                           │            │
│       │                boxShadow: '0 0 0 8px primary/30',    │            │
│       │                repeat: 2,                            │            │
│       │                yoyo: true,                           │            │
│       │                duration: 0.3                         │            │
│       │              })                                      │            │
│       │                                                      │            │
│       └─── ConnectorLayer: 연결선 #3 활성화                  │            │
│                                                              │            │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### V-03 듀얼 매치 - 컴포넌트 매핑

#### 듀얼 매치 레이아웃 상세

```
┌────────────────────────────────────────────────────────────────────────────┐
│ DUAL MATCH COMPONENT STRUCTURE                                              │
│                                                                            │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ DualMatchSection.tsx                                                   │ │
│ │                                                                        │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐│ │
│ │ │ 👗 Item #1: Jacket                                     [Spot #1]  ││ │
│ │ │                                                                    ││ │
│ │ │ ┌────────────────────────────────────────────────────────────────┐││ │
│ │ │ │ THE ORIGINAL                                                   │││ │
│ │ │ │ ┌────────────────────────────────────────────────────────────┐│││ │
│ │ │ │ │ OriginalItemCard.tsx                                       ││││ │
│ │ │ │ │                                                            ││││ │
│ │ │ │ │ ┌──────────┐  Celine Triomphe Jacket                      ││││ │
│ │ │ │ │ │          │  브랜드: CELINE                               ││││ │
│ │ │ │ │ │  [Img]   │  가격: $2,850                                ││││ │
│ │ │ │ │ │          │                                               ││││ │
│ │ │ │ │ └──────────┘  ┌─────────────────────────────────────────┐ ││││ │
│ │ │ │ │               │ VotingSection.tsx                       │ ││││ │
│ │ │ │ │               │ [👍 Accurate (47)] [👎 Inaccurate (3)] │ ││││ │
│ │ │ │ │               └─────────────────────────────────────────┘ ││││ │
│ │ │ │ │                                                            ││││ │
│ │ │ │ │               ┌─────────────────┐                         ││││ │
│ │ │ │ │               │ BuyButton.tsx   │                         ││││ │
│ │ │ │ │               │ [Buy Original →]│ → affiliateLink()       ││││ │
│ │ │ │ │               └─────────────────┘                         ││││ │
│ │ │ │ └────────────────────────────────────────────────────────────┘│││ │
│ │ │ └────────────────────────────────────────────────────────────────┘││ │
│ │ │                                                                    ││ │
│ │ │ ┌────────────────────────────────────────────────────────────────┐││ │
│ │ │ │ THE VIBE                                        [+ Add Vibe]  │││ │
│ │ │ │                                                                │││ │
│ │ │ │ ┌────────────────────────────────────────────────────────────┐│││ │
│ │ │ │ │ VibeItemCard.tsx (sorted by voteScore DESC)                ││││ │
│ │ │ │ │                                                            ││││ │
│ │ │ │ │ ┌──────────┐  Zara Structured Blazer                      ││││ │
│ │ │ │ │ │          │  가격: $129                                   ││││ │
│ │ │ │ │ │  [Img]   │  ────────────────────────                    ││││ │
│ │ │ │ │ │          │  💰 Save: $2,721 (95%)                       ││││ │
│ │ │ │ │ └──────────┘                                               ││││ │
│ │ │ │ │               [▲ 12]  [▼ 2]   ← VibeVoting.tsx            ││││ │
│ │ │ │ │               [Buy Vibe →]                                 ││││ │
│ │ │ │ └────────────────────────────────────────────────────────────┘│││ │
│ │ │ │                                                                │││ │
│ │ │ │ ┌────────────────────────────────────────────────────────────┐│││ │
│ │ │ │ │ VibeItemCard.tsx                                           ││││ │
│ │ │ │ │ H&M Premium Jacket - $89                                   ││││ │
│ │ │ │ │ [▲ 8]  [▼ 1]                                              ││││ │
│ │ │ │ └────────────────────────────────────────────────────────────┘│││ │
│ │ │ │                                                                │││ │
│ │ │ │ [Show 2 more vibes ▼]                                         │││ │
│ │ │ └────────────────────────────────────────────────────────────────┘││ │
│ │ └────────────────────────────────────────────────────────────────────┘│ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│ 데이터 흐름:                                                               │
│ useNormalizedItems(imageId) → items[]                                     │
│       ↓                                                                    │
│ groupItemsByOriginal(items) → ItemGroup[]                                 │
│       ↓                                                                    │
│ {                                                                          │
│   original: Item,                                                          │
│   vibes: Item[] (sorted by voteScore)                                     │
│ }                                                                          │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

### V-05 구매 링크 - 컴포넌트 매핑

#### 구매 버튼 이벤트 흐름

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    PURCHASE LINK EVENT FLOW                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  BuyButton.tsx onClick                                                   │
│       │                                                                  │
│       ▼                                                                  │
│  [1. 로딩 상태 표시]                                                     │
│       │                                                                  │
│       ├─── setIsLoading(true)                                           │
│       │    └─── 버튼: "Opening..." + Spinner                            │
│       │                                                                  │
│       ▼                                                                  │
│  [2. Affiliate 링크 생성]                                                │
│       │                                                                  │
│       ├─── generateAffiliateLink(item, userId)                          │
│       │         │                                                       │
│       │         ▼                                                       │
│       │    baseUrl = item.purchaseUrl                                   │
│       │         │                                                       │
│       │         ▼                                                       │
│       │    trackingParams = {                                           │
│       │      utm_source: 'decoded',                                     │
│       │      utm_medium: 'affiliate',                                   │
│       │      utm_campaign: 'item_click',                                │
│       │      item_id: item.id,                                          │
│       │      user_id: userId,                                           │
│       │      timestamp: Date.now()                                      │
│       │    }                                                            │
│       │                                                                 │
│       ▼                                                                  │
│  [3. 클릭 이벤트 로깅]                                                   │
│       │                                                                  │
│       ├─── POST /api/track/click                                        │
│       │         │                                                       │
│       │         ▼                                                       │
│       │    {                                                            │
│       │      item_id: item.id,                                          │
│       │      user_id: userId,                                           │
│       │      original_url: baseUrl,                                     │
│       │      affiliate_url: generatedUrl,                               │
│       │      clicked_at: new Date()                                     │
│       │    }                                                            │
│       │         │                                                       │
│       │         ▼                                                       │
│       │    INSERT INTO click_event                                      │
│       │                                                                 │
│       ▼                                                                  │
│  [4. 새 탭에서 열기]                                                     │
│       │                                                                  │
│       ├─── window.open(affiliateUrl, '_blank', 'noopener')              │
│       │                                                                 │
│       ▼                                                                  │
│  [5. 로딩 상태 해제]                                                     │
│       │                                                                  │
│       └─── setIsLoading(false)                                          │
│                                                                          │
│                                                                          │
│  에러 처리:                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ try/catch                                                        │    │
│  │   ├─── 링크 생성 실패 → fallback to original URL                │    │
│  │   ├─── 로깅 실패 → 무시하고 진행 (fire-and-forget)              │    │
│  │   └─── 팝업 차단 → Toast: "Please allow popups"                 │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### V-06 투표 & 댓글 - 컴포넌트 매핑

#### 투표 시스템 상세

```
┌────────────────────────────────────────────────────────────────────────────┐
│ VOTING SYSTEM COMPONENT                                                    │
│                                                                            │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ VotingSection.tsx                                                      │ │
│ │                                                                        │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐│ │
│ │ │ Is this identification accurate?                                   ││ │
│ │ │                                                                    ││ │
│ │ │ ┌─────────────────────────┐  ┌─────────────────────────┐          ││ │
│ │ │ │ VoteButton.tsx          │  │ VoteButton.tsx          │          ││ │
│ │ │ │                         │  │                         │          ││ │
│ │ │ │ [👍 Accurate (47)]     │  │ [👎 Inaccurate (3)]    │          ││ │
│ │ │ │                         │  │                         │          ││ │
│ │ │ │ type="accurate"         │  │ type="inaccurate"       │          ││ │
│ │ │ │ isActive={userVote ===  │  │ isActive={userVote ===  │          ││ │
│ │ │ │          'accurate'}    │  │          'inaccurate'}  │          ││ │
│ │ │ │ count={accurateCount}   │  │ count={inaccurateCount} │          ││ │
│ │ │ │                         │  │                         │          ││ │
│ │ │ └─────────────────────────┘  └─────────────────────────┘          ││ │
│ │ │                                                                    ││ │
│ │ │ ┌────────────────────────────────────────────────────────────────┐││ │
│ │ │ │ AccuracyBar.tsx                                                │││ │
│ │ │ │ ████████████████████░░ 94% accuracy                           │││ │
│ │ │ └────────────────────────────────────────────────────────────────┘││ │
│ │ └────────────────────────────────────────────────────────────────────┘│ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│ 상태 관리:                                                                 │
│ useVote(itemId) → {                                                       │
│   userVote: 'accurate' | 'inaccurate' | null,                             │
│   accurateCount: number,                                                   │
│   inaccurateCount: number,                                                 │
│   vote: (type) => void,                                                    │
│   removeVote: () => void,                                                  │
│   isLoading: boolean                                                       │
│ }                                                                          │
│                                                                            │
│ Optimistic Update:                                                         │
│ 1. 버튼 클릭 즉시 UI 업데이트 (optimistic)                                │
│ 2. API 호출 (POST /api/items/:id/vote)                                    │
│ 3. 성공 → 유지, 실패 → 롤백                                               │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

#### 댓글 시스템 상세

```
┌────────────────────────────────────────────────────────────────────────────┐
│ COMMENT SYSTEM COMPONENTS                                                  │
│                                                                            │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ CommentSection.tsx                                                     │ │
│ │                                                                        │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐│ │
│ │ │ 💬 Comments (12)                                          [Sort ▼]││ │
│ │ └────────────────────────────────────────────────────────────────────┘│ │
│ │                                                                        │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐│ │
│ │ │ CommentList.tsx                                                    ││ │
│ │ │                                                                    ││ │
│ │ │ ┌────────────────────────────────────────────────────────────────┐││ │
│ │ │ │ CommentItem.tsx (depth: 0)                                     │││ │
│ │ │ │                                                                │││ │
│ │ │ │ ┌──────┐  user123 • 2 hours ago                               │││ │
│ │ │ │ │Avatar│  I think this is actually from the 2023 collection   │││ │
│ │ │ │ └──────┘                                                       │││ │
│ │ │ │           [Reply] [Report]                                     │││ │
│ │ │ │                                                                │││ │
│ │ │ │  ┌──────────────────────────────────────────────────────────┐ │││ │
│ │ │ │  │ CommentItem.tsx (depth: 1, reply)                        │ │││ │
│ │ │ │  │                                                          │ │││ │
│ │ │ │  │ ↳ ┌──────┐  op_user • 1 hour ago                        │ │││ │
│ │ │ │  │   │Avatar│  Thanks for the correction! Updated.         │ │││ │
│ │ │ │  │   └──────┘                                               │ │││ │
│ │ │ │  │             [Reply] [Report]                             │ │││ │
│ │ │ │  │                                                          │ │││ │
│ │ │ │  └──────────────────────────────────────────────────────────┘ │││ │
│ │ │ │                                                                │││ │
│ │ │ └────────────────────────────────────────────────────────────────┘││ │
│ │ │                                                                    ││ │
│ │ │ ┌────────────────────────────────────────────────────────────────┐││ │
│ │ │ │ CommentItem.tsx (depth: 0)                                     │││ │
│ │ │ │                                                                │││ │
│ │ │ │ ┌──────┐  fashionista • 5 hours ago                           │││ │
│ │ │ │ │Avatar│  Great find!                                         │││ │
│ │ │ │ └──────┘                                                       │││ │
│ │ │ │           [Reply] [Report]                                     │││ │
│ │ │ └────────────────────────────────────────────────────────────────┘││ │
│ │ │                                                                    ││ │
│ │ │ [Load more comments...]                                           ││ │
│ │ └────────────────────────────────────────────────────────────────────┘│ │
│ │                                                                        │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐│ │
│ │ │ CommentForm.tsx                                                    ││ │
│ │ │                                                                    ││ │
│ │ │ ┌────────────────────────────────────────────────────────────────┐││ │
│ │ │ │ [Add a comment...]                                   [Post]   │││ │
│ │ │ └────────────────────────────────────────────────────────────────┘││ │
│ │ │                                                                    ││ │
│ │ │ 로그인 필요 시:                                                   ││ │
│ │ │ ┌────────────────────────────────────────────────────────────────┐││ │
│ │ │ │ [Login to comment]                                             │││ │
│ │ │ └────────────────────────────────────────────────────────────────┘││ │
│ │ └────────────────────────────────────────────────────────────────────┘│ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│ 상태 관리:                                                                 │
│ useComments(targetId, targetType) → {                                     │
│   comments: Comment[],                                                     │
│   isLoading: boolean,                                                      │
│   hasNextPage: boolean,                                                    │
│   fetchNextPage: () => void,                                               │
│   addComment: (content, parentId?) => void,                                │
│   editComment: (id, content) => void,                                      │
│   deleteComment: (id) => void,                                             │
│   reportComment: (id, reason) => void                                      │
│ }                                                                          │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 에지 케이스 및 에러 처리

### V-01 상세 뷰

| 상황 | 처리 방법 | 구현 위치 |
|------|----------|----------|
| 이미지 로드 실패 | placeholder + 재시도 버튼 | ImageDetailContent.tsx |
| 아이템 0개 | "No items detected" 메시지 | ItemSection.tsx |
| 모달 외부 클릭 | 모달 닫기 (router.back()) | ImageDetailModal.tsx |
| 브라우저 뒤로가기 | FLIP 역방향 애니메이션 | transitionStore |
| 데이터 로딩 중 | Skeleton UI | ImageDetailSkeleton.tsx |

### V-02 스팟 시스템

| 상황 | 처리 방법 | 구현 위치 |
|------|----------|----------|
| 좌표 없는 아이템 | 기본 위치 (0.5, 0.5) | SpotOverlay.tsx |
| 스팟 10개 초과 | 화면에 최대 10개만 표시, 나머지는 리스트에만 | SpotOverlay.tsx |
| 이미지 크기 변경 | ResizeObserver로 재계산 | InteractiveShowcase.tsx |
| 스팟 겹침 | z-index 조정 (선택된 스팟 최상위) | SpotMarker.tsx |

### V-05 구매 링크

| 상황 | 처리 방법 | 구현 위치 |
|------|----------|----------|
| URL 없음 | "View Item" 버튼 비활성화 | BuyButton.tsx |
| 팝업 차단됨 | Toast 알림 + fallback 링크 | BuyButton.tsx |
| 트래킹 실패 | fire-and-forget (무시) | useTrackClick.ts |
| 네트워크 오류 | 원본 URL로 fallback | affiliateLink.ts |

### V-06 투표 & 댓글

| 상황 | 처리 방법 | 구현 위치 |
|------|----------|----------|
| 비로그인 투표 | 로그인 모달 표시 | VoteButton.tsx |
| 투표 중복 | 기존 투표 변경 (토글) | useVote.ts |
| 댓글 빈 내용 | 제출 버튼 비활성화 | CommentForm.tsx |
| 댓글 삭제 후 | "[삭제된 댓글]" 표시 | CommentItem.tsx |
| 신고된 댓글 | 관리자 검토 후 숨김 처리 | CommentItem.tsx |

---

## 구현 상태 체크리스트

### V-01 반응형 상세 뷰
- [x] 모달 라우팅 (intercepting route)
- [x] 풀페이지 라우팅
- [x] 공유 컨텐츠 컴포넌트
- [x] GSAP FLIP 전환 애니메이션
- [ ] 키보드 네비게이션 (←/→)
- [ ] 모바일 스와이프 제스처
- [ ] 인접 이미지 프리로드

### V-02 스팟 인터랙션
- [x] 기본 스팟 렌더링 (`ImageCanvas.tsx`)
- [x] 좌표 기반 위치 지정 (`useNormalizedItems.ts`)
- [x] 연결선 (`ConnectorLayer.tsx` - SVG 베지에 곡선)
- [x] 스팟 클릭 → 카드 스크롤 (ScrollTrigger 연동)
- [x] 카드 클릭 → 스팟 하이라이트 (`onActivate`/`onDeactivate`)
- [x] 호버 애니메이션 (스포트라이트 + Pan/Zoom)
- [x] 모바일 터치 지원 (40vh fixed + scrolling cards)

#### 향후 개선사항 (선택)
- [ ] 스팟 개수 제한 (10개 초과 시 UI 처리)
- [ ] 스팟 겹침 방지 알고리즘

### V-03 듀얼 매치 리스트
- [ ] Original/Vibe 그룹핑
- [ ] OriginalItemCard 컴포넌트
- [ ] VibeItemCard 컴포넌트
- [ ] Vibe 추가 기능
- [ ] Vibe 투표 시스템
- [ ] 가격 비교 표시

### V-04 스마트 태그
- [ ] SmartTags 컴포넌트
- [ ] Media 태그 연결
- [ ] Cast 태그 연결
- [ ] Context 태그 연결

### V-05 구매 링크
- [ ] BuyButton 컴포넌트
- [ ] Affiliate 링크 생성
- [ ] 클릭 트래킹 API
- [ ] 에러 핸들링

### V-06 투표 & 댓글
- [ ] VotingSection 컴포넌트
- [ ] VoteButton 컴포넌트
- [ ] CommentSection 컴포넌트
- [ ] CommentItem 컴포넌트
- [ ] CommentForm 컴포넌트
- [ ] 투표 API
- [ ] 댓글 API
- [ ] 신고 기능
