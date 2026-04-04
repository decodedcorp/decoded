"use client";

import { ArrowRight } from "lucide-react";
import { useTextLayout } from "@/lib/hooks/usePretext";

interface EditorialPreviewHeaderProps {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  postId?: string | null;
}

export function EditorialPreviewHeader({
  title,
  subtitle,
  description,
  postId,
}: EditorialPreviewHeaderProps) {
  const displayDescription = description || subtitle;

  const { containerRef: titleRef, height: titleHeight } = useTextLayout({
    text: title,
    font: '700 clamp(1.5rem, 3vw, 1.875rem) "Playfair Display", serif',
    lineHeight: 1.2 * 30,
  });

  return (
    <section className="flex flex-col items-center px-6 pt-10 pb-6 text-center">
      <p className="typography-overline mb-4 text-muted-foreground tracking-[0.15em]">
        Editorial
      </p>
      <h2
        ref={titleRef as React.RefObject<HTMLHeadingElement>}
        className="font-serif text-2xl font-bold leading-snug break-keep md:text-3xl"
        style={titleHeight > 0 ? { minHeight: titleHeight } : undefined}
      >
        {title}
      </h2>
      {displayDescription && (
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground break-keep line-clamp-3">
          {displayDescription}
        </p>
      )}
      {postId && (
        <a
          href={`/posts/${postId}`}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#eafd67] px-5 py-2 text-xs font-semibold text-[#050505] transition-colors hover:bg-[#eafd67]/80"
        >
          전체 에디토리얼 보기
          <ArrowRight className="h-3 w-3" />
        </a>
      )}
      <div className="mt-6 flex items-center gap-4">
        <div className="h-px w-10 bg-border/40" />
        <div className="h-1 w-1 rounded-full bg-border/40" />
        <div className="h-px w-10 bg-border/40" />
      </div>
    </section>
  );
}
