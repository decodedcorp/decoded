"use client";

import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NewPostsIndicatorProps {
  count: number;
  onClick: () => void;
  className?: string;
}

export function NewPostsIndicator({
  count,
  onClick,
  className,
}: NewPostsIndicatorProps) {
  if (count <= 0) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed top-20 left-1/2 -translate-x-1/2 z-40",
        "flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
        "shadow-lg hover:bg-primary/90 transition-all",
        "animate-in slide-in-from-top-4 fade-in duration-300",
        className
      )}
    >
      <ArrowUp className="h-3.5 w-3.5" />
      {count} new {count === 1 ? "post" : "posts"}
    </button>
  );
}
