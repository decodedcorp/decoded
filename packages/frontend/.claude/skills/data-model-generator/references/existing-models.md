# 기존 데이터 모델 참조

> data-model-generator 스킬에서 참조하는 기존 모델 정보입니다.

## 참조 경로

| 유형 | 경로 | 설명 |
|------|------|------|
| 마스터 모델 | `specs/shared/data-models.md` | 전체 도메인 모델 정의 |
| TypeScript 타입 | `lib/types/` | 실제 구현된 타입 |
| DB 스키마 | `supabase/migrations/` | PostgreSQL 스키마 |

## 핵심 엔티티 요약

### 콘텐츠 도메인

| Entity | 설명 | 관계 |
|--------|------|------|
| Post | 사용자 포스트 | → Media, Cast[], Image[] |
| Image | 이미지 | → Item[] |
| Item | 아이템/제품 | → Vote[], Comment[] |
| Media | 미디어 (그룹, 드라마) | → Cast[] |
| Cast | 출연자/멤버 | ← Media[] |

### 사용자 도메인

| Entity | 설명 | 관계 |
|--------|------|------|
| User | 사용자 | → Badge[], Reward[] |
| Badge | 뱃지 | ← User |
| Reward | 보상 | ← User, → Item |

### 상호작용 도메인

| Entity | 설명 | 관계 |
|--------|------|------|
| Vote | 투표 | → User, Item |
| Comment | 댓글 | → User, Post/Item |
| Favorite | 즐겨찾기 | → User, 다형성 |
| ClickEvent | 클릭 이벤트 | → User, Item |

## 공통 패턴

### ID 타입

```typescript
// UUID 형식
type UUID = string;

// 모든 엔티티의 id는 UUID
interface Entity {
  id: UUID;
}
```

### 타임스탬프

```typescript
interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}
```

### 상태 타입

```typescript
// 콘텐츠 상태
type ContentStatus = 'draft' | 'published' | 'archived';

// 이미지 처리 상태
type ImageStatus = 'pending' | 'extracted' | 'extracted_metadata' | 'skipped';

// 보상 상태
type RewardStatus = 'pending' | 'confirmed' | 'paid' | 'cancelled';
```

### 페이지네이션

```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    cursor: string | null;
    hasMore: boolean;
    total?: number;
  };
}
```

## 네이밍 규칙

### TypeScript ↔ PostgreSQL 매핑

| TypeScript | PostgreSQL |
|------------|------------|
| `camelCase` | `snake_case` |
| `Date` | `TIMESTAMPTZ` |
| `string` | `VARCHAR`, `TEXT`, `UUID` |
| `number` | `INTEGER`, `DECIMAL` |
| `boolean` | `BOOLEAN` |
| `object` | `JSONB` |

### 예시

```typescript
// TypeScript
interface Post {
  id: string;
  mediaId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// PostgreSQL
CREATE TABLE post (
  id UUID PRIMARY KEY,
  media_id UUID REFERENCES media(id),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

## 확장 시 주의사항

1. **중복 방지**: 새 타입 생성 전 기존 타입 확인
2. **일관성**: 기존 패턴 (Union Type over Enum) 준수
3. **문서화**: JSDoc으로 필드 설명 추가
4. **마이그레이션**: 타입 변경 시 DB 스키마도 함께 업데이트
