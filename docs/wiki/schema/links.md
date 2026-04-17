---
title: Link Conventions
owner: human
status: approved
updated: 2026-04-17
tags: [harness, agent]
related:
  - docs/wiki/schema/frontmatter.md
---

# Link Conventions

문서 내 링크 규약. Sub-3 linter가 검증 대상으로 삼는다.

## 내부 링크

- **repo 상대 경로** 사용. 예: `docs/agent/monorepo.md`.
- 디렉토리 기준 상대 경로(`../../..`)는 사용하지 않는다 (렌더러에 따라 깨짐).
- 파일 내 섹션 앵커는 `docs/agent/monorepo.md#commands` 처럼 `#`로 연결.

## 외부 링크

- 절대 URL, 프로토콜 포함: `https://...`.
- 가능한 경우 영속 경로 사용 (GitHub permalink, specific commit hash).

## Obsidian 문법 미채택

- `[[wiki-link]]` 형태는 사용하지 않는다. GitHub·CI 파서가 처리하지 못하기 때문.

## `related:` 필드

- repo 상대 경로 배열.
- 의미적 인접 문서만 포함. 5개 이하 권장.
- 양방향 일관성은 Sub-3 linker가 관리한다 (Phase 1은 수동).

## 예시

```markdown
[docs/agent/monorepo.md](docs/agent/monorepo.md)
[A 섹션](docs/agent/monorepo.md#a-section)
[LLM wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
```
