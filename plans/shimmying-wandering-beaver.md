# Plan: Tech Debt Cleanup - Design System Consolidation

## Context

v2.1 design system 구축 과정에서 15개 컴포넌트가 design-system에 만들어졌지만 실제 페이지에 통합되지 않음 (orphaned). 5개는 커스텀 버전이 별도로 존재하는 중복 상태. 안전한 것부터 정리하고, 위험한 것은 보류.

## Scope

**실행 (P1-P3):**
1. BottomSheet 통합 - 1개 소비자, design-system 버전이 상위호환
2. StepIndicator 통합 - 2개 소비자, 직접 교체 가능
3. LoadingSpinner 적용 - 인라인 스피너를 design-system으로 교체

**보류:**
- Auth 컴포넌트 (OAuthButton, LoginCard) - 비즈니스 로직 내장, 리스크 높음
- StatCard - motion 애니메이션 차이
- ArtistCard, LeaderItem, Badge, RankingItem - 현재 적용 대상 없거나 인터페이스 불일치
- Tag, ActionButton, Hotspot - 향후 사용 대비 보관

---

## Step 1: BottomSheet 통합

**변경 파일:**
- `lib/components/request/MobileDetectionLayout.tsx` - import 교체
- `lib/components/ui/BottomSheet.tsx` - 삭제

**방법:** ui/BottomSheet import를 design-system BottomSheet로 교체. design-system 버전이 onClose, title, backdrop, ARIA, Escape 키까지 모두 지원하는 상위호환.

---

## Step 2: StepIndicator 통합

**변경 파일:**
- `lib/components/request/RequestModal.tsx` - import 교체
- `lib/components/request/RequestFlowHeader.tsx` - import 교체
- `lib/components/request/StepProgress.tsx` - import 교체 (if uses custom)
- `lib/design-system/step-indicator.tsx` - xs 사이즈 추가 (h-2 w-2)
- `lib/components/request/StepIndicator.tsx` - 삭제

**방법:** design-system StepIndicator에 xs 사이즈 변형 추가 후, request 컴포넌트들의 import를 교체.

---

## Step 3: LoadingSpinner 적용

**변경 파일:**
- `app/explore/ExploreClient.tsx` - 인라인 스피너를 LoadingSpinner로 교체
- 기타 인라인 스피너가 있는 페이지

**방법:** 인라인 `animate-spin rounded-full border` 패턴을 design-system LoadingSpinner로 교체.

---

## Verification

1. `yarn build` - 빌드 성공 확인
2. `yarn lint` - 린트 통과
3. 삭제된 파일의 import가 남아있지 않은지 grep 확인
