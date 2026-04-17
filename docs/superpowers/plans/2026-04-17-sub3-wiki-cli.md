# Sub-3 Wiki CLI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `bun run wiki:{lint,links,ingest}` CLI를 `tools/wiki/`에 구현하고 pre-push hook + CI에 연결한다.

**Architecture:** Bun 런타임으로 직접 실행되는 standalone TypeScript (package.json 없음). `cli.ts` 진입점이 3개 subcommand로 분기. `lib/*`는 순수 함수 위주로 테스트 용이하게 분리. `gray-matter`만 외부 의존, 나머지는 Bun 내장(`Bun.Glob`) + Node stdlib.

**Tech Stack:** Bun 1.3.10, TypeScript, `gray-matter`, `bun:test`.

**Spec reference:** `docs/superpowers/specs/2026-04-17-llm-wiki-sub3-cli-design.md` (commit `4c7243e1`).

---

## File Structure

```
tools/wiki/
├── README.md                       # Task 1
├── cli.ts                          # Task 1 (stub) → Tasks 3/4/5 (wire)
├── lib/
│   ├── config.ts                   # Task 1
│   ├── fs.ts                       # Task 1
│   ├── report.ts                   # Task 1
│   ├── frontmatter.ts              # Task 2
│   ├── schema.ts                   # Task 2
│   └── markdown.ts                 # Task 2
├── lint.ts                         # Task 3
├── links.ts                        # Task 4
├── ingest.ts                       # Task 5
└── __tests__/
    ├── fixtures/
    │   └── tags.md                 # Task 2
    ├── frontmatter.test.ts         # Task 2
    ├── schema.test.ts              # Task 2
    ├── markdown.test.ts            # Task 2
    ├── lint.test.ts                # Task 3
    ├── links.test.ts               # Task 4
    └── ingest.test.ts              # Task 5

.github/workflows/wiki-lint.yml     # Task 6
scripts/git-pre-push.sh             # Task 6 (modify)
package.json                        # Task 1 (modify)
```

각 파일의 책임은 단일하다. `lib/*`는 I/O를 최소화해 순수 함수로 테스트 가능하게 한다. `cli.ts`는 argv 파싱만 담당하며 비즈니스 로직은 `lint/links/ingest.ts`가 가진다.

---

## Task 1: Scaffold — config, fs, report, cli stub, dep, scripts

**Files:**
- Create: `tools/wiki/README.md`
- Create: `tools/wiki/cli.ts`
- Create: `tools/wiki/lib/config.ts`
- Create: `tools/wiki/lib/fs.ts`
- Create: `tools/wiki/lib/report.ts`
- Create: `tools/wiki/__tests__/fs.test.ts`
- Create: `tools/wiki/__tests__/report.test.ts`
- Modify: `package.json` (add `gray-matter` devDep + `wiki:*` scripts)

- [ ] **Step 1.1: Write failing test for `lib/fs.ts`**

Create `tools/wiki/__tests__/fs.test.ts`:

```ts
import { test, expect } from 'bun:test';
import { toRepoRelative } from '../lib/fs.ts';

test('toRepoRelative normalizes to forward slashes', () => {
  expect(toRepoRelative('/repo', '/repo/docs/agent/x.md')).toBe('docs/agent/x.md');
});

test('toRepoRelative handles identical paths', () => {
  expect(toRepoRelative('/repo', '/repo')).toBe('');
});
```

- [ ] **Step 1.2: Run test to verify it fails**

Run: `cd /Users/kiyeol/development/decoded/decoded-monorepo/.worktrees/231-wiki-lint-cli && bun test tools/wiki/__tests__/fs.test.ts`
Expected: FAIL with module resolution error.

- [ ] **Step 1.3: Implement `lib/fs.ts`**

Create `tools/wiki/lib/fs.ts`:

```ts
import path from 'node:path';
import fs from 'node:fs/promises';

export async function findRepoRoot(start: string = process.cwd()): Promise<string> {
  let dir = start;
  while (dir !== path.dirname(dir)) {
    try {
      await fs.stat(path.join(dir, '.git'));
      return dir;
    } catch {}
    dir = path.dirname(dir);
  }
  throw new Error('repo root (.git) not found');
}

export async function readText(p: string): Promise<string> {
  return fs.readFile(p, 'utf8');
}

export async function exists(p: string): Promise<boolean> {
  try { await fs.stat(p); return true; } catch { return false; }
}

export function toRepoRelative(root: string, abs: string): string {
  return path.relative(root, abs).split(path.sep).join('/');
}
```

- [ ] **Step 1.4: Run test to verify it passes**

Run: `bun test tools/wiki/__tests__/fs.test.ts`
Expected: 2 pass, 0 fail.

- [ ] **Step 1.5: Implement `lib/config.ts`**

Create `tools/wiki/lib/config.ts`:

```ts
export const LINT_GLOBS = [
  'docs/wiki/**/*.md',
  'docs/agent/*.md',
  'docs/adr/*.md',
  'docs/superpowers/specs/**/*.md',
  'docs/ai-playbook/*.md',
];

export const TAG_VOCAB_PATH = 'docs/wiki/schema/tags.md';
export const INDEX_PATH = 'docs/wiki/wiki/INDEX.md';

export const INGEST_TOPICS = ['harness', 'ops', 'tasks', 'incidents'] as const;
export type IngestTopic = (typeof INGEST_TOPICS)[number];

export const INGEST_SECTION_HEADERS: Record<IngestTopic, string> = {
  harness: '## Harness',
  ops: '## Ops',
  tasks: '## Tasks',
  incidents: '## Incidents',
};

export const EXIT = {
  OK: 0,
  VALIDATION_ERROR: 1,
  IO_ERROR: 2,
} as const;

export const VALID_OWNERS = new Set(['llm', 'human']);
export const VALID_STATUS = new Set(['draft', 'approved', 'stale', 'deprecated']);
export const RELATED_WARNING_THRESHOLD = 6;
```

- [ ] **Step 1.6: Write failing test for `lib/report.ts`**

Create `tools/wiki/__tests__/report.test.ts`:

```ts
import { test, expect } from 'bun:test';
import { formatIssue, summarize } from '../lib/report.ts';

test('formatIssue produces path:line CODE message', () => {
  expect(formatIssue({
    file: 'docs/wiki/wiki/INDEX.md',
    line: 3,
    code: 'MISSING_FIELD',
    message: 'tags',
    severity: 'error',
  })).toBe('docs/wiki/wiki/INDEX.md:3 MISSING_FIELD tags');
});

test('summarize reports error/warning counts', () => {
  const out = summarize(
    [
      { file: 'a.md', line: 1, code: 'X', message: '', severity: 'error' },
      { file: 'b.md', line: 1, code: 'Y', message: '', severity: 'warning' },
    ],
    2,
    420,
  );
  expect(out).toContain('1 errors');
  expect(out).toContain('1 warnings');
  expect(out).toContain('2 files');
  expect(out).toContain('0.42s');
});
```

- [ ] **Step 1.7: Run test to verify it fails**

Run: `bun test tools/wiki/__tests__/report.test.ts`
Expected: FAIL (module resolution).

- [ ] **Step 1.8: Implement `lib/report.ts`**

Create `tools/wiki/lib/report.ts`:

```ts
export type Severity = 'error' | 'warning';

export interface Issue {
  file: string;
  line: number;
  code: string;
  message: string;
  severity: Severity;
}

export function formatIssue(issue: Issue): string {
  const msg = issue.message ? ` ${issue.message}` : '';
  return `${issue.file}:${issue.line} ${issue.code}${msg}`;
}

export function summarize(issues: Issue[], filesChecked: number, elapsedMs: number): string {
  const errors = issues.filter(i => i.severity === 'error').length;
  const warnings = issues.filter(i => i.severity === 'warning').length;
  const mark = errors ? '✖' : '✓';
  return `\n${mark} ${errors} errors, ${warnings} warnings across ${filesChecked} files (checked in ${(elapsedMs / 1000).toFixed(2)}s)`;
}
```

