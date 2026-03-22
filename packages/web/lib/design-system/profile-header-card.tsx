import { forwardRef, type ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Card } from "./card";

/**
 * ProfileHeaderCard Component
 *
 * User profile display card with avatar, name, username, bio, and actions.
 * Used for profile pages and user information displays.
 *
 * Features:
 * - Avatar with image or initials fallback
 * - Display name and username
 * - Optional bio with line-clamp
 * - Optional stats row (followers, posts, etc.)
 * - Action buttons slot (settings, logout)
 *
 * @see docs/design-system/decoded.pen
 */

export interface ProfileHeaderCardProps {
  /** Avatar image URL */
  avatarUrl?: string;
  /** User's display name */
  displayName: string;
  /** User's @username */
  username: string;
  /** Optional bio text (max 2 lines) */
  bio?: string;
  /** Optional action buttons (settings, logout, etc.) */
  actions?: ReactNode;
  /** Optional stats array for display */
  stats?: Array<{ label: string; value: string | number }>;
  /** Optional avatar click handler */
  onAvatarClick?: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * Get initials from display name
 */
function getInitials(name: string): string {
  return name.charAt(0).toUpperCase();
}

/**
 * ProfileHeaderCard Component
 *
 * Display user profile information with avatar, name, bio, and actions.
 *
 * @example
 * <ProfileHeaderCard
 *   avatarUrl="/avatar.jpg"
 *   displayName="John Doe"
 *   username="@johndoe"
 *   bio="Product designer and coffee enthusiast"
 *   actions={<Button>Settings</Button>}
 *   stats={[
 *     { label: "Posts", value: 42 },
 *     { label: "Followers", value: 1234 }
 *   ]}
 * />
 */
export const ProfileHeaderCard = forwardRef<
  HTMLDivElement,
  ProfileHeaderCardProps
>(
  (
    {
      avatarUrl,
      displayName,
      username,
      bio,
      actions,
      stats,
      onAvatarClick,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <Card ref={ref} className={cn("p-4 md:p-6", className)} {...props}>
        {/* Header row: Avatar, Name, Actions */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div
            className={cn(
              "relative h-[60px] w-[60px] md:h-[80px] md:w-[80px] flex-shrink-0 overflow-hidden rounded-full bg-muted",
              onAvatarClick && "cursor-pointer"
            )}
            onClick={onAvatarClick}
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={`${displayName} avatar`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary text-xl font-bold text-primary-foreground md:text-2xl">
                {getInitials(displayName)}
              </div>
            )}
          </div>

          {/* User Info and Actions */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              {/* Name and Username */}
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-foreground md:text-xl">
                  {displayName}
                </h2>
                <p className="text-sm text-muted-foreground">{username}</p>
              </div>

              {/* Action Buttons */}
              {actions && (
                <div className="flex items-center gap-1">{actions}</div>
              )}
            </div>

            {/* Bio */}
            {bio && (
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {bio}
              </p>
            )}
          </div>
        </div>

        {/* Optional Stats Row */}
        {stats && stats.length > 0 && (
          <div className="mt-4 flex items-center divide-x divide-border border-t border-border pt-4">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="flex flex-1 flex-col items-center justify-center px-4 first:pl-0 last:pr-0"
              >
                <div className="text-lg font-bold text-foreground md:text-xl">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground md:text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  }
);

ProfileHeaderCard.displayName = "ProfileHeaderCard";

export interface ProfileHeaderCardSkeletonProps {
  /** Show stats skeleton */
  showStats?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * ProfileHeaderCardSkeleton Component
 *
 * Loading placeholder for ProfileHeaderCard with animated shimmer.
 *
 * @example
 * <ProfileHeaderCardSkeleton />
 *
 * @example
 * <ProfileHeaderCardSkeleton showStats={true} />
 */
export const ProfileHeaderCardSkeleton = ({
  showStats = false,
  className,
}: ProfileHeaderCardSkeletonProps) => {
  return (
    <Card className={cn("p-4 md:p-6", className)}>
      <div className="flex items-start gap-4">
        {/* Avatar skeleton */}
        <div className="h-[60px] w-[60px] md:h-[80px] md:w-[80px] flex-shrink-0 animate-pulse rounded-full bg-muted" />

        {/* User info skeleton */}
        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-2">
            {/* Name skeleton */}
            <div className="h-6 w-32 animate-pulse rounded bg-muted md:h-7 md:w-40" />
            {/* Username skeleton */}
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          </div>

          {/* Bio skeleton */}
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>

      {/* Stats skeleton */}
      {showStats && (
        <div className="mt-4 flex items-center divide-x divide-border border-t border-border pt-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex flex-1 flex-col items-center justify-center gap-2 px-4 first:pl-0 last:pr-0"
            >
              <div className="h-6 w-12 animate-pulse rounded bg-muted" />
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
