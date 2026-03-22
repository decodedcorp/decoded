# API Contracts - 화면-API 매핑

> 각 화면(Screen)에서 필요한 API 엔드포인트를 매핑합니다.

> **Implementation Reference**: 실제 API 상세 문서는 [docs/api/](../../docs/api/README.md) 참조

---

## 목차

1. [Discovery (발견)](#discovery-발견)
2. [Detail View (상세 보기)](#detail-view-상세-보기)
3. [User System (사용자)](#user-system-사용자)
4. [Creation AI (생성)](#creation-ai-생성)
5. [Admin (관리자)](#admin-관리자)

---

## Discovery (발견)

### SCR-DISC-01: 홈

| 기능 | API | 설명 |
|------|-----|------|
| Post 목록 로드 | `GET /api/v1/posts` | 최신 Post 목록 |
| 카테고리 필터 | `GET /api/v1/categories` | 필터 옵션 |
| 인기 검색어 | `GET /api/v1/search/popular` | 트렌딩 검색어 |

### SCR-DISC-02: 필터

| 기능 | API | 설명 |
|------|-----|------|
| Post 검색 | `GET /api/v1/search?q={query}` | 필터 적용 검색 |
| 카테고리 목록 | `GET /api/v1/categories` | 필터 옵션 |

### SCR-DISC-03: 검색

| 기능 | API | 설명 |
|------|-----|------|
| 통합 검색 | `GET /api/v1/search` | 검색 실행 |
| 최근 검색어 | `GET /api/v1/search/recent` | 로그인 시 |
| 인기 검색어 | `GET /api/v1/search/popular` | 추천 검색어 |
| 검색 기록 삭제 | `DELETE /api/v1/search/recent` | 개별/전체 삭제 |

### SCR-DISC-04: 갤러리

| 기능 | API | 설명 |
|------|-----|------|
| Post 목록 | `GET /api/v1/posts` | 정렬/필터 적용 |

---

## Detail View (상세 보기)

### SCR-VIEW-01: Post 상세

| 기능 | API | 설명 |
|------|-----|------|
| Post 조회 | `GET /api/v1/posts/{post_id}` | 상세 정보 |
| Spot 목록 | `GET /api/v1/posts/{post_id}/spots` | 이미지 내 마커 |
| 댓글 목록 | `GET /api/v1/posts/{post_id}/comments` | 댓글 표시 |
| 댓글 작성 | `POST /api/v1/posts/{post_id}/comments` | 새 댓글 |
| Post 삭제 | `DELETE /api/v1/posts/{post_id}` | 본인 Post만 |

### SCR-VIEW-02: Spot 상세

| 기능 | API | 설명 |
|------|-----|------|
| Spot 조회 | `GET /api/v1/spots/{spot_id}` | Spot 정보 |
| Solution 목록 | `GET /api/v1/spots/{spot_id}/solutions` | 상품 답변들 |
| Solution 등록 | `POST /api/v1/spots/{spot_id}/solutions` | 새 답변 |
| 메타데이터 추출 | `POST /api/v1/solutions/extract-metadata` | URL 분석 |

### SCR-VIEW-03: Solution 상세

| 기능 | API | 설명 |
|------|-----|------|
| Solution 조회 | `GET /api/v1/solutions/{solution_id}` | 상세 정보 |
| 투표 현황 | `GET /api/v1/solutions/{solution_id}/votes` | 투표 통계 |
| 투표하기 | `POST /api/v1/solutions/{solution_id}/votes` | Accurate/Different |
| 투표 취소 | `DELETE /api/v1/solutions/{solution_id}/votes` | 기존 투표 취소 |
| 채택하기 | `POST /api/v1/solutions/{solution_id}/adopt` | Spot 작성자만 |
| 클릭 기록 | `POST /api/v1/clicks` | 수익 집계용 |

---

## User System (사용자)

### SCR-USER-01: 로그인

| 기능 | API | 설명 |
|------|-----|------|
| 로그인 | Supabase Auth | OAuth/Email |

### SCR-USER-02: 프로필

| 기능 | API | 설명 |
|------|-----|------|
| 내 프로필 | `GET /api/v1/users/me` | 로그인 사용자 |
| 프로필 수정 | `PATCH /api/v1/users/me` | 닉네임, 아바타 등 |
| 타인 프로필 | `GET /api/v1/users/{user_id}` | 공개 정보 |
| 내 Post 목록 | `GET /api/v1/posts?user_id={me}` | 필터 적용 |

### SCR-USER-03: 활동 내역

| 기능 | API | 설명 |
|------|-----|------|
| 활동 목록 | `GET /api/v1/users/me/activities` | Post/Spot/Solution |
| 활동 통계 | `GET /api/v1/users/me/stats` | 요약 정보 |

### SCR-USER-04: 수익/정산

| 기능 | API | 설명 |
|------|-----|------|
| 수익 현황 | `GET /api/v1/earnings` | 총 수익, 잔액 |
| 클릭 통계 | `GET /api/v1/earnings/clicks` | 클릭 수 |
| 정산 내역 | `GET /api/v1/settlements` | 정산 기록 |

### SCR-USER-05: 설정

| 기능 | API | 설명 |
|------|-----|------|
| 프로필 수정 | `PATCH /api/v1/users/me` | 개인정보 변경 |

---

## Creation AI (생성)

### SCR-CREA-01: 업로드

| 기능 | API | 설명 |
|------|-----|------|
| 이미지 업로드 | `POST /api/v1/posts/upload` | Cloudflare Images |

### SCR-CREA-02: AI 감지

| 기능 | API | 설명 |
|------|-----|------|
| AI 분석 | `POST /api/v1/posts/analyze` | 아이템 감지 |
| 카테고리 목록 | `GET /api/v1/categories` | Spot 카테고리 선택 |

### SCR-CREA-03: 편집/등록

| 기능 | API | 설명 |
|------|-----|------|
| Post 생성 | `POST /api/v1/posts` | 최종 등록 |

---

## Admin (관리자)

### SCR-ADMN-01: 대시보드

| 기능 | API | 설명 |
|------|-----|------|
| KPI 조회 | `GET /api/v1/admin/dashboard/stats` | DAU, MAU 등 |
| 트래픽 분석 | `GET /api/v1/admin/dashboard/traffic` | 일별 통계 |

### SCR-ADMN-02: 콘텐츠 관리

| 기능 | API | 설명 |
|------|-----|------|
| Post 상태 변경 | `PATCH /api/v1/admin/posts/{id}/status` | 숨김/삭제 |
| Solution 상태 변경 | `PATCH /api/v1/admin/solutions/{id}/status` | 숨김/삭제 |
| 카테고리 관리 | `POST/PATCH /api/v1/admin/categories/*` | CRUD |
| 뱃지 관리 | `POST/PATCH/DELETE /api/v1/admin/badges/*` | CRUD |
| 동의어 관리 | `POST/PATCH/DELETE /api/v1/admin/synonyms/*` | CRUD |

### SCR-ADMN-03: 정산 관리

| 기능 | API | 설명 |
|------|-----|------|
| (추후 구현) | - | 정산 처리 API |

---

## 데이터 흐름 다이어그램

### Post 생성 플로우

```
[이미지 업로드] → POST /api/v1/posts/upload
       ↓
[AI 분석 (선택)] → POST /api/v1/posts/analyze
       ↓
[카테고리 선택] ← GET /api/v1/categories
       ↓
[Post 등록] → POST /api/v1/posts
       ↓
[완료] → GET /api/v1/posts/{id}
```

### Solution 등록 및 채택 플로우

```
[Spot 선택] → GET /api/v1/spots/{spot_id}/solutions
       ↓
[URL 입력] → POST /api/v1/solutions/extract-metadata
       ↓
[Solution 등록] → POST /api/v1/spots/{spot_id}/solutions
       ↓
[투표] → POST /api/v1/solutions/{id}/votes
       ↓
[채택 (Spot 작성자)] → POST /api/v1/solutions/{id}/adopt
```

---

## 관련 문서

- [API 문서 개요](../../docs/api/README.md)
- [공통 스키마](../../docs/api/schemas.md)
- [데이터 흐름](../../docs/database/03-data-flow.md)

---

## 변경 이력

- **2026-01-22**: API 경로 동기화 (`/api/v1/links/*` → `/api/v1/solutions/*`)
- **2025-01-15**: 초기 문서 생성
