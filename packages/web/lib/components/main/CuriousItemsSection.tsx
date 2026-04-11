"use client";

import { StyleListSection } from "./StyleListSection";
import type { StyleCardData } from "./StyleCard";

interface CuriousItemsSectionProps {
  styles: StyleCardData[];
}

/**
 * 홈 "디코디드 유저들이 아이템을 궁금해요" 섹션
 * 아직 솔루션이 없는 포스트만 표시 → 디코딩 요청/참여 유도
 */
export function CuriousItemsSection({ styles }: CuriousItemsSectionProps) {
  return (
    <StyleListSection
      title="Decoded users are curious"
      subtitle="Styles that haven't been decoded yet. Discover the items they're curious about."
      styles={styles}
      linkHref="/request"
      ctaLinkLabel="Request decoding"
    />
  );
}
