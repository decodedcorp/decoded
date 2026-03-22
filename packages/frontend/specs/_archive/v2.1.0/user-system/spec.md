# 사용자 시스템

> 기능: U-01 ~ U-05
> 상태: 0% 구현
> 의존성: Supabase Auth

---

## 개요

사용자 시스템은 인증, 프로필, 사용자 관련 기능을 처리합니다. 개인화된 경험, 기여 추적, 게이미피케이션/리워드 시스템을 가능하게 합니다.

### 관련 화면
- `/login` - 로그인 페이지
- `/profile` - 사용자 프로필 대시보드
- `/profile/settings` - 설정 페이지
- `/profile/activity` - 활동 내역
- `/profile/earnings` - 수익 대시보드

### 의존성
- Supabase Auth (이미 설정됨)
- `@supabase/auth-helpers-nextjs` (설치됨)

---

## 기능

### U-01 소셜 로그인

- **설명**: Kakao, Google, Apple 계정을 사용하여 로그인할 수 있도록 함
- **우선순위**: P0
- **상태**: 미시작
- **의존성**: 없음

#### 인수 조건
- [ ] 사용자가 "카카오로 로그인"을 클릭하고 OAuth 플로우 완료 가능
- [ ] 사용자가 "Google로 로그인"을 클릭하고 OAuth 플로우 완료 가능
- [ ] 사용자가 "Apple로 로그인"을 클릭하고 OAuth 플로우 완료 가능
- [ ] 신규 사용자는 첫 로그인 시 자동 등록
- [ ] 기존 사용자는 인식되어 로그인됨
- [ ] 사용자 세션이 페이지 새로고침 후에도 유지됨
- [ ] 사용자가 어느 페이지에서든 로그아웃 가능

#### UI/UX 요구사항
- **로그인 페이지 레이아웃**:
  ```
  ┌─────────────────────────────┐
  │        [Logo]               │
  │                             │
  │   Welcome to Decoded        │
  │                             │
  │  ┌─────────────────────┐   │
  │  │ 🟡 Login with Kakao │   │
  │  └─────────────────────┘   │
  │  ┌─────────────────────┐   │
  │  │ 🔵 Login with Google│   │
  │  └─────────────────────┘   │
  │  ┌─────────────────────┐   │
  │  │ ⚫ Login with Apple │   │
  │  └─────────────────────┘   │
  │                             │
  │   By continuing, you agree  │
  │   to our Terms & Privacy    │
  └─────────────────────────────┘
  ```
