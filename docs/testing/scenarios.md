# 테스트 시나리오

> 버전: 1.0.0
> 최종 업데이트: 2026-01-14
> 목적: 기능별 테스트 케이스 및 E2E 시나리오 문서화

---

## 개요

이 문서는 Decoded 앱의 테스트 시나리오를 정리합니다. 각 기능별 테스트 케이스와 E2E 테스트 시나리오를 포함합니다.

---

## 1. 테스트 전략

### 1.1 테스트 피라미드

```
                    ┌───────────────┐
                    │    E2E Tests   │  ← 핵심 사용자 흐름
                    │   (Playwright) │
                    └───────┬───────┘
                            │
                   ┌────────┴────────┐
                   │ Integration Tests│  ← 컴포넌트 통합
                   │   (React Testing │
                   │    Library)      │
                   └────────┬────────┘
                            │
          ┌─────────────────┴─────────────────┐
          │           Unit Tests               │  ← 개별 함수/훅
          │         (Vitest/Jest)              │
          └────────────────────────────────────┘
```

### 1.2 테스트 도구

| Tool | Purpose | Files |
|------|---------|-------|
| Playwright | E2E 테스트 | `__tests__/e2e/**` |
| Vitest/Jest | Unit 테스트 | `__tests__/unit/**` |
| React Testing Library | 컴포넌트 테스트 | `__tests__/components/**` |

---

## 2. 기능별 테스트 케이스

### 2.1 D-01: Responsive Magazine Feed

| ID | 시나리오 | 기대 결과 | 우선순위 | 상태 |
|----|----------|----------|---------|------|
| D01-01 | 홈페이지 초기 로딩 | 50개 이미지 렌더링 | P0 | ✅ |
| D01-02 | 무한 스크롤 트리거 | 하단 50px 접근 시 추가 50개 로딩 | P0 | ✅ |
| D01-03 | 스켈레톤 표시 | 로딩 중 스켈레톤 UI 표시 | P1 | ⬜ |
| D01-04 | 이미지 0개 | EmptyState 컴포넌트 표시 | P0 | ✅ |
| D01-05 | 네트워크 오류 | ErrorState + 재시도 버튼 | P0 | ✅ |
| D01-06 | 모바일 1열 레이아웃 | ≤640px에서 1열 표시 | P0 | ✅ |
| D01-07 | 데스크톱 Masonry | >640px에서 2-4열 Masonry | P0 | ✅ |
| D01-08 | 이미지 lazy loading | 뷰포트 밖 이미지 지연 로딩 | P1 | ✅ |
| D01-09 | 상위 6개 eager loading | 첫 6개 이미지 우선 로딩 | P1 | ✅ |
| D01-10 | 300 DOM 노드 제한 | 렌더링된 노드 300개 이하 | P1 | ✅ |

**테스트 코드 예시**:
```typescript
// __tests__/e2e/home.spec.ts
import { test, expect } from '@playwright/test';

test.describe('D-01: Magazine Feed', () => {
  test('D01-01: should load initial 50 images', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="image-card"]');

    const cards = await page.locator('[data-testid="image-card"]').count();
    expect(cards).toBeGreaterThanOrEqual(50);
  });

  test('D01-02: should trigger infinite scroll', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="image-card"]');

    // 스크롤을 맨 아래로
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // 추가 로딩 대기
    await page.waitForTimeout(1000);

    const cards = await page.locator('[data-testid="image-card"]').count();
    expect(cards).toBeGreaterThan(50);
  });

  test('D01-06: should show single column on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    const grid = await page.locator('[data-testid="thiings-grid"]');
    const style = await grid.evaluate(el => getComputedStyle(el).gridTemplateColumns);
    expect(style).toContain('1fr');
  });
});
```

---

### 2.2 D-02: Hierarchical Filter

