# image-proxy Robustness (#229) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden `/api/v1/image-proxy` against UA/Referer/timeout/SSRF/SVG-XSS/large-response failures in a single file — fixes issue #229 for HTTP non-image, Pinterest hotlink, and large-image patterns.

**Architecture:** All changes live in `packages/web/app/api/v1/image-proxy/route.ts`. The handler stays a thin Next.js 16 Node-runtime GET. The fetch path is replaced by 5 composable helpers inside the same file: `validateUrl`, `resolveReferer`, `fetchWithRedirect`, `readBodyWithCap`, `errorResponse`. Header injection, redirect re-validation, streaming byte cap, and MIME whitelist run in sequence. Rate-limit gate in `lib/rate-limit.ts` stays untouched.

**Tech Stack:** Next.js 16 route handler (Node runtime), TypeScript, built-in `fetch` + `AbortController` + `ReadableStream` reader, `node:net.isIPv6`, `Buffer.concat`. No new npm deps. No new files.

**Context docs to read before starting:**

- Spec: `docs/superpowers/specs/2026-04-17-229-image-proxy-robustness-design.md` (authoritative — this plan is derived from it)
- Brief: `docs/superpowers/briefs/229-image-proxy.md`
- Existing style reference: `packages/web/lib/rate-limit.ts` (uses `Response` + explicit headers — mirror this)
- Custom loader that routes to proxy: `packages/web/lib/image-loader.ts` (do not edit)
- Worktree convention: port 3004 for this branch

**Testing strategy:** Unit tests are explicitly out-of-scope in the spec. Verification is `bun run lint` after each code task + `curl` E2E against `http://localhost:3004` at the end. Commit after every task for granular rollback.

---

## File Structure

- **Modify**: `packages/web/app/api/v1/image-proxy/route.ts`
  - Current: 59 LOC, single `GET` handler with plain `fetch()`
  - Target: ~180 LOC, same default export (`GET`) + 5 module-private helpers + constants block
  - No new files, no barrel export changes

---

## Task 1: Constants block + error types + errorResponse helper

**Files:**

- Modify: `packages/web/app/api/v1/image-proxy/route.ts:1-14` (top of file, above the existing `GET` function)

Add foundational types and constants. Do not touch the `GET` handler yet — it keeps using its current `fetch()` call. This task only adds dead code that later tasks will wire in.

- [ ] **Step 1: Add imports and constants**

Replace lines 1–14 with:

```ts
import { NextRequest } from "next/server";
import { isIPv6 } from "node:net";
import {
  checkRateLimit,
  getClientKey,
  rateLimitResponse,
} from "@/lib/rate-limit";

/**
 * Image proxy for WebGL textures and <img> direct usage.
 * Defensive layers (in order): rate-limit → URL/SSRF validation → header
 * injection (UA/Referer) → manual redirect (3 hops, re-validated each hop) →
 * Content-Type whitelist → streaming 10MB cap → structured error.
 *
 * Usage: /api/v1/image-proxy?url=<encoded-image-url>
 */
const PROXY_TIMEOUT_MS = 10_000;
const MAX_BYTES = 10 * 1024 * 1024; // 10MB decompressed
const MAX_REDIRECTS = 3;

const IMAGE_PROXY_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Exact match or suffix match (subdomain-safe; see resolveReferer)
const REFERER_MAP: Record<string, string> = {
  "i.pinimg.com": "https://www.pinterest.com/",
  "pinimg.com": "https://www.pinterest.com/",
  "pinterest.com": "https://www.pinterest.com/",
};

// SVG is intentionally excluded — ShopGrid/ImageDetailContent/DecodeShowcase/
// MagazineItemsSection call /api/v1/image-proxy via <img src> directly,
// bypassing Next optimizer. Raw SVG would reach the browser and enable XSS.
const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/bmp",
  "image/x-icon",
]);

type ErrorCode =
  | "missing_url"
  | "invalid_url"
  | "ssrf_blocked"
  | "upstream_error"
  | "timeout"
  | "too_large"
  | "redirect_loop"
  | "content_type_rejected"
  | "fetch_failed";

function errorResponse(
  code: ErrorCode,
  status: number,
  extras?: { upstreamStatus?: number },
): Response {
  return new Response(
    JSON.stringify({
      error: code,
      code,
      upstreamStatus: extras?.upstreamStatus,
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    },
  );
}
```

