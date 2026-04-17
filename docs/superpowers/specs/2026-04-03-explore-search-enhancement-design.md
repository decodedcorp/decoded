---
title: Explore Search Enhancement Design Spec
owner: human
status: draft
updated: 2026-04-03
tags: [ui, api]
---

# Explore Search Enhancement Design Spec

## Overview

Explore 페이지의 검색을 "그리드 내 필터" 역할로 확정하고, 자동완성·facet 뱃지·하이라이트·/search 제거를 통해 검색 경험을 개선한다.

## 결정사항

| 항목           | 결정                                   |
| -------------- | -------------------------------------- |
| Search 역할    | Explore 내 필터 (별도 페이지 없음)     |
| 결과 표시      | 그리드 교체 (현재 방식 유지)           |
| 초기 상태      | 뱃지 없이 깨끗, 검색 후에만 facet 뱃지 |
| /search 페이지 | 제거, `/explore?q=` 로 redirect        |

---

## 1. 자동완성 드롭다운

### 데이터 소스

- `GET /api/v1/search/popular` — 인기 검색어 목록
- `GET /api/v1/search/recent` — 최근 검색어 (로그인 사용자)
- 입력 중: 인기 검색어 중 입력값과 매칭되는 항목만 필터링

### UI

- 검색 바 포커스 + 1자 이상 입력 시 드롭다운 오픈
- 각 항목: 텍스트 + Search 아이콘 (우측)
- 항목 클릭 → 해당 검색어로 즉시 검색 (setQuery + setDebouncedQuery)
- 키보드: ↑↓ 이동, Enter 선택, Escape 닫기
- 검색 바 바깥 클릭 → 닫힘

### 구현

- 기존 `packages/web/lib/components/search/SearchSuggestions.tsx` 재사용
- Orval generated hooks: `useSearchPopular`, `useSearchRecent` (이미 존재)
- `ExploreClient`에서 검색 바 `<div className="relative">` 안에 `SearchSuggestions` 조건부 렌더링
- `onSelect` 콜백으로 검색어 설정 + 드롭다운 닫기

### 파일

- Modify: `packages/web/app/explore/ExploreClient.tsx`
- Reuse: `packages/web/lib/components/search/SearchSuggestions.tsx`

---

## 2. Facet 뱃지 UX 개선

### 현재 동작 (유지)

- 검색어 없을 때: 뱃지 숨김
- 검색 결과 로드 후: context, media_type facet 뱃지 표시
- 클릭으로 토글 필터, 활성 뱃지는 primary + X 아이콘

### 개선사항

| 개선           | 상세                                                   |
| -------------- | ------------------------------------------------------ |
| 최소 필터 의미 | facet 값이 1개뿐인 카테고리는 뱃지 생성 안 함          |
| 정렬           | count 높은 순으로 정렬                                 |
| 최대 표시      | 카테고리당 5개, 나머지는 "+N" 뱃지 (클릭 시 전체 펼침) |

### 파일

- Modify: `packages/web/app/explore/ExploreClient.tsx` (뱃지 렌더링 로직)

---

## 3. 검색 결과 하이라이트

### 데이터

- `SearchResultItem.highlight`: `{[key: string]: string} | null`
- Meilisearch가 매칭 부분을 `<em>` 태그로 감싸서 반환
- 예: `{ "artist_name": "<em>Lisa</em>" }`

### UI

- 검색 모드일 때 `ExploreCardCell`에 아티스트명 오버레이 표시
- highlight가 있으면 `<em>` 태그를 `<mark>` 스타일로 렌더링
- highlight가 없으면 일반 텍스트로 아티스트명 표시

### 구현

- `PostGridItem`에 `highlight` 필드 추가 (optional)
- `mapSearchResultToGridItem`에서 highlight 전달
- `ExploreCardCell`에서 highlight 있으면 하단 오버레이에 아티스트명 표시
- `dangerouslySetInnerHTML` 대신 `<em>` 파싱하여 안전하게 렌더링

### 파일

- Modify: `packages/web/lib/hooks/useExploreData.ts` (highlight 매핑)
- Modify: `packages/web/lib/hooks/useImages.ts` (PostGridItem 타입)
- Modify: `packages/web/lib/components/explore/ExploreCardCell.tsx` (오버레이)

---

## 4. /search 페이지 제거

### 라우팅

- `packages/web/app/search/page.tsx` → `/explore?q={검색어}` redirect
- Next.js `redirect()` 함수 사용 (서버 컴포넌트에서)

### URL 동기화

- `ExploreClient` mount 시 URL의 `q` param 읽어서 `useSearchStore` 초기화
- 검색어 변경 시 `router.replace(/explore?q=...)` 로 URL 업데이트 (optional, 공유용)

### 삭제 대상

- `packages/web/app/search/SearchPageClient.tsx` — 삭제
- `packages/web/app/search/page.tsx` — redirect로 교체
- `packages/web/app/search/layout.tsx` — 삭제 (있는 경우)

### 네비게이션

- 네비바의 검색 아이콘/버튼 → `/explore` 이동으로 변경
- 또는 검색 아이콘 클릭 시 explore 페이지의 검색 바에 포커스

### 파일

- Delete: `packages/web/app/search/SearchPageClient.tsx`
- Modify: `packages/web/app/search/page.tsx` (redirect)
- Modify: 네비게이션 컴포넌트 (검색 링크 변경)

---

## 구현 순서

1. `/search` 페이지 제거 + redirect (독립적, 가장 간단)
2. 자동완성 드롭다운 (검색 바에 SearchSuggestions 연결)
3. Facet 뱃지 개선 (정렬, 최대 개수, 최소 필터)
4. 검색 결과 하이라이트 (PostGridItem 타입 변경 → 카드 오버레이)

## 검증

- `bunx tsc --noEmit` 타입 에러 없음
- `bunx eslint --fix` lint 통과
- 수동 테스트:
  - `/search?q=lisa` → `/explore?q=lisa` redirect 확인
  - `/explore` 검색 바 입력 → 자동완성 드롭다운 표시
  - 자동완성 항목 클릭 → 검색 실행 + 결과 그리드
  - Facet 뱃지: count순 정렬, 5개 초과 시 "+N" 표시
  - 카드에 아티스트명 오버레이 + 하이라이트 표시
  - 뱃지 토글 → 결과 필터링
