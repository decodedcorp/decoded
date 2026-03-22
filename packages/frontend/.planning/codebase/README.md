# Codebase Documentation

**Project**: decoded-app
**Analysis Date**: 2026-01-23
**Focus**: 현재 코드베이스 분석 (AI 자동 생성)

## 관련 문서

| 유형 | 위치 | 설명 |
|------|------|------|
| **코드 분석 (현재)** | `.planning/codebase/` | 이 폴더 - AI 생성 |
| **설계 의도** | `specs/` | 기능 명세 및 화면 설계 |
| **구현 문서** | `docs/` | 구현된 API, 스키마, 가이드 |
| **빠른 참조** | `CLAUDE.md` | 프로젝트 개요 및 진입점 |

---

## Documents Generated

### 1. CONVENTIONS.md (17 KB)
Comprehensive guide to code style, patterns, and standards across the codebase.

**Sections**:
- TypeScript & ESLint configuration (strict mode, ESLint 9 flat config, Prettier)
- Naming conventions (files, variables, types, interfaces)
- File organization and directory structure
- Component patterns (memo, forwardRef, skeleton components, CVA UI system)
- State management (Zustand store patterns with selectors)
- Error handling (query layer, validation, React Query)
- Documentation standards (JSDoc, inline comments, commit messages)
- Summary checklist for code quality

**Key Files Referenced**:
- `packages/web/tsconfig.json` - TypeScript strict mode
- `packages/web/eslint.config.mjs` - ESLint 9 flat config
- `packages/web/.prettierrc` - Code formatting rules
- `packages/web/lib/stores/authStore.ts` - Zustand pattern example
- `packages/web/lib/components/FeedCard.tsx` - Component pattern example

---

### 2. TESTING.md (21 KB)
Complete testing framework documentation with patterns for all test types.

**Sections**:
- Testing stack overview (Playwright for E2E, recommendations for unit/component testing)
- Test structure and organization in `__tests__/` directory
- E2E testing with Playwright (configuration, existing test suite, patterns)
- Test patterns by type:
  - E2E tests (full flow, AAA pattern)
  - Unit tests (utilities with Vitest)
  - Store tests (Zustand patterns)
  - Hook tests (React Query patterns)
  - Component tests (React Testing Library patterns)
- Mocking strategies (MSW, Supabase, Zustand, React Query)
- Coverage goals and recommended targets
- Setup instructions for testing framework

**Key Files Referenced**:
- `__tests__/e2e/scroll-animation.spec.ts` - Existing E2E test suite (271 lines)
- `packages/web/lib/utils/validation.ts` - Validation utility examples
- `packages/web/lib/stores/authStore.ts` - Store pattern examples

**Current Status**:
- Playwright: Configured via `@playwright/test` (test suite exists)
- Unit Testing: Not yet configured (Jest/Vitest)
- Component Testing: Not yet configured (React Testing Library)
- **Action**: Add `test` and `test:*` scripts to package.json

---

## Analysis Methodology

### Tools & Exploration
- ESLint configuration: `eslint.config.mjs` (flat config, ESLint 9.39.1)
- Prettier formatting: `.prettierrc` with 80-char print width
- TypeScript: Strict mode enabled in `tsconfig.json`
- Test framework: Playwright discovered in `__tests__/e2e/`

### File Coverage
- **33 TypeScript/TSX files** analyzed from `lib/` directory
- **Core patterns studied**:
  - 9 Zustand stores (authStore, filterStore, requestStore, etc.)
  - 5 custom React hooks (usePosts, useImageUpload, useCategories, etc.)
  - 15+ component implementations (FeedCard, buttons, UI components)
  - Supabase query layer (posts, images, queries with .server.ts suffix)
  - Utility functions (validation, compression, formatting, color utils)

### Conventions Identified
1. **Naming**: PascalCase components, camelCase hooks/stores, UPPER_SNAKE_CASE configs
2. **Structure**: Layered by concern (components, hooks, stores, supabase, utils)
3. **Error Handling**: Try-catch in stores, graceful fallbacks in queries, validation results
4. **Documentation**: JSDoc for public functions, file headers explaining patterns
5. **Testing**: Playwright E2E suite with AAA pattern, no unit tests yet

---

## Quality Checklist

### Code Style
- [x] TypeScript strict mode enabled
- [x] ESLint configured (flat config, ESLint 9)
- [x] Prettier enforced (80 char width, semicolons, double quotes)
- [x] Naming conventions consistent
- [x] File organization logical

### Testing
- [x] E2E tests present (Playwright)
- [ ] Unit tests framework configured
- [ ] Component tests framework configured
- [ ] Coverage targets defined
- [ ] Mocking strategies documented

### Error Handling
- [x] Query layer has graceful fallbacks
- [x] Zustand stores handle async errors
- [x] Validation utilities return structured results
- [x] Development-only logging

### Documentation
- [x] JSDoc comments on public functions
- [x] File headers explaining purpose
- [ ] Inline comments explaining "why"
- [x] Conventional Commits format referenced

---

## Next Steps (Recommendations)

### Priority 1: Add Unit Testing
```bash
yarn add -D vitest @testing-library/react @testing-library/user-event msw
# Create vitest.config.ts
# Add test scripts to package.json
```

### Priority 2: Test Critical Paths
1. **Auth Store** - OAuth, session management
2. **Validation Utils** - File uploads, input validation
3. **Query Layer** - Supabase data access

### Priority 3: E2E Coverage Expansion
- Add tests for login flow
- Add tests for form submissions
- Add tests for error states

### Priority 4: Coverage Metrics
- Set up coverage reporting in CI/CD
- Target 70%+ statement coverage
- Focus on critical paths first

---

## Document Stats

| Document | Size | Lines | Focus |
|----------|------|-------|-------|
| CONVENTIONS.md | 17 KB | ~520 | Code style, patterns, file organization |
| TESTING.md | 21 KB | ~630 | Test frameworks, patterns, mocking |

**Total**: 38 KB of comprehensive quality documentation

