import path from "node:path";
import fs from "node:fs/promises";
import { readText, exists, findRepoRoot } from "./lib/fs.ts";
import {
  INGEST_TOPICS,
  INGEST_SECTION_HEADERS,
  INDEX_PATH,
  type IngestTopic,
} from "./lib/config.ts";

export interface IngestOptions {
  cwd?: string;
  indexPath?: string;
  today?: string;
}

export interface IngestResult {
  created: string;
  updatedIndex: string;
}

export async function ingest(
  topic: string,
  title: string,
  opts: IngestOptions = {},
): Promise<IngestResult> {
  if (!(INGEST_TOPICS as readonly string[]).includes(topic)) {
    throw new Error(
      `INVALID_TOPIC: ${topic} (allowed: ${INGEST_TOPICS.join("|")})`,
    );
  }
  if (!title || title.trim().length === 0) {
    throw new Error("EMPTY_TITLE");
  }
  const topicKey = topic as IngestTopic;
  const cwd = opts.cwd ?? (await findRepoRoot());
  const indexPath = opts.indexPath ?? path.join(cwd, INDEX_PATH);
  const today = opts.today ?? new Date().toISOString().slice(0, 10);
  const slug = makeSlug(title);
  if (!slug) throw new Error("EMPTY_SLUG");
  const relPath = `docs/wiki/wiki/${topicKey}/${slug}.md`;
  const absPath = path.join(cwd, relPath);
  if (await exists(absPath)) {
    throw new Error(`FILE_EXISTS: ${relPath}`);
  }
  const body = skeleton(title.trim(), topicKey, today);
  await fs.mkdir(path.dirname(absPath), { recursive: true });
  await fs.writeFile(absPath, body, "utf8");

  const indexBefore = await readText(indexPath);
  const indexAfter = insertIndexEntry(
    indexBefore,
    topicKey,
    slug,
    title.trim(),
  );
  await fs.writeFile(indexPath, indexAfter, "utf8");

  return {
    created: relPath,
    updatedIndex: path.relative(cwd, indexPath).split(path.sep).join("/"),
  };
}

export function makeSlug(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function skeleton(title: string, topic: IngestTopic, today: string): string {
  return `---
title: ${title}
owner: llm
status: draft
updated: ${today}
tags:
  - ${topic}
  - llm-write
related:
  - docs/wiki/wiki/INDEX.md
---

# ${title}

## Purpose

TODO — 이 노트가 해결하려는 질문 한 줄.

## Recent changes

- ${today}: 초기 스켈레톤 생성 (wiki:ingest)
`;
}

export function insertIndexEntry(
  content: string,
  topic: IngestTopic,
  slug: string,
  title: string,
): string {
  const header = INGEST_SECTION_HEADERS[topic];
  const entry = `- [${topic}/${slug}.md](${topic}/${slug}.md) — ${title}`;
  const lines = content.split("\n");
  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === header) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) {
    const trimmed = content.replace(/\n+$/, "");
    return `${trimmed}\n\n${header}\n\n${entry}\n`;
  }
  let sectionEnd = lines.length;
  for (let i = headerIdx + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i])) {
      sectionEnd = i;
      break;
    }
  }
  const existing: Array<{ lineIdx: number; target: string }> = [];
  for (let i = headerIdx + 1; i < sectionEnd; i++) {
    const m = lines[i].match(/^-\s+\[[^\]]+\]\(([^)]+)\)/);
    if (m) existing.push({ lineIdx: i, target: m[1] });
  }
  const newTarget = `${topic}/${slug}.md`;
  if (existing.some((e) => e.target === newTarget)) return content;

  let insertAt: number;
  if (existing.length === 0) {
    insertAt = headerIdx + 1;
    if (insertAt < sectionEnd && lines[insertAt].trim() === "") insertAt++;
  } else {
    insertAt = sectionEnd;
    for (const e of existing) {
      if (e.target > newTarget) {
        insertAt = e.lineIdx;
        break;
      }
    }
  }
  lines.splice(insertAt, 0, entry);
  return lines.join("\n");
}
