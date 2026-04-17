---
title: Tag Vocabulary
owner: human
status: approved
updated: 2026-04-17
tags: [harness, agent]
related:
  - docs/wiki/schema/frontmatter.md
---

# Tag Vocabulary

프론트매터 `tags:` 필드에 허용되는 고정 어휘. 새 태그 추가는 이 파일의 PR로만 가능하다.

## 영역 (domain)

| 태그            | 설명                               |
| --------------- | ---------------------------------- |
| `architecture`  | 시스템 구조, 레이어, 데이터 흐름   |
| `api`           | Next.js `/api/v1/*`, Rust API      |
| `db`            | Supabase public · warehouse schema |
| `ui`            | 웹 UI, 컴포넌트                    |
| `design-system` | 디자인 토큰, DS 컴포넌트           |
| `testing`       | 단위·통합·E2E 테스트               |
| `ops`           | 배포, 모니터링, 운영               |
| `security`      | 인증, RLS, 권한                    |

## 역할 (role)

| 태그        | 설명                                                         |
| ----------- | ------------------------------------------------------------ |
| `harness`   | 에이전트 하네스 프로그래밍 (CLAUDE.md, .cursor/rules, hooks) |
| `agent`     | 에이전트용 참조 문서                                         |
| `llm-write` | LLM이 유지하는 문서                                          |

## 도구 (tool)

| 태그          | 설명             |
| ------------- | ---------------- |
| `claude-code` | Claude Code 관련 |
| `cursor`      | Cursor 관련      |
| `gstack`      | gstack 스킬      |
| `superpowers` | Superpowers 스킬 |
| `omc`         | oh-my-claudecode |
| `gsd`         | GSD 워크플로우   |

## 수명 주기 (lifecycle)

| 태그         | 설명                                  |
| ------------ | ------------------------------------- |
| `deprecated` | 더 이상 관리하지 않음. 아카이브 예정. |

## 확장

새 태그가 필요하면 이 파일의 PR로 추가한다. 네임스페이스 충돌 방지를 위해 표 분류(영역/역할/도구/수명)에 맞춰 배치한다.
