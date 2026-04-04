# Decoded 코드베이스 종합 분석 보고서

> 분석일: 2026-04-04 | 대상: decoded-monorepo 전체

---

## 1. 프로젝트 개요

Decoded는 **AI 기반 이미지/아이템 발견 및 큐레이션 플랫폼**입니다. 사용자가 미디어 콘텐츠(K-POP, K-Drama 등) 속 아이템을 발견하고, AI가 자동으로 아이템을 탐지하며, 커뮤니티가 솔루션을 제안하고, 에디토리얼 매거진으로 큐레이션하는 구조입니다.

**핵심 가치 제안:** "미디어 속 아이템을 찾고, 입어보고, 공유하는" 엔드투엔드 경험

---

## 2. 아키텍처 & 기술 스택

### 모노레포 구조

```
decoded-monorepo/
├── packages/web          → Next.js 16 (프론트엔드 + BFF)
├── packages/shared       → 공유 타입, 훅, Supabase 쿼리
├── packages/mobile       → Expo 앱 (모바일)
├── packages/api-server   → Rust/Axum (백엔드 REST API)
├── packages/ai-server    → Python FastAPI + gRPC (AI 서버)
├── supabase/             → 마이그레이션, 스키마
└── docs/                 → 문서 (디자인 시스템, 에이전트 참조 등)
```

### 서비스 토폴로지

```
Browser/Mobile
  └→ Next.js 16 (BFF, /api/v1/* 프록시)
       ├→ Rust/Axum REST API
       │    ├→ Supabase (PostgreSQL + Auth + RLS)
       │    ├→ Cloudflare R2 (이미지 저장)
       │    ├→ Meilisearch (검색 엔진)
       │    └→ gRPC → Python AI Server
       │         ├→ OpenAI / Groq / Gemini / Perplexity
       │         ├→ Redis (캐시 + 작업 큐)
       │         └→ SearXNG (메타 검색)
       └→ @decoded/shared (공유 라이브러리)
```

### 주요 기술 스택

| 영역 | 기술 |
|------|------|
| **프론트엔드** | Next.js 16.2, React 19, TypeScript 5.9 |
| **상태 관리** | Zustand 5.0 (클라이언트), TanStack Query 5.90 (서버) |
| **스타일링** | Tailwind CSS 3.4, CVA (class-variance-authority) |
| **애니메이션** | GSAP 3.13, Motion 12.23, Three.js, Spline, Lenis |
| **백엔드** | Rust + Axum 0.8, SeaORM, Meilisearch, Cloudflare R2 |
| **AI 서버** | Python FastAPI, LangGraph, PyTorch, Transformers |
| **DB** | Supabase (PostgreSQL + Auth + RLS) |
| **빌드** | Bun 1.3 + Turborepo |
| **테스트** | Playwright 1.58, Vitest 4.1 |
| **API 코드젠** | Orval 8.5 (OpenAPI → React Query 훅 자동 생성) |

---

## 3. 프로덕트 기능 맵

### 사용자 여정

```
발견 (Home/Explore/Feed)
  → 탐색 (Post Detail: 이미지 + 스팟 + 아이템)
    → 상호작용 (좋아요, 저장, 댓글, 솔루션 제안)
      → 체험 (Virtual Try-On)
        → 큐레이션 (컬렉션, 매거진, Decoded Pick)
```

### 주요 기능 영역

**1. 홈 (/)** — 7개 섹션으로 구성된 메인 페이지
- HeroItemSync: 피처드 포스트 회전 히어로
- TrendingPostsSection: 인기 포스트 16개
- HelpFindSection: 아이템 미식별 포스트 (커뮤니티 참여 유도)
- EditorialMagazine: 매거진 스타일 카드 8개
- DecodedPickSection: 일일 큐레이션 픽 + 아이템 핫스팟
- MasonryGrid: 메이슨리 레이아웃 16개
- DomeGallerySection: 3D 돔 갤러리 20개

**2. 탐색 (/explore)** — Meilisearch 기반 검색 + 계층 필터
- 카테고리: K-POP, K-Drama, K-Movie, K-Variety, K-Fashion
- 컨텍스트: 공항, 무대, MV, 레드카펫, 화보, 일상 등
- 아티스트 패싯 + 정렬 (관련성, 최신, 인기, 솔루션 수)

**3. 포스트 상세 (/posts/[id])** — 핵심 콘텐츠 단위
- 라이트박스 + 히어로 이미지
- 스팟 (이미지 위 아이템 마커) + 솔루션 (아이템 링크)
- AI 요약, 관련 아이템, 쇼핑 그리드
- 댓글, 좋아요, 저장, 공유

