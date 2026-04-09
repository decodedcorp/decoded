/**
 * Behavior Store - 클라이언트 측 이벤트 큐 + sendBeacon flush
 *
 * Why: UI 성능에 영향 없는 fire-and-forget 패턴.
 * 이벤트는 메모리 큐에 누적되어 20개 도달 또는 30초마다 sendBeacon으로 일괄 전송된다.
 * authStore를 이 store에서 import 금지 — 인증 확인은 useTrackEvent 훅에서 처리.
 */

import { create } from "zustand";

export type EventType =
  | "post_click"
  | "post_view"
  | "spot_click"
  | "search_query"
  | "category_filter"
  | "dwell_time"
  | "scroll_depth"
  | "affiliate_click";

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

const FLUSH_SIZE = 20;

/**
 * 탭 단위 세션 ID — sessionStorage에 저장하여 탭 간 충돌 방지 (Pitfall 4)
 * typeof window 가드로 SSR 안전 처리 (Pitfall 5)
 */
function getSessionId(): string {
  if (typeof window === "undefined") return "";

  const key = "decoded_session_id";
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;

  const id = crypto.randomUUID();
  sessionStorage.setItem(key, id);
  return id;
}

export const useBehaviorStore = create<BehaviorState>((set, get) => ({
  queue: [],

  track: (payload) => {
    if (typeof window === "undefined") return;

    const item: EventQueueItem = {
      ...payload,
      timestamp: new Date().toISOString(),
      page_path: window.location.pathname,
      session_id: getSessionId(),
    };

    if (process.env.NODE_ENV === "development") {
      console.log("[track]", item.event_type, item);
    }

    set((s) => {
      const next = [...s.queue, item];
      // 큐 크기 임계값 도달 시 자동 flush
      if (next.length >= FLUSH_SIZE) {
        // flush를 비동기로 호출하여 set 중첩 방지
        setTimeout(() => get().flush(), 0);
        return { queue: [] };
      }
      return { queue: next };
    });
  },

  flush: () => {
    const { queue } = get();
    // Pitfall 1: 빈 큐 전송 방지
    if (queue.length === 0) return;
    if (typeof window === "undefined") return;

    if (process.env.NODE_ENV === "development") {
      console.log("[flush] sending", queue.length, "events");
    }

    const blob = new Blob([JSON.stringify(queue)], {
      type: "application/json",
    });
    // sendBeacon: 비차단, 페이지 언로드 후에도 전송 보장
    navigator.sendBeacon("/api/v1/events", blob);
    set({ queue: [] });
  },
}));

/**
 * 30초 주기 flush + 페이지 언로드 시 flush 타이머를 초기화한다.
 * layout.tsx 또는 providers.tsx의 useEffect에서 호출:
 *   useEffect(() => initFlushTimer(), []);
 *
 * typeof window 가드로 SSR 안전 처리 (Pitfall 5)
 */
export function initFlushTimer(): () => void {
  if (typeof window === "undefined") return () => {};

  const interval = setInterval(() => {
    useBehaviorStore.getState().flush();
  }, 30_000);

  const handleUnload = () => useBehaviorStore.getState().flush();

  // visibilitychange: 탭 전환/최소화 감지 (pagehide보다 넓은 커버리지)
  window.addEventListener("visibilitychange", handleUnload);
  // pagehide: iOS Safari unload 대체 이벤트
  window.addEventListener("pagehide", handleUnload);

  return () => {
    clearInterval(interval);
    window.removeEventListener("visibilitychange", handleUnload);
    window.removeEventListener("pagehide", handleUnload);
  };
}
