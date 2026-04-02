"use client";

import { useTextLayout } from "@/lib/hooks/usePretext";

type Props = {
  summary: string;
  isModal?: boolean;
};

export function AISummarySection({ summary, isModal = false }: Props) {
  const { containerRef: summaryRef, height: summaryHeight } = useTextLayout({
    text: `\u201c${summary}\u201d`,
    font: 'italic 20px "Playfair Display", serif',
    lineHeight: 33,
  });

  return (
    <div className="flex flex-col w-full">
      <div
        className={`relative overflow-hidden rounded-sm border border-border/40 bg-muted/5 p-6 md:p-8 w-full transition-opacity duration-700 ${summaryHeight > 0 ? "opacity-100" : "opacity-0"}`}
        style={summaryHeight > 0 ? { minHeight: summaryHeight + 48 } : undefined}
      >
        <p
          ref={summaryRef as React.RefObject<HTMLParagraphElement>}
          className={`font-serif italic leading-relaxed text-foreground/90 ${isModal ? "text-base md:text-lg" : "text-lg md:text-xl"}`}
        >
          &ldquo;{summary}&rdquo;
        </p>
      </div>
    </div>
  );
}
