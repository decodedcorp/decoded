"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VotingButtonsProps {
  upvotes?: number;
  downvotes?: number;
  userVote?: "up" | "down" | null;
  onVote?: (vote: "up" | "down" | null) => void;
  className?: string;
}

export function VotingButtons({
  upvotes = 0,
  downvotes = 0,
  userVote: initialVote = null,
  onVote,
  className,
}: VotingButtonsProps) {
  const [vote, setVote] = useState(initialVote);
  const [ups, setUps] = useState(upvotes);
  const [downs, setDowns] = useState(downvotes);

  const total = ups + downs;
  const percentage = total > 0 ? Math.round((ups / total) * 100) : 50;

  const handleVote = (newVote: "up" | "down") => {
    const next = vote === newVote ? null : newVote;

    // Adjust counts
    if (vote === "up") setUps((v) => v - 1);
    if (vote === "down") setDowns((v) => v - 1);
    if (next === "up") setUps((v) => v + 1);
    if (next === "down") setDowns((v) => v + 1);

    setVote(next);
    onVote?.(next);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleVote("up")}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
            vote === "up"
              ? "bg-green-500/10 text-green-500"
              : "text-muted-foreground hover:bg-accent"
          )}
          aria-label="Accurate"
        >
          <ThumbsUp className="h-4 w-4" />
          <span>{ups}</span>
        </button>

        <button
          onClick={() => handleVote("down")}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
            vote === "down"
              ? "bg-red-500/10 text-red-500"
              : "text-muted-foreground hover:bg-accent"
          )}
          aria-label="Inaccurate"
        >
          <ThumbsDown className="h-4 w-4" />
          <span>{downs}</span>
        </button>
      </div>

      {/* Accuracy bar */}
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-300"
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
