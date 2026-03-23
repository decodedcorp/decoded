# Documentation Index

> Last Updated: 2026-01-23

## 개요

이 폴더는 decoded-app의 **구현된 것(WHAT IS)**을 담고 있습니다.

- **docs/**: 구현된 것 (WHAT IS)
- **specs/**: 설계 의도 (WHAT SHOULD BE)
- **.planning/codebase/**: 현재 코드 분석 (자동 생성)

## 문서 소유권 (Source of Truth)

| 영역 | 위치 | 설명 |
|------|------|------|
| **코드베이스 분석** | `.planning/codebase/` | AI 생성, 최신 상태 |
| 시스템 아키텍처 | `docs/architecture/` | 현재 구현 상태 |
| DB 스키마 사용법 | `docs/database/` | 실제 사용 패턴 |
| API 엔드포인트 | `docs/api/` | 구현된 API 문서 |
| 디자인 시스템 | `docs/design-system/` | UI 토큰 및 컴포넌트 |
| 에이전트 참조 (LLM) | `docs/agent/` | 라우트/API/훅/DS 인벤토리 (맵은 루트 `CLAUDE.md`) |
| TypeScript 타입 | `specs/shared/data-models.md` | 설계 의도 타입 정의 |
| 기능 명세 | `specs/{bundle}/spec.md` | 요구사항 및 설계 |
| 화면 설계 | `specs/{bundle}/screens/` | UI/UX 명세 |
| API 계약 (설계) | `specs/shared/api-contracts.md` | Screen-API 매핑 |

---

## 코드베이스 분석 (최신)

> `.planning/codebase/` - AI가 자동 생성한 코드베이스 분석

| 문서 | 내용 |
|------|------|
| [STACK.md](../.planning/codebase/STACK.md) | 기술 스택, 의존성 |
| [ARCHITECTURE.md](../.planning/codebase/ARCHITECTURE.md) | 시스템 아키텍처, 레이어 |
| [STRUCTURE.md](../.planning/codebase/STRUCTURE.md) | 디렉토리 구조 |
| [CONVENTIONS.md](../.planning/codebase/CONVENTIONS.md) | 코딩 컨벤션 |
| [TESTING.md](../.planning/codebase/TESTING.md) | 테스트 패턴 |
| [INTEGRATIONS.md](../.planning/codebase/INTEGRATIONS.md) | 외부 서비스 연동 |
| [CONCERNS.md](../.planning/codebase/CONCERNS.md) | 기술 부채, 주의사항 |

---

## 주요 문서

### Architecture
- [아키텍처 개요](./architecture/README.md)
- [ADR (Architecture Decision Records)](./adr/)

### Database
- [스키마 사용 가이드](./database/01-schema-usage.md)
- [데이터 흐름](./database/03-data-flow.md)

### API
- [API 문서 개요](./api/README.md)
- [공통 스키마](./api/schemas.md)

> 📍 **실제 구현된 API**: `categories`, `posts` (기타는 설계 단계)

### Design System
- [디자인 토큰](./design-system/)

### AI Playbook
- [AI 도구 가이드](./ai-playbook/)

---

## Specs (설계 문서)

- [공통 데이터 모델](../specs/shared/data-models.md)
- [API 계약](../specs/shared/api-contracts.md)
- [전체 스펙 목록](../specs/README.md)

---

## GSD 워크플로우

```bash
/gsd:progress          # 진행 상황 확인
/gsd:plan-phase N      # 페이즈 N 계획
/gsd:execute-phase N   # 페이즈 N 실행
```
