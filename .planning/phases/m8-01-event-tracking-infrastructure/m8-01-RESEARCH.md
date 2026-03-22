# Phase m8-01: Event Tracking Infrastructure - Research

**Researched:** 2026-03-12
**Domain:** Behavioral analytics — Supabase event ingest, client-side event queue, IntersectionObserver dwell time, scroll depth tracking, UI cleanup
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Event Payload Design**
- Standard payload: `event_type` + `entity_id` + `timestamp` + `page_path` + `session_id`
- `session_id` is tab-scoped UUID (`crypto.randomUUID()`, stored in `sessionStorage`, expires when tab closes)
- Event type naming: snake_case — `post_click`, `category_filter`, `scroll_depth`, `dwell_time`, `search_query`, `spot_click`
- `metadata` field is JSONB — per-event additional data stored flexibly (GIN index)
- `dwell_time` event: fire after 3-second threshold, record actual dwell ms in metadata (preserves intensity)
- `search_query` event: store actual query string in metadata (needed by m8-03 DYNUI-03)
- `sendBeacon` failure: silent drop — events are best-effort, zero UI impact
- Single `user_events` table + `metadata` JSONB (no per-event-type columns)

**Privacy & Consent**
- No separate consent banner — login = consent under Korean PIPA baseline
- User data deletion deferred to future phase
- 30-day TTL via `pg_cron` scheduled delete (daily job, `created_at < now() - interval '30 days'`)
- Simple privacy disclosure placeholder page included

**DataSourcesCard Cleanup (CLEAN-01)**
- Delete `DataSourcesCard.tsx` entirely (not just the buttons)
- Remove import and render from `ProfileClient.tsx` (lines 26 and 367/390)
- Remove barrel export from `lib/components/profile/index.ts` (line 22)
- Keep `SocialAccount` fetch logic in `lib/supabase/queries/profile.ts` — DB table still exists
- No layout re-arrangement after removal — remaining cards reflow naturally

**Dev Observability**
- Dev logging: `process.env.NODE_ENV === 'development'` guard for console output
- Production monitoring: Supabase dashboard only (no code required)
- `behaviorStore` API: expose only `track()` function — hide internal queue state
- `useTrackEvent` hook: `const track = useTrackEvent(); track('post_click', { entity_id })`

**Zero New npm Packages**
- All tracking/recommendation built on existing: Supabase + Zustand + React Query
- No third-party analytics SDK (no PostHog, no Mixpanel, no Amplitude)

### Claude's Discretion
- Whether to track non-logged-in users (logged-in only vs anonymous UUID)
- `scroll_depth` recording strategy (fire at each milestone vs record max depth on page leave)
- Whether to include `source` field in `post_click` metadata (`'feed'` | `'explore'` | etc.)
- Specific firing logic for `scroll_depth` event

### Deferred Ideas (OUT OF SCOPE)
- User data deletion API (`DELETE /api/v1/events/me`)
- Terms of Service / Privacy Policy body update (pre-launch blocker, tracked in STATE.md)
- Admin event statistics endpoint (deferred to m8-03)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TRACK-01 | 유저가 콘텐츠와 상호작용하면 이벤트가 자동 기록된다 (`post_view`, `post_click`, `spot_click`, `search_query`, `category_filter`) | API route `/api/v1/events` + `behaviorStore.track()` + component-level event hooks |
| TRACK-02 | 유저가 피드 카드를 일정 시간 이상 보면 체류시간이 기록된다 (IntersectionObserver + visibility timer) | `useTrackDwellTime` hook using IntersectionObserver with 3s timer, same pattern as `useScrollAnimation` |
| TRACK-03 | 유저가 페이지를 스크롤하면 깊이 마일스톤이 기록된다 (25/50/75/100%) | Scroll event listener + `document.documentElement.scrollHeight` math, fire via `behaviorStore.track()` |
| TRACK-04 | 이벤트가 비동기 배치로 전송되어 UI 성능에 영향을 주지 않는다 (메모리 큐 + sendBeacon) | Zustand `behaviorStore` with in-memory array queue, flush at 20 events OR 30s timer via `navigator.sendBeacon` |
| CLEAN-01 | `DataSourcesCard.tsx`의 미구현 인스타/핀터레스트 연동 UI가 제거된다 | File exists at `lib/components/profile/DataSourcesCard.tsx` — 3 touch points identified |
</phase_requirements>

