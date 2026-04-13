"use client";

import { useState } from "react";
import {
  Send,
  ChevronDown,
  ChevronUp,
  Loader2,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AccountAvatar } from "./AccountAvatar";
import { formatRelativeTime } from "@/lib/utils";
import {
  useComments,
  useCreateComment,
  useDeleteComment,
} from "@/lib/hooks/useComments";
import type { CommentResponse } from "@/lib/api/generated/models";

export interface CommentSectionProps {
  postId: string;
  className?: string;
  title?: string;
  currentUserId?: string | null;
  /** Hide the "Comments (n)" heading when the parent shell already shows a title */
  hideHeading?: boolean;
  /** Logged-in viewer display name for the composer avatar initials (falls back to "?" if absent) */
  viewerName?: string | null;
  /** Logged-in viewer avatar URL for the composer */
  viewerAvatarUrl?: string | null;
}

function CommentItem({
  comment,
  postId,
  currentUserId,
  depth = 0,
  onReply,
}: {
  comment: CommentResponse;
  postId: string;
  currentUserId?: string | null;
  depth?: number;
  onReply?: (parentId: string) => void;
}) {
  const [showReplies, setShowReplies] = useState(true);
  const deleteMutation = useDeleteComment(postId);
  const hasReplies = comment.replies && comment.replies.length > 0;
  const displayName =
    comment.user.display_name || comment.user.username || "User";
  const createdAt = new Date(comment.created_at).toISOString();
  const isOwner = currentUserId === comment.user_id;

  return (
    <div className={cn("flex gap-3", depth > 0 && "ml-10")}>
      <Link href={`/profile/${comment.user_id}`} className="flex-shrink-0">
        <AccountAvatar
          name={displayName}
          src={comment.user.avatar_url ?? undefined}
          size="sm"
        />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link
            href={`/profile/${comment.user_id}`}
            className="text-sm font-medium truncate hover:underline"
          >
            {displayName}
          </Link>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatRelativeTime(createdAt)}
          </span>
        </div>
        <p className="text-sm text-foreground/90 mt-0.5">{comment.content}</p>
        <div className="flex items-center gap-3 mt-1.5">
          {depth === 0 && onReply && (
            <button
              onClick={() => onReply(comment.id)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Reply
            </button>
          )}
          {isOwner && (
            <button
              onClick={() => deleteMutation.mutate(comment.id)}
              disabled={deleteMutation.isPending}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          )}
        </div>

        {hasReplies && (
          <>
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-1 mt-2 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              {showReplies ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              {showReplies
                ? "Hide replies"
                : `View ${comment.replies.length} ${comment.replies.length === 1 ? "reply" : "replies"}`}
            </button>
            {showReplies &&
              comment.replies.map((reply) => (
                <div key={reply.id} className="mt-3">
                  <CommentItem
                    comment={reply}
                    postId={postId}
                    currentUserId={currentUserId}
                    depth={depth + 1}
                  />
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
}

function CommentListSkeleton({ rows = 3 }: { rows?: number }) {
  const widths = ["w-[92%]", "w-[78%]", "w-[85%]", "w-[70%]", "w-[88%]"];
  return (
    <div
      className="space-y-5 py-2"
      role="status"
      aria-label="Loading comments"
    >
      <span className="sr-only">Loading comments</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <div
            className="h-9 w-9 shrink-0 rounded-full bg-muted animate-pulse"
            aria-hidden
          />
          <div className="min-w-0 flex-1 space-y-2 pt-0.5">
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-28 rounded-md bg-muted animate-pulse" />
              <div className="h-3 w-16 rounded-md bg-muted/80 animate-pulse" />
            </div>
            <div
              className={cn(
                "h-3 rounded-md bg-muted animate-pulse",
                widths[i % widths.length]
              )}
            />
            <div
              className={cn(
                "h-3 rounded-md bg-muted/70 animate-pulse",
                widths[(i + 2) % widths.length]
              )}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CommentSection({
  postId,
  className,
  title = "Comments",
  currentUserId,
  hideHeading = false,
  viewerName,
  viewerAvatarUrl,
}: CommentSectionProps) {
  const { data: comments, isLoading } = useComments(postId);
  const createMutation = useCreateComment(postId);
  const [inputValue, setInputValue] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const handleSubmit = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    createMutation.mutate(
      { content: trimmed, parent_id: replyingTo },
      {
        onSuccess: () => {
          setInputValue("");
          setReplyingTo(null);
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const commentCount = comments?.length ?? 0;

  return (
    <div className={cn("space-y-4", className)}>
      {!hideHeading && (
        <h3 className="text-sm font-semibold">
          {title} ({commentCount})
        </h3>
      )}

      {/* Comment input */}
      <div className="space-y-2">
        {replyingTo && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Replying to comment</span>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-primary hover:underline"
            >
              Cancel
            </button>
          </div>
        )}
        <div className="flex items-center gap-3">
          <AccountAvatar
            name={viewerName ?? undefined}
            src={viewerAvatarUrl ?? undefined}
            size="sm"
          />
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
              className="w-full rounded-full bg-muted px-4 py-2 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={handleSubmit}
              disabled={!inputValue.trim() || createMutation.isPending}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors",
                inputValue.trim() && !createMutation.isPending
                  ? "text-primary hover:bg-primary/10"
                  : "text-muted-foreground pointer-events-none"
              )}
              aria-label="Send comment"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Comments list */}
      {isLoading ? (
        <CommentListSkeleton rows={3} />
      ) : comments && comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              currentUserId={currentUserId}
              onReply={(parentId) => setReplyingTo(parentId)}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-6">
          No comments yet. Be the first!
        </p>
      )}
    </div>
  );
}
