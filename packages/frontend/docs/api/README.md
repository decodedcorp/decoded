# DECODED API 문서

> **버전**: 1.0.0
> **최종 업데이트**: 2026-01-23
> **정보 출처**: `docs/database/open_api.json` (OpenAPI 3.1.0)

> **Design Reference**: Screen-to-API 매핑은 [specs/shared/api-contracts.md](../../specs/shared/api-contracts.md) 참조
>
> **현재 구현 상태**: 아래 테이블에서 ✅ 표시된 API만 실제 구현됨

## 개요

DECODED는 AI 기반 미디어 디스커버리 플랫폼으로, K-POP 아이돌과 셀럽의 패션 아이템을 발견하고 공유하는 서비스입니다.

이 문서는 DECODED 백엔드 API의 엔드포인트, 요청/응답 형식, 인증 방식을 설명합니다.

---

## 서버 정보

| 환경 | URL | 설명 |
|------|-----|------|
| Development | `http://localhost:8000` | 로컬 개발 서버 |
| Production | `https://api.decoded.co` | 프로덕션 서버 |

---

## 인증

### Bearer Token 인증

대부분의 쓰기 작업(POST, PATCH, DELETE)과 일부 읽기 작업은 인증이 필요합니다.

```http
Authorization: Bearer <access_token>
```

#### 인증 토큰 획득

Supabase Auth를 통해 로그인 후 발급받은 JWT 토큰을 사용합니다.

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// 로그인
const { data: { session } } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// API 요청 시 토큰 사용
const response = await fetch('https://api.decoded.co/api/v1/users/me', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
})
```

### 인증 에러 코드

| HTTP 코드 | 설명 |
|-----------|------|
| `401 Unauthorized` | 토큰이 없거나 만료됨 |
| `403 Forbidden` | 권한 부족 (예: Admin 전용 API) |

---

## API 버전

현재 API 버전: **v1**

모든 엔드포인트는 `/api/v1/` 접두사를 사용합니다.

---

## 공통 응답 형식

### 페이지네이션 응답

목록 조회 API는 다음 형식의 페이지네이션 응답을 반환합니다:

```json
{
  "data": [...],
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total_items": 150,
    "total_pages": 8
  }
}
```

#### 페이지네이션 파라미터

| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| `page` | integer | 1 | 페이지 번호 |
| `per_page` | integer | 20 | 페이지당 아이템 수 |

### 에러 응답

에러 발생 시 다음 형식으로 응답합니다:

```json
{
  "error": {
    "code": 400,
    "message": "잘못된 요청입니다"
  }
}
```

---

## API 도메인

| 도메인 | 문서 | 설명 | 구현 |
|--------|------|------|:---:|
| [Posts](./posts.md) | posts.md | Post(이미지 게시물) 관리 | ✅ |
| [Categories](./categories.md) | categories.md | 카테고리 관리 | ✅ |
| [Spots](./spots.md) | spots.md | Spot(아이템 위치 표시) 관리 | 📋 |
| [Solutions](./solutions.md) | solutions.md | Solution(상품 정보 답변) 관리 | 📋 |
| [Votes](./votes.md) | votes.md | 투표 및 채택 시스템 | 📋 |
| [Comments](./comments.md) | comments.md | 댓글 시스템 | 📋 |
| [Search](./search.md) | search.md | 통합 검색 기능 | 📋 |
| [Users](./users.md) | users.md | 사용자 프로필 및 활동 | 📋 |
| [Rankings](./rankings.md) | rankings.md | 랭킹 시스템 | 📋 |
| [Badges](./badges.md) | badges.md | 뱃지/업적 시스템 | 📋 |
| [Earnings](./earnings.md) | earnings.md | 수익 및 정산 | 📋 |
| [Admin](./admin.md) | admin.md | 관리자 기능 | 📋 |

> ✅ = 구현됨 (`packages/web/app/api/v1/`), 📋 = 설계 단계

### 실제 API 라우트 (Next.js)

```
packages/web/app/api/v1/
├── categories/
│   └── route.ts          # GET /api/v1/categories
└── posts/
    ├── route.ts          # GET, POST /api/v1/posts
    ├── upload/route.ts   # POST /api/v1/posts/upload
    └── analyze/route.ts  # POST /api/v1/posts/analyze
```

---

## 빠른 참조

### 핵심 엔드포인트

#### Post 관련
```
GET  /api/v1/posts              # Post 목록 조회
POST /api/v1/posts              # Post 생성 (인증 필요)
GET  /api/v1/posts/{post_id}    # Post 상세 조회
```

#### Spot 관련
```
GET  /api/v1/posts/{post_id}/spots           # Spot 목록 조회
POST /api/v1/posts/{post_id}/spots           # Spot 추가 (인증 필요)
```

#### Solution 관련
```
GET  /api/v1/spots/{spot_id}/solutions       # Solution 목록 조회
POST /api/v1/spots/{spot_id}/solutions       # Solution 등록 (인증 필요)
```

#### 검색
```
GET  /api/v1/search?q={query}   # 통합 검색
```

#### 사용자
```
GET  /api/v1/users/me           # 내 프로필 조회 (인증 필요)
GET  /api/v1/users/{user_id}    # 공개 프로필 조회
```

---

## 공통 스키마

자주 사용되는 스키마는 [schemas.md](./schemas.md)를 참조하세요.

### 주요 타입

- `uuid`: UUID v4 형식의 고유 식별자
- `datetime`: ISO 8601 형식의 날짜시간 (`2025-01-15T12:00:00Z`)
- `url`: 유효한 URL 문자열

---

## 관련 문서

- [데이터베이스 스키마 가이드](../database/01-schema-usage.md)
- [데이터 흐름](../database/03-data-flow.md)
- [아키텍처 개요](../architecture/README.md)

---

## 변경 이력

- **2025-01-15**: OpenAPI 3.1.0 스펙 기반 초기 문서 생성
