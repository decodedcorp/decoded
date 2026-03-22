# [CMN-03] 공통 모달 (Common Modals)

| 항목 | 내용 |
|------|------|
| **문서 ID** | CMN-03 |
| **컴포넌트명** | 공통 모달 |
| **작성일** | 2025-01-14 |
| **버전** | v1.0 |
| **상태** | 초안 |

---

## 1. 컴포넌트 개요

- **목적**: 로그인, 확인, 알림 등 앱 전역에서 사용되는 공통 모달 정의
- **사용 위치**: 앱 전역
- **종류**: 로그인/회원가입, 확인 다이얼로그, 신고, 공유

---

## 2. 모달 종류

### 2.1 로그인/회원가입 모달 (AuthModal)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                           [✕]   │
│                                                                 │
│                         DECODED                                 │
│                                                                 │
│                    Welcome back!                                │
│            Log in to discover fashion                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔷 Continue with Google                                  │   │
│  │ [BTN-GOOGLE]                                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ⬛ Continue with Apple                                   │   │
│  │ [BTN-APPLE]                                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 💬 Continue with Kakao                                   │   │
│  │ [BTN-KAKAO]                                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ───────────────────── or ─────────────────────                │
│                                                                 │
│  Email                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ your@email.com                              [INP-EMAIL] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Password                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ••••••••                                [👁️] [INP-PWD] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                      Log In                              │   │
│  │                    [BTN-LOGIN]                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Forgot password?]                                            │
│  [LINK-FORGOT]                                                 │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Don't have an account? [Sign up]                              │
│                        [LINK-SIGNUP]                           │
│                                                                 │
│  By continuing, you agree to our                               │
│  [Terms of Service] and [Privacy Policy]                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 회원가입 뷰

```
┌─────────────────────────────────────────────────────────────────┐
│                                                           [✕]   │
│                                                                 │
│                         DECODED                                 │
│                                                                 │
│                    Create account                               │
│             Join our fashion community                         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔷 Continue with Google                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ⬛ Continue with Apple                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 💬 Continue with Kakao                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ───────────────────── or ─────────────────────                │
│                                                                 │
│  Username                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ fashion_lover                                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ✓ Available                                                   │
│                                                                 │
│  Email                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ your@email.com                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Password                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ••••••••                                            [👁️]│   │
│  └─────────────────────────────────────────────────────────┘   │
│  ✓ 8+ characters  ✓ 1 number  ✗ 1 special character           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Create Account                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Already have an account? [Log in]                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 확인 다이얼로그 (ConfirmDialog)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ⚠️ Delete this post?                                          │
│                                                                 │
│  This action cannot be undone. The post and all                │
│  associated data will be permanently removed.                  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  [Cancel]                              [Delete]          │   │
│  │  [BTN-CANCEL]                          [BTN-CONFIRM]     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.4 위험한 작업 확인

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🔴 Delete your account?                                       │
│                                                                 │
│  This will permanently delete your account and all             │
│  your data. This action cannot be undone.                      │
│                                                                 │
│  Type "DELETE" to confirm:                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  [Cancel]                      [Delete Account]          │   │
│  │                                (disabled until typed)    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.5 신고 모달 (ReportModal)

```
┌─────────────────────────────────────────────────────────────────┐
│  Report Content                                           [✕]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Why are you reporting this?                                   │
│                                                                 │
│  [○] Spam or misleading                                        │
│  [○] Inappropriate content                                     │
│  [○] Copyright violation                                       │
│  [○] Incorrect product information                             │
│  [●] Other                                                     │
│                                                                 │
│  Additional details (optional)                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Please describe the issue...                             │   │
│  │                                                          │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [ ] Block this user                                           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  [Cancel]                              [Submit Report]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.6 공유 모달 (ShareModal)

