# tools/wiki

Bun + TypeScript CLI for maintaining `docs/wiki/**` (LLM wiki foundation — Phase 1 / Sub-3).

## Commands

| Command                               | Purpose                                                                                |
| ------------------------------------- | -------------------------------------------------------------------------------------- |
| `bun run wiki:lint`                   | Validate frontmatter + H1/title + `related:` path existence across configured globs    |
| `bun run wiki:links`                  | Report broken body links (`[text](target)`) + build `related:` backlink reverse index  |
| `bun run wiki:ingest <topic> <title>` | Create a new note skeleton in `docs/wiki/wiki/<topic>/` and append entry to `INDEX.md` |

Allowed `<topic>` values: `harness | ops | tasks | incidents`.

## Lint scope

See `lib/config.ts:LINT_GLOBS`. Currently covers:

- `docs/wiki/**/*.md`
- `docs/agent/*.md`
- `docs/adr/*.md`
- `docs/superpowers/specs/**/*.md`
- `docs/ai-playbook/*.md`

## Exit codes

- `0` — OK
- `1` — validation error (lint/links found issues)
- `2` — I/O or config error (unknown subcommand, invalid topic, missing tags vocabulary, etc.)

## Adding a tag

1. Edit `docs/wiki/schema/tags.md` (append row in the appropriate section).
2. Rerun `bun run wiki:lint` to verify consumers pass.

## Tests

Run: `bun test tools/wiki/`. Fixtures under `tools/wiki/__tests__/fixtures/`.

## Integration

- `scripts/git-pre-push.sh` runs `wiki:lint` (skip via `SKIP_WIKI_CI=1`).
- `.github/workflows/wiki-lint.yml` runs on PR and push to `dev`/`main`.

Spec: `docs/superpowers/specs/2026-04-17-llm-wiki-sub3-cli-design.md`.
