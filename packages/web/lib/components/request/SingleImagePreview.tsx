"use client";

import { memo } from "react";
import Image from "next/image";
import { X, RefreshCw, Loader2, Check } from "lucide-react";
import { type UploadedImage } from "@/lib/stores/requestStore";

interface SingleImagePreviewProps {
  image: UploadedImage;
  onRemove: () => void;
  onRetry?: () => void;
}

/**
 * SingleImagePreview - 단일 이미지를 모달에 맞게 크게 표시
 */
export const SingleImagePreview = memo(
  ({ image, onRemove, onRetry }: SingleImagePreviewProps) => {
    const { previewUrl, status, progress, error, file } = image;

    return (
      <div className="relative w-full aspect-[3/4] max-w-md mx-auto rounded-xl overflow-hidden bg-foreground/5">
        {/* 이미지 */}
        <Image
          src={previewUrl}
          alt={file.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 400px"
        />

        {/* 업로드 중 오버레이 */}
        {status === "uploading" && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-foreground animate-spin" />
            <div className="w-2/3 h-2 bg-foreground/20 rounded-full overflow-hidden mt-4">
              <div
                className="h-full bg-foreground transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm text-foreground/80 mt-2">
              업로드 중... {progress}%
            </span>
          </div>
        )}

        {/* 에러 오버레이 */}
        {status === "error" && (
          <div className="absolute inset-0 bg-red-500/20 backdrop-blur-sm flex flex-col items-center justify-center p-4">
            <p className="text-sm text-red-600 text-center mb-3">
              {error || "업로드 실패"}
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                다시 시도
              </button>
            )}
          </div>
        )}

        {/* 업로드 완료 배지 */}
        {status === "uploaded" && (
          <div className="absolute top-3 right-3">
            <div className="p-1.5 bg-green-500 rounded-full shadow-lg">
              <Check className="h-4 w-4 text-white" />
            </div>
          </div>
        )}

        {/* 삭제 버튼 */}
        {status !== "uploading" && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-3 left-3 p-2 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
            aria-label={`Remove ${file.name}`}
          >
            <X className="h-4 w-4 text-white" />
          </button>
        )}

        {/* 파일 정보 */}
        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
          <p className="text-sm text-white truncate">{file.name}</p>
        </div>
      </div>
    );
  }
);

SingleImagePreview.displayName = "SingleImagePreview";
