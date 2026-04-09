"use client";

import { useState } from "react";
import {
  useFollowStatus,
  useFollowUser,
  useUnfollowUser,
} from "@/lib/hooks/useProfile";

interface FollowButtonProps {
  userId: string;
  className?: string;
}

export function FollowButton({ userId, className = "" }: FollowButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { data: statusData, isLoading: isStatusLoading } =
    useFollowStatus(userId);
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const isFollowing = statusData?.is_following ?? false;
  const isPending = followMutation.isPending || unfollowMutation.isPending;

  const handleClick = () => {
    if (isPending) return;
    if (isFollowing) {
      unfollowMutation.mutate(userId);
    } else {
      followMutation.mutate(userId);
    }
  };

  if (isStatusLoading) {
    return (
      <button
        disabled
        className={`h-9 px-6 rounded-full border border-border bg-muted text-sm font-medium text-muted-foreground animate-pulse ${className}`}
      >
        ...
      </button>
    );
  }

  if (isFollowing) {
    return (
      <button
        onClick={handleClick}
        disabled={isPending}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`h-9 px-6 rounded-full text-sm font-medium transition-colors ${
          isHovered
            ? "border border-red-300 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
            : "border border-border bg-card text-foreground"
        } disabled:opacity-50 ${className}`}
      >
        {isPending ? "..." : isHovered ? "Unfollow" : "Following"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`h-9 px-6 rounded-full bg-foreground text-background text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-50 ${className}`}
    >
      {isPending ? "..." : "Follow"}
    </button>
  );
}
