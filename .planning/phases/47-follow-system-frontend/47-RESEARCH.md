# Phase 47: Follow System Frontend - Research

**Researched:** 2026-03-26
**Domain:** Orval codegen pipeline + React profile data wiring
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- OpenAPI spec update: run backend server via `cargo run` → fetch from `/api-docs/openapi.json` → copy to `packages/api-server/openapi.json` → run `bun run generate:api`
- Regenerated `UserResponse` type will automatically include `followers_count`/`following_count`
- My profile (`ProfileClient.tsx`): wire `useMe()` return value's `followers_count`/`following_count` to `FollowStats` props
- Public profile (`PublicProfileClient.tsx`): wire `useUser(userId)` return value's same fields
- `FollowStats.tsx`: change default parameters from `1234`/`567` to `0`

### Claude's Discretion
- Whether openapi.json can be generated without running the server (cargo utoipa direct generation)
- Loading state handling strategy for FollowStats

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FLLW-04 | OpenAPI spec 업데이트 + Orval 재생성 | Backend dto.rs already has followers_count/following_count; openapi.json is stale; `bun run generate:api` will produce updated UserResponse type |
| FLLW-05 | FollowStats.tsx 하드코딩(1234/567) 제거, 실제 데이터 연결 | FollowStats already accepts followers/following props; useMe()/useUser() return UserResponse which will include the new fields after codegen |
</phase_requirements>

## Summary

Phase 47 is a data-wiring phase with two sequential concerns: (1) refresh the generated API types to include the new follow count fields that were added in Phase 46, then (2) thread those fields from existing hooks into the `FollowStats` component in both profile surfaces.

The Rust `UserResponse` struct in `dto.rs` already declares `followers_count: i64` and `following_count: i64` as of Phase 46, but the checked-in `packages/api-server/openapi.json` was not updated — it still shows the old schema without these fields. All generated TypeScript types (`UserResponse` in `lib/api/generated/models/`) are therefore stale and do not expose the new fields. Running `bun run generate:api` after updating `openapi.json` will regenerate the type and all dependent hooks automatically.

The frontend wiring is straightforward: `ProfileClient.tsx` already calls `useMe()` but passes `<FollowStats className="px-4" />` with no props (falling back to the `1234`/`567` defaults), and `PublicProfileClient.tsx` passes hardcoded `followers={0} following={0}`. Both need one-line prop additions after types are updated. The `FollowStats` component itself requires only a default-value change.

**Primary recommendation:** Update `openapi.json` first (requires backend server), regenerate types, then apply three targeted edits: `FollowStats.tsx` defaults, `ProfileClient.tsx` prop pass-through, `PublicProfileClient.tsx` prop pass-through.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Orval | 8.5.3 | OpenAPI → React Query + Zod codegen | Already configured; `bun run generate:api` is the established command |
| TanStack React Query | ^5 | Data fetching/caching | Already wired via generated hooks |
| TypeScript | strict | Type safety | Errors at compile time when field is missing/mistyped |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| utoipa (Rust) | configured | OpenAPI spec generation from Rust types | Run backend server to expose `/api-docs/openapi.json` |

**Installation:** No new packages required.

**Version verification:** All packages are already in the project. No additions needed for this phase.

## Architecture Patterns

### Recommended Project Structure
No structural changes needed. Files touched:

```
packages/
├── api-server/
│   └── openapi.json              # update (copy from running server)
└── web/
    ├── lib/api/generated/        # regenerated (DO NOT edit manually)
    │   └── models/UserResponse.ts
    └── lib/components/profile/
        └── FollowStats.tsx       # default value change only
    └── app/profile/
        ├── ProfileClient.tsx     # add followers/following props
        └── [userId]/PublicProfileClient.tsx  # replace hardcoded 0s
```

### Pattern 1: OpenAPI Spec Refresh Workflow
**What:** Backend server exposes live spec at `/api-docs/openapi.json`; copy to repo; regenerate
**When to use:** Any time backend types change (FLLW-03 changed `UserResponse`)
**Example:**
```bash
# Step 1 — start backend (requires DB credentials in .env)
cd packages/api-server && cargo run

# Step 2 — fetch spec (backend runs on port 8000 per STATE.md)
curl http://localhost:8000/api-docs/openapi.json \
  > packages/api-server/openapi.json

# Step 3 — regenerate TypeScript types + hooks
cd packages/web && bun run generate:api
```

### Pattern 2: Wiring API Data to FollowStats
**What:** Pass fields from the hook's data object as props
**When to use:** Any component that needs to display UserResponse fields