---

## Summary

Phase m8-01 builds behavioral tracking infrastructure from scratch within the existing project constraints. The core challenge is non-blocking event delivery: events must never stall the main thread. The proven solution is an in-memory queue in Zustand (`behaviorStore`) that flushes via `navigator.sendBeacon` to a Next.js API route which writes directly to Supabase — no external services, no new packages.

The three tracking behaviors (click events, dwell time, scroll depth) use two browser APIs already in the codebase: IntersectionObserver (used in `useScrollAnimation` and `ThiingsGrid`) and scroll event listeners. The `useTrackDwellTime` hook follows the same observer pattern as `useScrollAnimation.ts` but adds a `setTimeout` for the 3-second threshold. Scroll depth uses a `window` scroll listener with milestone state tracking.

The DataSourcesCard cleanup (CLEAN-01) is surgical: delete one file, remove 3 references (import in ProfileClient.tsx line 26, render in ProfileClient.tsx lines 367/390, barrel export in profile/index.ts line 22). No visual regression expected since the card is standalone in the layout.

**Primary recommendation:** Build in wave order — DB schema first (m8-01-01), then behaviorStore + hooks (m8-01-02), then wire into components (m8-01-03), then cleanup (m8-01-04). This order ensures each wave has a testable artifact before the next begins.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | 2.86.0 | DB insert for `user_events` table | Already in project, server client pattern established |
| `zustand` | 4.5.7 | `behaviorStore` in-memory queue | Existing store pattern (`authStore`, `filterStore`) |
| `next/server` (`NextRequest`, `NextResponse`) | 16.0.7 | `/api/v1/events` route handler | Existing API route pattern |
| `navigator.sendBeacon` | Browser API | Non-blocking event flush | Built-in, zero deps, designed for analytics beacons |
| `IntersectionObserver` | Browser API | Dwell time visibility tracking | Already used in `useScrollAnimation.ts` and `ThiingsGrid.tsx` |
| `crypto.randomUUID()` | Browser API | Tab-scoped session ID | Built-in, no deps |
| `sessionStorage` | Browser API | Persist session_id per tab | Built-in, tab-scoped (cleared on tab close) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@supabase/auth-helpers-nextjs` | 0.15.0 | `createSupabaseServerClient()` in route handler | Auth verification in `/api/v1/events` POST |
| `@tanstack/react-query` | 5.90.11 | Not used for fire-and-forget events | Do NOT use React Query for event tracking — it adds overhead |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `sendBeacon` | `fetch` with `keepalive: true` | `sendBeacon` is specifically designed for analytics on page unload; `keepalive` is a fallback alternative but less reliable across all browsers |
| Zustand queue | React Context | Zustand avoids React render overhead for queue mutations — correct for a side-effects store |
| Direct Supabase from client | API route intermediary | API route allows server-side auth verification and rate limiting — consistent with existing pattern |

**Installation:** No new packages needed — zero new dependencies.

---

## Architecture Patterns

### Recommended Project Structure
```
packages/web/
├── app/api/v1/events/
│   └── route.ts              # POST /api/v1/events — ingest endpoint
├── lib/
│   ├── stores/
│   │   └── behaviorStore.ts  # In-memory queue + flush logic
│   ├── hooks/
│   │   ├── useTrackEvent.ts  # Public track() hook
│   │   ├── useTrackDwellTime.ts  # IntersectionObserver + timer
│   │   └── useTrackScrollDepth.ts  # Scroll milestone tracker
│   └── supabase/
│       └── queries/
│           └── events.ts     # insertEvents() query function
└── lib/components/profile/
    └── DataSourcesCard.tsx   # DELETE THIS FILE
```

### Pattern 1: Zustand Queue Store
**What:** `behaviorStore` holds an array of pending events. `track()` appends to the array, `flush()` sends via sendBeacon and empties the queue.
**When to use:** All event tracking in the app calls `track()` — never call the API directly from components.

```typescript
// lib/stores/behaviorStore.ts
import { create } from 'zustand';

