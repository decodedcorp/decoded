---
phase: quick
plan: 260326-ssc
type: execute
wave: 1
depends_on: []
files_modified:
  - .claude/skills/meeting-prep/SKILL.md
autonomous: true
requirements: [QUICK-meeting-prep-skill]

must_haves:
  truths:
    - "User can run /meeting-prep and get a formatted weekly update"
    - "Output covers git commits, branches, PRs, issues for the past week"
    - "GSD artifacts (STATE.md, ROADMAP.md) are included when present, gracefully skipped when absent"
    - "Output is Notion-pasteable markdown"
    - "WIP (uncommitted changes, open branches) is captured"
  artifacts:
    - path: ".claude/skills/meeting-prep/SKILL.md"
      provides: "Weekly meeting prep skill definition"
      min_lines: 80
  key_links:
    - from: ".claude/skills/meeting-prep/SKILL.md"
      to: "git log, gh pr, gh issue, .planning/STATE.md"
      via: "bash commands in skill instructions"
      pattern: "git log|gh pr|gh issue"
---

<objective>
Create a Claude Code skill at `.claude/skills/meeting-prep/SKILL.md` that generates weekly meeting prep summaries.

Purpose: Every Thursday before 9am team meeting, quickly generate a structured update covering what was done, what's in progress, and what's next -- ready to paste into Notion.

Output: Single SKILL.md file following existing skill patterns (git-workflow reference).
</objective>

<execution_context>
@/Users/kiyeol/.claude-pers/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-pers/get-shit-done/templates/summary.md
</execution_context>

<context>
@.claude/skills/git-workflow/SKILL.md
@.planning/STATE.md
@CLAUDE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create meeting-prep skill SKILL.md</name>
  <files>.claude/skills/meeting-prep/SKILL.md</files>
  <action>
Create `.claude/skills/meeting-prep/SKILL.md` following the exact pattern from `git-workflow/SKILL.md`.

**Frontmatter:**
```yaml
---
name: meeting-prep
description: >
  주간 미팅 준비용 업데이트 요약 생성.
  "meeting prep", "주간 업데이트", "weekly update", "미팅 준비" 요청 시 적용.
allowed-tools: Read, Grep, Glob, Bash
model: claude-sonnet-4-20250514
---
```

**Skill body must include these sections:**

1. **Overview** -- 매주 목요일 9시 SSC 미팅용 주간 업데이트 생성 스킬. `/meeting-prep` 또는 자연어로 트리거.

2. **Trigger conditions** -- "meeting prep", "주간 업데이트", "weekly update", "미팅 준비", "이번 주 뭐 했지"

3. **Date range calculation** -- 기간은 전주 목요일 00:00 ~ 현재. Bash로 계산:
   ```bash
   # 전주 목요일 계산 (macOS date)
   LAST_THU=$(date -v-thu -v-7d +%Y-%m-%d)
   # 또는 GNU date: LAST_THU=$(date -d "last thursday -7 days" +%Y-%m-%d)
   ```
   사용자가 `--since 2026-03-15` 같이 기간을 직접 지정하면 그것을 사용.

4. **Data sources** (각각 bash 명령어 포함):

   a. **Git commits** -- 특정 author (기본: git config user.name) 의 커밋:
   ```bash
   git log --author="$(git config user.name)" --since="$LAST_THU" --oneline --no-merges
   ```
   커밋을 conventional commit type 별로 그룹핑 (feat, fix, refactor, docs, chore 등).

   b. **Branch status** -- 현재 활성 브랜치들 및 worktree:
   ```bash
   git branch --sort=-committerdate --format='%(refname:short) %(committerdate:relative)' | head -10
   git worktree list 2>/dev/null
   ```

   c. **PRs and Issues** -- gh CLI 사용:
   ```bash
   gh pr list --author=@me --state=all --limit=20 --json number,title,state,updatedAt
   gh issue list --assignee=@me --state=open --limit=10 --json number,title,labels
   ```

   d. **WIP (Work in Progress)** -- uncommitted changes:
   ```bash
   git status --short
   git stash list
   ```

   e. **GSD Artifacts (optional)** -- .planning/ 디렉토리가 있으면 포함, 없으면 스킵:
   ```bash
   # STATE.md에서 현재 포지션, 진행률 추출
   cat .planning/STATE.md 2>/dev/null | head -30
   # ROADMAP.md에서 현재 마일스톤 요약
   cat .planning/ROADMAP.md 2>/dev/null | head -50
   ```
   Cursor 사용자는 .planning/ 이 없을 수 있으므로 반드시 `2>/dev/null` 사용하고 없으면 해당 섹션 자체를 생략.