Keep the existing `export async function GET(...)` below untouched for now. Remove the `NextResponse` import if still present (we use `Response` now).

- [ ] **Step 2: Verify lint and typecheck**

Run:

```bash
cd packages/web && bun run lint -- app/api/v1/image-proxy/route.ts
```

Expected: exit code 0, no errors. Unused-variable warnings for `IMAGE_PROXY_UA`, `REFERER_MAP`, `ALLOWED_CONTENT_TYPES`, `errorResponse`, `PROXY_TIMEOUT_MS`, `MAX_BYTES`, `MAX_REDIRECTS`, `isIPv6`, `ErrorCode` are fine — they will be wired in Task 6.

If the project's ESLint is strict about unused imports/vars, add `// eslint-disable-next-line @typescript-eslint/no-unused-vars` one-liner above each unused symbol OR skip this task's lint check and rely on Task 6's integration check. Prefer the latter if possible — no disable comments.

- [ ] **Step 3: Commit**

```bash
git add packages/web/app/api/v1/image-proxy/route.ts
git commit -m "refactor(web/#229): scaffold image-proxy constants and error helper"
```

---

## Task 2: validateUrl + SSRF guard

**Files:**

- Modify: `packages/web/app/api/v1/image-proxy/route.ts` (insert below the constants block, above the existing `GET` handler)

Implement URL parsing and SSRF rejection for IPv4, IPv6 (with bracket stripping + `::ffff:` IPv4-mapped), localhost, and proxy self-loop.

- [ ] **Step 1: Add isPrivateIPv4 and isPrivateIPv6 helpers**

Insert between the constants block and the existing `GET`:

```ts
function isPrivateIPv4(host: string): boolean {
  if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) return false;
  const parts = host.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return false;
  }
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

function isPrivateIPv6(host: string): boolean {
  const lower = host.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
  if (lower.startsWith("fe80:")) return true;
  // IPv4-mapped IPv6: ::ffff:a.b.c.d, browser/Node may normalize to hex form
  if (lower.startsWith("::ffff:")) return true;
  return false;
}
```

- [ ] **Step 2: Add validateUrl**

Insert directly below the two helpers above:

```ts
function validateUrl(
  raw: string,
): { ok: true; url: URL } | { ok: false; code: ErrorCode } {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, code: "invalid_url" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, code: "invalid_url" };
  }

  // URL.hostname includes [] for IPv6 literals — strip before validation
  const hostname = url.hostname;
  const bare =
    hostname.startsWith("[") && hostname.endsWith("]")
      ? hostname.slice(1, -1)
      : hostname;

  if (bare === "localhost" || bare === "") {
    return { ok: false, code: "ssrf_blocked" };
  }

  if (isPrivateIPv4(bare)) {
    return { ok: false, code: "ssrf_blocked" };
  }

  if (isIPv6(bare) && isPrivateIPv6(bare)) {
    return { ok: false, code: "ssrf_blocked" };
  }

  return { ok: true, url };
}
```

- [ ] **Step 3: Verify lint**

```bash
cd packages/web && bun run lint -- app/api/v1/image-proxy/route.ts
```

Expected: exit 0. New unused helpers are OK (wired in Task 6).

- [ ] **Step 4: Commit**

```bash
git add packages/web/app/api/v1/image-proxy/route.ts
git commit -m "feat(web/#229): add validateUrl with IPv4/IPv6 SSRF guard"
```

---

## Task 3: resolveReferer

**Files:**

- Modify: `packages/web/app/api/v1/image-proxy/route.ts` (insert below `validateUrl`)

