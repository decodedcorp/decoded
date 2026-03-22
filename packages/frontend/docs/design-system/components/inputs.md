# Input Components

> Version: 2.0.0
> Last Updated: 2026-02-05

---

## Overview

Input 컴포넌트는 폼 입력 필드를 위한 기본 컴포넌트와 검색 전용 컴포넌트를 제공합니다.
아이콘 슬롯, 라벨, 헬퍼 텍스트, 에러 상태를 지원하며, CVA를 사용한 variant 시스템을 제공합니다.

**파일 위치**: `packages/web/lib/design-system/input.tsx`

**시각적 참고**: [decoded.pen](../decoded.pen)

---

## Import

```tsx
// 컴포넌트 import
import { Input, SearchInput } from "@/lib/design-system";

// Variants import (커스텀 스타일링)
import { inputVariants } from "@/lib/design-system";

// TypeScript types
import type { InputProps, SearchInputProps } from "@/lib/design-system";
```

---

## Input

### 개요

기본 입력 필드 컴포넌트입니다.
아이콘 슬롯 (leftIcon, rightIcon), 라벨, 헬퍼 텍스트, 에러 상태를 지원합니다.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"default" \| "error" \| "search"` | `"default"` | 입력 필드 스타일 변형 |
| `leftIcon` | `ReactNode` | - | 왼쪽 아이콘 (자동으로 pl-10 패딩 적용) |
| `rightIcon` | `ReactNode` | - | 오른쪽 아이콘 (자동으로 pr-10 패딩 적용) |
| `label` | `string` | - | 라벨 텍스트 (위에 표시) |
| `helperText` | `string` | - | 도움말 텍스트 (아래에 표시) |
| `error` | `string` | - | 에러 메시지 (variant="error" 자동 적용) |
| `type` | `string` | `"text"` | Input 타입 (text, email, password 등) |
| `className` | `string` | - | 추가 CSS 클래스 |
| ...rest | `InputHTMLAttributes<HTMLInputElement>` | - | 표준 input 속성 |

### Variants

| Variant | Style | Usage |
|---------|-------|-------|
| `default` | 기본 테두리, focus ring | 일반 입력 필드 |
| `error` | 빨간 테두리, destructive focus ring | 에러 상태 (error prop 있으면 자동 적용) |
| `search` | 둥근 모서리 (rounded-full), pl-10 pr-10 | 검색 입력 (SearchInput 전용) |

### Usage Examples

#### 기본 입력

```tsx
import { Input } from "@/lib/design-system";

function BasicForm() {
  return (
    <>
      {/* 기본 입력 */}
      <Input placeholder="Enter text..." />

      {/* 라벨이 있는 입력 */}
      <Input
        label="Email"
        placeholder="you@example.com"
        type="email"
      />

      {/* 헬퍼 텍스트 */}
      <Input
        label="Password"
        helperText="Must be at least 8 characters"
        type="password"
      />
    </>
  );
}
```

#### 아이콘이 있는 입력

```tsx
import { Input } from "@/lib/design-system";
import { Mail, Lock, Eye } from "lucide-react";

function IconInputs() {
  return (
    <>
      {/* 왼쪽 아이콘 */}
      <Input
        leftIcon={<Mail className="h-4 w-4" />}
        placeholder="Email"
      />

      {/* 오른쪽 아이콘 */}
      <Input
        rightIcon={<Eye className="h-4 w-4" />}
        placeholder="Password"
        type="password"
      />

      {/* 양쪽 아이콘 */}
      <Input
        leftIcon={<Lock className="h-4 w-4" />}
        rightIcon={<Eye className="h-4 w-4" />}
        placeholder="Enter secure code"
      />
    </>
  );
}
```

#### 에러 상태

```tsx
import { Input } from "@/lib/design-system";

function FormWithValidation() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  return (
    <Input
      label="Email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      error={error}  // error prop 있으면 variant="error" 자동 적용
      placeholder="you@example.com"
    />
  );
}
```

**에러 동작**:
- `error` prop이 있으면 자동으로 `variant="error"` 적용
- `helperText`는 숨겨지고 `error` 메시지만 표시
- 빨간 테두리와 destructive focus ring 스타일 적용

#### 폼 통합 예시

```tsx
import { Input, Text } from "@/lib/design-system";
import { Mail, Lock } from "lucide-react";

function LoginForm() {
  return (
    <form className="space-y-6">
      <div>
        <Input
          label="Email Address"
          type="email"
          leftIcon={<Mail className="h-4 w-4" />}
          placeholder="you@example.com"
          required
        />
      </div>

      <div>
        <Input
          label="Password"
          type="password"
          leftIcon={<Lock className="h-4 w-4" />}
          placeholder="Enter password"
          helperText="Minimum 8 characters"
          required
        />
      </div>

      <button type="submit" className="btn-primary">
        Login
      </button>
    </form>
  );
}
```

### CVA Variants

직접 variant 클래스를 사용하려면:

```tsx
import { inputVariants } from "@/lib/design-system";

