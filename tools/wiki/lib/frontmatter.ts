import matter from "gray-matter";
import type { Issue } from "./report.ts";
import {
  VALID_OWNERS,
  VALID_STATUS,
  RELATED_WARNING_THRESHOLD,
} from "./config.ts";

export interface ParsedFrontmatter {
  hasBlock: boolean;
  data: Record<string, unknown>;
  body: string;
  bodyStartLine: number;
  fieldLines: Map<string, number>;
}

const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function parseFrontmatter(content: string): ParsedFrontmatter {
  const m = content.match(FM_RE);
  if (!m) {
    return {
      hasBlock: false,
      data: {},
      body: content,
      bodyStartLine: 1,
      fieldLines: new Map(),
    };
  }
  const parsed = matter(content);
  const fmBlock = m[1];
  const fieldLines = new Map<string, number>();
  const lines = fmBlock.split("\n");
  lines.forEach((l, i) => {
    const fieldMatch = l.match(/^([A-Za-z_][\w-]*)\s*:/);
    if (fieldMatch) fieldLines.set(fieldMatch[1], i + 2);
  });
  const bodyStartLine = lines.length + 3;
  return {
    hasBlock: true,
    data: parsed.data,
    body: parsed.content,
    bodyStartLine,
    fieldLines,
  };
}

export function validateFrontmatter(
  file: string,
  parsed: ParsedFrontmatter,
  validTags: Set<string>,
): Issue[] {
  const issues: Issue[] = [];
  if (!parsed.hasBlock) {
    issues.push({
      file,
      line: 1,
      code: "MISSING_FRONTMATTER",
      message: "",
      severity: "error",
    });
    return issues;
  }

  const required = ["title", "owner", "status", "updated", "tags"] as const;
  for (const field of required) {
    if (parsed.data[field] === undefined || parsed.data[field] === null) {
      issues.push({
        file,
        line: 1,
        code: "MISSING_FIELD",
        message: field,
        severity: "error",
      });
    }
  }

  const owner = parsed.data.owner;
  if (typeof owner === "string" && !VALID_OWNERS.has(owner)) {
    issues.push({
      file,
      line: parsed.fieldLines.get("owner") ?? 1,
      code: "INVALID_OWNER",
      message: `"${owner}"`,
      severity: "error",
    });
  }

  const status = parsed.data.status;
  if (typeof status === "string" && !VALID_STATUS.has(status)) {
    issues.push({
      file,
      line: parsed.fieldLines.get("status") ?? 1,
      code: "INVALID_STATUS",
      message: `"${status}"`,
      severity: "error",
    });
  }

  const updatedRaw = parsed.data.updated;
  if (updatedRaw !== undefined) {
    const s =
      updatedRaw instanceof Date
        ? updatedRaw.toISOString().slice(0, 10)
        : String(updatedRaw);
    const today = new Date().toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      issues.push({
        file,
        line: parsed.fieldLines.get("updated") ?? 1,
        code: "INVALID_UPDATED",
        message: `"${s}" not YYYY-MM-DD`,
        severity: "error",
      });
    } else if (s > today) {
      issues.push({
        file,
        line: parsed.fieldLines.get("updated") ?? 1,
        code: "INVALID_UPDATED",
        message: `"${s}" is in the future`,
        severity: "error",
      });
    }
  }

  const tags = parsed.data.tags;
  if (Array.isArray(tags)) {
    if (tags.length === 0) {
      issues.push({
        file,
        line: parsed.fieldLines.get("tags") ?? 1,
        code: "EMPTY_TAGS",
        message: "",
        severity: "error",
      });
    } else {
      for (const t of tags) {
        if (typeof t !== "string" || !validTags.has(t)) {
          const suggestion =
            typeof t === "string" ? suggestTag(t, validTags) : null;
          const suffix = suggestion ? ` (did you mean "${suggestion}"?)` : "";
          issues.push({
            file,
            line: parsed.fieldLines.get("tags") ?? 1,
            code: "UNKNOWN_TAG",
            message: `"${t}"${suffix}`,
            severity: "error",
          });
        }
      }
    }
  }

  const related = parsed.data.related;
  if (Array.isArray(related) && related.length >= RELATED_WARNING_THRESHOLD) {
    issues.push({
      file,
      line: parsed.fieldLines.get("related") ?? 1,
      code: "TOO_MANY_RELATED",
      message: `${related.length} entries (>=${RELATED_WARNING_THRESHOLD})`,
      severity: "warning",
    });
  }

  return issues;
}

function suggestTag(input: string, vocab: Set<string>): string | null {
  let best: string | null = null;
  let bestDist = 3;
  for (const t of vocab) {
    const d = levenshtein(input, t);
    if (d < bestDist) {
      best = t;
      bestDist = d;
    }
  }
  return best;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[m][n];
}