**4. Virtual Try-On (VTON)** — AI 가상 착용
- 아이템 선택 → gRPC 요청 → 백그라운드 처리 → 결과 모달
- 페이지 이동 중에도 상태 유지 (Zustand persist)

**5. 프로필 (/profile)** — 사용자 대시보드
- 활동 내역, 뱃지, 착용 시도, 통계
- 랭킹, 스타일 DNA, 컬렉션

**6. 에디토리얼 & 매거진**
- AI 생성 에디토리얼 콘텐츠
- 개인 매거진 이슈 뷰어 + 디코딩 리추얼 애니메이션
- 일일 Decoded Pick 큐레이션

**7. 요청/업로드 (/request)**
- 이미지 업로드 → AI 탐지 → 스팟/아이템 결과

**8. 관리자 (/admin)** — 운영 대시보드
- AI 비용 추적, 감사 로그, 파이프라인 모니터링
- 콘텐츠 관리, 에디토리얼 후보, 픽 큐레이션
- 서버 로그 스트리밍 (SSE)

### 라우트 총 목록

| 라우트 | 유형 | 설명 |
|--------|------|------|
| `/` | 메인 | 홈 (7개 섹션) |
| `/explore` | 탐색 | 검색 + 필터 그리드 |
| `/feed` | 소셜 | 피드 타임라인 |
| `/search` | 검색 | 전체화면 오버레이 (전체/인물/미디어/아이템) |
| `/images` | 갤러리 | 이미지 디스커버리 (무한 스크롤) |
| `/posts/[id]` | 상세 | 포스트 디테일 |
| `/images/[id]` | 상세 | 이미지 풀페이지 |
| `/profile` | 프로필 | 마이 프로필 |
| `/profile/[userId]` | 프로필 | 타인 프로필 |
| `/login` | 인증 | OAuth (카카오, 구글, 애플) |
| `/request/upload` | 업로드 | 이미지 업로드 |
| `/request/detect` | AI | AI 탐지 결과 |
| `/editorial` | 콘텐츠 | 일일 에디토리얼 |
| `/magazine/personal` | 콘텐츠 | 개인 매거진 |
| `/admin/*` (9개) | 관리 | 대시보드, 비용, 로그, 콘텐츠 등 |
| `/lab/*` (8개) | 실험 | ASCII, 패션스캔, 네온, VTON 등 |

---

## 4. 브랜딩 & 디자인 시스템

### 디자인 시스템 v2.1.0 — 35개 컴포넌트

**타이포그래피 시스템:**
- Serif: **Playfair Display** (히어로, 헤딩, 브랜딩)
- Sans: **Inter** (본문, UI, 버튼)
- Monospace: **JetBrains Mono** (코드)
- 반응형 clamp 함수로 유동적 크기 조절

**컬러 시스템 (OKLCH 기반):**
- 메인 배경: `#1f1f1f` (다크)
- CTA 배경: `#242424`
- 메인 액센트: `#ff6767` (코랄/레드)
- 매거진 액센트: `#eafd67` (라임 그린)
- 시맨틱 컬러: primary, secondary, accent, destructive, muted
- 라이트/다크 모드 완전 지원 (next-themes, localStorage)

**컴포넌트 라이브러리 (35개):**
- Typography: Heading (hero/h1-h4), Text (body/small/caption)
- Cards: ProductCard, GridCard, FeedCardBase, ProfileHeaderCard, ArtistCard, SpotCard 등
- Navigation: DesktopHeader, MobileHeader, DesktopFooter, NavBar
- Actions: ActionButton, OAuthButton, GuestButton
- Feedback: Badge, Tag, Tabs, StepIndicator, LoadingSpinner, BottomSheet
- Interactive: Hotspot, SpotDetail, SpotMarker
- 모두 CVA (class-variance-authority) 패턴 사용

**애니메이션 & 이펙트:**
- Hologram scan, pulse, glow, shimmer
- Neon drift (정방향, 역방향, 느린 버전)
- Spot reveal, slide-up
- `prefers-reduced-motion` 존중

### 브랜딩 현황 분석

**강점:**
- 다크 테마 중심의 일관된 비주얼 아이덴티티
- OKLCH 기반 모던 컬러 시스템
- Playfair Display + Inter 조합의 에디토리얼 톤
- 풍부한 애니메이션 (GSAP, Motion, Three.js)

**개선 기회:**
- SEO 메타데이터 최소화 (`title: "Decoded App"`, `description: "Decoded application"`)
- Open Graph / Twitter Card 미설정
- 전용 랜딩/마케팅 페이지 부재
- 파비콘, 로고 등 브랜드 에셋이 public/ 폴더에 없음
- i18n 미구현 (한국어 필터링 유틸만 존재)
- HTML lang 속성이 "en"으로 설정 (한국어 콘텐츠 중심인데)

