"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import {
  useRequestStore,
  selectIsSubmitting,
  selectSubmitError,
} from "@/lib/stores/requestStore";
import { useCategories } from "@/lib/hooks/useCategories";
import { useCreatePost } from "@/lib/hooks/useCreatePost";
import { SubmitPreview } from "./SubmitPreview";

interface SubmitStepProps {
  onClose?: () => void;
}

export function SubmitStep({ onClose }: SubmitStepProps) {
  const isSubmitting = useRequestStore(selectIsSubmitting);
  const submitError = useRequestStore(selectSubmitError);

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

  // 카테고리 로딩 중
  if (isCategoriesLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // 카테고리 에러
  if (categoriesError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-center">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <p className="text-sm text-red-500">Failed to load categories</p>
        <p className="text-xs text-muted-foreground">Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground">
          Review & Submit
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Check your request details before submitting
        </p>
      </div>

      {/* Preview */}
      <SubmitPreview />

      {/* Error Message */}
      {submitError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-500">{submitError}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className={`
          w-full py-3 rounded-lg font-medium text-base transition-all
          flex items-center justify-center gap-2
          ${
            isSubmitting
              ? "bg-primary/50 text-primary-foreground/50 cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:shadow-[0_0_20px_oklch(0.9519_0.1739_115.8446_/_0.5)]"
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

      {/* Disclaimer */}
      <p className="text-xs text-center text-muted-foreground">
        By submitting, you confirm that you have the right to share this image
        and the information provided is accurate.
      </p>
    </div>
  );
}
