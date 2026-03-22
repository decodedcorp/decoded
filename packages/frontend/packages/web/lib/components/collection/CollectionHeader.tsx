"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CollectionTab } from "@/lib/stores/collectionStore";

const TABS: { key: CollectionTab; label: string }[] = [
  { key: "pins", label: "Pins" },
  { key: "boards", label: "Boards" },
  { key: "collage", label: "Collage" },
];

interface CollectionHeaderProps {
  activeTab: CollectionTab;
  onTabChange: (tab: CollectionTab) => void;
  pinCount: number;
}

export function CollectionHeader({
  activeTab,
  onTabChange,
  pinCount,
}: CollectionHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
      {/* Top row */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="text-center">
          <h1 className="text-sm font-semibold tracking-tight">
            My Collection
          </h1>
          <p className="text-xs text-muted-foreground">{pinCount} saved</p>
        </div>

        {/* Spacer for centering */}
        <div className="w-[18px]" />
      </div>

      {/* Tab bar */}
      <div className="flex px-4 gap-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`flex-1 py-2 text-xs font-medium tracking-wide transition-colors relative ${
              activeTab === key
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground/70"
            }`}
          >
            {label}
            {activeTab === key && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-foreground rounded-full" />
            )}
          </button>
        ))}
      </div>
    </header>
  );
}
