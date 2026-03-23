---
name: api-contract
description: >-
  Feature spec에서 OpenAPI 스타일 API 문서 생성.
  엔드포인트 정의, Request/Response 타입, 화면-API 매핑 테이블 포함.
  "API contract", "OpenAPI", "endpoint spec", "API 문서 생성" 요청 시 적용.
---

# API Contract Generator

## 개요

Feature spec과 화면 명세를 분석하여 API 계약 문서를 자동 생성합니다.
`specs/shared/api-contracts.md` 형식을 준수합니다.

## 생성 프로세스

### Step 1: 데이터 요구사항 추출

```
[spec.md] → User Stories 분석
[SCR-XXX-##] → 화면별 API 호출 식별
[data-models.md] → 타입 참조
```

### Step 2: 엔드포인트 도출

각 화면 명세에서:
1. "데이터 요구사항" 섹션 추출
2. CRUD 작업 식별
3. 필터/검색/페이지네이션 요구사항 파악

## API 문서 구조

### 엔드포인트 정의

```markdown
## {리소스} API

### {HTTP Method} {Path}

**설명**: {엔드포인트 목적}

| 항목 | 내용 |
|------|------|
| Method | GET / POST / PATCH / DELETE |
| Path | `/api/v1/{resource}` |
| Auth | Required / Optional |
| 관련 화면 | SCR-XXX-## |

#### Query Parameters (GET)

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|:---:|-------|------|
| cursor | string | - | - | 페이지네이션 커서 |
| limit | number | - | 20 | 페이지 크기 |

#### Request Body (POST/PATCH)

\```typescript
interface RequestBody {
  field: string;
}
\```

#### Response

**성공 (200/201):**

\```typescript
interface SuccessResponse {
  data: ResourceType;
}
\```
```

### 에러 코드

| 코드 | HTTP | 설명 |
|------|:---:|------|
| VALIDATION_ERROR | 400 | 입력값 검증 실패 |
| UNAUTHORIZED | 401 | 인증 필요 |
| FORBIDDEN | 403 | 권한 없음 |
| NOT_FOUND | 404 | 리소스 없음 |
| CONFLICT | 409 | 리소스 충돌 |
| INTERNAL_ERROR | 500 | 서버 오류 |

### 화면-API 매핑 테이블

```markdown
| 화면 ID | 기능 | API | 설명 |
|---------|------|-----|------|
| SCR-DISC-01 | 목록 로드 | GET /posts | 최신 Post 목록 |
| SCR-DISC-01 | 필터 조회 | GET /posts?category= | 필터 적용 |
```

## 출력 위치

```
specs/{feature}/api-endpoints.md
```

## 참조 파일

- `specs/shared/api-contracts.md` — 기존 API 계약 패턴
- `specs/shared/data-models.md` — TypeScript 타입 참조
- `docs/api/` — API 문서 디렉토리

## 검증 체크리스트

- [ ] 모든 화면 명세의 API 요구사항 충족
- [ ] Request/Response 타입이 data-models.md와 일치
- [ ] 인증 요구사항 명시
- [ ] 페이지네이션 전략 정의 (cursor-based)
- [ ] 에러 코드 문서화
- [ ] 화면-API 매핑 테이블 완성

## 사용 예시

```
> specs/discovery/spec.md를 기반으로 API 계약 문서 생성해줘
> 이 화면들에 필요한 API 엔드포인트를 정리해줘
> OpenAPI 스타일로 API 명세 작성해줘
```
