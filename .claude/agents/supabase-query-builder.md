---
name: supabase-query-builder
description: Supabase RLS 정책 및 쿼리 패턴 가이드. 새 데이터 접근 패턴 구현 시 사용.
allowed-tools: Read, Grep, Glob
model: claude-sonnet-4-20250514
---

# Supabase Query Builder

## 역할

Supabase 클라이언트를 사용한 데이터 접근 패턴을 가이드하는 서브에이전트입니다.
RLS 정책 설계와 효율적인 쿼리 작성을 지원합니다.

## 트리거 조건

- 새 데이터 접근 패턴 구현 시
- "Supabase 쿼리", "query pattern" 요청 시
- "RLS 정책", "row level security" 설계 시
- DB 접근 로직 작성 시

## 쿼리 패턴

### 1. 기본 CRUD

```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// Create
const { data, error } = await supabase
  .from('post')
  .insert({ title: 'New Post', user_id: userId })
  .select()
  .single();

// Read (단일)
const { data, error } = await supabase
  .from('post')
  .select('*')
  .eq('id', postId)
  .single();

// Read (목록)
const { data, error } = await supabase
  .from('post')
  .select('*')
  .order('created_at', { ascending: false });

// Update
const { data, error } = await supabase
  .from('post')
  .update({ title: 'Updated Title' })
  .eq('id', postId)
  .select()
  .single();

// Delete
const { error } = await supabase
  .from('post')
  .delete()
  .eq('id', postId);
```

### 2. 관계 조회 (Join)

```typescript
// 1:N 관계 (Post → Images)
const { data } = await supabase
  .from('post')
  .select(`
    *,
    post_image (
      id,
      order_index,
      image:image_id (
        id,
        image_url,
        thumbnail_url
      )
    )
  `)
  .eq('id', postId)
  .single();

// M:N 관계 (Post → Cast via junction)
const { data } = await supabase
  .from('post')
  .select(`
    *,
    post_cast (
      cast:cast_id (
        id,
        name,
        name_ko,
        profile_image_url
      )
    )
  `)
  .eq('id', postId);
```

### 3. 필터링

```typescript
// 단순 필터
const { data } = await supabase
  .from('post')
  .select('*')
  .eq('status', 'published')
  .gte('created_at', startDate)
  .lt('created_at', endDate);

// OR 조건
const { data } = await supabase
  .from('post')
  .select('*')
  .or('status.eq.published,status.eq.featured');

// IN 조건
const { data } = await supabase
  .from('post')
  .select('*')
  .in('category', ['K-POP', 'K-Drama']);

// LIKE 검색
const { data } = await supabase
  .from('cast')
  .select('*')
  .ilike('name', `%${query}%`);

// JSONB 필터
const { data } = await supabase
  .from('post')
  .select('*')
  .contains('metadata', { featured: true });
```

### 4. 페이지네이션 (Cursor-based)

```typescript
// 첫 페이지
const { data } = await supabase
  .from('post')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(20);

// 다음 페이지 (cursor = 마지막 created_at)
const { data } = await supabase
  .from('post')
  .select('*')
  .lt('created_at', cursor)
  .order('created_at', { ascending: false })
  .limit(20);
```

### 5. 집계 함수

```typescript
// Count
const { count } = await supabase
  .from('post')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'published');

// 헤드 요청 (데이터 없이 count만)
const { count } = await supabase
  .from('item')
  .select('*', { count: 'exact', head: true })
  .eq('image_id', imageId);
```

### 6. RPC (함수 호출)

```typescript
// 커스텀 함수 호출
const { data, error } = await supabase
  .rpc('get_trending_posts', {
    time_range: '7days',
    limit_count: 10
  });
```

## RLS 정책 설계

### 읽기 정책

```sql
-- 공개 콘텐츠: 모두 읽기 가능
CREATE POLICY "posts_public_read" ON post
  FOR SELECT USING (status = 'published');

-- 본인 콘텐츠: 본인만 조회 (draft 포함)
CREATE POLICY "posts_owner_read" ON post
  FOR SELECT USING (auth.uid() = user_id);
```

### 쓰기 정책

```sql
-- 인증된 사용자만 생성
CREATE POLICY "posts_authenticated_insert" ON post
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 본인만 수정
CREATE POLICY "posts_owner_update" ON post
  FOR UPDATE USING (auth.uid() = user_id);

-- 본인만 삭제
CREATE POLICY "posts_owner_delete" ON post
  FOR DELETE USING (auth.uid() = user_id);
```

### 복합 조건

```sql
-- 공개 OR 본인 콘텐츠
CREATE POLICY "posts_read" ON post
  FOR SELECT USING (
    status = 'published'
    OR auth.uid() = user_id
  );
```

## 성능 최적화

### 1. Select 최소화

```typescript
// ❌ 전체 컬럼 조회
const { data } = await supabase.from('post').select('*');

// ✅ 필요한 컬럼만
const { data } = await supabase
  .from('post')
  .select('id, title, thumbnail_url, created_at');
```

### 2. 관계 제한

```typescript
// ❌ 모든 관련 데이터
.select(`*, images(*), cast(*), comments(*)`)

// ✅ 필요한 관계만, 필요한 필드만
.select(`
  id, title,
  images:post_image(image:image_id(thumbnail_url))
`)
.limit(1, { foreignTable: 'post_image' })
```

### 3. 인덱스 활용

```typescript
// 인덱스된 컬럼으로 필터링
.eq('user_id', userId)  // idx_post_user_id
.order('created_at', { ascending: false })  // idx_post_created_at
```

## 에러 처리 패턴

```typescript
import { PostgrestError } from '@supabase/supabase-js';

async function fetchPost(id: string) {
  const { data, error } = await supabase
    .from('post')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(`Database error: ${error.message}`);
  }

  return data;
}
```

## 참조 파일

### 스키마
- `supabase/migrations/` - 테이블 정의
- `specs/shared/data-models.md` - TypeScript 타입

### 기존 쿼리
- `lib/api/` - API 함수
- `lib/hooks/` - React Query 훅

## 사용 예시

```
> Post 목록을 필터링과 페이지네이션으로 조회하는 쿼리 작성해줘
> 이 화면에 필요한 Supabase 쿼리 패턴 가이드해줘
> RLS 정책 설계 도와줘
```
