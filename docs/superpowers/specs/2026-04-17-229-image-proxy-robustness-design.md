# Spec — #229 image-proxy robustness (UA / Referer / timeout / size-guard / SSRF)

**Issue**: #229
**Branch**: `fix/229-image-proxy-robustness`
**Worktree**: `.worktrees/229-image-proxy` (PORT=3004)
**Date**: 2026-04-17
**Status**: design approved, pending writing-plans

## 1. Context

Post 상세 페이지에서 외부 이미지 3가지 패턴이 실패:

1. **HTTP 도메인** (`nowfromthen.com`) → 400
2. **Pinterest** (`i.pinimg.com`) → 400 (hotlink protection 추정)
3. **대용량** (`celine.com w=1920`) → `naturalWidth: 0`

체인: browser → `/_next/image` → `/api/v1/image-proxy` → external origin.

현재 프록시 (`packages/web/app/api/v1/image-proxy/route.ts`, 59 LOC)는:

- UA/Referer 헤더 주입 없음
- timeout/AbortController 없음
- size cap 없음 (`arrayBuffer()` 전체 로드)
- SSRF 방어 없음 (internal IP fetch 가능)
- Content-Type 검증 없음 (HTML도 그대로 통과)
- Redirect 자동 follow (final hop SSRF 우회 가능)
- `NextResponse.json` 사용으로 `Cache-Control: no-store` 미보장

## 2. Root-cause evidence (재현 실험 결과, 2026-04-17 22:30 KST)

`/tmp/image-proxy-repro.mjs`로 Node fetch를 직접 호출해 검증.

