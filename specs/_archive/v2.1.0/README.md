# DECODED Specifications

> 버전: 2.1.0 | 최종 업데이트: 2026-01-23

## 개요

이 폴더는 decoded-app의 **기능 명세(설계 의도)**를 담고 있습니다.

- **specs/**: 설계 의도 (WHAT SHOULD BE)
- **docs/**: 구현된 것 (WHAT IS)
- **.planning/codebase/**: 현재 코드 분석

## 번들 구조

각 번들은 SpecKit 스타일로 구성:
- `spec.md`: 기능 명세
- `screens/`: 화면 설계서 (SCR-* ID)
- `api-endpoints.md`: API 계약 (선택)

| 번들 | 설명 | 기능 ID | 화면 수 | 구현 상태 |
|------|------|---------|---------|----------|
| [shared/](./shared/) | 공통 컴포넌트, 템플릿, 데이터 모델 | - | 4 components | - |
| [user-system/](./user-system/) | 사용자 인증, 프로필, 활동 | U-01~U-05 | 5 screens | 0% |
| [discovery/](./discovery/) | 피드, 필터, 검색, 갤러리 | D-01~D-04 | 4 screens | 50% |
| [detail-view/](./detail-view/) | 상세 뷰, 스팟, 아이템, 관련 콘텐츠 | V-01~V-06 | 4 screens | 70% |
| [creation-ai/](./creation-ai/) | 업로드, AI 인식, 태깅 | C-01~C-04 | 3 screens | 10% |
| [system-backend/](./system-backend/) | 백엔드 시스템 | S-01~S-08 | - | 7% |
| [admin/](./admin/) | 관리자 패널 | A-01~A-03 | 3 screens | 0% |
| [mobile-platform/](./mobile-platform/) | 모바일 앱 | M-01~M-06 | - | 42% |
| [scroll-animation/](./scroll-animation/) | 스크롤 애니메이션 | - | - | WIP |

> 📊 **전체 진행률**: ~25% (2026-01-23 기준)

## ID 체계

### 기능 ID
| 접두사 | 카테고리 | 예시 |
|--------|----------|------|
| U- | 사용자 시스템 | U-01 소셜 로그인 |
| D- | 디스커버리 | D-01 피드 |
| V- | 상세 뷰 | V-01 반응형 상세 뷰 |
| C- | 콘텐츠 생성 | C-01 이미지 업로드 |
| S- | 시스템/백엔드 | S-01 API 게이트웨이 |
| A- | 관리자 | A-01 대시보드 |
| M- | 모바일 | M-01 PWA |

### 화면 ID
| 접두사 | 카테고리 | 예시 |
|--------|----------|------|
| SCR-USER- | 사용자 화면 | SCR-USER-01-login |
| SCR-DISC- | 디스커버리 화면 | SCR-DISC-01-home |
| SCR-VIEW- | 상세 뷰 화면 | SCR-VIEW-01-detail |
| SCR-CREA- | 생성 화면 | SCR-CREA-01-upload |
| SCR-ADMN- | 관리자 화면 | SCR-ADMN-01-dashboard |
| CMN- | 공통 컴포넌트 | CMN-01-header |

## 관련 문서

### 코드베이스 분석 (최신)
- [.planning/codebase/ARCHITECTURE.md](../.planning/codebase/ARCHITECTURE.md) - 현재 아키텍처
- [.planning/codebase/STRUCTURE.md](../.planning/codebase/STRUCTURE.md) - 디렉토리 구조
- [.planning/codebase/CONVENTIONS.md](../.planning/codebase/CONVENTIONS.md) - 코딩 컨벤션

### Specs 내부
- [데이터 모델](./shared/data-models.md)
- [워크플로우](./shared/workflows.md)
- [API 계약](./shared/api-contracts.md)
- [화면 템플릿](./shared/templates/screen-template.md)
- [UI ID 컨벤션](./shared/ui-id-convention.md)

### 구현 문서
- [docs/api/](../docs/api/) - 구현된 API
- [docs/database/](../docs/database/) - DB 스키마
- [docs/design-system/](../docs/design-system/) - 디자인 토큰

## 빠른 시작

```bash
# 특정 번들의 기능 명세 확인
cat specs/user-system/spec.md

# 특정 화면 설계 확인
cat specs/user-system/screens/SCR-USER-01-login.md

# 공통 컴포넌트 확인
cat specs/shared/components/CMN-01-header.md
```

## GSD 워크플로우

```bash
/gsd:progress          # 진행 상황 확인
/gsd:plan-phase N      # 페이즈 N 계획
/gsd:execute-phase N   # 페이즈 N 실행
```
