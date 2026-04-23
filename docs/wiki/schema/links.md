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

내부 링크는 두 레이어의 규약을 따른다.

### `related:` frontmatter (파서용)

- **repo-root 상대 경로**를 사용한다. 예: `docs/agent/monorepo.md`.
- Sub-3 linter가 repo 루트 기준으로 resolve한다.
- 양방향 일관성은 linker가 관리한다 (Phase 1은 수동).

### 본문 markdown 링크 (렌더러용)

- **파일 위치 기준 상대 경로**를 사용한다. 예: `docs/wiki/schema/README.md` 안에서 `docs/agent/monorepo.md`를 가리키려면 `../../agent/monorepo.md`.
- GitHub, VS Code 미리보기, 타 renderer에서 정상 렌더링된다.
- 섹션 앵커는 `../../agent/monorepo.md#commands` 처럼 `#`로 연결.
- 예외: 동일 디렉토리·하위 디렉토리 참조는 bare 이름 또는 `sub/file.md`로 간결하게.

### Obsidian 문법 미채택

- `[[wiki-link]]` 형태는 사용하지 않는다. GitHub·CI 파서가 처리하지 못하기 때문.

## 외부 링크

- 절대 URL, 프로토콜 포함: `https://...`.
- 가능한 경우 영속 경로 사용 (GitHub permalink, specific commit hash).

## `related:` 필드

- repo 상대 경로 배열.
- 의미적 인접 문서만 포함. 5개 이하 권장.
- 양방향 일관성은 Sub-3 linker가 관리한다 (Phase 1은 수동).

## 예시

```markdown
[docs/agent/monorepo.md](../../agent/monorepo.md)
[A 섹션](../../agent/monorepo.md#a-section)
[LLM wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
```
