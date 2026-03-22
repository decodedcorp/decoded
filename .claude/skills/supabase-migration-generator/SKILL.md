---
name: supabase-migration-generator
description: data-model.md에서 SQL 마이그레이션 생성. "migration", "database schema" 요청 시 자동 적용.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
model: claude-sonnet-4-20250514
---

# Supabase Migration Generator

## 개요

데이터 모델 정의에서 Supabase/PostgreSQL 마이그레이션 SQL을 자동 생성합니다.
프로젝트의 기존 스키마 패턴과 네이밍 규칙을 준수합니다.

## 트리거 조건

다음 키워드가 포함된 요청에서 자동 활성화:
- "migration", "마이그레이션"
- "database schema", "DB 스키마"
- "테이블 생성", "create table"
- "컬럼 추가", "add column"

## 생성 프로세스

### Step 1: 소스 분석

```
[specs/shared/data-models.md] → TypeScript 인터페이스 파싱
[specs/{feature}/data-model.md] → 기능별 모델 파싱
[supabase/migrations/] → 기존 스키마 확인
```

### Step 2: 변경 사항 도출

```
현재 스키마 ─┬─ 새 모델 정의
             │
             ↓
        변경 사항 계산
             │
             ├── 새 테이블
             ├── 새 컬럼
             ├── 타입 변경
             └── 관계 추가
```

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

-- 또는 참조 테이블 사용
CREATE TABLE {type_name}_enum (
  value VARCHAR(50) PRIMARY KEY,
  label VARCHAR(100) NOT NULL,
  sort_order INTEGER DEFAULT 0
);
```

### 3. 컬럼 추가

```sql
-- Migration: add_{column}_to_{table}
-- Description: {변경 설명}

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
-- Description: M:N 관계 테이블

CREATE TABLE {table1}_{table2} (
  {table1}_id UUID REFERENCES {table1}(id) ON DELETE CASCADE,
  {table2}_id UUID REFERENCES {table2}(id) ON DELETE CASCADE,

  -- 추가 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  PRIMARY KEY ({table1}_id, {table2}_id)
);

CREATE INDEX idx_{table1}_{table2}_{table1}_id ON {table1}_{table2}({table1}_id);
CREATE INDEX idx_{table1}_{table2}_{table2}_id ON {table1}_{table2}({table2}_id);
```

### 5. 인덱스 추가

```sql
-- Migration: add_indexes_to_{table}
-- Description: 성능 최적화 인덱스

-- 단일 컬럼 인덱스
CREATE INDEX idx_{table}_{column} ON {table}({column});

-- 복합 인덱스
CREATE INDEX idx_{table}_{col1}_{col2} ON {table}({col1}, {col2});

-- 부분 인덱스
CREATE INDEX idx_{table}_{column}_active
ON {table}({column})
WHERE status = 'active';
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
20240115120200_create_post_cast_junction.sql
```

### 파일 위치

```
supabase/migrations/{파일명}.sql
```

## 참조 파일

### 데이터 모델
- `specs/shared/data-models.md` - 마스터 데이터 모델
- `specs/{feature}/data-model.md` - 기능별 모델

### 기존 스키마
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

## 사용 예시

```
> Post 인터페이스에 대한 마이그레이션 생성해줘
> 새로운 Badge 테이블 SQL 만들어줘
> media와 cast 간의 관계 테이블 마이그레이션 생성해줘
```
