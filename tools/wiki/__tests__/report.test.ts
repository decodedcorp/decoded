import { test, expect } from "bun:test";
import { formatIssue, summarize } from "../lib/report.ts";

test("formatIssue produces path:line CODE message", () => {
  expect(
    formatIssue({
      file: "docs/wiki/wiki/INDEX.md",
      line: 3,
      code: "MISSING_FIELD",
      message: "tags",
      severity: "error",
    }),
  ).toBe("docs/wiki/wiki/INDEX.md:3 MISSING_FIELD tags");
});

test("summarize reports error/warning counts", () => {
  const out = summarize(
    [
      { file: "a.md", line: 1, code: "X", message: "", severity: "error" },
      { file: "b.md", line: 1, code: "Y", message: "", severity: "warning" },
    ],
    2,
    420,
  );
  expect(out).toContain("1 errors");
  expect(out).toContain("1 warnings");
  expect(out).toContain("2 files");
  expect(out).toContain("0.42s");
});
