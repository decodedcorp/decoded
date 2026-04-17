import { test, expect } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { lint } from "../lint.ts";

const TAGS_MD = `| \`harness\`   | X |
| \`agent\`     | X |
| \`llm-write\` | X |
`;

async function setup(files: Record<string, string>): Promise<string> {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "wiki-lint-"));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(tmp, rel);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, content);
  }
  return tmp;
}

function validFm(body = "# Foo\n") {
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

test("lint passes valid file", async () => {
  const tmp = await setup({
    "docs/wiki/schema/tags.md": TAGS_MD,
    "docs/wiki/wiki/foo.md": validFm(),
  });
  try {
    const r = await lint({
      cwd: tmp,
      tagsPath: path.join(tmp, "docs/wiki/schema/tags.md"),
      globs: ["docs/wiki/wiki/**/*.md"],
    });
    expect(r.issues.filter((i) => i.severity === "error")).toEqual([]);
    expect(r.filesChecked).toBe(1);
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test("lint detects H1/title mismatch", async () => {
  const tmp = await setup({
    "docs/wiki/schema/tags.md": TAGS_MD,
    "docs/wiki/wiki/foo.md": validFm("# Bar\n"),
  });
  try {
    const r = await lint({
      cwd: tmp,
      tagsPath: path.join(tmp, "docs/wiki/schema/tags.md"),
      globs: ["docs/wiki/wiki/**/*.md"],
    });
    expect(r.issues.some((i) => i.code === "H1_TITLE_MISMATCH")).toBe(true);
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test("lint detects MISSING_H1", async () => {
  const tmp = await setup({
    "docs/wiki/schema/tags.md": TAGS_MD,
    "docs/wiki/wiki/foo.md": validFm("body without heading\n"),
  });
  try {
    const r = await lint({
      cwd: tmp,
      tagsPath: path.join(tmp, "docs/wiki/schema/tags.md"),
      globs: ["docs/wiki/wiki/**/*.md"],
    });
    expect(r.issues.some((i) => i.code === "MISSING_H1")).toBe(true);
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test("lint detects BROKEN_RELATED", async () => {
  const tmp = await setup({
    "docs/wiki/schema/tags.md": TAGS_MD,
    "docs/wiki/wiki/foo.md": `---
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
      tagsPath: path.join(tmp, "docs/wiki/schema/tags.md"),
      globs: ["docs/wiki/wiki/**/*.md"],
    });
    const issue = r.issues.find((i) => i.code === "BROKEN_RELATED");
    expect(issue).toBeTruthy();
    expect(issue!.message).toBe("docs/nope.md");
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test("lint flags files without frontmatter as MISSING_FRONTMATTER", async () => {
  const tmp = await setup({
    "docs/wiki/schema/tags.md": TAGS_MD,
    "docs/wiki/wiki/foo.md": "# Foo\n\nno frontmatter",
  });
  try {
    const r = await lint({
      cwd: tmp,
      tagsPath: path.join(tmp, "docs/wiki/schema/tags.md"),
      globs: ["docs/wiki/wiki/**/*.md"],
    });
    expect(r.issues.some((i) => i.code === "MISSING_FRONTMATTER")).toBe(true);
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});