ProfileClient.tsx (my profile — `useMe()`):
```typescript
// Before (line 377 in ProfileClient.tsx):
<FollowStats className="px-4" />

// After:
<FollowStats
  followers={userData?.followers_count ?? 0}
  following={userData?.following_count ?? 0}
  className="px-4"
/>
```

PublicProfileClient.tsx (hardcoded zeros → real data):
```typescript
// Before (line 257 and 313):
<FollowStats followers={0} following={0} className="px-4" />

// After:
<FollowStats
  followers={userData.followers_count}
  following={userData.following_count}
  className="px-4"
/>
```

### Pattern 3: Loading State for FollowStats
**What:** Show 0 or skeleton while data loads
**When to use:** `userData` is undefined before the query resolves
**Decision (Claude's Discretion):** Use `?? 0` fallback — matches FollowStats default and avoids skeleton flickering. The component already renders with `0` defaults, so no visual change during load. This is the simplest approach and avoids adding a loading prop to `FollowStats`.

In `ProfileClient.tsx`, `userData` is guaranteed non-null past the loading/error guard, so no `??` is needed there. In `PublicProfileClient.tsx` the same guard applies before the return containing JSX.

### Anti-Patterns to Avoid
- **Do not manually edit files in `lib/api/generated/`:** Always regenerate via `bun run generate:api`
- **Do not access `followers_count` before codegen completes:** TypeScript will report an error — the field does not exist in the stale generated type. The error itself is the signal that codegen is needed.
- **Do not run `cargo utoipa` CLI as an alternative:** The project standard uses the live server endpoint. There is no established CLI extraction script in the repo.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TypeScript types for UserResponse | Manual interface with followers_count/following_count | Orval-generated `UserResponse` | Generated type stays in sync; manual types drift |
| Follow count fetching | New hook/fetch call | `useMe()` / `useUser()` already return UserResponse with counts | Zero new API calls needed; counts are embedded in the same response |

**Key insight:** The backend embeds counts directly in `UserResponse` (not as separate endpoints), so no new hooks are needed. Existing `useMe()` and `useUser()` will return the counts once types are regenerated.

## Common Pitfalls

### Pitfall 1: Attempting codegen before openapi.json is updated
**What goes wrong:** `bun run generate:api` reads the stale `openapi.json` (which lacks `followers_count`/`following_count`) and produces types without those fields. TypeScript will then complain that the fields don't exist when wiring props.
**Why it happens:** `openapi.json` is a committed file that must be manually refreshed from the running server.
**How to avoid:** Always update `openapi.json` first, verify it contains `followers_count` and `following_count` in the `UserResponse` schema, then run codegen.
**Warning signs:** After codegen, `packages/web/lib/api/generated/models/UserResponse.ts` still lacks `followersCount`/`followingCount` fields.

### Pitfall 2: TypeScript field name casing mismatch
**What goes wrong:** OpenAPI snake_case `followers_count` is generated as camelCase `followersCount` in TypeScript. Using the wrong casing causes a TS error or silent undefined.
**Why it happens:** Orval converts snake_case JSON keys to camelCase TypeScript property names by default.
**How to avoid:** After regeneration, read the generated `UserResponse` interface to confirm the exact field names before referencing them in component code.
**Warning signs:** `userData.followers_count` compiles but is always `undefined` at runtime — the actual key is `followersCount`.

**Resolution:** Check the generated model file after running codegen. The established project pattern (see `ProfileClient.tsx` line 376: `userData?.bio`) shows snake_case is used directly, suggesting Orval is configured with camelCase disabled or the accessor layer handles it. Confirm in the generated file before writing props.

### Pitfall 3: ProfileClient.tsx uses userData before FollowStats
**What goes wrong:** `FollowStats` is rendered inside the mobile section (line 377) before the `userData` loading guard (line 284). But the guard is early-return, so by the time the JSX runs `userData` is defined.
**Why it happens:** Easy to forget the guard structure when reading the file linearly.
**How to avoid:** `userData` is guaranteed non-null at line 377 because the function returns early at line 284 if `isLoading`. No `?? 0` is strictly needed, but adding it anyway is defensive.

### Pitfall 4: FollowStats appears twice in PublicProfileClient.tsx
**What goes wrong:** Missing one of the two occurrences — one in mobile layout (line 257) and one in desktop layout (line 313).
**Why it happens:** The component is duplicated for mobile/desktop layouts.
**How to avoid:** Search for all occurrences of `<FollowStats` in the file and update both.

## Code Examples

Verified patterns from source files:

### FollowStats.tsx — default value change
```typescript
// Source: packages/web/lib/components/profile/FollowStats.tsx
export function FollowStats({
  followers = 0,   // was 1234
  following = 0,   // was 567
  className,
}: FollowStatsProps) {
```

### ProfileClient.tsx — prop wiring (mobile layout)
```typescript
// userData is non-null here (early return guard above)
<FollowStats
  followers={userData.followers_count}   // or followersCount — verify after codegen
  following={userData.following_count}   // or followingCount
  className="px-4"
/>
```

### PublicProfileClient.tsx — replace hardcoded zeros
```typescript
// userData is non-null here (early return guard above)
<FollowStats
  followers={userData.followers_count}
  following={userData.following_count}
  className="px-4"
/>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded placeholder values (1234/567) | Real API data from UserResponse | Phase 47 | Users see actual follow counts |
| openapi.json missing follow fields | openapi.json includes followers_count/following_count | Phase 47 (FLLW-04) | TypeScript types accurate |

**Deprecated/outdated:**
- `followers={0} following={0}` in PublicProfileClient.tsx: was a Phase 45 placeholder; Phase 47 replaces with real data

## Open Questions

1. **Generated TypeScript field name casing**
   - What we know: Orval typically converts snake_case to camelCase; but existing code in ProfileClient.tsx uses snake_case access patterns (e.g., `userData?.bio`, `userData?.avatar_url`)
   - What's unclear: Whether this project's Orval config preserves snake_case or converts to camelCase
   - Recommendation: After running codegen, read `lib/api/generated/models/UserResponse.ts` and confirm the exact field name (`followers_count` vs `followersCount`) before writing the prop assignments. The existing pattern `userData?.avatar_url` (snake_case) suggests the generated type uses snake_case — but verify.

2. **Server availability for openapi.json refresh**
   - What we know: The established workflow requires running `cargo run` locally and fetching from `http://localhost:8000/api-docs/openapi.json`
   - What's unclear: Whether the developer has the backend env vars configured
   - Recommendation: If the server cannot be started, an alternative is to manually add `followers_count` and `following_count` to the existing `openapi.json` schema's `UserResponse` section (both as `integer/int64, required`). This is a valid short-cut for this specific phase since the field definitions are simple and already confirmed in `dto.rs`.

## Validation Architecture

`nyquist_validation` key is absent from `.planning/config.json` — treat as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (configured in packages/web) |
| Config file | vitest.config.ts or package.json scripts |
| Quick run command | `cd packages/web && bun run test:unit` |
| Full suite command | `cd packages/web && bun run test:unit` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FLLW-04 | Orval regeneration produces UserResponse with followers_count/following_count | manual smoke | Verify `lib/api/generated/models/UserResponse.ts` contains fields | Wave 0 check |
| FLLW-05 | FollowStats receives real values, not hardcoded 1234/567 | TypeScript compile | `cd packages/web && bun run typecheck` | Existing |

### Sampling Rate
- **Per task commit:** `cd packages/web && bun run typecheck`
- **Per wave merge:** `cd packages/web && bun run typecheck && bun run test:unit`
- **Phase gate:** TypeScript clean + no hardcoded 1234/567 before `/gsd:verify-work`

### Wave 0 Gaps
- No new test files needed — codegen verification is a manual file inspection step; TypeScript typecheck catches prop type errors automatically.

*(If TypeScript typecheck passes after wiring, FLLW-05 is proven correct by construction.)*

## Sources

### Primary (HIGH confidence)
- `packages/api-server/src/domains/users/dto.rs` — Confirmed `followers_count: i64` and `following_count: i64` in `UserResponse` struct
- `packages/api-server/openapi.json` — Confirmed `UserResponse` schema is stale (lacks follow count fields)
- `packages/web/lib/components/profile/FollowStats.tsx` — Confirmed hardcoded defaults `1234`/`567`
- `packages/web/app/profile/ProfileClient.tsx` — Confirmed `<FollowStats className="px-4" />` with no data props
- `packages/web/app/profile/[userId]/PublicProfileClient.tsx` — Confirmed `followers={0} following={0}` in both mobile and desktop layouts
- `packages/web/lib/hooks/useProfile.ts` — Confirmed `useMe()` returns `UserResponse`, `useUser()` returns `UserResponse`
- `.planning/phases/46-follow-system-backend/46-01-SUMMARY.md` — Confirmed Phase 46 completed all backend work
- `packages/web/orval.config.ts` — Confirmed `bun run generate:api` command and config

### Secondary (MEDIUM confidence)
- STATE.md accumulated decisions — Backend local dev port is 8000; spec URL: `http://localhost:8000/api-docs/openapi.json`

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools already in use, no new dependencies
- Architecture: HIGH — existing patterns observed in source files directly
- Pitfalls: HIGH — derived from direct code inspection of the files to be modified

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable stack, 30 days)