```
┌─────────────────────────────────────────────────────────────────┐
│  Share                                                    [✕]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐      │
│  │           │ │           │ │           │ │           │      │
│  │   Copy    │ │  Twitter  │ │ Facebook  │ │  Kakao    │      │
│  │   Link    │ │           │ │           │ │  Talk     │      │
│  │           │ │           │ │           │ │           │      │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘      │
│  [BTN-COPY]    [BTN-TWITTER] [BTN-FB]      [BTN-KAKAO]        │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Or copy link:                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ https://decoded.app/p/abc123                      [📋]  │   │
│  │ [URL-DISPLAY]                                 [BTN-COPY]│   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.7 이미지 라이트박스 (ImageLightbox)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ [✕]                                                              🔍+ 🔍- ⤢        │
│                                                                                      │
│                                                                                      │
│                                                                                      │
│                                                                                      │
│                                                                                      │
│                        [Full-size Image]                                            │
│                                                                                      │
│                                                                                      │
│                                                                                      │
│                                                                                      │
│                                                                                      │
│                                                                                      │
│  [←]                                                                          [→]   │
│  [PREV]                      1 / 5                                          [NEXT]  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. UI 요소 정의

### 3.1 AuthModal

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| BTN-GOOGLE | 버튼 | Google 로그인 | OAuth provider | Supabase OAuth |
| BTN-APPLE | 버튼 | Apple 로그인 | OAuth provider | Supabase OAuth |
| BTN-KAKAO | 버튼 | Kakao 로그인 | OAuth provider | Supabase OAuth |
| INP-EMAIL | 입력 | 이메일 | type: email, required | - |
| INP-PWD | 입력 | 비밀번호 | type: password, required | - |
| BTN-PWD-TOGGLE | 버튼 | 비밀번호 표시 | Icon: Eye/EyeOff | 토글 |
| BTN-LOGIN | 버튼 | 로그인 | variant: primary | 폼 제출 |
| LINK-FORGOT | 링크 | 비밀번호 찾기 | - | 비밀번호 재설정 뷰 |
| LINK-SIGNUP | 링크 | 회원가입 | - | 회원가입 뷰로 전환 |
| INP-USERNAME | 입력 | 사용자명 | 회원가입 시 | 중복 체크 |
| TXT-PWD-STRENGTH | 텍스트 | 비밀번호 강도 | 조건별 체크 | - |

### 3.2 ConfirmDialog

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| ICON-TYPE | 아이콘 | 타입 아이콘 | warning/danger/info | - |
| TXT-TITLE | 텍스트 | 제목 | 동적 | - |
| TXT-DESC | 텍스트 | 설명 | 동적 | - |
| INP-CONFIRM | 입력 | 확인 입력 | 위험한 작업 시 | 특정 텍스트 입력 필요 |
| BTN-CANCEL | 버튼 | 취소 | variant: outline | 모달 닫기 |
| BTN-CONFIRM | 버튼 | 확인 | variant 동적 (danger/primary) | 확인 콜백 실행 |

### 3.3 ReportModal

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| RADIO-REASON | 라디오 | 신고 사유 | 프리셋 옵션들 | 하나 선택 필수 |
| INP-DETAILS | 입력 | 추가 설명 | textarea, optional | - |
| CHK-BLOCK | 체크박스 | 사용자 차단 | optional | - |
| BTN-SUBMIT | 버튼 | 제출 | variant: primary | 신고 API 호출 |

### 3.4 ShareModal

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| BTN-COPY | 버튼 | 링크 복사 | Icon: Link | 클립보드 복사 |
| BTN-TWITTER | 버튼 | Twitter | Icon: Twitter | 새 창에서 공유 |
| BTN-FB | 버튼 | Facebook | Icon: Facebook | 새 창에서 공유 |
| BTN-KAKAO | 버튼 | KakaoTalk | Icon: Kakao | Kakao SDK 공유 |
| URL-DISPLAY | 입력 | URL 표시 | readonly | - |

### 3.5 ImageLightbox

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| BTN-CLOSE | 버튼 | 닫기 | Icon: X, top-left | 모달 닫기 |
| BTN-ZOOM-IN | 버튼 | 확대 | Icon: ZoomIn | 이미지 확대 |
| BTN-ZOOM-OUT | 버튼 | 축소 | Icon: ZoomOut | 이미지 축소 |
| BTN-FULLSCREEN | 버튼 | 전체화면 | Icon: Maximize | 전체화면 토글 |
| BTN-PREV | 버튼 | 이전 | Icon: ChevronLeft | 이전 이미지 |
| BTN-NEXT | 버튼 | 다음 | Icon: ChevronRight | 다음 이미지 |
| TXT-COUNT | 텍스트 | 페이지 수 | "1 / 5" | - |

---

## 4. 상태 정의

### 4.1 AuthModal

| 상태 | 조건 | UI 변화 |
|------|------|--------|
| 로그인 뷰 | mode === 'login' | 로그인 폼 표시 |
| 회원가입 뷰 | mode === 'signup' | 회원가입 폼 표시 |
| 로딩 | isLoading | 버튼 로딩 + 입력 비활성화 |
| 에러 | error !== null | 에러 메시지 표시 |
| 사용자명 검증 중 | isCheckingUsername | 로딩 스피너 |
| 사용자명 사용 가능 | usernameAvailable | ✓ Available |
| 사용자명 사용 불가 | !usernameAvailable | ✗ Already taken |

### 4.2 ConfirmDialog

| 상태 | 조건 | UI 변화 |
|------|------|--------|
| 기본 | - | 확인 버튼 활성화 |
| 위험 확인 필요 | requireConfirmText | 확인 버튼 비활성화 (입력 전) |
| 처리 중 | isLoading | 버튼 로딩 |

---

## 5. 데이터 요구사항

### 5.1 API 호출

| API | Method | Endpoint | 모달 |
|-----|--------|----------|------|
| OAuth 로그인 | - | Supabase Auth | AuthModal |
| 이메일 로그인 | POST | Supabase Auth | AuthModal |
| 회원가입 | POST | Supabase Auth | AuthModal |
| 사용자명 체크 | GET | `/api/auth/check-username?username={name}` | AuthModal |
| 비밀번호 재설정 | POST | Supabase Auth | AuthModal |
| 신고 제출 | POST | `/api/reports` | ReportModal |

---

## 6. 접근성 (A11y)

### 6.1 키보드 네비게이션
- `Escape`: 모달 닫기
- `Tab`: 모달 내 요소들 순환 (포커스 트랩)
- `Enter`: 기본 버튼 실행
- `Arrow Left/Right`: 라이트박스에서 이미지 이동

### 6.2 스크린 리더
- 모달: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`
- 닫기 버튼: `aria-label="Close modal"`
- 확인 버튼 (위험): `aria-label="Delete, this action cannot be undone"`
- 라이트박스: `role="dialog"`, `aria-label="Image viewer, 1 of 5"`