- Kakao 버튼: 노란색 (#FEE500) 배경
- Google 버튼: 흰색 배경에 Google 색상
- Apple 버튼: 검정색 배경

#### 데이터 요구사항
- 각 제공자에 대한 Supabase Auth 설정
- OAuth 리다이렉트 URL 설정
- 사용자 프로필 자동 생성 트리거

#### 구현 노트
```typescript
// lib/supabase/auth.ts
export async function signInWithKakao() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
  return { data, error };
}

// app/auth/callback/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  // 코드를 세션으로 교환
}
```

#### 생성/수정할 파일
- `app/login/page.tsx` - 로그인 페이지
- `app/auth/callback/route.ts` - OAuth 콜백 핸들러
- `lib/supabase/auth.ts` - Auth 헬퍼 함수
- `lib/components/auth/LoginButton.tsx` - 소셜 로그인 버튼

---

### U-02 다국어 설정

- **설명**: 앱 전체에서 한국어와 영어 UI 지원
- **우선순위**: P1
- **상태**: 미시작
- **의존성**: U-01 (설정 저장용)

#### 인수 조건
- [ ] 사용자가 한국어와 영어 간 전환 가능
- [ ] 언어 설정이 세션 간 유지됨
- [ ] 모든 UI 텍스트가 언어 설정을 따름
- [ ] 날짜/숫자 형식이 로케일에 맞게 적용됨
- [ ] 게스트 사용자도 언어 변경 가능 (localStorage에 저장)
- [ ] 로그인한 사용자는 프로필에 설정 저장

#### UI/UX 요구사항
- 헤더에 언어 토글 (간단한 드롭다운 또는 아이콘 토글)
- 설정 페이지에 명시적 언어 선택
- 언어 코드: `ko` (한국어), `en` (영어)

#### 데이터 요구사항
- 모든 UI 문자열의 번역 파일
- 사용자 설정 필드: `preferred_language`

#### 구현 노트
```typescript
// lib/i18n/index.ts
export const translations = {
  ko: {
    'nav.home': '홈',
    'nav.search': '검색',
    'detail.buy': '구매하기',
    // ...
  },
  en: {
    'nav.home': 'Home',
    'nav.search': 'Search',
    'detail.buy': 'Buy Now',
    // ...
  }
};

// lib/hooks/useTranslation.ts
export function useTranslation() {
  const locale = useLocale();
  return (key: string) => translations[locale][key] || key;
}
```

#### 생성/수정할 파일
- `lib/i18n/translations/ko.json`
- `lib/i18n/translations/en.json`
- `lib/i18n/index.ts`
- `lib/hooks/useTranslation.ts`
- `lib/components/LanguageToggle.tsx`

---

### U-03 프로필 대시보드

- **설명**: 사용자의 랭킹, 수익, 팬덤 뱃지 표시
- **우선순위**: P0
- **상태**: 미시작
- **의존성**: U-01, S-07 (뱃지 시스템), S-08 (랭킹)

#### 인수 조건
- [ ] 사용자 아바타와 표시 이름 표시
- [ ] 총 기여 수 표시
- [ ] 채택률 표시
- [ ] 획득한 뱃지를 시각적 아이콘과 함께 표시
- [ ] 현재 랭킹 표시 (전체 및 팬덤별)
- [ ] 수익 요약 표시
- [ ] 상세 활동 내역 링크
- [ ] 설정 페이지 링크

#### UI/UX 요구사항
- **프로필 페이지 레이아웃**:
  ```
  ┌─────────────────────────────────────────┐
  │  [Avatar]  Display Name                 │
  │            @username                    │
  │            "Bio text here..."           │
  │                                         │
  │  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
  │  │   127   │ │  89%    │ │ ₩45,000 │   │
  │  │ Posts   │ │Accepted │ │Earnings │   │
  │  └─────────┘ └─────────┘ └─────────┘   │
  │                                         │
  │  🏆 Badges                              │
  │  ┌─────┐ ┌─────┐ ┌─────┐              │
  │  │ IVE │ │BTS  │ │+3   │              │
  │  │Expert│ │Fan  │ │more │              │
  │  └─────┘ └─────┘ └─────┘              │
  │                                         │
  │  📊 Rankings                            │
  │  • Global: #42                          │
  │  • IVE: #3 this week                   │
  │  • BLACKPINK: #12 this month           │
  │                                         │
  │  [View All Activity] [Settings]         │
  └─────────────────────────────────────────┘
  ```

#### 데이터 요구사항
- 사용자 프로필 데이터
- 뱃지 할당
- 랭킹 데이터 (현재 기간)
- 수익 요약

#### API 엔드포인트
```
GET /api/profile
GET /api/profile/badges
GET /api/profile/rankings
GET /api/profile/earnings/summary
```

#### 생성/수정할 파일
- `app/profile/page.tsx`
- `lib/components/profile/ProfileHeader.tsx`
- `lib/components/profile/StatsCards.tsx`
- `lib/components/profile/BadgeGrid.tsx`
- `lib/components/profile/RankingList.tsx`
- `lib/hooks/useProfile.ts`

---

### U-04 활동 내역

- **설명**: 사용자의 게시물, 답변, 즐겨찾기 항목 보기
- **우선순위**: P1
- **상태**: 미시작
- **의존성**: U-01, U-03

#### 인수 조건
- [ ] 탭 뷰: "내 게시물" | "내 답변" | "즐겨찾기"
- [ ] 각 탭에 페이지네이션된 목록 표시
- [ ] 게시물에 썸네일, 제목, 날짜, 상태 표시
- [ ] 답변에 관련 게시물, 투표 수 표시
- [ ] 즐겨찾기에 아이템/게시물과 빠른 작업 표시
- [ ] 즐겨찾기에서 항목 제거 가능
- [ ] 자신의 게시물 삭제 가능 (확인 포함)

#### UI/UX 요구사항
- **활동 페이지 레이아웃**:
  ```
  ┌─────────────────────────────────────────┐
  │  [My Posts] [My Answers] [Favorites]    │
  ├─────────────────────────────────────────┤
  │  ┌─────────────────────────────────┐   │
  │  │ [Thumb] Post Title              │   │
  │  │         Jan 5, 2026 • Published │   │
  │  │         15 views • 3 comments   │   │
  │  └─────────────────────────────────┘   │
  │  ┌─────────────────────────────────┐   │
  │  │ [Thumb] Post Title              │   │
  │  │         Jan 3, 2026 • Draft     │   │
  │  │         [Edit] [Delete]         │   │
  │  └─────────────────────────────────┘   │
  │                                         │
  │  [Load More]                           │
  └─────────────────────────────────────────┘
  ```

#### 데이터 요구사항
- 사용자의 게시물 및 상태
- 사용자의 아이템 식별 (답변)
- 사용자의 즐겨찾기 (다형성)

#### API 엔드포인트
```
GET /api/profile/posts?page=1&limit=20
GET /api/profile/answers?page=1&limit=20
GET /api/profile/favorites?page=1&limit=20
DELETE /api/profile/posts/:id
DELETE /api/profile/favorites/:id
```

#### 생성/수정할 파일
- `app/profile/activity/page.tsx`
- `lib/components/profile/ActivityTabs.tsx`
- `lib/components/profile/PostList.tsx`
- `lib/components/profile/AnswerList.tsx`
- `lib/components/profile/FavoriteList.tsx`

---

### U-05 출금 요청

- **설명**: 누적된 수익 출금 요청
- **우선순위**: P2
- **상태**: 미시작
- **의존성**: U-01, S-05 (클릭 트래커), S-06 (리워드 배치)

#### 인수 조건
- [ ] 가용 잔액 표시
- [ ] 대기/처리 중 금액 별도 표시
- [ ] 최소 출금 금액 적용 (예: ₩10,000)
- [ ] 은행 계좌 또는 PayPal 입력
- [ ] 제출 전 확인 단계
- [ ] 출금 내역 보기
- [ ] 상태 추적 (대기 중 → 처리 중 → 완료)

#### UI/UX 요구사항
- **수익 페이지 레이아웃**:
  ```
  ┌─────────────────────────────────────────┐
  │  💰 My Earnings                         │
  │                                         │
  │  Available Balance                      │
  │  ₩ 45,320                              │
  │                                         │
  │  Pending: ₩12,000 (Jan clicks)         │
  │  Processing: ₩0                         │
  │                                         │
  │  [Request Withdrawal]                   │
  │                                         │
  │  ─────────────────────────────────────  │
  │  📋 Withdrawal History                  │
  │                                         │
  │  ₩30,000 • Completed • Dec 15, 2025    │
  │  ₩25,000 • Completed • Nov 15, 2025    │
  └─────────────────────────────────────────┘
  ```

#### 데이터 요구사항
- 현재 잔액 계산
- 대기 중인 리워드 (아직 확정되지 않음)
- 출금 요청 내역
- 결제 방법 저장

#### API 엔드포인트
```
GET /api/profile/earnings
GET /api/profile/earnings/history
POST /api/profile/earnings/withdraw
GET /api/profile/withdrawals
```

#### 비즈니스 규칙
- 최소 출금: ₩10,000
- 처리 시간: 5-7 영업일
- 결제 방법: 한국 은행 송금, PayPal
- 세금 원천징수 적용 가능 (안내 표시)

#### 생성/수정할 파일
- `app/profile/earnings/page.tsx`
- `lib/components/profile/EarningsCard.tsx`
- `lib/components/profile/WithdrawalForm.tsx`
- `lib/components/profile/WithdrawalHistory.tsx`

---

## 데이터 모델

전체 타입 정의는 [data-models.md](./data-models.md) 참조.

### 사용자 시스템 핵심 타입

```typescript
interface User {
  id: string;
  email?: string;
  authProvider: 'kakao' | 'google' | 'apple';
  displayName: string;
  avatarUrl?: string;
  preferredLanguage: 'ko' | 'en';
  totalContributions: number;
  totalAccepted: number;
  totalEarnings: number;
}

interface UserBadge {
  userId: string;
  badgeId: string;
  earnedAt: Date;
}

interface WithdrawalRequest {
  userId: string;
  amount: number;
  paymentMethod: 'bank_transfer' | 'paypal';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
}
```

---

## 마이그레이션 경로

### 1단계: 기본 인증
1. Supabase OAuth 제공자 설정
2. 소셜 버튼이 있는 로그인 페이지 생성
3. 콜백 핸들러 구현
4. Auth 컨텍스트 프로바이더 추가

### 2단계: 프로필
1. 사용자 프로필 테이블 트리거 생성
2. 프로필 대시보드 UI 구축
3. 설정 페이지 추가

### 3단계: 활동 & 수익
1. 활동 추적 구현
2. 수익 대시보드 구축
3. 출금 플로우 추가

---

## 보안 고려사항

- OAuth 토큰은 클라이언트에 노출되면 안 됨
- 민감한 사용자 데이터는 저장 시 암호화
- 인증 엔드포인트에 Rate limiting
- 폼에 CSRF 보호
- 출금 시 이메일 확인 필요

---

## 컴포넌트 매핑 (상세 구현 참조)

> 이 섹션은 인증 플로우와 각 UI 요소가 실제 코드에서 어떻게 구현되는지 매핑합니다.

### OAuth 인증 플로우 상세

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         OAUTH AUTHENTICATION FLOW                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [1. 로그인 시작]                                                            │
│       │                                                                      │
│       ▼                                                                      │
│  사용자가 /login 페이지 방문                                                 │
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ LoginPage.tsx (app/login/page.tsx)                                      ││
│  │                                                                          ││
│  │  ┌────────────────────────────────────────────────────────────────────┐ ││
│  │  │       [DECODED Logo]                                               │ ││
│  │  │                                                                     │ ││
│  │  │       Welcome to Decoded                                           │ ││
│  │  │       Discover what they're wearing                                │ ││
│  │  │                                                                     │ ││
│  │  │  ┌────────────────────────────────────────────────────────────┐   │ ││
│  │  │  │ LoginButton.tsx (provider="kakao")                         │   │ ││
│  │  │  │                                                             │   │ ││
│  │  │  │ 🟡  카카오로 로그인                                         │   │ ││
│  │  │  │                                                             │   │ ││
│  │  │  │ onClick → signInWithKakao()                                │   │ ││
│  │  │  └────────────────────────────────────────────────────────────┘   │ ││
│  │  │                                                                     │ ││
│  │  │  ┌────────────────────────────────────────────────────────────┐   │ ││
│  │  │  │ LoginButton.tsx (provider="google")                        │   │ ││
│  │  │  │                                                             │   │ ││
│  │  │  │ 🔵  Continue with Google                                   │   │ ││
│  │  │  │                                                             │   │ ││
│  │  │  │ onClick → signInWithGoogle()                               │   │ ││
│  │  │  └────────────────────────────────────────────────────────────┘   │ ││
│  │  │                                                                     │ ││
│  │  │  ┌────────────────────────────────────────────────────────────┐   │ ││
│  │  │  │ LoginButton.tsx (provider="apple")                         │   │ ││
│  │  │  │                                                             │   │ ││
│  │  │  │ ⚫  Sign in with Apple                                     │   │ ││
│  │  │  │                                                             │   │ ││
│  │  │  │ onClick → signInWithApple()                                │   │ ││
│  │  │  └────────────────────────────────────────────────────────────┘   │ ││
│  │  │                                                                     │ ││
│  │  │       By continuing, you agree to our                              │ ││
│  │  │       Terms of Service and Privacy Policy                          │ ││
│  │  │                                                                     │ ││
│  │  └────────────────────────────────────────────────────────────────────┘ ││
│  │                                                                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│       │                                                                      │
│       │ 사용자가 LoginButton 클릭                                            │
│       │                                                                      │
│       ▼                                                                      │
│  [2. OAuth 리다이렉트]                                                       │
│       │                                                                      │
│       ├─── supabase.auth.signInWithOAuth({                                  │
│       │      provider: 'kakao' | 'google' | 'apple',                        │
│       │      options: {                                                      │
│       │        redirectTo: `${origin}/auth/callback`,                       │
│       │        scopes: 'profile email'  // provider별 상이                  │
│       │      }                                                               │
│       │    })                                                                │
│       │         │                                                            │
│       │         ▼                                                            │
│       │    Supabase가 OAuth Provider URL 생성                               │
│       │         │                                                            │
│       │         ▼                                                            │
│       │    브라우저가 Provider 로그인 페이지로 리다이렉트                    │
│       │    (카카오/구글/애플 로그인 UI)                                      │
│       │                                                                      │
│       ▼                                                                      │
│  [3. Provider 인증]                                                          │
│       │                                                                      │
│       ├─── 사용자가 Provider에서 로그인/인증 승인                           │
│       │         │                                                            │
│       │         ▼                                                            │
│       │    Provider가 authorization code와 함께                             │
│       │    /auth/callback으로 리다이렉트                                    │
│       │                                                                      │
│       ▼                                                                      │
│  [4. Callback 처리]                                                          │
│       │                                                                      │
│       ├─── app/auth/callback/route.ts                                       │
│       │         │                                                            │
│       │         ▼                                                            │
│       │    const { searchParams } = new URL(request.url)                    │
│       │    const code = searchParams.get('code')                            │
│       │         │                                                            │
│       │         ▼                                                            │
│       │    supabase.auth.exchangeCodeForSession(code)                       │
│       │         │                                                            │
│       │    ┌────┴────────────────────────────────────────┐                  │
│       │    ▼                                              ▼                  │
│       │  Success                                       Error                 │
│       │    │                                              │                  │
│       │    │                                              └─── redirect to  │
│       │    │                                                   /login?error │
│       │    ▼                                                                │
│       │  세션 쿠키 설정                                                     │
│       │    │                                                                │
│       │    ├─── 신규 사용자?                                                │
│       │    │         │                                                      │
│       │    │    YES  ▼                                                      │
│       │    │    DB Trigger: handle_new_user()                               │
│       │    │    → user_profile 테이블에 레코드 생성                         │
│       │    │    → 기본값: display_name = email.split('@')[0]               │
│       │    │              avatar_url = provider avatar                      │
│       │    │              preferred_language = 'ko'                         │
│       │    │                                                                │
│       │    ▼                                                                │
│       │  redirect to /                                                      │
│       │  (또는 redirect_after 파라미터가 있으면 해당 URL)                   │
│       │                                                                      │
│       ▼                                                                      │
│  [5. 세션 유지]                                                              │
│       │                                                                      │
│       ├─── AuthProvider.tsx (전역 컨텍스트)                                 │
│       │         │                                                            │
│       │         ├─── useEffect: supabase.auth.onAuthStateChange()          │
│       │         │    세션 변경 감지                                          │
│       │         │                                                            │
│       │         ├─── user 상태 관리                                         │
│       │         │    { user: User | null, isLoading: boolean }              │
│       │         │                                                            │
│       │         └─── 세션 자동 갱신 (refresh token)                         │
│       │                                                                      │
│       ▼                                                                      │
│  [6. 로그아웃]                                                               │
│       │                                                                      │
│       ├─── 사용자가 로그아웃 버튼 클릭                                      │
│       │         │                                                            │
│       │         ▼                                                            │
│       │    supabase.auth.signOut()                                          │
│       │         │                                                            │
│       │         ▼                                                            │
│       │    세션 쿠키 삭제                                                    │
│       │         │                                                            │
│       │         ▼                                                            │
│       │    onAuthStateChange 콜백에서 user = null                           │
│       │         │                                                            │
│       │         ▼                                                            │
│       │    redirect to /                                                    │
│       │                                                                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Supabase Auth 설정 상세

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE AUTH CONFIGURATION                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Dashboard: Authentication > Providers                                       │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ KAKAO                                                          [✓ ON]   ││
│  │                                                                          ││
│  │ Client ID:     [Kakao REST API Key]                                     ││
│  │ Client Secret: [Kakao REST API Secret]                                  ││
│  │ Redirect URL:  https://[project].supabase.co/auth/v1/callback           ││
│  │                                                                          ││
│  │ Kakao Developers Console 설정:                                          ││
│  │ ├─── 내 애플리케이션 > 카카오 로그인 > 활성화                           ││
│  │ ├─── Redirect URI 등록 (위 URL)                                         ││
│  │ └─── 동의항목: 닉네임, 프로필 사진, 이메일 (선택)                       ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ GOOGLE                                                         [✓ ON]   ││
│  │                                                                          ││
│  │ Client ID:     [Google OAuth 2.0 Client ID]                             ││
│  │ Client Secret: [Google OAuth 2.0 Client Secret]                         ││
│  │ Redirect URL:  https://[project].supabase.co/auth/v1/callback           ││
│  │                                                                          ││
│  │ Google Cloud Console 설정:                                              ││
│  │ ├─── APIs & Services > Credentials > OAuth 2.0 Client IDs              ││
│  │ ├─── Authorized redirect URIs 등록 (위 URL)                             ││
│  │ └─── OAuth consent screen 설정                                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ APPLE                                                          [✓ ON]   ││
│  │                                                                          ││
│  │ Client ID:     [Apple Services ID]                                      ││
│  │ Secret Key:    [Apple Private Key (p8 file content)]                   ││
│  │ Key ID:        [Apple Key ID]                                           ││
│  │ Team ID:       [Apple Team ID]                                          ││
│  │ Redirect URL:  https://[project].supabase.co/auth/v1/callback           ││
│  │                                                                          ││
│  │ Apple Developer Console 설정:                                           ││
│  │ ├─── Identifiers > Services IDs 생성                                   ││
│  │ ├─── Sign In with Apple 활성화                                          ││
│  │ └─── Return URLs 등록 (위 URL)                                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### U-01 소셜 로그인 - 컴포넌트 매핑

#### 로그인 UI 구조

```
┌────────────────────────────────────────────────────────────────────────────┐
│ LOGIN PAGE COMPONENT STRUCTURE                                              │
│                                                                            │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ LoginPage.tsx (app/login/page.tsx)                                     │ │
│ │                                                                        │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐│ │
│ │ │ 레이아웃: 중앙 정렬, max-width: 400px                              ││ │
│ │ │ 배경: 그라데이션 또는 패턴                                        ││ │
│ │ │                                                                    ││ │
│ │ │ ┌────────────────────────────────────────────────────────────────┐││ │
│ │ │ │ LoginCard.tsx                                                  │││ │
│ │ │ │                                                                │││ │
│ │ │ │ [Logo]                                                         │││ │
│ │ │ │                                                                │││ │
│ │ │ │ <h1>Welcome to Decoded</h1>                                   │││ │
│ │ │ │ <p>Discover what they're wearing</p>                          │││ │
│ │ │ │                                                                │││ │
│ │ │ │ ┌──────────────────────────────────────────────────────────┐ │││ │
│ │ │ │ │ SocialLoginButtons.tsx                                   │ │││ │
│ │ │ │ │                                                          │ │││ │
│ │ │ │ │ ┌──────────────────────────────────────────────────────┐│ │││ │
│ │ │ │ │ │ LoginButton.tsx                                      ││ │││ │
│ │ │ │ │ │ provider="kakao"                                     ││ │││ │
│ │ │ │ │ │                                                      ││ │││ │
│ │ │ │ │ │ backgroundColor: #FEE500                             ││ │││ │
│ │ │ │ │ │ color: #000000                                       ││ │││ │
│ │ │ │ │ │ icon: <KakaoIcon />                                  ││ │││ │
│ │ │ │ │ │ text: "카카오로 로그인"                              ││ │││ │
│ │ │ │ │ │                                                      ││ │││ │
│ │ │ │ │ │ states:                                              ││ │││ │
│ │ │ │ │ │ - default: 노란 배경                                 ││ │││ │
│ │ │ │ │ │ - hover: 살짝 어둡게                                 ││ │││ │
│ │ │ │ │ │ - loading: 스피너 + 텍스트 변경                      ││ │││ │
│ │ │ │ │ │ - disabled: 회색 처리                                ││ │││ │
│ │ │ │ │ └──────────────────────────────────────────────────────┘│ │││ │
│ │ │ │ │                                                          │ │││ │
│ │ │ │ │ ┌──────────────────────────────────────────────────────┐│ │││ │
│ │ │ │ │ │ LoginButton.tsx                                      ││ │││ │
│ │ │ │ │ │ provider="google"                                    ││ │││ │
│ │ │ │ │ │                                                      ││ │││ │
│ │ │ │ │ │ backgroundColor: #FFFFFF                             ││ │││ │
│ │ │ │ │ │ border: 1px solid #DADCE0                           ││ │││ │
│ │ │ │ │ │ color: #3C4043                                       ││ │││ │
│ │ │ │ │ │ icon: <GoogleIcon />                                 ││ │││ │
│ │ │ │ │ │ text: "Continue with Google"                         ││ │││ │
│ │ │ │ │ └──────────────────────────────────────────────────────┘│ │││ │
│ │ │ │ │                                                          │ │││ │
│ │ │ │ │ ┌──────────────────────────────────────────────────────┐│ │││ │
│ │ │ │ │ │ LoginButton.tsx                                      ││ │││ │
│ │ │ │ │ │ provider="apple"                                     ││ │││ │
│ │ │ │ │ │                                                      ││ │││ │
│ │ │ │ │ │ backgroundColor: #000000                             ││ │││ │
│ │ │ │ │ │ color: #FFFFFF                                       ││ │││ │
│ │ │ │ │ │ icon: <AppleIcon />                                  ││ │││ │
│ │ │ │ │ │ text: "Sign in with Apple"                           ││ │││ │
│ │ │ │ │ └──────────────────────────────────────────────────────┘│ │││ │
│ │ │ │ │                                                          │ │││ │
│ │ │ │ └──────────────────────────────────────────────────────────┘ │││ │
│ │ │ │                                                                │││ │
│ │ │ │ <p className="text-sm text-gray-500">                         │││ │
│ │ │ │   By continuing, you agree to our                             │││ │
│ │ │ │   <Link href="/terms">Terms of Service</Link> and             │││ │
│ │ │ │   <Link href="/privacy">Privacy Policy</Link>                 │││ │
│ │ │ │ </p>                                                          │││ │
│ │ │ │                                                                │││ │
│ │ │ └────────────────────────────────────────────────────────────────┘││ │
│ │ └────────────────────────────────────────────────────────────────────┘│ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│ 파일 위치:                                                                 │
│ packages/web/app/login/page.tsx                                           │
│ packages/web/lib/components/auth/                                         │
│ ├── LoginCard.tsx                                                         │
│ ├── SocialLoginButtons.tsx                                                │
│ ├── LoginButton.tsx                                                       │
│ └── icons/                                                                │
│     ├── KakaoIcon.tsx                                                     │
│     ├── GoogleIcon.tsx                                                    │
│     └── AppleIcon.tsx                                                     │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

#### 인증 관련 코드 구조

```
┌────────────────────────────────────────────────────────────────────────────┐
│ AUTHENTICATION CODE STRUCTURE                                               │
│                                                                            │
│ packages/shared/supabase/                                                  │
│ ├── auth.ts                # Auth 유틸리티 함수                           │
│ │   ├── signInWithKakao()                                                 │
│ │   ├── signInWithGoogle()                                                │
│ │   ├── signInWithApple()                                                 │
│ │   ├── signOut()                                                         │
│ │   └── getSession()                                                      │
│ │                                                                          │
│ └── middleware.ts          # 인증 미들웨어                                │
│                                                                            │
│ packages/web/                                                              │
│ ├── app/                                                                  │
│ │   ├── login/page.tsx                                                    │
│ │   └── auth/                                                             │
│ │       └── callback/route.ts   # OAuth 콜백 핸들러                       │
│ │                                                                          │
│ ├── lib/                                                                  │
│ │   ├── providers/                                                        │
│ │   │   └── AuthProvider.tsx    # 전역 인증 컨텍스트                     │
│ │   │                                                                      │
│ │   ├── hooks/                                                            │
│ │   │   ├── useAuth.ts          # 인증 상태 훅                           │
│ │   │   └── useUser.ts          # 사용자 정보 훅                         │
│ │   │                                                                      │
│ │   └── components/auth/                                                  │
│ │       ├── AuthGuard.tsx       # 인증 필요 페이지 가드                  │
│ │       ├── LoginButton.tsx                                               │
│ │       └── UserMenu.tsx        # 헤더의 사용자 메뉴                     │
│ │                                                                          │
│ └── middleware.ts               # Next.js 미들웨어                        │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

#### AuthProvider 상태 관리

```
┌────────────────────────────────────────────────────────────────────────────┐
│ AUTH PROVIDER STATE                                                         │
│                                                                            │
│ packages/web/lib/providers/AuthProvider.tsx                                │
│                                                                            │
│ interface AuthContextType {                                                │
│   user: User | null;                                                       │
│   session: Session | null;                                                 │
│   isLoading: boolean;                                                      │
│   isAuthenticated: boolean;                                                │
│   signIn: (provider: OAuthProvider) => Promise<void>;                     │
│   signOut: () => Promise<void>;                                            │
│   refreshSession: () => Promise<void>;                                     │
│ }                                                                          │
│                                                                            │
│ 상태 전이:                                                                 │
│                                                                            │
│ [INITIAL]                                                                  │
│ { user: null, session: null, isLoading: true, isAuthenticated: false }    │
│       │                                                                    │
│       │ useEffect → supabase.auth.getSession()                            │
│       │                                                                    │
│       ├───────────────────────┬─────────────────────────┐                  │
│       ▼                       ▼                         ▼                  │
│ [NO SESSION]          [HAS SESSION]            [ERROR]                     │
│ {                     {                        {                           │
│   user: null,           user: User,              user: null,              │
│   session: null,        session: Session,        session: null,           │
│   isLoading: false,     isLoading: false,        isLoading: false,        │
│   isAuthenticated:      isAuthenticated:         isAuthenticated:         │
│     false                 true                     false                   │
│ }                     }                        }                           │
│       │                       │                                            │
│       │ signIn()              │ signOut()                                  │
│       │                       │                                            │
│       ▼                       ▼                                            │
│ [REDIRECTING]         [NO SESSION]                                         │
│ OAuth Provider →                                                           │
│ callback →                                                                 │
│ [HAS SESSION]                                                              │
│                                                                            │
│ onAuthStateChange 이벤트:                                                  │
│ ├─── SIGNED_IN → user, session 업데이트                                   │
│ ├─── SIGNED_OUT → user = null, session = null                             │
│ ├─── TOKEN_REFRESHED → session 업데이트                                   │
│ └─── USER_UPDATED → user 업데이트                                         │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

### U-03 프로필 대시보드 - 컴포넌트 매핑

#### 프로필 페이지 구조

```
┌────────────────────────────────────────────────────────────────────────────┐
│ PROFILE PAGE COMPONENT STRUCTURE                                            │
│                                                                            │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ ProfilePage.tsx (app/profile/page.tsx)                                 │ │
│ │                                                                        │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐│ │
│ │ │ ProfileHeader.tsx                                                  ││ │
│ │ │                                                                    ││ │
│ │ │ ┌──────────┐                                                      ││ │
│ │ │ │          │  Display Name                                        ││ │
│ │ │ │ [Avatar] │  @username                                           ││ │
│ │ │ │          │  "Bio text here..."                                  ││ │
│ │ │ └──────────┘                                                      ││ │
│ │ │               [Edit Profile]                                      ││ │
│ │ │                                                                    ││ │
│ │ │ 컴포넌트:                                                         ││ │
│ │ │ ├─── Avatar.tsx (이미지 또는 이니셜)                              ││ │
│ │ │ └─── EditProfileButton.tsx                                        ││ │
│ │ └────────────────────────────────────────────────────────────────────┘│ │
│ │                                                                        │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐│ │
│ │ │ StatsCards.tsx                                                     ││ │
│ │ │                                                                    ││ │
│ │ │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               ││ │
│ │ │ │ StatCard.tsx │ │ StatCard.tsx │ │ StatCard.tsx │               ││ │
│ │ │ │              │ │              │ │              │               ││ │
│ │ │ │     127      │ │     89%      │ │   ₩45,000    │               ││ │
│ │ │ │    Posts     │ │   Accepted   │ │   Earnings   │               ││ │
│ │ │ │              │ │              │ │              │               ││ │
│ │ │ │ onClick →    │ │              │ │ onClick →    │               ││ │
│ │ │ │ /activity    │ │              │ │ /earnings    │               ││ │
│ │ │ └──────────────┘ └──────────────┘ └──────────────┘               ││ │
│ │ │                                                                    ││ │
│ │ │ 데이터: useProfileStats() 훅                                      ││ │
│ │ └────────────────────────────────────────────────────────────────────┘│ │
│ │                                                                        │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐│ │
│ │ │ BadgeGrid.tsx                                                      ││ │
│ │ │                                                                    ││ │
│ │ │ 🏆 My Badges                                       [View All →]   ││ │
│ │ │                                                                    ││ │
│ │ │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                      ││ │
│ │ │ │Badge   │ │Badge   │ │Badge   │ │  +3    │                      ││ │
│ │ │ │Card.tsx│ │Card.tsx│ │Card.tsx│ │  more  │                      ││ │
│ │ │ │        │ │        │ │        │ │        │                      ││ │
│ │ │ │ [IVE]  │ │ [BTS]  │ │[Early] │ │        │                      ││ │
│ │ │ │Expert  │ │ Fan    │ │Adopter │ │        │                      ││ │
│ │ │ └────────┘ └────────┘ └────────┘ └────────┘                      ││ │
│ │ │                                                                    ││ │
│ │ │ 데이터: useUserBadges() 훅                                        ││ │
│ │ └────────────────────────────────────────────────────────────────────┘│ │
│ │                                                                        │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐│ │
│ │ │ RankingList.tsx                                                    ││ │
│ │ │                                                                    ││ │
│ │ │ 📊 My Rankings                                                    ││ │
│ │ │                                                                    ││ │
│ │ │ ┌────────────────────────────────────────────────────────────────┐││ │
│ │ │ │ RankingItem.tsx                                                │││ │
│ │ │ │ • Global: #42 overall                                          │││ │
│ │ │ └────────────────────────────────────────────────────────────────┘││ │
│ │ │ ┌────────────────────────────────────────────────────────────────┐││ │
│ │ │ │ RankingItem.tsx                                                │││ │
│ │ │ │ • IVE: #3 this week  (↑2)                                     │││ │
│ │ │ └────────────────────────────────────────────────────────────────┘││ │
│ │ │ ┌────────────────────────────────────────────────────────────────┐││ │
│ │ │ │ RankingItem.tsx                                                │││ │
│ │ │ │ • BLACKPINK: #12 this month  (↓3)                             │││ │
│ │ │ └────────────────────────────────────────────────────────────────┘││ │
│ │ │                                                                    ││ │
│ │ │ 데이터: useUserRankings() 훅                                      ││ │
│ │ └────────────────────────────────────────────────────────────────────┘│ │
│ │                                                                        │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐│ │
│ │ │ ProfileActions.tsx                                                 ││ │
│ │ │                                                                    ││ │
│ │ │ [View All Activity]              [Settings ⚙]                     ││ │
│ │ │                                                                    ││ │
│ │ │ onClick → /profile/activity      onClick → /profile/settings      ││ │
│ │ └────────────────────────────────────────────────────────────────────┘│ │
│ │                                                                        │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│ 파일 위치:                                                                 │
│ packages/web/app/profile/page.tsx                                         │
│ packages/web/lib/components/profile/                                      │
│ ├── ProfileHeader.tsx                                                     │
│ ├── StatsCards.tsx                                                        │
│ ├── StatCard.tsx                                                          │
│ ├── BadgeGrid.tsx                                                         │
│ ├── BadgeCard.tsx                                                         │
│ ├── RankingList.tsx                                                       │
│ ├── RankingItem.tsx                                                       │
│ └── ProfileActions.tsx                                                    │
│                                                                            │
│ 훅:                                                                        │
│ packages/web/lib/hooks/                                                   │
│ ├── useProfile.ts                                                         │
│ ├── useProfileStats.ts                                                    │
│ ├── useUserBadges.ts                                                      │
│ └── useUserRankings.ts                                                    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

### 데이터베이스 트리거: 신규 사용자 처리

```sql
-- supabase/migrations/xxx_handle_new_user.sql

-- 신규 사용자 가입 시 자동으로 프로필 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profile (
    id,
    display_name,
    avatar_url,
    auth_provider,
    preferred_language,
    created_at
  ) VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    NEW.raw_app_meta_data->>'provider',
    'ko',
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users 테이블에 트리거 연결
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 엣지 케이스 및 에러 처리

### U-01 소셜 로그인

| 상황 | 처리 방법 | 구현 위치 |
|------|----------|----------|
| OAuth 취소 | 로그인 페이지로 리다이렉트 | callback/route.ts |
| Provider 오류 | 에러 메시지 표시 + 재시도 | LoginPage.tsx |
| 이메일 중복 | 기존 계정 연결 안내 | callback/route.ts |
| 세션 만료 | 자동 로그아웃 + 리다이렉트 | AuthProvider.tsx |
| 쿠키 차단 | 경고 메시지 표시 | LoginPage.tsx |

### U-02 다국어

| 상황 | 처리 방법 | 구현 위치 |
|------|----------|----------|
| 번역 누락 | 키값 그대로 표시 (fallback) | useTranslation.ts |
| 언어 변경 실패 | localStorage 사용 | LanguageToggle.tsx |
| 숫자/날짜 포맷 | Intl API 사용 | formatters.ts |

### U-03 프로필 대시보드

| 상황 | 처리 방법 | 구현 위치 |
|------|----------|----------|
| 프로필 로드 실패 | 스켈레톤 + 재시도 | ProfilePage.tsx |
| 뱃지 0개 | "No badges yet" 메시지 | BadgeGrid.tsx |
| 랭킹 데이터 없음 | "Start contributing" CTA | RankingList.tsx |

### U-05 출금

| 상황 | 처리 방법 | 구현 위치 |
|------|----------|----------|
| 최소 금액 미달 | 버튼 비활성화 + 안내 | WithdrawalForm.tsx |
| 잔액 부족 | 에러 메시지 | useWithdrawal.ts |
| 결제 정보 미입력 | 설정 페이지로 안내 | EarningsPage.tsx |
| 요청 실패 | 재시도 + 고객센터 안내 | WithdrawalForm.tsx |

---

## 모바일 UI 명세

> 이 섹션은 모바일 앱(Expo/React Native)에서의 사용자 시스템 UI를 정의합니다.

### 모바일 로그인 페이지

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ MOBILE LOGIN PAGE                                                             │
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ LoginScreen.tsx (packages/mobile/app/(auth)/login.tsx)                   │ │
│ │                                                                          │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐  │ │
│ │ │                                                                    │  │ │
│ │ │                          [DECODED Logo]                            │  │ │
│ │ │                                                                    │  │ │
│ │ │                                                                    │  │ │
│ │ │                    Discover what they're wearing                   │  │ │
│ │ │                                                                    │  │ │
│ │ │                                                                    │  │ │
│ │ │                                                                    │  │ │
│ │ │                                                                    │  │ │
│ │ │                                                                    │  │ │
│ │ │                         flex: 1 (공백)                             │  │ │
│ │ │                                                                    │  │ │
│ │ │                                                                    │  │ │
│ │ │                                                                    │  │ │
│ │ │                                                                    │  │ │
│ │ │ ┌────────────────────────────────────────────────────────────┐    │  │ │
│ │ │ │ SocialLoginButtons.tsx                                     │    │  │ │
│ │ │ │                                                            │    │  │ │
│ │ │ │ ┌────────────────────────────────────────────────────────┐│    │  │ │
│ │ │ │ │ LoginButton.native.tsx  provider="kakao"               ││    │  │ │
│ │ │ │ │ height: 52px, borderRadius: 12px                       ││    │  │ │
│ │ │ │ │ 🟡 카카오로 로그인                                      ││    │  │ │
│ │ │ │ │                                                        ││    │  │ │
│ │ │ │ │ onPress → Linking.openURL(kakaoOAuthUrl)              ││    │  │ │
│ │ │ │ │ 또는 expo-auth-session 사용                            ││    │  │ │
│ │ │ │ └────────────────────────────────────────────────────────┘│    │  │ │
│ │ │ │                                                            │    │  │ │
│ │ │ │ ┌────────────────────────────────────────────────────────┐│    │  │ │
│ │ │ │ │ LoginButton.native.tsx  provider="google"              ││    │  │ │
│ │ │ │ │ 🔵 Continue with Google                                ││    │  │ │
│ │ │ │ │                                                        ││    │  │ │
│ │ │ │ │ onPress → Google.logInAsync() (expo-google-sign-in)   ││    │  │ │
│ │ │ │ └────────────────────────────────────────────────────────┘│    │  │ │
│ │ │ │                                                            │    │  │ │
│ │ │ │ ┌────────────────────────────────────────────────────────┐│    │  │ │
│ │ │ │ │ LoginButton.native.tsx  provider="apple"               ││    │  │ │
│ │ │ │ │ ⚫ Sign in with Apple                                  ││    │  │ │
│ │ │ │ │                                                        ││    │  │ │
│ │ │ │ │ onPress → Apple.signInAsync() (expo-apple-authentication)│   │  │ │
│ │ │ │ │ iOS 전용: Android에서는 숨김                           ││    │  │ │
│ │ │ │ └────────────────────────────────────────────────────────┘│    │  │ │
│ │ │ │                                                            │    │  │ │
│ │ │ │ ┌────────────────────────────────────────────────────────┐│    │  │ │
│ │ │ │ │ BiometricLoginButton.tsx (조건부 렌더링)               ││    │  │ │
│ │ │ │ │                                                        ││    │  │ │
│ │ │ │ │ 🔐 Face ID / 지문으로 로그인                           ││    │  │ │
│ │ │ │ │                                                        ││    │  │ │
│ │ │ │ │ 조건: 기존 로그인 이력 + 바이오메트릭 활성화          ││    │  │ │
│ │ │ │ │ onPress → LocalAuthentication.authenticateAsync()     ││    │  │ │
│ │ │ │ │ 성공 → SecureStore에서 토큰 복원                      ││    │  │ │
│ │ │ │ └────────────────────────────────────────────────────────┘│    │  │ │
│ │ │ └────────────────────────────────────────────────────────────┘    │  │ │
│ │ │                                                                    │  │ │
│ │ │ <Text style={styles.terms}>                                       │  │ │
│ │ │   By continuing, you agree to our Terms and Privacy Policy       │  │ │
│ │ │ </Text>                                                           │  │ │
│ │ │                                                                    │  │ │
│ │ │ SafeAreaView padding: bottom inset                                │  │ │
│ │ └────────────────────────────────────────────────────────────────────┘  │ │
│ │                                                                          │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ 파일 위치:                                                                   │
│ packages/mobile/app/(auth)/login.tsx                                        │
│ packages/mobile/components/auth/                                            │
│ ├── SocialLoginButtons.tsx                                                  │
│ ├── LoginButton.native.tsx                                                  │
│ └── BiometricLoginButton.tsx                                                │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 모바일 OAuth 플로우 (딥링크)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ MOBILE OAUTH FLOW WITH DEEP LINKING                                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [1. 로그인 버튼 클릭]                                                       │
│       │                                                                      │
│       ▼                                                                      │
│  expo-auth-session 또는 Linking.openURL()                                   │
│       │                                                                      │
│       ├─── Kakao:                                                           │
│       │    WebBrowser.openAuthSessionAsync(                                 │
│       │      `https://kauth.kakao.com/oauth/authorize?...`,                │
│       │      'decoded://auth/callback'                                      │
│       │    )                                                                │
│       │                                                                      │
│       ├─── Google:                                                          │
│       │    Google.logInAsync({                                              │
│       │      iosClientId: GOOGLE_IOS_CLIENT_ID,                            │
│       │      androidClientId: GOOGLE_ANDROID_CLIENT_ID,                    │
│       │      scopes: ['profile', 'email']                                  │
│       │    })                                                               │
│       │                                                                      │
│       └─── Apple (iOS only):                                                │
│            AppleAuthentication.signInAsync({                                │
│              requestedScopes: [                                             │
│                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,     │
│                AppleAuthentication.AppleAuthenticationScope.EMAIL          │
│              ]                                                              │
│            })                                                               │
│                                                                              │
│  [2. Provider 앱/웹 브라우저에서 인증]                                       │
│       │                                                                      │
│       ▼                                                                      │
│  [3. 딥링크로 앱 복귀]                                                       │
│       │                                                                      │
│       ├─── URL: decoded://auth/callback?code=xxx                           │
│       │                                                                      │
│       ▼                                                                      │
│  [4. 앱 내 처리]                                                             │
│       │                                                                      │
│       ├─── app/(auth)/callback.tsx에서 code 추출                           │
│       │                                                                      │
│       ├─── Supabase에 code 전송하여 세션 교환                              │
│       │    supabase.auth.exchangeCodeForSession(code)                      │
│       │                                                                      │
│       ├─── 세션을 SecureStore에 저장 (자동 로그인용)                        │
│       │    SecureStore.setItemAsync('session', JSON.stringify(session))    │
│       │                                                                      │
│       └─── 메인 화면으로 이동                                               │
│            router.replace('/(tabs)/')                                       │
│                                                                              │
│  app.json 설정:                                                              │
│  {                                                                           │
│    "expo": {                                                                 │
│      "scheme": "decoded",                                                   │
│      "ios": {                                                               │
│        "bundleIdentifier": "com.decoded.app",                              │
│        "associatedDomains": ["applinks:decoded.app"]                       │
│      },                                                                     │
│      "android": {                                                           │
│        "intentFilters": [{                                                  │
│          "action": "VIEW",                                                  │
│          "data": [{ "scheme": "decoded", "host": "auth" }]                │
│        }]                                                                   │
│      }                                                                      │
│    }                                                                        │
│  }                                                                          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### 모바일 프로필 페이지

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ MOBILE PROFILE PAGE                                                           │
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ ProfileScreen.tsx (packages/mobile/app/(tabs)/profile/index.tsx)         │ │
│ │                                                                          │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐  │ │
│ │ │ Animated.ScrollView with onScroll                                  │  │ │
│ │ │                                                                    │  │ │
│ │ │ ┌──────────────────────────────────────────────────────────────┐  │  │ │
│ │ │ │ ProfileHeaderMobile.tsx                                      │  │  │ │
│ │ │ │                                                              │  │  │ │
│ │ │ │ 스크롤 시 축소 애니메이션:                                   │  │  │ │
│ │ │ │ - 기본: height 200px, Avatar 80px                           │  │  │ │
│ │ │ │ - 축소: height 60px, Avatar 40px, 이름만 표시              │  │  │ │
│ │ │ │                                                              │  │  │ │
│ │ │ │ ┌────────────────────────────────────────────────────────┐  │  │  │ │
│ │ │ │ │         [Avatar 80px]                                  │  │  │  │ │
│ │ │ │ │                                                        │  │  │  │ │
│ │ │ │ │         Display Name                                   │  │  │  │ │
│ │ │ │ │         @username                                      │  │  │  │ │
│ │ │ │ │         "Bio text..."                                  │  │  │  │ │
│ │ │ │ │                                                        │  │  │  │ │
│ │ │ │ │         [Edit Profile]  [Settings ⚙]                  │  │  │  │ │
│ │ │ │ └────────────────────────────────────────────────────────┘  │  │  │ │
│ │ │ └──────────────────────────────────────────────────────────────┘  │  │ │
│ │ │                                                                    │  │ │
│ │ │ ┌──────────────────────────────────────────────────────────────┐  │  │ │
│ │ │ │ StatsCardsMobile.tsx                                         │  │  │ │
│ │ │ │                                                              │  │  │ │
│ │ │ │ <ScrollView horizontal showsHorizontalScrollIndicator={false}>│ │  │ │
│ │ │ │                                                              │  │  │ │
│ │ │ │ ┌──────────┐ ┌──────────┐ ┌──────────┐                     │  │  │ │
│ │ │ │ │StatCard  │ │StatCard  │ │StatCard  │                     │  │  │ │
│ │ │ │ │Mobile.tsx│ │Mobile.tsx│ │Mobile.tsx│                     │  │  │ │
│ │ │ │ │          │ │          │ │          │                     │  │  │ │
│ │ │ │ │   127    │ │   89%    │ │ ₩45,000  │                     │  │  │ │
│ │ │ │ │  Posts   │ │ Accepted │ │ Earnings │                     │  │  │ │
│ │ │ │ │          │ │          │ │          │                     │  │  │ │
│ │ │ │ │ width:   │ │          │ │          │                     │  │  │ │
│ │ │ │ │ 120px    │ │          │ │          │                     │  │  │ │
│ │ │ │ └──────────┘ └──────────┘ └──────────┘                     │  │  │ │
│ │ │ │                                                              │  │  │ │
│ │ │ │ </ScrollView>                                                │  │  │ │
│ │ │ └──────────────────────────────────────────────────────────────┘  │  │ │
│ │ │                                                                    │  │ │
│ │ │ ┌──────────────────────────────────────────────────────────────┐  │  │ │
│ │ │ │ BadgeGridMobile.tsx                                          │  │  │ │
│ │ │ │                                                              │  │  │ │
│ │ │ │ 🏆 My Badges                              [View All →]       │  │  │ │
│ │ │ │                                                              │  │  │ │
│ │ │ │ <FlatList numColumns={2} />                                  │  │  │ │
│ │ │ │                                                              │  │  │ │
│ │ │ │ ┌──────────────────┐ ┌──────────────────┐                   │  │  │ │
│ │ │ │ │ BadgeCard        │ │ BadgeCard        │                   │  │  │ │
│ │ │ │ │ Mobile.tsx       │ │ Mobile.tsx       │                   │  │  │ │
│ │ │ │ │                  │ │                  │                   │  │  │ │
│ │ │ │ │ [IVE Expert]     │ │ [BTS Fan]        │                   │  │  │ │
│ │ │ │ │ 획득: 2026-01-05 │ │ 획득: 2025-12-20 │                   │  │  │ │
│ │ │ │ └──────────────────┘ └──────────────────┘                   │  │  │ │
│ │ │ │ ┌──────────────────┐ ┌──────────────────┐                   │  │  │ │
│ │ │ │ │ [Early Adopter]  │ │ [+3 more]        │                   │  │  │ │
│ │ │ │ └──────────────────┘ └──────────────────┘                   │  │  │ │
│ │ │ └──────────────────────────────────────────────────────────────┘  │  │ │
│ │ │                                                                    │  │ │
│ │ │ ┌──────────────────────────────────────────────────────────────┐  │  │ │
│ │ │ │ RankingListMobile.tsx                                        │  │  │ │
│ │ │ │                                                              │  │  │ │
│ │ │ │ 📊 My Rankings                                               │  │  │ │
│ │ │ │                                                              │  │  │ │
│ │ │ │ ┌────────────────────────────────────────────────────────┐  │  │  │ │
│ │ │ │ │ • Global: #42 overall                                  │  │  │  │ │
│ │ │ │ └────────────────────────────────────────────────────────┘  │  │  │ │
│ │ │ │ ┌────────────────────────────────────────────────────────┐  │  │  │ │
│ │ │ │ │ • IVE: #3 this week  (↑2)                             │  │  │  │ │
│ │ │ │ └────────────────────────────────────────────────────────┘  │  │  │ │
│ │ │ │ ┌────────────────────────────────────────────────────────┐  │  │  │ │
│ │ │ │ │ • BLACKPINK: #12 this month                           │  │  │  │ │
│ │ │ │ └────────────────────────────────────────────────────────┘  │  │  │ │
│ │ │ └──────────────────────────────────────────────────────────────┘  │  │ │
│ │ │                                                                    │  │ │
│ │ │ ┌──────────────────────────────────────────────────────────────┐  │  │ │
│ │ │ │ QuickActionsMobile.tsx                                       │  │  │ │
│ │ │ │                                                              │  │  │ │
│ │ │ │ ┌────────────────────┐ ┌────────────────────┐               │  │  │ │
│ │ │ │ │ 📝 View Activity   │ │ 💰 My Earnings     │               │  │  │ │
│ │ │ │ │                    │ │                    │               │  │  │ │
│ │ │ │ │ onPress →          │ │ onPress →          │               │  │  │ │
│ │ │ │ │ router.push(       │ │ router.push(       │               │  │  │ │
│ │ │ │ │   '/profile/       │ │   '/profile/       │               │  │  │ │
│ │ │ │ │    activity')      │ │    earnings')      │               │  │  │ │
│ │ │ │ └────────────────────┘ └────────────────────┘               │  │  │ │
│ │ │ └──────────────────────────────────────────────────────────────┘  │  │ │
│ │ └────────────────────────────────────────────────────────────────────┘  │ │
│ │                                                                          │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ 파일 위치:                                                                   │
│ packages/mobile/app/(tabs)/profile/index.tsx                                │
│ packages/mobile/components/profile/                                         │
│ ├── ProfileHeaderMobile.tsx                                                 │
│ ├── StatsCardsMobile.tsx                                                    │
│ ├── StatCardMobile.tsx                                                      │
│ ├── BadgeGridMobile.tsx                                                     │
│ ├── BadgeCardMobile.tsx                                                     │
│ ├── RankingListMobile.tsx                                                   │
│ └── QuickActionsMobile.tsx                                                  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### U-04 활동 내역 - 컴포넌트 매핑

#### 활동 페이지 구조 (웹)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ACTIVITY PAGE COMPONENT STRUCTURE (WEB)                                       │
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ ActivityPage.tsx (packages/web/app/profile/activity/page.tsx)            │ │
│ │                                                                          │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐  │ │
│ │ │ ActivityTabs.tsx                                                   │  │ │
│ │ │                                                                    │  │ │
│ │ │ interface ActivityTabsProps {                                      │  │ │
│ │ │   activeTab: 'posts' | 'answers' | 'favorites';                   │  │ │
│ │ │   onTabChange: (tab: ActiveTab) => void;                          │  │ │
│ │ │   counts: { posts: number; answers: number; favorites: number };  │  │ │
│ │ │ }                                                                  │  │ │
│ │ │                                                                    │  │ │
│ │ │ ┌──────────────────┐┌──────────────────┐┌──────────────────┐     │  │ │
│ │ │ │  My Posts (127)  ││ My Answers (89)  ││ Favorites (45)   │     │  │ │
│ │ │ │                  ││                  ││                  │     │  │ │
│ │ │ │  active: border- ││                  ││                  │     │  │ │
│ │ │ │  bottom-2        ││                  ││                  │     │  │ │
│ │ │ └──────────────────┘└──────────────────┘└──────────────────┘     │  │ │
│ │ └────────────────────────────────────────────────────────────────────┘  │ │
│ │                                                                          │ │
│ │ {activeTab === 'posts' && (                                             │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐  │ │
│ │ │ PostList.tsx                                                       │  │ │
│ │ │                                                                    │  │ │
│ │ │ interface PostListProps {                                          │  │ │
│ │ │   posts: Post[];                                                   │  │ │
│ │ │   isLoading: boolean;                                              │  │ │
│ │ │   hasNextPage: boolean;                                            │  │ │
│ │ │   onLoadMore: () => void;                                          │  │ │
│ │ │   onDelete: (id: string) => void;                                  │  │ │
│ │ │   onEdit: (id: string) => void;                                    │  │ │
│ │ │ }                                                                  │  │ │
│ │ │                                                                    │  │ │
│ │ │ ┌────────────────────────────────────────────────────────────┐    │  │ │
│ │ │ │ PostListItem.tsx                                           │    │  │ │
│ │ │ │                                                            │    │  │ │
│ │ │ │ interface PostListItemProps {                              │    │  │ │
│ │ │ │   post: {                                                  │    │  │ │
│ │ │ │     id: string;                                            │    │  │ │
│ │ │ │     thumbnailUrl: string;                                  │    │  │ │
│ │ │ │     title: string;                                         │    │  │ │
│ │ │ │     status: 'draft' | 'pending' | 'published' | 'rejected';│    │  │ │
│ │ │ │     createdAt: Date;                                       │    │  │ │
│ │ │ │     viewCount: number;                                     │    │  │ │
│ │ │ │     commentCount: number;                                  │    │  │ │
│ │ │ │   };                                                       │    │  │ │
│ │ │ │   onEdit?: () => void;                                     │    │  │ │
│ │ │ │   onDelete?: () => void;                                   │    │  │ │
│ │ │ │ }                                                          │    │  │ │
│ │ │ │                                                            │    │  │ │
│ │ │ │ ┌────────┐ Post Title                                     │    │  │ │
│ │ │ │ │        │ Jan 5, 2026 • Published                        │    │  │ │
│ │ │ │ │ Thumb  │ 15 views • 3 comments                          │    │  │ │
│ │ │ │ │        │                        [Edit] [Delete]         │    │  │ │
│ │ │ │ └────────┘                                                 │    │  │ │
│ │ │ │                                                            │    │  │ │
│ │ │ │ states:                                                    │    │  │ │
│ │ │ │ - draft: 회색 배지                                         │    │  │ │
│ │ │ │ - pending: 노란 배지                                       │    │  │ │
│ │ │ │ - published: 초록 배지                                     │    │  │ │
│ │ │ │ - rejected: 빨간 배지 + 사유 툴팁                         │    │  │ │
│ │ │ └────────────────────────────────────────────────────────────┘    │  │ │
│ │ │                                                                    │  │ │
│ │ │ {isLoading && <PostListSkeleton count={3} />}                     │  │ │
│ │ │                                                                    │  │ │
│ │ │ {hasNextPage && (                                                  │  │ │
│ │ │   <LoadMoreButton onClick={onLoadMore} />                          │  │ │
│ │ │ )}                                                                 │  │ │
│ │ └────────────────────────────────────────────────────────────────────┘  │ │
│ │ )}                                                                      │ │
│ │                                                                          │ │
│ │ {activeTab === 'answers' && (                                           │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐  │ │
│ │ │ AnswerList.tsx                                                     │  │ │
│ │ │                                                                    │  │ │
│ │ │ interface AnswerListProps {                                        │  │ │
│ │ │   answers: Answer[];                                               │  │ │
│ │ │   isLoading: boolean;                                              │  │ │
│ │ │   hasNextPage: boolean;                                            │  │ │
│ │ │   onLoadMore: () => void;                                          │  │ │
│ │ │ }                                                                  │  │ │
│ │ │                                                                    │  │ │
│ │ │ ┌────────────────────────────────────────────────────────────┐    │  │ │
│ │ │ │ AnswerListItem.tsx                                         │    │  │ │
│ │ │ │                                                            │    │  │ │
│ │ │ │ interface AnswerListItemProps {                            │    │  │ │
│ │ │ │   answer: {                                                │    │  │ │
│ │ │ │     id: string;                                            │    │  │ │
│ │ │ │     itemCropUrl: string;                                   │    │  │ │
│ │ │ │     relatedPost: { title: string; thumbnailUrl: string };  │    │  │ │
│ │ │ │     upvoteCount: number;                                   │    │  │ │
│ │ │ │     isAccepted: boolean;                                   │    │  │ │
│ │ │ │     createdAt: Date;                                       │    │  │ │
│ │ │ │   };                                                       │    │  │ │
│ │ │ │ }                                                          │    │  │ │
│ │ │ │                                                            │    │  │ │
│ │ │ │ ┌────────┐ On: "Post Title"                               │    │  │ │
│ │ │ │ │        │ Item: Celine Jacket                            │    │  │ │
│ │ │ │ │ Crop   │ ▲ 23 upvotes  ✓ Accepted                       │    │  │ │
│ │ │ │ │        │ Jan 3, 2026                                    │    │  │ │
│ │ │ │ └────────┘                                                 │    │  │ │
│ │ │ └────────────────────────────────────────────────────────────┘    │  │ │
│ │ └────────────────────────────────────────────────────────────────────┘  │ │
│ │ )}                                                                      │ │
│ │                                                                          │ │
│ │ {activeTab === 'favorites' && (                                         │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐  │ │
│ │ │ FavoriteList.tsx                                                   │  │ │
│ │ │                                                                    │  │ │
│ │ │ interface FavoriteListProps {                                      │  │ │
│ │ │   favorites: Favorite[];                                           │  │ │
│ │ │   isLoading: boolean;                                              │  │ │
│ │ │   hasNextPage: boolean;                                            │  │ │
│ │ │   onLoadMore: () => void;                                          │  │ │
│ │ │   onRemove: (id: string) => void;                                  │  │ │
│ │ │ }                                                                  │  │ │
│ │ │                                                                    │  │ │
│ │ │ ┌────────────────────────────────────────────────────────────┐    │  │ │
│ │ │ │ FavoriteListItem.tsx                                       │    │  │ │
│ │ │ │                                                            │    │  │ │
│ │ │ │ interface FavoriteListItemProps {                          │    │  │ │
│ │ │ │   favorite: {                                              │    │  │ │
│ │ │ │     id: string;                                            │    │  │ │
│ │ │ │     type: 'post' | 'item';                                 │    │  │ │
│ │ │ │     thumbnailUrl: string;                                  │    │  │ │
│ │ │ │     title: string;                                         │    │  │ │
│ │ │ │     savedAt: Date;                                         │    │  │ │
│ │ │ │   };                                                       │    │  │ │
│ │ │ │   onRemove: () => void;                                    │    │  │ │
│ │ │ │ }                                                          │    │  │ │
│ │ │ │                                                            │    │  │ │
│ │ │ │ ┌────────┐ Item Name                         [♥] [✕]      │    │  │ │
│ │ │ │ │        │ Brand: Celine                                  │    │  │ │
│ │ │ │ │ Thumb  │ Saved: Jan 2, 2026                             │    │  │ │
│ │ │ │ │        │                                                 │    │  │ │
│ │ │ │ └────────┘                                                 │    │  │ │
│ │ │ └────────────────────────────────────────────────────────────┘    │  │ │
│ │ └────────────────────────────────────────────────────────────────────┘  │ │
│ │ )}                                                                      │ │
│ │                                                                          │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ 훅:                                                                          │
│ packages/web/lib/hooks/                                                     │
│ ├── useMyPosts.ts     → useInfiniteQuery('/api/profile/posts')             │
│ ├── useMyAnswers.ts   → useInfiniteQuery('/api/profile/answers')           │
│ └── useMyFavorites.ts → useInfiniteQuery('/api/profile/favorites')         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 활동 페이지 (모바일)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ACTIVITY PAGE (MOBILE)                                                        │
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ ActivityScreen.tsx (packages/mobile/app/(tabs)/profile/activity.tsx)     │ │
│ │                                                                          │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐  │ │
│ │ │ TabBarMobile.tsx (상단 고정)                                       │  │ │
│ │ │                                                                    │  │ │
│ │ │ ┌────────────┐ ┌────────────┐ ┌────────────┐                     │  │ │
│ │ │ │ Posts (127)│ │Answers (89)│ │ Favs (45)  │                     │  │ │
│ │ │ │ ━━━━━━━━━━ │ │            │ │            │                     │  │ │
│ │ │ └────────────┘ └────────────┘ └────────────┘                     │  │ │
│ │ │                                                                    │  │ │
│ │ │ animated underline indicator                                       │  │ │
│ │ └────────────────────────────────────────────────────────────────────┘  │ │
│ │                                                                          │ │
│ │ <PagerView> (스와이프로 탭 전환)                                        │ │
│ │                                                                          │ │
│ │ [Page 0: Posts]                                                          │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐  │ │
│ │ │ PostListMobile.tsx                                                 │  │ │
│ │ │                                                                    │  │ │
│ │ │ <FlashList                                                         │  │ │
│ │ │   data={posts}                                                     │  │ │
│ │ │   renderItem={({ item }) => (                                     │  │ │
│ │ │     <Swipeable                                                     │  │ │
│ │ │       renderRightActions={() => (                                  │  │ │
│ │ │         <DeleteAction onPress={() => onDelete(item.id)} />         │  │ │
│ │ │       )}                                                           │  │ │
│ │ │     >                                                              │  │ │
│ │ │       <PostListItemMobile post={item} />                          │  │ │
│ │ │     </Swipeable>                                                   │  │ │
│ │ │   )}                                                               │  │ │
│ │ │   onEndReached={onLoadMore}                                        │  │ │
│ │ │   estimatedItemSize={100}                                          │  │ │
│ │ │ />                                                                 │  │ │
│ │ │                                                                    │  │ │
│ │ │ 스와이프 제스처:                                                   │  │ │
│ │ │ - 좌 스와이프: 삭제 버튼 노출 (빨간색)                            │  │ │
│ │ │ - 롱프레스: Context Menu (편집, 삭제, 공유)                       │  │ │
│ │ └────────────────────────────────────────────────────────────────────┘  │ │
│ │                                                                          │ │
│ │ [Page 1: Answers]                                                        │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐  │ │
│ │ │ AnswerListMobile.tsx                                               │  │ │
│ │ │                                                                    │  │ │
│ │ │ <FlashList />                                                      │  │ │
│ │ │ (삭제 불가 → 스와이프 없음)                                       │  │ │
│ │ └────────────────────────────────────────────────────────────────────┘  │ │
│ │                                                                          │ │
│ │ [Page 2: Favorites]                                                      │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐  │ │
│ │ │ FavoriteListMobile.tsx                                             │  │ │
│ │ │                                                                    │  │ │
│ │ │ <FlashList>                                                        │  │ │
│ │ │   스와이프: 즐겨찾기 해제 (하트 아이콘)                           │  │ │
│ │ │ />                                                                 │  │ │
│ │ └────────────────────────────────────────────────────────────────────┘  │ │
│ │                                                                          │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ 파일 위치:                                                                   │
│ packages/mobile/app/(tabs)/profile/activity.tsx                             │
│ packages/mobile/components/activity/                                        │
│ ├── TabBarMobile.tsx                                                        │
│ ├── PostListMobile.tsx                                                      │
│ ├── PostListItemMobile.tsx                                                  │
│ ├── AnswerListMobile.tsx                                                    │
│ ├── AnswerListItemMobile.tsx                                                │
│ ├── FavoriteListMobile.tsx                                                  │
│ └── FavoriteListItemMobile.tsx                                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### U-05 수익/출금 - 컴포넌트 매핑

#### 수익 페이지 구조 (웹)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ EARNINGS PAGE COMPONENT STRUCTURE (WEB)                                       │
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ EarningsPage.tsx (packages/web/app/profile/earnings/page.tsx)            │ │
│ │                                                                          │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐  │ │
│ │ │ EarningsCard.tsx                                                   │  │ │
│ │ │                                                                    │  │ │
│ │ │ interface EarningsCardProps {                                      │  │ │
│ │ │   availableBalance: number;                                        │  │ │
│ │ │   pendingAmount: number;                                           │  │ │
│ │ │   processingAmount: number;                                        │  │ │
│ │ │   currency: 'KRW' | 'USD';                                         │  │ │
│ │ │   onWithdrawClick: () => void;                                     │  │ │
│ │ │   canWithdraw: boolean;  // >= 최소 출금액                         │  │ │
│ │ │ }                                                                  │  │ │
│ │ │                                                                    │  │ │
│ │ │ ┌────────────────────────────────────────────────────────────┐    │  │ │
│ │ │ │                                                            │    │  │ │
│ │ │ │  💰 My Earnings                                            │    │  │ │
│ │ │ │                                                            │    │  │ │
│ │ │ │  Available Balance                                         │    │  │ │
│ │ │ │  ┌────────────────────────────────────────────────┐       │    │  │ │
│ │ │ │  │  ₩ 45,320                                      │       │    │  │ │
│ │ │ │  │  (formatCurrency(availableBalance))            │       │    │  │ │
│ │ │ │  └────────────────────────────────────────────────┘       │    │  │ │
│ │ │ │                                                            │    │  │ │
│ │ │ │  ┌────────────────────┐ ┌────────────────────┐            │    │  │ │
│ │ │ │  │ Pending            │ │ Processing         │            │    │  │ │
│ │ │ │  │ ₩12,000            │ │ ₩0                 │            │    │  │ │
│ │ │ │  │ (Jan clicks)       │ │                    │            │    │  │ │
│ │ │ │  │                    │ │                    │            │    │  │ │
│ │ │ │  │ Tooltip: 클릭 후   │ │ Tooltip: 출금     │            │    │  │ │
│ │ │ │  │ 30일 뒤 확정      │ │ 요청 처리 중      │            │    │  │ │
│ │ │ │  └────────────────────┘ └────────────────────┘            │    │  │ │
│ │ │ │                                                            │    │  │ │
│ │ │ │  ┌────────────────────────────────────────────────┐       │    │  │ │
│ │ │ │  │ [Request Withdrawal]                           │       │    │  │ │
│ │ │ │  │                                                │       │    │  │ │
│ │ │ │  │ disabled={!canWithdraw}                        │       │    │  │ │
│ │ │ │  │ disabledReason="최소 ₩10,000 이상 필요"       │       │    │  │ │
│ │ │ │  └────────────────────────────────────────────────┘       │    │  │ │
│ │ │ │                                                            │    │  │ │
│ │ │ └────────────────────────────────────────────────────────────┘    │  │ │
│ │ └────────────────────────────────────────────────────────────────────┘  │ │
│ │                                                                          │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐  │ │
│ │ │ WithdrawalHistory.tsx                                              │  │ │
│ │ │                                                                    │  │ │
│ │ │ interface WithdrawalHistoryProps {                                 │  │ │
│ │ │   withdrawals: Withdrawal[];                                       │  │ │
│ │ │   isLoading: boolean;                                              │  │ │
│ │ │ }                                                                  │  │ │
│ │ │                                                                    │  │ │
│ │ │ 📋 Withdrawal History                                              │  │ │
│ │ │                                                                    │  │ │
│ │ │ ┌────────────────────────────────────────────────────────────┐    │  │ │
│ │ │ │ WithdrawalHistoryItem.tsx                                  │    │  │ │
│ │ │ │                                                            │    │  │ │
│ │ │ │ interface WithdrawalHistoryItemProps {                     │    │  │ │
│ │ │ │   withdrawal: {                                            │    │  │ │
│ │ │ │     id: string;                                            │    │  │ │
│ │ │ │     amount: number;                                        │    │  │ │
│ │ │ │     status: 'pending' | 'processing' | 'completed' | 'rejected';│ │  │ │
│ │ │ │     requestedAt: Date;                                     │    │  │ │
│ │ │ │     completedAt?: Date;                                    │    │  │ │
│ │ │ │     paymentMethod: string;                                 │    │  │ │
│ │ │ │     rejectionReason?: string;                              │    │  │ │
│ │ │ │   };                                                       │    │  │ │
│ │ │ │ }                                                          │    │  │ │
│ │ │ │                                                            │    │  │ │
│ │ │ │ ₩30,000 • Completed ✓ • Dec 15, 2025                      │    │  │ │
│ │ │ │ 신한은행 xxx-xxx-1234로 입금                              │    │  │ │
│ │ │ │                                                            │    │  │ │
│ │ │ │ 상태 배지:                                                 │    │  │ │
│ │ │ │ - pending: 노란색 "대기 중"                               │    │  │ │
│ │ │ │ - processing: 파란색 "처리 중"                            │    │  │ │
│ │ │ │ - completed: 초록색 "완료"                                │    │  │ │
│ │ │ │ - rejected: 빨간색 "거부됨" + 사유 표시                   │    │  │ │
│ │ │ └────────────────────────────────────────────────────────────┘    │  │ │
│ │ │                                                                    │  │ │
│ │ │ (withdrawals.length === 0 && <EmptyState message="출금 내역 없음"/>)│ │ │
│ │ └────────────────────────────────────────────────────────────────────┘  │ │
│ │                                                                          │ │
│ │ {showWithdrawalModal && (                                               │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐  │ │
│ │ │ WithdrawalModal.tsx                                                │  │ │
│ │ │                                                                    │  │ │
│ │ │ ┌────────────────────────────────────────────────────────────┐    │  │ │
│ │ │ │ WithdrawalForm.tsx                                         │    │  │ │
│ │ │ │                                                            │    │  │ │
│ │ │ │ interface WithdrawalFormProps {                            │    │  │ │
│ │ │ │   maxAmount: number;                                       │    │  │ │
│ │ │ │   minAmount: number;  // 10000                             │    │  │ │
│ │ │ │   savedPaymentMethods: PaymentMethod[];                    │    │  │ │
│ │ │ │   onSubmit: (data: WithdrawalRequest) => Promise<void>;   │    │  │ │
│ │ │ │   onCancel: () => void;                                    │    │  │ │
│ │ │ │ }                                                          │    │  │ │
│ │ │ │                                                            │    │  │ │
│ │ │ │ ┌────────────────────────────────────────────────────┐    │    │  │ │
│ │ │ │ │ 출금 금액                                          │    │    │  │ │
│ │ │ │ │                                                    │    │    │  │ │
│ │ │ │ │ ┌──────────────────────────────────────────┐      │    │    │  │ │
│ │ │ │ │ │ ₩ [      45,320     ]                    │      │    │    │  │ │
│ │ │ │ │ └──────────────────────────────────────────┘      │    │    │  │ │
│ │ │ │ │                                                    │    │    │  │ │
│ │ │ │ │ [전액 출금]  최소 ₩10,000 / 최대 ₩45,320        │    │    │  │ │
│ │ │ │ │                                                    │    │    │  │ │
│ │ │ │ │ Validation:                                        │    │    │  │ │
│ │ │ │ │ - amount >= 10000: "최소 출금액 미달"             │    │    │  │ │
│ │ │ │ │ - amount <= maxAmount: "잔액 초과"                │    │    │  │ │
│ │ │ │ │ - isNumber: "올바른 금액 입력"                    │    │    │  │ │
│ │ │ │ └────────────────────────────────────────────────────┘    │    │  │ │
│ │ │ │                                                            │    │  │ │
│ │ │ │ ┌────────────────────────────────────────────────────┐    │    │  │ │
│ │ │ │ │ 결제 방법                                          │    │    │  │ │
│ │ │ │ │                                                    │    │    │  │ │
│ │ │ │ │ ┌──────────────────────────────────────────┐      │    │    │  │ │
│ │ │ │ │ │ PaymentMethodSelector.tsx                │      │    │    │  │ │
│ │ │ │ │ │                                          │      │    │    │  │ │
│ │ │ │ │ │ (●) 신한은행 xxx-xxx-1234 (저장됨)       │      │    │    │  │ │
│ │ │ │ │ │ ( ) PayPal: user@email.com (저장됨)     │      │    │    │  │ │
│ │ │ │ │ │ ( ) + 새 계좌 추가                       │      │    │    │  │ │
│ │ │ │ │ └──────────────────────────────────────────┘      │    │    │  │ │
│ │ │ │ │                                                    │    │    │  │ │
│ │ │ │ │ [+ 새 계좌 추가] 클릭 시:                         │    │    │  │ │
│ │ │ │ │ ┌──────────────────────────────────────────┐      │    │    │  │ │
│ │ │ │ │ │ NewPaymentMethodForm.tsx                 │      │    │    │  │ │
│ │ │ │ │ │                                          │      │    │    │  │ │
│ │ │ │ │ │ 방법: [은행 송금 ▼] / [PayPal]           │      │    │    │  │ │
│ │ │ │ │ │                                          │      │    │    │  │ │
│ │ │ │ │ │ 은행 선택:                               │      │    │    │  │ │
│ │ │ │ │ │ [신한은행  ▼]                            │      │    │    │  │ │
│ │ │ │ │ │                                          │      │    │    │  │ │
│ │ │ │ │ │ 계좌번호:                                │      │    │    │  │ │
│ │ │ │ │ │ [___-___-______]                         │      │    │    │  │ │
│ │ │ │ │ │                                          │      │    │    │  │ │
│ │ │ │ │ │ 예금주: [        ]                       │      │    │    │  │ │
│ │ │ │ │ │                                          │      │    │    │  │ │
│ │ │ │ │ │ [✓] 다음에도 이 계좌 사용                │      │    │    │  │ │
│ │ │ │ │ └──────────────────────────────────────────┘      │    │    │  │ │
│ │ │ │ └────────────────────────────────────────────────────┘    │    │  │ │
│ │ │ │                                                            │    │  │ │
│ │ │ │ ┌────────────────────────────────────────────────────┐    │    │  │ │
│ │ │ │ │ 출금 요약 (확인 단계)                              │    │    │  │ │
│ │ │ │ │                                                    │    │    │  │ │
│ │ │ │ │ 출금 금액: ₩45,320                                │    │    │  │ │
│ │ │ │ │ 수수료: ₩0 (무료)                                 │    │    │  │ │
│ │ │ │ │ ─────────────────                                  │    │    │  │ │
│ │ │ │ │ 실 입금액: ₩45,320                                │    │    │  │ │
│ │ │ │ │                                                    │    │    │  │ │
│ │ │ │ │ 입금 예정: 신한은행 xxx-xxx-1234                  │    │    │  │ │
│ │ │ │ │ 처리 기간: 5-7 영업일                             │    │    │  │ │
│ │ │ │ │                                                    │    │    │  │ │
│ │ │ │ │ ⚠️ 세금 관련 안내                                 │    │    │  │ │
│ │ │ │ │ 연간 소득에 따라 원천징수가 적용될 수 있습니다   │    │    │  │ │
│ │ │ │ └────────────────────────────────────────────────────┘    │    │  │ │
│ │ │ │                                                            │    │  │ │
│ │ │ │             [Cancel]  [Confirm Withdrawal]                 │    │  │ │
│ │ │ │                                                            │    │  │ │
│ │ │ └────────────────────────────────────────────────────────────┘    │  │ │
│ │ └────────────────────────────────────────────────────────────────────┘  │ │
│ │ )}                                                                      │ │
│ │                                                                          │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ 훅:                                                                          │
│ packages/web/lib/hooks/                                                     │
│ ├── useEarnings.ts        → useQuery('/api/profile/earnings')              │
│ ├── useWithdrawals.ts     → useQuery('/api/profile/withdrawals')           │
│ ├── usePaymentMethods.ts  → useQuery('/api/profile/payment-methods')       │
│ └── useWithdrawal.ts      → useMutation('/api/profile/earnings/withdraw')  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 수익 페이지 (모바일)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ EARNINGS PAGE (MOBILE)                                                        │
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ EarningsScreen.tsx (packages/mobile/app/(tabs)/profile/earnings.tsx)     │ │
│ │                                                                          │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐  │ │
│ │ │ EarningsCardMobile.tsx                                             │  │ │
│ │ │                                                                    │  │ │
│ │ │ ┌────────────────────────────────────────────────────────────┐    │  │ │
│ │ │ │             💰 My Earnings                                 │    │  │ │
│ │ │ │                                                            │    │  │ │
│ │ │ │              ₩ 45,320                                      │    │  │ │
│ │ │ │             Available                                      │    │  │ │
│ │ │ │                                                            │    │  │ │
│ │ │ │  ┌──────────────────┐ ┌──────────────────┐                │    │  │ │
│ │ │ │  │ ₩12,000         │ │ ₩0               │                │    │  │ │
│ │ │ │  │ Pending         │ │ Processing       │                │    │  │ │
│ │ │ │  └──────────────────┘ └──────────────────┘                │    │  │ │
│ │ │ │                                                            │    │  │ │
│ │ │ │  ┌────────────────────────────────────────────────────┐  │    │  │ │
│ │ │ │  │           [💳 Request Withdrawal]                  │  │    │  │ │
│ │ │ │  │                                                    │  │    │  │ │
│ │ │ │  │           onPress → bottomSheet.expand()          │  │    │  │ │
│ │ │ │  └────────────────────────────────────────────────────┘  │    │  │ │
│ │ │ └────────────────────────────────────────────────────────────┘    │  │ │
│ │ └────────────────────────────────────────────────────────────────────┘  │ │
│ │                                                                          │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐  │ │
│ │ │ 📋 Withdrawal History                                              │  │ │
│ │ │                                                                    │  │ │
│ │ │ <FlashList                                                         │  │ │
│ │ │   data={withdrawals}                                               │  │ │
│ │ │   renderItem={WithdrawalHistoryItemMobile}                        │  │ │
│ │ │ />                                                                 │  │ │
│ │ └────────────────────────────────────────────────────────────────────┘  │ │
│ │                                                                          │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐  │ │
│ │ │ WithdrawalBottomSheet.tsx (BottomSheetModal)                       │  │ │
│ │ │                                                                    │  │ │
│ │ │ ┌────────────────────────────────────────────────────────────┐    │  │ │
│ │ │ │ 출금 금액                                                  │    │  │ │
│ │ │ │                                                            │    │  │ │
│ │ │ │ ┌──────────────────────────────────────────────────────┐  │    │  │ │
│ │ │ │ │ NumericKeypad.tsx                                    │  │    │  │ │
│ │ │ │ │                                                      │  │    │  │ │
│ │ │ │ │ 표시: ₩ 45,320                                       │  │    │  │ │
│ │ │ │ │                                                      │  │    │  │ │
│ │ │ │ │ ┌─────┐ ┌─────┐ ┌─────┐                            │  │    │  │ │
│ │ │ │ │ │  1  │ │  2  │ │  3  │                            │  │    │  │ │
│ │ │ │ │ └─────┘ └─────┘ └─────┘                            │  │    │  │ │
│ │ │ │ │ ┌─────┐ ┌─────┐ ┌─────┐                            │  │    │  │ │
│ │ │ │ │ │  4  │ │  5  │ │  6  │                            │  │    │  │ │
│ │ │ │ │ └─────┘ └─────┘ └─────┘                            │  │    │  │ │
│ │ │ │ │ ┌─────┐ ┌─────┐ ┌─────┐                            │  │    │  │ │
│ │ │ │ │ │  7  │ │  8  │ │  9  │                            │  │    │  │ │
│ │ │ │ │ └─────┘ └─────┘ └─────┘                            │  │    │  │ │
│ │ │ │ │ ┌─────┐ ┌─────┐ ┌─────┐                            │  │    │  │ │
│ │ │ │ │ │전액 │ │  0  │ │  ⌫  │                            │  │    │  │ │
│ │ │ │ │ └─────┘ └─────┘ └─────┘                            │  │    │  │ │
│ │ │ │ │                                                      │  │    │  │ │
│ │ │ │ │ haptic feedback on key press                         │  │    │  │ │
│ │ │ │ └──────────────────────────────────────────────────────┘  │    │  │ │
│ │ │ │                                                            │    │  │ │
│ │ │ │ 결제 방법:                                                 │    │  │ │
│ │ │ │ ┌──────────────────────────────────────────────────────┐  │    │  │ │
│ │ │ │ │ [신한은행 xxx-xxx-1234]              [변경 >]        │  │    │  │ │
│ │ │ │ └──────────────────────────────────────────────────────┘  │    │  │ │
│ │ │ │                                                            │    │  │ │
│ │ │ │ [변경 >] 클릭 시:                                         │    │  │ │
│ │ │ │ → PaymentMethodSheet.tsx (별도 바텀시트)                 │    │  │ │
│ │ │ │                                                            │    │  │ │
│ │ │ │ ┌──────────────────────────────────────────────────────┐  │    │  │ │
│ │ │ │ │ [Confirm Withdrawal]                                 │  │    │  │ │
│ │ │ │ │                                                      │  │    │  │ │
│ │ │ │ │ disabled={amount < 10000}                           │  │    │  │ │
│ │ │ │ └──────────────────────────────────────────────────────┘  │    │  │ │
│ │ │ └────────────────────────────────────────────────────────────┘    │  │ │
│ │ └────────────────────────────────────────────────────────────────────┘  │ │
│ │                                                                          │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ 파일 위치:                                                                   │
│ packages/mobile/app/(tabs)/profile/earnings.tsx                             │
│ packages/mobile/components/earnings/                                        │
│ ├── EarningsCardMobile.tsx                                                  │
│ ├── WithdrawalHistoryMobile.tsx                                             │
│ ├── WithdrawalHistoryItemMobile.tsx                                         │
│ ├── WithdrawalBottomSheet.tsx                                               │
│ ├── NumericKeypad.tsx                                                       │
│ └── PaymentMethodSheet.tsx                                                  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 구현 상태 체크리스트

### U-01 소셜 로그인
- [ ] Supabase OAuth 설정 (Kakao, Google, Apple)
- [ ] 로그인 페이지 UI (웹)
- [ ] 로그인 화면 UI (모바일)
- [ ] OAuth 콜백 핸들러
- [ ] 모바일 딥링크 설정
- [ ] 바이오메트릭 로그인 (모바일)
- [ ] AuthProvider 컨텍스트
- [ ] useAuth 훅
- [ ] 로그아웃 기능
- [ ] 세션 자동 갱신

### U-02 다국어
- [ ] 번역 파일 (ko.json, en.json)
- [ ] useTranslation 훅
- [ ] LanguageToggle 컴포넌트
- [ ] 언어 설정 저장 (localStorage/DB)
- [ ] 날짜/숫자 포매터

### U-03 프로필 대시보드
- [ ] ProfileHeader 컴포넌트 (웹)
- [ ] ProfileHeaderMobile 컴포넌트
- [ ] StatsCards 컴포넌트 (웹)
- [ ] StatsCardsMobile 컴포넌트
- [ ] BadgeGrid 컴포넌트 (웹/모바일)
- [ ] RankingList 컴포넌트 (웹/모바일)
- [ ] 프로필 데이터 훅

### U-04 활동 내역
- [ ] ActivityTabs 컴포넌트 (웹)
- [ ] TabBarMobile + PagerView (모바일)
- [ ] PostList 컴포넌트 (웹)
- [ ] PostListMobile + 스와이프 삭제 (모바일)
- [ ] AnswerList 컴포넌트 (웹/모바일)
- [ ] FavoriteList 컴포넌트 (웹/모바일)
- [ ] 활동 데이터 API

### U-05 출금
- [ ] EarningsCard 컴포넌트 (웹)
- [ ] EarningsCardMobile 컴포넌트
- [ ] WithdrawalForm 컴포넌트 (웹)
- [ ] WithdrawalBottomSheet (모바일)
- [ ] NumericKeypad 컴포넌트 (모바일)
- [ ] PaymentMethodSelector 컴포넌트
- [ ] WithdrawalHistory 컴포넌트 (웹/모바일)
- [ ] 결제 정보 입력 UI
- [ ] 출금 요청 API
