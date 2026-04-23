---
description: 현재 세션의 knowledge를 docs/wiki/wiki/ 노트로 ingest (Sub-3 CLI + LLM 채움)
argument-hint: <topic> <title>
allowed-tools: Bash(bun run wiki:ingest:*), Bash(bun run wiki:lint:*), Read, Edit, Bash(git status:*), Bash(git diff:*), Glob
---

# /ingest — Wiki 노트 생성 + 본문 채움

현재 대화의 knowledge를 `docs/wiki/wiki/<topic>/` 아래 누적 노트로 ingest한다.

## Arguments

`$ARGUMENTS` 는 `<topic> <title ...>` 형태다.

- `<topic>`: `harness` | `ops` | `tasks` | `incidents` 중 하나 (첫 토큰)
- `<title>`: 나머지 전체 (공백 허용, 따옴표 불필요)

Allowed topic vocabulary는 `tools/wiki/lib/config.ts`의 `INGEST_TOPICS`와 스펙(`docs/wiki/schema/tags.md`)이 SSOT다. 벗어난 topic은 CLI가 `INVALID_TOPIC` 으로 reject 한다.

## 절차

### 1. 인자 파싱·검증

- `$ARGUMENTS` 를 공백 기준 첫 토큰 / 나머지로 분리
- 첫 토큰이 허용 어휘에 없으면 사용자에게 반환하며 중단 (CLI를 돌리지 않는다)
- title 이 비어 있으면 사용자에게 title 요청 후 중단

### 2. CLI 호출로 skeleton 생성

Bash 로 다음을 실행:

```bash
bun run wiki:ingest <topic> <title>
```

CLI 는 `docs/wiki/wiki/<topic>/<slug>.md` 를 생성하고 `docs/wiki/wiki/INDEX.md` 에 항목을 추가한다. 실패 시 stderr 를 그대로 사용자에게 전달.

### 3. 생성된 파일 본문 채우기

CLI stdout 에서 생성된 상대 경로(`created ...`)를 찾아 Read 로 로드한 뒤, 다음을 `Edit` 로 채운다:

- `## Purpose` 섹션의 `TODO — ...` 를 **이 노트가 답하는 질문 한 줄**로 교체
- 본문에 **현재 대화에서 얻어낸 factual knowledge** 를 섹션별로 정리
  - owner 가 `llm` 인 파일이므로 객관적 사실 중심, 주관적 의견은 배제
  - 참조한 파일·이슈·PR·커밋 SHA 는 [link text](path) 또는 `#NNN` 형식으로 인용
  - `docs/wiki/schema/links.md` 의 규약 준수 (repo 상대 경로, Obsidian `[[]]` 금지)
- `## Recent changes` 의 기존 줄은 유지하고, 필요 시 `today:` 로 주요 변경 항목 추가 가능

Tag 정책: skeleton 에 이미 `<topic>`, `llm-write` 가 들어 있다. 필요 시 `docs/wiki/schema/tags.md` 어휘 내에서만 `tags` 를 확장한다.

### 4. 유효성 검증

`bun run wiki:lint` 를 실행해 frontmatter / H1 / related 경로 오류가 없는지 확인. 실패 시 오류를 고친 뒤 재실행.

### 5. 사용자에게 전달할 요약

다음을 포함해 간결하게 보고:

- 생성 파일 경로
- INDEX.md 갱신 여부
- lint 결과
- 다음 단계 제안 (`git add` / 커밋 / PR)

## 주의

- **스펙상 owner=llm 파일은 사람이 직접 편집하지 않는 것을 원칙으로 한다**. 이 커맨드가 공식 ingest 루트다. 긴급 수정은 PR 리뷰에서 근거를 남긴다 (`docs/wiki/schema/frontmatter.md`).
- `docs/wiki/wiki/<topic>/<slug>.md` 가 이미 존재하면 CLI 가 `FILE_EXISTS` 로 중단한다. 같은 주제 재방문은 해당 기존 파일을 직접 `Edit` 하는 편이 맞다.
- Ingest 는 **세션 산출물의 marshal** 이지 새로운 설계 도구가 아니다. 이미 합의된 fact 만 담는다.

## Context

- 생성 타깃: `docs/wiki/wiki/<topic>/<slug>.md`
- 인덱스: `docs/wiki/wiki/INDEX.md`
- CLI: `tools/wiki/cli.ts` (`bun run wiki:ingest`)
- Schema SSOT: `docs/wiki/schema/{frontmatter,tags,links}.md`
- Spec: `docs/superpowers/specs/2026-04-17-llm-wiki-foundation-design.md` §10
