# 마이그레이션 패턴 참조

> Supabase/PostgreSQL 마이그레이션 작성 시 참조하는 패턴입니다.

## 기존 마이그레이션 참조

| 패턴 | 예시 파일 |
|------|----------|
| 테이블 생성 | `supabase/migrations/` 내 최신 파일 참조 |
| ENUM 타입 | `specs/shared/data-models.md` SQL 섹션 |
| 관계 테이블 | `media_cast`, `post_cast` 패턴 |

## RLS (Row Level Security) 패턴

### 공개 읽기

```sql
-- 모든 사용자가 읽기 가능
CREATE POLICY "public_read" ON {table}
  FOR SELECT USING (true);
```

### 인증된 사용자만 읽기

```sql
CREATE POLICY "authenticated_read" ON {table}
  FOR SELECT USING (auth.role() = 'authenticated');
```

### 본인 데이터만 접근

```sql
-- 본인 데이터만 조회
CREATE POLICY "own_data_select" ON {table}
  FOR SELECT USING (auth.uid() = user_id);

-- 본인 데이터만 수정
CREATE POLICY "own_data_update" ON {table}
  FOR UPDATE USING (auth.uid() = user_id);

-- 본인 데이터만 삭제
CREATE POLICY "own_data_delete" ON {table}
  FOR DELETE USING (auth.uid() = user_id);
```

### 관리자 전체 접근

```sql
CREATE POLICY "admin_all" ON {table}
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "user"
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

## 함수 및 트리거

### updated_at 자동 갱신

```sql
-- 함수 (한 번만 생성)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 (테이블마다 생성)
CREATE TRIGGER update_{table}_updated_at
  BEFORE UPDATE ON {table}
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Soft Delete

```sql
-- 테이블에 deleted_at 컬럼 추가
ALTER TABLE {table} ADD COLUMN deleted_at TIMESTAMPTZ;

-- 삭제 대신 soft delete
CREATE OR REPLACE FUNCTION soft_delete_{table}()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE {table} SET deleted_at = NOW() WHERE id = OLD.id;
  RETURN NULL;  -- 실제 삭제 방지
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER soft_delete_{table}_trigger
  BEFORE DELETE ON {table}
  FOR EACH ROW
  EXECUTE FUNCTION soft_delete_{table}();

-- 조회 시 deleted_at 필터
CREATE POLICY "exclude_deleted" ON {table}
  FOR SELECT USING (deleted_at IS NULL);
```

## 인덱스 전략

### 일반 인덱스

```sql
-- 자주 필터링되는 컬럼
CREATE INDEX idx_{table}_{column} ON {table}({column});
```

### 복합 인덱스

```sql
-- 자주 함께 조회되는 컬럼
CREATE INDEX idx_{table}_user_created
ON {table}(user_id, created_at DESC);
```

### 부분 인덱스

```sql
-- 특정 조건의 데이터만 인덱싱
CREATE INDEX idx_{table}_active
ON {table}(created_at)
WHERE status = 'active';
```

### GIN 인덱스 (JSONB)

```sql
-- JSONB 필드 검색용
CREATE INDEX idx_{table}_metadata_gin
ON {table} USING GIN (metadata);
```

### 텍스트 검색 인덱스

```sql
-- Full-text search
CREATE INDEX idx_{table}_search
ON {table} USING GIN (to_tsvector('korean', content));
```

## 데이터 마이그레이션

### 기본값으로 채우기

```sql
-- NOT NULL 컬럼 추가 시
ALTER TABLE {table} ADD COLUMN new_column VARCHAR(100);
UPDATE {table} SET new_column = 'default_value';
ALTER TABLE {table} ALTER COLUMN new_column SET NOT NULL;
```

### 데이터 변환

```sql
-- 타입 변경 + 데이터 변환
ALTER TABLE {table}
ALTER COLUMN {column}
TYPE INTEGER USING {column}::INTEGER;
```

### 컬럼 리네이밍

```sql
ALTER TABLE {table} RENAME COLUMN old_name TO new_name;
```

## 롤백 패턴

```sql
-- 마이그레이션 롤백용 SQL
-- 파일: {timestamp}_rollback_{action}.sql

-- 테이블 삭제
DROP TABLE IF EXISTS {table} CASCADE;

-- 컬럼 삭제
ALTER TABLE {table} DROP COLUMN IF EXISTS {column};

-- 인덱스 삭제
DROP INDEX IF EXISTS idx_{table}_{column};
```

## 주의사항

### 1. 파괴적 변경

```sql
-- ❌ 위험: 데이터 손실 가능
DROP COLUMN
DROP TABLE
ALTER TYPE (축소)

-- ✅ 안전: 새 컬럼/테이블 추가 후 마이그레이션
ADD COLUMN
CREATE TABLE
```

### 2. 잠금 최소화

```sql
-- ❌ 테이블 잠금 발생
ALTER TABLE {table} ADD COLUMN col INT DEFAULT 0;

-- ✅ 잠금 없이 추가 후 별도 업데이트
ALTER TABLE {table} ADD COLUMN col INT;
UPDATE {table} SET col = 0 WHERE col IS NULL;
ALTER TABLE {table} ALTER COLUMN col SET DEFAULT 0;
```

### 3. 트랜잭션

```sql
BEGIN;
-- 여러 변경 사항
COMMIT;
-- 또는
ROLLBACK;
```
