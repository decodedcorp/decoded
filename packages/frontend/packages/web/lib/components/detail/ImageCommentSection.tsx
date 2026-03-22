"use client";

import { CommentSection } from "@/lib/components/shared/CommentSection";
import { cn } from "@/lib/utils";

interface ImageCommentSectionProps {
  imageId: string;
  currentUserId?: string | null;
  className?: string;
}

export function ImageCommentSection({
  imageId,
  currentUserId,
  className,
}: ImageCommentSectionProps) {
  return (
    <div className={cn("px-6 py-8 md:px-10 border-t border-border", className)}>
      <CommentSection
        postId={imageId}
        title="Comments"
        currentUserId={currentUserId}
      />
    </div>
  );
}
