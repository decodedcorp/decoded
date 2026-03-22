# 워크플로우 개요 (v1.0)

**최종 검증**: 2025-01-27
**버전**: 1.0

## 기본 기능 워크플로우

새 기능을 구현하기 위한 표준 파이프라인입니다. 이 프로젝트에서 AI 도구들이 어떻게 협업하는지 이해하려면 먼저 이것을 읽으세요.

### 1. 정의

- GitHub Issue를 생성하거나 다듬습니다.
- Codex + `docs/prompts/codex/spec-from-issue.md`를 사용하여 `specs/feature/` 아래에 기능 스펙을 생성합니다.

### 2. 검토

- Speckit + Claude를 사용하여:
  - 가정, 엣지 케이스, 위험 요소를 확인합니다.
  - `docs/ai-playbook/01-principles.md`와 정렬합니다.

### 3. 구현

- Cursor를 메인 코딩 어시스턴트로 사용:
  - 스펙을 읽습니다.
  - `.cursor/rules/*` (base + frontend + ai-collab)를 적용합니다.
  - 작은 커밋으로 변경사항을 구현합니다.

### 4. 문서화

- Gemini와 `docs/prompts/gemini/feature-doc.md`를 사용하여:
  - `docs/features/<feature-id>.md`를 생성합니다.
  - 릴리스 노트용 짧은 요약을 작성합니다.

### 5. 로그 & 회고

- `docs/ai-playbook/usage-log.md`에 한 항목을 추가합니다:
  - 날짜
  - 작업
  - 사용한 도구 (그리고 사용하지 않은 도구 + 이유)
  - 잘 된 점 / 혼란스러웠던 점

이 단일 워크플로우가 대부분의 기능 작업을 커버합니다. 특정 사용 사례는 도구 프로필을 참조하세요.

## 기타 워크플로우

### 간단한 리팩토링

1. **Claude**: 코드를 분석하고 리팩토링 계획을 제안
2. **Cursor**: 계획에 따라 리팩토링 적용

### 버그 수정

1. **Codex**: 버그 수정 스펙 생성 (간단한 수정의 경우 선택사항)
2. **Cursor**: 수정 구현
3. **Gemini**: 수정 문서화 (선택사항)

## 통합 노트

- **Speckit** (`.specify/`): 기존 인프라 유지. Claude는 스펙 검토를 위해 `.claude/commands/speckit.*`를 사용합니다.
- **Cursor Rules** (`.cursor/rules/`): Cursor 사용 시 자동 적용됩니다.
- **템플릿**: Gemini와 Codex용 템플릿은 `docs/prompts/`에 있습니다.
