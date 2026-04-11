"use client";

import Link from "next/link";
import { FileText, MapPin, Lightbulb } from "lucide-react";
import type {
  PaginatedResponseUserActivityItemDataItem,
  UserActivityType,
} from "@/lib/api/generated/models";

// Accept generated activity item type (title is string | null | undefined)
interface ActivityItemCardProps {
  item: PaginatedResponseUserActivityItemDataItem;
}

const TYPE_LABELS: Record<UserActivityType, string> = {
  post: "Post",
  spot: "Spot",
  solution: "Solution",
};

const TYPE_ICONS: Record<
  UserActivityType,
  React.ComponentType<{ className?: string }>
> = {
  post: FileText,
  spot: MapPin,
  solution: Lightbulb,
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function ActivityItemCard({ item }: ActivityItemCardProps) {
  const Icon = TYPE_ICONS[item.type];
  const label = TYPE_LABELS[item.type];
  const displayTitle =
    item.title || item.product_name || `${label} #${item.id.slice(0, 8)}`;
  const imageUrl = item.spot?.post?.image_url;
  const postId = item.spot?.post?.id;

  return (
    <Link
      href={postId ? `/posts/${postId}` : "#"}
      className="flex gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/30"
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {displayTitle}
        </p>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{label}</span>
          <span>·</span>
          <span>{formatDate(item.created_at)}</span>
          {item.is_adopted && (
            <>
              <span>·</span>
              <span className="text-green-600">Adopted</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
