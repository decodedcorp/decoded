"use client";

import { cn } from "@/lib/utils";

export type ActivityTab = "posts" | "spots" | "solutions" | "tries" | "saved";

interface ActivityTabsProps {
  activeTab: ActivityTab;
  onTabChange: (tab: ActivityTab) => void;
  className?: string;
}

const TABS: { id: ActivityTab; label: string }[] = [
  { id: "posts", label: "Posts" },
  { id: "spots", label: "Spots" },
  { id: "solutions", label: "Solutions" },
  { id: "tries", label: "Tries" },
  { id: "saved", label: "Saved" },
];

export function ActivityTabs({
  activeTab,
  onTabChange,
  className,
}: ActivityTabsProps) {
  return (
    <div className={cn("border-b border-border", className)}>
      <nav className="flex gap-0" aria-label="Activity tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative px-4 py-3 text-sm font-medium transition-colors",
              "hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              activeTab === tab.id ? "text-foreground" : "text-muted-foreground"
            )}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            {tab.label}
            {/* Underline indicator */}
            {activeTab === tab.id && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
