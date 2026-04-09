"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { useImageUpload } from "@/lib/hooks/useImageUpload";
import { useCreateTryPost } from "@/lib/hooks/useTries";
import { compressImage } from "@/lib/utils/imageCompression";
import { DropZone } from "@/lib/components/request/DropZone";
import { MobileUploadOptions } from "@/lib/components/request/MobileUploadOptions";
import { SpotTagSelector } from "@/lib/components/request/SpotTagSelector";
import { ArrowLeft, X, RefreshCw, Loader2 } from "lucide-react";
import { useGetPost } from "@/lib/api/generated/posts/posts";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function TryUploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parentId = searchParams.get("parent") ?? "";

  const [comment, setComment] = useState("");
  const [selectedSpotIds, setSelectedSpotIds] = useState<string[]>([]);

  const isValidParent = UUID_REGEX.test(parentId);

  // Invalid parent → side effect를 useEffect로 처리
  useEffect(() => {
    if (!isValidParent) {
      toast.error("포스트를 찾을 수 없습니다.");
      router.push("/");
    }
  }, [isValidParent, router]);

  // Fetch parent post
  const { data: parentPost, isLoading: isLoadingParent } = useGetPost(
    parentId,
    { query: { enabled: isValidParent } }
  );

  // Image upload
  const { images, handleFilesSelected, removeImage } = useImageUpload({
    autoUpload: false,
    autoAnalyze: false,
  });

  const selectedImage = images[0] ?? null;
  const hasImage = !!selectedImage;

  // Try creation mutation
  const createTry = useCreateTryPost();

  const handleClose = useCallback(() => {
    if (isValidParent) {
      router.push(`/posts/${parentId}`);
    } else {
      router.push("/");
    }
  }, [router, parentId, isValidParent]);

  const handleSubmit = useCallback(async () => {
    if (!selectedImage?.file || !isValidParent) return;

    try {
      const compressed = await compressImage(selectedImage.file);

      await createTry.mutateAsync({
        file: compressed,
        parent_post_id: parentId,
        spot_ids:
          selectedSpotIds.length > 0 ? selectedSpotIds : undefined,
        media_title: comment.trim() || undefined,
      });

      toast.success("Try가 공유되었습니다!");
      router.push(`/posts/${parentId}`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "업로드에 실패했습니다. 다시 시도해주세요."
      );
    }
  }, [
    selectedImage,
    isValidParent,
    parentId,
    selectedSpotIds,
    comment,
    createTry,
    router,
  ]);

  // Invalid parent일 때는 useEffect redirect가 처리하므로 아무것도 렌더하지 않음
  if (!isValidParent) {
    return null;
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-3">
        <button onClick={handleClose} className="p-1">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold">나도 해봤어</h1>
        <button onClick={handleClose} className="p-1">
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 space-y-4 p-4">
        {/* Original Post Preview */}
        {isLoadingParent ? (
          <div className="flex animate-pulse items-center gap-3 rounded-lg border p-3">
            <div className="h-12 w-12 rounded bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-3 w-20 rounded bg-muted" />
            </div>
          </div>
        ) : parentPost ? (
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded">
              <Image
                src={parentPost.image_url}
                alt="원본 포스트"
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {parentPost.title || "원본 포스트"}
              </p>
              <p className="text-xs text-muted-foreground">
                {parentPost.artist_name && `@${parentPost.artist_name}`}
                {parentPost.context && ` · ${parentPost.context}`}
              </p>
            </div>
          </div>
        ) : null}

        {/* Image Upload */}
        {!hasImage ? (
          <>
            <MobileUploadOptions
              onFilesSelected={handleFilesSelected}
              disabled={false}
            />
            <DropZone
              onFilesSelected={handleFilesSelected}
              disabled={false}
            />
          </>
        ) : (
          <div className="space-y-2">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg">
              <Image
                src={selectedImage.previewUrl}
                alt="Try 이미지"
                fill
                className="object-cover"
              />
            </div>
            <button
              onClick={() => removeImage(selectedImage.id)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-4 w-4" />
              다시 선택
            </button>
          </div>
        )}

        {/* Spot Tag Selector */}
        <SpotTagSelector
          parentPostId={parentId}
          selectedSpotIds={selectedSpotIds}
          onSelectionChange={setSelectedSpotIds}
        />

        {/* Comment */}
        <div className="space-y-1">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 100))}
            placeholder="한줄 코멘트 (선택)"
            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            maxLength={100}
          />
          <p className="text-right text-xs text-muted-foreground">
            {comment.length}/100
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="border-t p-4">
        <button
          onClick={handleSubmit}
          disabled={!hasImage || createTry.isPending}
          className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
        >
          {createTry.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              업로드 중...
            </span>
          ) : (
            "Try 공유하기"
          )}
        </button>
      </div>
    </div>
  );
}

function TryUploadFallback() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="h-7 w-7 rounded bg-muted" />
        <div className="h-4 w-24 rounded bg-muted" />
        <div className="h-7 w-7 rounded bg-muted" />
      </header>
      <div className="flex-1 animate-pulse space-y-4 p-4">
        <div className="h-18 rounded-lg bg-muted" />
        <div className="h-40 rounded-lg bg-muted" />
      </div>
    </div>
  );
}

export default function TryUploadPage() {
  return (
    <Suspense fallback={<TryUploadFallback />}>
      <TryUploadContent />
    </Suspense>
  );
}
