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

// NOTE: image/svg+xml은 의도적으로 제외.
// ShopGrid, ImageDetailContent, DecodeShowcase, MagazineItemsSection 등이
// /api/v1/image-proxy를 <img src> 로 직접 호출 (Next optimizer 우회 경로)하므로
// raw SVG가 브라우저에 그대로 도달 → XSS 벡터. 필요 시 별도 safe-svg 라우트로 분리.
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

- **IPv6 bracket 처리 주의**: `new URL("http://[::1]/").hostname === "[::1]"` (대괄호 포함). `net.isIPv6("[::1]") === false`이므로 **반드시 대괄호 먼저 제거**한 뒤 검사:
  ```ts
  const h =
    hostname.startsWith("[") && hostname.endsWith("]")
      ? hostname.slice(1, -1)
      : hostname;
  ```
- **IPv4**: 정규식 `/^(\d{1,3}\.){3}\d{1,3}$/`로 감지 후 옥텟 파싱. 차단 범위: `10/8`, `172.16-31/12`, `192.168/16`, `127/8`, `169.254/16`, `0.0.0.0`. Node가 `URL` 파싱 시 decimal/octal 표기(`0177.0.0.1`)를 `127.0.0.1`로 자동 정규화하므로 추가 처리 불필요
- **IPv6**: 대괄호 제거된 `h`에 대해 `net.isIPv6(h)`로 감지, `h.toLowerCase()`로 prefix 매칭:
  - `::1` (정확 일치)
  - `fc`, `fd` 시작 (ULA)
  - `fe80:` 시작 (link-local)
  - `::` (unspecified)
  - **`::ffff:` 시작 (IPv4-mapped IPv6, SSRF bypass 차단)** — 예: `[::ffff:127.0.0.1]` → hostname이 `[::ffff:7f00:1]`로 정규화되므로 prefix 매칭으로 차단
- **Proxy self-loop 차단**: hostname이 `localhost` 또는 현재 배포 origin과 일치하면 거부 (무한 재귀 방지)
- **DNS rebinding 방어 한계 명시**: redirect 수동 처리 루프에서 매 hop **hostname layer** 재검증은 수행. 단 `fetch` API가 실제 resolved IP를 노출하지 않으므로 **진정한 DNS rebinding(동일 호스트 재질의 시 다른 IP 반환) 방어는 불가**. 이 공격 표면은 `dns.lookup()` 기반 pre-check follow-up 이슈로 이전
- **1단계 도메인 → private IP resolve**: hostname이 IP 리터럴이 아닌 경우 DNS resolution 사전 차단하지 않음 (정상 CDN이 다수). 악의 도메인이 A record로 `10.0.0.5`를 반환하는 케이스도 동일하게 follow-up SECURITY 이슈로 이전. Vercel 네트워크 격리에 부분 의존

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
// 누적 완료 후 단일 버퍼로 합치고 Response에 담아 반환.
// Node runtime이므로 Buffer.concat 사용 (Uint8Array 배열 → 단일 Buffer)
const buffer = Buffer.concat(chunks);
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

환경: `bun run dev` (PORT=3004) 로 프록시 기동 후 curl로 직접 호출.

**기능 확인**:

- [ ] `/posts/92288cc9-5fce-4584-8fc9-2594b7d6a77f` 로드 → DevTools Network에서 실제 post의 pinimg URL 샘플이 200 반환 (Referer 주입 효과). 해당 URL을 `<real-pin>` 자리에 그대로 넣어 아래 curl로 직접 검증
- [ ] `curl -i "http://localhost:3004/api/v1/image-proxy?url=https://i.pinimg.com/<real-pin>.jpg"` → 200 + `Content-Type: image/jpeg`
- [ ] 동일 URL을 Referer 없이 외부에서 호출(직접 `curl https://i.pinimg.com/...`)하여 403 대조 확인 (proxy fix의 효과 증명)
- [ ] `curl -i "http://localhost:3004/api/v1/image-proxy?url=http://nowfromthen.com/"` → 415 `content_type_rejected` JSON
- [ ] `curl -i "http://localhost:3004/api/v1/image-proxy?url=https://httpbin.org/html"` → 415 `content_type_rejected` (HTML 차단)

**SSRF 공격 표면 6종**:

