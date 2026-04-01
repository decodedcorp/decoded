"use client";

import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCollectionStore,
  type CollectionTab,
} from "@/lib/stores/collectionStore";
import { PinGrid } from "@/lib/components/collection/PinGrid";
import { BoardGrid } from "@/lib/components/collection/BoardGrid";
import { CollageView } from "@/lib/components/collection/CollageView";

const SUB_TABS: { key: CollectionTab; label: string }[] = [
  { key: "pins", label: "Pins" },
  { key: "boards", label: "Boards" },
  { key: "collage", label: "Collage" },
];

export interface SavedGridProps {
  className?: string;
}

export function SavedGrid({ className }: SavedGridProps) {
  const tab = useCollectionStore((s) => s.tab);
  const setTab = useCollectionStore((s) => s.setTab);
  const pins = useCollectionStore((s) => s.pins);
  const boards = useCollectionStore((s) => s.boards);
  const isLoading = useCollectionStore((s) => s.isLoading);
  const loadCollection = useCollectionStore((s) => s.loadCollection);
  const setSelectedPinId = useCollectionStore((s) => s.setSelectedPinId);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadCollection().then(() => setLoaded(true));
    // loadCollection은 store에서 안정적인 참조이므로 의존성 배열에서 제외
  }, []);

  if (isLoading && !loaded) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    );
  }

  if (pins.length === 0 && boards.length === 0) {
    return (
      <div className="py-12 text-center">
        <Bookmark className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">No saved items yet</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-0", className)}>
      {/* Sub-tab bar */}
      <div className="flex gap-1 px-1 pb-3">
        {SUB_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
              tab === key
                ? "bg-foreground text-background"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "pins" && <PinGrid pins={pins} onSelectPin={setSelectedPinId} />}
      {tab === "boards" && <BoardGrid boards={boards} />}
      {tab === "collage" && (
        <CollageView pins={pins} onSelectPin={setSelectedPinId} />
      )}
    </div>
  );
}
