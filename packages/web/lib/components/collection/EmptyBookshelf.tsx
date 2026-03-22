"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";

/**
 * Empty bookshelf state with CTA to generate first issue.
 * Shown when user has no saved magazine issues in their collection.
 */
export function EmptyBookshelf() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      {/* Empty shelf visual */}
      <div className="relative w-full max-w-[400px] mb-8">
        <div className="h-[160px] border-2 border-dashed border-mag-text/10 rounded-lg flex items-center justify-center">
          <BookOpen className="w-12 h-12 text-mag-text/20" strokeWidth={1.5} />
        </div>
        {/* Shelf edge */}
        <div className="w-full h-1 bg-[#2a2a2a] mt-0 shadow-[0_4px_8px_rgba(0,0,0,0.5)]" />
      </div>

      {/* Text */}
      <h2 className="text-xl font-bold text-mag-text mb-2">
        Your bookshelf is empty
      </h2>
      <p className="text-sm text-mag-text/50 mb-8 max-w-[280px]">
        Start collecting your personal editions
      </p>

      {/* CTA */}
      <Link
        href="/magazine/personal"
        className="inline-flex items-center px-6 py-3 rounded-full bg-mag-accent text-mag-bg font-semibold text-sm hover:opacity-90 transition-opacity"
      >
        Generate First Issue
      </Link>
    </div>
  );
}
