# [SCR-USER-01] 로그인 (Login)

| 항목 | 내용 |
|:---|:---|
| **문서 ID** | SCR-USER-01 |
| **경로** | `/login` |
| **작성일** | 2026-01-14 |
| **버전** | v1.0 |
| **상태** | 초안 |

---

## 1. 화면 개요

- **목적**: 소셜 계정(Kakao, Google, Apple)을 통한 회원가입 및 로그인 처리
- **선행 조건**: 없음 (비로그인 상태 접근 가능)
- **후속 화면**: 메인 홈 (`/`) 또는 이전 페이지
- **관련 기능 ID**: [U-01](../spec.md#u-01-social-login)

---

## 2. UI 와이어프레임

### 2.1 데스크톱 (≥768px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                                                                              │
│                                                                              │
│                      ┌────────────────────────────────────┐                  │
│                      │                                    │                  │
│                      │         [IMG-01]                   │                  │
│                      │         Service Logo               │                  │
│                      │         (DECODED)                  │                  │
│                      │                                    │                  │
│                      │                                    │                  │
│                      │  [TXT-01] Welcome to Decoded       │                  │
│                      │  [TXT-02] Discover what they're    │                  │
│                      │           wearing                  │                  │
│                      │                                    │                  │
│                      │                                    │                  │
│                      │  ┌──────────────────────────────┐  │                  │
│                      │  │ [BTN-01]                     │  │                  │
│                      │  │ 🟡 카카오로 로그인           │  │                  │
│                      │  └──────────────────────────────┘  │                  │
│                      │                                    │                  │
│                      │  ┌──────────────────────────────┐  │                  │
│                      │  │ [BTN-02]                     │  │                  │
│                      │  │ 🔵 Continue with Google      │  │                  │
│                      │  └──────────────────────────────┘  │                  │
│                      │                                    │                  │
│                      │  ┌──────────────────────────────┐  │                  │
│                      │  │ [BTN-03]                     │  │                  │
│                      │  │ ⚫ Sign in with Apple        │  │                  │
│                      │  └──────────────────────────────┘  │                  │
│                      │                                    │                  │
│                      │                                    │                  │
│                      │  [TXT-03]                          │                  │
│                      │  By continuing, you agree to our   │                  │
│                      │  [LINK-01]Terms and [LINK-02]Privacy│                 │
│                      │                                    │                  │
│                      └────────────────────────────────────┘                  │
│                                                                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 모바일 (<768px)

```
┌────────────────────────────────┐
│                                │
│                                │
│                                │
│         [IMG-01]               │
│         Service Logo           │
│         (DECODED)              │
│                                │
│                                │
│  [TXT-01]                      │
│  Welcome to Decoded            │
│                                │
│  [TXT-02]                      │
│  Discover what they're wearing │
│                                │
│                                │
│  ┌──────────────────────────┐  │
│  │ [BTN-01]                 │  │
│  │ 🟡 카카오로 로그인       │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │ [BTN-02]                 │  │
│  │ 🔵 Continue with Google  │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │ [BTN-03]                 │  │
│  │ ⚫ Sign in with Apple    │  │
│  └──────────────────────────┘  │
│                                │
│                                │
│  [TXT-03]                      │
│  By continuing, you agree to   │
│  our Terms and Privacy Policy  │
│                                │
│                                │
└────────────────────────────────┘
```

---

## 3. UI 요소 정의

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---|:---|:---|
| **IMG-01** | 이미지 | 서비스 로고 | - Size: 120×40px<br>- Alt: "DECODED" | - |
| **TXT-01** | 텍스트 | 메인 타이틀 | - Font: H1 (24px Bold)<br>- Color: `text-primary` | - |
| **TXT-02** | 텍스트 | 서브 타이틀 | - Font: Body (16px)<br>- Color: `text-secondary` | - |
| **BTN-01** | 버튼 | 카카오 로그인 | - BG: `#FEE500`<br>- Text: `#000000`<br>- Icon: Kakao Symbol<br>- Height: 52px<br>- Border-radius: 8px | **Click**: `signInWithKakao()` 호출<br>→ Supabase Auth Kakao Provider로 리다이렉트<br>→ 성공 시 `/auth/callback` → 메인으로 이동<br>→ 신규 유저: DB Trigger로 프로필 자동 생성 |
| **BTN-02** | 버튼 | 구글 로그인 | - BG: `#FFFFFF`<br>- Border: 1px `#DADCE0`<br>- Text: `#3C4043`<br>- Icon: Google Logo<br>- Height: 52px | **Click**: `signInWithGoogle()` 호출<br>→ 로직은 BTN-01과 동일 |
| **BTN-03** | 버튼 | 애플 로그인 | - BG: `#000000`<br>- Text: `#FFFFFF`<br>- Icon: Apple Logo<br>- Height: 52px | **Click**: `signInWithApple()` 호출<br>→ 로직은 BTN-01과 동일 |
| **TXT-03** | 텍스트 | 약관 안내 | - Font: Caption (12px)<br>- Color: `text-muted` | - |
| **LINK-01** | 링크 | 이용약관 | - Color: `text-link`<br>- Underline: hover | **Click**: `/terms` (새 탭) |
| **LINK-02** | 링크 | 개인정보 처리방침 | - Color: `text-link`<br>- Underline: hover | **Click**: `/privacy` (새 탭) |
| **TOAST-ERR** | 토스트 | 에러 메시지 | - Hidden (Default)<br>- Position: Top Center<br>- Duration: 5s | 로그인 실패 시 표시<br>예: "로그인에 실패했습니다. 다시 시도해주세요." |

---

## 4. 상태 정의

| 상태 | 조건 | UI 변화 |
|:---|:---|:---|
| **기본** | 초기 로딩 완료 | 모든 버튼 활성화, 정상 표시 |
| **로딩** | OAuth 처리 중 | 클릭된 버튼에 스피너 표시, 다른 버튼 비활성화 |
| **에러** | 로그인 실패 | TOAST-ERR 표시, 버튼 재활성화 |
| **리다이렉트** | 인증 성공 | 이전 페이지 또는 홈으로 이동 |

### 버튼 상태
```
┌─────────────────────────────────────────────────────────────────┐
│                        Button States                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Default]          [Hover]           [Loading]    [Disabled]   │
│  ┌───────────┐     ┌───────────┐     ┌───────────┐ ┌───────────┐│
│  │ 🟡 카카오 │     │ 🟡 카카오 │     │ ⟳ 로딩중 │ │ 🟡 카카오 ││
│  │           │     │  (밝게)   │     │           │ │  (흐리게) ││
│  └───────────┘     └───────────┘     └───────────┘ └───────────┘│
│   opacity: 1        brightness:1.05   cursor:wait  opacity:0.5  │
│                     scale:1.02                     cursor:       │
│                                                    not-allowed   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. 데이터 요구사항

### 5.1 API 호출

| API | Method | Endpoint | 호출 시점 | 응답 |
|:---|:---:|:---|:---|:---|
| Supabase OAuth | - | `supabase.auth.signInWithOAuth()` | 버튼 클릭 시 | OAuth URL 리다이렉트 |
| Callback Handler | GET | `/auth/callback?code=...` | OAuth 완료 후 | 세션 생성 |

### 5.2 상태 관리

| 스토어 | 키 | 타입 | 설명 |
|:---|:---|:---|:---|
| Zustand (authStore) | `user` | `User \| null` | 현재 로그인 사용자 |
| Zustand (authStore) | `isLoading` | `boolean` | 인증 처리 중 여부 |
| Local State | `loadingProvider` | `'kakao' \| 'google' \| 'apple' \| null` | 로딩 중인 제공자 |

---

## 6. 에러 처리

| 에러 코드 | 상황 | 사용자 메시지 | 처리 방법 |
|:---:|:---|:---|:---|
| `access_denied` | 사용자가 OAuth 취소 | "로그인이 취소되었습니다" | 로그인 페이지 유지 |
| `server_error` | OAuth 서버 오류 | "일시적인 오류가 발생했습니다" | 재시도 안내 |
| `invalid_grant` | 인증 코드 만료 | "세션이 만료되었습니다" | 재로그인 안내 |
| `user_banned` | 정지된 계정 | "이용이 정지된 계정입니다" | 고객센터 안내 |

---

## 7. 접근성 (A11y)

- **키보드 네비게이션**: Tab으로 버튼 간 이동, Enter로 클릭
- **스크린 리더**: 각 버튼에 `aria-label` 제공 (예: "카카오 계정으로 로그인")
- **포커스 관리**: 첫 버튼(카카오)에 자동 포커스
- **색상 대비**: 모든 버튼 텍스트 WCAG AA 기준 충족

---

## 8. 컴포넌트 매핑

| UI 영역 | 컴포넌트 | 파일 경로 |
|:---|:---|:---|
| 페이지 | LoginPage | `packages/web/app/login/page.tsx` |
| 로그인 카드 | LoginCard | `packages/web/lib/components/auth/LoginCard.tsx` |
| 소셜 버튼 | LoginButton | `packages/web/lib/components/auth/LoginButton.tsx` |
| 카카오 아이콘 | KakaoIcon | `packages/web/lib/components/icons/KakaoIcon.tsx` |
| 구글 아이콘 | GoogleIcon | `packages/web/lib/components/icons/GoogleIcon.tsx` |
| 애플 아이콘 | AppleIcon | `packages/web/lib/components/icons/AppleIcon.tsx` |
| 콜백 핸들러 | AuthCallback | `packages/web/app/auth/callback/route.ts` |

---

## 9. 구현 체크리스트

- [ ] UI 레이아웃 구현
- [ ] Kakao OAuth 연동
- [ ] Google OAuth 연동
- [ ] Apple OAuth 연동
- [ ] 콜백 핸들러 구현
- [ ] 에러 처리 및 토스트
- [ ] 반응형 대응
- [ ] 접근성 테스트
- [ ] 다국어 대응 (ko/en)

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|:---|:---|:---|:---|
| v1.0 | 2026-01-14 | PM | 초기 작성 |
