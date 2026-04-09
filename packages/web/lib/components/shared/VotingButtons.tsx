"use client";

import { ThumbsUp, ThumbsDown, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useVoteStats,
  useCreateVote,
  useDeleteVote,
} from "@/lib/hooks/useVoting";

export interface VotingButtonsProps {
  solutionId: string;
  className?: string;
}

export function VotingButtons({ solutionId, className }: VotingButtonsProps) {
  const { data: stats } = useVoteStats(solutionId);
  const createVote = useCreateVote();
  const deleteVote = useDeleteVote();

  const ups = stats?.upvotes ?? 0;
  const downs = stats?.downvotes ?? 0;
  const userVote = stats?.user_vote ?? null;
  const isVerified = stats?.is_verified ?? false;
  const total = ups + downs;
  const percentage = total > 0 ? Math.round((ups / total) * 100) : 50;

  const handleVote = (voteType: "up" | "down") => {
    if (userVote === voteType) {
      deleteVote.mutate({ solutionId });
    } else {
      createVote.mutate({ solutionId, voteType });
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleVote("up")}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
            userVote === "up"
              ? "bg-green-500/10 text-green-500 ring-1 ring-green-500/30"
              : "text-muted-foreground hover:bg-accent"
          )}
          aria-label="Accurate"
        >
          <ThumbsUp className={cn("h-4 w-4", userVote === "up" && "fill-current")} />
          <span>{ups}</span>
        </button>

        <button
          onClick={() => handleVote("down")}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
            userVote === "down"
              ? "bg-red-500/10 text-red-500 ring-1 ring-red-500/30"
              : "text-muted-foreground hover:bg-accent"
          )}
          aria-label="Inaccurate"
        >
          <ThumbsDown className={cn("h-4 w-4", userVote === "down" && "fill-current")} />
          <span>{downs}</span>
        </button>

        {isVerified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-500">
            <BadgeCheck className="w-3 h-3" />
            Verified
          </span>
        )}
      </div>

      {/* Accuracy bar */}
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              isVerified ? "bg-blue-500" : "bg-green-500"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground min-w-[3ch] text-right">
          {percentage}%
        </span>
      </div>
    </div>
  );
}
