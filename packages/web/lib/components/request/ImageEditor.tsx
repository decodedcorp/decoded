"use client";

import { useRef, useState, useCallback } from "react";
import { Cropper, CropperRef } from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";
import { RotateCw, Check, X, RectangleHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageEditorProps {
  imageUrl: string;
  onSave: (file: File) => void;
  onCancel: () => void;
}

type AspectRatio = "free" | "1:1" | "3:4" | "4:3";

const ASPECT_RATIOS: { label: string; value: AspectRatio; ratio?: number }[] = [
  { label: "Free", value: "free" },
  { label: "1:1", value: "1:1", ratio: 1 },
  { label: "3:4", value: "3:4", ratio: 3 / 4 },
  { label: "4:3", value: "4:3", ratio: 4 / 3 },
];

/**
 * ImageEditor - 이미지 크롭/회전 에디터
 *
 * 풀스크린 모달로 표시되며, 크롭 핸들 + 회전 버튼 + 비율 프리셋을 제공합니다.
 */
export function ImageEditor({ imageUrl, onSave, onCancel }: ImageEditorProps) {
  const cropperRef = useRef<CropperRef>(null);
  const [rotation, setRotation] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("free");
  const [isSaving, setIsSaving] = useState(false);

  const handleRotate = useCallback(() => {
    if (cropperRef.current) {
      const newRotation = rotation + 90;
      setRotation(newRotation);
      cropperRef.current.rotateImage(90);
    }
  }, [rotation]);

  const handleSave = useCallback(async () => {
    const cropper = cropperRef.current;
    if (!cropper) return;

    setIsSaving(true);
    try {
      const canvas = cropper.getCanvas();
      if (!canvas) return;

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9)
      );
      if (!blob) return;

      const file = new File([blob], "edited-image.jpg", {
        type: "image/jpeg",
      });
      onSave(file);
    } finally {
      setIsSaving(false);
    }
  }, [onSave]);

  const selectedRatio = ASPECT_RATIOS.find((r) => r.value === aspectRatio);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <button
          type="button"
          onClick={onCancel}
          className="p-2 text-white/80 hover:text-white transition-colors"
          aria-label="Cancel"
        >
          <X className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium text-white">Edit Image</span>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="p-2 text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
          aria-label="Save"
        >
          <Check className="w-5 h-5" />
        </button>
      </div>

      {/* Cropper */}
      <div className="flex-1 min-h-0">
        <Cropper
          ref={cropperRef}
          src={imageUrl}
          className="h-full"
          stencilProps={{
            aspectRatio: selectedRatio?.ratio,
          }}
          backgroundClassName="bg-black"
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 px-4 py-4 bg-black/80">
        {/* Aspect Ratio */}
        <div className="flex items-center justify-center gap-2">
          {ASPECT_RATIOS.map((ratio) => (
            <button
              key={ratio.value}
              type="button"
              onClick={() => setAspectRatio(ratio.value)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                aspectRatio === ratio.value
                  ? "bg-white text-black"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              )}
            >
              {ratio.value !== "free" && (
                <RectangleHorizontal className="w-3 h-3" />
              )}
              {ratio.label}
            </button>
          ))}
        </div>

        {/* Rotate */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={handleRotate}
            className="flex items-center gap-2 rounded-full px-4 py-2 bg-white/10 text-white/80 hover:bg-white/20 transition-colors text-sm"
          >
            <RotateCw className="w-4 h-4" />
            Rotate 90°
          </button>
        </div>
      </div>
    </div>
  );
}
