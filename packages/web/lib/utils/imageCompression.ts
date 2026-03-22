/**
 * 이미지 압축 유틸리티
 * browser-image-compression 라이브러리를 사용하여 이미지를 압축합니다.
 */

import imageCompression, { type Options } from "browser-image-compression";

export const COMPRESSION_CONFIG = {
  maxSizeMB: 2,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: "image/jpeg" as const,
  initialQuality: 0.85,
} as const;

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  wasCompressed: boolean;
}

/**
 * 이미지 압축
 * - 2MB 이상인 경우 압축
 * - 1920px 이상인 경우 리사이즈
 */
export async function compressImage(file: File): Promise<CompressionResult> {
  const originalSize = file.size;
  const needsCompression =
    file.size > COMPRESSION_CONFIG.maxSizeMB * 1024 * 1024;

  if (!needsCompression) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      wasCompressed: false,
    };
  }

  const options: Options = {
    maxSizeMB: COMPRESSION_CONFIG.maxSizeMB,
    maxWidthOrHeight: COMPRESSION_CONFIG.maxWidthOrHeight,
    useWebWorker: COMPRESSION_CONFIG.useWebWorker,
    initialQuality: COMPRESSION_CONFIG.initialQuality,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return {
      file: compressedFile,
      originalSize,
      compressedSize: compressedFile.size,
      wasCompressed: true,
    };
  } catch {
    // 압축 실패 시 원본 반환
    console.warn("이미지 압축 실패, 원본 파일 사용:", file.name);
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      wasCompressed: false,
    };
  }
}

/**
 * 여러 이미지 일괄 압축
 */
export async function compressImages(
  files: File[]
): Promise<CompressionResult[]> {
  return Promise.all(files.map(compressImage));
}

/**
 * 파일 크기를 읽기 좋은 형식으로 변환
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * 이미지 미리보기 URL 생성
 */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * 이미지 미리보기 URL 해제
 */
export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}
