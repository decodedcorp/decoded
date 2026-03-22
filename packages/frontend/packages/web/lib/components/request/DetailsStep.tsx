"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import {
  useRequestStore,
  selectMediaSource,
  selectArtistName,
  selectGroupName,
  selectContext,
  selectAiMetadata,
  selectIsSubmitting,
  selectSubmitError,
} from "@/lib/stores/requestStore";
import { useCategories } from "@/lib/hooks/useCategories";
import { useCreatePost } from "@/lib/hooks/useCreatePost";
import { DescriptionInput } from "./DescriptionInput";
import { MediaSourceInput } from "./MediaSourceInput";
import { ArtistInput } from "./ArtistInput";
import { ContextSelector } from "./ContextSelector";
import { type ContextType } from "@/lib/api";

interface DetailsStepProps {
  onClose?: () => void;
}

export function DetailsStep({ onClose }: DetailsStepProps) {
  const mediaSource = useRequestStore(selectMediaSource);
  const artistName = useRequestStore(selectArtistName);
  const groupName = useRequestStore(selectGroupName);
  const context = useRequestStore(selectContext);
  const aiMetadata = useRequestStore(selectAiMetadata);
  const isSubmitting = useRequestStore(selectIsSubmitting);
  const submitError = useRequestStore(selectSubmitError);

  const setMediaSource = useRequestStore((s) => s.setMediaSource);
  const setArtistName = useRequestStore((s) => s.setArtistName);
  const setGroupName = useRequestStore((s) => s.setGroupName);
  const setContext = useRequestStore((s) => s.setContext);

  // 카테고리 데이터 프리로드
  const { isLoading: isCategoriesLoading, error: categoriesError } =
    useCategories();

  // Post 생성 훅
  const { submit } = useCreatePost({
    onSuccess: () => {
      onClose?.();
    },
  });

  const handleSubmit = () => {
    submit();
  };

  const canSubmit =
    !!(mediaSource?.type && mediaSource?.title) && !isSubmitting;

  return (
    <div className="space-y-6">
      {/* Description */}
      <div className="text-center pb-2">
        <p className="text-sm text-muted-foreground">
          Add details about where this image is from
        </p>
      </div>

      {/* Description (Optional) - AI extracts metadata */}
      <div className="p-4 rounded-xl bg-foreground/[0.02] border border-border">
        <DescriptionInput />
      </div>

      {/* Media Source (Required) */}
      <div className="p-4 rounded-xl bg-foreground/[0.02] border border-border">
        <MediaSourceInput value={mediaSource} onChange={setMediaSource} />
      </div>

      {/* Artist Info (Optional) */}
      <div className="p-4 rounded-xl bg-foreground/[0.02] border border-border">
        <ArtistInput
          artistName={artistName}
          groupName={groupName}
          aiRecommendedArtist={aiMetadata.artistName}
          onArtistNameChange={setArtistName}
          onGroupNameChange={setGroupName}
        />
      </div>

      {/* Context (Optional) */}
      <div className="p-4 rounded-xl bg-foreground/[0.02] border border-border">
        <ContextSelector
          value={context}
          aiRecommendedContext={aiMetadata.context as ContextType | undefined}
          onChange={setContext}
        />
      </div>

      {/* Error Message */}
      {submitError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-500">{submitError}</p>
        </div>
      )}

      {/* Categories Loading/Error */}
      {isCategoriesLoading && (
        <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-muted">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading categories...</p>
        </div>
      )}

      {categoriesError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-500">
            Failed to load categories. Please try again.
          </p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`
          w-full py-3 rounded-lg font-medium text-base transition-all
          flex items-center justify-center gap-2
          ${
            canSubmit
              ? "bg-primary text-primary-foreground hover:shadow-[0_0_20px_oklch(0.9519_0.1739_115.8446_/_0.5)]"
              : "bg-primary/20 text-primary/40 cursor-not-allowed"
          }
        `}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Submitting...</span>
          </>
        ) : (
          <span>Submit Request</span>
        )}
      </button>

      {/* Validation hint */}
      {(!mediaSource?.type || !mediaSource?.title) && (
        <p className="text-xs text-amber-500 text-center">
          Please fill in the required media source fields to submit
        </p>
      )}

      {/* Disclaimer */}
      {canSubmit && (
        <p className="text-xs text-center text-muted-foreground">
          By submitting, you confirm that you have the right to share this image
          and the information provided is accurate.
        </p>
      )}
    </div>
  );
}
