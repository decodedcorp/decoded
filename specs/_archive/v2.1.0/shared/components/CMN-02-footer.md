# [CMN-02] 푸터 (Global Footer)

| 항목 | 내용 |
|------|------|
| **문서 ID** | CMN-02 |
| **컴포넌트명** | 글로벌 푸터 |
| **작성일** | 2025-01-14 |
| **버전** | v1.0 |
| **상태** | 초안 |

---

## 1. 컴포넌트 개요

- **목적**: 사이트 정보, 법적 링크, 소셜 미디어, 언어 선택 제공
- **사용 위치**: 모든 페이지 하단 (일부 풀스크린 모달 제외)
- **반응형**: 데스크톱/모바일 별도 레이아웃

---

## 2. UI 와이어프레임

### 2.1 데스크톱 (≥768px)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                                │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────────────────────┐ │ │
│  │  │ DECODED    │  │ Company    │  │ Support    │  │ Connect                  │ │ │
│  │  │            │  │            │  │            │  │                          │ │ │
│  │  │ Discover   │  │ About      │  │ Help       │  │ 📷 Instagram             │ │ │
│  │  │ fashion    │  │ Careers    │  │ Contact    │  │ 🐦 Twitter               │ │ │
│  │  │ from your  │  │ Press      │  │ FAQ        │  │ 📘 Facebook              │ │ │
│  │  │ favorite   │  │ Blog       │  │ Report     │  │                          │ │ │
│  │  │ celebrities│  │            │  │            │  │ ────────────────────────│ │ │
│  │  │            │  │            │  │            │  │                          │ │ │
│  │  │            │  │            │  │            │  │ Newsletter               │ │ │
│  │  │            │  │            │  │            │  │ ┌────────────────┐ [→]  │ │ │
│  │  │            │  │            │  │            │  │ │ Email...       │       │ │ │
│  │  │            │  │            │  │            │  │ └────────────────┘       │ │ │
│  │  │            │  │            │  │            │  │                          │ │ │
│  │  └────────────┘  └────────────┘  └────────────┘  └──────────────────────────┘ │ │
│  │  [COL-BRAND]     [COL-COMPANY]    [COL-SUPPORT]  [COL-CONNECT]               │ │
│  │                                                                                │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                                │ │
│  │  © 2026 DECODED. All rights reserved.                                         │ │
│  │                                                                                │ │
│  │  [Privacy Policy]  [Terms of Service]  [Cookie Policy]         [한국어 ▼]    │ │
│  │  [LINK-PRIVACY]    [LINK-TERMS]        [LINK-COOKIES]          [LANG-SELECT] │ │
│  │                                                                                │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 모바일 (<768px)

```
┌─────────────────────────────────┐
│                                 │
│  ┌─────────────────────────┐   │
│  │       DECODED           │   │
│  │                         │   │
│  │  Discover fashion from  │   │
│  │  your favorite          │   │
│  │  celebrities            │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Company              [▼]│   │
│  │                         │   │
│  │  (collapsed by default) │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Support              [▼]│   │
│  │                         │   │
│  │  (collapsed by default) │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Connect                 │   │
│  │                         │   │
│  │  📷  🐦  📘             │   │
│  │                         │   │
│  │  Newsletter             │   │
│  │  ┌─────────────────┐   │   │
│  │  │ Email...     [→]│   │   │
│  │  └─────────────────┘   │   │
│  └─────────────────────────┘   │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  © 2026 DECODED                │
│                                 │
│  Privacy • Terms • Cookies     │
│                                 │
│  [한국어 ▼]                    │
│                                 │
└─────────────────────────────────┘
```

---

## 3. UI 요소 정의

### 3.1 브랜드 섹션

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| COL-BRAND | 섹션 | 브랜드 칼럼 | 로고 + 슬로건 | - |
| LOGO-FOOTER | 이미지 | 푸터 로고 | height: 24px | 클릭 시 홈으로 |
| TXT-SLOGAN | 텍스트 | 슬로건 | "Discover fashion..." | - |

### 3.2 회사 정보

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| COL-COMPANY | 섹션 | 회사 칼럼 | - | - |
| LINK-ABOUT | 링크 | About | - | `/about` |
| LINK-CAREERS | 링크 | Careers | - | `/careers` |
| LINK-PRESS | 링크 | Press | - | `/press` |
| LINK-BLOG | 링크 | Blog | - | `/blog` |

### 3.3 지원

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| COL-SUPPORT | 섹션 | 지원 칼럼 | - | - |
| LINK-HELP | 링크 | Help Center | - | `/help` |
| LINK-CONTACT | 링크 | Contact | - | `/contact` |
| LINK-FAQ | 링크 | FAQ | - | `/faq` |
| LINK-REPORT | 링크 | Report Issue | - | 신고 모달 열기 |

### 3.4 연결

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| COL-CONNECT | 섹션 | 연결 칼럼 | 소셜 + 뉴스레터 | - |
| BTN-INSTAGRAM | 버튼 | Instagram | Icon: Instagram | 새 탭에서 열기 |
| BTN-TWITTER | 버튼 | Twitter | Icon: Twitter | 새 탭에서 열기 |
| BTN-FACEBOOK | 버튼 | Facebook | Icon: Facebook | 새 탭에서 열기 |
| INP-EMAIL | 입력 | 이메일 입력 | placeholder: "Email...", type: email | - |
| BTN-SUBSCRIBE | 버튼 | 구독 | Icon: ArrowRight | 뉴스레터 구독 |

