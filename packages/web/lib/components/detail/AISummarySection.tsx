"use client";

import { useEffect, useState } from "react";

type Props = {
  summary: string;
  isModal?: boolean;
};

export function AISummarySection({ summary, isModal = false }: Props) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col w-full">
      <div
        className={`relative overflow-hidden rounded-sm border border-border/40 bg-muted/5 p-6 md:p-8 w-full transition-opacity duration-700 ${revealed ? "opacity-100" : "opacity-0"}`}
      >
        <p
          className={`font-serif italic leading-relaxed text-foreground/90 ${isModal ? "text-base md:text-lg" : "text-lg md:text-xl"}`}
        >
          &ldquo;{summary}&rdquo;
        </p>
      </div>
    </div>
  );
}
