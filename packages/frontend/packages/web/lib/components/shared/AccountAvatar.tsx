"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import Image from "next/image";

const avatarVariants = cva(
  "relative inline-flex items-center justify-center rounded-full overflow-hidden bg-muted flex-shrink-0",
  {
    variants: {
      size: {
        xs: "h-6 w-6 text-[10px]",
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-12 w-12 text-base",
        xl: "h-16 w-16 text-lg",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export interface AccountAvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string | null;
  alt?: string;
  name?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export const AccountAvatar = forwardRef<HTMLDivElement, AccountAvatarProps>(
  ({ className, size, src, alt, name, ...props }, ref) => {
    const initials = name ? getInitials(name) : "?";

    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ size }), className)}
        {...props}
      >
        {src ? (
          <Image
            src={src}
            alt={alt || name || "Avatar"}
            fill
            className="object-cover"
          />
        ) : (
          <span className="font-medium text-muted-foreground select-none">
            {initials}
          </span>
        )}
      </div>
    );
  }
);

AccountAvatar.displayName = "AccountAvatar";
