# [CMN-03] 모바일 하단 네비게이션 (Mobile Bottom Navigation)

| 항목 | 내용 |
|------|------|
| **문서 ID** | CMN-03 |
| **컴포넌트명** | 모바일 하단 네비게이션 |
| **작성일** | 2025-01-15 |
| **버전** | v1.0 |
| **상태** | 구현됨 |

---

## 1. 컴포넌트 개요

- **목적**: 모바일에서 주요 네비게이션 제공 (Instagram 스타일)
- **사용 위치**: 모바일 화면(<768px) 하단에 고정
- **표시 조건**: 모바일 뷰포트에서만 표시, 데스크톱에서 숨김

---

## 2. UI 와이어프레임

### 2.1 기본 레이아웃

```
┌─────────────────────────────────────────┐
│                                         │
│   [Home]  [Search]  [Plus]  [User]      │  ← Lucide React 아이콘
│   (active)          (disabled)(disabled)│
│                                         │
└─────────────────────────────────────────┘
```

### 2.2 Active 상태

```
┌─────────────────────────────────────────┐
│   [Home]  [Search]  [Plus]  [User]      │
│   [■fill]  [□line]   [x]     [x]       │
│   (active) (normal) (disabled)          │
└─────────────────────────────────────────┘
```

---

## 3. UI 요소 정의

| UI ID | 구분 | 요소명 | Lucide 아이콘 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---:|:---|:---|
| NAV-HOME | 링크 | Home | `Home` | active 시 stroke-[2.5] | `/` 이동 |
| NAV-EXPLORE | 링크 | Explore | `Search` | active 시 stroke-[2.5] | `/explore` 이동 |
| NAV-CREATE | 버튼 | Create | `Plus` | **disabled**, opacity-40 | 미구현 (클릭 불가) |
| NAV-PROFILE | 버튼 | Profile | `User` | **disabled**, opacity-40 | 미구현 (클릭 불가) |

---

## 4. 상태 정의

| 상태 | 조건 | UI 변화 |
|------|------|--------|
| Home 활성 | pathname === '/' | Home 아이콘 stroke-[2.5], text-foreground |
| Explore 활성 | pathname === '/explore' | Explore 아이콘 stroke-[2.5], text-foreground |
| 비활성 | pathname !== href | stroke-[1.5], text-muted-foreground |
| Disabled | 미구현 탭 | opacity-40, cursor-not-allowed |

---

## 5. 디자인 토큰

| 토큰 | 값 | 설명 |
|------|---|------|
| 높이 | 56px (h-14) | safe-area 제외 |
| 배경 | bg-background/95 | 반투명 |
| Blur | backdrop-blur-lg | 배경 흐림 |
| 아이콘 크기 | 24px (h-6 w-6) | - |
| 터치 영역 | 전체 너비 / 4 | flex items-center justify-center |
| z-index | 50 | 콘텐츠 위에 표시 |
| safe-area | pb-[env(safe-area-inset-bottom,0px)] | iPhone 노치 대응 |
| border | border-t border-border | 상단 구분선 |

---

## 6. 접근성 (A11y)

- `role="navigation"`, `aria-label="Main navigation"`
- 활성 링크: `aria-current="page"`
- Disabled 버튼: `aria-disabled="true"`, `aria-label="[탭명] (coming soon)"`
- 모든 요소에 `aria-label` 제공

---

## 7. 컴포넌트 매핑

| UI 영역 | 컴포넌트 | 파일 경로 |
|--------|---------|----------|
| 전체 | MobileNavBar | `lib/components/MobileNavBar.tsx` |

---

## 8. 구현 체크리스트

- [x] MobileNavBar 컴포넌트 생성
- [x] 4개 네비게이션 아이템 (Home, Explore, Create, Profile)
- [x] Active 상태 스타일링 (stroke 두께)
- [x] Disabled 상태 (Create, Profile)
- [x] 반응형 (md:hidden)
- [x] safe-area-inset-bottom 대응
- [x] 접근성 속성 추가 (aria-*)
- [x] layout.tsx에 전역 배치

---

## 9. 관련 문서

- [CMN-01 헤더](./CMN-01-header.md) - 모바일에서 간소화된 헤더와 함께 사용

---

## 10. v2.0 Implementation Notes

**구현 파일:**
- `lib/components/ui/mobile-nav-bar.tsx` (MobileNavBar)

**변경 사항 (v2.0):**
- Bottom navigation 유지 (Instagram 스타일)
- 56px 높이 (h-14)
- 4개 탭: Home, Explore, Create(disabled), Profile(disabled)
- Active 상태: stroke-[2.5], text-foreground
- 구현 상태: Home, Explore만 활성화

**Header와 조합:**
- MobileHeader (상단) + MobileNavBar (하단)
- 페이지 콘텐츠에 pt-14 pb-14 padding 적용 필요
- safe-area-inset-bottom 지원으로 iPhone 노치 대응

**Last Updated:** 2026-02-05
