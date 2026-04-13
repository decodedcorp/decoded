"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FileText, MapPin, Lightbulb, Bookmark, Sparkles, Heart } from "lucide-react";
import type { ActivityTab } from "./ActivityTabs";

interface EmptyStateProps {
  tab: ActivityTab;
  className?: string;
}

const EMPTY_STATES: Record<
  ActivityTab,
  {
    icon: typeof FileText;
    message: string;
    ctaLabel: string;
    ctaHref?: string;
  }
> = {
  posts: {
    icon: FileText,
    message: "No posts yet",
    ctaLabel: "Create your first post",
    ctaHref: "/request",
  },
  spots: {
    icon: MapPin,
    message: "No spots yet",
    ctaLabel: "Add a spot",
  },
  solutions: {
    icon: Lightbulb,
    message: "No solutions yet",
    ctaLabel: "Suggest a solution",
  },
  tries: {
    icon: Sparkles,
    message: "No tries yet",
    ctaLabel: "Try virtual fitting",
    ctaHref: "/explore",
  },
  saved: {
    icon: Bookmark,
    message: "No saved items",
    ctaLabel: "Browse the feed",
    ctaHref: "/feed",
  },
  likes: {
    icon: Heart,
    message: "No liked posts yet",
    ctaLabel: "Browse the feed",
    ctaHref: "/feed",
  },
};

export function EmptyState({ tab, className }: EmptyStateProps) {
  const config = EMPTY_STATES[tab];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="mb-4 text-muted-foreground">{config.message}</p>
      {config.ctaHref ? (
        <a
          href={config.ctaHref}
          className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {config.ctaLabel}
        </a>
      ) : (
        <button
          onClick={() => {
            // Placeholder - would trigger appropriate action modal
            console.log(`CTA clicked for ${tab}`);
          }}
          className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {config.ctaLabel}
        </button>
      )}
    </div>
  );
}