---

## 5. 상태 관리 & 데이터 흐름

### Zustand 스토어 (11개)

| 스토어 | 역할 |
|--------|------|
| `authStore` | OAuth 세션, 사용자 인증 |
| `requestStore` | 다단계 업로드 플로우 |
| `profileStore` | 사용자 프로필/선호 |
| `searchStore` | 검색 쿼리, 필터, 페이지네이션 |
| `filterStore` | 카테고리 필터 키 관리 |
| `vtonStore` | VTON 작업 상태 (네비게이션 간 유지) |
| `behaviorStore` | 행동 분석 이벤트 큐 (배치 전송) |
| `magazineStore` | 매거진/에디토리얼 상태 |
| `studioStore` | 스튜디오/콜라주 상태 |
| `collectionStore` | 컬렉션 상태 |
| `transitionStore` | 페이지 전환 애니메이션 |

### API 생성 파이프라인

```
Rust utoipa → openapi.json → Orval → React Query 훅 + Zod 스키마
```
- 자동 생성 코드는 gitignore
- 4개 multipart 엔드포인트는 수동 처리
- custom-instance.ts로 인증 헤더 주입

---

## 6. 데이터베이스 스키마 (Supabase)

### 주요 테이블 (마이그레이션 기반)

- **user_events**: 행동 분석 (post_click, dwell_time, scroll_depth 등), 30일 TTL
- **decoded_picks**: 일일 큐레이션 픽 (pick_date 유니크, is_active 인덱스)
- **profiles**: 사용자 프로필 + 대시보드
- public 스키마 (앱 데이터) + warehouse 스키마 (ETL/Seed 파이프라인)

### RLS 정책

- 사용자 이벤트: 본인만 읽기/쓰기, service role 전체 접근
- Decoded Picks: 공개 읽기 (활성 픽), 인증된 사용자 전체 접근

---

## 7. 마케팅 관점 종합 평가

### 현재 상태 요약

| 항목 | 상태 | 평가 |
|------|------|------|
| 프로덕트 완성도 | 고급 | 홈, 탐색, 상세, VTON, 프로필, 관리자 모두 구현 |
| 디자인 시스템 | v2.1 | 35개 컴포넌트, OKLCH 컬러, 반응형 |
| 브랜드 아이덴티티 | 중간 | 다크 테마 + 코랄 액센트 일관성 있으나 에셋 미비 |
| SEO | 미흡 | 기본 메타 태그만 존재, OG/Twitter 미설정 |
| 랜딩 페이지 | 없음 | 전용 마케팅/온보딩 페이지 부재 |
| 국제화 | 미흡 | 한국어 필터만 존재, i18n 프레임워크 없음 |
| 소셜 기능 | 양호 | 좋아요, 저장, 댓글, 랭킹, 뱃지 |
| AI 차별화 | 강점 | VTON, 아이템 탐지, 에디토리얼 AI 생성 |
| 분석/행동 추적 | 양호 | 이벤트 배치, dwell time, scroll depth |

### 브랜딩/마케팅 개선 우선순위 제안

1. **SEO & 메타데이터 강화** — OG 이미지, 구조화된 메타 태그, 동적 페이지별 메타
2. **브랜드 에셋 정비** — 로고, 파비콘, 소셜 공유 이미지
3. **랜딩/온보딩 페이지** — 가치 제안이 명확한 마케팅 페이지
4. **HTML lang 수정** — "en" → "ko" (또는 다국어 지원)
5. **App Store 최적화** — 모바일 앱 (Expo) 마케팅 자산

---

## 8. 기술 건강도

### 강점
- 타입 안전성 (TypeScript strict, Zod, OpenAPI 코드젠)
- 서비스 분리 (Next.js BFF + Rust API + Python AI)
- 모던 스택 (React 19, Next.js 16, Axum 0.8)
- 자동화 (Orval 코드젠, Turborepo 캐시, Just 태스크)
- 풍부한 문서화 (docs/agent/, .planning/codebase/)

### 주의점
- 31,660 TS/TSX 파일 (node_modules 포함) — 실제 소스 규모 확인 필요
- 실험적 라우트 (/lab) 8개 — 정리 필요 여부 검토
- 모바일 앱 (Expo) 현재 개발 상태 불명
- 테스트 커버리지 확인 필요

---

*이 보고서는 코드베이스 정적 분석 기반으로 작성되었습니다. 런타임 동작이나 실제 배포 상태는 별도 확인이 필요합니다.*
