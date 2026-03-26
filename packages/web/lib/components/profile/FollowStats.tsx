"use client";

import { cn } from "@/lib/utils";

export interface FollowStatsProps {
  followers?: number;
  following?: number;
  className?: string;
}

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

export function FollowStats({
  followers = 0,
  following = 0,
  className,
}: FollowStatsProps) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <button className="text-center hover:opacity-80 transition-opacity">
        <span className="text-sm font-bold">{formatCount(followers)}</span>
        <span className="text-xs text-muted-foreground ml-1">followers</span>
      </button>
      <div className="w-px h-4 bg-border" />
      <button className="text-center hover:opacity-80 transition-opacity">
        <span className="text-sm font-bold">{formatCount(following)}</span>
        <span className="text-xs text-muted-foreground ml-1">following</span>
      </button>
    </div>
  );
}
