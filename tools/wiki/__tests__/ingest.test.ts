import { test, expect } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { ingest, makeSlug, insertIndexEntry } from "../ingest.ts";

async function mktmp(prefix = "wiki-ingest-"): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

test("makeSlug basic ascii", () => {
  expect(makeSlug("Test Foo")).toBe("test-foo");
  expect(makeSlug("  Many   Spaces  ")).toBe("many-spaces");
  expect(makeSlug("Foo — Bar!")).toBe("foo-bar");
});

test("makeSlug preserves Korean characters", () => {
  expect(makeSlug("한글 제목")).toBe("한글-제목");
});

test("insertIndexEntry inserts alphabetically within existing section", () => {
  const content = `# Index\n\n## Harness\n\n- [harness/bravo.md](harness/bravo.md) — B\n- [harness/delta.md](harness/delta.md) — D\n`;
  const next = insertIndexEntry(content, "harness", "charlie", "C");
  const lines = next.split("\n");
  const bIdx = lines.findIndex((l) => l.includes("bravo"));
  const cIdx = lines.findIndex((l) => l.includes("charlie"));
  const dIdx = lines.findIndex((l) => l.includes("delta"));
  expect(bIdx).toBeLessThan(cIdx);
  expect(cIdx).toBeLessThan(dIdx);
});

test("insertIndexEntry creates section when topic section is missing", () => {
  const content = `# Index\n\n## Harness\n\n- [harness/existing.md](harness/existing.md) — Existing\n`;
  const next = insertIndexEntry(content, "ops", "new-op", "New Op");
  expect(next).toContain("## Ops");
  expect(next).toContain("[ops/new-op.md](ops/new-op.md) — New Op");
});

test("ingest creates note and updates INDEX in tmpdir", async () => {
  const tmp = await mktmp();
  try {
    const wikiDir = path.join(tmp, "docs/wiki/wiki");
    await fs.mkdir(wikiDir, { recursive: true });
    const indexPath = path.join(wikiDir, "INDEX.md");
    await fs.writeFile(
      indexPath,
      "# Index\n\n## Harness\n\n- [harness/existing.md](harness/existing.md) — Existing\n",
    );

    const r = await ingest("harness", "Test Foo", {
      cwd: tmp,
      indexPath,
      today: "2026-04-17",
    });
    expect(r.created).toBe("docs/wiki/wiki/harness/test-foo.md");

    const created = await fs.readFile(path.join(tmp, r.created), "utf8");
    expect(created).toContain("title: Test Foo");
    expect(created).toContain("# Test Foo");
    expect(created).toContain("owner: llm");
    expect(created).toContain("- harness");
    expect(created).toContain("- llm-write");
    expect(created).toContain("updated: 2026-04-17");

    const indexAfter = await fs.readFile(indexPath, "utf8");
    expect(indexAfter).toContain("[harness/test-foo.md](harness/test-foo.md)");
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test("ingest rejects invalid topic", async () => {
  await expect(
    ingest("nope", "Foo", { cwd: "/tmp/nonexistent-xyz" }),
  ).rejects.toThrow(/INVALID_TOPIC/);
});

test("ingest rejects empty title", async () => {
  await expect(
    ingest("harness", "   ", { cwd: "/tmp/nonexistent-xyz" }),
  ).rejects.toThrow(/EMPTY_TITLE/);
});

test("ingest rejects duplicate file", async () => {
  const tmp = await mktmp();
  try {
    const filePath = path.join(tmp, "docs/wiki/wiki/harness/dup.md");
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, "existing");
    const indexPath = path.join(tmp, "docs/wiki/wiki/INDEX.md");
    await fs.writeFile(indexPath, "# Index\n\n## Harness\n");
    await expect(
      ingest("harness", "Dup", { cwd: tmp, indexPath }),
    ).rejects.toThrow(/FILE_EXISTS/);
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});
