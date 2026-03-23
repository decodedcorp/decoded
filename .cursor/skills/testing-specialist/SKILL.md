---
name: testing-specialist
description: >-
  테스트 케이스 작성 가이드. 단위/통합/E2E 테스트 작성.
  "테스트 작성", "단위 테스트", "테스트 케이스", "이 함수 테스트" 요청 시 적용.
---

# Testing Specialist

## AAA 패턴

```javascript
describe('대상', () => {
  it('should [기대] when [조건]', () => {
    // Arrange
    const input = 'test';
    // Act
    const result = fn(input);
    // Assert
    expect(result).toBe('expected');
  });
});
```

## 테스트 케이스 체크리스트

- **Happy Path:** 기본 입력 → 예상 출력, 다양한 유효 입력
- **Edge Cases:** null/undefined/''/[], 경계값(0, -1, MAX), 특수 문자, 매우 긴 입력
- **Error Cases:** 잘못된 타입, 필수 파라미터 누락, 권한 없음, 네트워크 실패

## 모킹 원칙

**언제:** 외부 API, DB, 파일시스템, Date/setTimeout, 랜덤
**원칙:** 필요한 것만, 실제 동작과 유사하게, 범위 최소화

## decoded 프로젝트 테스트 패턴

### Playwright (E2E/Visual)

```typescript
import { test, expect } from '@playwright/test';

test('페이지 로딩', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading')).toBeVisible();
});
```

### API Route 테스트

```typescript
// API route handler를 직접 호출
import { GET } from '@/app/api/v1/posts/route';

it('should return posts', async () => {
  const request = new Request('http://localhost/api/v1/posts');
  const response = await GET(request);
  expect(response.status).toBe(200);
});
```

### Hook 테스트

```typescript
import { renderHook, waitFor } from '@testing-library/react';

it('should fetch data', async () => {
  const { result } = renderHook(() => useImages());
  await waitFor(() => expect(result.current.data).toBeDefined());
});
```

## 테스트 파일 위치

```
packages/web/__tests__/          # 테스트 루트
packages/web/__tests__/api/      # API route 테스트
packages/web/__tests__/hooks/    # Hook 테스트
packages/web/__tests__/e2e/      # E2E 테스트 (Playwright)
```

## 사용 예시

```
> usePostLike 훅 테스트 작성해줘
> /api/v1/posts API 테스트 만들어줘
> 이 컴포넌트의 에지 케이스 테스트 추가해줘
```
