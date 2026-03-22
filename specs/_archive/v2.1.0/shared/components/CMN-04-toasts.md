# [CMN-04] 토스트/알림 (Toasts & Notifications)

| 항목 | 내용 |
|------|------|
| **문서 ID** | CMN-04 |
| **컴포넌트명** | 토스트/알림 |
| **작성일** | 2025-01-14 |
| **버전** | v1.0 |
| **상태** | 초안 |

---

## 1. 컴포넌트 개요

- **목적**: 사용자 액션 결과, 시스템 알림, 에러 메시지 등 임시 피드백 제공
- **사용 위치**: 앱 전역 (화면 하단 또는 상단)
- **종류**: 성공, 에러, 경고, 정보, 로딩

---

## 2. UI 와이어프레임

### 2.1 토스트 타입별

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                     │
│  Success Toast                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  ✓  Post published successfully                                        [✕]  │   │
│  │     [TOAST-SUCCESS]                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  Error Toast                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  ✗  Failed to upload image. Please try again.                         [✕]  │   │
│  │     [TOAST-ERROR]                                                           │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  Warning Toast                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  ⚠  Your session will expire in 5 minutes                             [✕]  │   │
│  │     [TOAST-WARNING]                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  Info Toast                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  ℹ  New version available. Refresh to update.                         [✕]  │   │
│  │     [TOAST-INFO]                                                            │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  Loading Toast                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  ⟳  Uploading image... (45%)                                                │   │
│  │     [████████████░░░░░░░░░░░░░░░░]                                         │   │
│  │     [TOAST-LOADING]                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 액션 포함 토스트

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ✓  Post saved to drafts                                              [✕]  │
│                                                           [View Draft]     │
│     [TOAST-ACTION]                                        [BTN-ACTION]     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  ✗  Failed to save changes                                            [✕]  │
│                                                              [Retry]       │
│     [TOAST-RETRY]                                           [BTN-RETRY]    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  🗑️ Post deleted                                                      [✕]  │
│                                                               [Undo]       │
│     [TOAST-UNDO]                                             [BTN-UNDO]    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 스택된 토스트

```
                                               (화면 우하단)
                                        ┌─────────────────────────────┐
                                        │  ✓  Link copied            │
                                        │                       [✕]  │
                                        └─────────────────────────────┘
                                        ┌─────────────────────────────┐
                                        │  ✓  Post saved             │
                                        │                       [✕]  │
                                        └─────────────────────────────┘
                                        ┌─────────────────────────────┐
                                        │  ℹ  New notification       │
                                        │                       [✕]  │
                                        └─────────────────────────────┘
                                        [TOAST-STACK]
```

### 2.4 알림 배너 (상단 고정)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                      │
│  ⚠️ Maintenance scheduled for Jan 10, 2026, 2:00 AM KST                 [Dismiss]  │
│     [BANNER-WARNING]                                                                │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                      │
│  🎉 New feature: AI item detection is now available!            [Learn More]  [✕]  │
│     [BANNER-INFO]                                                                   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                      │
│  ❌ You are currently offline. Some features may not work.                          │
│     [BANNER-ERROR]                                                                  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. UI 요소 정의

### 3.1 토스트 기본 요소

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| ICON-TYPE | 아이콘 | 타입 아이콘 | success: Check, error: X, warning: AlertTriangle, info: Info | - |
| TXT-MESSAGE | 텍스트 | 메시지 | 최대 2줄 | - |
| BTN-CLOSE | 버튼 | 닫기 | Icon: X, opacity 낮게 | 토스트 즉시 닫기 |
| PROGRESS-AUTO | 진행바 | 자동 닫힘 타이머 | 하단에 얇은 바 | - |

### 3.2 토스트 타입

| 타입 | 아이콘 | 배경색 | 테두리 | 자동 닫힘 |
|------|--------|--------|--------|:--------:|
| success | ✓ CheckCircle | bg-green-50 | border-green-500 | 3초 |
| error | ✗ XCircle | bg-red-50 | border-red-500 | 5초 |
| warning | ⚠ AlertTriangle | bg-yellow-50 | border-yellow-500 | 5초 |
| info | ℹ Info | bg-blue-50 | border-blue-500 | 4초 |
| loading | ⟳ Loader | bg-gray-50 | border-gray-300 | 수동 |

### 3.3 액션 버튼

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| BTN-ACTION | 버튼 | 액션 버튼 | variant: ghost, text-primary | 콜백 실행 |
| BTN-RETRY | 버튼 | 재시도 | variant: ghost, text-primary | 실패한 작업 재시도 |
| BTN-UNDO | 버튼 | 실행 취소 | variant: ghost, text-primary | 작업 되돌리기 |

### 3.4 로딩 토스트

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| SPINNER | 아이콘 | 로딩 스피너 | animate-spin | - |
| PROGRESS-BAR | 진행바 | 업로드 진행률 | 0-100% | 실시간 업데이트 |
| TXT-PERCENT | 텍스트 | 퍼센트 | "(45%)" | 실시간 업데이트 |

### 3.5 배너

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| BANNER-* | 컨테이너 | 배너 | 상단 고정, 전체 너비 | - |
| BTN-DISMISS | 버튼 | 닫기 | variant: ghost | 배너 닫기 (localStorage 저장) |
| BTN-LEARN | 버튼 | 자세히 | variant: outline | 링크 이동 |

---

## 4. 상태 정의

