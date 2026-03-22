/**
 * useTrackEvent - 인증 가드가 포함된 이벤트 추적 훅
 *
 * Why: 컴포넌트가 직접 useBehaviorStore를 import하지 않도록 캡슐화.
 * 비로그인 유저는 no-op 반환 — 개인화는 user_id가 필수이므로 로그인 유저만 추적.
 */

import { useBehaviorStore } from "@/lib/stores/behaviorStore";
import { useAuthStore } from "@/lib/stores/authStore";
import type { TrackEventPayload } from "@/lib/stores/behaviorStore";

export function useTrackEvent() {
  const track = useBehaviorStore((s) => s.track);
  const user = useAuthStore((s) => s.user);

  return (payload: TrackEventPayload) => {
    // 비로그인 유저 추적 안 함 — m8-02 개인화는 user_id 필수
    if (!user) return;
    track(payload);
  };
}
