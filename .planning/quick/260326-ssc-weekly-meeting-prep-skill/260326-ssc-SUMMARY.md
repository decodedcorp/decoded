---
phase: quick
plan: 260326-ssc
subsystem: skills
tags: [meeting-prep, skill, productivity, git, github]
dependency_graph:
  requires: []
  provides: [".claude/skills/meeting-prep/SKILL.md"]
  affects: []
tech_stack:
  added: []
  patterns: ["Claude Code Skill SKILL.md pattern"]
key_files:
  created:
    - .claude/skills/meeting-prep/SKILL.md
  modified: []
decisions:
  - "macOS date -v syntax used as primary with GNU/fallback for portability"
  - "GSD section uses 2>/dev/null and is fully omitted when .planning/ absent"
  - "gh CLI absence triggers graceful skip with user-facing notice"
metrics:
  duration: "~5 minutes"
  completed: "2026-03-26"
  tasks_completed: 1
  files_created: 1
---

# Phase quick Plan 260326-ssc: Weekly Meeting-Prep Skill Summary

**One-liner:** Claude Code skill that generates Notion-pasteable weekly update from git log, gh PRs/issues, and GSD artifacts — triggered by `/meeting-prep` or natural language.

## What Was Built

A reusable Claude Code skill at `.claude/skills/meeting-prep/SKILL.md` that automates Thursday morning meeting prep for the SSC weekly standup.

### Skill Capabilities

1. **Date range auto-calculation** — defaults to previous Thursday 00:00 to now; `--since` override supported
2. **Git commit aggregation** — filters by `git config user.name`, groups by conventional commit type (feat/fix/refactor/docs/chore)
3. **Branch/WIP status** — active branches sorted by recency, uncommitted files, stash entries
4. **PR & Issue summary** — via `gh pr list` and `gh issue list` with JSON output
5. **GSD project status** — extracts current phase/progress from `.planning/STATE.md` and `.planning/ROADMAP.md`

### Graceful Degradation

| Condition | Behavior |
|-----------|----------|
| No `gh` CLI | PRs/Issues section omitted + notice shown |
| No `.planning/` directory | Project Status (GSD) section omitted entirely |
| No commits in range | Section shows "이 기간에 커밋이 없습니다." |

## Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create meeting-prep skill SKILL.md | 2283b4a8 | .claude/skills/meeting-prep/SKILL.md |

## Verification

```
PASS: test -f .claude/skills/meeting-prep/SKILL.md && head -5 ... | grep -q "name: meeting-prep"
```

## Deviations from Plan

None - plan executed exactly as written.

## Usage

```
> /meeting-prep
> 이번 주 미팅 준비해줘
> weekly update 정리해줘
> meeting prep --since 2026-03-10
```

## Self-Check: PASSED

- [x] `.claude/skills/meeting-prep/SKILL.md` exists
- [x] Commit `2283b4a8` exists in git log
- [x] Frontmatter has name, description, allowed-tools, model
- [x] All 5 data sources documented with bash commands
- [x] GSD section has `2>/dev/null` null-safety
- [x] Output template is Notion-compatible markdown
- [x] Trigger conditions listed
- [x] Usage examples provided
