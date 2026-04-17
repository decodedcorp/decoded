---
title: Frontmatter Schema
owner: human
status: approved
updated: 2026-04-17
tags: [harness, agent]
related:
  - docs/wiki/schema/tags.md
  - docs/wiki/schema/links.md
---

# Frontmatter Schema

Agent-consumable 파일(`docs/wiki/wiki/**`, `docs/agent/*-summary.md`)은 다음 프론트매터를 **필수**로 가진다. Sub-3 linter가 이를 강제한다.

## 필수 필드

| 필드      | 타입                                             | 설명                                        |
| --------- | ------------------------------------------------ | ------------------------------------------- |
| `title`   | string                                           | H1과 일치하는 사람 읽기 제목                |
| `owner`   | `llm` \| `human`                                 | write 주체 (PR 리뷰 범위 결정)              |
| `status`  | `draft` \| `approved` \| `stale` \| `deprecated` | 수명 주기                                   |
| `updated` | `YYYY-MM-DD`                                     | 마지막 의미 있는 갱신 일자 (typo 고침 제외) |
| `tags`    | string[]                                         | [`tags.md`](./tags.md)의 고정 어휘만        |

## 옵션 필드

| 필드      | 타입     | 설명                                            |
| --------- | -------- | ----------------------------------------------- |
| `related` | string[] | repo 상대 경로. 의미적 인접 문서 5개 이하 권장. |
| `source`  | string[] | 외부 URL (절대 URL). 근거 자료.                 |
| `issue`   | string   | GitHub issue URL                                |
| `pr`      | string   | GitHub PR URL                                   |
| `phase`   | string   | 소속 phase 또는 sub-project 식별                |

## 예시

```yaml
---
title: Claude Code — Harness Knowledge
owner: llm
status: draft
updated: 2026-04-17
tags: [harness, agent, claude-code]
related:
  - CLAUDE.md
  - docs/wiki/schema/harness.md
source:
  - https://docs.claude.com/en/docs/claude-code
---
```

## 규칙

- **H1과 `title` 일치**: 파일 내 첫 H1 텍스트는 `title` 값과 같아야 한다.
- **`updated` 갱신 기준**: 의미 있는 내용 변경 시에만. 오타·링크 수정은 제외.
- **`owner=llm` 파일**: 사람이 직접 수정하지 않는 것을 원칙으로 한다. Sub-3 ingest 파이프라인이 갱신한다. 긴급 수정 시 PR 리뷰에서 근거 명시.
- **태그 어휘**: [`tags.md`](./tags.md)에 없는 태그 사용 시 linter 실패.
