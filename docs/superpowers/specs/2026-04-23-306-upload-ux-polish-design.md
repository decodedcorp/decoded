# Upload 모달 UX 폴리시 (#306) — Design

- **Issue**: [#306 feat(upload): UX 폴리시 — Back 버튼 + Spot 가이드 + Submit 버튼 개선](https://github.com/decoded-app/decoded-monorepo/issues/306)
- **Parent**: #145 (upload 모달 UX 최적화)
- **Scope**: Frontend only. Intercept modal 경로만 (`app/@modal/(.)request/upload/page.tsx`). 모바일/직접 URL 진입점은 본 spec 범위 외.
- **Date**: 2026-04-23
- **Status**: Approved for implementation plan

## 목표

업로드 플로우 1차 폴리시(#291~#302/#304) 이후 남은 3건의 UX 간극을 해결한다.

1. **Back 네비게이션** — 사용자가 이전 단계로 되돌아가는 경로가 없음 (모달 닫고 다시 열어야 함)
2. **Spot 가이드 부족** — 스팟 1개 이상일 때 추가 가능 여부/권장값이 불명확
3. **Submit 버튼 상태 불투명** — disabled 이유가 노출되지 않아 사용자 혼란, 모바일 safe-area 위험

## 제품 결정 요약

| 항목                 | 결정                                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| Back 동작            | One-step-back. 단계마다 한 칸씩 되돌림 (3→2, 2→1)                                                   |
| Discard confirm      | 3→2 전이 시 spots 또는 metadata가 있으면 표시                                                       |
| Dialog primitive     | Native `<dialog>` (추가 의존성 0)                                                                   |
| Spot 권장값          | 3개 (soft hint). 하드 상한 없음                                                                     |
| Spot 초과 카피       | 드롭. ">3이면 분할" 문구는 OOTD 5개 같은 정상 케이스를 오판함                                       |
| Submit disabled 표시 | Inline 힌트 + badge. `disabledReason` 셀렉터는 enum 반환, 컴포넌트에서 copy 매핑                    |
| 모바일 safe-area     | 기존 `flex-shrink-0` 구조 유지 + `pb-[env(safe-area-inset-bottom)]`. iOS 실기기 prototype 이후 결정 |

## Step 파생 (기존 로직, 건드리지 않음)

`UploadFlowSteps.tsx:74-80` — `store.currentStep`이 아니라 UI state에서 파생:

```
Step 1 (upload):      !hasImages || userKnowsItems === null
Step 2 (fork):        hasImages && userKnowsItems !== null && detectedSpots.length === 0
Step 3 (details):     detectedSpots.length > 0
Step 4 (submitting):  flow.isSubmitting
```

본 spec은 `store.currentStep` 업데이트를 추가하지 않는다 (컴포넌트가 안 씀).

## 아키텍처

**접근: 인라인 수정 + 최소 신규 파일 2개**

근거: 신규 로직 총량이 약 90줄. 4개 컴포넌트로 쪼개면 store를 관통하는 prop-drilling은 막지만 실제 추출 이득은 크지 않음 (`UploadFlowSteps` 440줄 중 실제 복잡한 블록은 `SpotListPanel`/`ForkScreen`인데 본 이슈 범위가 아님).

```
lib/components/request/
├── UploadFlowSteps.tsx        (인라인 수정: Back 버튼, 카운터, 푸터 힌트/배지)
├── DiscardProgressDialog.tsx  (신규) — native <dialog> 래퍼
└── constants.ts               (신규) — RECOMMENDED_SPOT_COUNT
```

## Store 변경 (`lib/stores/requestStore.ts`)

### 신규 액션 2개

Back의 **전이**마다 단계에 맞춰 필드를 정리한다. "하나의 범용 reset"은 중복/혼동을 유발하므로 분리.

```ts
// Step 3 → Step 2: 스팟과 메타데이터 초기화, 이미지/fork 선택은 유지
// 참고: userKnowsItems를 보존하므로 fork 질문 화면(userKnowsItems===null일 때만 렌더)은
//      재표시되지 않음. 사용자는 "빈 Step 2"로 돌아가서 스팟을 새로 찍는 UX.
//      Fork 재선택이 필요하면 한 번 더 Back → Step 1 → 재업로드 경로.
backToFork: () => void;
// 초기화: detectedSpots, selectedSpotId,
//         mediaSource (type은 'user_upload'로 복원, title=''),
//         groupName, artistName, context
// 유지:   images, imageDimensions, userKnowsItems

// Step 2 → Step 1: 이미지와 fork 선택 초기화
backToUpload: () => void;
// 초기화: images (and any per-image state), userKnowsItems
// 유지:   없음 (Step 1으로 완전 복귀)
```

**구현 가이드라인**

- 초기값은 `initialState`에서 재사용 (손으로 쓰지 말고 spread 복사)
- 기존 `resetRequestFlow`는 건드리지 않음 — 모달 닫힘 경로의 contract 유지
- draft 저장 연동은 아래 "Draft 정리" 섹션 참조

### 신규 셀렉터 2개

```ts
hasInProgressWork: () => boolean;
// Step 3→2 전이 시 confirm 표시 여부 판단.
//   detectedSpots.length > 0
// || mediaSource?.title?.trim()
// || context !== null
// || !!artistName?.trim()
// → userKnowsItems는 포함하지 않음 (fork 선택은 "네비게이션 의도"지 저장 가치 있는 "작업"이 아님)

type DisabledReason =
  | "need_image"
  | "need_fork_choice"
  | "need_spot"
  | "need_solution" // userKnowsItems=true인데 spot에 link/title 없음
  | "submitting"
  | null;

disabledReason: () => DisabledReason;
// step별 기존 canProceed 규칙을 그대로 반영, 단 이유를 구분자로 반환.
```

`disabledReason`은 **enum discriminant**를 반환한다. 컴포넌트에서 `switch`로 카피 매핑 → i18n 도입 시 selector 건드릴 필요 없음.

## Part A — Back 버튼

### 위치/노출

- `RequestFlowModal`은 close 버튼을 `absolute top-4 right-4`에 배치 (`RequestFlowModal.tsx:165-172`). Back 버튼은 대칭 슬롯 `absolute top-4 left-4`에 배치
- 노출 조건: 파생 `currentStep in [2, 3]`. Step 1/4에서는 숨김

### 동작

```
Step 3 Back:
  if (hasInProgressWork())
    openDiscardDialog(pendingAction = "backToFork")
  else
    backToFork()

Step 2 Back:
  backToUpload()  // 확인 없음: 잃을 것은 이미지뿐, Back의 주 목적이 이미지 재선택
```

### 엣지케이스

- **업로드 진행 중 (`images[i].status === 'uploading'`)**: Back 버튼 `disabled`. 현재 업로드가 끝나거나 실패하면 활성화. API client abort는 본 spec 범위 외.
- **`flow.isSubmitting` (Step 4)**: Back 숨김 (현행 그대로).

### 접근성

- 아이콘 전용(lucide `ArrowLeft`) + `aria-label="Go back"`
- 터치 영역 최소 44×44px
- 키보드 포커스 순서: Back → 주 콘텐츠 → Submit

## Part A — DiscardProgressDialog

### 구현: native `<dialog>`

```tsx
// DiscardProgressDialog.tsx
export function DiscardProgressDialog({ open, onCancel, onConfirm }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }} // Esc → cancel
      className="rounded-xl bg-background p-6 backdrop:bg-black/50"
    >
      <h2 className="text-lg font-semibold">Discard progress?</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        You’ll lose spots and details you’ve added so far.
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onCancel} className="...">
          Cancel
        </button>
        <button onClick={onConfirm} className="... bg-destructive text-white">
          Discard and go back
        </button>
      </div>
    </dialog>
  );
}
```

### Esc/focus 처리

- Native `<dialog>`가 focus trap과 Esc를 자동 처리
- `onCancel` 핸들러에서 `preventDefault()` 호출로 Esc가 바깥 `RequestFlowModal`까지 전파되지 않음
- 바깥 클릭 닫힘은 구현하지 않음 (우발적 데이터 소실 방지)

### 브라우저 지원

- `<dialog>`는 Chrome/Safari/Firefox 전부 지원 (2022년 말 안정화)
- 대상 브라우저에 문제 보고되면 `@ui/dialog` 도입으로 교체 가능 (격리된 1개 파일이므로 리스크 낮음)

## Part B — Spot 카운터/가이드

### 위치

`UploadFlowSteps.tsx`의 사이드바 헤더 영역 (현재 "Spots (N)" 텍스트가 있는 블록). 신규 파일 없이 같은 파일 인라인 교체.

### 렌더 규칙

```
spots.length === 0:
  (카운터 숨김; 기존 DetectionView pulse 힌트가 담당)

spots.length >= 1:
  line 1:  "Spots  {count} / 3"       (숫자는 tabular-nums, "/ 3"은 muted)
  line 2:  count < 3  → "Tap image to add more, or drag to reposition"
           count === 3 → "Nice. Add more if needed."
           count > 3  → (하위 힌트 숨김)
```

- `> 3`일 때의 "분할 고려" 카피는 드롭 (제품 노이즈)
- amber/warning 스타일 없음 — 전체 muted-foreground 레벨 유지
- 초과 시 경고나 버튼 비활성 없음 (soft guide)

### `constants.ts`

```ts
export const RECOMMENDED_SPOT_COUNT = 3;
```

파일이 더 커지기 전까지는 `SpotCounter` 대신 `UploadFlowSteps.tsx` 상단 import 한 줄로 사용.

### DetectionView 변경 없음

- `spots.length === 0` 오버레이 pulse 힌트 유지
- 스팟 1개 이상일 때 오버레이 추가 힌트 노출하지 않음 (카운터에서만)

## Part C — Submit 버튼 영역

### 위치

`UploadFlowSteps.tsx` 하단 바 (현재 Post 버튼이 있는 블록). 인라인 수정.

### 구조

```tsx
<div className="flex-shrink-0 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] ...">
  {disabledReason && disabledReason !== "submitting" && (
    <p id="post-disabled-reason" className="mb-2 text-xs text-muted-foreground">
      {mapDisabledReasonToCopy(disabledReason)}
    </p>
  )}
  <div className="flex gap-2">
    {canRetry && (
      <Button variant="outline" onClick={handleRetry}>
        Retry detection
      </Button>
    )}
    <Button
      onClick={handleSubmit}
      disabled={!!disabledReason}
      aria-describedby={disabledReason ? "post-disabled-reason" : undefined}
      className="flex-1"
    >
      Post
      {spots.length > 0 && (
        <span className="ml-2 opacity-80">
          · {spots.length} {spots.length === 1 ? "spot" : "spots"}
        </span>
      )}
    </Button>
  </div>
</div>
```

### Copy 매핑

```ts
function mapDisabledReasonToCopy(r: DisabledReason): string {
  switch (r) {
    case "need_image":
      return "Upload an image";
    case "need_fork_choice":
      return "Choose how you’ll add info";
    case "need_spot":
      return "Tap the image to add at least 1 spot";
    case "need_solution":
      return "Add a link and title for each spot";
    case "submitting":
    case null:
      return ""; // not shown
  }
}
```

### 모바일 safe-area

- `pb-[max(0.75rem,env(safe-area-inset-bottom))]` — safe area가 0인 데스크톱/안드로이드도 기본 패딩 유지
- `sticky` 대신 기존 flex layout `flex-shrink-0` 유지 (iOS dvh/키보드 이슈 회피)
- 구현 PR 직전 iOS 실기기(프리뷰 배포)에서 1회 확인 체크리스트 포함

### `canRetry` 전제

- 소스: `flow.submitError`가 truthy일 때 (`UploadFlowSteps.tsx:391-405`에서 이미 Retry 버튼이 해당 조건에 묶여 있음)
- 본 spec에서 조건 불변 — 기존 핸들러/버튼 로직 재사용. 구현 단계에서 컴포넌트 추출 없이 인라인 유지.

## Draft 자동 저장 정리

`useUploadFlow.ts`가 spot/metadata 변경 시 draft 자동 저장하는데, 현재 `clearDraft()`는 성공 submit 후에만 호출됨.

**문제**: Back → Discard 후에도 draft가 남아 다음 세션 진입 시 "Restore draft?"로 방금 버린 데이터가 다시 나타남.

**해결**: `backToFork()`/`backToUpload()` 호출 후 `useUploadFlow`의 `clearDraft()`도 호출. 구현 방법 2안:

1. Back 핸들러(`UploadFlowSteps` 측)에서 순서대로 호출 — 본 spec 선호 (store에 UI 관심사 안 넣음)
2. Store action이 이벤트 emit → `useUploadFlow`가 구독 — 오버엔지니어링

구현 PR에서 1안 채택. 테스트로 확실히 검증.

## 분석/텔레메트리

본 spec에서는 이벤트 발행하지 않음. 추후 upload flow 분석 인프라가 정리되면 별도 이슈에서 다음 이벤트 후보 고려: `upload_back_clicked`, `upload_discard_confirmed`, `upload_submit_blocked`.

## 테스트 전략

### Unit (Vitest)

`UploadFlowSteps.test.tsx` — 기존 테스트 보강. 다음 블록 추가:

- Back 버튼 노출: step=1(hidden), step=2(visible), step=3(visible), step=4(hidden)
- Step 3 Back with hasInProgressWork=true → dialog 열림, Cancel → state 유지, Confirm → backToFork 호출
- Step 3 Back with hasInProgressWork=false → dialog 없이 즉시 backToFork
- Step 2 Back → 즉시 backToUpload
- Disabled reason 4가지 상태 inline 힌트 렌더 + badge 단/복수

`DiscardProgressDialog.test.tsx` (신규)

- open=true/false에 따라 `showModal`/`close` 호출
- Esc → onCancel 호출, 상위 이벤트 전파 차단
- Confirm 클릭 → onConfirm 호출

`requestStore.test.ts` 보강

- `backToFork()` 필드 리셋/보존 목록 정확한지
- `backToUpload()` 필드 리셋 목록 정확한지
- `hasInProgressWork` truthy/falsy 10여 케이스 (특히 `userKnowsItems` 단독은 false, `context !== null`로 true)
- `disabledReason` 모든 enum 케이스

### E2E (Playwright)

기존 `/tmp/playwright-qa-upload-flow.js`에 시나리오 3개 추가:

1. **Back 경로 (기본)**: 업로드 → fork 선택 → Back → fork 화면 복귀 확인 → Back → upload 화면 복귀 확인 (이미지 리셋)
2. **Discard confirm — Cancel**: 이미지+스팟 2개 상태에서 Back → 다이얼로그 표시 → Cancel → 스팟 유지
3. **Discard confirm — Confirm**: 이미지+스팟 2개+metadata 상태에서 Back → 다이얼로그 → "Discard and go back" → fork 화면 + draft "Restore?" 프롬프트 사라진 것 확인

## PR 분할 (단일 spec, 3개 PR)

| PR         | 포함                                                                                                                      | 의존 |
| ---------- | ------------------------------------------------------------------------------------------------------------------------- | ---- |
| 1 — Part A | `backToFork`/`backToUpload` 액션, `hasInProgressWork` 셀렉터, Back 버튼 인라인, `DiscardProgressDialog`, draft clear 연동 | —    |
| 2 — Part B | `constants.ts`, Spot 카운터 인라인 교체                                                                                   | —    |
| 3 — Part C | `DisabledReason` 타입 + `disabledReason` 셀렉터, 푸터 inline 힌트 + badge, safe-area 조정                                 | —    |

각 PR 독립 머지 가능. 내부 의존 없음. 리뷰/롤백 단위 작게 유지.

## 비고정 항목 (구현 단계 확인)

- `<dialog>` 스타일이 기존 모달 배경(backdrop)과 충돌하는지 실제 렌더에서 확인
- iOS 17/18 실기기에서 safe-area 패딩 실제 렌더 확인 — 문제 발생 시 `position: fixed` 또는 키보드 높이 감지로 fallback
- `canRetry` 발동 경로 확인 (현재 코드에서 dead인지 live인지)
- Back 버튼 위치가 기존 close 버튼 레이아웃과 충돌 없는지 `RequestFlowHeader.tsx` 읽고 결정

## 참고

- Parent epic: #145
- 선행 완료: #291~#295, #302, #304
- 관련 후속: #303 (Context multi-select, BE 합의 선행), #305 (Source type 구조화, 3-phase)
