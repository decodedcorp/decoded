# Single Source of Truth (SSOT) 원칙

> decoded-app 문서화 원칙

## 개요

이 문서는 decoded-app의 문서 소유권과 진실의 원천(Single Source of Truth)을 정의합니다.

## 핵심 원칙

```
docs/     → 구현된 것 (WHAT IS)
specs/    → 설계 의도 (WHAT SHOULD BE)
.planning/codebase/ → 현재 코드 분석 (AI 생성)
```

## 문서 소유권

| 정보 유형 | 진실의 원천 | 설명 |
|-----------|-------------|------|
| **코드베이스 현황** | `.planning/codebase/` | AI가 분석한 현재 상태 |
| **기술 스택** | `.planning/codebase/STACK.md` | 버전, 의존성, 설정 |
| **아키텍처** | `.planning/codebase/ARCHITECTURE.md` | 레이어, 데이터 흐름 |
| **디렉토리 구조** | `.planning/codebase/STRUCTURE.md` | 폴더 레이아웃, 파일 위치 |
| **코딩 컨벤션** | `.planning/codebase/CONVENTIONS.md` | 네이밍, 스타일, 패턴 |
| **테스트 패턴** | `.planning/codebase/TESTING.md` | 테스트 구조, 모킹 |
| **외부 연동** | `.planning/codebase/INTEGRATIONS.md` | API, DB, 스토리지 |
| **기술 부채** | `.planning/codebase/CONCERNS.md` | 주의사항, 개선점 |
| **기능 설계** | `specs/{bundle}/spec.md` | 요구사항 및 설계 |
| **화면 설계** | `specs/{bundle}/screens/` | UI/UX 명세 |
| **API 계약** | `specs/shared/api-contracts.md` | Screen-API 매핑 |
| **데이터 모델** | `specs/shared/data-models.md` | TypeScript 타입 정의 |
| **구현된 API** | `docs/api/` | 실제 동작하는 API |
| **DB 스키마** | `docs/database/` | 실제 테이블 구조 |
| **디자인 토큰** | `docs/design-system/` | 색상, 타이포그래피 |

## 충돌 해결

정보가 여러 곳에 있을 때:

1. **코드 > 문서**: 실제 코드가 항상 진실
2. **.planning/codebase/ > docs/**: 최신 AI 분석 우선
3. **docs/ > specs/**: 구현된 것이 설계보다 우선

## 유지보수 가이드

### 코드 변경 시
1. 코드 수정
2. 필요시 `docs/` 업데이트
3. `/gsd:map-codebase`로 `.planning/codebase/` 갱신 (선택)

### 설계 변경 시
1. `specs/` 수정
2. 구현 완료 후 `docs/` 업데이트
3. `.planning/codebase/`는 자동 갱신 (다음 분석 시)

### 새 기능 추가 시
1. `specs/{bundle}/spec.md` 작성
2. 구현
3. `docs/api/` 업데이트 (API인 경우)
4. `.planning/codebase/`는 자동 갱신

## 문서 갱신 주기

| 문서 | 갱신 시점 |
|------|-----------|
| `.planning/codebase/` | GSD 초기화 시 또는 `/gsd:map-codebase` |
| `specs/` | 기능 설계 시 |
| `docs/` | 구현 완료 시 |
| `CLAUDE.md` | 프로젝트 구조 변경 시 |

---

*Created: 2026-01-23*