| ID | 시나리오 | 기대 결과 | 우선순위 | 상태 |
|----|----------|----------|---------|------|
| D02-01 | 필터 탭 표시 | All, newjeanscloset, blackpinkk.style 탭 표시 | P0 | ✅ |
| D02-02 | 필터 선택 | 탭 클릭 시 해당 계정 이미지만 표시 | P0 | ✅ |
| D02-03 | All 필터 | 모든 이미지 표시 | P0 | ✅ |
| D02-04 | URL 상태 반영 | 필터 선택 시 URL 파라미터 업데이트 | P1 | ⬜ |
| D02-05 | 새로고침 유지 | URL에서 필터 상태 복원 | P1 | ⬜ |
| D02-06 | (Future) 계층형 드롭다운 | Category → Media → Cast 드릴다운 | P0 | ⬜ |
| D02-07 | (Future) 브레드크럼 | 현재 필터 경로 표시 및 클릭 네비게이션 | P1 | ⬜ |
| D02-08 | (Future) Clear All | 모든 필터 초기화 | P1 | ⬜ |

**테스트 코드 예시**:
```typescript
test.describe('D-02: Hierarchical Filter', () => {
  test('D02-02: should filter by account', async ({ page }) => {
    await page.goto('/');

    // blackpinkk.style 필터 클릭
    await page.click('[data-testid="filter-blackpinkk.style"]');

    // URL 업데이트 확인
    expect(page.url()).toContain('filter=blackpinkk.style');

    // 이미지 계정 확인 (첫 번째 이미지)
    await page.waitForSelector('[data-testid="image-card"]');
    const account = await page.locator('[data-testid="image-account"]').first().textContent();
    expect(account).toBe('blackpinkk.style');
  });
});
```

---

### 2.3 D-04: Unified Search

| ID | 시나리오 | 기대 결과 | 우선순위 | 상태 |
|----|----------|----------|---------|------|
| D04-01 | 검색 입력 | 검색창에 텍스트 입력 가능 | P0 | ✅ |
| D04-02 | 디바운스 | 250ms 후 검색 실행 | P0 | ✅ |
| D04-03 | 결과 표시 | 검색 결과 그리드 업데이트 | P0 | 🔶 |
| D04-04 | 검색 초기화 | 빈 검색어 시 전체 결과 | P0 | ✅ |
| D04-05 | (Future) 검색 제안 | 입력 중 자동완성 | P1 | ⬜ |
| D04-06 | (Future) 탭 필터 | All/People/Media/Items 탭 | P0 | ⬜ |

---

### 2.4 V-01: Responsive Detail View

| ID | 시나리오 | 기대 결과 | 우선순위 | 상태 |
|----|----------|----------|---------|------|
| V01-01 | 카드 클릭 (Desktop) | 모달 오버레이 표시 | P0 | ✅ |
| V01-02 | 카드 클릭 (Mobile) | 풀페이지 상세 표시 | P0 | ✅ |
| V01-03 | 직접 URL 접근 | 풀페이지 상세 표시 | P0 | ✅ |
| V01-04 | 모달 닫기 | X 클릭 또는 외부 클릭 시 닫힘 | P0 | ✅ |
| V01-05 | 뒤로가기 | 홈으로 복귀 | P0 | ✅ |
| V01-06 | URL 업데이트 | 상세 진입 시 `/images/[id]` | P0 | ✅ |
| V01-07 | Hero 이미지 | 큰 이미지 표시 | P0 | ✅ |
| V01-08 | 아이템 목록 | 감지된 아이템 카드 표시 | P0 | ✅ |
| V01-09 | FLIP 애니메이션 | 카드→상세 전환 애니메이션 | P1 | ✅ |
| V01-10 | (Future) 키보드 네비게이션 | ←/→ 키로 이전/다음 이미지 | P2 | ⬜ |

**테스트 코드 예시**:
```typescript
test.describe('V-01: Detail View', () => {
  test('V01-01: should open modal on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // 첫 번째 카드 클릭
    await page.click('[data-testid="image-card"]:first-child');

    // 모달 표시 확인
    await expect(page.locator('[data-testid="detail-modal"]')).toBeVisible();
  });

  test('V01-02: should open full page on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    // 첫 번째 카드 클릭
    await page.click('[data-testid="image-card"]:first-child');

    // URL 변경 확인
    await expect(page).toHaveURL(/\/images\/[a-zA-Z0-9-]+/);

    // 풀페이지 상세 표시 확인
    await expect(page.locator('[data-testid="detail-page"]')).toBeVisible();
  });
});
```

---

### 2.5 V-02: Pin Interaction

