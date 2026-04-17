import { test, expect } from "bun:test";
import path from "node:path";
import { loadTagVocabulary } from "../lib/schema.ts";

const FIXTURE = path.join(import.meta.dir, "fixtures/tags.md");

test("loadTagVocabulary reads backticked tags from table rows", async () => {
  const vocab = await loadTagVocabulary(FIXTURE);
  expect(vocab.has("harness")).toBe(true);
  expect(vocab.has("claude-code")).toBe(true);
  expect(vocab.has("llm-write")).toBe(true);
  expect(vocab.size).toBe(5);
});

test("loadTagVocabulary ignores prose", async () => {
  const vocab = await loadTagVocabulary(FIXTURE);
  expect(vocab.has("Fixture")).toBe(false);
});
