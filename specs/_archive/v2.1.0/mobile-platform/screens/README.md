# Chapter M: 모바일 플랫폼 (Mobile Platform)

## 개요

Expo 기반 네이티브 모바일 앱의 화면 설계서입니다. 웹과 공유 코드를 사용하되, 네이티브 UI 컴포넌트로 렌더링합니다.

## 화면 목록

| ID | 화면명 | 경로 | 상태 | 기능 ID |
|:---|:---|:---|:---:|:---|
| [SCR-MOBL-01](./SCR-MOBL-01-home.md) | 홈 화면 | `/(tabs)/` | 구현됨 (80%) | M-03 |
| [SCR-MOBL-02](./SCR-MOBL-02-detail.md) | 상세 화면 | `/images/[id]` | 구현됨 (75%) | M-04 |

## 화면 흐름도

```
┌─────────────────┐
│  앱 진입        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  SCR-MOBL-01    │
│  홈 화면        │◄─────────────┐
│  (탭 네비게이션) │              │
└────────┬────────┘              │
         │                       │
         │ 이미지 탭             │ 뒤로가기
         ▼                       │
┌─────────────────┐              │
│  SCR-MOBL-02    │──────────────┘
│  상세 화면      │
└─────────────────┘
```

## 플랫폼 특성

| 항목 | 웹 (Next.js) | 모바일 (Expo) |
|:---|:---|:---|
| 레이아웃 | CSS Grid/Flexbox | FlatList/ScrollView |
| 네비게이션 | App Router | Expo Router |
| 이미지 | next/image | RN Image |
| 스크롤 | 브라우저 기본 | FlatList 가상화 |
| 상태 | Zustand + React Query | 동일 (공유 코드) |

## 주요 기능

### 무한 스크롤 (홈 화면)
- FlatList `onEndReached` 활용
- `onEndReachedThreshold={0.5}` (50% 지점에서 트리거)
- 한 번에 40개 이미지 로드

### 공유 코드 활용
- `@decoded/shared` 패키지 사용
- `useInfiniteFilteredImages` - 이미지 목록 훅
- `useImageById` - 단일 이미지 훅
- `useFilterStore` - 필터 상태

## 구현 현황

| 기능 | 상태 | 비고 |
|:---|:---:|:---|
| 2열 그리드 | ✅ | FlatList numColumns={2} |
| 무한 스크롤 | ✅ | onEndReached |
| 로딩 상태 | ✅ | ActivityIndicator |
| 빈 상태 | ✅ | ListEmptyComponent |
| 필터 UI | ❌ | 미구현 |
| 검색 UI | ❌ | 미구현 |
| 스팟 시스템 | ❌ | 미구현 |
| 구매 링크 | ❌ | 미구현 |

## 관련 기능 명세

- [M-03: 홈 화면](../spec.md#m-03-홈-화면-이미지-그리드)
- [M-04: 이미지 상세 화면](../spec.md#m-04-이미지-상세-화면)