### 6.3 포커스 관리
- 모달 열림 시: 첫 번째 포커스 가능 요소로 이동
- 모달 닫힘 시: 트리거 요소로 포커스 복귀
- 포커스 트랩: 모달 밖으로 포커스 이동 방지

---

## 7. 컴포넌트 매핑

| UI 영역 | 컴포넌트 | 파일 경로 |
|--------|---------|----------|
| 기본 모달 | Modal | `lib/components/ui/Modal.tsx` |
| 인증 모달 | AuthModal | `lib/components/auth/AuthModal.tsx` |
| 로그인 폼 | LoginForm | `lib/components/auth/LoginForm.tsx` |
| 회원가입 폼 | SignupForm | `lib/components/auth/SignupForm.tsx` |
| OAuth 버튼 | OAuthButton | `lib/components/auth/OAuthButton.tsx` |
| 확인 다이얼로그 | ConfirmDialog | `lib/components/ui/ConfirmDialog.tsx` |
| 신고 모달 | ReportModal | `lib/components/modals/ReportModal.tsx` |
| 공유 모달 | ShareModal | `lib/components/modals/ShareModal.tsx` |
| 이미지 라이트박스 | ImageLightbox | `lib/components/modals/ImageLightbox.tsx` |

---

## 8. 구현 체크리스트

- [ ] Modal 기본 컴포넌트 (오버레이, 포커스 트랩)
- [ ] AuthModal (로그인/회원가입 전환)
- [ ] OAuth 버튼들 (Google, Apple, Kakao)
- [ ] 이메일/비밀번호 폼
- [ ] 사용자명 실시간 검증
- [ ] 비밀번호 강도 표시
- [ ] ConfirmDialog (일반/위험)
- [ ] ReportModal (사유 선택 + 상세)
- [ ] ShareModal (소셜 + 링크 복사)
- [ ] ImageLightbox (확대/축소, 네비게이션)
- [ ] 접근성 테스트 (포커스 트랩, 스크린 리더)

---

## 9. 참고 사항

### 9.1 신고 사유 프리셋
```typescript
const REPORT_REASONS = [
  { id: 'spam', label: 'Spam or misleading' },
  { id: 'inappropriate', label: 'Inappropriate content' },
  { id: 'copyright', label: 'Copyright violation' },
  { id: 'wrong_info', label: 'Incorrect product information' },
  { id: 'other', label: 'Other' },
];
```

### 9.2 비밀번호 검증 규칙
```typescript
const PASSWORD_RULES = [
  { regex: /.{8,}/, label: '8+ characters' },
  { regex: /[0-9]/, label: '1 number' },
  { regex: /[!@#$%^&*]/, label: '1 special character' },
];
```

### 9.3 공유 URL 생성
```typescript
function getShareUrl(type: 'twitter' | 'facebook', url: string, title: string) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  switch (type) {
    case 'twitter':
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  }
}
```
