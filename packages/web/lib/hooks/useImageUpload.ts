/**
 * 이미지 업로드 로직 훅
 * 파일 검증, 압축, API를 통한 업로드를 처리합니다.
 *
 * 플로우: 이미지 선택 → 압축 → API 업로드 → AI 분석 자동 실행
 */

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  useRequestStore,
  getRequestActions,
  selectImages,
  selectIsMaxImages,
} from "@/lib/stores/requestStore";
import {
  validateImageFile,
  validateAddingImages,
  extractImageFromClipboard,
  UPLOAD_CONFIG,
} from "@/lib/utils/validation";
import { compressImage } from "@/lib/utils/imageCompression";
import { uploadImage } from "@/lib/api/posts";

export interface UseImageUploadOptions {
  autoUpload?: boolean;
  autoAnalyze?: boolean;
  onUploadComplete?: (id: string, url: string) => void;
  onUploadError?: (id: string, error: string) => void;
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const {
    autoUpload = true,
    autoAnalyze = true,
    onUploadComplete,
    onUploadError,
  } = options;

  // 상태만 구독 (렌더링에 필요한 것만)
  const images = useRequestStore(selectImages);
  const isMaxImages = useRequestStore(selectIsMaxImages);

  // 콜백 옵션을 ref로 저장 (의존성 제거)
  const optionsRef = useRef({ onUploadComplete, onUploadError, autoAnalyze });
  optionsRef.current = { onUploadComplete, onUploadError, autoAnalyze };

  /**
   * 단일 이미지 업로드 (API)
   * 업로드 완료 후 자동으로 AI 분석 시작
   *
   * Action들을 getRequestActions()로 접근하여 의존성 제거
   */
  const uploadToStorage = useCallback(async (id: string, file: File) => {
    const { updateImageStatus, setImageUploadedUrl, startDetection } =
      getRequestActions();
    const { onUploadComplete, onUploadError, autoAnalyze } = optionsRef.current;

    updateImageStatus(id, "uploading", 0);

    try {
      // 1. 이미지 압축
      updateImageStatus(id, "uploading", 10);
      const { file: compressedFile, wasCompressed } = await compressImage(file);

      if (wasCompressed) {
        console.log(`Image compressed: ${file.name}`);
      }

      // 2. API를 통해 백엔드에 업로드
      const { image_url } = await uploadImage({
        file: compressedFile,
        onProgress: (progress) => updateImageStatus(id, "uploading", progress),
      });

      // 3. 업로드 완료
      setImageUploadedUrl(id, image_url);
      onUploadComplete?.(id, image_url);
      updateImageStatus(id, "uploaded", 100);

      // 4. 자동 AI 분석 시작
      if (autoAnalyze) {
        // 약간의 딜레이 후 분석 시작 (UI 업데이트 대기)
        setTimeout(() => {
          startDetection();
        }, 100);
      }
    } catch (error) {
      const rawMessage =
        error instanceof Error ? error.message : "Upload failed";
      // Translate common error messages for better UX
      const isServerError =
        rawMessage.includes("502") ||
        rawMessage.includes("503") ||
        rawMessage.includes("504");
      const errorMessage = isServerError
        ? "서버가 일시적으로 응답하지 않습니다. 다시 시도해주세요."
        : rawMessage;
      updateImageStatus(id, "error", 0, errorMessage);
      onUploadError?.(id, errorMessage);
      toast.error(errorMessage);
    }
  }, []); // 의존성 없음 - 모든 값을 런타임에 접근

  // 현재 이미지 개수를 ref로 저장 (의존성 제거)
  const imagesLengthRef = useRef(images.length);
  imagesLengthRef.current = images.length;

  /**
   * 파일 추가 (검증 + 선택적 자동 업로드)
   *
   * Action들을 getRequestActions()로 접근하여 의존성 제거
   */
  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      const { addImages } = getRequestActions();
      const currentLength = imagesLengthRef.current;

      // 개수 검증
      const countValidation = validateAddingImages(currentLength, files.length);
      if (!countValidation.valid) {
        toast.error(countValidation.error);
        return;
      }

      const validFiles: File[] = [];
      const errors: string[] = [];

      // 각 파일 검증
      for (const file of files) {
        const validation = validateImageFile(file);
        if (validation.valid) {
          validFiles.push(file);
        } else {
          errors.push(`${file.name}: ${validation.error}`);
        }
      }

      // 에러가 있으면 토스트 표시
      if (errors.length > 0) {
        errors.forEach((err) => toast.error(err));
      }

      if (validFiles.length === 0) return;

      // 스토어에 추가
      const addedIds = addImages(validFiles);

      // 자동 업로드가 활성화되어 있으면 업로드 시작
      if (autoUpload) {
        for (let i = 0; i < addedIds.length; i++) {
          const id = addedIds[i];
          const file = validFiles[i];
          // 순차적으로 업로드 (병렬 업로드도 가능하지만 서버 부하 고려)
          uploadToStorage(id, file);
        }
      }
    },
    [autoUpload, uploadToStorage]
  );

  // 이미지 배열을 ref로 저장 (retryUpload용)
  const imagesRef = useRef(images);
  imagesRef.current = images;

  /**
   * 재시도
   */
  const retryUpload = useCallback(
    (id: string) => {
      const image = imagesRef.current.find((img) => img.id === id);
      if (image && image.status === "error") {
        uploadToStorage(id, image.file);
      }
    },
    [uploadToStorage]
  );

  // ref로 최신 값을 저장하여 이벤트 리스너 재등록 방지
  const handleFilesSelectedRef = useRef(handleFilesSelected);
  const isMaxImagesRef = useRef(isMaxImages);

  // ref 값을 항상 최신으로 유지
  useEffect(() => {
    handleFilesSelectedRef.current = handleFilesSelected;
  }, [handleFilesSelected]);

  useEffect(() => {
    isMaxImagesRef.current = isMaxImages;
  }, [isMaxImages]);

  // 클립보드 붙여넣기 이벤트 등록 (마운트 시 1회만)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isMaxImagesRef.current) return;
      if (!e.clipboardData) return;

      const imageFile = extractImageFromClipboard(e.clipboardData);
      if (imageFile) {
        e.preventDefault();
        handleFilesSelectedRef.current([imageFile]);
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, []);

  // Action들은 getRequestActions()에서 가져오기 (안정적인 참조)
  const { removeImage, clearImages } = getRequestActions();

  return {
    images,
    isMaxImages,
    remainingSlots: UPLOAD_CONFIG.maxImages - images.length,
    handleFilesSelected,
    removeImage,
    retryUpload,
    clearImages,
    uploadToStorage,
  };
}