const inputClasses = inputVariants({ variant: "default" });
// Returns: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ..."
```

---

## SearchInput

### 개요

검색 전용 입력 컴포넌트입니다.
내장 Search 아이콘과 Clear 버튼을 자동으로 표시하며, `variant="search"` (둥근 모서리)가 기본 적용됩니다.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | - | 입력 값 (제어 컴포넌트) |
| `onChange` | `(e: ChangeEvent) => void` | - | 입력 변경 핸들러 |
| `onClear` | `() => void` | - | Clear 버튼 클릭 핸들러 |
| `placeholder` | `string` | `"Search..."` | Placeholder 텍스트 |
| `autoFocus` | `boolean` | - | 자동 포커스 |
| `className` | `string` | - | 추가 CSS 클래스 |
| ...rest | `Omit<InputProps, "leftIcon" \| "rightIcon" \| "variant">` | - | Input props (아이콘, variant 제외) |

### Features

- **자동 Search 아이콘**: 왼쪽에 항상 표시 (Lucide `Search` 아이콘)
- **조건부 Clear 버튼**: `value`가 있을 때만 오른쪽에 표시 (Lucide `X` 아이콘)
- **둥근 모서리**: `variant="search"` (rounded-full) 자동 적용
- **Interactive Clear**: Clear 버튼에 hover 상태와 transition 적용

### Usage Examples

#### 기본 검색 입력

```tsx
import { SearchInput } from "@/lib/design-system";

function SearchBar() {
  const [query, setQuery] = useState('');

  return (
    <SearchInput
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onClear={() => setQuery('')}
      placeholder="Search products..."
    />
  );
}
```

#### 검색 오버레이

```tsx
import { SearchInput } from "@/lib/design-system";

function SearchOverlay() {
  const [query, setQuery] = useState('');

  return (
    <div className="fixed inset-0 z-50 bg-background p-4">
      <SearchInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClear={() => setQuery('')}
        placeholder="Search images, posts, users..."
        autoFocus  // 오버레이 열릴 때 자동 포커스
      />

      {query && (
        <div className="mt-4">
          <p>Search results for: {query}</p>
        </div>
      )}
    </div>
  );
}
```

#### 헤더 통합

```tsx
import { SearchInput } from "@/lib/design-system";

function Header() {
  const [query, setQuery] = useState('');

  return (
    <header className="flex items-center gap-4 p-4">
      <h1>Logo</h1>

      {/* 헤더 내 검색 입력 */}
      <SearchInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClear={() => setQuery('')}
        className="max-w-sm"
      />

      <button>User Menu</button>
    </header>
  );
}
```

#### Debounced Search

```tsx
import { SearchInput } from "@/lib/design-system";
import { useDebounce } from "@/lib/hooks";

function DebouncedSearch() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  // debouncedQuery가 변경되면 검색 API 호출
  useEffect(() => {
    if (debouncedQuery) {
      fetchSearchResults(debouncedQuery);
    }
  }, [debouncedQuery]);

  return (
    <SearchInput
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onClear={() => setQuery('')}
      placeholder="Type to search..."
    />
  );
}
```

---

## Input Patterns

### 폼 필드 패턴

```tsx
import { Input, Text } from "@/lib/design-system";

function FormField({ label, error, ...inputProps }) {
  return (
    <div className="space-y-1.5">
      <Input
        label={label}
        error={error}
        {...inputProps}
      />
    </div>
  );
}
```

### 조건부 에러 표시

```tsx
import { Input } from "@/lib/design-system";

function ValidatedInput({ value, onChange }) {
  const [touched, setTouched] = useState(false);
  const error = touched && !value ? "This field is required" : "";

  return (
    <Input
      value={value}
      onChange={onChange}
      onBlur={() => setTouched(true)}
      error={error}
      label="Required Field"
    />
  );
}
```

### 비밀번호 표시/숨김

```tsx
import { Input } from "@/lib/design-system";
import { Eye, EyeOff } from "lucide-react";

function PasswordInput() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Input
      type={showPassword ? "text" : "password"}
      label="Password"
      rightIcon={
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="pointer-events-auto cursor-pointer"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      }
    />
  );
}
```

---

## Accessibility

### 라벨 연결

Input 컴포넌트는 자동으로 label과 input을 연결합니다:

```tsx
// ✅ 자동 연결
<Input label="Email" />

// ✅ 수동 연결
<label htmlFor="email">Email</label>
<input id="email" />
```

### 에러 메시지

에러 메시지는 `aria-invalid`와 함께 표시됩니다:

```tsx
<Input error="Invalid email" />
// Renders: <input aria-invalid="true" />
```

### 필수 필드

```tsx
<Input label="Email" required />
// label에 자동으로 asterisk (*) 추가 가능
```

---

## Design Tokens 참조

Input 컴포넌트는 다음 토큰을 사용합니다:

- `colors.border`: 기본 테두리
- `colors.input`: 입력 필드 테두리
- `colors.ring`: Focus ring 색상
- `colors.destructive`: 에러 상태 테두리
- `colors.background`: 입력 배경
- `colors.foreground`: 텍스트 색상
- `colors.mutedForeground`: Placeholder 색상
- `borderRadius.md`: 기본 모서리 (Input)
- `borderRadius.full`: 둥근 모서리 (SearchInput)

자세한 내용: [tokens.md](../tokens.md)

---

## Related Documentation

- [Design Tokens](../tokens.md) - Color, Spacing 토큰
- [Typography Components](./typography.md) - Text 컴포넌트
- [Design Patterns](../patterns.md) - 폼 패턴 가이드
- [decoded.pen](../decoded.pen) - 시각적 레퍼런스

---

> **Note**: Input과 SearchInput은 제어 컴포넌트로 사용하는 것을 권장합니다.
> `value`와 `onChange` props를 항상 함께 전달하세요.
