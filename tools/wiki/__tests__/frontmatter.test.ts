import { test, expect } from "bun:test";
import { parseFrontmatter, validateFrontmatter } from "../lib/frontmatter.ts";

const validTags = new Set(["harness", "agent", "llm-write", "claude-code"]);

function build(fm: string, body = "# X\n"): string {
  return `---\n${fm}\n---\n\n${body}`;
}

test("MISSING_FRONTMATTER when no block", () => {
  const issues = validateFrontmatter(
    "f.md",
    parseFrontmatter("# Hi\n"),
    validTags,
  );
  expect(issues.some((i) => i.code === "MISSING_FRONTMATTER")).toBe(true);
});

test("MISSING_FIELD for each required field absent", () => {
  const c = build("title: X\nowner: llm");
  const issues = validateFrontmatter("f.md", parseFrontmatter(c), validTags);
  const missing = issues
    .filter((i) => i.code === "MISSING_FIELD")
    .map((i) => i.message)
    .sort();
  expect(missing).toEqual(["status", "tags", "updated"]);
});

test("INVALID_OWNER", () => {
  const c = build(
    "title: X\nowner: bot\nstatus: draft\nupdated: 2026-04-17\ntags:\n  - harness",
  );
  const issues = validateFrontmatter("f.md", parseFrontmatter(c), validTags);
  expect(issues.some((i) => i.code === "INVALID_OWNER")).toBe(true);
});

test("INVALID_STATUS", () => {
  const c = build(
    "title: X\nowner: llm\nstatus: whatever\nupdated: 2026-04-17\ntags:\n  - harness",
  );
  const issues = validateFrontmatter("f.md", parseFrontmatter(c), validTags);
  expect(issues.some((i) => i.code === "INVALID_STATUS")).toBe(true);
});

test("INVALID_UPDATED (bad format)", () => {
  const c = build(
    "title: X\nowner: llm\nstatus: draft\nupdated: 04/17/2026\ntags:\n  - harness",
  );
  const issues = validateFrontmatter("f.md", parseFrontmatter(c), validTags);
  expect(issues.some((i) => i.code === "INVALID_UPDATED")).toBe(true);
});

test("INVALID_UPDATED (future date)", () => {
  const c = build(
    "title: X\nowner: llm\nstatus: draft\nupdated: 2099-01-01\ntags:\n  - harness",
  );
  const issues = validateFrontmatter("f.md", parseFrontmatter(c), validTags);
  expect(issues.some((i) => i.code === "INVALID_UPDATED")).toBe(true);
});

test("EMPTY_TAGS", () => {
  const c = build(
    "title: X\nowner: llm\nstatus: draft\nupdated: 2026-04-17\ntags: []",
  );
  const issues = validateFrontmatter("f.md", parseFrontmatter(c), validTags);
  expect(issues.some((i) => i.code === "EMPTY_TAGS")).toBe(true);
});

test("UNKNOWN_TAG with did-you-mean suggestion", () => {
  const c = build(
    "title: X\nowner: llm\nstatus: draft\nupdated: 2026-04-17\ntags:\n  - claud-code",
  );
  const issues = validateFrontmatter("f.md", parseFrontmatter(c), validTags);
  const issue = issues.find((i) => i.code === "UNKNOWN_TAG");
  expect(issue).toBeTruthy();
  expect(issue!.message).toContain("claude-code");
});

test("TOO_MANY_RELATED is a warning", () => {
  const c = build(
    "title: X\nowner: llm\nstatus: draft\nupdated: 2026-04-17\ntags:\n  - harness\nrelated:\n  - a.md\n  - b.md\n  - c.md\n  - d.md\n  - e.md\n  - f.md",
  );
  const issues = validateFrontmatter("f.md", parseFrontmatter(c), validTags);
  const w = issues.find((i) => i.code === "TOO_MANY_RELATED");
  expect(w).toBeTruthy();
  expect(w!.severity).toBe("warning");
});

test("valid file produces zero error-severity issues", () => {
  const c = build(
    "title: Foo\nowner: llm\nstatus: draft\nupdated: 2026-04-17\ntags:\n  - harness",
    "# Foo\n",
  );
  const issues = validateFrontmatter("f.md", parseFrontmatter(c), validTags);
  expect(issues.filter((i) => i.severity === "error")).toEqual([]);
});
