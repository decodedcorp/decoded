# Image Dimensions Implementation Plan (#58)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** posts 테이블에 image_width/image_height를 추가하여 CLS 없는 이미지 렌더링 구현

**Architecture:** Supabase migration으로 컬럼 추가 → Rust API의 DTO/서비스에 필드 포함 → 프론트엔드 ImageCard에서 동적 aspect-ratio 적용. 기존 데이터(NULL)는 aspect-square fallback.

**Tech Stack:** Supabase (PostgreSQL), Rust/Axum/SeaORM, Next.js, TypeScript

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `packages/api-server/migration/src/m20260409_add_image_dimensions.rs` | DB migration |
| Modify | `packages/api-server/migration/src/lib.rs` | Migration 등록 |
| Modify | `packages/api-server/src/entities/posts.rs` | SeaORM entity 필드 |
| Modify | `packages/api-server/src/domains/posts/dto.rs:80-109` | CreatePostDto에 optional 필드 |
| Modify | `packages/api-server/src/domains/posts/dto.rs:214-251` | PostResponse에 필드 |
| Modify | `packages/api-server/src/domains/posts/dto.rs:254-314` | PostListItem에 필드 |
| Modify | `packages/api-server/src/domains/posts/dto.rs:396-514` | PostDetailResponse에 필드 |
| Modify | `packages/api-server/src/domains/posts/service.rs` | 조회/생성 시 dimension 포함 |
| Modify | `packages/web/app/images/ImageCard.tsx` | 동적 aspect-ratio |
| Modify | `packages/web/app/posts/[id]/page.tsx` | 상세 페이지 dimension 활용 |
| Regenerate | `packages/web/lib/api/generated/` | Orval 타입 재생성 |

---

### Task 1: Supabase Migration

**Files:**
- Create: `packages/api-server/migration/src/m20260409_add_image_dimensions.rs`
- Modify: `packages/api-server/migration/src/lib.rs`

- [ ] **Step 1: migration 파일 생성**

```rust
// packages/api-server/migration/src/m20260409_add_image_dimensions.rs
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Alias::new("posts"))
                    .add_column(ColumnDef::new(Alias::new("image_width")).integer().null())
                    .add_column(ColumnDef::new(Alias::new("image_height")).integer().null())
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Alias::new("posts"))
                    .drop_column(Alias::new("image_width"))
                    .drop_column(Alias::new("image_height"))
                    .to_owned(),
            )
            .await
    }
}
```

- [ ] **Step 2: lib.rs에 migration 등록**

`packages/api-server/migration/src/lib.rs`의 `migrations()` vec에 추가:
```rust
Box::new(m20260409_add_image_dimensions::Migration),
```

그리고 모듈 선언 추가:
```rust
mod m20260409_add_image_dimensions;
```

- [ ] **Step 3: migration 실행 확인**

Run: `cd packages/api-server && cargo check`
Expected: 컴파일 성공

- [ ] **Step 4: Supabase에 migration 적용**

Supabase MCP를 통해 dev DB에 적용:
```sql
ALTER TABLE posts
  ADD COLUMN image_width integer,
  ADD COLUMN image_height integer;

COMMENT ON COLUMN posts.image_width IS 'Original image width in pixels';
COMMENT ON COLUMN posts.image_height IS 'Original image height in pixels';
```

- [ ] **Step 5: Commit**

```bash
git add packages/api-server/migration/
git commit -m "feat(api): add image_width/image_height columns to posts table (#58)"
```

---

### Task 2: SeaORM Entity & DTO 업데이트

**Files:**
- Modify: `packages/api-server/src/entities/posts.rs`
- Modify: `packages/api-server/src/domains/posts/dto.rs`

- [ ] **Step 1: entities/posts.rs에 필드 추가**

Model 구조체에 추가:
```rust
pub image_width: Option<i32>,
pub image_height: Option<i32>,
```

- [ ] **Step 2: CreatePostDto에 optional 필드 추가**

