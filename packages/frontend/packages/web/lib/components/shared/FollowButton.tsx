"use client";

import { useState, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface FollowButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  initialFollowing?: boolean;
  onFollowChange?: (following: boolean) => void;
  size?: "sm" | "md";
}

export const FollowButton = forwardRef<HTMLButtonElement, FollowButtonProps>(
  (
    {
      className,
      initialFollowing = false,
      onFollowChange,
      size = "sm",
      ...props
    },
    ref
  ) => {
    const [following, setFollowing] = useState(initialFollowing);

    const handleClick = () => {
      const next = !following;
      setFollowing(next);
      onFollowChange?.(next);
    };

    return (
      <button
        ref={ref}
        onClick={handleClick}
        className={cn(
          "rounded-full font-medium transition-colors",
          size === "sm" && "px-4 py-1.5 text-xs",
          size === "md" && "px-5 py-2 text-sm",
          following
            ? "bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            : "bg-primary text-primary-foreground hover:bg-primary/90",
          className
        )}
        {...props}
      >
        {following ? "Following" : "Follow"}
      </button>
    );
  }
);

FollowButton.displayName = "FollowButton";
