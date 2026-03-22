"use client";

import { useCallback } from "react";
import { BottomSheet } from "@/lib/design-system";
import {
  SolutionLinkForm,
  type SolutionLinkFormData,
} from "./SolutionLinkForm";
import { useCreateSolution } from "@/lib/hooks/useSolutions";
import { useQueryClient } from "@tanstack/react-query";
import { postKeys } from "@/lib/hooks/usePosts";
import { toast } from "sonner";

interface AddSolutionSheetProps {
  spotId: string;
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * AddSolutionSheet - 기존 스팟에 솔루션 등록 시트
 * URL → extract-metadata → 제휴 여부 선택 → convert-affiliate(선택) → create
 */
export function AddSolutionSheet({
  spotId,
  postId,
  isOpen,
  onClose,
}: AddSolutionSheetProps) {
  const queryClient = useQueryClient();
  const createSolution = useCreateSolution();

  const handleSave = useCallback(
    async (_spotId: string, data: SolutionLinkFormData) => {
      try {
        await createSolution.mutateAsync({
          spotId,
          data: {
            original_url: data.original_url,
            affiliate_url: data.affiliate_url ?? undefined,
            title: data.title ?? undefined,
            description: data.description ?? undefined,
            thumbnail_url: data.thumbnail_url ?? undefined,
          },
        });
        await queryClient.invalidateQueries({
          queryKey: postKeys.detail(postId),
        });
        await queryClient.invalidateQueries({
          queryKey: ["posts", "detail", "image-view", postId],
        });
        toast.success("솔루션이 등록되었습니다.");
        onClose();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "솔루션 등록에 실패했습니다."
        );
      }
    },
    [spotId, postId, createSolution, queryClient, onClose]
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="솔루션 등록하기"
      snapPoints={[0.55, 0.75, 0.9]}
      defaultSnapPoint={0.75}
    >
      <div className="pb-8 w-full">
        <SolutionLinkForm
          spotId={spotId}
          onSave={handleSave}
          onCancel={onClose}
        />
      </div>
    </BottomSheet>
  );
}
