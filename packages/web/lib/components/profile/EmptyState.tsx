"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FileText, MapPin, Lightbulb, Bookmark, Sparkles } from "lucide-react";
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
    message: "아직 게시물이 없습니다",
    ctaLabel: "첫 게시물 작성하기",
    ctaHref: "/request",
  },
  spots: {
    icon: MapPin,
    message: "아직 스팟이 없습니다",
    ctaLabel: "스팟 추가하기",
  },
  solutions: {
    icon: Lightbulb,
    message: "아직 솔루션이 없습니다",
    ctaLabel: "솔루션 제안하기",
  },
  tries: {
    icon: Sparkles,
    message: "아직 시도한 결과가 없습니다",
    ctaLabel: "가상 피팅 해보기",
    ctaHref: "/explore",
  },
  saved: {
    icon: Bookmark,
    message: "저장된 항목이 없습니다",
    ctaLabel: "피드 둘러보기",
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
