import { test, expect } from "bun:test";
import { extractH1, extractBodyLinks } from "../lib/markdown.ts";

test("extractH1 finds first H1 with correct line number", () => {
  const body = "Intro\n\n# Hello\n\nmore text";
  const h1 = extractH1(body, 10);
  expect(h1).not.toBeNull();
  expect(h1!.text).toBe("Hello");
  expect(h1!.line).toBe(12);
});

test("extractH1 returns null when no H1", () => {
  expect(extractH1("no heading here", 1)).toBeNull();
});

test("extractBodyLinks skips code fence content (A1-A4 regression)", () => {
  const body =
    "\nText [ok](docs/ok.md) outside.\n\n```bash\n[should-skip](docs/nope.md)\n```\n\n[ok2](docs/ok2.md)\n";
  const targets = extractBodyLinks(body, 1).map((l) => l.target);
  expect(targets).toContain("docs/ok.md");
  expect(targets).toContain("docs/ok2.md");
  expect(targets).not.toContain("docs/nope.md");
});

test("extractBodyLinks skips inline code", () => {
  const body =
    "Use `[not-a-link](fake.md)` inline, but [real](real.md) outside.";
  const targets = extractBodyLinks(body, 1).map((l) => l.target);
  expect(targets).toEqual(["real.md"]);
});

test("extractBodyLinks skips single-line HTML comment", () => {
  const body = "[a](x.md)\n<!-- [should-skip](nope.md) -->\n[b](y.md)";
  const targets = extractBodyLinks(body, 1).map((l) => l.target);
  expect(targets).toEqual(["x.md", "y.md"]);
});

test("extractBodyLinks skips multi-line HTML comment", () => {
  const body = "[a](x.md)\n<!--\n[should-skip](nope.md)\n-->\n[b](y.md)";
  const targets = extractBodyLinks(body, 1).map((l) => l.target);
  expect(targets).toEqual(["x.md", "y.md"]);
});

test("extractBodyLinks flags images with isImage=true", () => {
  const body = "![alt](pic.png)";
  const links = extractBodyLinks(body, 1);
  expect(links.length).toBe(1);
  expect(links[0].isImage).toBe(true);
});

test("extractBodyLinks handles link with title", () => {
  const body = '[a](x.md "Title here")';
  const targets = extractBodyLinks(body, 1).map((l) => l.target);
  expect(targets).toEqual(["x.md"]);
});

test("extractBodyLinks assigns correct body line numbers", () => {
  const body = "l0\nl1 [a](x.md)\nl2";
  const links = extractBodyLinks(body, 5);
  expect(links[0].line).toBe(6); // bodyStartLine=5 + index 1
});
