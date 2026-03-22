"use client";

import type { Board } from "@/lib/stores/collectionStore";
import { BoardCard } from "./BoardCard";

interface BoardGridProps {
  boards: Board[];
}

export function BoardGrid({ boards }: BoardGridProps) {
  if (boards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground text-sm">No boards yet</p>
        <p className="text-muted-foreground/60 text-xs mt-1">
          Organize your pins into boards
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-3 py-3">
      {boards.map((board) => (
        <BoardCard key={board.id} board={board} />
      ))}
    </div>
  );
}
