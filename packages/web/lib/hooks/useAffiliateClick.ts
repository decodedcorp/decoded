/**
 * useAffiliateClick - 어필리에이트 링크 클릭 추적 훅
 *
 * 기존 behaviorStore의 이벤트 큐를 활용하여
 * affiliate_click 이벤트를 기록합니다.
 */

import { useCallback } from "react";
import { useTrackEvent } from "./useTrackEvent";

interface AffiliateClickParams {
  solutionId: string;
  spotId?: string;
  postId?: string;
  url: string;
}

export function useAffiliateClick() {
  const trackEvent = useTrackEvent();

  const trackAffiliateClick = useCallback(
    ({ solutionId, spotId, postId, url }: AffiliateClickParams) => {
      trackEvent({
        event_type: "affiliate_click",
        entity_id: solutionId,
        metadata: {
          url,
          spot_id: spotId,
          post_id: postId,
          domain: extractDomain(url),
        },
      });
    },
    [trackEvent]
  );

  return trackAffiliateClick;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
