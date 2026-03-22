# [FLW-08] My Try — User Try Post Flow

> Screens: SCR-VIEW-01 -> SCR-CREA-TRY-01 -> SCR-VIEW-01 | Updated: 2026-03-12

## Journey

User discovers a post with fashion items, wants to share their own attempt (outfit, purchase, styling). They create a "Try" post linked to the original, forming a community thread of real-world experiences around curated content.

## Core Concept

- **Try = Post with `parent_post_id`**: No new table. Extends `posts` with 2 columns.
- **Lightweight upload**: Simplified version of FLW-03 (skip AI detect, minimal metadata).
- **Bidirectional link**: Original post shows Try count + gallery; Try post links back to original.

## Screen Sequence

```
[Post Detail]  --"나도 해봤어" tap-->  [Try Upload]  --submit-->  [Post Detail (updated)]
  SCR-VIEW-01                         SCR-CREA-TRY-01              SCR-VIEW-01
       |                                    |
       v                                    v
  [Try Gallery]                        [Try Preview]
  (bottom section)                     (before submit)
```

## DB Schema Change (Backend)

```sql
-- posts 테이블 확장
ALTER TABLE posts ADD COLUMN parent_post_id UUID REFERENCES posts(id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN post_type VARCHAR(20) DEFAULT 'original';
-- post_type: 'original' | 'try'

CREATE INDEX idx_posts_parent_post_id ON posts(parent_post_id);
CREATE INDEX idx_posts_post_type ON posts(post_type);

COMMENT ON COLUMN posts.parent_post_id IS 'Try 포스트의 원본 포스트 ID (null이면 일반 포스트)';
COMMENT ON COLUMN posts.post_type IS 'original: 일반, try: 사용자 시도 공유';
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/posts/:postId/tries` | 원본 포스트의 Try 목록 (pagination) |
| GET | `/api/v1/posts/:postId/tries/count` | Try 개수 |
| POST | `/api/v1/posts` | 기존 엔드포인트 확장 — `parent_post_id` 필드 추가 |

### GET /api/v1/posts/:postId/tries

```json
// Response
{
  "tries": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "image_url": "https://...",
      "post_type": "try",
      "parent_post_id": "uuid",
      "media_title": "나도 입어봤어요!",
      "created_at": "2026-03-12T...",
      "user": {
        "display_name": "fashionista_kim",
        "avatar_url": "https://..."
      }
    }
  ],
  "total": 12,
  "cursor": "..."
}
```

### POST /api/v1/posts (Try 생성)

```json
// Request — 기존 포스트 생성에 parent_post_id만 추가
{
  "image": "(file)",
  "parent_post_id": "원본-post-uuid",
  "post_type": "try",
  "media_title": "한줄 코멘트 (선택)",
  "media_type": "try"
}
```

## Steps

### Step 1: Try 시작

- **Screen:** SCR-VIEW-01 (`/posts/:id`)
- **Trigger:** "나도 해봤어" 버튼 탭
- **Precondition:** 로그인 필수 (미로그인 시 로그인 바텀시트)
- **Next:** -> Step 2

### Step 2: Try 업로드

- **Screen:** SCR-CREA-TRY-01 (`/request/try?parent=:postId`)
- **Trigger:** 이전 단계에서 라우팅
- **UI 구성:**
  - 상단: 원본 포스트 썸네일 + 제목 (컨텍스트)
  - 중앙: 이미지 업로드 (DropZone, 단일 이미지)
  - 하단: 한줄 코멘트 (선택, 100자 제한)
  - CTA: "Try 공유하기"
- **State change:** `tryStore.image`, `tryStore.comment`
- **Data:** POST `/api/v1/posts` with `{ image, parent_post_id, post_type: 'try', media_title }`
- **Next:** -> Step 3 (on success) | -> Error toast (on failure)

### Step 3: 완료

- **Screen:** SCR-VIEW-01 (`/posts/:parentId`)
- **Trigger:** Try 생성 성공
- **State change:** Try 갤러리 invalidate + refetch
- **UI:** 성공 토스트 + 스크롤 to Try 갤러리 섹션
- **Next:** Flow end

## State Transitions

| From | Event | To | Side Effect |
|------|-------|----|-------------|
| viewing | tap "나도 해봤어" | auth_check | check login status |
| auth_check | logged_in | uploading | navigate to try upload |
| auth_check | not_logged_in | login_prompt | show login bottom sheet |
| uploading | image selected | ready | enable submit button |
| ready | tap "공유하기" | submitting | POST /api/v1/posts |
| submitting | success | complete | navigate back, refetch tries |
| submitting | error | ready | show error toast, retain state |

## UI Integration Points

### Post Detail (SCR-VIEW-01) — Try 섹션 추가

```
[기존 포스트 콘텐츠]
[Item Spots + Shop Grid]
[More from this Look]
─────────────────────
[Tries (N)]                    ← 새 섹션
  [Try 카드 그리드 2열]
  [Try 카드: 유저 아바타 + 이미지 썸네일]
  ["나도 해봤어" CTA 버튼]
```

### Feed (SCR-DISC-03) — Try 포스트 카드

```
┌─────────────────────┐
│ [유저 아바타] @user  │
│  tried this look     │
│ ┌──────┬──────────┐  │
│ │원본  │  Try     │  │
│ │thumb │  이미지  │  │
│ └──────┴──────────┘  │
│ "한줄 코멘트"         │
└─────────────────────┘
```

### Profile (SCR-USER-02) — My Tries 탭

- 기존 탭: Posts | Activity | Badges
- 추가: Posts | **Tries** | Activity | Badges
- 쿼리: `WHERE user_id = :me AND post_type = 'try'`

## Shared Data

| Data | Source | Consumed By |
|------|--------|-------------|
| parent_post_id | Post Detail URL param | Try Upload, API call |
| original post thumbnail | Post Detail cache | Try Upload header |
| try_count | GET /tries/count | Post Detail Try section badge |
| tries[] | GET /tries | Post Detail Try gallery |

## Error Recovery

| Error Point | Recovery | Fallback |
|-------------|----------|----------|
| Image upload fails | Retry with toast | Preserve selected image |
| Try creation fails | Retry with confirm | Preserve comment text |
| Auth expired mid-flow | Re-auth silently | Return to post detail |

## Future Extensions

- **Try에 Spots 추가**: 실제 구매 링크 태깅 (Phase 2)
- **Try 비교 뷰**: 원본 vs Try 나란히 비교 (Phase 2)
- **Try 투표**: "잘 소화했어요" 리액션 (Phase 3)
- **VTON 연동**: VTON 결과를 Try로 자동 공유 (Phase 3)