`dto.rs`의 `CreatePostDto` 구조체에:
```rust
    /// 이미지 가로 크기 (픽셀, 옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_width: Option<i32>,

    /// 이미지 세로 크기 (픽셀, 옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_height: Option<i32>,
```

- [ ] **Step 3: PostResponse에 필드 추가**

`PostResponse` 구조체에:
```rust
    /// 이미지 가로 크기 (픽셀)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_width: Option<i32>,

    /// 이미지 세로 크기 (픽셀)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_height: Option<i32>,
```

`From<PostModel> for PostResponse` impl에도 매핑 추가:
```rust
image_width: model.image_width,
image_height: model.image_height,
```

- [ ] **Step 4: PostListItem에 필드 추가**

`PostListItem` 구조체에:
```rust
    /// 이미지 가로 크기 (픽셀)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_width: Option<i32>,

    /// 이미지 세로 크기 (픽셀)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_height: Option<i32>,
```

- [ ] **Step 5: PostDetailResponse에 필드 추가**

`PostDetailResponse` 구조체에:
```rust
    /// 이미지 가로 크기 (픽셀)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_width: Option<i32>,

    /// 이미지 세로 크기 (픽셀)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_height: Option<i32>,
```

`from_post_model` 메서드에도 매핑 추가:
```rust
image_width: post.image_width,
image_height: post.image_height,
```

- [ ] **Step 6: 컴파일 확인**

Run: `cd packages/api-server && cargo check`
Expected: 컴파일 성공 (service.rs에서 PostListItem 빌드 시 누락 필드 에러 가능 — 다음 Task에서 해결)

- [ ] **Step 7: Commit**

```bash
git add packages/api-server/src/
git commit -m "feat(api): add image dimensions to post DTOs (#58)"
```

---

### Task 3: Service 레이어 업데이트

**Files:**
- Modify: `packages/api-server/src/domains/posts/service.rs`

- [ ] **Step 1: service.rs에서 PostListItem 빌드 부분 찾기**

`service.rs`에서 `PostListItem` 구조체를 생성하는 부분을 찾아 `image_width`와 `image_height` 매핑 추가:
```rust
image_width: post_model.image_width,
image_height: post_model.image_height,
```

- [ ] **Step 2: 포스트 생성 시 dimension 저장**

`create_post` 또는 `create_post_with_solutions` 함수에서 `CreatePostDto`의 `image_width`/`image_height`를 ActiveModel에 설정:
```rust
image_width: Set(dto.image_width),
image_height: Set(dto.image_height),
```

- [ ] **Step 3: 컴파일 및 포맷 확인**

Run: `cd packages/api-server && cargo fmt --check && cargo check`
Expected: 포맷 통과, 컴파일 성공

- [ ] **Step 4: Commit**

```bash
git add packages/api-server/src/domains/posts/service.rs
git commit -m "feat(api): include image dimensions in post queries and creation (#58)"
```

---

### Task 4: OpenAPI Spec & Frontend 타입 재생성

**Files:**
- Regenerate: `packages/api-server/openapi.json`
- Regenerate: `packages/web/lib/api/generated/`

- [ ] **Step 1: OpenAPI spec 재생성**

Run: `cd packages/api-server && cargo run -- --openapi > openapi.json` (또는 프로젝트의 openapi 생성 방법에 따라)

openapi.json에 `image_width`, `image_height` 필드가 PostListItem, PostResponse, PostDetailResponse에 포함되었는지 확인.

- [ ] **Step 2: Orval 타입 재생성**

Run: `cd packages/web && bun run generate:api`
Expected: 새 필드가 포함된 타입 생성

- [ ] **Step 3: Commit**

```bash
git add packages/api-server/openapi.json
git commit -m "chore(api): regenerate OpenAPI spec with image dimensions (#58)"
```

---

### Task 5: Frontend ImageCard 동적 aspect-ratio

**Files:**
- Modify: `packages/web/app/images/ImageCard.tsx`

- [ ] **Step 1: Post 타입에 dimension 필드 확인**