- [ ] `?url=http://127.0.0.1:22` → 400 `ssrf_blocked` (IPv4 loopback)
- [ ] `?url=http://169.254.169.254/` → 400 `ssrf_blocked` (AWS IMDS link-local)
- [ ] `?url=http://0177.0.0.1/` → 400 `ssrf_blocked` (IPv4 octal 정규화)
- [ ] `?url=http://[::1]/` → 400 `ssrf_blocked` (IPv6 loopback with brackets)
- [ ] `?url=http://[::ffff:127.0.0.1]/` → 400 `ssrf_blocked` (IPv4-mapped IPv6)
- [ ] `?url=http://localhost/api/v1/image-proxy?url=...` → 400 `ssrf_blocked` (proxy self-loop)

**방어 레이어**:

- [ ] Timeout: 10초+α 응답하는 upstream(`sleep 15`) → 10초 ± 500ms에서 504 `timeout`
- [ ] Size cap: >10MB 이미지 URL → 413 `too_large`, `curl -w "%{size_download}\n"`로 약 10MB 이내 다운로드 후 abort 확인 (전체 다운로드 X)
- [ ] Redirect loop: `Location: /a` → `/a`로 루프하는 mock → 400 `redirect_loop`
- [ ] Content-Type missing: upstream이 헤더 미반환 → 415 `content_type_rejected`

**빌드 체크**:

- [ ] `bun run lint` 통과
- [ ] `bun run dev` 기동 시 TypeScript 에러 없음

## 7. Risk / rollback

- **Risk**: Content-Type 화이트리스트가 공격적으로 걸어서 정상 이미지까지 거부할 가능성 → JPEG/PNG/WebP/AVIF/GIF/BMP/ICO 커버. `image/svg+xml`은 **의도적으로 제외**: ShopGrid/ImageDetailContent/DecodeShowcase/MagazineItemsSection이 프록시를 `<img src>`로 직접 호출(Next optimizer 우회)하므로 raw SVG XSS 위험 live. SVG 필요 시 별도 safe-svg 엔드포인트(DOMPurify 서버사이드)로 분리
- **Risk**: DNS rebinding은 hostname layer 재검증만 가능, 실제 resolved IP 레벨 방어는 불가 (follow-up으로 이전)
- **Risk**: 10MB cap × 60 req/min × N IPs = Vercel 인스턴스 메모리 압박 가능 → rate-limit이 1차 방어선, Sentry 경보는 follow-up
- **Rollback**: 단일 파일이므로 `git revert <commit>` 즉시 가능

## 8. Follow-up (별도 이슈 제안)

- fetcher 추출 + `vitest` 단위 테스트 (fetch mock)
- 실패 이벤트를 Sentry로 emit (관찰성 강화)
- Per-IP 대역폭 quota (10MB × 60/min = 600MB/min/IP 최대 버스트 방어)
- **SSRF 강화 (SECURITY)**: `dns.lookup()` 기반 hostname→IP pre-check로 도메인이 private/link-local로 resolve되는 케이스 차단. 현재 설계에서 의도적으로 out-of-scope 처리한 공격 표면
- SVG 전용 safe-proxy 엔드포인트 (DOMPurify 서버사이드 sanitize) — SVG 업로드 수요 발생 시
- rate-limit 응답에 `Cache-Control: no-store` 추가 (일관성)

## 9. Open questions

- 실제 post의 pinimg URL을 구해 Referer 효과 증명 — 구현 후 E2E 단계에서 수행
- 10MB cap이 실제 컨텐츠 분포와 맞는지 — Vercel Log의 `too_large` 이벤트 빈도로 사후 튜닝

---

## Changelog

- 2026-04-17 22:30 — critic 리뷰(2 CRITICAL + 4 MAJOR) 반영 후 5→8 changes로 확장, 재현 실험 근거 추가
- 2026-04-17 22:38 — spec 리뷰 2차(Blocker 4 + Should-fix 4): IPv6 bracket stripping, `::ffff:` IPv4-mapped 차단, proxy self-loop, `Buffer.concat` 명시, SVG whitelist 제외 확정 (직접 `<img src>` 호출 경로 12곳 확인), DNS rebinding 방어 claim downgrade, verification checklist 확대(4→14 항목), SSRF 강화 follow-up 명시
