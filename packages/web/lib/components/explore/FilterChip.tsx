"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterChipProps {
  label: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
}

export function FilterChip({
  label,
  count,
  active = false,
  onClick,
  onRemove,
  className,
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={active ? onRemove : onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary border border-primary/30"
          : "border border-border text-muted-foreground hover:bg-accent hover:text-foreground",
        className,
      )}
    >
      {label}
      {count != null && (
        <span className={cn("text-[10px]", active ? "text-primary/60" : "text-muted-foreground/60")}>
          {count}
        </span>
      )}
      {active && (
        <X className="h-3 w-3 ml-0.5" />
      )}
    </button>
  );
}
