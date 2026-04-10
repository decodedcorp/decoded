/**
 * Post 생성 훅
 * React Query mutation을 사용하여 Post를 생성합니다.
 */

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createPost,
  createPostWithSolution,
  storeToApiCoord,
  type CreatePostRequest,
  type CreatePostWithSolutionRequest,
  type CreatePostResponse,
  type SpotWithSolutionRequest,
} from "@/lib/api";
import {
  useRequestStore,
  selectImages,
  selectDetectedSpots,
  selectDescription,
  selectExtractedMetadata,
  selectMediaSource,
  selectArtistName,
  selectGroupName,
  selectContext,
} from "@/lib/stores/requestStore";
import { useCategoryCodeMap } from "./useCategories";

interface UseCreatePostOptions {
  onSuccess?: (response: CreatePostResponse) => void;
  onError?: (error: Error) => void;
}

export function useCreatePost(options: UseCreatePostOptions = {}) {
  const router = useRouter();
  const categoryCodeMap = useCategoryCodeMap();

  // Store selectors
  const images = useRequestStore(selectImages);
  const detectedSpots = useRequestStore(selectDetectedSpots);
  const description = useRequestStore(selectDescription);
  const extractedMetadata = useRequestStore(selectExtractedMetadata);
  const mediaSource = useRequestStore(selectMediaSource);
  const artistName = useRequestStore(selectArtistName);
  const groupName = useRequestStore(selectGroupName);
  const context = useRequestStore(selectContext);

  // Store actions
  const setSubmitting = useRequestStore((s) => s.setSubmitting);
  const setSubmitError = useRequestStore((s) => s.setSubmitError);
  const resetRequestFlow = useRequestStore((s) => s.resetRequestFlow);

  const mutation = useMutation({
    mutationFn: async () => {
      // 업로드된 이미지 URL 가져오기
      const uploadedImage = images.find((img) => img.status === "uploaded");
      if (!uploadedImage?.uploadedUrl) {
        throw new Error("업로드된 이미지가 없습니다.");
      }

      // 필수 필드 검증
      if (!mediaSource?.type || !mediaSource?.title) {
        throw new Error("미디어 소스 정보가 필요합니다.");
      }

      // Solution이 있는 spot이 하나라도 있는지 확인
      const hasSolutions = detectedSpots.some((spot) => spot.solution);

      if (hasSolutions) {
        // Solution을 아는 유저 → /api/v1/posts/with-solution
        const spotsWithSolution: SpotWithSolutionRequest[] = detectedSpots
          .filter((spot) => spot.solution)
          .map((spot) => {
            const categoryId = spot.categoryCode
              ? categoryCodeMap.get(spot.categoryCode)
              : undefined;

            if (!categoryId) {
              console.warn(
                `Category not found for code: ${spot.categoryCode}, using first available`
              );
            }

            return {
              position_left: storeToApiCoord(spot.center.x),
              position_top: storeToApiCoord(spot.center.y),
              category_id: categoryId || "",
              solution: {
                title: spot.solution!.title,
                original_url: spot.solution!.originalUrl,
                thumbnail_url: spot.solution!.thumbnailUrl,
                price_amount: spot.solution!.priceAmount,
                price_currency: spot.solution!.priceCurrency || "KRW",
                description: spot.solution!.description,
              },
            };
          })
          .filter((s) => s.category_id);

        const request: CreatePostWithSolutionRequest = {
          image_url: uploadedImage.uploadedUrl,
          media_source: mediaSource,
          spots: spotsWithSolution,
          ...(description && { description }),
          ...(extractedMetadata.length > 0 && {
            media_metadata: extractedMetadata,
          }),
          ...(artistName && { artist_name: artistName }),
          ...(groupName && { group_name: groupName }),
          ...(context && { context }),
          ...(uploadedImage.imageWidth && {
            image_width: uploadedImage.imageWidth,
          }),
          ...(uploadedImage.imageHeight && {
            image_height: uploadedImage.imageHeight,
          }),
        };

        return createPostWithSolution(request);
      } else {
        // Solution을 모르는 유저 → /api/v1/posts (기존)
        const spots = detectedSpots.map((spot) => {
          const categoryId = spot.categoryCode
            ? categoryCodeMap.get(spot.categoryCode)
            : undefined;

          if (!categoryId) {
            console.warn(
              `Category not found for code: ${spot.categoryCode}, using first available`
            );
          }

          return {
            position_left: storeToApiCoord(spot.center.x),
            position_top: storeToApiCoord(spot.center.y),
            category_id: categoryId || "",
          };
        });

        const request: CreatePostRequest = {
          image_url: uploadedImage.uploadedUrl,
          media_source: mediaSource,
          spots: spots.filter((s) => s.category_id),
          ...(description && { description }),
          ...(extractedMetadata.length > 0 && {
            media_metadata: extractedMetadata,
          }),
          ...(artistName && { artist_name: artistName }),
          ...(groupName && { group_name: groupName }),
          ...(context && { context }),
          ...(uploadedImage.imageWidth && {
            image_width: uploadedImage.imageWidth,
          }),
          ...(uploadedImage.imageHeight && {
            image_height: uploadedImage.imageHeight,
          }),
        };

        return createPost(request);
      }
    },
    onMutate: () => {
      setSubmitting(true);
      setSubmitError(null);
    },
    onSuccess: (response) => {
      setSubmitting(false);
      toast.success("Post가 성공적으로 생성되었습니다!");

      // 사용자 콜백 호출
      options.onSuccess?.(response);

      // 상태 초기화
      resetRequestFlow();

      // 생성된 Post 페이지로 이동
      if (response.slug) {
        router.push(`/post/${response.slug}`);
      } else if (response.id) {
        router.push(`/post/${response.id}`);
      }
    },
    onError: (error: Error) => {
      setSubmitting(false);
      setSubmitError(error.message);
      toast.error(error.message);

      // 사용자 콜백 호출
      options.onError?.(error);
    },
  });

  return {
    submit: mutation.mutate,
    isSubmitting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
