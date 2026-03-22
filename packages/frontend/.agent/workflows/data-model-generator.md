---
description: Feature spec에서 TypeScript 인터페이스 자동 생성
---

# Data Model Generator

Feature spec의 데이터 요구사항을 분석하여 TypeScript 인터페이스를 자동 생성합니다.

## 트리거 조건

다음 키워드가 포함된 요청에서 자동 활성화:
- "generate types", "타입 생성"
- "data model", "데이터 모델"
- "create interface", "인터페이스 생성"
- "TypeScript types"

## 생성 프로세스

### Step 1: 요구사항 분석

1. `specs/{feature}/spec.md`에서 Entity 식별
2. 속성 추출
3. 관계 매핑

### Step 2: 기존 모델 확인

1. `specs/shared/data-models.md` 스캔
2. `lib/types/` 디렉토리 확인
3. 중복 타입 식별

### Step 3: 인터페이스 생성

## 타입 정의 규칙

### 1. 네이밍 컨벤션

| 타입 | 규칙 | 예시 |
|------|------|------|
| Interface | PascalCase | `Post`, `UserProfile` |
| Type Alias | PascalCase | `CategoryType`, `MatchType` |
| Enum 대체 | Union Type | `'draft' \| 'published'` |

### 2. 필수 속성

```typescript
interface Entity {
  id: string;           // UUID
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. 관계 표현

```typescript
// 1:N 관계
interface Post {
  mediaId?: string;     // FK (optional)
  castIds: string[];    // FK[] (many)
}

// 확장된 타입 (with relations)
interface PostWithRelations extends Post {
  media?: Media;
  cast: Cast[];
}
```

### 4. Nullable vs Optional

```typescript
// Nullable: DB에 NULL 저장 가능
price: number | null;

// Optional: 응답에 포함되지 않을 수 있음
thumbnailUrl?: string;
```

## 출력 형식

```typescript
// ============================================
// Feature: {Feature Name}
// Generated: YYYY-MM-DD
// ============================================

/**
 * {Entity 설명}
 * @see specs/{feature}/spec.md#data-requirements
 */
export interface EntityName {
  /** 고유 식별자 */
  id: string;

  /** 필수 필드 설명 */
  requiredField: string;

  /** 선택 필드 설명 */
  optionalField?: string;

  /** 타임스탬프 */
  createdAt: Date;
  updatedAt: Date;
}

// Union Types
export type StatusType = 'draft' | 'published' | 'archived';

// API Response Types
export interface EntityResponse {
  data: EntityName;
}

export interface EntityListResponse {
  data: EntityName[];
  pagination: {
    cursor: string | null;
    hasMore: boolean;
  };
}

// Request Types
export interface CreateEntityRequest {
  requiredField: string;
  optionalField?: string;
}
```

## 저장 위치

| 유형 | 경로 |
|------|------|
| 도메인 타입 | `lib/types/{domain}.ts` |
| API 타입 | `lib/types/api/{feature}.ts` |
| Spec 문서 | `specs/{feature}/data-model.md` |

## 참조 파일

- `specs/shared/data-models.md` - 기존 데이터 모델 참조
- `lib/types/` - 기존 TypeScript 타입
- Supabase 스키마와 일관성 유지

## 검증 체크리스트

- [ ] 기존 타입과 중복 여부 확인
- [ ] DB 스키마와 필드명 일치 (snake_case → camelCase)
- [ ] Nullable/Optional 구분 정확성
- [ ] JSDoc 주석 포함
- [ ] 관계 타입 정의 완전성
