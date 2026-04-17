export const LINT_GLOBS = [
  "docs/wiki/**/*.md",
  "docs/agent/*.md",
  "docs/adr/*.md",
  "docs/superpowers/specs/**/*.md",
  "docs/ai-playbook/*.md",
];

export const TAG_VOCAB_PATH = "docs/wiki/schema/tags.md";
export const INDEX_PATH = "docs/wiki/wiki/INDEX.md";

export const INGEST_TOPICS = ["harness", "ops", "tasks", "incidents"] as const;
export type IngestTopic = (typeof INGEST_TOPICS)[number];

export const INGEST_SECTION_HEADERS: Record<IngestTopic, string> = {
  harness: "## Harness",
  ops: "## Ops",
  tasks: "## Tasks",
  incidents: "## Incidents",
};

export const EXIT = {
  OK: 0,
  VALIDATION_ERROR: 1,
  IO_ERROR: 2,
} as const;

export const VALID_OWNERS = new Set(["llm", "human"]);
export const VALID_STATUS = new Set([
  "draft",
  "approved",
  "stale",
  "deprecated",
]);
export const RELATED_WARNING_THRESHOLD = 6;
