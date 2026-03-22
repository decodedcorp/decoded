# Visual QA Screenshots

**Generated:** 2026-02-12
**Reference:** docs/design-system/decoded.pen
**Test Automation:** packages/web/tests/visual-qa.spec.ts

이 문서는 v2.0 디자인 시스템 구현이 decoded.pen 디자인 참조와 일치하는지 검증하기 위한 시각적 QA 스크린샷을 포함합니다.

**Total Screenshots:** 40 (4 viewports × 10 pages)

## Breakpoints Tested

| Name | Width | Height | Device |
|------|-------|--------|--------|
| Mobile | 375px | 812px | iPhone 13 Pro |
| Tablet | 768px | 1024px | iPad |
| Desktop | 1280px | 800px | Standard Desktop |
| Desktop LG | 1440px | 900px | Large Desktop |

## Pages Captured

| Page | Mobile | Tablet | Desktop | Desktop LG |
|------|--------|--------|---------|------------|
| Home | [mobile-home.png](./mobile-home.png) | [tablet-home.png](./tablet-home.png) | [desktop-home.png](./desktop-home.png) | [desktop-lg-home.png](./desktop-lg-home.png) |
| Explore | [mobile-explore.png](./mobile-explore.png) | [tablet-explore.png](./tablet-explore.png) | [desktop-explore.png](./desktop-explore.png) | [desktop-lg-explore.png](./desktop-lg-explore.png) |
| Feed | [mobile-feed.png](./mobile-feed.png) | [tablet-feed.png](./tablet-feed.png) | [desktop-feed.png](./desktop-feed.png) | [desktop-lg-feed.png](./desktop-lg-feed.png) |
| Search | [mobile-search.png](./mobile-search.png) | [tablet-search.png](./tablet-search.png) | [desktop-search.png](./desktop-search.png) | [desktop-lg-search.png](./desktop-lg-search.png) |
| Profile | [mobile-profile.png](./mobile-profile.png) | [tablet-profile.png](./tablet-profile.png) | [desktop-profile.png](./desktop-profile.png) | [desktop-lg-profile.png](./desktop-lg-profile.png) |
| Login | [mobile-login.png](./mobile-login.png) | [tablet-login.png](./tablet-login.png) | [desktop-login.png](./desktop-login.png) | [desktop-lg-login.png](./desktop-lg-login.png) |
| Request Upload | [mobile-request-upload.png](./mobile-request-upload.png) | [tablet-request-upload.png](./tablet-request-upload.png) | [desktop-request-upload.png](./desktop-request-upload.png) | [desktop-lg-request-upload.png](./desktop-lg-request-upload.png) |
| Images | [mobile-images.png](./mobile-images.png) | [tablet-images.png](./tablet-images.png) | [desktop-images.png](./desktop-images.png) | [desktop-lg-images.png](./desktop-lg-images.png) |
| Request | [mobile-request.png](./mobile-request.png) | [tablet-request.png](./tablet-request.png) | [desktop-request.png](./desktop-request.png) | [desktop-lg-request.png](./desktop-lg-request.png) |
| Request Detect | [mobile-request-detect.png](./mobile-request-detect.png) | [tablet-request-detect.png](./tablet-request-detect.png) | [desktop-request-detect.png](./desktop-request-detect.png) | [desktop-lg-request-detect.png](./desktop-lg-request-detect.png) |

## Findings

### Review Completed: 2026-02-12

**Status:** Approved with caveats
**Reviewer:** Human (orchestrator)
**Reviewed:** 40 screenshots (4 viewports × 10 pages)

**Context:** API was down during screenshot capture, preventing full pixel-perfect comparison against decoded.pen design reference. Pages that successfully loaded (explore, login, request-upload) showed correct responsive layouts.

#### Issues Identified

##### 1. Images Page - Raw JSON Error Exposure (Major - UX/Security)
- **Issue**: Images page (`/images`) exposes raw Supabase/PostgREST JSON error details (PGRST205, table names, hint messages) to users instead of a friendly error message.
- **Severity**: Major
- **Category**: API error handling (not design/CSS)
- **Status**: Deferred to separate quick task
- **Reason**: This is an API error handling issue, not a visual design issue. The v2-09-03 plan focuses on CSS/layout visual QA.
- **Files Affected**: TBD in quick task (likely `app/images/page.tsx` or API client error handling)
- **Recommendation**: Implement user-friendly error messages for API failures (e.g., "Unable to load images. Please try again later.")

##### 2. Next.js Dev Overlay Badge (Minor - Dev Only)
- **Issue**: "14 Issues" badge visible on images page in dev mode
- **Severity**: Minor
- **Category**: Development artifact
- **Status**: Not applicable (dev mode only, not production)

##### 3. Mobile Bottom Nav Loading Text (Minor - Dev Only)
- **Issue**: "Compiling..." text visible on mobile bottom navigation
- **Severity**: Minor
- **Category**: Development artifact
- **Status**: Not applicable (dev mode only, not production)

#### Visual QA Results

**Responsive Layouts:** ✓ Correct on pages that loaded (explore, login, request-upload)
- Mobile (375px): Layouts correctly adapt
- Tablet (768px): Grid columns adjust appropriately
- Desktop (1280px, 1440px): Full desktop layouts render properly

**Design System Compliance:** ✓ Observed on loaded pages
- Typography sizing and hierarchy consistent
- Spacing and padding follow design tokens
- Color usage matches design system

**Deferred:**
- Full pixel-perfect comparison against decoded.pen (API down prevented complete page loading)
- Comprehensive cross-page consistency check (API dependency blocked several pages)

### Next Steps

1. **Quick Task**: Fix images page raw JSON error exposure (API error handling)
2. **Future QA**: Re-run visual QA when API is available for complete verification

## Test Automation

스크린샷은 Playwright로 자동화되어 있으며, 언제든지 재생성할 수 있습니다.

### Prerequisites
```bash
# Playwright 브라우저 설치 (최초 1회)
cd packages/web
yarn playwright install chromium
```

### Regeneration
```bash
# 개발 서버 시작
yarn dev:web

# 다른 터미널에서 테스트 실행
cd packages/web
yarn playwright test tests/visual-qa.spec.ts
```

### Test Configuration
- **Config:** packages/web/playwright.config.ts
- **Test:** packages/web/tests/visual-qa.spec.ts
- **Output:** docs/qa-screenshots/

## Notes

- 모든 스크린샷은 full-page 캡처로 생성됩니다 (전체 페이지 스크롤 포함)
- 각 페이지는 networkidle 상태를 기다린 후 500ms 추가 대기하여 애니메이션이 완료되도록 합니다
- Search 페이지는 `?q=dress` 쿼리 파라미터로 검색 결과 상태를 캡처합니다
- 스크린샷 파일명 형식: `{viewport}-{page}.png`
