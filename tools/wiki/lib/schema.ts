import { readText } from "./fs.ts";

const TAG_ROW_RE = /^\|\s*`([^`]+)`\s*\|/;

export async function loadTagVocabulary(
  tagsPath: string,
): Promise<Set<string>> {
  const content = await readText(tagsPath);
  const tags = new Set<string>();
  for (const line of content.split("\n")) {
    const m = line.match(TAG_ROW_RE);
    if (m) tags.add(m[1]);
  }
  return tags;
}
