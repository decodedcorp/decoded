# Posts Image Dimensions 추가 (#58)

## 목표
posts 테이블에 이미지 width/height를 저장하여 프론트엔드에서 layout shift(CLS) 없이 이미지를 렌더링한다.

## 현재 상태
- posts 테이블에 `image_url`만 저장, dimension 정보 없음
- `seed_asset` 테이블에만 width/height 존재
- ImageCard는 CSS `aspect-square` + `object-cover`로 처리 (정사각형 고정)
- API 응답에 dimension 정보 없음

## 변경 사항

### 1. DB Migration
**Supabase migration**
```sql
ALTER TABLE posts
  ADD COLUMN image_width integer,
  ADD COLUMN image_height integer;

COMMENT ON COLUMN posts.image_width IS 'Original image width in pixels';
COMMENT ON COLUMN posts.image_height IS 'Original image height in pixels';
```
- nullable — 기존 포스트는 NULL 허용
- seed_asset에서 기존 데이터 백필 가능 (별도 작업)

### 2. API Server 수정
**파일**: `packages/api-server/src/domains/posts/`
- `dto.rs`: PostListItem, PostDetailResponse에 `image_width: Option<i32>`, `image_height: Option<i32>` 추가
- `service.rs`: 포스트 조회 시 dimension 포함
- CreatePostDto에 optional width/height 필드 추가
- OpenAPI spec 자동 갱신 (utoipa)

### 3. Frontend 적용
**파일**: `packages/web/app/images/ImageCard.tsx`
- width/height가 있으면 `aspect-ratio: width/height` 동적 적용
- 없으면 기존 `aspect-square` fallback 유지
- Next.js Image 컴포넌트 활용 시 width/height 전달

**파일**: `packages/web/app/posts/[id]/page.tsx`
- 상세 페이지에서도 실제 dimension 기반 렌더링

### 4. 타입 재생성
- `packages/api-server/openapi.json` 업데이트
- `cd packages/web && bun run generate:api` 실행
- `packages/shared/supabase/types.ts` 재생성 (필요 시)

## QA 기준
- [ ] API 응답에 image_width, image_height 포함 확인
- [ ] dimension 있는 포스트 → 올바른 aspect-ratio 렌더링
- [ ] dimension 없는 기존 포스트 → aspect-square fallback 정상
- [ ] 새 포스트 생성 시 dimension 저장 확인
- [ ] layout shift 없이 이미지 로딩 (Lighthouse CLS 체크)

## QA 도구
- **Playwright CLI** — 헤드리스 스크린샷 비교, CLS 측정

## 브랜치
- `feat/58-image-dimensions` (dev 기반)
