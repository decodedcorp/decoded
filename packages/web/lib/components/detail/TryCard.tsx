"use client";

import Image from "next/image";

export type TryCardProps = {
  id: string;
  imageUrl: string;
  username: string;
  avatarUrl: string | null;
  comment: string | null;
  onClick: () => void;
};

/**
 * TryCard - Individual try post thumbnail card
 *
 * Shows a 3:4 aspect ratio image with user avatar overlay
 * and username / comment below.
 */
export function TryCard({
  imageUrl,
  username,
  avatarUrl,
  comment,
  onClick,
}: TryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted">
        <Image
          src={imageUrl}
          alt={`Try by @${username}`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 50vw, 33vw"
        />

        {/* Avatar overlay — top-left */}
        <div className="absolute top-2 left-2">
          <div className="w-6 h-6 rounded-full overflow-hidden border border-white/60 bg-muted">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={username}
                width={24}
                height={24}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted-foreground/20">
                <span className="text-[8px] text-muted-foreground uppercase">
                  {username.charAt(0)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Meta below image */}
      <div className="mt-1.5 px-0.5 space-y-0.5">
        <p className="text-xs font-medium truncate text-foreground">
          @{username}
        </p>
        {comment && (
          <p className="text-xs text-muted-foreground truncate">{comment}</p>
        )}
      </div>
    </button>
  );
}
