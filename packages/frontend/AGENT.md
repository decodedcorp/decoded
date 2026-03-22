# decoded-app AI Agent Guide

> **Last Updated**: 2026-02-06
> **Purpose**: AI 에이전트가 decoded-app 프로젝트에서 효과적으로 작업하기 위한 종합 가이드

---

## 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [기술 스택](#기술-스택)
3. [프로젝트 구조](#프로젝트-구조)
4. [아키텍처 패턴](#아키텍처-패턴)
5. [코딩 컨벤션](#코딩-컨벤션)
6. [디자인 시스템](#디자인-시스템)
7. [데이터 흐름](#데이터-흐름)
8. [주요 작업 패턴](#주요-작업-패턴)
9. [문서 참조](#문서-참조)
10. [개발 워크플로우](#개발-워크플로우)

---

## 프로젝트 개요

**decoded-app**은 K-콘텐츠 패션 발견 플랫폼으로, 이미지/아이템 발견과 큐레이션을 위한 현대적인 웹 애플리케이션입니다.

### 핵심 기능
- 🖼️ **이미지 디스커버리**: 무한 스크롤, 필터링, 상세 뷰
- 🤖 **AI 기반 아이템 감지**: 이미지 업로드 → AI 분석 → 아이템 스팟팅
- 📱 **소셜 피드**: 타임라인 기반 콘텐츠 큐레이션
- 🔍 **전체 화면 검색**: 멀티탭 결과, 반응형 그리드
- 👤 **사용자 프로필**: 활동, 배지, 통계, 랭킹
- 🎨 **v2.0 디자인 시스템**: 통합 디자인 토큰 및 컴포넌트

### 주요 특징
- Next.js 16 App Router (SSR/SSG)
- Supabase 백엔드 (PostgreSQL + Auth + Storage)
- GSAP/Motion 기반 스크롤 애니메이션
- Zustand + React Query 상태 관리
- Tailwind CSS + CVA 디자인 시스템

---

## 기술 스택

### 프론트엔드 코어
```typescript
// Framework & UI
Next.js 16.0.7         // App Router, SSR, API Routes
React 18.3.1           // UI 라이브러리
TypeScript 5.9.3       // 타입 안정성 (strict mode)

// 스타일링
Tailwind CSS 3.4.18    // 유틸리티 CSS
CVA 0.7.1              // 컴포넌트 variant 시스템
tailwind-merge 3.4.0   // 클래스 충돌 해결

// 상태 관리
Zustand 4.5.7          // 클라이언트 상태
React Query 5.90.11    // 서버 상태 + 캐싱
```

### 애니메이션 & 인터랙션
```typescript
GSAP 3.13.0            // 복잡한 애니메이션
Motion 12.23.12        // 선언적 애니메이션
Lenis 1.3.15           // 부드러운 스크롤
@use-gesture/react 10.3.1  // 제스처 핸들링
```

### 백엔드 & 데이터
```typescript
Supabase 2.86.0        // PostgreSQL + Auth + Storage
@supabase/auth-helpers-nextjs 0.15.0  // SSR Auth
```

### UI 라이브러리
```typescript
Lucide React 0.555.0   // 아이콘
React Icons 5.5.0      // 추가 아이콘
Radix UI               // Headless UI 컴포넌트
Sonner 2.0.7           // Toast 알림
```

### 개발 도구
```typescript
ESLint 9.39.1          // Flat config
Prettier 3.6.2         // 코드 포맷팅
Yarn 4.9.2             // 패키지 매니저 (node-modules linker)
```

---

## 프로젝트 구조

### 디렉토리 레이아웃

```
decoded-app/
├── packages/
│   ├── web/                          # Next.js 웹 앱
│   │   ├── app/                      # App Router 페이지
│   │   │   ├── layout.tsx            # 루트 레이아웃
│   │   │   ├── page.tsx              # 홈 페이지
│   │   │   ├── @modal/               # 병렬 라우트 (모달)
│   │   │   ├── api/v1/               # API 라우트 (프록시)
│   │   │   ├── explore/              # 탐색 그리드
│   │   │   ├── feed/                 # 소셜 피드
│   │   │   ├── images/               # 이미지 발견 & 상세
│   │   │   ├── posts/                # 포스트 상세
│   │   │   ├── profile/              # 사용자 프로필
│   │   │   ├── request/              # 업로드 & AI 감지
│   │   │   ├── search/               # 전체 화면 검색
│   │   │   └── login/                # OAuth 인증
│   │   │
│   │   ├── lib/                      # 재사용 가능한 코드
│   │   │   ├── components/           # React 컴포넌트
│   │   │   │   ├── design-system/    # v2.0 디자인 시스템
│   │   │   │   ├── ui/               # 기본 UI 컴포넌트
│   │   │   │   ├── main/             # 홈 페이지 섹션
│   │   │   │   ├── search/           # 검색 오버레이 & 결과
│   │   │   │   ├── detail/           # 이미지/포스트 상세 뷰
│   │   │   │   ├── request/          # 업로드 플로우
│   │   │   │   ├── explore/          # 탐색 그리드
│   │   │   │   ├── feed/             # 피드 컴포넌트
│   │   │   │   ├── profile/          # 프로필 섹션
│   │   │   │   └── auth/             # 인증 컴포넌트
│   │   │   │
│   │   │   ├── hooks/                # 커스텀 React 훅
│   │   │   ├── stores/               # Zustand 스토어
│   │   │   ├── supabase/             # Supabase 클라이언트 + 쿼리
│   │   │   │   ├── client.ts         # 브라우저 클라이언트
│   │   │   │   ├── server.ts         # 서버 클라이언트
│   │   │   │   ├── types.ts          # DB 타입 (자동 생성)
│   │   │   │   └── queries/          # 쿼리 레이어
│   │   │   │
│   │   │   ├── api/                  # REST API 클라이언트
│   │   │   ├── utils/                # 유틸리티 함수
│   │   │   └── react-query/          # React Query 설정
│   │   │
│   │   ├── __tests__/                # 테스트 파일
│   │   ├── tsconfig.json             # TypeScript 설정
│   │   ├── eslint.config.mjs         # ESLint 설정
│   │   └── tailwind.config.ts        # Tailwind 설정
│   │
│   ├── shared/                       # 공유 코드 (web + mobile)
│   │   ├── hooks/                    # 공유 훅
│   │   ├── stores/                   # 공유 스토어
│   │   ├── supabase/queries/         # 공유 쿼리
│   │   ├── types/                    # 공유 타입
│   │   └── data/                     # 목 데이터
│   │
│   └── mobile/                       # Expo 모바일 앱 (초기)
│
├── docs/                             # 문서
│   ├── architecture/                 # 아키텍처 문서
│   ├── database/                     # DB 스키마
│   ├── design-system/                # 디자인 시스템
│   ├── api/                          # API 문서
│   ├── adr/                          # Architecture Decision Records
│   └── ai-playbook/                  # AI 도구 가이드
│
├── specs/                            # 기능 명세
├── .planning/                        # GSD 워크플로우 아티팩트
│   └── codebase/                     # 코드베이스 분석 (AI 생성)
│
├── CLAUDE.md                         # 개발 가이드라인
└── AGENT.md                          # 이 파일
```

### 주요 파일 위치

| 영역 | 위치 | 설명 |
|------|------|------|
| **인증** | `lib/stores/authStore.ts` | OAuth (Kakao, Google, Apple) + 세션 |
| **검색 상태** | `lib/stores/searchStore.ts` | 검색 쿼리, 필터, 결과 |
| **API 클라이언트** | `lib/api/` | 백엔드 API 호출 |
| **API 라우트** | `app/api/v1/` | Next.js API 프록시 |
| **Supabase** | `lib/supabase/queries/` | DB 쿼리 (서버/클라이언트) |
| **디자인 시스템** | `lib/design-system/` | v2.0 컴포넌트 & 토큰 |
| **컴포넌트** | `lib/components/` | 기능별 컴포넌트 |
| **훅** | `lib/hooks/` | 커스텀 훅 |
| **스토어** | `lib/stores/` | Zustand 스토어 |

---

## 아키텍처 패턴

### 레이어드 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│  UI/Presentation Layer (lib/components/)                │
│  - React 컴포넌트                                        │
│  - GSAP/Motion 애니메이션                                │
│  - 디자인 시스템 컴포넌트                                 │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  State Management Layer (lib/stores/, React Query)      │
│  - Zustand: 클라이언트 상태 (auth, filter, request)     │
│  - React Query: 서버 상태 + 캐싱                         │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Data Fetching/API Layer (lib/api/, app/api/v1/)       │
│  - REST API 클라이언트 함수                              │
│  - Next.js API 프록시 라우트                             │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Database/Query Layer (lib/supabase/queries/)           │
│  - Supabase 직접 쿼리                                    │
│  - RLS 정책 적용                                         │
│  - 타입 안전 쿼리                                        │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Infrastructure Layer (lib/supabase/, lib/react-query/) │
│  - Supabase 클라이언트                                   │
│  - React Query 클라이언트                                │
│  - 환경 변수 설정                                        │
└─────────────────────────────────────────────────────────┘
```

### 컴포넌트 계층 구조

```
Level 1: Design System (lib/design-system/)
  ↓ 디자인 토큰, 기본 컴포넌트
Level 2: Base UI (lib/components/ui/)
  ↓ 기능 독립적 재사용 컴포넌트
Level 3: Feature Components (lib/components/[feature]/)
  ↓ 페이지별 구현
Pages (app/)
```

### 쿼리 레이어 패턴

**중요**: Supabase 직접 액세스는 `lib/supabase/queries/`에만 존재합니다.

```typescript
// ✅ 올바른 패턴
// lib/supabase/queries/posts.ts
export async function fetchPostById(postId: string): Promise<PostDetail | null> {
  const { data, error } = await supabaseBrowserClient
    .from("post")
    .select("*")
    .eq("id", postId)
    .single();
  
  if (error || !data) {
    console.error("[fetchPostById] Error:", error);
    return null;
  }
  
  return data;
}

// lib/hooks/usePosts.ts
export function usePost(postId: string) {
  return useQuery({
    queryKey: ["posts", postId],
    queryFn: () => fetchPostById(postId),
  });
}
```

---

## 코딩 컨벤션

### 네이밍 컨벤션

| 타입 | 패턴 | 예시 | 위치 |
|------|------|------|------|
| **React 컴포넌트** | PascalCase | `FeedCard.tsx` | `lib/components/` |
| **훅** | camelCase + `use` 접두사 | `usePosts.ts` | `lib/hooks/` |
| **스토어** | camelCase + `Store` 접미사 | `authStore.ts` | `lib/stores/` |
| **유틸리티** | camelCase | `validation.ts` | `lib/utils/` |
| **쿼리** | camelCase + `.server.ts` (SSR) | `posts.server.ts` | `lib/supabase/queries/` |
| **페이지 라우트** | lowercase/kebab-case | `page.tsx` | `app/feed/` |

### 컴포넌트 패턴

```typescript
"use client";

import { memo, useState } from "react";

interface FeedCardProps {
  item: FeedCardItem;
  index: number;
  priority?: boolean;
}

/**
 * FeedCard - Instagram 스타일 전체 너비 카드
 */
export const FeedCard = memo(
  ({ item, index: _index, priority = false }: FeedCardProps) => {
    const [imageError, setImageError] = useState(false);

    return (
      <article className="relative w-full overflow-hidden rounded-xl">
        {/* 컴포넌트 JSX */}
      </article>
    );
  }
);

FeedCard.displayName = "FeedCard";
```

### 에러 핸들링 패턴

```typescript
export async function fetchPostById(postId: string): Promise<PostDetail | null> {
  const { data, error } = await supabaseBrowserClient
    .from("post")
    .select("*")
    .eq("id", postId)
    .single();

  if (error || !data) {
    if (process.env.NODE_ENV === "development") {
      console.error("[fetchPostById] Error:", error);
    }
    return null;  // 우아한 폴백
  }

  return data;
}
```

---

## 디자인 시스템

### v2.0 디자인 시스템 Import

```typescript
import {
  // Typography
  Heading, Text,
  // Inputs
  Input, SearchInput,
  // Cards
  Card, CardHeader, CardContent, CardFooter, CardSkeleton,
  ProductCard, GridCard, FeedCardBase, ProfileHeaderCard,
  // Headers & Footer
  DesktopHeader, MobileHeader, DesktopFooter,
  // Tokens
  typography, colors, spacing, shadows, borderRadius, zIndex
} from "@/lib/design-system"
```

### 디자인 토큰

```typescript
import { typography, spacing, colors } from "@/lib/design-system/tokens"

// Typography
typography.sizes.h1          // h1용 폰트 크기
responsiveTypography.pageTitle  // 반응형 타이틀 크기

// Spacing (4px 기본 단위)
spacing[4]  // 16px
spacing[8]  // 32px

// Colors (CSS 변수 참조)
colors.primary
colors.muted
```

### 컴포넌트 사용 가이드

| 컴포넌트 | 사용 사례 | 예시 |
|-----------|----------|------|
| **Heading** | 페이지/섹션 제목 | `<Heading variant="h2">Title</Heading>` |
| **Text** | 본문 텍스트, 캡션 | `<Text variant="small">Description</Text>` |
| **Card** | 일반 컨테이너 | `<Card variant="elevated" size="md">...</Card>` |
| **ProductCard** | 제품 표시 | `<ProductCard image={url} title="..." price="$99"/>` |
| **Input** | 폼 입력 | `<Input variant="search" leftIcon={<Search/>}/>` |

---

## 데이터 흐름

### 인증 플로우

```
1. App Boot → AppProviders
2. AuthProvider → useAuthStore.initialize()
3. Session Check → supabaseBrowserClient.auth.getSession()
4. Subscription → onAuthStateChange 이벤트 구독
5. OAuth Login → SIGNED_IN 이벤트 → setUser()
6. Redirect → 홈으로 리다이렉트
```

### 이미지 디스커버리 플로우

```
1. Page Load → SearchPageClient 마운트
2. useInfiniteFilteredImages 훅 호출
3. React Query → fetchUnifiedImages() 실행
4. Supabase Fetch → images + posts 테이블 쿼리
5. Cache → React Query 캐시 (staleTime=60s)
6. User Scroll → IntersectionObserver → fetchNextPage()
7. Page Load → 다음 커서 페칭, 결과 병합
```

---

## 주요 작업 패턴

### 1. 새 페이지 추가

```typescript
// app/my-feature/page.tsx
import { MyFeatureClient } from "@/lib/components/my-feature/MyFeatureClient";

export default function MyFeaturePage() {
  return <MyFeatureClient />;
}

// lib/components/my-feature/MyFeatureClient.tsx
"use client";

import { useMyFeatureData } from "@/lib/hooks/useMyFeatureData";

export function MyFeatureClient() {
  const { data, isLoading } = useMyFeatureData();
  
  if (isLoading) return <MyFeatureSkeleton />;
  
  return <div>{/* 컴포넌트 내용 */}</div>;
}
```

### 2. 새 API 엔드포인트 추가

```typescript
// lib/api/my-feature.ts
import { apiClient } from "./client";

export async function fetchMyFeature(params: MyFeatureParams): Promise<MyFeatureResponse> {
  const response = await apiClient.get("/my-feature", { params });
  return response.data;
}

// lib/hooks/useMyFeatureData.ts
import { useQuery } from "@tanstack/react-query";

export function useMyFeatureData(params: MyFeatureParams) {
  return useQuery({
    queryKey: ["my-feature", params],
    queryFn: () => fetchMyFeature(params),
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
  });
}
```

### 3. 새 Zustand 스토어 추가

```typescript
// lib/stores/myFeatureStore.ts
import { create } from "zustand";

interface MyFeatureState {
  selectedItem: MyFeatureItem | null;
  isModalOpen: boolean;
  
  selectItem: (item: MyFeatureItem) => void;
  openModal: () => void;
  closeModal: () => void;
}

export const useMyFeatureStore = create<MyFeatureState>((set) => ({
  selectedItem: null,
  isModalOpen: false,
  
  selectItem: (item) => set({ selectedItem: item }),
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false, selectedItem: null }),
}));
```

---

## 문서 참조

### 필수 문서

| 문서 | 위치 | 내용 |
|------|------|------|
| **개발 가이드라인** | `CLAUDE.md` | 프로젝트 개요, 기술 스택, 명령어 |
| **코딩 컨벤션** | `.planning/codebase/CONVENTIONS.md` | 네이밍, 패턴, 스타일 가이드 |
| **아키텍처** | `.planning/codebase/ARCHITECTURE.md` | 시스템 아키텍처, 레이어, 데이터 흐름 |
| **기술 스택** | `.planning/codebase/STACK.md` | 의존성, 버전, 설정 |
| **디자인 시스템** | `docs/design-system/README.md` | 디자인 토큰, 컴포넌트 가이드 |

---

## 개발 워크플로우

### 명령어

```bash
# 개발 서버
yarn dev              # 개발 서버 시작

# 빌드
yarn build            # 프로덕션 빌드
yarn start            # 프로덕션 서버 시작

# 코드 품질
yarn lint             # ESLint 실행
yarn format           # Prettier 포맷팅
yarn format:check     # Prettier 체크
```

### Git 워크플로우

```bash
# Conventional Commits 형식
feat(auth): add oauth login support
fix(feed): correct infinite scroll pagination
docs(api): update endpoint documentation
refactor(store): simplify filter store logic
```

---

## 중요 사항

### ⚠️ 반드시 지켜야 할 규칙

1. **Yarn 사용**: npm이 아닌 `yarn` 명령어 사용
2. **TypeScript Strict Mode**: 모든 코드에서 타입 안전성 유지
3. **쿼리 레이어 격리**: Supabase 직접 액세스는 `lib/supabase/queries/`에만
4. **에러 핸들링**: 모든 비동기 작업에 try-catch 및 우아한 폴백
5. **디자인 시스템 우선**: 새 UI 컴포넌트 전에 디자인 시스템 확인
6. **React.memo 사용**: 성능 최적화를 위해 컴포넌트 메모이제이션
7. **displayName 설정**: 메모이제이션된 컴포넌트에 displayName 설정

### 🚫 피해야 할 패턴

1. ❌ 컴포넌트에서 직접 Supabase 호출
2. ❌ 인라인 스타일 사용 (Tailwind 사용)
3. ❌ PropTypes 사용 (TypeScript 사용)
4. ❌ 에러 무시 (항상 핸들링)
5. ❌ 하드코딩된 값 (상수 또는 환경 변수 사용)

### ✅ 권장 패턴

1. ✅ 기능별 컴포넌트 구조
2. ✅ 커스텀 훅으로 로직 추상화
3. ✅ React Query로 서버 상태 관리
4. ✅ Zustand로 클라이언트 상태 관리
5. ✅ CVA로 컴포넌트 variant 관리
6. ✅ 타입 안전 쿼리 함수
7. ✅ 스켈레톤 로딩 상태
8. ✅ 에러 바운더리 및 폴백 UI

---

**마지막 업데이트**: 2026-02-06

이 문서는 AI 에이전트가 decoded-app 프로젝트에서 효과적으로 작업할 수 있도록 작성되었습니다.
