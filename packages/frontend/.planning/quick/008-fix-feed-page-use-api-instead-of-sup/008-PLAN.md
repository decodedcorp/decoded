# Quick Task 008: Feed 페이지 API 사용 (Supabase 직접 쿼리 제거)

## 문제

Feed 페이지에서 `useInfiniteFilteredImages` 훅 사용 → `fetchUnifiedImages` → `fetchImagesByPostImage` 호출 시 `post_image` 테이블 직접 쿼리 실패:

```
{"code":"PGRST205","details":null,"hint":"Perhaps you meant the table 'public.posts'","message":"Could not find the table 'public.post_image' in the schema cache"}
```

## 해결책

이미 `useInfinitePosts` 훅이 REST API (`/api/v1/posts`)를 사용하도록 구현되어 있음.
Feed 페이지에서 `useInfiniteFilteredImages` 대신 `useInfinitePosts` 사용하도록 변경.

## 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `packages/web/app/feed/FeedClient.tsx` | `useInfiniteFilteredImages` → `useInfinitePosts` 사용 |
| `packages/web/app/feed/page.tsx` | SSR 초기 데이터 제거 (API는 클라이언트에서 호출) |

## 태스크

### Task 1: FeedClient.tsx 수정

1. `useInfiniteFilteredImages` import 제거
2. `useInfinitePosts` 사용
3. 타입 매핑 수정 (`PostGridItem` → `FeedCardItem`)

### Task 2: page.tsx 수정

1. SSR 데이터 fetching 제거 (API는 클라이언트 사이드)
2. `initialImages` prop 제거

## 검증

```bash
yarn dev
# http://localhost:3000/feed 접속
# 이미지 로드 확인
```
