"use client";

import type { PostMagazineLayout } from "@/lib/api/types";
import { MagazineTitleSection } from "./MagazineTitleSection";
import { MagazineEditorialSection } from "./MagazineEditorialSection";
import { MagazineCelebSection } from "./MagazineCelebSection";
import { MagazineItemsSection } from "./MagazineItemsSection";
import type { RelatedEditorialItem } from "@/lib/api/types";
import { MagazineRelatedSection } from "./MagazineRelatedSection";

type Props = {
  layout: PostMagazineLayout;
  relatedEditorials?: RelatedEditorialItem[];
};

export function MagazineContent({ layout, relatedEditorials }: Props) {
  const accentColor = layout.design_spec?.accent_color;

  const cssVars = accentColor
    ? ({ "--magazine-accent": accentColor } as React.CSSProperties)
    : undefined;

  return (
    <div className="magazine-content relative" style={cssVars}>
      {/* Decorative vertical typography */}
      <div className="pointer-events-none absolute left-4 top-1/2 hidden -translate-y-1/2 select-none lg:block">
        <span className="writing-mode-vertical-rl rotate-180 font-serif text-[10px] uppercase tracking-[1em] text-primary/5 opacity-50">
          Decoded Editorial Archive
        </span>
      </div>

      {/* Section 1: Title */}
      <MagazineTitleSection
        title={layout.title}
        subtitle={layout.subtitle}
      />

      {/* Section 2: Editorial */}
      <MagazineEditorialSection
        editorial={layout.editorial}
        accentColor={accentColor}
      />

      {/* Section 3: Celebrity List */}
      <MagazineCelebSection
        celebs={layout.celeb_list}
        accentColor={accentColor}
      />

      {/* Section 4: Items + Item Editorial + per-item Related Items */}
      <MagazineItemsSection
        items={layout.items}
        relatedItems={layout.related_items}
        accentColor={accentColor}
      />

      {/* Section 6: Related Editorials */}
      {relatedEditorials && relatedEditorials.length > 0 && (
        <MagazineRelatedSection relatedEditorials={relatedEditorials} />
      )}
    </div>
  );
}
