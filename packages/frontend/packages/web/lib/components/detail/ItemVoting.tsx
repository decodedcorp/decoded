"use client";

import { VotingButtons } from "@/lib/components/shared/VotingButtons";
import { cn } from "@/lib/utils";

interface ItemVotingProps {
  itemId: string;
  upvotes?: number;
  downvotes?: number;
  className?: string;
}

export function ItemVoting({
  itemId: _itemId,
  upvotes = 24,
  downvotes = 3,
  className,
}: ItemVotingProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-xs font-medium text-muted-foreground">Accuracy</p>
      <VotingButtons upvotes={upvotes} downvotes={downvotes} />
    </div>
  );
}