### 3.5 하단 바

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| TXT-COPYRIGHT | 텍스트 | 저작권 | "© 2026 DECODED..." | - |
| LINK-PRIVACY | 링크 | 개인정보 | - | `/privacy` |
| LINK-TERMS | 링크 | 이용약관 | - | `/terms` |
| LINK-COOKIES | 링크 | 쿠키 정책 | - | `/cookies` |
| LANG-SELECT | 선택 | 언어 선택 | 현재 언어 표시 | 드롭다운으로 변경 |

### 3.6 모바일 전용

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| ACCORDION-COMPANY | 아코디언 | 회사 접기 | 기본 접힘 | 클릭 시 펼침 |
| ACCORDION-SUPPORT | 아코디언 | 지원 접기 | 기본 접힘 | 클릭 시 펼침 |

---

## 4. 상태 정의

| 상태 | 조건 | UI 변화 |
|------|------|--------|
| 기본 | - | 모든 섹션 표시 |
| 모바일 접힘 | width < 768px | Company/Support 아코디언 접힘 |
| 뉴스레터 로딩 | 구독 요청 중 | 버튼 로딩 상태 |
| 뉴스레터 성공 | 구독 완료 | "Subscribed!" 메시지 |
| 뉴스레터 실패 | 이메일 오류 | 에러 메시지 표시 |

---

## 5. 데이터 요구사항

### 5.1 API 호출

| API | Method | Endpoint | 호출 시점 |
|-----|--------|----------|----------|
| 뉴스레터 구독 | POST | `/api/newsletter/subscribe` | 구독 버튼 클릭 |

### 5.2 상태 관리

```typescript
// useLocaleStore (i18n)
interface LocaleState {
  locale: 'ko' | 'en' | 'ja' | 'zh';
  setLocale: (locale: string) => void;
}
```

---

## 6. 접근성 (A11y)

### 6.1 키보드 네비게이션
- `Tab`: 링크 및 입력 필드 순차 이동
- `Enter`: 아코디언 토글 (모바일)

### 6.2 스크린 리더
- 전체 푸터: `role="contentinfo"`, `aria-label="Site footer"`
- 각 섹션: `role="group"`, `aria-labelledby`
- 소셜 링크: `aria-label="Follow us on Instagram"` 등
- 언어 선택: `aria-label="Select language"`

---

## 7. 컴포넌트 매핑

| UI 영역 | 컴포넌트 | 파일 경로 |
|--------|---------|----------|
| 전체 | GlobalFooter | `lib/components/layout/GlobalFooter.tsx` |
| 브랜드 칼럼 | FooterBrand | `lib/components/layout/FooterBrand.tsx` |
| 링크 칼럼 | FooterLinkColumn | `lib/components/layout/FooterLinkColumn.tsx` |
| 소셜 링크 | SocialLinks | `lib/components/layout/SocialLinks.tsx` |
| 뉴스레터 | NewsletterForm | `lib/components/layout/NewsletterForm.tsx` |
| 하단 바 | FooterBottom | `lib/components/layout/FooterBottom.tsx` |
| 언어 선택 | LanguageSelect | `lib/components/layout/LanguageSelect.tsx` |

---

## 8. 구현 체크리스트

- [ ] GlobalFooter 레이아웃
- [ ] FooterBrand (로고 + 슬로건)
- [ ] FooterLinkColumn (반복 가능)
- [ ] SocialLinks (아이콘 버튼)
- [ ] NewsletterForm (이메일 입력 + 제출)
- [ ] FooterBottom (저작권 + 법적 링크)
- [ ] LanguageSelect (드롭다운)
- [ ] 모바일 아코디언
- [ ] 반응형 레이아웃
- [ ] 접근성 테스트

---

## 9. 참고 사항

### 9.1 지원 언어
```typescript
const SUPPORTED_LOCALES = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
];
```

### 9.2 소셜 미디어 URL
```typescript
const SOCIAL_LINKS = {
  instagram: 'https://instagram.com/decoded_app',
  twitter: 'https://twitter.com/decoded_app',
  facebook: 'https://facebook.com/decoded_app',
};
```

### 9.3 푸터 높이
```css
:root {
  --footer-height-desktop: auto; /* 콘텐츠에 따라 */
  --footer-padding: 48px 0;
}
```

---

## 10. v2.0 Implementation Notes

**구현 파일:**
- `lib/design-system/desktop-footer.tsx` (DesktopFooter)

**변경 사항 (v2.0):**
- 4-column 레이아웃 (Desktop), Accordion (Mobile)
- Simple text logo (font-mono) - 이미지 대신 텍스트 "DECODED"
- Company/Support 섹션만 모바일에서 접힘 (Accordion)
- Connect 섹션은 항상 표시 (소셜 + 뉴스레터)

**레이아웃 통합:**
- `flex flex-col min-h-screen` 패턴으로 하단 고정
- Footer는 `mt-auto`로 푸시되어 하단에 배치
- 일부 페이지(Explore, Feed)에서 Footer 숨김 처리

**Last Updated:** 2026-02-05
