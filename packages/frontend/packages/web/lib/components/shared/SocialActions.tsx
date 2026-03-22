"use client";

import { useEffect, useState } from "react";
import { Heart, Bookmark, Share2, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SocialActionsProps {
  initialLiked?: boolean;
  initialSaved?: boolean;
  likeCount?: number;
  commentCount?: number;
  onLike?: (liked: boolean) => void;
  onSave?: (saved: boolean) => void;
  onShare?: () => void;
  onComment?: () => void;
  showComment?: boolean;
  className?: string;
  variant?: "default" | "compact";
}

export function SocialActions({
  initialLiked = false,
  initialSaved = false,
  likeCount = 0,
  commentCount,
  onLike,
  onSave,
  onShare,
  onComment,
  showComment = false,
  className,
  variant = "default",
}: SocialActionsProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [saved, setSaved] = useState(initialSaved);
  const [count, setCount] = useState(likeCount);

  useEffect(() => {
    setLiked(initialLiked);
    setSaved(initialSaved);
    setCount(likeCount);
  }, [initialLiked, initialSaved, likeCount]);

  const handleLike = () => {
    const next = !liked;
    setLiked(next);
    setCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
    onLike?.(next);
  };

  const handleSave = () => {
    const next = !saved;
    setSaved(next);
    onSave?.(next);
  };

  const iconSize = variant === "compact" ? "h-4 w-4" : "h-5 w-5";

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <button
        onClick={handleLike}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors hover:bg-accent"
        aria-label={liked ? "Unlike" : "Like"}
      >
        <Heart
          className={cn(
            iconSize,
            "transition-colors",
            liked && "fill-red-500 text-red-500"
          )}
        />
        {count > 0 && (
          <span className="text-xs text-muted-foreground">{count}</span>
        )}
      </button>

      {showComment && (
        <button
          onClick={onComment}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors hover:bg-accent"
          aria-label="Comment"
        >
          <MessageCircle className={iconSize} />
          {commentCount !== undefined && commentCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {commentCount}
            </span>
          )}
        </button>
      )}

      <button
        onClick={onShare}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors hover:bg-accent"
        aria-label="Share"
      >
        <Share2 className={iconSize} />
      </button>

      <button
        onClick={handleSave}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors hover:bg-accent ml-auto"
        aria-label={saved ? "Unsave" : "Save"}
      >
        <Bookmark
          className={cn(
            iconSize,
            "transition-colors",
            saved && "fill-primary text-primary"
          )}
        />
      </button>
    </div>
  );
}