| ID | 시나리오 | 기대 결과 | 우선순위 | 상태 |
|----|----------|----------|---------|------|
| V02-01 | 핀 렌더링 | 아이템 좌표에 번호 핀 표시 | P0 | 🔶 |
| V02-02 | 핀 호버 (Desktop) | 핀 확대 + 아이템 카드 하이라이트 | P1 | ⬜ |
| V02-03 | 핀 클릭 | 해당 아이템 카드로 스크롤 | P0 | ⬜ |
| V02-04 | 아이템 카드 클릭 | 해당 핀 하이라이트 | P1 | ⬜ |
| V02-05 | 연결선 | 핀과 카드 사이 선 표시 | P2 | ⬜ |
| V02-06 | 아이템 0개 | "No items" 메시지 표시 | P0 | ✅ |
| V02-07 | 좌표 없음 | 기본 위치 (center) 사용 | P0 | ✅ |
| V02-08 | 모바일 터치 | 터치 시 핀 상호작용 | P1 | ⬜ |

---

### 2.6 V-03 ~ V-06 (미구현)

| Feature | ID | 시나리오 | 우선순위 | 상태 |
|---------|-----|----------|---------|------|
| Dual Match | V03-01 | Original/Vibe 섹션 분리 | P0 | ⬜ |
| Dual Match | V03-02 | Vibe 투표 표시 | P1 | ⬜ |
| Smart Tags | V04-01 | Media > Cast > Context 표시 | P0 | ⬜ |
| Smart Tags | V04-02 | 태그 클릭 시 필터 네비게이션 | P1 | ⬜ |
| Purchase Link | V05-01 | Buy 버튼 표시 | P0 | ⬜ |
| Purchase Link | V05-02 | 클릭 추적 | P0 | ⬜ |
| Voting | V06-01 | 정확도 투표 버튼 | P0 | ⬜ |
| Comments | V06-02 | 댓글 목록 표시 | P0 | ⬜ |

---

## 3. E2E 테스트 시나리오

### 3.1 핵심 사용자 흐름

#### Flow 1: 발견 → 상세 → 구매

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     E2E-01: Discovery to Purchase Flow                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   Step 1: 홈 로딩                                                               │
│   ├── URL: /                                                                    │
│   ├── Assert: 이미지 카드 50개 이상 로드                                        │
│   └── Assert: 필터 탭 표시                                                      │
│                                                                                  │
│   Step 2: 필터 적용                                                             │
│   ├── Action: "blackpinkk.style" 탭 클릭                                       │
│   ├── Assert: URL에 filter 파라미터                                            │
│   └── Assert: 해당 계정 이미지만 표시                                          │
│                                                                                  │
│   Step 3: 상세 진입                                                             │
│   ├── Action: 첫 번째 카드 클릭                                                │
│   ├── Assert: 상세 모달/페이지 표시                                            │
│   └── Assert: URL 변경 (/images/[id])                                          │
│                                                                                  │
│   Step 4: 아이템 확인                                                           │
│   ├── Assert: 아이템 카드 표시                                                  │
│   └── Assert: 가격 정보 표시                                                   │
│                                                                                  │
│   Step 5: (Future) 구매 링크 클릭                                              │
│   ├── Action: "Buy" 버튼 클릭                                                  │
│   └── Assert: 새 탭에서 외부 링크 오픈                                         │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**테스트 코드**:
```typescript
test('E2E-01: Discovery to Purchase Flow', async ({ page, context }) => {
  // Step 1: 홈 로딩
  await page.goto('/');
  await expect(page.locator('[data-testid="image-card"]')).toHaveCount({ min: 50 });
  await expect(page.locator('[data-testid="filter-tabs"]')).toBeVisible();

  // Step 2: 필터 적용
  await page.click('[data-testid="filter-blackpinkk.style"]');
  expect(page.url()).toContain('filter=blackpinkk.style');

  // Step 3: 상세 진입
  await page.click('[data-testid="image-card"]:first-child');
  await expect(page.locator('[data-testid="detail-content"]')).toBeVisible();
  expect(page.url()).toMatch(/\/images\/[a-zA-Z0-9-]+/);

  // Step 4: 아이템 확인
  await expect(page.locator('[data-testid="item-card"]')).toBeVisible();
});
```

---

