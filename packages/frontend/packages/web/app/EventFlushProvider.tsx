"use client";

import { useEffect } from "react";
import { initFlushTimer } from "@/lib/stores/behaviorStore";
import { useTrackScrollDepth } from "@/lib/hooks/useTrackScrollDepth";

/**
 * EventFlushProvider — 앱 전체 이벤트 플러시 타이머 + 스크롤 깊이 추적
 *
 * Why: layout.tsx는 Server Component이므로 'use client' 훅을 직접 호출 불가.
 * 이 컴포넌트를 layout.tsx의 AppProviders 안에서 렌더링한다.
 */
export function EventFlushProvider({
  children,
}: {
  children?: React.ReactNode;
}) {
  // 30초 주기 flush + 페이지 이탈 시 flush 등록
  useEffect(() => initFlushTimer(), []);

  // 모든 페이지에 스크롤 깊이 추적 (25/50/75/100% 마일스톤)
  useTrackScrollDepth();

  return <>{children}</>;
}