export type EventType =
  | 'post_click'
  | 'post_view'
  | 'spot_click'
  | 'search_query'
  | 'category_filter'
  | 'dwell_time'
  | 'scroll_depth';

export interface TrackEventPayload {
  event_type: EventType;
  entity_id?: string;
  metadata?: Record<string, unknown>;
}

interface EventQueueItem extends TrackEventPayload {
  timestamp: string;
  page_path: string;
  session_id: string;
}

interface BehaviorState {
  queue: EventQueueItem[];
  track: (payload: TrackEventPayload) => void;
  flush: () => void;
}

// Session ID — tab-scoped, lazy init
function getSessionId(): string {
  const key = 'decoded_session_id';
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  sessionStorage.setItem(key, id);
  return id;
}

const FLUSH_SIZE = 20;

export const useBehaviorStore = create<BehaviorState>((set, get) => ({
  queue: [],

  track: (payload) => {
    const item: EventQueueItem = {
      ...payload,
      timestamp: new Date().toISOString(),
      page_path: typeof window !== 'undefined' ? window.location.pathname : '',
      session_id: getSessionId(),
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('[track]', item.event_type, item);
    }

    set((s) => {
      const next = [...s.queue, item];
      // Auto-flush at size threshold
      if (next.length >= FLUSH_SIZE) {
        get().flush();
        return { queue: [] };
      }
      return { queue: next };
    });
  },

  flush: () => {
    const { queue } = get();
    if (queue.length === 0) return;

    if (process.env.NODE_ENV === 'development') {
      console.log('[flush] sending', queue.length, 'events');
    }

    const blob = new Blob([JSON.stringify(queue)], { type: 'application/json' });
    // sendBeacon: non-blocking, survives page unload
    navigator.sendBeacon('/api/v1/events', blob);
    set({ queue: [] });
  },
}));
```

### Pattern 2: Timer-based Flush (30s interval)
**What:** A provider component or hook sets up a `setInterval` to flush the queue every 30 seconds and on page unload.
**When to use:** Complement to the size-based flush — ensures events aren't stuck in queue for slow users.

```typescript
// In a provider or layout useEffect:
useEffect(() => {
  const interval = setInterval(() => {
    useBehaviorStore.getState().flush();
  }, 30_000);

  const handleUnload = () => useBehaviorStore.getState().flush();
  window.addEventListener('visibilitychange', handleUnload); // page hide
  window.addEventListener('pagehide', handleUnload);         // iOS Safari

  return () => {
    clearInterval(interval);
    window.removeEventListener('visibilitychange', handleUnload);
    window.removeEventListener('pagehide', handleUnload);
  };
}, []);
```

### Pattern 3: useTrackEvent Hook
**What:** Thin hook that accesses `behaviorStore.track` — guards against non-logged-in users.
**When to use:** Use this in every component that fires events. Do NOT import `useBehaviorStore` directly in components.

```typescript
// lib/hooks/useTrackEvent.ts
import { useBehaviorStore } from '@/lib/stores/behaviorStore';
import { useAuthStore } from '@/lib/stores/authStore';
import type { TrackEventPayload } from '@/lib/stores/behaviorStore';

export function useTrackEvent() {
  const track = useBehaviorStore((s) => s.track);
  const user = useAuthStore((s) => s.user);

  return (payload: TrackEventPayload) => {
    // Only track logged-in users (Claude's discretion: logged-in only)
    if (!user) return;
    track(payload);
  };
}
```

### Pattern 4: Dwell Time Hook
**What:** Creates an IntersectionObserver that starts a timer when element enters viewport. If element remains visible for ≥3 seconds, records `dwell_time` with actual ms.
**When to use:** Attach to individual FeedCard components.

```typescript
// lib/hooks/useTrackDwellTime.ts
import { useEffect, useRef } from 'react';
import { useTrackEvent } from './useTrackEvent';

const DWELL_THRESHOLD_MS = 3_000;