#### Flow 2: 검색 → 결과 → 상세

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      E2E-02: Search to Detail Flow                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   Step 1: 검색 입력                                                             │
│   ├── Action: 검색창에 "jisoo" 입력                                            │
│   └── Assert: 250ms 후 결과 업데이트                                           │
│                                                                                  │
│   Step 2: 결과 확인                                                             │
│   ├── Assert: 검색 결과 표시                                                   │
│   └── Assert: (Future) 결과 수 표시                                            │
│                                                                                  │
│   Step 3: 상세 진입                                                             │
│   ├── Action: 검색 결과 카드 클릭                                              │
│   └── Assert: 상세 페이지 표시                                                 │
│                                                                                  │
│   Step 4: 뒤로가기                                                              │
│   ├── Action: 브라우저 뒤로가기                                                │
│   └── Assert: 검색 결과 유지                                                   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

#### Flow 3: 모바일 상세 플로우

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       E2E-03: Mobile Detail Flow                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   Viewport: 375 x 812 (iPhone X)                                                │
│                                                                                  │
│   Step 1: 모바일 홈 로딩                                                        │
│   ├── Assert: 1열 레이아웃                                                      │
│   └── Assert: 풀 너비 카드                                                      │
│                                                                                  │
│   Step 2: 카드 탭                                                               │
│   ├── Action: 카드 터치                                                         │
│   └── Assert: 풀페이지 상세 (모달 아님)                                        │
│                                                                                  │
│   Step 3: 스크롤 탐색                                                           │
│   ├── Action: 아이템 영역으로 스크롤                                           │
│   └── Assert: 아이템 카드 표시                                                 │
│                                                                                  │
│   Step 4: 뒤로가기                                                              │
│   ├── Action: 브라우저 뒤로가기 제스처                                         │
│   └── Assert: 홈으로 복귀                                                       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. 비주얼 리그레션 테스트

### 4.1 핵심 비주얼 테스트

| ID | 화면 | 설명 | 상태 |
|----|------|------|------|
| VIS-01 | Home (Desktop) | Masonry 그리드 레이아웃 | ⬜ |
| VIS-02 | Home (Mobile) | 1열 카드 레이아웃 | ⬜ |
| VIS-03 | Detail Modal | 스플릿 뷰 레이아웃 | ⬜ |
| VIS-04 | Detail Page | 풀페이지 레이아웃 | ⬜ |
| VIS-05 | Empty State | 결과 없음 상태 | ⬜ |
| VIS-06 | Error State | 에러 상태 | ⬜ |
| VIS-07 | Loading State | 스켈레톤 UI | ⬜ |

---

## 5. 성능 테스트

### 5.1 성능 메트릭

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| LCP | <2.5s | Lighthouse CI |
| FID | <100ms | Web Vitals |
| CLS | <0.1 | Web Vitals |
| TTI | <3.8s | Lighthouse CI |
| 초기 로드 | <3s | E2E timing |

### 5.2 성능 테스트 시나리오

```typescript
test('PERF-01: Initial page load time', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/');
  await page.waitForSelector('[data-testid="image-card"]');
  const loadTime = Date.now() - startTime;

  expect(loadTime).toBeLessThan(3000); // 3초 이내
});

test('PERF-02: Infinite scroll performance', async ({ page }) => {
  await page.goto('/');

  // 5번 스크롤 테스트
  for (let i = 0; i < 5; i++) {
    const startTime = Date.now();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    const scrollTime = Date.now() - startTime;

    expect(scrollTime).toBeLessThan(1000); // 스크롤당 1초 이내
  }
});
```

---

## 6. 테스트 데이터 설정

### 6.1 Mock 데이터

```typescript
// __tests__/fixtures/images.ts
export const mockImages = [
  {
    id: 'test-image-1',
    imageUrl: 'https://example.com/image1.jpg',
    postAccount: 'blackpinkk.style',
    withItems: true,
    items: [
      { id: 1, productName: 'Test Item', price: '₩100,000', center: [0.5, 0.5] }
    ]
  },
  // ...
];
```

### 6.2 테스트 환경 설정

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './__tests__/e2e',
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'yarn dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 관련 문서

- [../performance/guide.md](../performance/guide.md) - 성능 가이드
- [../../specs/feature-spec/workflows.md](../../specs/feature-spec/workflows.md) - 워크플로우
- [../architecture/README.md](../architecture/README.md) - 시스템 아키텍처
