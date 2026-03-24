# Cursor 스킬셋 확장 계획

## Context

현재 Cursor 사용자는 `.cursor/rules/monorepo.mdc` 1개 + `.cursor/skills/commit/` 1개만 보유.
Claude Code 쪽에는 7 에이전트, 8 스킬, 9 SpecKit 커맨드가 있어 도구 격차가 큼.
SKILL.md 포맷은 Claude Code와 Cursor가 동일한 Agent Skills 표준을 따르므로 포팅이 단순함.
워크트리에서 `chore/cursor-skills-expansion` 브랜치로 작업.

## 변경 요약

### Phase 1: Rules (.mdc) — 자동 활성화, 즉시 가치

| 파일 | 작업 | 설명 |
|------|------|------|
| `.cursor/rules/monorepo.mdc` | UPDATE | 40줄 → ~80줄. 디자인 시스템, 훅, 스토어, 네이밍 컨벤션 추가 |
| `.cursor/rules/react-components.mdc` | NEW | `packages/web/**/*.tsx` 대상. Server/Client 분리, 디자인 시스템 임포트, React 19, a11y |
| `.cursor/rules/api-routes.mdc` | NEW | `packages/web/app/api/**/*.ts` 대상. Auth 패턴, 에러 응답, 페이지네이션 |
| `.cursor/rules/rust-api.mdc` | NEW | `packages/api-server/**/*.rs` 대상. Axum 0.8, SeaORM, cargo 명령 |

### Phase 2: 핵심 스킬 — 팀 워크플로우

| 파일 | 소스 | 설명 |
|------|------|------|
| `.cursor/skills/code-reviewer/SKILL.md` | `.claude/agents/code-reviewer.md` | Two-pass 리뷰, Fix-First, decoded 전용 규칙 |
| `.cursor/skills/git-workflow/SKILL.md` | `.claude/skills/git-workflow/SKILL.md` | 브랜치/커밋/PR 컨벤션 가이드 |

### Phase 3: 생성기 스킬 — SpecKit 연동

| 파일 | 소스 | 설명 |
|------|------|------|
| `.cursor/skills/component-template/SKILL.md` | `.claude/skills/component-template-generator/SKILL.md` | React 컴포넌트 보일러플레이트 |
| `.cursor/skills/api-contract/SKILL.md` | `.claude/skills/api-contract-generator/SKILL.md` | OpenAPI 스타일 API 문서 |

## 포팅 규칙

Claude Code → Cursor 변환 시:
1. `allowed-tools`, `model` 프론트매터 제거 (Cursor 미지원)
2. `references/` 서브디렉토리 내용을 SKILL.md 본문에 인라인
3. `name`, `description` 유지 (동일 스펙)
4. 한국어 유지 (팀 컨벤션)

## 포팅하지 않는 것

| 항목 | 사유 |
|------|------|
| GSD 워크플로우 / SpecKit 커맨드 | Claude Code `.claude/commands/` 전용 |
| excalidraw-generator, pencil-screen-ui | 니치, 사용 빈도 낮음 |
| supabase-migration-generator | DBA 전용 |
| data-model-generator | api-contract와 중복 (둘 다 TS 타입 생성) |
| 에이전트 (performance-auditor 등) | 서브에이전트 패턴 Cursor 미지원 |

## 최종 파일 목록 (8개)

```
.cursor/
├── rules/
│   ├── monorepo.mdc              # UPDATE (확장)
│   ├── react-components.mdc      # NEW
│   ├── api-routes.mdc            # NEW
│   └── rust-api.mdc              # NEW
└── skills/
    ├── commit/SKILL.md           # 기존 (변경 없음)
    ├── code-reviewer/SKILL.md    # NEW
    ├── git-workflow/SKILL.md     # NEW
    ├── component-template/SKILL.md # NEW
    └── api-contract/SKILL.md     # NEW
```

## 검증

1. Cursor에서 `.tsx` 파일 열기 → `react-components.mdc` 룰 자동 로드 확인
2. Cursor에서 `/code-reviewer` 입력 → 스킬 인식 확인
3. 각 SKILL.md 프론트매터 유효성 (name, description 필수)
4. 기존 commit 스킬과 충돌 없음 확인
