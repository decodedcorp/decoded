import { test, expect } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { checkLinks } from "../links.ts";

async function setup(files: Record<string, string>): Promise<string> {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "wiki-links-"));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(tmp, rel);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, content);
  }
  return tmp;
}

test("checkLinks reports broken body link and ignores code-fenced paths", async () => {
  const tmp = await setup({
    "docs/wiki/wiki/foo.md": `---
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
    const r = await checkLinks({ cwd: tmp, globs: ["docs/wiki/wiki/**/*.md"] });
    const targets = r.broken.map((b) => b.message);
    expect(targets).toContain("docs/nope.md");
    expect(targets).not.toContain("docs/also-nope.md");
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test("checkLinks resolves relative paths against file location", async () => {
  const tmp = await setup({
    "docs/wiki/schema/README.md": `---
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
    "docs/wiki/schema/tags.md": `---
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
    const r = await checkLinks({
      cwd: tmp,
      globs: ["docs/wiki/schema/**/*.md"],
    });
    expect(r.broken).toEqual([]);
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test("checkLinks ignores external URLs and anchors", async () => {
  const tmp = await setup({
    "docs/wiki/wiki/foo.md": `---
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
    const r = await checkLinks({ cwd: tmp, globs: ["docs/wiki/wiki/**/*.md"] });
    expect(r.broken).toEqual([]);
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test("checkLinks builds backlink reverse index from related", async () => {
  const tmp = await setup({
    "docs/wiki/wiki/a.md": `---
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
    "docs/wiki/wiki/target.md": `---
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
    const r = await checkLinks({ cwd: tmp, globs: ["docs/wiki/wiki/**/*.md"] });
    const sources = r.backlinks.get("docs/wiki/wiki/target.md");
    expect(sources).toBeTruthy();
    expect(Array.from(sources!)).toContain("docs/wiki/wiki/a.md");
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});
