---
description: 데이터 모델에서 Supabase/PostgreSQL 마이그레이션 SQL 생성
---

# Supabase Migration Generator

데이터 모델 정의에서 Supabase/PostgreSQL 마이그레이션 SQL을 자동 생성합니다.

## 트리거 조건

다음 키워드가 포함된 요청에서 자동 활성화:
- "migration", "마이그레이션"
- "database schema", "DB 스키마"
- "테이블 생성", "create table"
- "컬럼 추가", "add column"

## 생성 프로세스

### Step 1: 소스 분석

1. `specs/shared/data-models.md`에서 TypeScript 인터페이스 파싱
2. `specs/{feature}/data-model.md`에서 기능별 모델 파싱
3. `supabase/migrations/`에서 기존 스키마 확인

### Step 2: 변경 사항 도출

- 새 테이블
- 새 컬럼
- 타입 변경
- 관계 추가

### Step 3: SQL 생성

## 마이그레이션 패턴

### 1. 새 테이블 생성

```sql
-- Migration: create_{table_name}_table
-- Description: {테이블 설명}

CREATE TABLE {table_name} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 필수 필드
  required_field VARCHAR(255) NOT NULL,

  -- 선택 필드
  optional_field TEXT,

  -- 관계 (FK)
  related_id UUID REFERENCES related_table(id) ON DELETE SET NULL,

  -- JSONB
  metadata JSONB DEFAULT '{}',

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스
CREATE INDEX idx_{table_name}_{column} ON {table_name}({column});

-- RLS 정책
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "{table_name}_select_policy" ON {table_name}
  FOR SELECT USING (true);

CREATE POLICY "{table_name}_insert_policy" ON {table_name}
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- updated_at 자동 갱신 트리거
CREATE TRIGGER update_{table_name}_updated_at
  BEFORE UPDATE ON {table_name}
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2. ENUM 타입 생성

```sql
-- ENUM 대신 CHECK 제약 조건 권장 (유연성)
ALTER TABLE {table_name}
ADD CONSTRAINT {table_name}_{column}_check
CHECK ({column} IN ('value1', 'value2', 'value3'));
```

### 3. 컬럼 추가

```sql
-- Migration: add_{column}_to_{table}

ALTER TABLE {table_name}
ADD COLUMN {column_name} {TYPE} {CONSTRAINTS};

-- 기존 데이터 마이그레이션 (필요시)
UPDATE {table_name}
SET {column_name} = {default_value}
WHERE {column_name} IS NULL;
```

### 4. 관계 테이블 (Junction)

```sql
-- Migration: create_{table1}_{table2}_junction
-- M:N 관계 테이블

CREATE TABLE {table1}_{table2} (
  {table1}_id UUID REFERENCES {table1}(id) ON DELETE CASCADE,
  {table2}_id UUID REFERENCES {table2}(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY ({table1}_id, {table2}_id)
);

CREATE INDEX idx_{table1}_{table2}_{table1}_id ON {table1}_{table2}({table1}_id);
CREATE INDEX idx_{table1}_{table2}_{table2}_id ON {table1}_{table2}({table2}_id);
```

## TypeScript → PostgreSQL 매핑

| TypeScript | PostgreSQL | 비고 |
|------------|------------|------|
| `string` | `VARCHAR(255)` / `TEXT` | 길이에 따라 |
| `number` | `INTEGER` / `DECIMAL(10,2)` | 정수/소수 |
| `boolean` | `BOOLEAN` | |
| `Date` | `TIMESTAMPTZ` | 타임존 포함 |
| `string \| null` | `{TYPE}` (nullable) | NULL 허용 |
| `field?: string` | `{TYPE} DEFAULT NULL` | Optional |
| Union type | CHECK 제약 | ENUM 대체 |
| `object` | `JSONB` | |

## 파일 규칙

### 파일명

```
{timestamp}_{action}_{target}.sql

예시:
20240115120000_create_post_table.sql
20240115120100_add_status_to_post.sql
```

### 파일 위치

```
supabase/migrations/{파일명}.sql
```

## 참조 파일

- `specs/shared/data-models.md` - 마스터 데이터 모델
- `specs/{feature}/data-model.md` - 기능별 모델
- `supabase/migrations/` - 기존 마이그레이션
- `docs/database/` - DB 문서

## 검증 체크리스트

- [ ] 테이블명 snake_case 준수
- [ ] 컬럼명 snake_case 준수
- [ ] 적절한 타입 선택
- [ ] NOT NULL 제약 조건 설정
- [ ] FK 관계 정의
- [ ] 인덱스 설계
- [ ] RLS 정책 설정
- [ ] updated_at 트리거 설정

## MCP 연동

생성된 SQL은 Supabase MCP를 통해 적용:

```
mcp__supabase__apply_migration
  name: "{migration_name}"
  query: "{sql_content}"
```
