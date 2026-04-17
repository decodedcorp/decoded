---
title: LLM Wiki Sub-3 — Validator / Linker / Ingest CLI Design
date: 2026-04-17
updated: 2026-04-17
owner: human
status: approved
tags: [harness, agent]
issue: https://github.com/decodedcorp/decoded/issues/231
pr: https://github.com/decodedcorp/decoded/pull/233
phase: Sub-3 (LLM Wiki Foundation — Automation)
related:
  - docs/superpowers/specs/2026-04-17-llm-wiki-foundation-design.md
  - docs/adr/ADR-0002-llm-wiki-foundation.md
  - docs/wiki/schema/README.md
  - docs/wiki/schema/frontmatter.md
  - docs/wiki/schema/tags.md
---

# LLM Wiki Sub-3 — Validator / Linker / Ingest CLI Design

## 1. Background

Phase 1(#153)에서 `docs/wiki/schema/` 규약과 `docs/wiki/wiki/` 누적 구조가 도입되었지만, 이를 **유지하는 자동화가 없으면 drift는 불가피**하다. Sub-3(#231)는 Phase 1 부록 §10.1에 고정된 계약을 구현해 다음을 제공한다.

- `wiki:lint` — frontmatter·tag·H1·link 존재성 정합성 검증
- `wiki:links` — 본문 깨진 링크 리포트 + `related:` 역링크 집계
- `wiki:ingest <topic> <title>` — 새 노트 스켈레톤 생성 + `INDEX.md` 자동 갱신

Phase 1 수동 점검(A1-A4)에서 code fence 내부의 경로 형태 문자열을 링크로 오인한 사례가 있었다. 이 케이스는 Sub-3 회귀 테스트로 보증한다.

## 2. Goals & Non-goals

### Goals (Sub-3에서 달성)

1. 3개의 CLI 서브커맨드를 Bun + TypeScript로 구현하여 `bun run wiki:*` 로 호출.
2. `scripts/git-pre-push.sh`에서 `wiki:lint` 실행 — main/master 직접 push 차단과 동일 레이어에서 보증.
3. GitHub Actions CI에 lint 단계 통합.
4. `tools/wiki/__tests__/`의 fixture 기반 bun test로 각 검증 규칙 회귀 방지.
5. 기존 `docs/wiki/**`, `docs/agent/*.md`, `docs/adr/*.md`, `docs/superpowers/specs/**`, `docs/ai-playbook/*.md`에서 `bun run wiki:lint` 0 error.

### Non-goals (Sub-3 범위 밖)

- `wiki:links --fix` 자동 교정 (리포트만).
- `wiki:ingest` 인터랙티브 프롬프트 (args-only).
- Sub-4의 Claude Code custom slash command(`/ingest`) 연동.
- `wiki:lint --watch` 모드.
- 마크다운 렌더링 정합성(GitHub 렌더링 결과 비교)까지는 검증하지 않는다.
- `.planning/codebase/**`, `packages/**/*.md`는 이번 phase 검증 범위에 포함하지 않는다.

## 3. Confirmed Decisions (brainstorm 결과)

| #   | 결정                   | 선택                                                                                                          | 사유                                                                      |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| D1  | 패키지 배치            | Standalone `tools/wiki/` (package.json 없음). 루트 scripts로 `bun tools/wiki/cli.ts <sub>` 호출               | 기존 `scripts/vton-poc.ts` 패턴과 일관, 워크스페이스 오버헤드 회피(YAGNI) |
| D2  | 검증 대상 glob         | `docs/wiki/**`, `docs/agent/*.md`, `docs/adr/*.md`, `docs/superpowers/specs/**/*.md`, `docs/ai-playbook/*.md` | Phase 1 PR-C 이관 범위와 동일. drift 감지 최대화                          |
| D3  | 의존성                 | 추가 dep = `gray-matter` 1개. 글롭은 `Bun.Glob`, 마크다운은 regex 기반 경량 파서                              | 무게 최소화. remark/unified는 과함                                        |
| D4  | 테스트 러너            | `bun test` (bun 내장)                                                                                         | zero-dep, 루트에서 바로 실행. web 패키지의 vitest와 격리                  |
| D5  | `wiki:ingest` 시그니처 | `<topic> <title>` args-only, topic ∈ `{harness, ops, tasks, incidents}`, 파일 존재 시 reject                  | 예측 가능·LLM 호출 친화. 인터랙티브는 Sub-4                               |
| D6  | Exit code 규약         | 0=pass, 1=validation error, 2=I/O/config error                                                                | Unix 관례. pre-push에서 `set -euo pipefail`과 호환                        |
| D7  | `wiki:links` 동작      | 리포트 전용 (fix 없음). broken link 있으면 exit 1                                                             | Phase 1 수동 점검 A1-4 이슈 자동화. code fence/주석 무시는 필수           |
| D8  | CI 통합                | 기존 web lint workflow에 step 추가 (별도 workflow 파일 안 만듦)                                               | CI 파일 확산 억제                                                         |

## 4. Architecture

### 4.1 Directory layout

```
tools/wiki/
├── README.md                    # 사용법·glob 목록·추가 규칙 추가 시 절차
├── cli.ts                       # 진입점: argv[2]로 subcommand 분기
├── lint.ts                      # wiki:lint 구현
├── links.ts                     # wiki:links 구현
├── ingest.ts                    # wiki:ingest 구현
├── lib/
│   ├── config.ts                # LINT_GLOBS, TAG_VOCAB_PATH, INDEX_PATH, INGEST_TOPICS, EXIT
│   ├── frontmatter.ts           # gray-matter 래퍼 + 필수/옵션 필드 스키마
│   ├── markdown.ts              # H1 추출, 링크 추출 (code fence·HTML 주석 skip)
│   ├── schema.ts                # tags.md → Set<string>, 허용 status/owner enum
│   ├── fs.ts                    # repo root resolve, read all, 상대경로 정규화
│   └── report.ts                # 에러 포맷 (`path:line: CODE message`), 요약 집계
└── __tests__/
    ├── fixtures/
    │   ├── tags.md                      # 최소 어휘
    │   ├── valid/*.md                   # 통과 케이스
    │   └── invalid/*.md                 # 실패 케이스 (규칙별)
    ├── frontmatter.test.ts
    ├── markdown.test.ts                 # code fence·HTML 주석 회귀
    ├── schema.test.ts
    ├── lint.test.ts
    ├── links.test.ts
    └── ingest.test.ts                   # tmpdir 사용
```

### 4.2 루트 `package.json` scripts

```json
{
  "scripts": {
    "wiki:lint": "bun tools/wiki/cli.ts lint",
    "wiki:links": "bun tools/wiki/cli.ts links",
    "wiki:ingest": "bun tools/wiki/cli.ts ingest"
  }
}
```

### 4.3 Module boundaries

- `cli.ts`는 argv만 해석해 `lint/links/ingest`를 호출한다. 비즈니스 로직 없음.
- `lint/links/ingest.ts`는 `lib/*`를 조합해 결과를 리턴. 프로세스 exit는 `cli.ts`가 담당.
- `lib/*`는 파일시스템·Node API에 직접 의존하지 않는 형태로 노출할 수 있는 함수는 pure하게 유지(테스트 용이).
- fixture는 repo 내 실제 `docs/**`와 독립적이므로 실 문서 내용이 변해도 단위 테스트가 깨지지 않는다.

## 5. `wiki:lint` 상세 규약

### 5.1 검사 항목

| 코드                  | 대상 필드/위치                  | 실패 조건                                            |
| --------------------- | ------------------------------- | ---------------------------------------------------- |
| `MISSING_FRONTMATTER` | 파일 최상단                     | `---\n...\n---` 블록 없음                            |
| `MISSING_FIELD`       | title/owner/status/updated/tags | 빠짐                                                 |
| `INVALID_OWNER`       | owner                           | `llm`/`human` 외의 값                                |
| `INVALID_STATUS`      | status                          | `draft`/`approved`/`stale`/`deprecated` 외의 값      |
| `INVALID_UPDATED`     | updated                         | `YYYY-MM-DD` 포맷 아님 또는 미래 날짜                |
| `UNKNOWN_TAG`         | tags[]                          | `docs/wiki/schema/tags.md`에 없는 값                 |
| `EMPTY_TAGS`          | tags                            | 빈 배열                                              |
| `H1_TITLE_MISMATCH`   | 본문 첫 H1                      | `title` 값과 불일치 (공백 trim 후 비교)              |
| `MISSING_H1`          | 본문                            | H1이 없음                                            |
| `BROKEN_RELATED`      | `related[]` 각 항목             | repo-root 기준 파일 존재 안 함                       |
| `TOO_MANY_RELATED`    | `related[]`                     | 6개 이상 — 경고(warning)로 처리, exit 코드 영향 없음 |

- 필드 순서는 검증하지 않는다 (gray-matter는 안정 정렬 유지).
- `source[]`의 외부 URL 존재성은 네트워크 접근이 필요해 **검증하지 않는다**.

### 5.2 대상 파일 glob (config 상수)

```ts
export const LINT_GLOBS = [
  "docs/wiki/**/*.md",
  "docs/agent/*.md",
  "docs/adr/*.md",
  "docs/superpowers/specs/**/*.md",
  "docs/ai-playbook/*.md",
];
```

- 글롭에 잡혀도 frontmatter가 아예 없으면 `MISSING_FRONTMATTER` 발생(엄격). 예외 파일은 이번 phase에서 도입하지 않는다.

### 5.3 출력 포맷

```
docs/agent/monorepo.md:1 MISSING_FRONTMATTER
docs/wiki/wiki/harness/claude-code.md:6 UNKNOWN_TAG "claud-code" (did you mean "claude-code"?)
docs/wiki/schema/README.md:9 BROKEN_RELATED docs/wiki/wiki/INDEX.md

✖ 3 errors, 1 warning across 47 files (checked in 0.42s)
```

- "did you mean" 제안은 단순 Levenshtein ≤ 2로 제한.
- 경로는 repo-root 상대 경로로 정규화.

## 6. `wiki:links` 상세 규약

### 6.1 파싱 규칙

- 마크다운 본문에서 `[text](target)` 형태만 추출(이미지 `![...](...)` 포함).
- **무시 대상**:
  - ` ``` ~ ``` ` 블록 내부
  - 인라인 코드 `` `...` `` 내부
  - `<!-- ... -->` 주석 내부
- `target`이 `http(s)://`로 시작하면 외부 링크 — 존재성 검증 안 함.
- `#anchor` 단독은 무시.
- 상대 경로는 현재 파일 위치 기준으로 resolve → repo-root 기준 경로로 정규화 → 존재 확인.

### 6.2 Backlink 리포트

- 각 파일 frontmatter `related[]`를 수집 → reverse index 구성.
- 출력 예:
  ```
  docs/wiki/schema/frontmatter.md
    ← docs/wiki/schema/links.md
    ← docs/wiki/schema/tags.md
  ```
- 이번 phase에서는 `related[]`에 누락된 역링크를 **수정하지 않는다**(리포트만).

### 6.3 Exit

- broken body link 1개 이상 → exit 1
- 깨진 링크 없음 → exit 0 (backlink 리포트는 stdout)

## 7. `wiki:ingest` 상세 규약

### 7.1 시그니처

```
bun run wiki:ingest <topic> <title>
```

- `<topic>` ∈ `harness | ops | tasks | incidents` (config 상수 `INGEST_TOPICS`). 외부 값은 reject (exit 2).
- `<title>` 은 사람 읽는 제목. 따옴표 허용.

### 7.2 동작

1. slug = `<title>` → kebab-case (ASCII 기준; 한글은 그대로 유지 후 공백 → `-`).
2. path = `docs/wiki/wiki/<topic>/<slug>.md` — 존재 시 reject (exit 2, `FILE_EXISTS`).
3. 파일 생성 (기본 템플릿):

   ```markdown
   ---
   title: <title>
   owner: llm
   status: draft
   updated: <YYYY-MM-DD>
   tags:
     - <topic>
     - llm-write
   related:
     - docs/wiki/wiki/INDEX.md
   ---

   # <title>

   ## Purpose

   TODO — 이 노트가 해결하려는 질문 한 줄.

   ## Recent changes

   - <YYYY-MM-DD>: 초기 스켈레톤 생성 (wiki:ingest)
   ```

4. `docs/wiki/wiki/INDEX.md` 갱신:
   - 해당 topic 섹션(`## Harness` 등)을 찾거나, 없으면 알파벳 순서로 섹션 추가.
   - `- [<topic>/<slug>.md](<topic>/<slug>.md) — <title>` 라인을 알파벳 순 삽입.
5. stdout에 `created docs/wiki/wiki/<topic>/<slug>.md`, `updated docs/wiki/wiki/INDEX.md` 출력.

### 7.3 주의

- `<topic>` 섹션 헤더 매핑은 `{ harness: '## Harness', ops: '## Ops', tasks: '## Tasks', incidents: '## Incidents' }`.
- 생성 직후 `wiki:lint`를 자동 실행하지 않는다(별도 CI/pre-push에서 보증).

## 8. Pre-push + CI 통합

### 8.1 Pre-push

`scripts/git-pre-push.sh`에 **web 로컬 CI 블록 다음**에 추가:

```bash
if [[ -n "${SKIP_WIKI_CI:-}" ]]; then
  echo "=== [monorepo] wiki lint 건너뜀 (SKIP_WIKI_CI) ==="
else
  echo "=== [monorepo] wiki lint ==="
  bun run wiki:lint
fi
```

- `SKIP_WIKI_CI=1`로 임시 우회 가능(기존 `SKIP_FE_CI` 패턴과 동일).

### 8.2 GitHub Actions

현재 `.github/workflows/`에는 lint 전담 workflow가 없다(`claude-review.yml`, `deploy-backend.yml`, `health-check.yml`, `telegram-notify.yml`만 존재). 따라서 경량 전용 workflow를 새로 만든다.

- 파일: `.github/workflows/wiki-lint.yml`
- 트리거: `pull_request` (paths: `docs/**`, `tools/wiki/**`, `package.json`) + `push` on `dev`, `main`
- 스텝:
  - `actions/checkout@v4`
  - `oven-sh/setup-bun@v2` with `bun-version-file: package.json` (packageManager 필드 사용)
  - `bun install --frozen-lockfile`
  - `bun run wiki:lint`
- 이 workflow는 **web/api-server CI와 독립적**으로 동작한다. 추후 통합 CI 파일이 생기면 step으로 흡수.

이 연동은 구현 PR 범위 안에서 한 번에 처리한다.

## 9. Testing

### 9.1 Fixture 전략

- `tools/wiki/__tests__/fixtures/` 하위에 self-contained 샘플 두기.
- `fixtures/tags.md` 는 실 어휘의 부분집합 (테스트 전용).
- `fixtures/valid/*.md` 는 각 규칙 통과 케이스 1건씩.
- `fixtures/invalid/*.md` 는 규칙별 실패 케이스 1건씩 + 조합 케이스 1~2건.
- fixture 경로를 config에 주입할 수 있도록 `lint({ cwd, tagsPath, globs })` 형태의 순수 함수 시그니처 유지.

### 9.2 회귀 테스트 필수

- `markdown.test.ts`에 code fence 내부 링크 스킵, HTML 주석 스킵 케이스 고정.
- Phase 1 A1-A4 사례 재현 fixture 포함.

### 9.3 Integration smoke

- CI에서 실 `bun run wiki:lint`가 0 error 내는 것이 1차 integration smoke.
- `wiki:ingest` 는 tmpdir에서 검증(실 `INDEX.md` 건드리지 않음).

## 10. Implementation Sequencing (요약)

구현 plan은 후속 `superpowers:writing-plans` 단계에서 세분화한다. 초안 단위:

1. `tools/wiki/` 골격 + `lib/config.ts` + 루트 scripts 등록.
2. `lib/frontmatter.ts`, `lib/markdown.ts`, `lib/schema.ts` + 단위 테스트.
3. `lint.ts` + 통합 테스트 (valid/invalid fixtures).
4. `links.ts` + 회귀 테스트 (code fence).
5. `ingest.ts` + tmpdir 테스트.
6. Pre-push hook 추가 + CI workflow 수정.
7. 실 `docs/**`에서 `bun run wiki:lint` 0 error 확인, 실패 시 문서 수정 별도 커밋.

## 11. Success Criteria

### Outcome-shaped

- **O1**: 기존 `docs/wiki/**`·`docs/agent/*.md`·`docs/adr/*.md`·`docs/superpowers/specs/**`·`docs/ai-playbook/*.md`에서 `bun run wiki:lint` exit 0.
- **O2**: Phase 1 점검 A1-A4 false positive(code fence 내부)가 `wiki:links`에서 재발하지 않음 — 회귀 테스트로 보증.
- **O3**: `bun run wiki:ingest harness "Test Foo"` → 새 파일 1개, `INDEX.md` 1라인 추가, 그 결과에 대해 `bun run wiki:lint` exit 0.
- **O4**: `scripts/git-pre-push.sh` 실행 시 wiki lint 단계 포함(정상 케이스 < 2초).

### Activity-shaped

- [ ] `tools/wiki/cli.ts` + `lint.ts` + `links.ts` + `ingest.ts` 구현
- [ ] `tools/wiki/lib/` 5개 모듈 구현
- [ ] `tools/wiki/__tests__/` 7개 test 파일 + fixture
- [ ] 루트 `package.json`에 `wiki:*` 3개 scripts 추가
- [ ] `gray-matter` devDependency 추가
- [ ] `scripts/git-pre-push.sh`에 wiki lint 블록 추가
- [ ] GitHub Actions CI에 wiki lint step 추가
- [ ] 실 `docs/**` 대상 `wiki:lint` 0 error 달성
- [ ] `tools/wiki/README.md` 작성

## 12. Risks & Mitigations

| 리스크                                                          | 영향 | 완화                                                                                                                                  |
| --------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 경량 regex 링크 파서가 edge case 놓침 (예: 이스케이프된 대괄호) | MED  | 회귀 테스트에 Phase 1 A1-A4 + 이스케이프·중첩 괄호 케이스 추가. 부족 시 Sub-4에서 remark로 교체                                       |
| `docs/**` 일부 파일에 frontmatter가 아직 없어 lint 즉시 폭발    | MED  | Sequencing 7단계에서 실 문서 수정 커밋을 별도로 분리. 필요 시 `SKIP_WIKI_CI`로 일시 우회                                              |
| Bun 버전 드리프트(`bun@1.3.10`)로 local/CI 차이                 | LOW  | CI에 `packageManager` 필드의 버전을 고정해 사용. `bun --version` 출력 후 lint 실행                                                    |
| `wiki:ingest`의 한글 slug 파일명 편집기 호환성                  | LOW  | §7.2 정책(ASCII lowercase + 공백→`-`, 한글은 그대로 유지)을 fixture 테스트로 고정. 호환 이슈가 실측되면 slug override 인자 추가(후속) |
| Pre-push 지연으로 개발 플로우 저해                              | LOW  | 대상 파일 수 < 100 규모 → 경량 파서로 <1s. `SKIP_WIKI_CI` 탈출구 보유                                                                 |

## 13. Rollback

- 구현 PR을 revert하면 `wiki:*` scripts, `tools/wiki/`, pre-push/CI step이 전부 제거된다. 문서 frontmatter 자체는 Phase 1 산출물이므로 잔존한다.
- 부분 롤백이 필요하면 `SKIP_WIKI_CI=1` 환경변수로 hook만 무력화하고 CLI는 유지.

## 14. Open Questions (후속 결정)

1. `wiki:links --fix` 자동 수정을 Sub-4 또는 별도 issue에서 도입할지.
2. `wiki:ingest`의 topic 목록(`harness/ops/tasks/incidents`)을 `docs/wiki/schema/` 어디에 SSOT로 둘지. 현재는 코드 상수.
3. `packages/**/*.md` (예: `packages/api-server/AGENT.md`)까지 lint 범위를 확장할 시점.
4. `wiki:lint --format json` 지원 (에디터/CI 통합 용).

## 15. References

- Phase 1 Design: `docs/superpowers/specs/2026-04-17-llm-wiki-foundation-design.md`
- ADR-0002: `docs/adr/ADR-0002-llm-wiki-foundation.md`
- Karpathy LLM wiki gist: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
- Issue #231, PR #233

---

**Status**: Design approved on 2026-04-17. 다음 단계는 `superpowers:writing-plans` 스킬로 implementation plan을 생성한다.
