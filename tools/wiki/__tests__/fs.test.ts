import { test, expect } from "bun:test";
import { toRepoRelative } from "../lib/fs.ts";

test("toRepoRelative normalizes to forward slashes", () => {
  expect(toRepoRelative("/repo", "/repo/docs/agent/x.md")).toBe(
    "docs/agent/x.md",
  );
});

test("toRepoRelative handles identical paths", () => {
  expect(toRepoRelative("/repo", "/repo")).toBe("");
});