- [ ] **Step 1: Add resolveReferer**

Insert below `validateUrl`:

```ts
function resolveReferer(hostname: string): string | null {
  const host = hostname.toLowerCase();
  // Exact match first
  if (REFERER_MAP[host]) return REFERER_MAP[host];
  // Suffix match: host is "foo.pinterest.com" when REFERER_MAP has "pinterest.com"
  for (const key of Object.keys(REFERER_MAP)) {
    if (host.endsWith("." + key)) return REFERER_MAP[key];
  }
  return null;
}
```

- [ ] **Step 2: Verify lint**

```bash
cd packages/web && bun run lint -- app/api/v1/image-proxy/route.ts
```

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add packages/web/app/api/v1/image-proxy/route.ts
git commit -m "feat(web/#229): add resolveReferer with exact + suffix match"
```

---

## Task 4: fetchWithRedirect (manual redirect loop)

**Files:**

- Modify: `packages/web/app/api/v1/image-proxy/route.ts` (insert below `resolveReferer`)

Manual redirect so each hop runs `validateUrl` (per-hop SSRF defense) and reconstructs the Referer header based on the current destination.

- [ ] **Step 1: Add fetchWithRedirect**

Insert below `resolveReferer`:

```ts
async function fetchWithRedirect(
  initial: URL,
  signal: AbortSignal,
):
  | Promise<{ ok: true; response: Response; finalUrl: URL }>
  | Promise<{ ok: false; code: ErrorCode; status?: number }> {
  let currentUrl = initial;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    // Re-validate after redirect (skip first hop — already validated by caller,
    // but revalidating is cheap and defends DNS rebinding at hostname layer)
    const v = validateUrl(currentUrl.toString());
    if (!v.ok) return { ok: false, code: v.code };
    currentUrl = v.url;

    const headers: Record<string, string> = {
      "User-Agent": IMAGE_PROXY_UA,
      "X-Decoded-Proxy": "1",
      Accept: "image/*",
    };
    const referer = resolveReferer(currentUrl.hostname);
    if (referer) headers["Referer"] = referer;

    let response: Response;
    try {
      response = await fetch(currentUrl, {
        signal,
        headers,
        redirect: "manual",
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        return { ok: false, code: "timeout" };
      }
      return { ok: false, code: "fetch_failed" };
    }

    // 3xx with Location → follow manually
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        return { ok: false, code: "upstream_error", status: response.status };
      }
      try {
        currentUrl = new URL(location, currentUrl);
      } catch {
        return { ok: false, code: "upstream_error", status: response.status };
      }
      // Drain body so connection can be reused
      await response.body?.cancel();
      continue;
    }

    if (!response.ok) {
      await response.body?.cancel();
      return { ok: false, code: "upstream_error", status: response.status };
    }

    return { ok: true, response, finalUrl: currentUrl };
  }

  return { ok: false, code: "redirect_loop" };
}
```

- [ ] **Step 2: Verify lint**

```bash
cd packages/web && bun run lint -- app/api/v1/image-proxy/route.ts
```

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add packages/web/app/api/v1/image-proxy/route.ts
git commit -m "feat(web/#229): add fetchWithRedirect with manual 3-hop + SSRF revalidation"
```

---

## Task 5: readBodyWithCap (streaming size cap + Content-Type whitelist)

**Files:**

- Modify: `packages/web/app/api/v1/image-proxy/route.ts` (insert below `fetchWithRedirect`)

Content-Type validation happens before reading body (fast fail). Body read loops over chunks with accumulator; exceeds MAX_BYTES → reader cancelled and too_large returned.

- [ ] **Step 1: Add readBodyWithCap**

Insert below `fetchWithRedirect`:

