# Shared Resources

공통으로 사용되는 컴포넌트, 템플릿, 데이터 모델을 관리합니다.

## 구조

```
shared/
├── components/         # 공통 UI 컴포넌트
│   ├── CMN-01-header.md
│   ├── CMN-02-footer.md
│   ├── CMN-03-modals.md
│   ├── CMN-03-mobile-nav.md
│   └── CMN-04-toasts.md
├── templates/          # 문서 템플릿
│   └── screen-template.md
├── data-models.md      # 전역 TypeScript 타입 정의
├── workflows.md        # 사용자 여정 & 화면 전환도
└── ui-id-convention.md # UI ID 명명 규칙
```

## 공통 컴포넌트

| ID | 컴포넌트 | 설명 |
|----|----------|------|
| [CMN-01](./components/CMN-01-header.md) | Header | 네비게이션 헤더 |
| [CMN-02](./components/CMN-02-footer.md) | Footer | 페이지 푸터 |
| [CMN-03](./components/CMN-03-modals.md) | Modals | 공통 모달 시스템 |
| [CMN-04](./components/CMN-04-toasts.md) | Toasts | 토스트 알림 |
| [CMN-03-mobile-nav](./components/CMN-03-mobile-nav.md) | MobileNav | 모바일 하단 네비게이션 |

## 템플릿

새 화면 설계서 작성 시 [screen-template.md](./templates/screen-template.md)를 참조하세요.

## 데이터 모델

[data-models.md](./data-models.md)에서 전역 TypeScript 타입 정의를 확인할 수 있습니다.

## 워크플로우

[workflows.md](./workflows.md)에서 사용자 여정과 화면 전환도를 확인할 수 있습니다.

## UI ID 명명 규칙

[ui-id-convention.md](./ui-id-convention.md)에서 UI ID 명명 규칙을 확인할 수 있습니다.

**주요 규칙**:
- 기본 형식: `[TYPE]-[SUBTYPE]-[PURPOSE]`
- 예시: `BTN-CLOSE`, `CARD-IMAGE`, `IMG-HERO`
- 금지 패턴: 단일 단어 (`CARD`), 의미 불명확 (`BTN-X`)
