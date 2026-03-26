"use client";

import { useRef } from "react";
import { Upload, RotateCcw, Download, Share2, BookmarkPlus } from "lucide-react";
import { VtonLoadingAnimation } from "./VtonLoadingAnimation";
import { BeforeAfterSlider } from "./BeforeAfterSlider";

interface VtonPhotoAreaProps {
  personPreview: string | null;
  displayPersonPreview: string | null;
  displayResultImage: string | null;
  displayLatency: number | null;
  isProcessing: boolean;
  loadingStage: number;
  isSaving: boolean;
  savedToProfile: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSaveToProfile: () => void;
  onShare: () => void;
  onReset: () => void;
}

export function VtonPhotoArea({
  personPreview,
  displayPersonPreview,
  displayResultImage,
  displayLatency,
  isProcessing,
  loadingStage,
  isSaving,
  savedToProfile,
  onFileChange,
  onSaveToProfile,
  onShare,
  onReset,
}: VtonPhotoAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const showResult = displayResultImage && displayPersonPreview && !isProcessing;

  return (
    <div className="relative flex flex-1 items-center justify-center bg-[#050505] md:flex-[3]">
      {isProcessing && <VtonLoadingAnimation stage={loadingStage} />}

      {showResult ? (
        <div className="relative h-full w-full">
          <BeforeAfterSlider
            beforeSrc={displayPersonPreview}
            afterSrc={displayResultImage}
          />
          <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-4 py-3">
            <span className="h-2 w-2 rounded-full bg-[#eafd67]" />
            <span className="text-sm text-white/70">
              {displayLatency ? `${(displayLatency / 1000).toFixed(1)}s` : ""}
            </span>
            <span className="text-xs text-white/40">drag to compare</span>
            <div className="ml-auto flex gap-2">
              <button
                onClick={onSaveToProfile}
                disabled={isSaving}
                className="flex items-center gap-1.5 rounded-lg bg-[#eafd67] px-3 py-1.5 text-xs font-medium text-[#050505] hover:bg-[#d4e85c] disabled:opacity-50"
              >
                <BookmarkPlus size={12} />
                {isSaving ? "Saving..." : savedToProfile ? "Saved" : "Save"}
              </button>
              <button
                onClick={onShare}
                className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/20"
              >
                <Share2 size={12} /> Share
              </button>
              <a
                href={displayResultImage || ""}
                download={`vton-${Date.now()}.png`}
                className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/20"
              >
                <Download size={12} />
              </a>
              <button
                onClick={onReset}
                className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/20"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          </div>
        </div>
      ) : !isProcessing ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex h-full w-full cursor-pointer flex-col items-center justify-center transition-colors hover:bg-white/5"
        >
          {personPreview ? (
            <img
              src={personPreview}
              alt="Uploaded"
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-2xl border-2 border-dashed border-white/20 p-6">
                <Upload size={32} className="text-white/30" />
              </div>
              <p className="text-sm font-medium text-white/60">
                Upload a full-body photo
              </p>
              <p className="text-xs text-white/30">Best results with standing pose</p>
            </div>
          )}
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />

      {personPreview && !isProcessing && !showResult && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-4 left-4 rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white/70 backdrop-blur-sm hover:bg-black/80"
        >
          Change Photo
        </button>
      )}
    </div>
  );
}