5. **Output format** -- Notion 호환 마크다운. 아래 템플릿을 SKILL.md 안에 명시:

   ```markdown
   # Weekly Update — {name} ({date_range})

   ## Done (완료)
   ### Features
   - feat(scope): description (PR #N)
   ### Fixes
   - fix(scope): description
   ### Other
   - refactor/docs/chore items

   ## In Progress (진행 중)
   - Branch: `feat/xxx` — description (N commits ahead)
   - Uncommitted changes: N files modified

   ## PRs
   | # | Title | Status |
   |---|-------|--------|
   | 123 | Title | merged/open/closed |

   ## Issues
   | # | Title | Labels |
   |---|-------|--------|
   | 45 | Title | bug, priority |

   ## Project Status (GSD)
   > 이 섹션은 .planning/ 디렉토리가 있을 때만 표시
   - Milestone: v10.0 Profile Completion
   - Progress: 43/50 phases
   - Current: Phase 44 (auth-guard)

   ## Next Week Plan
   - (커밋 로그와 GSD 상태 기반으로 AI가 추론)
   ```

6. **Usage examples:**
   ```
   > /meeting-prep
   > 이번 주 미팅 준비해줘
   > weekly update 정리해줘
   > meeting prep --since 2026-03-10
   ```

7. **Notes:**
   - gh CLI가 설치되지 않은 경우 PR/Issue 섹션은 스킵하고 안내 메시지 출력
   - author 필터는 git config user.name 기본값 사용, 사용자가 다른 이름 지정 가능
   - 출력 언어는 사용자 요청에 따름 (기본: 한국어 섹션 헤더 + 영어 내용)
  </action>
  <verify>
    <automated>test -f .claude/skills/meeting-prep/SKILL.md && head -5 .claude/skills/meeting-prep/SKILL.md | grep -q "name: meeting-prep" && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <done>
    - SKILL.md exists at .claude/skills/meeting-prep/SKILL.md
    - Frontmatter has name, description, allowed-tools, model
    - All 5 data sources documented with bash commands
    - Output template is Notion-compatible markdown
    - GSD section gracefully handles missing .planning/
    - Trigger conditions listed
    - Usage examples provided
  </done>
</task>

<task type="checkpoint:human-verify" gate="non-blocking">
  <what-built>Weekly meeting prep skill at .claude/skills/meeting-prep/SKILL.md</what-built>
  <how-to-verify>
    1. Run `/meeting-prep` in Claude Code (or say "주간 업데이트 정리해줘")
    2. Verify output covers: commits grouped by type, active branches, PRs, issues, GSD status
    3. Verify the markdown output is clean enough to paste into Notion
    4. Verify WIP (uncommitted changes) section appears
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

</tasks>

<verification>
- SKILL.md file exists and follows git-workflow pattern
- Frontmatter is valid YAML
- Bash commands are correct for macOS (date -v syntax)
- GSD section has proper null-safety (2>/dev/null)
</verification>

<success_criteria>
- `/meeting-prep` trigger produces structured weekly update
- Output covers all 5 data sources (git, branches, PRs, issues, GSD)
- Notion-pasteable markdown format
- Works without .planning/ directory (Cursor users)
- Works without gh CLI (graceful skip)
</success_criteria>

<output>
After completion, create `.planning/quick/260326-ssc-weekly-meeting-prep-skill/260326-ssc-SUMMARY.md`
</output>
