/**
 * useTrackScrollDepth - 스크롤 깊이 마일스톤 추적 훅
 *
 * Why: 유저가 페이지를 얼마나 읽었는지 측정.
 * 25/50/75/100% 마일스톤 도달 시 각 1회만 발화 (Pitfall 3 방지).
 * passive: true로 스크롤 성능 영향 최소화.
 */

import { useEffect, useRef } from "react";
import { useTrackEvent } from "./useTrackEvent";

const MILESTONES = [25, 50, 75, 100] as const;

export function useTrackScrollDepth() {
  const track = useTrackEvent();
  // Pitfall 3: Set으로 각 마일스톤 1회만 발화 보장
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
            event_type: "scroll_depth",
            metadata: { depth_pct: milestone },
          });
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [track]);
}