export function useTrackDwellTime(entityId: string) {
  const ref = useRef<HTMLElement | null>(null);
  const track = useTrackEvent();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startRef.current = Date.now();
          timerRef.current = setTimeout(() => {
            const dwellMs = Date.now() - (startRef.current ?? Date.now());
            track({ event_type: 'dwell_time', entity_id: entityId, metadata: { dwell_ms: dwellMs } });
          }, DWELL_THRESHOLD_MS);
        } else {
          if (timerRef.current) clearTimeout(timerRef.current);
          startRef.current = null;
        }
      },
      { threshold: 0.5 } // 50% visible = "watching"
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [entityId, track]);

  return ref;
}
```

### Pattern 5: Scroll Depth Hook
**What:** Tracks scroll progress as percentage of page height. Fires milestone events at 25/50/75/100% — each milestone fires only once per page load.
**When to use:** Single instance per page, placed in layout or page component.

```typescript
// lib/hooks/useTrackScrollDepth.ts
import { useEffect, useRef } from 'react';
import { useTrackEvent } from './useTrackEvent';

const MILESTONES = [25, 50, 75, 100] as const;

export function useTrackScrollDepth() {
  const track = useTrackEvent();
  const firedRef = useRef(new Set<number>());

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      const pct = Math.round((scrolled / total) * 100);

      for (const milestone of MILESTONES) {
        if (pct >= milestone && !firedRef.current.has(milestone)) {
          firedRef.current.add(milestone);
          track({
            event_type: 'scroll_depth',
            metadata: { depth_pct: milestone },
          });
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [track]);
}
```

### Pattern 6: API Route — /api/v1/events
**What:** Next.js Route Handler that receives the batched event array and inserts into Supabase.
**When to use:** Only receives POST from `sendBeacon`. Does NOT proxy to external backend — writes directly to Supabase (same pattern as admin routes).

```typescript
// app/api/v1/events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const events = await request.json();
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ ok: true }); // sendBeacon ignores response
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Silent 401 — sendBeacon doesn't retry anyway
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const rows = events.map((e) => ({
      user_id: user.id,
      event_type: e.event_type,
      entity_id: e.entity_id ?? null,
      session_id: e.session_id,
      page_path: e.page_path,
      metadata: e.metadata ?? null,
      created_at: e.timestamp,
    }));

    const { error } = await supabase.from('user_events').insert(rows);

    if (error && process.env.NODE_ENV === 'development') {
      console.error('[events API] insert error:', error);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[events API] error:', err);
    }
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
```

### Pattern 7: Supabase DB Schema
**What:** `user_events` table with RLS and GIN index on `metadata`.
**When to use:** Wave 1, Plan m8-01-01. Apply via Supabase dashboard SQL editor or migration file.

```sql
-- Create user_events table
CREATE TABLE IF NOT EXISTS public.user_events (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type  text NOT NULL,
  entity_id   text,
  session_id  text NOT NULL,
  page_path   text NOT NULL,
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- GIN index for metadata JSONB queries (m8-02 affinity scoring)
CREATE INDEX IF NOT EXISTS user_events_metadata_gin
  ON public.user_events USING gin(metadata);

-- Index for per-user time-range queries
CREATE INDEX IF NOT EXISTS user_events_user_created
  ON public.user_events(user_id, created_at DESC);

-- Index for event_type filtering
CREATE INDEX IF NOT EXISTS user_events_type
  ON public.user_events(event_type);

-- RLS: users can only insert their own events
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own events"
  ON public.user_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own events"
  ON public.user_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role bypass (for admin queries in m8-03)
CREATE POLICY "Service role full access"
  ON public.user_events
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 30-day TTL via pg_cron (requires pg_cron extension enabled in Supabase)
-- Run this AFTER enabling pg_cron in Supabase dashboard:
SELECT cron.schedule(
  'expire-user-events',
  '0 3 * * *',  -- daily at 3am UTC
  $$DELETE FROM public.user_events WHERE created_at < now() - interval '30 days'$$
);
```

### Anti-Patterns to Avoid
- **Calling fetch() from track():** Fires a new HTTP request per event — blocks network and creates thundering herd. Use sendBeacon + queue.
- **Storing queue in localStorage:** Survives refreshes but creates cross-tab collision for session_id. Use sessionStorage for session_id, in-memory for queue.
- **Reading auth state in behaviorStore:** behaviorStore should be pure queue logic. Auth check belongs in `useTrackEvent` hook only.
- **Using React Query for event submission:** React Query is for data fetching with cache semantics. Fire-and-forget analytics don't need cache, retry, or loading state.
- **Calling flush() synchronously in event handler:** Always fire `track()` which accumulates — never call `flush()` in click handlers.
- **SSR rendering behaviorStore:** `sessionStorage` and `navigator.sendBeacon` don't exist server-side. Guard with `typeof window !== 'undefined'` in store init.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Non-blocking HTTP for analytics | Custom fetch with AbortController | `navigator.sendBeacon` | sendBeacon is queued by browser, survives page unload, non-blocking by spec |
| Per-element visibility with timer | Custom scroll/position math | `IntersectionObserver` | Already used in `useScrollAnimation.ts` — same API, same cleanup pattern |
| Auth-aware session tracking | Custom session table | `crypto.randomUUID()` + `sessionStorage` | Tab-scoped sessions need no server storage; client-side UUID is sufficient |
| Event deduplication | Bloom filter / server-side dedup | Accept duplicates | Duplicate events within a session are negligible; m8-02 scoring uses aggregates |
| Scheduled cleanup | Custom cron service | `pg_cron` in Supabase | Supabase has pg_cron built in — just a SQL schedule call |

**Key insight:** Analytics events are best-effort by design. Every complexity added to guarantee delivery (retries, localStorage, service worker queue) trades UI performance for data completeness. Best-effort with sendBeacon is the industry standard for non-critical behavioral data.

---

## Common Pitfalls

### Pitfall 1: sendBeacon Sends Empty Queue on Timer
**What goes wrong:** The 30s `setInterval` fires `flush()` when queue is empty, sending a `[]` to the API route.
**Why it happens:** Timer fires regardless of queue state.
**How to avoid:** Check `queue.length === 0` at top of `flush()` and return early.
**Warning signs:** API logs showing POST with body `[]`.

### Pitfall 2: Double-fire on Dwell Time
**What goes wrong:** IntersectionObserver fires callback twice for same element (enter → timer → re-observe), recording two `dwell_time` events.
**Why it happens:** `unobserve()` not called after first fire; or element flickers at threshold boundary.
**How to avoid:** Call `observer.unobserve(el)` inside the `setTimeout` callback after tracking, OR use a `hasFired` ref per element.
**Warning signs:** Two `dwell_time` rows in `user_events` for same entity_id within same session within seconds.

### Pitfall 3: scroll_depth Fires on Every Scroll Event
**What goes wrong:** 25% milestone event fires hundreds of times as user scrolls.
**Why it happens:** Missing milestone deduplication.
**How to avoid:** Use a `Set<number>` ref (`firedRef`) that tracks fired milestones — documented in the hook pattern above.
**Warning signs:** Thousands of `scroll_depth` rows per session in Supabase.

### Pitfall 4: session_id Cross-Contamination Between Tabs
**What goes wrong:** Multiple tabs share the same session_id, making tab-scoped analysis impossible.
**Why it happens:** Using `localStorage` instead of `sessionStorage` for session_id.
**How to avoid:** Use `sessionStorage` exclusively for session_id — tab-scoped by browser spec.
**Warning signs:** Two simultaneous sessions with identical session_ids in `user_events`.

### Pitfall 5: SSR Crash from Browser-Only APIs
**What goes wrong:** `sessionStorage`, `crypto.randomUUID()`, `navigator.sendBeacon`, or `window.scrollY` throw on the server during SSR.
**Why it happens:** Next.js App Router executes component code server-side for SSR.
**How to avoid:** `behaviorStore` functions that access browser APIs must check `typeof window !== 'undefined'`. Hooks use `useEffect` (client-only by spec).
**Warning signs:** `ReferenceError: sessionStorage is not defined` in server logs.

### Pitfall 6: RLS Blocks API Route Insert
**What goes wrong:** Events fail silently with Supabase RLS error — `auth.uid()` returns null in server-side client.
**Why it happens:** `createSupabaseServerClient()` reads auth from cookies. `sendBeacon` sends cookies if same-origin — this should work, but verify cookie is sent.
**How to avoid:** Test the insert explicitly in development. Log Supabase errors in dev mode. Alternatively, use service role key in the API route and trust the auth check done before insert.
**Warning signs:** API returns 200 but `user_events` table stays empty.

### Pitfall 7: DataSourcesCard Removal Breaks useSocialAccounts Hook
**What goes wrong:** Removing `DataSourcesCard` but leaving `useSocialAccounts` import in `ProfileClient.tsx` causes a TypeScript/linting error.
**Why it happens:** `ProfileClient.tsx` imports `useSocialAccounts` hook (line 36) and passes `socialAccounts` to `DataSourcesCard`. Removing the card but not the hook usage leaves dead code.
**How to avoid:** Remove both the `DataSourcesCard` render AND the `useSocialAccounts` hook call and its import.
**Warning signs:** TypeScript error `'socialAccounts' is declared but its value is never read`.

---

## Code Examples

### Verified: IntersectionObserver cleanup pattern (from codebase)
```typescript
// Source: packages/web/lib/hooks/useScrollAnimation.ts (existing)
useEffect(() => {
  observerRef.current = new IntersectionObserver(
    (entries) => { /* callback */ },
    { threshold, rootMargin, root }
  );
  return () => {
    observerRef.current?.disconnect();  // cleanup on unmount
  };
}, [threshold, rootMargin, root, ...]);
```

### Verified: Zustand create() pattern (from codebase)
```typescript
// Source: packages/web/lib/stores/authStore.ts (existing)
export const useAuthStore = create<AuthState>((set, get) => ({
  // state
  user: null,
  // actions
  initialize: async () => { /* ... */ },
}));

// Selectors (exported separately)
export const selectUser = (state: AuthState) => state.user;
```

### Verified: Supabase server client in Route Handler (from codebase)
```typescript
// Source: packages/web/app/api/v1/admin/dashboard/today/route.ts (existing)
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // ...
}
```

### Verified: dev-only logging pattern (from codebase)
```typescript
// Source: packages/web/lib/supabase/queries/profile.ts (existing)
if (process.env.NODE_ENV === 'development') {
  console.error('[fetchPostsByUserProfile] Error:', JSON.stringify(error, null, 2));
}
```

### Verified: ProfileClient DataSourcesCard reference points
```
// File: packages/web/app/profile/ProfileClient.tsx
// Line 26:  import DataSourcesCard
// Line 36:  import useSocialAccounts
// Line 367: <DataSourcesCard accounts={socialAccounts} />  (mobile layout)
// Line 390: <DataSourcesCard accounts={socialAccounts} />  (desktop layout)

