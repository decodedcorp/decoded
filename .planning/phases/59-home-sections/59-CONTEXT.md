---
phase: 59
title: Home Sections — What's Happening & Decoded Pick
status: planning
created: 2026-04-03
---

# Phase 59 — Home Sections Redesign

홈 화면에 두 개의 독립적인 섹션을 기획·구현한다.

| 섹션 | 성격 | 포지셔닝 |
|------|------|----------|
| **What's Happening** | 실시간성, 알고리즘 | 히어로 바로 아래 |
| **Decoded Pick** | 큐레이션, 에디토리얼 | 중간~하단 독립 섹션 |

---

## 1. What's Happening

### 목적
"지금 decoded에서 무슨 일이 일어나고 있어?" — 실시간성 콘텐츠 소비.  
trending 아티스트와 최신 포스트를 한 화면에서 빠르게 스캔.

### 데이터 소스 (모두 기존 API 재활용)
- Trending 아티스트: `fetchTrendingKeywordsServer(8)` — 최근 포스트 빈도 기반
- 최신 포스트: `fetchWhatsNewPostsServer(12)` — `created_at` 내림차순

### UI 레이아웃

```
┌─────────────────────────────────────────────────────┐
│  WHAT'S HAPPENING             [View all →]           │
├─────────────────────┬───────────────────────────────┤
│  TRENDING           │  LATEST POSTS                 │
│                     │  ┌────┐ ┌────┐ ┌────┐ ┌────┐  │
│  01 아이유           │  │    │ │    │ │    │ │    │  │
│  02 뉴진스           │  └────┘ └────┘ └────┘ └────┘  │
│  03 블랙핑크         │  ← 가로 스크롤 (snap)           │
│  04 BTS              │                               │
│  05 에스파           │                               │
└─────────────────────┴───────────────────────────────┘
```

- **왼쪽**: `TrendingListSection` 재활용 (GSAP marquee 호버 효과 유지)
- **오른쪽**: 최신 포스트 가로 스크롤 카드 (`scroll-snap-x mandatory`)
  - 카드: 이미지 + 아티스트명 + 업로드 시간 (ex. "2h ago")
  - 카드 수: 최대 12개
- **반응형**: mobile에서는 trending → latest 세로 스택

### 기존 섹션과의 관계
현재 홈의 `EditorialSection + TrendingListSection` side-by-side를 **What's Happening 단일 섹션으로 대체**.  
`EditorialSection`은 삭제하거나 Decoded Pick 섹션으로 흡수.

---

## 2. Decoded Pick (Curation)

### 목적
decoded가 "이 룩을 봐야 해"라고 말하는 섹션 — 에디터 또는 AI가 의도적으로 선별한 Pick.  
브랜드 정체성의 핵심. 알고리즘이 아니라 **의지**가 담긴 선택.

### 현재 문제
`fetchDecodedPickServer(offset=2)` = 단순히 3번째로 최근 업로드된 포스트.  
큐레이션이 아니라 우연이다. 기반 데이터 모델을 바꿔야 한다.

### 데이터 모델 변경

#### Option A — posts 테이블에 컬럼 추가 (심플)
```sql
ALTER TABLE posts ADD COLUMN is_decoded_pick BOOLEAN DEFAULT false;
ALTER TABLE posts ADD COLUMN pick_date DATE;
ALTER TABLE posts ADD COLUMN pick_note TEXT; -- 에디터 코멘트 (optional)
```
- 장점: 마이그레이션 최소, 기존 쿼리 확장 용이
- 단점: 히스토리 추적 어려움 (pick을 교체하면 이전 기록 없음)

#### Option B — decoded_picks 테이블 (권장)
```sql
CREATE TABLE decoded_picks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES posts(id),
  pick_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  note        TEXT,           -- 에디터 코멘트
  curated_by  TEXT DEFAULT 'ai', -- 'ai' | 'editor'
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX ON decoded_picks (pick_date); -- 날짜당 1개
```
- 장점: 히스토리 보존, 큐레이션 주체 추적, admin에서 관리 용이
- 단점: 새 테이블 마이그레이션 필요

→ **Option B 권장**

### 큐레이션 방식

| 방식 | 트리거 | 기준 |
|------|--------|------|
| **Auto Pick** | 매일 자정 (cron) | spots ≥ 1 이고 solutions 완성된 포스트 중 view_count 상위 |
| **Manual Pick** | Admin 대시보드에서 직접 선택 | 에디터 판단 |

Auto Pick이 기본값, Manual Pick이 override.

### 서버 쿼리 변경
```typescript
// fetchDecodedPickServer() — 기존 offset 방식 제거
// decoded_picks 테이블에서 오늘의 is_active=true pick 조회
// spots + solutions join 포함
```

### UI 레이아웃
기존 `DecodedPickSection` 컴포넌트 구조 유지 (이미 고품질).  
변경사항:
- 헤더에 pick_date 표시 ("April 3rd Pick")
- `curated_by === 'editor'` 일 때 "Editor's Choice" 뱃지, AI일 때 "AI Curated"
- `note` 있으면 에디터 코멘트 텍스트 표시
- "View all picks" → `/picks` 아카이브 페이지 (미래 구현, 일단 링크만)

```
┌─────────────────────────────────────────────────────┐
│  DECODED'S PICK          April 3rd  [AI Curated]    │
│  ─────────────────────────────────────────────────  │
│  ┌─────────────────────┐  Product Breakdown         │
│  │                     │  ─────────────────         │
│  │   [이미지 + spots]   │  [Brand] Name     →       │
│  │                     │  [Brand] Name     →       │
│  │  아티스트명           │  [Brand] Name     →       │
│  │  "룩 제목/컨텍스트"   │                           │
│  └─────────────────────┘  [Discover full aesthetic] │
└─────────────────────────────────────────────────────┘
```

---

## 구현 순서

### Phase 59-01: What's Happening 섹션
1. `WhatsHappeningSection` 컴포넌트 신규 생성
2. `page.tsx`에서 기존 `EditorialSection + TrendingListSection` side-by-side를 교체
3. 최신 포스트 가로 스크롤 서브 컴포넌트 추가

### Phase 59-02: Decoded Pick 데이터 모델
1. `decoded_picks` 테이블 마이그레이션 생성
2. `fetchDecodedPickServer()` 쿼리 변경
3. Admin 대시보드에 Pick 관리 UI 추가 (간단한 포스트 선택)

### Phase 59-03: Decoded Pick 섹션 연결
1. `DecodedPickSection`에 pick_date, curated_by, note props 추가
2. `page.tsx`에 독립 섹션으로 배치 (히어로 아래가 아닌 별도 위치)

---

## 홈 최종 레이아웃 (목표)

```
1. HeroItemSync
2. What's Happening  ← NEW (trending + latest)
3. Editorial Magazine
4. Decoded Pick      ← NEW (curated, 기존 DecodedPickSection 개선)
5. Masonry Grid
6. Dome Gallery
```
