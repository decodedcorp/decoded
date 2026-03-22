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
      title="디코디드 유저들이 아이템을 궁금해요"
      subtitle="아직 디코딩되지 않은 스타일이에요. 궁금한 아이템을 찾아보세요."
      styles={styles}
      linkHref="/request"
      ctaLinkLabel="디코딩 요청하기"
    />
  );
}
