---
description: docs/wiki/ 오리엔테이션 · lint · links · 검색 (Sub-3 CLI 래퍼)
argument-hint: [lint|links|list|search <query>]
allowed-tools: Bash(bun run wiki:lint:*), Bash(bun run wiki:links:*), Read, Grep, Glob
---

# /wiki — Wiki 오리엔테이션 · 검증 · 검색

`docs/wiki/**` 에 쌓인 knowledge 를 조회·검증하는 래퍼. 기록 추가는 `/ingest` 를 사용한다.

## 서브커맨드

`$ARGUMENTS` 첫 토큰에 따라 동작:

### (인자 없음) · `list` — 현재 상태 보고

1. `docs/wiki/wiki/INDEX.md` 를 Read 로 로드
2. topic 별 노트 개수 + 파일 목록을 표 형태로 요약
3. `docs/wiki/schema/README.md` 를 pointer 로 제시 (컨벤션 SSOT)

Glob 으로 실제 `docs/wiki/wiki/**/*.md` 를 확인해 INDEX.md drift(등재 누락) 가 있으면 flag 한다.

### `lint` — frontmatter / H1 / related 경로 검증

```bash
bun run wiki:lint
```

Exit code:
- `0` OK
- `1` validation error (frontmatter 누락 / H1 불일치 / related 깨짐 등) — 상세 내역을 stdout 에 출력
- `2` I/O · config error

실패 시 원인 항목별로 수정 방향을 제시 (`docs/wiki/schema/frontmatter.md` / `tags.md` / `links.md` 참조).

### `links` — 깨진 본문 링크 + 역링크 인덱스

```bash
bun run wiki:links
```

- body link (`[text](target)`) 중 존재하지 않는 target 목록
- `related:` backlink 역인덱스

깨진 링크 보고만 하고 자동 수정은 하지 않는다. 사용자에게 수정 여부를 확인받는다.

### `search <query>`

`docs/wiki/**/*.md` + `docs/agent/*-summary.md` 범위에서 query 를 Grep.

1. `Grep` 으로 매칭 파일 + 컨텍스트 라인 수집 (case-insensitive, `-n` 라인번호)
2. 결과를 topic / category 별로 그룹화해 보고
3. 해당 파일들의 `title` · `status` · `updated` 를 frontmatter 에서 읽어 metadata 함께 출력

관련도가 낮아 보이는 결과는 제외하지 말고 **있는 그대로** 보여준다 (LLM 자의적 필터링 금지).

## 절차 원칙

- 이 커맨드는 **조회·검증 전용**이다. `Edit` / `Write` 하지 않는다.
- 신규 노트 추가는 `/ingest` 로 수행. 기존 `owner=llm` 파일 긴급 수정은 PR 리뷰에 근거를 남긴다.
- CLI 는 `tools/wiki/cli.ts` 가 SSOT. 서브커맨드 추가는 먼저 CLI 를 확장한 뒤 여기 반영한다.

## Context

- 노트 루트: `docs/wiki/wiki/`
- 인덱스: `docs/wiki/wiki/INDEX.md`
- Schema: `docs/wiki/schema/`
- CLI: `tools/wiki/` (`bun run wiki:lint` · `wiki:links` · `wiki:ingest`)
- Pre-push / CI 통합: `scripts/git-pre-push.sh` · `.github/workflows/wiki-lint.yml`
- Spec: `docs/superpowers/specs/2026-04-17-llm-wiki-foundation-design.md` + `2026-04-17-llm-wiki-sub3-cli-design.md`
