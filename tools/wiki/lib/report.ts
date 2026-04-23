export type Severity = "error" | "warning";

export interface Issue {
  file: string;
  line: number;
  code: string;
  message: string;
  severity: Severity;
}

export function formatIssue(issue: Issue): string {
  const msg = issue.message ? ` ${issue.message}` : "";
  return `${issue.file}:${issue.line} ${issue.code}${msg}`;
}

export function summarize(
  issues: Issue[],
  filesChecked: number,
  elapsedMs: number,
): string {
  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;
  const mark = errors ? "✖" : "✓";
  return `\n${mark} ${errors} errors, ${warnings} warnings across ${filesChecked} files (checked in ${(elapsedMs / 1000).toFixed(2)}s)`;
}