- [ ] **Step 1.9: Run both lib tests to verify they pass**

Run: `bun test tools/wiki/__tests__/fs.test.ts tools/wiki/__tests__/report.test.ts`
Expected: all pass.

- [ ] **Step 1.10: Create `cli.ts` stub with help output**

Create `tools/wiki/cli.ts`:

```ts
#!/usr/bin/env bun
import { EXIT } from './lib/config.ts';

function help(): void {
  process.stdout.write(`wiki CLI — docs/wiki/** validator/linker/ingest

Usage:
  bun run wiki:lint                       Validate frontmatter + H1 + related paths
  bun run wiki:links                      Report broken body links + backlink index
  bun run wiki:ingest <topic> <title>     Create new note + update INDEX.md
                                          topic: harness|ops|tasks|incidents
`);
}

async function main(): Promise<number> {
  const [subcommand] = process.argv.slice(2);
  switch (subcommand) {
    case 'lint':
    case 'links':
    case 'ingest':
      process.stderr.write(`TODO: ${subcommand} not yet implemented\n`);
      return EXIT.IO_ERROR;
    case '-h':
    case '--help':
    case undefined:
      help();
      return EXIT.OK;
    default:
      process.stderr.write(`unknown subcommand: ${subcommand}\n`);
      help();
      return EXIT.IO_ERROR;
  }
}

main().then(code => process.exit(code)).catch(e => {
  process.stderr.write(`fatal: ${(e as Error).stack ?? e}\n`);
  process.exit(EXIT.IO_ERROR);
});
```

- [ ] **Step 1.11: Install `gray-matter` and add `wiki:*` scripts to root `package.json`**

Run: `bun add -D gray-matter`

Then open `package.json` and add inside the `"scripts"` object, right after the existing `"deploy:backend"` line:

```json
    "wiki:lint":   "bun tools/wiki/cli.ts lint",
    "wiki:links":  "bun tools/wiki/cli.ts links",
    "wiki:ingest": "bun tools/wiki/cli.ts ingest"
```

Trailing-comma adjust the previous line if necessary to keep valid JSON.

- [ ] **Step 1.12: Smoke test `bun run wiki:lint`**

Run: `bun run wiki:lint`
Expected: exits with code 2 and stderr `TODO: lint not yet implemented` (confirms script wiring).

Run: `bun run --help` does not apply. Instead confirm help: `bun tools/wiki/cli.ts --help`
Expected: exits 0, prints help text to stdout.

- [ ] **Step 1.13: Create `tools/wiki/README.md`**

Create `tools/wiki/README.md`:

```markdown
# tools/wiki

Bun + TypeScript CLI for maintaining `docs/wiki/**` (LLM wiki foundation — Phase 1 / Sub-3).

## Commands

| Command | Purpose |
|---------|---------|
| `bun run wiki:lint` | Validate frontmatter + H1/title + `related:` path existence across configured globs |
| `bun run wiki:links` | Report broken body links (`[text](target)`) + build `related:` backlink reverse index |
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
```

- [ ] **Step 1.14: Commit**

```bash
git add tools/wiki/README.md tools/wiki/cli.ts tools/wiki/lib tools/wiki/__tests__/fs.test.ts tools/wiki/__tests__/report.test.ts package.json bun.lock
git commit -m "feat(#231): scaffold tools/wiki (config, fs, report, cli stub)"
```

---

## Task 2: Library layer — frontmatter, schema, markdown + tests

**Files:**
- Create: `tools/wiki/lib/frontmatter.ts`
- Create: `tools/wiki/lib/schema.ts`
- Create: `tools/wiki/lib/markdown.ts`
- Create: `tools/wiki/__tests__/fixtures/tags.md`
- Create: `tools/wiki/__tests__/frontmatter.test.ts`
- Create: `tools/wiki/__tests__/schema.test.ts`
- Create: `tools/wiki/__tests__/markdown.test.ts`

- [ ] **Step 2.1: Create fixture `tools/wiki/__tests__/fixtures/tags.md`**

```markdown
# Fixture Tag Vocabulary

| `harness`      | X |
| `agent`        | X |
| `llm-write`    | X |
| `claude-code`  | X |
| `architecture` | X |
```

Only markdown table rows with `` `tag` `` in the first cell are parsed. Header rows and prose are ignored by the loader.

- [ ] **Step 2.2: Write failing test for `lib/schema.ts`**

Create `tools/wiki/__tests__/schema.test.ts`:

```ts
import { test, expect } from 'bun:test';
import path from 'node:path';
import { loadTagVocabulary } from '../lib/schema.ts';

const FIXTURE = path.join(import.meta.dir, 'fixtures/tags.md');

test('loadTagVocabulary reads backticked tags from table rows', async () => {
  const vocab = await loadTagVocabulary(FIXTURE);
  expect(vocab.has('harness')).toBe(true);
  expect(vocab.has('claude-code')).toBe(true);
  expect(vocab.has('llm-write')).toBe(true);
  expect(vocab.size).toBe(5);
});

test('loadTagVocabulary ignores prose', async () => {
  const vocab = await loadTagVocabulary(FIXTURE);
  expect(vocab.has('Fixture')).toBe(false);
});
```

- [ ] **Step 2.3: Run test to verify it fails**

Run: `bun test tools/wiki/__tests__/schema.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 2.4: Implement `lib/schema.ts`**

Create `tools/wiki/lib/schema.ts`:

```ts
import { readText } from './fs.ts';

const TAG_ROW_RE = /^\|\s*`([^`]+)`\s*\|/;

export async function loadTagVocabulary(tagsPath: string): Promise<Set<string>> {
  const content = await readText(tagsPath);
  const tags = new Set<string>();
  for (const line of content.split('\n')) {
    const m = line.match(TAG_ROW_RE);
    if (m) tags.add(m[1]);
  }
  return tags;
}
```

- [ ] **Step 2.5: Run test to verify it passes**

Run: `bun test tools/wiki/__tests__/schema.test.ts`
Expected: 2 pass.

- [ ] **Step 2.6: Write failing tests for `lib/frontmatter.ts`**

Create `tools/wiki/__tests__/frontmatter.test.ts`:

```ts
import { test, expect } from 'bun:test';
import { parseFrontmatter, validateFrontmatter } from '../lib/frontmatter.ts';

const validTags = new Set(['harness', 'agent', 'llm-write', 'claude-code']);

function build(fm: string, body = '# X\n'): string {
  return `---\n${fm}\n---\n\n${body}`;
}

test('MISSING_FRONTMATTER when no block', () => {
  const issues = validateFrontmatter('f.md', parseFrontmatter('# Hi\n'), validTags);
  expect(issues.some(i => i.code === 'MISSING_FRONTMATTER')).toBe(true);
});

test('MISSING_FIELD for each required field absent', () => {
  const c = build('title: X\nowner: llm');
  const issues = validateFrontmatter('f.md', parseFrontmatter(c), validTags);
  const missing = issues.filter(i => i.code === 'MISSING_FIELD').map(i => i.message).sort();
  expect(missing).toEqual(['status', 'tags', 'updated']);
});

test('INVALID_OWNER', () => {
  const c = build('title: X\nowner: bot\nstatus: draft\nupdated: 2026-04-17\ntags:\n  - harness');
  const issues = validateFrontmatter('f.md', parseFrontmatter(c), validTags);
  expect(issues.some(i => i.code === 'INVALID_OWNER')).toBe(true);
});

test('INVALID_STATUS', () => {
  const c = build('title: X\nowner: llm\nstatus: whatever\nupdated: 2026-04-17\ntags:\n  - harness');
  const issues = validateFrontmatter('f.md', parseFrontmatter(c), validTags);
  expect(issues.some(i => i.code === 'INVALID_STATUS')).toBe(true);
});

test('INVALID_UPDATED (bad format)', () => {
  const c = build('title: X\nowner: llm\nstatus: draft\nupdated: 04/17/2026\ntags:\n  - harness');
  const issues = validateFrontmatter('f.md', parseFrontmatter(c), validTags);
  expect(issues.some(i => i.code === 'INVALID_UPDATED')).toBe(true);
});

test('INVALID_UPDATED (future date)', () => {
  const c = build('title: X\nowner: llm\nstatus: draft\nupdated: 2099-01-01\ntags:\n  - harness');
  const issues = validateFrontmatter('f.md', parseFrontmatter(c), validTags);
  expect(issues.some(i => i.code === 'INVALID_UPDATED')).toBe(true);
});

test('EMPTY_TAGS', () => {
  const c = build('title: X\nowner: llm\nstatus: draft\nupdated: 2026-04-17\ntags: []');
  const issues = validateFrontmatter('f.md', parseFrontmatter(c), validTags);
  expect(issues.some(i => i.code === 'EMPTY_TAGS')).toBe(true);
});

test('UNKNOWN_TAG with did-you-mean suggestion', () => {
  const c = build('title: X\nowner: llm\nstatus: draft\nupdated: 2026-04-17\ntags:\n  - claud-code');
  const issues = validateFrontmatter('f.md', parseFrontmatter(c), validTags);
  const issue = issues.find(i => i.code === 'UNKNOWN_TAG');
  expect(issue).toBeTruthy();
  expect(issue!.message).toContain('claude-code');
});

test('TOO_MANY_RELATED is a warning', () => {
  const c = build(
    'title: X\nowner: llm\nstatus: draft\nupdated: 2026-04-17\ntags:\n  - harness\nrelated:\n  - a.md\n  - b.md\n  - c.md\n  - d.md\n  - e.md\n  - f.md',
  );
  const issues = validateFrontmatter('f.md', parseFrontmatter(c), validTags);
  const w = issues.find(i => i.code === 'TOO_MANY_RELATED');
  expect(w).toBeTruthy();
  expect(w!.severity).toBe('warning');
});

test('valid file produces zero error-severity issues', () => {
  const c = build('title: Foo\nowner: llm\nstatus: draft\nupdated: 2026-04-17\ntags:\n  - harness', '# Foo\n');
  const issues = validateFrontmatter('f.md', parseFrontmatter(c), validTags);
  expect(issues.filter(i => i.severity === 'error')).toEqual([]);
});
```

- [ ] **Step 2.7: Run test to verify it fails**

Run: `bun test tools/wiki/__tests__/frontmatter.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 2.8: Implement `lib/frontmatter.ts`**

Create `tools/wiki/lib/frontmatter.ts`:

```ts
import matter from 'gray-matter';
import type { Issue } from './report.ts';
import {
  VALID_OWNERS,
  VALID_STATUS,
  RELATED_WARNING_THRESHOLD,
} from './config.ts';

export interface ParsedFrontmatter {
  hasBlock: boolean;
  data: Record<string, unknown>;
  body: string;
  bodyStartLine: number;
  fieldLines: Map<string, number>;
}

const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function parseFrontmatter(content: string): ParsedFrontmatter {
  const m = content.match(FM_RE);
  if (!m) {
    return {
      hasBlock: false,
      data: {},
      body: content,
      bodyStartLine: 1,
      fieldLines: new Map(),
    };
  }
  const parsed = matter(content);
  const fmBlock = m[1];
  const fieldLines = new Map<string, number>();
  const lines = fmBlock.split('\n');
  lines.forEach((l, i) => {
    const fieldMatch = l.match(/^([A-Za-z_][\w-]*)\s*:/);
    if (fieldMatch) fieldLines.set(fieldMatch[1], i + 2);
  });
  const bodyStartLine = lines.length + 3;
  return {
    hasBlock: true,
    data: parsed.data,
    body: parsed.content,
    bodyStartLine,
    fieldLines,
  };
}

export function validateFrontmatter(
  file: string,
  parsed: ParsedFrontmatter,
  validTags: Set<string>,
): Issue[] {
  const issues: Issue[] = [];
  if (!parsed.hasBlock) {
    issues.push({ file, line: 1, code: 'MISSING_FRONTMATTER', message: '', severity: 'error' });
    return issues;
  }

  const required = ['title', 'owner', 'status', 'updated', 'tags'] as const;
  for (const field of required) {
    if (parsed.data[field] === undefined || parsed.data[field] === null) {
      issues.push({ file, line: 1, code: 'MISSING_FIELD', message: field, severity: 'error' });
    }
  }

  const owner = parsed.data.owner;
  if (typeof owner === 'string' && !VALID_OWNERS.has(owner)) {
    issues.push({
      file,
      line: parsed.fieldLines.get('owner') ?? 1,
      code: 'INVALID_OWNER',
      message: `"${owner}"`,
      severity: 'error',
    });
  }

  const status = parsed.data.status;
  if (typeof status === 'string' && !VALID_STATUS.has(status)) {
    issues.push({
      file,
      line: parsed.fieldLines.get('status') ?? 1,
      code: 'INVALID_STATUS',
      message: `"${status}"`,
      severity: 'error',
    });
  }

  const updatedRaw = parsed.data.updated;
  if (updatedRaw !== undefined) {
    const s = updatedRaw instanceof Date
      ? updatedRaw.toISOString().slice(0, 10)
      : String(updatedRaw);
    const today = new Date().toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      issues.push({
        file,
        line: parsed.fieldLines.get('updated') ?? 1,
        code: 'INVALID_UPDATED',
        message: `"${s}" not YYYY-MM-DD`,
        severity: 'error',
      });
    } else if (s > today) {
      issues.push({
        file,
        line: parsed.fieldLines.get('updated') ?? 1,
        code: 'INVALID_UPDATED',
        message: `"${s}" is in the future`,
        severity: 'error',
      });
    }
  }

  const tags = parsed.data.tags;
  if (Array.isArray(tags)) {
    if (tags.length === 0) {
      issues.push({
        file,
        line: parsed.fieldLines.get('tags') ?? 1,
        code: 'EMPTY_TAGS',
        message: '',
        severity: 'error',
      });
    } else {
      for (const t of tags) {
        if (typeof t !== 'string' || !validTags.has(t)) {
          const suggestion = typeof t === 'string' ? suggestTag(t, validTags) : null;
          const suffix = suggestion ? ` (did you mean "${suggestion}"?)` : '';
          issues.push({
            file,
            line: parsed.fieldLines.get('tags') ?? 1,
            code: 'UNKNOWN_TAG',
            message: `"${t}"${suffix}`,
            severity: 'error',
          });
        }
      }
    }
  }

  const related = parsed.data.related;
  if (Array.isArray(related) && related.length >= RELATED_WARNING_THRESHOLD) {
    issues.push({
      file,
      line: parsed.fieldLines.get('related') ?? 1,
      code: 'TOO_MANY_RELATED',
      message: `${related.length} entries (>=${RELATED_WARNING_THRESHOLD})`,
      severity: 'warning',
    });
  }

  return issues;
}

function suggestTag(input: string, vocab: Set<string>): string | null {
  let best: string | null = null;
  let bestDist = 3;
  for (const t of vocab) {
    const d = levenshtein(input, t);
    if (d < bestDist) {
      best = t;
      bestDist = d;
    }
  }
  return best;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}
```

- [ ] **Step 2.9: Run frontmatter tests to verify they pass**

Run: `bun test tools/wiki/__tests__/frontmatter.test.ts`
Expected: 10 pass.

- [ ] **Step 2.10: Write failing tests for `lib/markdown.ts` (includes Phase 1 A1-A4 regression)**

Create `tools/wiki/__tests__/markdown.test.ts`:

```ts
import { test, expect } from 'bun:test';
import { extractH1, extractBodyLinks } from '../lib/markdown.ts';

test('extractH1 finds first H1 with correct line number', () => {
  const body = 'Intro\n\n# Hello\n\nmore text';
  const h1 = extractH1(body, 10);
  expect(h1).not.toBeNull();
  expect(h1!.text).toBe('Hello');
  expect(h1!.line).toBe(12);
});

test('extractH1 returns null when no H1', () => {
  expect(extractH1('no heading here', 1)).toBeNull();
});

test('extractBodyLinks skips code fence content (A1-A4 regression)', () => {
  const body = '\nText [ok](docs/ok.md) outside.\n\n```bash\n[should-skip](docs/nope.md)\n```\n\n[ok2](docs/ok2.md)\n';
  const targets = extractBodyLinks(body, 1).map(l => l.target);
  expect(targets).toContain('docs/ok.md');
  expect(targets).toContain('docs/ok2.md');
  expect(targets).not.toContain('docs/nope.md');
});

test('extractBodyLinks skips inline code', () => {
  const body = 'Use `[not-a-link](fake.md)` inline, but [real](real.md) outside.';
  const targets = extractBodyLinks(body, 1).map(l => l.target);
  expect(targets).toEqual(['real.md']);
});

test('extractBodyLinks skips single-line HTML comment', () => {
  const body = '[a](x.md)\n<!-- [should-skip](nope.md) -->\n[b](y.md)';
  const targets = extractBodyLinks(body, 1).map(l => l.target);
  expect(targets).toEqual(['x.md', 'y.md']);
});

test('extractBodyLinks skips multi-line HTML comment', () => {
  const body = '[a](x.md)\n<!--\n[should-skip](nope.md)\n-->\n[b](y.md)';
  const targets = extractBodyLinks(body, 1).map(l => l.target);
  expect(targets).toEqual(['x.md', 'y.md']);
});

test('extractBodyLinks flags images with isImage=true', () => {
  const body = '![alt](pic.png)';
  const links = extractBodyLinks(body, 1);
  expect(links.length).toBe(1);
  expect(links[0].isImage).toBe(true);
});

test('extractBodyLinks handles link with title', () => {
  const body = '[a](x.md "Title here")';
  const targets = extractBodyLinks(body, 1).map(l => l.target);
  expect(targets).toEqual(['x.md']);
});

test('extractBodyLinks assigns correct body line numbers', () => {
  const body = 'l0\nl1 [a](x.md)\nl2';
  const links = extractBodyLinks(body, 5);
  expect(links[0].line).toBe(6); // bodyStartLine=5 + index 1
});
```

- [ ] **Step 2.11: Run test to verify it fails**

Run: `bun test tools/wiki/__tests__/markdown.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 2.12: Implement `lib/markdown.ts`**

Create `tools/wiki/lib/markdown.ts`:

```ts
export interface H1 {
  text: string;
  line: number;
}

export function extractH1(body: string, bodyStartLine: number): H1 | null {
  const lines = body.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^#\s+(.+?)\s*$/);
    if (m) return { text: m[1].trim(), line: bodyStartLine + i };
  }
  return null;
}

export interface BodyLink {
  target: string;
  line: number;
  isImage: boolean;
}

const LINK_RE = /(!?)\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

export function extractBodyLinks(body: string, bodyStartLine: number): BodyLink[] {
  const links: BodyLink[] = [];
  const lines = body.split('\n');
  let inFence = false;
  let inHtmlComment = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];

    if (/^\s*```/.test(raw)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    let line = raw;

    if (inHtmlComment) {
      const end = line.indexOf('-->');
      if (end === -1) continue;
      line = line.slice(end + 3);
      inHtmlComment = false;
    }

    line = line.replace(/<!--[\s\S]*?-->/g, '');

    const openIdx = line.indexOf('<!--');
    if (openIdx !== -1) {
      line = line.slice(0, openIdx);
      inHtmlComment = true;
    }

    line = line.replace(/`[^`\n]*`/g, '');

    LINK_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = LINK_RE.exec(line)) !== null) {
      links.push({
        target: m[3].trim(),
        line: bodyStartLine + i,
        isImage: m[1] === '!',
      });
    }
  }

  return links;
}
```

- [ ] **Step 2.13: Run markdown tests to verify they pass**

Run: `bun test tools/wiki/__tests__/markdown.test.ts`
Expected: 9 pass.

- [ ] **Step 2.14: Run all tests so far**

Run: `bun test tools/wiki/`
Expected: all pass (no regression in fs/report).

- [ ] **Step 2.15: Commit**

```bash
git add tools/wiki/lib/frontmatter.ts tools/wiki/lib/schema.ts tools/wiki/lib/markdown.ts tools/wiki/__tests__/fixtures/tags.md tools/wiki/__tests__/frontmatter.test.ts tools/wiki/__tests__/schema.test.ts tools/wiki/__tests__/markdown.test.ts
git commit -m "feat(#231): wiki lib — frontmatter, schema, markdown"
```

---

## Task 3: `wiki:lint` command + CLI wire + integration tests

**Files:**
- Create: `tools/wiki/lint.ts`
- Create: `tools/wiki/__tests__/lint.test.ts`
- Modify: `tools/wiki/cli.ts`

- [ ] **Step 3.1: Write failing integration tests for `lint`**

Create `tools/wiki/__tests__/lint.test.ts`:

```ts
import { test, expect } from 'bun:test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { lint } from '../lint.ts';

const TAGS_MD = `| \`harness\`   | X |
| \`agent\`     | X |
| \`llm-write\` | X |
`;

async function setup(files: Record<string, string>): Promise<string> {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'wiki-lint-'));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(tmp, rel);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, content);
  }
  return tmp;
}

function validFm(body = '# Foo\n') {
  return `---
title: Foo
owner: llm
status: draft
updated: 2026-04-17
tags:
  - harness
---

${body}`;
}

test('lint passes valid file', async () => {
  const tmp = await setup({
    'docs/wiki/schema/tags.md': TAGS_MD,
    'docs/wiki/wiki/foo.md': validFm(),
  });
  try {
    const r = await lint({
      cwd: tmp,
      tagsPath: path.join(tmp, 'docs/wiki/schema/tags.md'),
      globs: ['docs/wiki/wiki/**/*.md'],
    });
    expect(r.issues.filter(i => i.severity === 'error')).toEqual([]);
    expect(r.filesChecked).toBe(1);
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('lint detects H1/title mismatch', async () => {
  const tmp = await setup({
    'docs/wiki/schema/tags.md': TAGS_MD,
    'docs/wiki/wiki/foo.md': validFm('# Bar\n'),
  });
  try {
    const r = await lint({
      cwd: tmp,
      tagsPath: path.join(tmp, 'docs/wiki/schema/tags.md'),
      globs: ['docs/wiki/wiki/**/*.md'],
    });
    expect(r.issues.some(i => i.code === 'H1_TITLE_MISMATCH')).toBe(true);
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('lint detects MISSING_H1', async () => {
  const tmp = await setup({
    'docs/wiki/schema/tags.md': TAGS_MD,
    'docs/wiki/wiki/foo.md': validFm('body without heading\n'),
  });
  try {
    const r = await lint({
      cwd: tmp,
      tagsPath: path.join(tmp, 'docs/wiki/schema/tags.md'),
      globs: ['docs/wiki/wiki/**/*.md'],
    });
    expect(r.issues.some(i => i.code === 'MISSING_H1')).toBe(true);
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('lint detects BROKEN_RELATED', async () => {
  const tmp = await setup({
    'docs/wiki/schema/tags.md': TAGS_MD,
    'docs/wiki/wiki/foo.md': `---
title: Foo
owner: llm
status: draft
updated: 2026-04-17
tags:
  - harness
related:
  - docs/nope.md
---

# Foo
`,
  });
  try {
    const r = await lint({
      cwd: tmp,
      tagsPath: path.join(tmp, 'docs/wiki/schema/tags.md'),
      globs: ['docs/wiki/wiki/**/*.md'],
    });
    const issue = r.issues.find(i => i.code === 'BROKEN_RELATED');
    expect(issue).toBeTruthy();
    expect(issue!.message).toBe('docs/nope.md');
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('lint flags files without frontmatter as MISSING_FRONTMATTER', async () => {
  const tmp = await setup({
    'docs/wiki/schema/tags.md': TAGS_MD,
    'docs/wiki/wiki/foo.md': '# Foo\n\nno frontmatter',
  });
  try {
    const r = await lint({
      cwd: tmp,
      tagsPath: path.join(tmp, 'docs/wiki/schema/tags.md'),
      globs: ['docs/wiki/wiki/**/*.md'],
    });
    expect(r.issues.some(i => i.code === 'MISSING_FRONTMATTER')).toBe(true);
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});
```

- [ ] **Step 3.2: Run tests to verify they fail**

Run: `bun test tools/wiki/__tests__/lint.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3.3: Implement `lint.ts`**

Create `tools/wiki/lint.ts`:

```ts
import path from 'node:path';
import { Glob } from 'bun';
import { parseFrontmatter, validateFrontmatter } from './lib/frontmatter.ts';
import { loadTagVocabulary } from './lib/schema.ts';
import { extractH1 } from './lib/markdown.ts';
import { readText, exists, findRepoRoot, toRepoRelative } from './lib/fs.ts';
import type { Issue } from './lib/report.ts';
import { formatIssue, summarize } from './lib/report.ts';
import { LINT_GLOBS, TAG_VOCAB_PATH, EXIT } from './lib/config.ts';

export interface LintOptions {
  cwd?: string;
  tagsPath?: string;
  globs?: string[];
}

export interface LintResult {
  issues: Issue[];
  filesChecked: number;
  elapsedMs: number;
}

export async function lint(opts: LintOptions = {}): Promise<LintResult> {
  const start = Date.now();
  const cwd = opts.cwd ?? (await findRepoRoot());
  const tagsPath = opts.tagsPath ?? path.join(cwd, TAG_VOCAB_PATH);
  const globs = opts.globs ?? LINT_GLOBS;

  const validTags = await loadTagVocabulary(tagsPath);
  const files = new Set<string>();
  for (const pattern of globs) {
    const glob = new Glob(pattern);
    for await (const rel of glob.scan({ cwd, onlyFiles: true })) {
      files.add(path.join(cwd, rel));
    }
  }

  const issues: Issue[] = [];
  for (const abs of files) {
    const rel = toRepoRelative(cwd, abs);
    const content = await readText(abs);
    const parsed = parseFrontmatter(content);

    issues.push(...validateFrontmatter(rel, parsed, validTags));

    if (parsed.hasBlock) {
      const h1 = extractH1(parsed.body, parsed.bodyStartLine);
      if (!h1) {
        issues.push({
          file: rel,
          line: parsed.bodyStartLine,
          code: 'MISSING_H1',
          message: '',
          severity: 'error',
        });
      } else {
        const title = parsed.data.title;
        if (typeof title === 'string' && h1.text !== title.trim()) {
          issues.push({
            file: rel,
            line: h1.line,
            code: 'H1_TITLE_MISMATCH',
            message: `H1 "${h1.text}" vs title "${title}"`,
            severity: 'error',
          });
        }
      }

      const related = parsed.data.related;
      if (Array.isArray(related)) {
        for (const r of related) {
          if (typeof r !== 'string') continue;
          const target = path.join(cwd, r);
          if (!(await exists(target))) {
            issues.push({
              file: rel,
              line: parsed.fieldLines.get('related') ?? 1,
              code: 'BROKEN_RELATED',
              message: r,
              severity: 'error',
            });
          }
        }
      }
    }
  }

  return { issues, filesChecked: files.size, elapsedMs: Date.now() - start };
}

export async function runLint(): Promise<number> {
  const result = await lint();
  for (const issue of result.issues) {
    const stream = issue.severity === 'error' ? process.stderr : process.stdout;
    stream.write(formatIssue(issue) + '\n');
  }
  process.stdout.write(summarize(result.issues, result.filesChecked, result.elapsedMs) + '\n');
  return result.issues.some(i => i.severity === 'error') ? EXIT.VALIDATION_ERROR : EXIT.OK;
}
```

- [ ] **Step 3.4: Wire `lint` into `cli.ts`**

Open `tools/wiki/cli.ts` and replace the three-case TODO block. The full `main` function after this change:

```ts
async function main(): Promise<number> {
  const [subcommand] = process.argv.slice(2);
  switch (subcommand) {
    case 'lint': {
      const { runLint } = await import('./lint.ts');
      return runLint();
    }
    case 'links':
    case 'ingest':
      process.stderr.write(`TODO: ${subcommand} not yet implemented\n`);
      return EXIT.IO_ERROR;
    case '-h':
    case '--help':
    case undefined:
      help();
      return EXIT.OK;
    default:
      process.stderr.write(`unknown subcommand: ${subcommand}\n`);
      help();
      return EXIT.IO_ERROR;
  }
}
```

- [ ] **Step 3.5: Run lint unit tests**

Run: `bun test tools/wiki/__tests__/lint.test.ts`
Expected: 5 pass.

- [ ] **Step 3.6: Smoke test against real `docs/**` (may surface issues to fix in Task 6)**

Run: `bun run wiki:lint` (in the worktree root).
Expected outcomes:
- If 0 errors: great, proceed.
- If errors: **record the failures** (save stderr to `/tmp/wiki-lint-task3.log`) and continue. Do NOT fix docs yet — Task 6 handles that once all three CLIs are in place.

Command to capture: `bun run wiki:lint 2> /tmp/wiki-lint-task3.log; echo exit=$?`

- [ ] **Step 3.7: Commit**

```bash
git add tools/wiki/lint.ts tools/wiki/cli.ts tools/wiki/__tests__/lint.test.ts
git commit -m "feat(#231): wiki:lint implementation + CLI wire"
```

---

## Task 4: `wiki:links` command + CLI wire + code-fence regression

**Files:**
- Create: `tools/wiki/links.ts`
- Create: `tools/wiki/__tests__/links.test.ts`
- Modify: `tools/wiki/cli.ts`

- [ ] **Step 4.1: Write failing tests for `links`**

Create `tools/wiki/__tests__/links.test.ts`:

```ts
import { test, expect } from 'bun:test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { checkLinks } from '../links.ts';

async function setup(files: Record<string, string>): Promise<string> {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'wiki-links-'));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(tmp, rel);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, content);
  }
  return tmp;
}

test('checkLinks reports broken body link and ignores code-fenced paths', async () => {
  const tmp = await setup({
    'docs/wiki/wiki/foo.md': `---
title: Foo
owner: llm
status: draft
updated: 2026-04-17
tags:
  - harness
---

# Foo

[broken](docs/nope.md)

\`\`\`
[ignored](docs/also-nope.md)
\`\`\`
`,
  });
  try {
    const r = await checkLinks({ cwd: tmp, globs: ['docs/wiki/wiki/**/*.md'] });
    const targets = r.broken.map(b => b.message);
    expect(targets).toContain('docs/nope.md');
    expect(targets).not.toContain('docs/also-nope.md');
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('checkLinks resolves relative paths against file location', async () => {
  const tmp = await setup({
    'docs/wiki/schema/README.md': `---
title: Schema README
owner: human
status: approved
updated: 2026-04-17
tags:
  - harness
---

# Schema README

[tags](./tags.md)
`,
    'docs/wiki/schema/tags.md': `---
title: Tags
owner: human
status: approved
updated: 2026-04-17
tags:
  - harness
---

# Tags
`,
  });
  try {
    const r = await checkLinks({ cwd: tmp, globs: ['docs/wiki/schema/**/*.md'] });
    expect(r.broken).toEqual([]);
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('checkLinks ignores external URLs and anchors', async () => {
  const tmp = await setup({
    'docs/wiki/wiki/foo.md': `---
title: Foo
owner: llm
status: draft
updated: 2026-04-17
tags:
  - harness
---

# Foo

[web](https://example.com/nope)
[anchor](#section)
[mail](mailto:x@y.z)
`,
  });
  try {
    const r = await checkLinks({ cwd: tmp, globs: ['docs/wiki/wiki/**/*.md'] });
    expect(r.broken).toEqual([]);
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('checkLinks builds backlink reverse index from related', async () => {
  const tmp = await setup({
    'docs/wiki/wiki/a.md': `---
title: A
owner: llm
status: draft
updated: 2026-04-17
tags:
  - harness
related:
  - docs/wiki/wiki/target.md
---

# A
`,
    'docs/wiki/wiki/target.md': `---
title: T
owner: llm
status: draft
updated: 2026-04-17
tags:
  - harness
---

# T
`,
  });
  try {
    const r = await checkLinks({ cwd: tmp, globs: ['docs/wiki/wiki/**/*.md'] });
    const sources = r.backlinks.get('docs/wiki/wiki/target.md');
    expect(sources).toBeTruthy();
    expect(Array.from(sources!)).toContain('docs/wiki/wiki/a.md');
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});
```

- [ ] **Step 4.2: Run tests to verify they fail**

Run: `bun test tools/wiki/__tests__/links.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 4.3: Implement `links.ts`**

Create `tools/wiki/links.ts`:

```ts
import path from 'node:path';
import { Glob } from 'bun';
import { parseFrontmatter } from './lib/frontmatter.ts';
import { extractBodyLinks } from './lib/markdown.ts';
import { readText, exists, findRepoRoot, toRepoRelative } from './lib/fs.ts';
import type { Issue } from './lib/report.ts';
import { LINT_GLOBS, EXIT } from './lib/config.ts';

export interface LinksResult {
  broken: Issue[];
  backlinks: Map<string, Set<string>>;
  filesChecked: number;
}

export async function checkLinks(
  opts: { cwd?: string; globs?: string[] } = {},
): Promise<LinksResult> {
  const cwd = opts.cwd ?? (await findRepoRoot());
  const globs = opts.globs ?? LINT_GLOBS;
  const files = new Set<string>();
  for (const pattern of globs) {
    const glob = new Glob(pattern);
    for await (const rel of glob.scan({ cwd, onlyFiles: true })) {
      files.add(path.join(cwd, rel));
    }
  }

  const broken: Issue[] = [];
  const backlinks = new Map<string, Set<string>>();

  for (const abs of files) {
    const rel = toRepoRelative(cwd, abs);
    const content = await readText(abs);
    const parsed = parseFrontmatter(content);
    const body = parsed.hasBlock ? parsed.body : content;
    const bodyStart = parsed.hasBlock ? parsed.bodyStartLine : 1;

    const bodyLinks = extractBodyLinks(body, bodyStart);
    for (const link of bodyLinks) {
      if (/^[a-z]+:\/\//i.test(link.target)) continue;
      if (link.target.startsWith('#')) continue;
      if (link.target.startsWith('mailto:')) continue;
      const [targetPath] = link.target.split('#');
      if (!targetPath) continue;
      const fileDir = path.dirname(abs);
      const resolved = path.isAbsolute(targetPath)
        ? targetPath
        : path.resolve(fileDir, targetPath);
      if (!(await exists(resolved))) {
        broken.push({
          file: rel,
          line: link.line,
          code: 'BROKEN_LINK',
          message: link.target,
          severity: 'error',
        });
      }
    }

    const related = parsed.data.related;
    if (Array.isArray(related)) {
      for (const r of related) {
        if (typeof r !== 'string') continue;
        if (!backlinks.has(r)) backlinks.set(r, new Set());
        backlinks.get(r)!.add(rel);
      }
    }
  }

  return { broken, backlinks, filesChecked: files.size };
}

export async function runLinks(): Promise<number> {
  const result = await checkLinks();
  for (const issue of result.broken) {
    process.stderr.write(`${issue.file}:${issue.line} ${issue.code} ${issue.message}\n`);
  }
  if (result.backlinks.size > 0) {
    process.stdout.write('\nBacklinks (related: reverse index):\n');
    const sorted = Array.from(result.backlinks.keys()).sort();
    for (const target of sorted) {
      process.stdout.write(`${target}\n`);
      const sources = Array.from(result.backlinks.get(target)!).sort();
      for (const src of sources) process.stdout.write(`  ← ${src}\n`);
    }
  }
  process.stdout.write(`\n${result.broken.length} broken links across ${result.filesChecked} files\n`);
  return result.broken.length > 0 ? EXIT.VALIDATION_ERROR : EXIT.OK;
}
```

- [ ] **Step 4.4: Wire `links` into `cli.ts`**

In `tools/wiki/cli.ts`, replace the `'links'` case:

```ts
    case 'links': {
      const { runLinks } = await import('./links.ts');
      return runLinks();
    }
```

So the switch now only has `'ingest'` as TODO.

- [ ] **Step 4.5: Run links tests**

Run: `bun test tools/wiki/__tests__/links.test.ts`
Expected: 4 pass.

- [ ] **Step 4.6: Smoke test `bun run wiki:links`**

Run: `bun run wiki:links 2> /tmp/wiki-links-task4.log; echo exit=$?`
Expected: either exit 0 with a backlinks table, or exit 1 with broken-link entries logged (to be fixed in Task 6).

- [ ] **Step 4.7: Commit**

```bash
git add tools/wiki/links.ts tools/wiki/cli.ts tools/wiki/__tests__/links.test.ts
git commit -m "feat(#231): wiki:links implementation + code-fence regression"
```

---

## Task 5: `wiki:ingest` command + CLI wire + tmpdir tests

**Files:**
- Create: `tools/wiki/ingest.ts`
- Create: `tools/wiki/__tests__/ingest.test.ts`
- Modify: `tools/wiki/cli.ts`

- [ ] **Step 5.1: Write failing tests for `ingest`**

Create `tools/wiki/__tests__/ingest.test.ts`:

```ts
import { test, expect } from 'bun:test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { ingest, makeSlug, insertIndexEntry } from '../ingest.ts';

async function mktmp(prefix = 'wiki-ingest-'): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

test('makeSlug basic ascii', () => {
  expect(makeSlug('Test Foo')).toBe('test-foo');
  expect(makeSlug('  Many   Spaces  ')).toBe('many-spaces');
  expect(makeSlug('Foo — Bar!')).toBe('foo-bar');
});

test('makeSlug preserves Korean characters', () => {
  expect(makeSlug('한글 제목')).toBe('한글-제목');
});

test('insertIndexEntry inserts alphabetically within existing section', () => {
  const content = `# Index\n\n## Harness\n\n- [harness/bravo.md](harness/bravo.md) — B\n- [harness/delta.md](harness/delta.md) — D\n`;
  const next = insertIndexEntry(content, 'harness', 'charlie', 'C');
  const lines = next.split('\n');
  const bIdx = lines.findIndex(l => l.includes('bravo'));
  const cIdx = lines.findIndex(l => l.includes('charlie'));
  const dIdx = lines.findIndex(l => l.includes('delta'));
  expect(bIdx).toBeLessThan(cIdx);
  expect(cIdx).toBeLessThan(dIdx);
});

test('insertIndexEntry creates section when topic section is missing', () => {
  const content = `# Index\n\n## Harness\n\n- [harness/existing.md](harness/existing.md) — Existing\n`;
  const next = insertIndexEntry(content, 'ops', 'new-op', 'New Op');
  expect(next).toContain('## Ops');
  expect(next).toContain('[ops/new-op.md](ops/new-op.md) — New Op');
});

test('ingest creates note and updates INDEX in tmpdir', async () => {
  const tmp = await mktmp();
  try {
    const wikiDir = path.join(tmp, 'docs/wiki/wiki');
    await fs.mkdir(wikiDir, { recursive: true });
    const indexPath = path.join(wikiDir, 'INDEX.md');
    await fs.writeFile(
      indexPath,
      '# Index\n\n## Harness\n\n- [harness/existing.md](harness/existing.md) — Existing\n',
    );

    const r = await ingest('harness', 'Test Foo', {
      cwd: tmp,
      indexPath,
      today: '2026-04-17',
    });
    expect(r.created).toBe('docs/wiki/wiki/harness/test-foo.md');

    const created = await fs.readFile(path.join(tmp, r.created), 'utf8');
    expect(created).toContain('title: Test Foo');
    expect(created).toContain('# Test Foo');
    expect(created).toContain('owner: llm');
    expect(created).toContain('- harness');
    expect(created).toContain('- llm-write');
    expect(created).toContain('updated: 2026-04-17');

    const indexAfter = await fs.readFile(indexPath, 'utf8');
    expect(indexAfter).toContain('[harness/test-foo.md](harness/test-foo.md)');
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('ingest rejects invalid topic', async () => {
  await expect(ingest('nope', 'Foo', { cwd: '/tmp/nonexistent-xyz' })).rejects.toThrow(/INVALID_TOPIC/);
});

test('ingest rejects empty title', async () => {
  await expect(ingest('harness', '   ', { cwd: '/tmp/nonexistent-xyz' })).rejects.toThrow(/EMPTY_TITLE/);
});

test('ingest rejects duplicate file', async () => {
  const tmp = await mktmp();
  try {
    const filePath = path.join(tmp, 'docs/wiki/wiki/harness/dup.md');
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, 'existing');
    const indexPath = path.join(tmp, 'docs/wiki/wiki/INDEX.md');
    await fs.writeFile(indexPath, '# Index\n\n## Harness\n');
    await expect(ingest('harness', 'Dup', { cwd: tmp, indexPath })).rejects.toThrow(/FILE_EXISTS/);
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});
```

- [ ] **Step 5.2: Run tests to verify they fail**

Run: `bun test tools/wiki/__tests__/ingest.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 5.3: Implement `ingest.ts`**

Create `tools/wiki/ingest.ts`:

```ts
import path from 'node:path';
import fs from 'node:fs/promises';
import { readText, exists, findRepoRoot } from './lib/fs.ts';
import {
  INGEST_TOPICS,
  INGEST_SECTION_HEADERS,
  INDEX_PATH,
  type IngestTopic,
} from './lib/config.ts';

export interface IngestOptions {
  cwd?: string;
  indexPath?: string;
  today?: string;
}

export interface IngestResult {
  created: string;
  updatedIndex: string;
}

export async function ingest(
  topic: string,
  title: string,
  opts: IngestOptions = {},
): Promise<IngestResult> {
  if (!(INGEST_TOPICS as readonly string[]).includes(topic)) {
    throw new Error(`INVALID_TOPIC: ${topic} (allowed: ${INGEST_TOPICS.join('|')})`);
  }
  if (!title || title.trim().length === 0) {
    throw new Error('EMPTY_TITLE');
  }
  const topicKey = topic as IngestTopic;
  const cwd = opts.cwd ?? (await findRepoRoot());
  const indexPath = opts.indexPath ?? path.join(cwd, INDEX_PATH);
  const today = opts.today ?? new Date().toISOString().slice(0, 10);
  const slug = makeSlug(title);
  if (!slug) throw new Error('EMPTY_SLUG');
  const relPath = `docs/wiki/wiki/${topicKey}/${slug}.md`;
  const absPath = path.join(cwd, relPath);
  if (await exists(absPath)) {
    throw new Error(`FILE_EXISTS: ${relPath}`);
  }
  const body = skeleton(title.trim(), topicKey, today);
  await fs.mkdir(path.dirname(absPath), { recursive: true });
  await fs.writeFile(absPath, body, 'utf8');

  const indexBefore = await readText(indexPath);
  const indexAfter = insertIndexEntry(indexBefore, topicKey, slug, title.trim());
  await fs.writeFile(indexPath, indexAfter, 'utf8');

  return {
    created: relPath,
    updatedIndex: path.relative(cwd, indexPath).split(path.sep).join('/'),
  };
}

export function makeSlug(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function skeleton(title: string, topic: IngestTopic, today: string): string {
  return `---
title: ${title}
owner: llm
status: draft
updated: ${today}
tags:
  - ${topic}
  - llm-write
related:
  - docs/wiki/wiki/INDEX.md
---

# ${title}

## Purpose

TODO — 이 노트가 해결하려는 질문 한 줄.

## Recent changes

- ${today}: 초기 스켈레톤 생성 (wiki:ingest)
`;
}

export function insertIndexEntry(
  content: string,
  topic: IngestTopic,
  slug: string,
  title: string,
): string {
  const header = INGEST_SECTION_HEADERS[topic];
  const entry = `- [${topic}/${slug}.md](${topic}/${slug}.md) — ${title}`;
  const lines = content.split('\n');
  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === header) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) {
    const trimmed = content.replace(/\n+$/, '');
    return `${trimmed}\n\n${header}\n\n${entry}\n`;
  }
  let sectionEnd = lines.length;
  for (let i = headerIdx + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i])) {
      sectionEnd = i;
      break;
    }
  }
  const existing: Array<{ lineIdx: number; target: string }> = [];
  for (let i = headerIdx + 1; i < sectionEnd; i++) {
    const m = lines[i].match(/^-\s+\[[^\]]+\]\(([^)]+)\)/);
    if (m) existing.push({ lineIdx: i, target: m[1] });
  }
  const newTarget = `${topic}/${slug}.md`;
  if (existing.some(e => e.target === newTarget)) return content;

  let insertAt: number;
  if (existing.length === 0) {
    insertAt = headerIdx + 1;
    if (insertAt < sectionEnd && lines[insertAt].trim() === '') insertAt++;
  } else {
    insertAt = sectionEnd;
    for (const e of existing) {
      if (e.target > newTarget) {
        insertAt = e.lineIdx;
        break;
      }
    }
  }
  lines.splice(insertAt, 0, entry);
  return lines.join('\n');
}
```

- [ ] **Step 5.4: Wire `ingest` into `cli.ts`**

In `tools/wiki/cli.ts`, replace the `'ingest'` case (remove the remaining TODO):

```ts
    case 'ingest': {
      const { ingest } = await import('./ingest.ts');
      const [topic, ...titleParts] = process.argv.slice(3);
      const title = titleParts.join(' ');
      if (!topic || !title) {
        process.stderr.write('Usage: wiki:ingest <topic> <title>\n');
        return EXIT.IO_ERROR;
      }
      try {
        const result = await ingest(topic, title);
        process.stdout.write(`created ${result.created}\nupdated ${result.updatedIndex}\n`);
        return EXIT.OK;
      } catch (e) {
        process.stderr.write(`${(e as Error).message}\n`);
        return EXIT.IO_ERROR;
      }
    }
```

- [ ] **Step 5.5: Run ingest tests**

Run: `bun test tools/wiki/__tests__/ingest.test.ts`
Expected: 8 pass.

- [ ] **Step 5.6: Run full test suite**

Run: `bun test tools/wiki/`
Expected: all pass (fs + report + schema + frontmatter + markdown + lint + links + ingest).

- [ ] **Step 5.7: Commit**

```bash
git add tools/wiki/ingest.ts tools/wiki/cli.ts tools/wiki/__tests__/ingest.test.ts
git commit -m "feat(#231): wiki:ingest implementation + CLI wire"
```

---

## Task 6: Pre-push hook + CI workflow + real-docs smoke + doc fixes

**Files:**
- Modify: `scripts/git-pre-push.sh`
- Create: `.github/workflows/wiki-lint.yml`
- Possibly modify: `docs/**/*.md` (fix any issues surfaced by `wiki:lint`)

- [ ] **Step 6.1: Run the real-docs lint and capture output**

Run: `bun run wiki:lint 2> /tmp/wiki-lint-final.log; echo exit=$?`

Expected outcomes:
- **Exit 0**: skip Step 6.2, continue to 6.3.
- **Exit 1**: proceed to Step 6.2 to fix issues.

If exit 2 (I/O/config error), investigate: missing `docs/wiki/schema/tags.md`, missing INDEX, or glob mismatch.

- [ ] **Step 6.2: Fix failing docs (only if 6.1 exit ≠ 0)**

For each error reported in `/tmp/wiki-lint-final.log`:

| Code | Typical fix |
|------|-------------|
| `MISSING_FRONTMATTER` | Add a frontmatter block per `docs/wiki/schema/frontmatter.md` (title/owner/status/updated/tags). |
| `MISSING_FIELD <name>` | Add the missing field. |
| `H1_TITLE_MISMATCH` | Align H1 text or `title:` so they match. |
| `BROKEN_RELATED <path>` | Correct the path or remove from `related:`. |
| `UNKNOWN_TAG "<tag>"` | Replace with a tag from `docs/wiki/schema/tags.md`, or add the tag to tags.md in a separate vocab PR. |
| `INVALID_UPDATED` | Reformat to `YYYY-MM-DD` or correct a future date. |

Make edits in focused commits by domain:

```bash
# after editing each file, restage + commit
git add <fixed-files>
git commit -m "docs(#231): fix wiki lint — <short reason>"
```

Rerun `bun run wiki:lint` after each commit until it exits 0.

If a failing file is intentionally **outside** the wiki-lint contract (e.g., a draft placeholder), prefer adding minimal valid frontmatter over excluding it — we can refine globs later via a follow-up issue. Do not add exclusion patterns in this PR.

- [ ] **Step 6.3: Add `wiki:lint` to `scripts/git-pre-push.sh`**

Open `scripts/git-pre-push.sh`. After the existing `api-server 로컬 CI` block and before `echo "=== [monorepo] 모든 체크 통과 ==="`, insert:

```bash
if [[ -n "${SKIP_WIKI_CI:-}" ]]; then
  echo "=== [monorepo] wiki lint 건너뜀 (SKIP_WIKI_CI) ==="
else
  echo "=== [monorepo] wiki lint ==="
  bun run wiki:lint
fi
```

- [ ] **Step 6.4: Smoke test pre-push hook locally**

Run: `bun run ci:local`
Expected: script runs web CI + api-server CI + wiki lint; final line is `=== [monorepo] 모든 체크 통과 ===`.

If wiki lint fails here but passed in Step 6.1, it's usually a cwd difference — ensure the hook runs with `cd "$REPO_ROOT"` (it already does at the top of the script).

- [ ] **Step 6.5: Create `.github/workflows/wiki-lint.yml`**

```yaml
name: wiki-lint

on:
  pull_request:
    paths:
      - 'docs/**'
      - 'tools/wiki/**'
      - 'package.json'
      - 'bun.lock'
      - '.github/workflows/wiki-lint.yml'
  push:
    branches: [dev, main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version-file: package.json
      - name: Install deps
        run: bun install --frozen-lockfile
      - name: Wiki lint
        run: bun run wiki:lint
      - name: Wiki unit tests
        run: bun test tools/wiki/
```

- [ ] **Step 6.6: Sanity check YAML and file references**

Run: `cat .github/workflows/wiki-lint.yml | head -30`
Run: `ls .github/workflows/ | grep wiki-lint.yml`
Expected: file present.

Optional: if `yamllint` is available, `yamllint .github/workflows/wiki-lint.yml`. Otherwise skip.

- [ ] **Step 6.7: Final smoke — `bun test` + `bun run wiki:lint` + `bun run wiki:links`**

Run in sequence:

```bash
bun test tools/wiki/
bun run wiki:lint
bun run wiki:links
```

Expected:
- All unit tests pass.
- `wiki:lint` exit 0.
- `wiki:links` exit 0 or 1 (1 is acceptable if real docs still have broken body links — those can be a follow-up issue, but prefer exit 0 for this PR if within one commit's worth of fixes).

If `wiki:links` exits 1 with only a small number of broken links, fix them in this PR with `docs(#231): fix broken wiki links` commits. If the count is large or cross-cutting, file a follow-up issue before finishing.

- [ ] **Step 6.8: Commit integration + any remaining doc fixes**

```bash
git add scripts/git-pre-push.sh .github/workflows/wiki-lint.yml
git commit -m "ci(#231): wire wiki:lint into pre-push + GitHub Actions"
```

If any doc fixes were committed in Step 6.2, they're already in the branch.

- [ ] **Step 6.9: Update PR #233 description checklist (manual)**

Open `gh pr view 233 --web` (or edit via `gh pr edit 233 --body-file -`). Check off the boxes in the "Test Plan" section that are now satisfied:
- [x] `wiki:lint` 유닛 테스트 (fixture 기반)
- [x] 기존 `docs/wiki/**`·`docs/agent/*-summary.md` 파일에서 lint 0 error
- [x] `wiki:links`로 Phase 1 "점검 A1-4" 오탐 제거 확인
- [x] `scripts/git-pre-push.sh`에 `wiki:lint` 추가 및 실 push 검증
- [x] CI(GitHub Actions)에 lint 단계 등록

---

## Self-Review Notes

**Spec coverage:**
- §4.1 directory layout → Task 1 (scaffold) + Tasks 2-5 per-command files. ✓
- §4.2 package.json scripts → Task 1 step 1.11. ✓
- §5 lint rules (11 codes) → Task 2 (frontmatter validator) + Task 3 (H1/title + related existence). ✓
- §6 links parsing → Task 2 markdown library + Task 4 broken-link/backlink. ✓
- §7 ingest → Task 5. ✓
- §8.1 pre-push → Task 6 step 6.3. ✓
- §8.2 new `wiki-lint.yml` workflow → Task 6 step 6.5. ✓
- §9 fixture-based tests → Task 2 fixtures + every `*.test.ts`. ✓
- §11 O1 real-docs smoke → Task 6 steps 6.1-6.2 + 6.7. ✓
- §11 O2 code-fence regression → Task 2 step 2.10 (`markdown.test.ts`) + Task 4 links integration test. ✓
- §11 O3 ingest roundtrip → Task 5 step 5.5 plus post-`wiki:lint` check is covered indirectly by Task 6 real-docs lint (ingest artifacts not committed — test uses tmpdir). Consider adding a post-Task-6 manual smoke if desired. ✓
- §11 O4 pre-push timing → Task 6 step 6.4 exercises the hook; timing under 2s should hold given file count; no explicit timer but acceptable.

**Placeholder scan:**
- Task 6.2 has a conditional fix list; every row names a concrete code and action. ✓
- Task 6.7 mentions "follow-up issue" only as a last resort — not a placeholder in the primary path.
- No TBD/TODO left in plan instructions.

**Type consistency:**
- `Issue` interface in `lib/report.ts` is imported by `frontmatter.ts`, `lint.ts`, `links.ts`. ✓
- `IngestTopic` in `lib/config.ts` is consumed by `ingest.ts` + `INGEST_SECTION_HEADERS`. ✓
- `insertIndexEntry` signature is `(content, topic, slug, title)` consistently in Task 5 tests and implementation. ✓
- `checkLinks` returns `{ broken, backlinks, filesChecked }` in both the tests and implementation. ✓

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-17-sub3-wiki-cli.md`. Two execution options:

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
