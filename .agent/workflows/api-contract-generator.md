---
description: Feature spec에서 OpenAPI 스타일 API 문서 생성
---

# API Contract Generator

Feature spec과 화면 명세를 분석하여 API 계약 문서를 자동 생성합니다.

## 트리거 조건

다음 키워드가 포함된 요청에서 자동 활성화:
- "API contract", "API 계약"
- "OpenAPI", "Swagger"
- "endpoint spec", "엔드포인트 명세"
- "API 문서 생성"

## 생성 프로세스

### Step 1: 데이터 요구사항 추출

1. `specs/{feature}/spec.md` 파일에서 User Stories 분석
2. `specs/{feature}/screens/SCR-XXX-##.md`에서 화면별 API 호출 식별
3. `specs/shared/data-models.md`에서 타입 참조

### Step 2: 엔드포인트 도출

각 화면 명세에서:
1. "데이터 요구사항" 섹션 추출
2. CRUD 작업 식별
3. 필터/검색/페이지네이션 요구사항 파악

### Step 3: 문서 생성

다음 구조로 API 문서 생성:

```markdown
# API Endpoints - {Feature Name}

> {Feature} 기능에 필요한 API 엔드포인트 정의

**버전**: v1
**기준 경로**: `/api/v1`
**인증 방식**: Bearer Token (Supabase Auth)

## {리소스} API

### {HTTP Method} {Path}

**설명**: {엔드포인트 목적}

| 항목 | 내용 |
|------|------|
| Method | GET / POST / PATCH / DELETE |
| Path | `/api/v1/{resource}` |
| Auth | Required / Optional |
| 관련 화면 | SCR-XXX-## |

#### Query Parameters / Request Body
(파라미터 테이블)

#### Response
(성공/에러 응답 정의)

## 화면-API 매핑

| 화면 ID | 기능 | API | 설명 |
|---------|------|-----|------|

## 에러 코드

| 코드 | HTTP | 설명 |
|------|:---:|------|
| VALIDATION_ERROR | 400 | 입력값 검증 실패 |
| UNAUTHORIZED | 401 | 인증 필요 |
| FORBIDDEN | 403 | 권한 없음 |
| NOT_FOUND | 404 | 리소스 없음 |
```

## 출력 위치

```
specs/{feature}/api-endpoints.md
```

## 참조 파일

- `specs/shared/api-contracts.md` - 기존 API 계약 패턴
- `specs/shared/data-models.md` - TypeScript 타입 참조
- `docs/api/` - API 문서 디렉토리

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
