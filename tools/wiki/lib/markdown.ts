export interface H1 {
  text: string;
  line: number;
}

export function extractH1(body: string, bodyStartLine: number): H1 | null {
  const lines = body.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^#\s+(.+?)\s*$/);
    if (m) return { text: m[1].trim(), line: bodyStartLine + i };
  }
  return null;
}

export interface BodyLink {
  target: string;
  line: number;
  isImage: boolean;
}

const LINK_RE = /(!?)\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

export function extractBodyLinks(
  body: string,
  bodyStartLine: number,
): BodyLink[] {
  const links: BodyLink[] = [];
  const lines = body.split("\n");
  let inFence = false;
  let inHtmlComment = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];

    if (/^\s*```/.test(raw)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    let line = raw;

    if (inHtmlComment) {
      const end = line.indexOf("-->");
      if (end === -1) continue;
      line = line.slice(end + 3);
      inHtmlComment = false;
    }

    line = line.replace(/<!--[\s\S]*?-->/g, "");

    const openIdx = line.indexOf("<!--");
    if (openIdx !== -1) {
      line = line.slice(0, openIdx);
      inHtmlComment = true;
    }

    line = line.replace(/`[^`\n]*`/g, "");

    LINK_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = LINK_RE.exec(line)) !== null) {
      links.push({
        target: m[3].trim(),
        line: bodyStartLine + i,
        isImage: m[1] === "!",
      });
    }
  }

  return links;
}
