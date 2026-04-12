"use client";

import { useTextLayout } from "@/lib/hooks/usePretext";

type Props = {
  summary: string;
  isModal?: boolean;
  /** DecodeShowcase / dark magazine surface */
  surface?: "default" | "decode";
};

export function AISummarySection({
  summary,
  isModal = false,
  surface = "default",
}: Props) {
  const { containerRef: summaryRef, height: summaryHeight } = useTextLayout({
    text: `\u201c${summary}\u201d`,
    font: 'italic 20px "Playfair Display", serif',
    lineHeight: 33,
  });

  const shell =
    surface === "decode"
      ? "border border-white/15 bg-white/[0.06]"
      : "border border-border/40 bg-muted/5";

  const body =
    surface === "decode"
      ? "text-[var(--mag-text)]/90"
      : "text-foreground/90";

  return (
    <div className="flex w-full flex-col">
      <div
        className={`relative w-full overflow-hidden rounded-sm p-6 transition-opacity duration-700 md:p-8 ${shell} ${summaryHeight > 0 ? "opacity-100" : "opacity-0"}`}
        style={
          summaryHeight > 0 ? { minHeight: summaryHeight + 48 } : undefined
        }
      >
        <p
          ref={summaryRef as React.RefObject<HTMLParagraphElement>}
          className={`font-serif italic leading-relaxed ${body} ${isModal ? "text-base md:text-lg" : "text-lg md:text-xl"}`}
        >
          &ldquo;{summary}&rdquo;
        </p>
      </div>
    </div>
  );
}
