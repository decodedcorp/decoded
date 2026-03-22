# 화면 스펙 → 컴포넌트 매핑 가이드

> 화면 명세의 UI 요소를 React 컴포넌트로 변환하는 규칙입니다.

## UI 요소 매핑

### 이미지 (IMG-##)

```markdown
# 명세
| UI ID | 구분 | 요소명 | 속성/상태 |
|:---:|:---:|:---|:---|
| **IMG-01** | 이미지 | 메인 이미지 | Aspect: 16:9, Fallback: placeholder |
```

```tsx
// 컴포넌트
import Image from 'next/image';

<div className="relative aspect-video">
  <Image
    src={imageUrl}
    alt={alt}
    fill
    className="object-cover"
    placeholder="blur"
    blurDataURL={blurDataUrl}
  />
</div>
```

### 텍스트 (TXT-##)

```markdown
# 명세
| **TXT-01** | 텍스트 | 제목 | Font: H1, Color: text-primary |
```

```tsx
// 컴포넌트
<h1 className="text-2xl font-bold text-foreground">
  {title}
</h1>
```

### 버튼 (BTN-##)

```markdown
# 명세
| **BTN-01** | 버튼 | 확인 버튼 | Style: Primary, Disabled: 조건 미충족 시 |
```

```tsx
// 컴포넌트
import { Button } from '@/lib/components/ui/Button';

<Button
  variant="default"
  disabled={!isValid}
  onClick={handleSubmit}
>
  확인
</Button>
```

### 입력 (INP-##)

```markdown
# 명세
| **INP-01** | 입력 | 검색 입력 | Type: text, Placeholder: "검색어 입력" |
```

```tsx
// 컴포넌트
import { Input } from '@/lib/components/ui/Input';

<Input
  type="text"
  placeholder="검색어 입력"
  value={query}
  onChange={(e) => setQuery(e.target.value)}
/>
```

## 상태별 컴포넌트

### 로딩 상태

```tsx
// 스켈레톤 패턴
function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-48 bg-muted rounded" />
      <div className="mt-4 h-4 bg-muted rounded w-3/4" />
      <div className="mt-2 h-4 bg-muted rounded w-1/2" />
    </div>
  );
}
```

### 빈 상태

```tsx
// Empty state 패턴
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <IconEmpty className="w-16 h-16 mb-4" />
      <p>{message}</p>
    </div>
  );
}
```

### 에러 상태

```tsx
// Error state 패턴
function ErrorState({
  message,
  onRetry
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <IconError className="w-16 h-16 mb-4 text-destructive" />
      <p className="text-destructive mb-4">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        다시 시도
      </Button>
    </div>
  );
}
```

## 반응형 레이아웃

### 그리드 패턴

```tsx
// 명세: 모바일 1열, 태블릿 2열, 데스크톱 3열
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id} item={item} />
  ))}
</div>
```

### 스택 패턴

```tsx
// 명세: 세로 스택, 간격 16px
<div className="flex flex-col gap-4">
  {items.map(item => (
    <ListItem key={item.id} item={item} />
  ))}
</div>
```

## 공통 패턴

### Props 타입

```tsx
// 항상 명시적 타입 정의
interface CardProps {
  /** 카드 데이터 */
  item: ItemType;
  /** 클릭 핸들러 */
  onClick?: (id: string) => void;
  /** 추가 스타일 */
  className?: string;
}
```

### className 합성

```tsx
import { cn } from '@/lib/utils';

function Component({ className, ...props }: Props) {
  return (
    <div className={cn('base-styles', className)} {...props} />
  );
}
```

### 이벤트 핸들러

```tsx
// 명세의 인터랙션 → 이벤트 핸들러
// "Click: API 호출" → onClick
// "Enter: 검색 실행" → onKeyDown
// "Change: 250ms debounce" → onChange + useDebouncedValue
```

## 접근성 (A11y)

```tsx
// 이미지
<Image alt="설명적인 대체 텍스트" ... />

// 버튼
<button aria-label="닫기" aria-expanded={isOpen}>

// 입력
<input aria-describedby="error-message" aria-invalid={hasError} />

// 목록
<ul role="list" aria-label="검색 결과">
```