// File: packages/web/lib/components/profile/index.ts
// Line 22:  export { DataSourcesCard } from "./DataSourcesCard";
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `fetch()` analytics per event | `sendBeacon` + queue | Industry standard since 2016 | Zero UI blocking, survives page unload |
| Third-party analytics SDK | Self-hosted Supabase ingest | Project decision (STATE.md) | Zero new dependencies, full data ownership |
| localStorage for queue | In-memory (Zustand) | Project decision | Simpler, no quota issues, session-scoped |
| Interval polling for scroll | Passive event listener | Browser performance best practice | `{ passive: true }` prevents scroll janking |

**Deprecated/outdated:**
- `unload` event for final flush: Replaced by `visibilitychange` + `pagehide`. Chrome/Safari have deprecated reliable `unload` execution for performance. Use `visibilitychange` (document.hidden) and `pagehide` instead.

---

## Open Questions

1. **pg_cron enabled in Supabase project?**
   - What we know: Supabase projects support pg_cron as an extension
   - What's unclear: Whether it's already enabled in this specific project
   - Recommendation: Check Supabase dashboard → Database → Extensions during m8-01-01 execution. If not enabled, the TTL cleanup SQL must be deferred or done manually.

2. **sendBeacon with cookies (RLS auth)**
   - What we know: sendBeacon sends same-origin cookies automatically in modern browsers
   - What's unclear: Whether Supabase's cookie-based auth (`createSupabaseServerClient`) works with sendBeacon requests
   - Recommendation: Test in m8-01-01 development. Fallback: use `supabaseAdmin` (service role) in the route and trust the server-side auth check — remove RLS dependency from the ingest path.

