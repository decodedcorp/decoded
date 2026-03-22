"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

type Props = {
  content: string | null;
};

/**
 * Renders markdown content (AI summary) with magazine-style typography.
 * Reveal animation on mount for "AI가 생성 중" 같은 느낌.
 */
export function ArticleContent({ content }: Props) {
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsRevealed(true));
    });
    return () => cancelAnimationFrame(t);
  }, []);

  if (!content) return null;

  return (
    <div
      className={`mx-auto max-w-3xl px-4 py-12 md:py-16 md:px-8 overflow-hidden transition-opacity ${isRevealed ? "animate-ai-summary-reveal" : "opacity-0 invisible"}`}
    >
      <article
        className="prose prose-base md:prose-lg dark:prose-invert prose-headings:font-serif prose-p:font-serif prose-p:leading-loose mx-auto
        [&>p:first-of-type]:first-letter:text-6xl 
        md:[&>p:first-of-type]:first-letter:text-7xl 
        [&>p:first-of-type]:first-letter:font-serif 
        [&>p:first-of-type]:first-letter:font-bold 
        [&>p:first-of-type]:first-letter:mr-3 
        [&>p:first-of-type]:first-letter:float-left 
        [&>p:first-of-type]:first-letter:text-foreground
        [&>p:first-of-type]:first-letter:leading-[0.8]
        [&>p:first-of-type]:first-letter:mt-2
        prose-blockquote:border-none
        prose-blockquote:italic
        prose-blockquote:text-xl
        md:prose-blockquote:text-2xl
        prose-blockquote:font-serif
        prose-blockquote:text-foreground
        prose-blockquote:relative
        prose-blockquote:py-8
        prose-blockquote:my-10
        md:prose-blockquote:my-12
        prose-blockquote:before:content-['']
        prose-blockquote:before:absolute
        prose-blockquote:before:top-0
        prose-blockquote:before:left-0
        prose-blockquote:before:w-12
        prose-blockquote:before:h-0.5
        prose-blockquote:before:bg-primary/30
        prose-blockquote:after:content-['']
        prose-blockquote:after:absolute
        prose-blockquote:after:bottom-0
        prose-blockquote:after:right-0
        prose-blockquote:after:w-12
        prose-blockquote:after:h-0.5
        prose-blockquote:after:bg-primary/30
      "
      >
        <ReactMarkdown>{content}</ReactMarkdown>
      </article>

      <div className="mt-12 mb-8 flex justify-center items-center gap-4">
        <div className="h-px w-12 bg-border/40" />
        <div className="w-1.5 h-1.5 rounded-full bg-border/40" />
        <div className="h-px w-12 bg-border/40" />
      </div>
    </div>
  );
}
