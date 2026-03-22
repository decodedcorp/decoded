"use client";

import { memo } from "react";
import { X, RefreshCw, Check, AlertCircle } from "lucide-react";
import Image from "next/image";
import { type UploadedImage } from "@/lib/stores/requestStore";
import { formatFileSize } from "@/lib/utils/imageCompression";

interface ImagePreviewProps {
  image: UploadedImage;
  onRemove: (id: string) => void;
  onRetry?: (id: string) => void;
  /** Large mode for single image display - fills container */
  large?: boolean;
}

function ImagePreviewComponent({
  image,
  onRemove,
  onRetry,
  large = false,
}: ImagePreviewProps) {
  const { previewUrl, status, progress, error, file } = image;

  return (
    <div
      className={`relative group rounded-lg overflow-hidden bg-foreground/5 ${
        large ? "w-full h-full" : "aspect-square"
      }`}
    >
      <Image
        src={previewUrl}
        alt={file.name}
        fill
        className="object-cover"
        sizes={
          large
            ? "400px"
            : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        }
      />

      {/* Overlay based on status */}
      {status === "uploading" && (
        <div className="absolute inset-0 bg-background/60 flex flex-col items-center justify-center">
          <div className="w-3/4 h-1.5 bg-foreground/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-foreground/80 mt-2">{progress}%</span>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 bg-red-500/20 flex flex-col items-center justify-center p-2">
          <AlertCircle className="h-6 w-6 text-red-500 mb-1" />
          <span className="text-xs text-red-600 text-center line-clamp-2">
            {error || "Upload failed"}
          </span>
          {onRetry && (
            <button
              type="button"
              onClick={() => onRetry(image.id)}
              className="mt-2 px-3 py-1 text-xs bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          )}
        </div>
      )}

      {status === "uploaded" && (
        <div className="absolute bottom-2 right-2">
          <div className="p-1 bg-green-500 rounded-full">
            <Check className="h-3 w-3 text-white" />
          </div>
        </div>
      )}

      {/* File info on hover (hidden in large mode - shown separately) */}
      {!large && (
        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-xs text-white truncate">{file.name}</p>
          <p className="text-xs text-white/70">{formatFileSize(file.size)}</p>
        </div>
      )}

      {/* Remove button */}
      {status !== "uploading" && (
        <button
          type="button"
          onClick={() => onRemove(image.id)}
          className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full transition-colors opacity-0 group-hover:opacity-100"
          aria-label={`Remove ${file.name}`}
        >
          <X className="h-4 w-4 text-white" />
        </button>
      )}
    </div>
  );
}

// Memo with custom comparator to only re-render when image data changes
export const ImagePreview = memo(ImagePreviewComponent, (prev, next) => {
  // Compare image fields that affect rendering
  return (
    prev.image.id === next.image.id &&
    prev.image.status === next.image.status &&
    prev.image.progress === next.image.progress &&
    prev.image.error === next.image.error &&
    prev.large === next.large
  );
});
