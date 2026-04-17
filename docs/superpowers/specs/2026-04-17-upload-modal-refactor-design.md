---
title: "Upload Modal 재정의 — Intercepting Routes 통합 + Hook/Composition Seam"
owner: human
status: draft
updated: 2026-04-17
tags:
  - ui
  - architecture
---

# Upload Modal 재정의 — Intercepting Routes 통합 + Hook/Composition Seam

**Issue:** [#145](https://github.com/decodedcorp/decoded/issues/145)
**Date:** 2026-04-17
**Status:** Design v2 (critic + architect reviewed — awaiting final user review → writing-plans)
**Revision:** v2 — reviewers' feedback incorporated (seam redesign, store scoping, shell decoupling, mobile regression handled in-scope, PR #230 superseded)

---

## 1. 목표

`/request/upload` 페이지의 업로드 동작(드롭존 → 이미지 편집 → userKnowsItems 분기 → Spot 마킹 → 솔루션/메타데이터 입력 → POST)을 모달로만 이용 가능하게 재구성하되,

- 직접 URL 진입·새로고침·링크 공유 시에는 풀페이지가 렌더되어 SEO·딥링크 호환을 유지하고,
- 앱 내부 네비게이션(홈/피드의 "Upload" 버튼)에서 진입 시에는 Next.js 16 **intercepting + parallel routes**가 현재 페이지(배경)를 유지한 채 모달을 띄운다.

Instagram/Dribbble/Figma 업로드 모달과 동일한 UX.

## 2. 현재 상태 (Why)

업로드 플로우에 **세 가지 구현이 공존**하고 있다.

| #   | 위치                                                                                           | 렌더 방식                                      | 보유 기능                                                                                                                           | 결함                                        |
| --- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 1   | `app/request/upload/page.tsx` (~551 lines)                                                     | 풀페이지                                       | Draft save/restore, Image editor(Crop), userKnowsItems 분기, 이미지 압축, 2가지 POST API (직접 호출), Retry UI, MobileUploadOptions | 단일 진입점 (URL만)                         |
| 2   | `app/@modal/(.)request/upload/page.tsx` (~398 lines)                                           | intercepting 모달                              | userKnowsItems 분기, 2가지 POST API, 이미지 압축                                                                                    | Draft/Editor/Retry/MobileUploadOptions 누락 |
| 3   | `lib/components/request/RequestModal.tsx` (~305 lines, SmartNav+Sidebar에서 `useState`로 호출) | 로컬 state 모달, 모바일은 portal로 full-screen | 껍데기 (DetailsStep만)                                                                                                              | 기능 대부분 누락, URL 무관                  |

인프라(`RequestFlowModal` shell + `{modal}` parallel slot)는 이미 있으나 #1/#2의 UI·로직 중복, #3의 잔재, SmartNav/Sidebar의 state 기반 호출이 혼재.

### 중요: 정확한 사실 확인

- `app/request/upload/page.tsx`는 **`useCreatePost` hook을 사용하지 않는다.** `lib/api/posts`의 `createPostWithFile`/`createPostWithFileAndSolutions`를 직접 호출한다. (`useCreatePost`는 `DetailsStep`에서만 사용 — 곧 dead code로 편입).
- `RequestFlowModal`은 `max-w-4xl` (모달 폭), `max-h-[90vh]`, GSAP 입장/퇴장 애니메이션, body scroll lock, ESC handler를 자체 처리. 데스크탑 전용 크기 스타일만 있고 모바일 브레이크포인트 분기 없음.
- `requestStore` (Zustand)는 **모듈-레벨 singleton**. 인스턴스 스코핑 없음.
- `app/layout.tsx`의 `{modal}` parallel slot은 이미 wiring되어 있으며 `(.)request/upload`, `(.)request/detect`, `(.)posts/[id]`, `(.)images` 4곳에서 사용 중.

## 3. Scope

### In scope

- **Seam 재설계**: `UploadFlow` 단일 컴포넌트 대신 **Hook + Composition** 조합 (`useUploadFlow` + `UploadFlowSteps` + `UploadFlowHeader` + `UploadFlowFooter`)로 분할. `mode` prop 금지.
- `app/request/upload/page.tsx`를 조립 래퍼로 전환 (Header + Steps + Footer).
- `app/@modal/(.)request/upload/page.tsx`를 모달 조립 래퍼로 전환 (`<RequestFlowModal onClose=…><UploadFlowSteps /></RequestFlowModal>` — 헤더/풋터는 shell/인라인).
- 구 `RequestModal.tsx` 삭제, SmartNav/Sidebar를 `router.push("/request/upload")`로 전환.
- `RequestFlowModal` 확장:
  - `maxWidth` prop 추가 (default `"4xl"`), upload는 `"6xl"` 전달. detect는 기존 동작 유지.
  - `onClose` prop 추가. shell은 애니메이션/scroll lock/ESC만 담당. 비즈니스 로직(`resetRequestFlow`, navigation)은 caller가 주입.
  - **모바일 break**: `sm` 미만에서는 full-screen 레이아웃 (모바일 회귀 방지).
- `requestStore` **flow-instance guard**: `activeInstanceId` 필드 + `resetIfActive(id)` 액션. `UploadFlowSteps` 마운트 시 ID 발급, unmount 시 reset. 다른 인스턴스의 reset 시도는 no-op.
- **PR #230 supersede**: 본 리팩터링이 `DetailsStep`을 삭제하므로, #230의 helper text 개선을 `MetadataInputForm` (실제 사용 경로) 쪽으로 재포팅하여 본 리팩터링에 포함. PR #230은 close as superseded.

### Out of scope (별도 이슈)

- `@modal/(.)request/detect/page.tsx` 내부 리팩터링 — 다만 `RequestFlowModal` prop 변경 영향 확인은 필수.
- ContextSelector 다중 선택 (백엔드 계약 확인 필요).
- Platform/Year/Title 자동완성·추천.
- Spot 드래그 재배치, 삭제 확인 UI.
- 솔루션 메타데이터 추출 피드백 강화.

## 4. 목표 아키텍처

### 컴포넌트/훅 맵

```
lib/components/request/
  useUploadFlow.ts          ← Hook. store 구독, draft 복원/저장, submit 로직, image editor state.
                              반환: { steps state, handlers, error/isSubmitting, instanceId }
  UploadFlowSteps.tsx       ← "Headless content". drop zone → userKnowsItems 분기 →
                              DetectionView+Spot 리스트 → MetadataInputForm/Solutions.
                              헤더/풋터 렌더하지 않음.
  UploadFlowHeader.tsx      ← 페이지 전용 헤더 (title, step indicator, close 버튼).
                              `RequestFlowHeader`를 얇게 래핑하거나 그대로 재사용.
  UploadFlowFooter.tsx      ← 페이지/모달 양쪽에서 쓰는 Post 버튼 + 에러/Retry UI.
                              모달에서는 footer를 Steps 내부에 인라인으로 렌더할지,
                              shell footer slot으로 뽑을지 구현 단계에서 결정.
                              (권장: Steps 마지막 요소로 인라인. shell은 chrome만 담당.)
  RequestFlowModal.tsx      ← (수정) Props: { children, onClose, maxWidth?, mobileFullScreen? }.
                              비즈니스 로직 제거. shell만.
```

### 라우트 조립

```
app/request/upload/page.tsx
  ↓ direct URL 진입
  <div className="h-[100dvh] flex flex-col">
    <UploadFlowHeader onClose={() => router.push("/")} />
    <UploadFlowSteps />
  </div>

app/@modal/(.)request/upload/page.tsx
  ↓ in-app 네비게이션 intercept
  <RequestFlowModal
    maxWidth="6xl"
    mobileFullScreen
    onClose={() => { resetFlowIfActive(); router.back(); }}
  >
    <UploadFlowSteps />
  </RequestFlowModal>
```

### 왜 mode prop이 아닌가

- **Prop 한계:** `mode`가 header/footer 분기 하나에서 시작해 scroll, padding, close 위치로 계속 확장됨. 조건 분기가 컴포넌트 내부에 누적.
- **3rd entry-point 확장성:** 향후 mobile FAB, 피드 인라인 embed 등 추가 진입점이 생기면 `mode: "modal"|"page"|"fab"|"embed"`식 enum 확장 필요. 조립 방식은 caller가 알아서 맞춤.
- **Testability:** hook + headless steps는 단위 테스트가 쉬움. mode-driven 컴포넌트는 테스트 분기 많음.
- **React 19 코드베이스 관행:** 이미 Zustand로 상태 공유. hook으로 로직 추출하는 패턴이 주류.

### requestStore 인스턴스 가드 (중요)

```ts
// requestStore.ts — 추가
interface RequestState {
  ...
  activeInstanceId: string | null;
  setActiveInstance: (id: string | null) => void;
  resetIfActive: (id: string) => void;
}

// UploadFlowSteps 내부
const instanceId = useId();
useEffect(() => {
  useRequestStore.getState().setActiveInstance(instanceId);
  return () => useRequestStore.getState().resetIfActive(instanceId);
}, [instanceId]);
```

`resetRequestFlow`는 유지하되 외부 호출처(close handler 등)는 `resetIfActive(myInstanceId)`를 사용. 중첩 mount 시 다른 인스턴스의 reset 시도가 no-op가 되어 store bleed 차단.

## 5. 파일 변경 계획

| 파일                                           | 동작                                     | 비고                                                                                                                                                            |
| ---------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/components/request/useUploadFlow.ts`      | **신규**                                 | Hook. 현재 page.tsx의 effect/handler/state 로직 (Draft, editor, submit) 전부 캡슐화                                                                             |
| `lib/components/request/UploadFlowSteps.tsx`   | **신규**                                 | Headless step UI + Post 버튼 + Retry UI (풋터 포함, shell은 chrome만)                                                                                           |
| `lib/components/request/UploadFlowHeader.tsx`  | **신규 또는 `RequestFlowHeader` 재사용** | 페이지 전용 헤더. 기존 `RequestFlowHeader` 재사용 가능하면 그대로, props만 맞추기                                                                               |
| `app/request/upload/page.tsx`                  | **수정 (얇게)**                          | `<Header/> + <Steps/>` 조립. ~551줄 → ~35줄                                                                                                                     |
| `app/@modal/(.)request/upload/page.tsx`        | **수정 (얇게)**                          | `<RequestFlowModal><Steps/></RequestFlowModal>` 조립. ~398줄 → ~25줄                                                                                            |
| `lib/components/request/RequestFlowModal.tsx`  | **수정**                                 | `maxWidth` prop, `onClose` prop, `mobileFullScreen` prop. close 핸들러에서 비즈니스 로직 제거                                                                   |
| `lib/components/request/RequestModal.tsx`      | **삭제**                                 | 사용처 SmartNav/Sidebar 전환 후 dead code                                                                                                                       |
| `lib/components/request/DetailsStep.tsx`       | **삭제**                                 | `RequestModal` 유일 사용처였음. 삭제 직전 grep으로 외부 참조 0 재확인                                                                                           |
| `lib/components/main-renewal/SmartNav.tsx`     | **수정**                                 | `RequestModal` import·마운트·`useState` 제거, 버튼 onClick → `router.push("/request/upload")`                                                                   |
| `lib/components/Sidebar.tsx`                   | **수정**                                 | 동일 — RequestModal 제거, `router.push("/request/upload")`                                                                                                      |
| `lib/components/request/MetadataInputForm.tsx` | **수정 (PR #230 콘텐츠 이식)**           | helper text for media type/artist/group 필드 — PR #230에서 Details 쪽에 추가했던 개선을 이쪽으로 이식                                                           |
| `lib/stores/requestStore.ts`                   | **수정**                                 | `activeInstanceId` 필드, `setActiveInstance`, `resetIfActive` 액션 추가                                                                                         |
| `app/@modal/(.)request/detect/page.tsx`        | **검증만**                               | `RequestFlowModal`의 새 prop 시그니처 호환 확인 (default = 4xl, mobileFullScreen 기본 false → 기존과 동일). 코드 변경 없이 PR 단계에서 visual regression만 체크 |

## 6. 데이터·상태 흐름

### 진입 및 제출

1. "Upload" 버튼 → `router.push("/request/upload")`.
2. 앱 내부 네비면 Next.js가 `@modal/(.)request/upload/page.tsx`를 `{modal}` slot에 렌더. 배경의 `{children}`은 그대로.
3. `RequestFlowModal`이 `<UploadFlowSteps />`를 children으로 받음.
4. `UploadFlowSteps` 마운트 시 `useUploadFlow` hook 호출. 내부에서:
   - `useId()`로 `instanceId` 발급.
   - `setActiveInstance(instanceId)`.
   - `loadDraft()` + (세션당 1회) 복원 toast.
   - store effect들 구독.
5. 사용자가 업로드 → 분기 → 마킹 → 입력 → Post.
6. `useUploadFlow.submit()` 실행:
   - `compressImage` → `createPostWithFile[AndSolutions]` 직접 호출 (기존 page.tsx 패턴 유지).
   - 성공: `clearDraft` + `useRequestStore.getState().resetIfActive(instanceId)` + `router.push("/posts/{id}")`.
   - 실패: `setSubmitError`, Retry UI 노출.
7. `RequestFlowModal.onClose` 호출 (caller 주입):
   - `useRequestStore.getState().resetIfActive(instanceId)` + `router.back()` (fallback `router.push("/")`).

### 동시 mount 대응 (store bleed 차단)

- 사용자가 `/request/upload`에 direct URL로 진입 → 풀페이지 `UploadFlowSteps` 마운트, `activeInstanceId=A`.
- 그 상태에서 앱 내부 링크 클릭 → intercept 불가 (이미 해당 URL에 있음). 시나리오 없음.
- 대안 시나리오: 어떤 이유로 두 인스턴스가 동시 mount → 나중 mount가 `setActiveInstance(B)`로 덮음 → A의 unmount cleanup이 `resetIfActive(A)` 호출해도 현재 active=B라 no-op. B만 정상 동작.

### Draft 처리

- Draft 복원 toast는 `sessionStorage.getItem("draftToastShown")` 체크. 세션당 1회만 노출.
- `resetFlow`/submit 성공 시 `clearDraft()` + sessionStorage 플래그 해제.

## 7. 엣지 케이스 / 주의점

1. **URL 직접 진입 vs 인터셉트 진입 시각 차이**
   - Direct: 풀페이지 (h-[100dvh]).
   - Intercept: 모달 (max-w-6xl + 배경 backdrop).
   - 사용자 혼란 최소화: 닫기 시 URL 이전 경로 복귀, 새로고침 시 풀페이지 전환. QA에서 확인.

2. **모바일 회귀 차단 (반드시)**
   - 현재 `RequestModal`(사용 종료 예정)이 모바일에서 portal로 full-screen.
   - `RequestFlowModal`에 `mobileFullScreen` prop을 신설 (default `false`). upload intercept는 `true` 지정.
   - `sm` 미만에서 `rounded-none`, `max-w-none`, `max-h-none`, `h-[100dvh]`, `w-full` 적용. 데스크탑(`sm`+) 기존 동작 유지.
   - `detect` 모달은 prop 명시 안 하므로 기본 false → 기존 그대로. 별도 이슈에서 결정.

3. **ImageEditor(Crop) 중첩 모달**
   - `RequestFlowModal` 이미 `z-[10000]` + body scroll lock.
   - `ImageEditor`도 portal render + `z-[10100]` 적용.
   - 스크롤 잠금: body overflow는 하나만 잠그면 됨. `ImageEditor` mount 시 중복 잠금 방지 위해 `useBodyScrollLock` 공용 hook 도입 (counter 기반 — nested locks는 count 증가, unlock 시 감소, 0에서만 해제).
   - ESC 핸들러 경합: `RequestFlowModal`은 자체 ESC로 close. `ImageEditor` 활성화 시 event `stopPropagation` 또는 `RequestFlowModal`이 ESC listener를 `editorOpen`일 때 무시 (이벤트 버스 or context로 통보).

4. **history.length 체크의 한계**
   - 현재 `window.history.length > 1`은 cross-origin 엔트리까지 포함되어 신뢰할 수 없음 (기존 코드의 미해결 이슈).
   - 대안: `document.referrer`가 같은 origin인지 확인 or `router.back()` + fallback timer. 완벽한 솔루션은 Next.js router 내부 state 필요하지만 제공되지 않음.
   - 본 PR에서는 기존 방식 유지 + TODO 코멘트 남김. 별도 tech-debt 이슈.

5. **직접 URL 진입 후 뒤로가기**
   - 사용자가 탭 오픈 → URL 직접 입력 → 업로드 중 뒤로가기 → 원래 세션이 없어 홈으로.
   - `router.back()` fallback `router.push("/")` 이미 대응.

6. **Zustand persist 미적용**
   - 현재 store는 in-memory만. 새로고침 시 전부 초기화, draft만 offlineDraft에 저장.
   - 이번 PR에서도 동일 유지 (persist는 out of scope).

## 8. 테스트 계획

### E2E (Playwright)

1. **In-app intercept + upload end-to-end**
   - 홈 → Sidebar "Upload" 클릭 → URL 변경, 배경에 홈 피드 보임 (스크린샷).
   - 이미지 업로드 → "No, I'm curious" → Spot 1개 → Post.
   - `/posts/{id}` 리다이렉트.

2. **Direct URL → 풀페이지**
   - 새 탭 `/request/upload` → 풀페이지 렌더, 배경 없음.
   - 동일 플로우 성공.

3. **모바일 (iPhone SE 375, iPad Mini 768)**
   - Sidebar tap → intercept 모달이 **full-screen** (data-mobile-fullscreen 속성 또는 스크린샷).
   - 데스크탑 뷰포트에서는 centered max-w-6xl.

4. **Draft 복원**
   - 이미지 + Spot 1개 → 탭 새로고침 → 복원 toast → Restore → 상태 복원.
   - 세션 내 두 번째 새로고침 시 toast 중복 노출 없음.

5. **닫기 — store bleed 방어**
   - Direct URL 풀페이지 mount 중 개발자 툴로 강제 두 번째 인스턴스 mount 시도 → 기존 인스턴스 상태 유지 확인 (store guard 작동).
   - 일반 사용자 시나리오 아님, 방어선 검증용.

6. **PR-level visual regression**
   - `/request/detect` intercept 모달이 기존 크기/레이아웃 유지 (RequestFlowModal prop 기본값 확인).

### Unit / 컴포넌트

- `useUploadFlow` hook: initial state, draft load, submit success/error paths (mocked API).
- `useBodyScrollLock` counter 동작 (nested lock/unlock).
- `requestStore`: `setActiveInstance`/`resetIfActive`의 guard 조건.
- `UploadFlowSteps` 렌더: 각 단계 UI presence (image 없음 / userKnowsItems 분기 / spots 추가 후).

### Manual QA (pre-merge)

- [ ] 홈/피드/프로필/에디토리얼 각 페이지에서 Sidebar upload → 배경 유지.
- [ ] 모바일 뷰포트에서 full-screen 모달.
- [ ] Crop → 저장 → 업로드 이어짐.
- [ ] Draft 자동 저장 → 재진입 시 복원.
- [ ] POST 실패 → Retry 버튼.
- [ ] "I have links" 분기: 모든 spot 링크 입력 전 Post 비활성.
- [ ] SmartNav + Sidebar 각 진입점 정상 intercept.
- [ ] `/request/detect` 모달 시각 regression 없음.

## 9. 롤아웃 / 배포

### PR 분리 (권장, 안전한 중간 상태 보장)

1. **PR-1 — Shell 확장 먼저**: `RequestFlowModal`에 `maxWidth`, `onClose`, `mobileFullScreen` prop 추가. **기본값은 기존 동작과 동일** (4xl, undefined→내부 처리, false). `@modal/(.)request/upload`와 `@modal/(.)request/detect` 모두 기존 코드 그대로 동작. visual diff 0.
2. **PR-2 — Hook + headless Steps 추출**: `useUploadFlow`, `UploadFlowSteps` 신규. `app/request/upload/page.tsx`만 조립으로 전환 (intercept modal은 그대로 둠). 풀페이지 기능 변경 0.
3. **PR-3 — Modal 조립 전환**: `app/@modal/(.)request/upload/page.tsx`를 `<RequestFlowModal onClose=… maxWidth="6xl" mobileFullScreen><UploadFlowSteps/></RequestFlowModal>`로 교체. 이 PR부터 모달이 풀 기능(Draft/Editor/Retry) 획득.
4. **PR-4 — 구 경로 정리**: `RequestModal`, `DetailsStep` 삭제. SmartNav/Sidebar를 `router.push`로 전환. `requestStore`에 `activeInstanceId` guard 추가. `MetadataInputForm`에 helper text 이식 (PR #230 supersede).

각 PR 모두 dev에 독립 머지 가능. PR-2 rollback 시 풀페이지만 영향(인터셉트는 이미 기존 코드). PR-3 rollback 시 모달이 기존 기능-gap 상태로 복귀(시스템 동작 유지, 기능만 부족).

**단일 PR 대안**: 리뷰어 재량. 기본은 분리.

### PR #230 처리

- 본 리팩터링이 `DetailsStep`을 제거하므로 PR #230의 helper text가 닿는 경로가 소멸.
- 조치: **PR #230 close as superseded** + #230의 helper text 문안(artist/group/media type 유도문, dynamic placeholder)을 `MetadataInputForm`(페이지가 실제 쓰는 컴포넌트)으로 이식하여 PR-4에 포함.
- #230에 코멘트로 supersede 이유 + PR-4 링크 남김.

## 10. 리스크

| 리스크                                             | 영향                      | 대응                                                                                |
| -------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------- |
| Hook 추출 과정 회귀                                | 업로드 불가 (P0)          | PR-2 "기능 변경 0" 제한. diff를 이동 위주로. pre-push + E2E + Vercel preview.       |
| `RequestFlowModal` prop 추가가 detect에 영향       | detect 모달 레이아웃 변화 | 기본값을 기존 동작과 동일하게. PR-1 후 detect preview로 시각 확인.                  |
| SmartNav/Sidebar router.push 전환 후 히스토리 엣지 | 뒤로가기 오동작           | 기존 `history.length > 1` fallback 유지 + TODO.                                     |
| Draft toast 중복                                   | UX 성가심                 | sessionStorage 1회 제한.                                                            |
| Store bleed                                        | 잘못된 reset              | `activeInstanceId` guard (Section 6).                                               |
| ImageEditor body scroll double-lock                | 모달 닫은 뒤 스크롤 잠김  | `useBodyScrollLock` counter 패턴.                                                   |
| 모바일 회귀                                        | 작은 화면에서 사용 불가   | `mobileFullScreen` prop in-scope.                                                   |
| PR #230 close 시 작업자 감정                       | 팀 coordination           | 코멘트로 명확히 supersede 이유 + 이식 위치 설명. 본인 작성 PR이므로 실질 갈등 없음. |
| Vercel preview vs prod intercept 차이              | preview에서 안 뜸         | 초기 PR-1/PR-2는 preview 확인 후 다음 PR 진입.                                      |

## 11. 예상 파일 diff 규모 (추정치)

- **신규**: `useUploadFlow.ts` (≈220), `UploadFlowSteps.tsx` (≈320). 합계 ≈540.
- **삭제**: `RequestModal.tsx` (305), `DetailsStep.tsx` (≈160). 합계 ≈465.
- **축소**: `page.tsx` (551 → ≈35), `@modal/(.)request/upload/page.tsx` (398 → ≈25). 합계 ≈−889.
- **수정 (소량)**: `RequestFlowModal.tsx` (+40, prop/모바일 대응), `SmartNav.tsx` (−15), `Sidebar.tsx` (−25), `MetadataInputForm.tsx` (+30, helper text 이식), `requestStore.ts` (+25, guard).

**순증감 추정: 약 −750 ~ −850 lines** (중복 제거 + 인스턴스 가드/모바일 대응이 일부 상쇄). 정확한 수치는 실제 추출 후 확정. 리뷰 관점에서는 대부분 "move"라 인지 부담은 낮음.

## 12. 후속 과제 (별도 이슈로)

- #145 Section 1: Spot card 스크롤 persistence, 드래그 재배치, 삭제 confirmation.
- #145 Section 2: 솔루션 메타데이터 추출 성공/실패 피드백 강화.
- #145 Section 3 나머지: Context multi-select (백엔드 검토 필요), Platform/Year autocomplete, description 기반 title 추천.
- `@modal/(.)request/detect/page.tsx`도 `useUploadFlow`/`UploadFlowSteps` 유사 패턴으로 통합 검토.
- `history.length > 1` fallback의 신뢰성 개선 (tech debt).
- `/request/upload` 진입점 추가 (모바일 FAB, 피드 inline CTA 등) — hook+composition seam이라 추가 비용 낮음.

---

## Appendix A: 현재 코드 참조

- `app/request/upload/page.tsx`: 551 lines. 풀 기능. **`useCreatePost` 미사용**, `createPostWithFile`/`createPostWithFileAndSolutions` 직접 호출.
- `app/@modal/(.)request/upload/page.tsx`: 398 lines. 기능 일부 누락.
- `lib/components/request/RequestModal.tsx`: 305 lines. `DetailsStep` 사용.
- `lib/components/request/DetailsStep.tsx`: `useCreatePost` 사용. `ArtistInput`/`MediaSourceInput`/`ContextSelector`/`DescriptionInput` 조합.
- `lib/components/request/RequestFlowModal.tsx`: 153 lines. GSAP, body scroll lock, ESC, `window.history.length` fallback.
- `lib/components/request/MetadataInputForm.tsx`: 페이지가 실제 쓰는 간소 폼. PR #230의 helper text 이식 대상.
- `lib/stores/requestStore.ts`: Zustand module singleton. `resetRequestFlow` (L478), `activeInstanceId` 필드 신설 예정.
- `lib/hooks/useImageUpload.ts`, `lib/utils/imageCompression.ts`, `lib/utils/offlineDraft.ts`: 변경 없음.

## Appendix B: 리뷰어 feedback 반영 내역

본 v2는 두 리뷰(critic, architect)에서 제기된 이슈를 다음과 같이 반영:

- **`mode` prop seam → hook+composition**: Section 4 전면 재설계.
- **`requestStore` 인스턴스 가드**: `activeInstanceId` + `resetIfActive`, Section 4/6/10에 반영.
- **`RequestFlowModal` maxWidth coupling → prop화**: Section 4/5/9에 반영, 기본값으로 detect 동작 보존.
- **Close semantics inversion**: `onClose` prop으로 caller 주입, shell은 chrome만.
- **모바일 회귀**: `mobileFullScreen` prop을 in-scope로 이동, Section 3/7.2 명시.
- **PR #230 ordering → superseded**: Section 3/9 처리 방안 확정, helper text를 `MetadataInputForm`으로 이식하여 PR-4에 포함.
- **수치/Appendix 정정**: Section 11 추정치화, Appendix A에 `useCreatePost` 실제 사용처 정확히 명시.