| 케이스                                     | 결과                                                                                          | 결론                                                                                                                                                                   |
| ------------------------------------------ | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fetch("http://nowfromthen.com/")` default | 301→200 (`fetch` follow redirect to HTTPS), content-type `image/*; charset=utf-8` (HTML 반환) | **HTTP→HTTPS 자동 승격은 `fetch` 내장 기능으로 이미 처리됨.** 실패의 실 원인은 응답이 이미지가 아닌데 프록시가 그대로 전달한 것 → **Content-Type 화이트리스트**로 해결 |
| `fetch("https://i.pinimg.com/<fake>.jpg")` | 403 (테스트 URL이 실존 안 함)                                                                 | 헤더 효과 결정적 증명 실패. 그러나 Pinterest hotlink는 업계 상식이며 UA+Referer 주입은 표준 대응                                                                       |
| `next.config.js` 검사                      | `remotePatterns` 없음, custom loader + `localPatterns` 사용                                   | 프록시 URL은 Next 입장에서 로컬이라 `remotePatterns` 게이트 없음. HTTP 400이 Next optimizer에서 발생한다는 가설 기각                                                   |

**핵심 함의**:

- HTTP→HTTPS 명시 승격 로직은 **불필요** (native fetch가 처리)
- Content-Type 화이트리스트가 nowfromthen 케이스의 실제 fix
- UA + Referer는 Pinterest 대응

## 3. Scope

**단일 파일**: `packages/web/app/api/v1/image-proxy/route.ts`

예상 LOC: 59 → ~180.

**In-scope**:

- UA 헤더 (정석 브라우저 UA + 별도 `X-Decoded-Proxy: 1` 식별 헤더)
- Referer 주입 테이블 (도메인 매칭)
- AbortController 10초 timeout
- 10MB size cap (스트리밍 누적, 초과 시 reader.cancel())
- Structured error JSON (`Response` 스타일로 `rate-limit.ts`와 정합성)
- SSRF 가드 (protocol + private IP)
- Redirect 수동 처리 (max 3 hops, 각 hop 재검증)
- Content-Type 화이트리스트 (`image/*` 실제 타입만)
- 실패 분류별 `console.error` 로깅

**Out-of-scope** (별도 이슈/PR):

- 유닛 테스트 추가 (단일 파일 스코프 유지, 수동 E2E로 검증)
- fetcher 모듈 추출 (파일 분리)
- Next.js `remotePatterns` 변경 (재현으로 불필요 확인됨)
- 프론트 onError fallback 로직 (PR #226 placeholder 범위)
- Redis 기반 per-IP memory quota (현재 rate-limit에 위임)

## 4. Design

### 4.1 Constants (파일 상단)

```ts
const PROXY_TIMEOUT_MS = 10_000;
const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_REDIRECTS = 3;

const IMAGE_PROXY_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// 정확 일치 또는 .<suffix> 매칭 (subdomain 스푸핑 방지)
const REFERER_MAP: Record<string, string> = {
  "i.pinimg.com": "https://www.pinterest.com/",
  "pinimg.com": "https://www.pinterest.com/",
  "pinterest.com": "https://www.pinterest.com/",
};

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
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
```

### 4.2 URL validation + SSRF guard

```ts
function validateUrl(
  raw: string,
): { ok: true; url: URL } | { ok: false; code: ErrorCode; reason: string };
```

검증 항목:

1. `new URL()` 파싱 성공
2. `protocol`이 `http:` 또는 `https:`
3. `hostname`이 IP 리터럴이면 private/link-local 거부:
   - IPv4: `10/8`, `172.16-31/12`, `192.168/16`, `127/8`, `169.254/16`, `0.0.0.0`
   - IPv6: `::1`, `fc00::/7`, `fe80::/10`, `::`
4. Hostname `localhost` 거부

구현:

- IPv4: 정규식 `/^(\d{1,3}\.){3}\d{1,3}$/`로 감지 후 옥텟 파싱, 상단 목록과 비교
- IPv6: `node:net.isIPv6(host)`로 감지, `host.toLowerCase()` prefix 매칭으로 블랙리스트(`::1`, `fc`/`fd` 시작, `fe80:`, `::`)
- DNS rebinding은 redirect 수동 처리 루프에서 매 hop host 재검증으로 방어
- Hostname이 IP 리터럴이 아닌 경우에는 DNS resolution 사전 차단하지 않음 (정상 CDN이 다수). 악의적 도메인이 private IP로 resolve되는 케이스는 follow-up SSRF 강화로 위임

### 4.3 Referer resolution

```ts
function resolveReferer(host: string): string | null;
```

- `REFERER_MAP[host]` 정확 매칭 or `Object.keys(REFERER_MAP).find(k => host === k || host.endsWith("." + k))`로 suffix 매칭
- 매칭되면 string, 아니면 null

### 4.4 Manual redirect loop

```ts
async function fetchWithRedirect(
  initial: URL,
  signal: AbortSignal,
): Promise<
  | { ok: true; response: Response; finalUrl: URL }
  | { ok: false; code: ErrorCode; status?: number }
>;
```

로직:

1. `currentUrl = initial`
2. loop up to `MAX_REDIRECTS`:
   - `validateUrl(currentUrl)` 재검증 (SSRF hop 방어)
   - headers 구성: `User-Agent: IMAGE_PROXY_UA`, `X-Decoded-Proxy: 1`, `Accept: image/*`, Referer는 `resolveReferer(currentUrl.hostname)`이 있으면 추가
   - `fetch(currentUrl, { redirect: "manual", signal, headers })`
   - 3xx && `Location`: `currentUrl = new URL(location, currentUrl)`, continue
   - 2xx: return success
   - 그 외: return upstream_error with status
3. 루프 초과: redirect_loop

### 4.5 Streaming size cap

응답 body를 `response.body.getReader()`로 읽으며 청크 누적:

```ts
const reader = response.body?.getReader();
const chunks: Uint8Array[] = [];
let received = 0;
while (reader) {
  const { done, value } = await reader.read();
  if (done) break;
  received += value.byteLength;
  if (received > MAX_BYTES) {
    await reader.cancel();
    return errorResponse("too_large", 413);
  }
  chunks.push(value);
}
// 누적 완료 후 단일 버퍼로 합치고 Response에 담아 반환
const buffer = concatUint8(chunks, received);
```

**왜 스트리밍인가**: `Content-Length` 헤더는 advisory (서버가 거짓말 가능, 일부 CDN 누락). 실제 누적값으로 판정해야 확실. 청크 단계에서 초과 즉시 cancel → upstream 네트워크 비용 절감.

**왜 한 번에 buffer 반환인가**: 스트리밍 pass-through로 반환 후 중간에 cap 초과하면 truncated image가 Next optimizer에 캐시됨 → 브라우저가 깨진 이미지 영구적으로 봄. 헤더 전송 전에 전량 확정 후 단일 `Response(buffer)` 반환.

### 4.6 Content-Type whitelist

upstream 응답의 `Content-Type`에서 MIME 부분만 추출 (`split(";")[0].trim().toLowerCase()`), `ALLOWED_CONTENT_TYPES`에 있는지 확인. 없으면 (헤더 부재 포함) `content_type_rejected` 415 반환. 통과한 MIME은 성공 응답의 `Content-Type` 헤더로 그대로 전달 (e.g. `image/jpeg`).

### 4.7 Error response format

```ts
function errorResponse(
  code: ErrorCode,
  status: number,
  extras?: { upstreamStatus?: number; message?: string },
): Response {
  return new Response(
    JSON.stringify({
      error: extras?.message ?? code,
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

`rate-limit.ts`의 `rateLimitResponse` 스타일과 일치 (`Response`, 명시 헤더).

### 4.8 Logging

각 실패 분기에서 `console.error("[image-proxy]", { code, url, upstreamStatus })` 1줄. Vercel Log에서 `[image-proxy]` prefix로 필터 가능.

## 5. Handler flow (의사 코드)

```
GET /api/v1/image-proxy?url=...

1. rate-limit check (기존 유지)
2. url param 존재 → validateUrl → SSRF 통과
3. AbortController + 10s timeout setup
4. fetchWithRedirect (manual redirect, 3 hops, 각 hop SSRF + Referer 재구성)
5. upstream 2xx 확인 (아니면 upstream_error)
6. Content-Type 화이트리스트 통과
7. body streaming with 10MB cap
8. 성공 응답: Response(buffer, { 200, Content-Type, Cache-Control: public max-age=86400, Access-Control-Allow-Origin: * })
9. finally: timeout clearTimeout
```

## 6. Testing / verification

**자동**: 단위 테스트는 out-of-scope (단일 파일 스코프 유지)

**수동 E2E 체크리스트**:

- [ ] `bun run dev` (PORT=3004) 로 프록시 기동
- [ ] `curl -i "http://localhost:3004/api/v1/image-proxy?url=http://nowfromthen.com/"` → content_type_rejected 415 JSON (이미지가 아님)
- [ ] `curl -i "http://localhost:3004/api/v1/image-proxy?url=http://127.0.0.1:22"` → ssrf_blocked 400
- [ ] `curl -i "http://localhost:3004/api/v1/image-proxy?url=https://i.pinimg.com/<real-pin>.jpg"` → 200 image (Referer 주입 성공)
- [ ] 대용량 URL (>10MB) → too_large 413 + 네트워크 탭에서 10MB 초과 바이트 다운로드 중단 확인
- [ ] `/posts/92288cc9-5fce-4584-8fc9-2594b7d6a77f` 로드 후 DevTools Network에서 image-proxy 응답 상태 샘플 확인
- [ ] `bun run lint` 통과

## 7. Risk / rollback

- **Risk**: Content-Type 화이트리스트가 공격적으로 걸어서 정상 이미지까지 거부할 가능성 → MIME 목록에 일반적인 이미지 타입 전부 포함, `image/svg+xml` 포함 여부는 XSS 관점에서 재검토 (현재는 포함 — Next optimizer가 PNG/AVIF/WebP로 변환 후 서빙하므로 브라우저에 raw svg 도달 안 함)
- **Rollback**: 단일 파일이므로 `git revert <commit>` 즉시 가능

## 8. Follow-up (별도 이슈 제안)

- fetcher 추출 + `vitest` 단위 테스트 (fetch mock)
- 실패 이벤트를 Sentry로 emit (관찰성 강화)
- Per-IP 대역폭 quota (10MB × 60/min = 600MB/min/IP 최대 버스트 방어)

## 9. Open questions (critic 리뷰 잔여)

- `Pinterest Referer 효과는 실제 pin URL로 재검증 필요` — 구현 후 E2E 단계에서 확인
- `SVG 통과가 적절한가` — 현재 설계는 통과. XSS 우려 시 whitelist에서 제외하는 1줄 수정으로 대응

---

## Changelog

- 2026-04-17 22:30 — critic 리뷰(2 CRITICAL + 4 MAJOR) 반영 후 5→8 changes로 확장, 재현 실험 근거 추가
