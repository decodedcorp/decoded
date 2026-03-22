"use client";

import { filterKoreanTags } from "@/lib/utils/locale";

type Props = {
  tags: string[] | null;
};

/**
 * Displays filtered Korean metadata tags in a pill layout
 */
export function MetadataTags({ tags }: Props) {
  const koreanTags = filterKoreanTags(tags);

  if (koreanTags.length === 0) return null;

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
        {koreanTags.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="inline-flex items-center px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider bg-secondary/30 text-secondary-foreground border border-border/40 hover:bg-secondary hover:border-border transition-colors cursor-default"
          >
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
}
