"use client";

import { Camera, ImageIcon, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MobileUploadOptionsProps {
  onCameraClick?: () => void;
  onGalleryClick?: () => void;
  onUrlClick?: () => void;
  className?: string;
}

export function MobileUploadOptions({
  onCameraClick,
  onGalleryClick,
  onUrlClick,
  className,
}: MobileUploadOptionsProps) {
  const options = [
    { id: "camera", label: "Camera", icon: Camera, onClick: onCameraClick },
    {
      id: "gallery",
      label: "Gallery",
      icon: ImageIcon,
      onClick: onGalleryClick,
    },
    { id: "url", label: "From URL", icon: LinkIcon, onClick: onUrlClick },
  ];

  return (
    <div className={cn("grid grid-cols-3 gap-3", className)}>
      {options.map((option) => (
        <button
          key={option.id}
          onClick={option.onClick}
          className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 hover:bg-accent transition-colors"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <option.icon className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {option.label}
          </span>
        </button>
      ))}
    </div>
  );
}
