"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartTagsBreadcrumbProps {
  tags: { label: string; href?: string }[];
  className?: string;
}

export function SmartTagsBreadcrumb({
  tags,
  className,
}: SmartTagsBreadcrumbProps) {
  if (tags.length === 0) return null;

  return (
    <nav
      className={cn(
        "flex items-center gap-1 text-xs text-muted-foreground",
        className
      )}
    >
      {tags.map((tag, i) => (
        <span key={tag.label} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3" />}
          {tag.href ? (
            <a
              href={tag.href}
              className="hover:text-foreground transition-colors"
            >
              {tag.label}
            </a>
          ) : (
            <span>{tag.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
