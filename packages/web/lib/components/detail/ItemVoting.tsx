"use client";

import { VotingButtons } from "@/lib/components/shared/VotingButtons";
import { cn } from "@/lib/utils";

interface ItemVotingProps {
  solutionId: string;
  className?: string;
}

export function ItemVoting({ solutionId, className }: ItemVotingProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-xs font-medium text-muted-foreground">Accuracy</p>
      <VotingButtons solutionId={solutionId} />
    </div>
  );
}