| 상태 | 조건 | UI 변화 |
|------|------|--------|
| 진입 | 새 토스트 | 슬라이드 업 + 페이드 인 |
| 활성 | 표시 중 | 자동 닫힘 타이머 진행 |
| 호버 | 마우스 오버 | 자동 닫힘 일시 정지 |
| 종료 | 닫기/타임아웃 | 슬라이드 다운 + 페이드 아웃 |
| 스택 | 여러 토스트 | 아래로 쌓임, 최대 3개 |

---

## 5. 데이터 요구사항

### 5.1 상태 관리

```typescript
// useToastStore (Zustand)
interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  message: string;
  description?: string;
  duration?: number;         // ms, default by type
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
  progress?: number;         // for loading type
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  updateToast: (id: string, updates: Partial<Toast>) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

// 편의 함수
const toast = {
  success: (message: string, options?) => addToast({ type: 'success', message, ...options }),
  error: (message: string, options?) => addToast({ type: 'error', message, ...options }),
  warning: (message: string, options?) => addToast({ type: 'warning', message, ...options }),
  info: (message: string, options?) => addToast({ type: 'info', message, ...options }),
  loading: (message: string, options?) => addToast({ type: 'loading', message, ...options }),
  dismiss: (id: string) => removeToast(id),
};
```

### 5.2 배너 상태

```typescript
// useBannerStore
interface Banner {
  id: string;
  type: 'info' | 'warning' | 'error';
  message: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  dismissible: boolean;
  persistent: boolean;  // localStorage에 닫힘 상태 저장
}

interface BannerState {
  banners: Banner[];
  dismissedIds: string[];  // localStorage 연동
  addBanner: (banner: Omit<Banner, 'id'>) => void;
  dismissBanner: (id: string) => void;
}
```

---

## 6. 접근성 (A11y)

### 6.1 ARIA 속성
- 토스트 컨테이너: `role="region"`, `aria-label="Notifications"`, `aria-live="polite"`
- 에러 토스트: `aria-live="assertive"` (즉시 읽음)
- 닫기 버튼: `aria-label="Dismiss notification"`
- 진행률: `aria-label="Upload progress: 45%"`, `role="progressbar"`, `aria-valuenow`

### 6.2 키보드 네비게이션
- `Tab`: 토스트 내 요소 포커스 (닫기 버튼, 액션 버튼)
- `Escape`: 현재 포커스된 토스트 닫기
- 자동 닫힘 중 포커스: 자동 닫힘 일시 정지

### 6.3 스크린 리더
- 새 토스트 추가 시: 메시지 자동 읽기
- 타입별 접두사: "Success: ", "Error: ", "Warning: ", "Information: "

---

## 7. 컴포넌트 매핑

| UI 영역 | 컴포넌트 | 파일 경로 |
|--------|---------|----------|
| 컨테이너 | ToastContainer | `lib/components/ui/ToastContainer.tsx` |
| 개별 토스트 | Toast | `lib/components/ui/Toast.tsx` |
| 토스트 아이콘 | ToastIcon | `lib/components/ui/ToastIcon.tsx` |
| 로딩 토스트 | LoadingToast | `lib/components/ui/LoadingToast.tsx` |
| 배너 | Banner | `lib/components/ui/Banner.tsx` |
| 배너 컨테이너 | BannerContainer | `lib/components/ui/BannerContainer.tsx` |
| 스토어 | useToastStore | `lib/stores/toastStore.ts` |
| 편의 함수 | toast | `lib/utils/toast.ts` |

---

## 8. 구현 체크리스트

- [ ] ToastContainer (포지션, 스택 관리)
- [ ] Toast 컴포넌트 (타입별 스타일)
- [ ] 토스트 애니메이션 (진입/퇴장)
- [ ] 자동 닫힘 타이머 + 호버 일시정지
- [ ] 액션 버튼 지원
- [ ] LoadingToast (진행률 표시)
- [ ] useToastStore (Zustand)
- [ ] toast 편의 함수
- [ ] Banner 컴포넌트
- [ ] 배너 dismiss + localStorage 연동
- [ ] 스크린 리더 지원 (aria-live)
- [ ] 키보드 네비게이션

---

## 9. 참고 사항

### 9.1 타입별 기본 지속 시간
```typescript
const DEFAULT_DURATIONS = {
  success: 3000,   // 3초
  error: 5000,     // 5초 (에러는 더 오래)
  warning: 5000,   // 5초
  info: 4000,      // 4초
  loading: null,   // 수동으로 닫기
};
```

### 9.2 애니메이션
```typescript
// Framer Motion 예시
const toastVariants = {
  initial: { opacity: 0, y: 50, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 20, scale: 0.95 },
};

const transition = {
  type: 'spring',
  stiffness: 500,
  damping: 30,
};
```

### 9.3 최대 토스트 수
```typescript
const MAX_VISIBLE_TOASTS = 3;

// 초과 시 가장 오래된 토스트 자동 제거
function addToast(toast: Toast) {
  if (toasts.length >= MAX_VISIBLE_TOASTS) {
    removeToast(toasts[0].id);
  }
  // ... 새 토스트 추가
}
```

### 9.4 사용 예시
```typescript
// 성공 알림
toast.success('Post published successfully');

// 에러 + 재시도
toast.error('Failed to upload', {
  action: {
    label: 'Retry',
    onClick: () => uploadImage(),
  },
});

// 실행 취소 가능
const toastId = toast.success('Post deleted', {
  action: {
    label: 'Undo',
    onClick: () => {
      restorePost();
      toast.dismiss(toastId);
    },
  },
});

// 로딩 + 업데이트
const loadingId = toast.loading('Uploading image...');
// ... 업로드 진행
toast.updateToast(loadingId, { progress: 45, message: 'Uploading... (45%)' });
// ... 완료
toast.dismiss(loadingId);
toast.success('Upload complete');
```
