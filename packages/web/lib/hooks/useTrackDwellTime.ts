/**
 * useTrackDwellTime - IntersectionObserver 기반 체류시간 추적 훅
 *
 * Why: 유저가 카드를 실제로 보고 있는지 측정.
 * 50% 이상 가시 상태로 3초 경과 시 dwell_time 이벤트 기록.
 * 3초 전 이탈 시 타이머 취소 — 실제 시청에만 발화.
 * Pitfall 2 방지: 최초 1회 발화 후 unobserve() 호출.
 */

import { useEffect, useRef } from "react";
import { useTrackEvent } from "./useTrackEvent";

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
            track({
              event_type: "dwell_time",
              entity_id: entityId,
              metadata: { dwell_ms: dwellMs },
            });
            // Pitfall 2: 최초 1회 발화 후 재발화 방지
            observer.unobserve(el);
          }, DWELL_THRESHOLD_MS);
        } else {
          // 뷰포트 이탈 시 타이머 취소
          if (timerRef.current) clearTimeout(timerRef.current);
          startRef.current = null;
        }
      },
      { threshold: 0.5 } // 50% 가시 = "시청 중"
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [entityId, track]);

  return ref;
}
