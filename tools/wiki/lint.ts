import path from "node:path";
import { Glob } from "bun";
import { parseFrontmatter, validateFrontmatter } from "./lib/frontmatter.ts";
import { loadTagVocabulary } from "./lib/schema.ts";
import { extractH1 } from "./lib/markdown.ts";
import { readText, exists, findRepoRoot, toRepoRelative } from "./lib/fs.ts";
import type { Issue } from "./lib/report.ts";
import { formatIssue, summarize } from "./lib/report.ts";
import { LINT_GLOBS, TAG_VOCAB_PATH, EXIT } from "./lib/config.ts";

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
          code: "MISSING_H1",
          message: "",
          severity: "error",
        });
      } else {
        const title = parsed.data.title;
        if (typeof title === "string" && h1.text !== title.trim()) {
          issues.push({
            file: rel,
            line: h1.line,
            code: "H1_TITLE_MISMATCH",
            message: `H1 "${h1.text}" vs title "${title}"`,
            severity: "error",
          });
        }
      }

      const related = parsed.data.related;
      if (Array.isArray(related)) {
        for (const r of related) {
          if (typeof r !== "string") continue;
          const target = path.join(cwd, r);
          if (!(await exists(target))) {
            issues.push({
              file: rel,
              line: parsed.fieldLines.get("related") ?? 1,
              code: "BROKEN_RELATED",
              message: r,
              severity: "error",
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
    const stream = issue.severity === "error" ? process.stderr : process.stdout;
    stream.write(formatIssue(issue) + "\n");
  }
  process.stdout.write(
    summarize(result.issues, result.filesChecked, result.elapsedMs) + "\n",
  );
  return result.issues.some((i) => i.severity === "error")
    ? EXIT.VALIDATION_ERROR
    : EXIT.OK;
}
