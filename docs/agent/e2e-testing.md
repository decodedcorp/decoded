---
title: E2E Testing — Agent Reference
owner: human
status: approved
updated: 2026-04-17
tags: [agent, testing]
---

# E2E Testing — Agent Reference

Playwright 기반 E2E 테스트. 로컬 CI (pre-push hook) 및 수동 실행으로 프론트엔드 핵심 플로우를 검증한다.

## 실행 방법

```bash
# 사전: 로컬 서버 실행
just local-fe          # 터미널 A (localhost:3000)

# 전체 테스트
just e2e

# 특정 테스트만
just e2e-only "content"

# pre-push hook에서 E2E 포함
RUN_E2E=1 git push
```

## 테스트 인프라

### 인증

- `auth.setup.ts`가 Supabase `signInWithPassword()`로 세션을 획득하고 `storageState.json`에 저장
- 인증 필요 테스트는 이 state를 재사용 (매 실행마다 로그인하지 않음)
- 필수 env: `TEST_USER_EMAIL`, `TEST_USER_PASSWORD` (`.env.local`)

### 프로젝트 구조

| Project            | Auth   | 포함 Spec                | 용도             |
| ------------------ | ------ | ------------------------ | ---------------- |
| `setup`            | -      | `auth.setup.ts`          | 세션 획득        |
| `chromium`         | 인증됨 | 나머지 전부              | 핵심 플로우 검증 |
| `chromium-no-auth` | 미인증 | `login`, `api-migration` | 비로그인 UX      |

### API Mock

테스트는 실제 백엔드에 의존하지 않는다. `page.route()`로 API를 mock한다.

- `tests/helpers.ts` — 공통 mock (posts listing, post detail, feed, engagement)
- Mock 응답은 실제 `PostDetailResponse`, `PaginationMeta` 스키마와 동일한 형식

## Spec 파일 인벤토리

### 필수 통과 (핵심 사용자 플로우)

| Spec                          | 테스트 수 | 검증 항목                                                                        |
| ----------------------------- | --------- | -------------------------------------------------------------------------------- |
| `content-consumption.spec.ts` | 5         | Explore grid 로딩, 검색 입력, 정렬 드롭다운, 포스트 상세 (item cards), 피드 카드 |
| `content-creation.spec.ts`    | 3         | 업로드 DropZone 렌더, 스텝 프로그레스, 지원 포맷 표시                            |
| `engagement.spec.ts`          | 3         | 포스트 상세 item 카드, Shop the Look, 뒤로가기                                   |
| `navigation.spec.ts`          | 4         | 인증 후 메인/이미지/프로필/업로드 페이지 접근                                    |
| `login.spec.ts`               | 3         | 로그인 페이지 렌더, OAuth 버튼, admin 리다이렉트                                 |

### 보조 (품질 보장)

| Spec                    | 테스트 수 | 검증 항목                                                          |
| ----------------------- | --------- | ------------------------------------------------------------------ |
| `visual-qa.spec.ts`     | 40        | 4 viewport x 10 페이지 스크린샷 캡처 (assertion 없음, 시각 검증용) |
| `ai-pipeline.spec.ts`   | 4         | AI 업로드 파이프라인 (이미지 → 분석 → 스팟) mock                   |
| `api-migration.spec.ts` | 4         | 백엔드 API 마이그레이션 연기 검증, health check                    |

## 검증 기준 (CI 게이트)

### 반드시 통과해야 하는 것

1. **Explore 페이지 로딩** — `thiings-grid` 렌더
2. **검색 동작** — 입력 후 값 유지
3. **포스트 상세** — `item-detail-card` 표시
4. **피드 로딩** — `feed-grid` + `feed-card` 표시
5. **업로드 페이지** — DropZone + file input 존재
6. **인증 후 네비게이션** — `/profile`, `/images` 리다이렉트 없이 접근

### 허용되는 실패 (로컬 환경 의존)

- `api-migration.spec.ts` — backend health check (`localhost:8000` 미실행 시)
- `ai-pipeline.spec.ts` — 이미지 업로드 후 user-type prompt (HMR/타이밍 이슈)
- `login.spec.ts` — DecodedLogo 에러 오버레이 (dev 모드 에러)

### pre-push 동작

```
RUN_E2E=1 git push
```

- `pre-push.sh`의 Step 5에서 `bunx playwright test` 실행
- **하나라도 실패하면 push 차단**
- 기본 off — `RUN_E2E=1` 환경변수로 활성화

## data-testid 맵

테스트에서 사용하는 `data-testid` 속성 목록.

| testid                 | 컴포넌트                | 용도                         |
| ---------------------- | ----------------------- | ---------------------------- |
| `thiings-grid`         | ThiingsGrid             | Explore/피드 그리드 컨테이너 |
| `thiings-grid-item`    | ThiingsGrid             | 그리드 개별 아이템           |
| `explore-search-input` | ExploreClient           | 검색 입력 필드               |
| `explore-sort-select`  | ExploreClient           | 정렬 드롭다운                |
| `feed-grid`            | VerticalFeed            | 피드 그리드 컨테이너         |
| `feed-card`            | FeedCard                | 피드 개별 카드               |
| `like-button`          | FeedCard, SocialActions | 좋아요 버튼                  |
| `save-button`          | SocialActions           | 저장 버튼                    |
| `upload-dropzone`      | DropZone                | 업로드 영역                  |
| `image-detail-modal`   | ImageDetailModal        | 포스트 상세 모달             |
| `image-detail-image`   | ImageDetailModal        | 상세 이미지                  |
| `image-detail-close`   | ImageDetailModal        | 모달 닫기                    |
| `item-detail-card`     | ItemDetailCard          | 아이템 카드                  |
| `item-adopt-button`    | TopSolutionCard         | 솔루션 채택                  |
| `item-solutions-list`  | OtherSolutionsList      | 솔루션 목록                  |

## 새 테스트 추가 가이드

1. `packages/web/tests/`에 `.spec.ts` 파일 생성
2. 인증 필요 시 `chromium` project에서 자동 실행 (별도 설정 불필요)
3. 미인증 테스트는 `playwright.config.ts`의 `chromium-no-auth.testMatch`에 추가
4. API mock은 `helpers.ts`의 `mockContentAPIs()` / `mockEngagementAPIs()` 재사용
5. 새 컴포넌트 대상이면 `data-testid` 추가 (위 맵 참조)

## 관련

- 이슈 [#162](https://github.com/decodedcorp/decoded/issues/162) — E2E 커버리지 확대 로드맵
- 이슈 [#168](https://github.com/decodedcorp/decoded/issues/168) — 30% 커버리지 + pre-push 강제