3. **Anonymous / non-logged-in tracking (Claude's Discretion)**
   - What we know: All event types are currently only meaningful for logged-in users
   - Recommendation: **Track logged-in users only.** `useTrackEvent` returns a no-op function when `user === null`. This is simpler, privacy-safe, and the personalization use case (m8-02) requires user_id anyway. Anonymous tracking would require a separate identity resolution step.

4. **scroll_depth: per-milestone vs max-on-leave (Claude's Discretion)**
   - Recommendation: **Per milestone, fire-once.** Simpler implementation, no need for page lifecycle event. Fires immediately when threshold is crossed, which is more useful for real-time analysis. The `firedRef` Set prevents duplicates within a session.

5. **post_click source field (Claude's Discretion)**
   - Recommendation: **Include it.** Add `source?: 'feed' | 'explore' | 'search' | 'profile'` to click event metadata. It's a cheap addition during component integration (m8-01-03) and provides essential context for m8-02 affinity scoring. Post-click behavior means very different things from feed vs. search.

---

## Validation Architecture

> `workflow.nyquist_validation` key is absent from `.planning/config.json` — treated as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright (found at `packages/web/playwright.config.ts`) |
| Config file | `packages/web/playwright.config.ts` |
| Quick run command | `cd packages/web && npx playwright test --project=chromium` |
| Full suite command | `cd packages/web && npx playwright test` |

No unit test framework (Jest/Vitest) detected. The project uses Playwright for e2e/visual tests. Behavioral tracking stores and hooks are best validated via:
1. Manual smoke tests in development (dev logging to console)
2. Supabase dashboard verification (rows in `user_events` table)
3. Playwright e2e for CLEAN-01 verification (DataSourcesCard absence)

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TRACK-01 | Click events recorded in Supabase | Manual smoke (dev console + Supabase table) | N/A — no unit test framework | N/A |
| TRACK-02 | 3s dwell event fires | Manual smoke (hover 3s + check dev console) | N/A — IntersectionObserver hard to e2e | N/A |
| TRACK-03 | Scroll milestones fire once each | Manual smoke (scroll page + check dev console) | N/A | N/A |
| TRACK-04 | UI not blocked, events arrive in batch | Manual smoke (check batch size in dev logs) | N/A | N/A |
| CLEAN-01 | DataSourcesCard absent from profile | Playwright e2e | `cd packages/web && npx playwright test --grep "DataSourcesCard"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** Dev console verification (NODE_ENV=development logging)
- **Per wave merge:** Supabase dashboard — verify `user_events` rows exist after manual interaction
- **Phase gate:** CLEAN-01 Playwright test green + manual smoke of all 4 TRACK requirements before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `packages/web/tests/profile-cleanup.spec.ts` — Playwright test asserting DataSourcesCard is not rendered on `/profile` page (covers CLEAN-01)
- [ ] No unit test framework — TRACK-01 through TRACK-04 rely on dev-mode console logging and manual Supabase table inspection. This is acceptable given the fire-and-forget nature of analytics events.

---

## Sources

### Primary (HIGH confidence)
- Codebase analysis — `packages/web/lib/stores/authStore.ts`, `useScrollAnimation.ts`, `app/api/v1/admin/dashboard/today/route.ts`, `ProfileClient.tsx`, `profile/index.ts`, `DataSourcesCard.tsx` — all verified by direct Read
- `packages/web/lib/supabase/server.ts` — `createSupabaseServerClient` pattern confirmed
- `.planning/phases/m8-01-event-tracking-infrastructure/m8-01-CONTEXT.md` — all locked decisions

### Secondary (MEDIUM confidence)
- `navigator.sendBeacon` MDN specification — fire-and-forget POST, same-origin cookies, non-blocking guarantee
- Supabase pg_cron — available as extension in Supabase projects (standard feature)
- IntersectionObserver spec — `threshold: 0.5` for "actively viewing" semantic

### Tertiary (LOW confidence)
- sendBeacon + cookie interaction with `createSupabaseServerClient`: Needs runtime verification — flagged as Open Question #2

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in package.json, no new deps
- Architecture: HIGH — patterns copied directly from existing codebase (`authStore`, `useScrollAnimation`, admin route handlers)
- Pitfalls: HIGH — identified from direct code inspection (DataSourcesCard removal touch points, SSR guards, RLS pattern)
- DB Schema: MEDIUM — `pg_cron` availability needs verification at execution time

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable stack — Supabase, Zustand, Next.js versions locked)
