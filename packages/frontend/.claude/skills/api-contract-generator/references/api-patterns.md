# API 패턴 참조

> api-contract-generator 스킬에서 참조하는 API 설계 패턴입니다.

## 참조 경로

| 문서 | 경로 | 설명 |
|------|------|------|
| 화면-API 매핑 | `specs/shared/api-contracts.md` | 전체 API 계약 |
| Discovery API | `specs/discovery/api-endpoints.md` | 발견 기능 API |
| Detail View API | `specs/detail-view/api-endpoints.md` | 상세 보기 API |

## URL 구조 패턴

### 기본 경로

```
/api/v1/{resource}
```

### 계층 구조

```
/api/v1/posts                     # 컬렉션
/api/v1/posts/{post_id}           # 단일 리소스
/api/v1/posts/{post_id}/comments  # 하위 리소스
/api/v1/posts/{post_id}/spots     # 관련 리소스
```

### 특수 경로

```
/api/v1/users/me                  # 현재 사용자
/api/v1/search                    # 검색
/api/v1/search/popular            # 인기 검색어
```

## HTTP 메서드 패턴

| 메서드 | 용도 | 멱등성 | 예시 |
|--------|------|:------:|------|
| GET | 조회 | ✅ | 리소스/컬렉션 조회 |
| POST | 생성 | ❌ | 새 리소스 생성 |
| PATCH | 부분 수정 | ✅ | 일부 필드 업데이트 |
| DELETE | 삭제 | ✅ | 리소스 삭제 |
| PUT | 전체 교체 | ✅ | (사용 자제) |

## 요청 패턴

### Query Parameters

```typescript
// 페이지네이션
interface PaginationParams {
  cursor?: string;    // 커서 (이전 응답에서 받은 값)
  limit?: number;     // 페이지 크기 (기본: 20, 최대: 100)
}

// 필터링
interface FilterParams {
  category?: string;
  status?: string;
  castId?: string;
  mediaId?: string;
}

// 정렬
interface SortParams {
  sort?: string;      // 정렬 필드
  order?: 'asc' | 'desc';
}

// 검색
interface SearchParams {
  q?: string;         // 검색어
}
```

### Request Body

```typescript
// 생성 요청
interface CreateRequest {
  // 필수 필드만 포함
  requiredField: string;
  optionalField?: string;
}

// 수정 요청 (모두 optional)
interface UpdateRequest {
  requiredField?: string;
  optionalField?: string;
}
```

## 응답 패턴

### 단일 리소스

```typescript
interface SingleResponse<T> {
  data: T;
}
```

### 컬렉션 (페이지네이션)

```typescript
interface ListResponse<T> {
  data: T[];
  pagination: {
    cursor: string | null;  // 다음 페이지 커서 (없으면 null)
    hasMore: boolean;       // 다음 페이지 존재 여부
    total?: number;         // 전체 개수 (비용이 높아 선택적)
  };
}
```

### 생성 응답

```typescript
// 201 Created
interface CreateResponse {
  data: {
    id: string;
    // ... 생성된 리소스 전체
  };
}
```

### 빈 응답

```typescript
// 204 No Content (DELETE 성공 시)
// body 없음
```

## 에러 패턴

### 에러 응답 구조

```typescript
interface ErrorResponse {
  error: {
    code: string;           // 에러 코드 (예: "VALIDATION_ERROR")
    message: string;        // 사용자 표시용 메시지
    details?: {             // 상세 정보 (개발용)
      field?: string;       // 문제가 된 필드
      reason?: string;      // 상세 원인
      [key: string]: unknown;
    };
  };
}
```

### 표준 에러 코드

| 코드 | HTTP | 상황 |
|------|:---:|------|
| VALIDATION_ERROR | 400 | 입력값 검증 실패 |
| INVALID_JSON | 400 | JSON 파싱 실패 |
| UNAUTHORIZED | 401 | 인증 필요 |
| TOKEN_EXPIRED | 401 | 토큰 만료 |
| FORBIDDEN | 403 | 권한 없음 |
| NOT_FOUND | 404 | 리소스 없음 |
| CONFLICT | 409 | 중복 또는 충돌 |
| RATE_LIMITED | 429 | 요청 한도 초과 |
| INTERNAL_ERROR | 500 | 서버 내부 오류 |

## 인증 패턴

### Bearer Token

```
Authorization: Bearer {supabase_access_token}
```

### 인증 요구사항

| 엔드포인트 | 인증 | 비고 |
|------------|:----:|------|
| GET /posts | Optional | 비로그인도 조회 가능 |
| POST /posts | Required | 로그인 필수 |
| PATCH /posts/{id} | Required | 본인 리소스만 |
| DELETE /posts/{id} | Required | 본인 리소스만 |

## 버전 관리

### URL 버저닝

```
/api/v1/posts    # v1
/api/v2/posts    # v2 (미래)
```

### 버전 정책

- Major 변경 시 새 버전 생성
- Minor 변경은 하위 호환 유지
- 구버전 최소 6개월 유지

## 화면별 API 매핑 예시

### Discovery

| 화면 | 기능 | Method | Path |
|------|------|--------|------|
| SCR-DISC-01 | 홈 목록 | GET | /posts |
| SCR-DISC-02 | 필터 적용 | GET | /posts?category=X |
| SCR-DISC-03 | 검색 | GET | /search?q=X |

### Detail View

| 화면 | 기능 | Method | Path |
|------|------|--------|------|
| SCR-VIEW-01 | Post 상세 | GET | /posts/{id} |
| SCR-VIEW-02 | Spot 상세 | GET | /spots/{id} |
| SCR-VIEW-03 | 투표 | POST | /solutions/{id}/votes |
