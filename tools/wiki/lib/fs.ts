import path from "node:path";
import fs from "node:fs/promises";

export async function findRepoRoot(
  start: string = process.cwd(),
): Promise<string> {
  let dir = start;
  while (dir !== path.dirname(dir)) {
    try {
      await fs.stat(path.join(dir, ".git"));
      return dir;
    } catch {}
    dir = path.dirname(dir);
  }
  throw new Error("repo root (.git) not found");
}

export async function readText(p: string): Promise<string> {
  return fs.readFile(p, "utf8");
}

export async function exists(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

export function toRepoRelative(root: string, abs: string): string {
  return path.relative(root, abs).split(path.sep).join("/");
}
