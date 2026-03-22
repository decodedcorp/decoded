# Quick Task 008 Summary: Feed 페이지 API 사용

## 완료 내용

Feed 페이지에서 Supabase 직접 쿼리(`post_image` 테이블)를 REST API(`/api/v1/posts`)로 교체.

## 변경 사항

### `packages/web/app/feed/FeedClient.tsx`
- `useInfiniteFilteredImages` → `useInfinitePosts` 훅 변경
- `ImageWithPostId` → `PostGridItem` 타입 변경
- `initialImages` prop 제거
- 타입 매핑 간소화 (API 응답이 이미 정규화된 형태)

### `packages/web/app/feed/page.tsx`
- `async` 함수 → 일반 함수로 변경
- `fetchLatestImagesServer` 호출 제거
- SSR 데이터 패칭 제거 (API는 클라이언트 사이드)

## 수정된 에러

```
{"code":"PGRST205","details":null,"hint":"Perhaps you meant the table 'public.posts'","message":"Could not find the table 'public.post_image' in the schema cache"}
```

## 커밋

- `5467cf2` - fix(feed): replace Supabase direct query with REST API

## 검증

```bash
yarn dev
# http://localhost:3000/feed 접속
# 이미지 정상 로드 확인
```
