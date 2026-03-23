"use client";

import { useState } from "react";
import { Send, MoreHorizontal, ChevronDown, ChevronUp, Loader2, Trash2 } from "lucide-react";
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
      <AccountAvatar
        name={displayName}
        src={comment.user.avatar_url ?? undefined}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{displayName}</span>
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

export function CommentSection({
  postId,
  className,
  title = "Comments",
  currentUserId,
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
      <h3 className="text-sm font-semibold">
        {title} ({commentCount})
      </h3>

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
          <AccountAvatar name="You" size="sm" />
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                replyingTo ? "Write a reply..." : "Add a comment..."
              }
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
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
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