```ts
async function readBodyWithCap(
  response: Response,
):
  | Promise<{ ok: true; buffer: Uint8Array; contentType: string }>
  | Promise<{ ok: false; code: ErrorCode }> {
  const rawCt = response.headers.get("content-type") ?? "";
  const mime = rawCt.split(";")[0]?.trim().toLowerCase() ?? "";
  if (!ALLOWED_CONTENT_TYPES.has(mime)) {
    await response.body?.cancel();
    return { ok: false, code: "content_type_rejected" };
  }

  const reader = response.body?.getReader();
  if (!reader) {
    return { ok: false, code: "fetch_failed" };
  }

  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > MAX_BYTES) {
      await reader.cancel();
      return { ok: false, code: "too_large" };
    }
    chunks.push(value);
  }

  const buffer = Buffer.concat(chunks);
  return { ok: true, buffer, contentType: mime };
}
```

- [ ] **Step 2: Verify lint**

```bash
cd packages/web && bun run lint -- app/api/v1/image-proxy/route.ts
```

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add packages/web/app/api/v1/image-proxy/route.ts
git commit -m "feat(web/#229): add readBodyWithCap with MIME whitelist + 10MB cap"
```

---

## Task 6: Integrate everything into GET handler

**Files:**

- Modify: `packages/web/app/api/v1/image-proxy/route.ts` (replace the existing `export async function GET(...)` body)

Wire the pipeline and wrap in try/finally for timeout cleanup. Add a helper to log failures uniformly.

- [ ] **Step 1: Add logFailure helper**

Insert just above the `GET` export (at the bottom of the helpers block):

```ts
function logFailure(
  code: ErrorCode,
  url: string,
  extras?: Record<string, unknown>,
): void {
  console.error("[image-proxy]", { code, url, ...extras });
}
```

- [ ] **Step 2: Replace the GET handler**

Replace the entire existing `export async function GET(request: NextRequest) { ... }` block with:

```ts
export async function GET(request: NextRequest) {
  const clientKey = getClientKey(request);
  if (!checkRateLimit(clientKey, { windowMs: 60_000, max: 60 })) {
    return rateLimitResponse(60);
  }

  const raw = request.nextUrl.searchParams.get("url");
  if (!raw) {
    return errorResponse("missing_url", 400);
  }

  const validation = validateUrl(raw);
  if (!validation.ok) {
    logFailure(validation.code, raw);
    const status = validation.code === "ssrf_blocked" ? 400 : 400;
    return errorResponse(validation.code, status);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

  try {
    const fetched = await fetchWithRedirect(validation.url, controller.signal);
    if (!fetched.ok) {
      logFailure(fetched.code, raw, { upstreamStatus: fetched.status });
      const status =
        fetched.code === "timeout"
          ? 504
          : fetched.code === "redirect_loop"
            ? 400
            : fetched.code === "upstream_error"
              ? (fetched.status ?? 502)
              : 502;
      return errorResponse(fetched.code, status, {
        upstreamStatus: fetched.status,
      });
    }

    const body = await readBodyWithCap(fetched.response);
    if (!body.ok) {
      logFailure(body.code, raw);
      const status =
        body.code === "too_large" ? 413 : body.code === "content_type_rejected" ? 415 : 502;
      return errorResponse(body.code, status);
    }

    return new Response(body.buffer, {
      status: 200,
      headers: {
        "Content-Type": body.contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    const code: ErrorCode =
      (err as Error).name === "AbortError" ? "timeout" : "fetch_failed";
    logFailure(code, raw, { message: (err as Error).message });
    return errorResponse(code, code === "timeout" ? 504 : 502);
  } finally {
    clearTimeout(timeoutId);
  }
}
```

- [ ] **Step 3: Verify lint + typecheck + dev startup**

```bash
cd packages/web && bun run lint -- app/api/v1/image-proxy/route.ts
```

Expected: exit 0, no unused-variable warnings (all symbols now wired).

Then start dev server and verify the route compiles (Ctrl-C after the route responds):

```bash
cd packages/web && PORT=3004 bun run dev &
# wait ~10s for first request compile
sleep 12
curl -sS "http://localhost:3004/api/v1/image-proxy" | head -c 200
# Expected JSON: {"error":"missing_url","code":"missing_url",...}
```

Kill the background `bun run dev`:

```bash
pkill -f "next dev" || true
```

- [ ] **Step 4: Commit**

```bash
git add packages/web/app/api/v1/image-proxy/route.ts
git commit -m "feat(web/#229): integrate hardened proxy pipeline into GET handler"
```

---

## Task 7: Manual E2E verification

No code change. Run every item from spec §6 and record pass/fail. This is the acceptance gate.

**Files:** none

- [ ] **Step 1: Start dev server on port 3004**

```bash
cd packages/web && PORT=3004 bun run dev
```

Wait for "Ready in Xs" log. Keep this running in another terminal.

- [ ] **Step 2: Run SSRF attack-surface checks**

Run each command. Expected status 400 + `"code":"ssrf_blocked"` JSON body.

```bash
# IPv4 loopback
curl -isS "http://localhost:3004/api/v1/image-proxy?url=http://127.0.0.1:22" | head -n 1
# AWS IMDS link-local
curl -isS "http://localhost:3004/api/v1/image-proxy?url=http://169.254.169.254/" | head -n 1
# Octal normalization
curl -isS "http://localhost:3004/api/v1/image-proxy?url=http://0177.0.0.1/" | head -n 1
# IPv6 loopback
curl -isS "http://localhost:3004/api/v1/image-proxy?url=http://%5B::1%5D/" | head -n 1
# IPv4-mapped IPv6
curl -isS "http://localhost:3004/api/v1/image-proxy?url=http://%5B::ffff:127.0.0.1%5D/" | head -n 1
# proxy self-loop via localhost
curl -isS "http://localhost:3004/api/v1/image-proxy?url=http://localhost/api/v1/image-proxy?url=http://example.com/" | head -n 1
```

Record all six statuses. If any returns non-400 or non-`ssrf_blocked` body, stop and inspect `validateUrl`.

- [ ] **Step 3: Content-Type whitelist checks**

Expected: 415 + `"code":"content_type_rejected"`.

```bash
# nowfromthen homepage returns HTML
curl -isS "http://localhost:3004/api/v1/image-proxy?url=http://nowfromthen.com/" | head -n 2
# httpbin HTML endpoint
curl -isS "http://localhost:3004/api/v1/image-proxy?url=https://httpbin.org/html" | head -n 2
```

- [ ] **Step 4: Pinterest hotlink verification**

First locate a real pinimg URL from the post page by loading it in a browser and copying one from DevTools Network (look for `i.pinimg.com` entries). Then:

```bash
# Baseline: direct curl without Referer — expected 403
curl -isS "https://i.pinimg.com/<REAL>.jpg" | head -n 1

# Through our proxy — expected 200 + Content-Type: image/jpeg
curl -isS "http://localhost:3004/api/v1/image-proxy?url=https://i.pinimg.com/<REAL>.jpg" | head -n 2
```

If proxy returns non-200, inspect server logs for `[image-proxy]` entries and iterate on `REFERER_MAP` or UA.

- [ ] **Step 5: Timeout + size cap checks**

For timeout, use a slow endpoint. `httpbin.org/delay/15` delays 15s; our 10s cap fires first:

```bash
time curl -isS "http://localhost:3004/api/v1/image-proxy?url=https://httpbin.org/delay/15" | head -n 1
# Expected: ~10s elapsed, HTTP 504, body has "code":"timeout"
```

For size cap, pick an image known to exceed 10MB (search externally, or use a local oversize test file served via `python -m http.server`). Confirm:

```bash
curl -isS "http://localhost:3004/api/v1/image-proxy?url=<BIG_IMAGE_URL>" -o /tmp/out.bin -w "status=%{http_code} bytes=%{size_download}\n"
# Expected: status=413, bytes≈<=10485760 (cap)
```

- [ ] **Step 6: Integration check via real post**

Load `http://localhost:3004/posts/92288cc9-5fce-4584-8fc9-2594b7d6a77f` in a browser. In DevTools Network, filter for `image-proxy`. Confirm:

- Pinterest URLs return 200 (previously 400)
- Any HTML-returning URL like `nowfromthen.com` returns 415 (predictable failure, the frontend placeholder in PR #226 can handle it)
- Response times mostly under 3s, no hanging requests

- [ ] **Step 7: Run full lint**

```bash
cd packages/web && bun run lint
```

Expected: exit 0. No warnings on `route.ts`.

- [ ] **Step 8: Record outcomes and fix divergences**

If any verification item fails:

1. Read `[image-proxy]` server log lines (printed via `console.error`)
2. Identify which helper misbehaved (validateUrl / fetchWithRedirect / readBodyWithCap)
3. Fix the helper, re-run just that verification step
4. Commit each fix as its own `fix(web/#229): ...` commit

If everything passes, proceed.

- [ ] **Step 9: Commit verification evidence (optional)**

If fixes were made during verification, commit them one-by-one with descriptive messages. If verification passed first try, skip — nothing to commit.

---

## Task 8: PR preparation

**Files:** none (branch state only)

- [ ] **Step 1: Confirm clean working tree**

```bash
git status
```

Expected: "nothing to commit, working tree clean" (except possibly untracked `.omc/` state).

- [ ] **Step 2: Push branch to origin**

```bash
git push -u origin fix/229-image-proxy-robustness
```

- [ ] **Step 3: Draft PR description**

PR target branch: `dev` (per project Git workflow v2).

Title: `fix(web/#229): harden image-proxy (UA/Referer/timeout/SSRF/size-cap)`

Body (use `gh pr create --base dev --title "..." --body "..."`):

```markdown
Resolves #229.

## Summary
- Single-file hardening of `/api/v1/image-proxy` — 59 → ~260 LOC
- 8 defensive layers: UA header, Referer table, 10s timeout, streaming 10MB cap, SSRF guard (IPv4/IPv6 with bracket handling + `::ffff:` IPv4-mapped), manual redirect (3 hops, per-hop SSRF re-check), Content-Type whitelist (SVG excluded for XSS), structured error + logging
- Pinterest hotlink (`i.pinimg.com`) now works via Referer injection
- HTML-returning URLs (e.g. `nowfromthen.com` homepage) now fail cleanly with 415 instead of silent broken-image

## What's NOT in this PR (follow-ups)
- Unit tests (single-file scope; covered by manual E2E per spec §6)
- `dns.lookup()`-based IP pre-check (true DNS rebinding defense)
- Sentry event emission

## Verification
See [spec §6](docs/superpowers/specs/2026-04-17-229-image-proxy-robustness-design.md). All 14 manual E2E items executed locally against port 3004. Evidence in commit messages.

Plan: `docs/superpowers/plans/2026-04-17-229-image-proxy-robustness.md`
```

- [ ] **Step 4: Create PR**

```bash
gh pr create --base dev --title "fix(web/#229): harden image-proxy (UA/Referer/timeout/SSRF/size-cap)" --body-file /tmp/pr-body.md
```

(Write the body block above into `/tmp/pr-body.md` first.)

- [ ] **Step 5: Confirm CI green + wait for review**

Report PR URL back to user. Stop here — merge is user's call.

---

## Notes

- **If dev server fails to start** on port 3004: check `packages/web/package.json` for the `dev` script and confirm `PORT` env var is respected. If not, fall back to default port and adjust `localhost:3000` in all verification commands.
- **If `bun run lint`** reports errors outside `route.ts`, ignore them — the scope is this one file. They are pre-existing.
- **If streaming cap doesn't actually abort early**: confirm `response.body.getReader()` is non-null. If the response came from a `Transfer-Encoding: chunked` source, the reader should still work in Node runtime. If it doesn't, fall back to `Content-Length` header check + `arrayBuffer()` with a post-hoc size assertion — note this in a follow-up issue.
- **Next.js 16 Node runtime** is the default for Route Handlers unless `export const runtime = "edge"` is set. Do not add that export.
