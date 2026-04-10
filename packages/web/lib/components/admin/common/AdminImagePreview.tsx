"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminImagePreviewProps {
  src: string;
  alt?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "w-10 h-10",
  md: "w-20 h-20",
  lg: "w-40 h-40",
};

export function AdminImagePreview({
  src,
  alt = "",
  size = "sm",
  className,
}: AdminImagePreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div
        className={cn(
          SIZES[size],
          "rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-xs",
          className
        )}
      >
        N/A
      </div>
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={cn(
          SIZES[size],
          "rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity",
          className
        )}
        onClick={() => setExpanded(true)}
        onError={() => setError(true)}
      />
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setExpanded(false)}
        >
          <button
            onClick={() => setExpanded(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-h-[80vh] max-w-[90vw] rounded-xl"
          />
        </div>
      )}
    </>
  );
}