`lib/api/mutation-types.ts` 또는 generated 타입에서 `Post` 타입에 `image_width`, `image_height`가 포함되었는지 확인.

- [ ] **Step 2: ImageCard에 동적 aspect-ratio 적용**

```tsx
export function ImageCard({ post }: Props) {
  const [imageError, setImageError] = useState(false);
  const displayName = post.artist_name || post.group_name || "Unknown";

  // 동적 aspect-ratio: dimension이 있으면 실제 비율, 없으면 1/1 (정사각형)
  const aspectRatio =
    post.image_width && post.image_height
      ? `${post.image_width} / ${post.image_height}`
      : undefined;

  return (
    <Link href={`/posts/${post.id}`}>
      <article className="border border-border rounded-xl overflow-hidden relative shadow-md hover:shadow-lg transition-shadow cursor-pointer">
        {/* Image thumbnail */}
        <div
          className={post.image_width && post.image_height ? "bg-muted relative" : "aspect-square bg-muted relative"}
          style={aspectRatio ? { aspectRatio } : undefined}
        >
          {post.image_url && !imageError ? (
            <img
              src={post.image_url}
              alt={`Post by @${displayName}`}
              className="w-full h-full object-cover"
              loading="lazy"
              width={post.image_width ?? undefined}
              height={post.image_height ?? undefined}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted">
              <div className="text-2xl mb-1">📷</div>
              <div className="text-xs">No image</div>
            </div>
          )}
        </div>
        {/* ... rest unchanged */}
```

- [ ] **Step 3: 빌드 확인**

Run: `cd packages/web && bun run build`
Expected: 빌드 성공

- [ ] **Step 4: Commit**

```bash
git add packages/web/app/images/ImageCard.tsx
git commit -m "feat(web): dynamic aspect-ratio for image cards with dimension data (#58)"
```

---

### Task 6: Post 상세 페이지 dimension 적용

**Files:**
- Modify: `packages/web/app/posts/[id]/page.tsx`

- [ ] **Step 1: 상세 페이지에서 dimension 활용**

PostDetailResponse에서 `image_width`, `image_height`를 받아 이미지 렌더링 시 활용. OG 메타데이터에도 실제 dimension 반영 (하드코딩 1200x630 대신).

- [ ] **Step 2: 빌드 확인**

Run: `cd packages/web && bun run build`
Expected: 빌드 성공

- [ ] **Step 3: Commit**

```bash
git add packages/web/app/posts/
git commit -m "feat(web): use real image dimensions in post detail page (#58)"
```

---

### Task 7: QA — Playwright CLS 테스트

**Files:**
- Create: `/tmp/test-image-dimensions.js`

- [ ] **Step 1: Playwright 테스트 스크립트 작성**

```javascript
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 이미지 그리드 페이지 로드
  await page.goto('http://localhost:3001/images');
  await page.waitForLoadState('networkidle');

  // CLS 측정
  const cls = await page.evaluate(() => {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) clsValue += entry.value;
        }
        resolve(clsValue);
      }).observe({ type: 'layout-shift', buffered: true });
      setTimeout(() => resolve(0), 3000);
    });
  });

  console.log(`CLS: ${cls}`);
  console.log(cls < 0.1 ? 'PASS: CLS is good' : 'FAIL: CLS too high');

  // 스크린샷
  await page.screenshot({ path: '/tmp/image-grid-dimensions.png', fullPage: true });

  await browser.close();
})();
```

- [ ] **Step 2: 테스트 실행**

Run: `cd packages/web && PORT=3001 bun run dev &` (백그라운드)
Run: `node /tmp/test-image-dimensions.js`
Expected: CLS < 0.1, 스크린샷에서 이미지 비율 정상

- [ ] **Step 3: dimension 없는 기존 포스트 fallback 확인**

기존 포스트가 정사각형(aspect-square)으로 정상 표시되는지 시각 확인.

- [ ] **Step 4: 최종 Commit**

```bash
git add -A
git commit -m "test(web): add Playwright CLS test for image dimensions (#58)"
```
