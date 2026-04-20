# Brief — #229 image-proxy HTTP/Pinterest/대용량 실패

**브랜치**: `fix/229-image-proxy-robustness`
**워크트리**: `.worktrees/229-image-proxy` (PORT=3004)
**작성일**: 2026-04-17 (operator 세션에서 사전 분석)
**다음 단계**: Superpowers `brainstorming` → `writing-plans` → TDD 구현

## 이슈 요약

Post 상세 페이지의 외부 이미지가 깨져 표시됨. `/_next/image?url=/api/v1/image-proxy?url=…` 체인에서 실패.

3가지 실패 패턴:
1. **HTTP 도메인** (`nowfromthen.com`) → 400 Bad Request
2. **Pinterest** (`i.pinimg.com`) → 400 Bad Request (hotlink protection 추정)
3. **대용량** (`celine.com`, `hawtcelebs.com`, `w=1920`) → naturalWidth: 0

## 현재 구현 (59 LOC)

`packages/web/app/api/v1/image-proxy/route.ts`

```ts
const response = await fetch(url, {
  headers: { Accept: "image/*" },  // ← UA 없음, Referer 없음, timeout 없음
});
```

갭:
- L31: User-Agent 헤더 없음 → 일부 사이트가 bot 차단
- L31: Referer 없음 → Pinterest hotlink 거절
- L31: timeout/AbortController 없음 → 대용량 시 hang
- L35-39: upstream 실패 시 구조화 오류 없음
- HTTP/HTTPS 구분 없음 (mixed content 힌트 무시)

## 수정 범위 (단일 파일)

1. User-Agent 브랜드 헤더 (`Mozilla/5.0 ... decoded-image-proxy/1.0`)
2. 도메인별 Referer 주입 테이블
   - `i.pinimg.com`, `pinterest.*` → `https://www.pinterest.com/`
   - 나머지 → 생략 또는 URL 기반 origin
3. HTTP → HTTPS 승격 시도 (HTTPS 실패 시 HTTP fallback)
4. `AbortController` + 10s timeout
5. `Content-Length` 상한 (10MB) 가드, 초과 시 400 + structured error
6. 실패 응답: `{ error, code, upstream_status, url }` JSON

## 검증 체크리스트

- [ ] localhost:3004 `/posts/92288cc9-5fce-4584-8fc9-2594b7d6a77f` 접속
- [ ] DevTools Network:
  - [ ] `nowfromthen.com` → 200 (HTTPS 승격 성공) 또는 400 + 명시 본문
  - [ ] `i.pinimg.com` → 200 (Referer 주입 성공)
  - [ ] `celine.com` w=1920 → 200 or timeout 오류
- [ ] `bun run lint` 통과
- [ ] 단위 테스트 추가 가능 여부 검토 (route handler fetch mocking)

## 참고 파일

- `packages/web/lib/image-loader.ts` — 프록시로 라우팅하는 custom loader (수정 불필요)
- `packages/web/next.config.js` — remotePatterns 확인 (수정 불필요 예상)
- PR #226 — Related News 섹션 placeholder (프론트 방어선, 이 이슈는 infra 레이어)

## Operator와 조율할 항목

- 없음 (단독 처리 가능)

## Coordination

- 다른 워크트리와 파일 겹침 없음
- 머지 순서: PR 준비되면 dev에 직접 (qa는 모아서 dev에서)
