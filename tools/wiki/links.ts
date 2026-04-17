import path from "node:path";
import { Glob } from "bun";
import { parseFrontmatter } from "./lib/frontmatter.ts";
import { extractBodyLinks } from "./lib/markdown.ts";
import { readText, exists, findRepoRoot, toRepoRelative } from "./lib/fs.ts";
import type { Issue } from "./lib/report.ts";
import { LINT_GLOBS, EXIT } from "./lib/config.ts";

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
      if (link.target.startsWith("#")) continue;
      if (link.target.startsWith("mailto:")) continue;
      const [targetPath] = link.target.split("#");
      if (!targetPath) continue;
      const fileDir = path.dirname(abs);
      const resolved = path.isAbsolute(targetPath)
        ? targetPath
        : path.resolve(fileDir, targetPath);
      if (!(await exists(resolved))) {
        broken.push({
          file: rel,
          line: link.line,
          code: "BROKEN_LINK",
          message: link.target,
          severity: "error",
        });
      }
    }

    const related = parsed.data.related;
    if (Array.isArray(related)) {
      for (const r of related) {
        if (typeof r !== "string") continue;
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
    process.stderr.write(
      `${issue.file}:${issue.line} ${issue.code} ${issue.message}\n`,
    );
  }
  if (result.backlinks.size > 0) {
    process.stdout.write("\nBacklinks (related: reverse index):\n");
    const sorted = Array.from(result.backlinks.keys()).sort();
    for (const target of sorted) {
      process.stdout.write(`${target}\n`);
      const sources = Array.from(result.backlinks.get(target)!).sort();
      for (const src of sources) process.stdout.write(`  ← ${src}\n`);
    }
  }
  process.stdout.write(
    `\n${result.broken.length} broken links across ${result.filesChecked} files\n`,
  );
  return result.broken.length > 0 ? EXIT.VALIDATION_ERROR : EXIT.OK;
}
