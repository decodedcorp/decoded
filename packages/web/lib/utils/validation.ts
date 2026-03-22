/**
 * 파일 검증 유틸리티
 * 이미지 업로드 시 파일 크기, 형식 등을 검증합니다.
 */

export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxImages: 1, // 단일 이미지만 허용 (AI 감지용)
  supportedFormats: ["image/jpeg", "image/png", "image/webp"] as const,
  supportedExtensions: [".jpg", ".jpeg", ".png", ".webp"] as const,
} as const;

export type SupportedFormat = (typeof UPLOAD_CONFIG.supportedFormats)[number];

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * 파일 크기 검증
 */
export function validateFileSize(file: File): ValidationResult {
  if (file.size > UPLOAD_CONFIG.maxFileSize) {
    const maxSizeMB = UPLOAD_CONFIG.maxFileSize / (1024 * 1024);
    return {
      valid: false,
      error: `파일 크기가 ${maxSizeMB}MB를 초과합니다.`,
    };
  }
  return { valid: true };
}

/**
 * 파일 형식 검증
 */
export function validateFileFormat(file: File): ValidationResult {
  const isSupported = UPLOAD_CONFIG.supportedFormats.includes(
    file.type as SupportedFormat
  );

  if (!isSupported) {
    return {
      valid: false,
      error: `지원하지 않는 파일 형식입니다. JPG, PNG, WebP만 지원합니다.`,
    };
  }
  return { valid: true };
}

/**
 * 이미지 파일 전체 검증
 */
export function validateImageFile(file: File): ValidationResult {
  const formatResult = validateFileFormat(file);
  if (!formatResult.valid) {
    return formatResult;
  }

  const sizeResult = validateFileSize(file);
  if (!sizeResult.valid) {
    return sizeResult;
  }

  return { valid: true };
}

/**
 * 현재 이미지 개수 검증
 */
export function validateImageCount(currentCount: number): ValidationResult {
  if (currentCount >= UPLOAD_CONFIG.maxImages) {
    return {
      valid: false,
      error: `최대 ${UPLOAD_CONFIG.maxImages}장까지만 업로드할 수 있습니다.`,
    };
  }
  return { valid: true };
}

/**
 * 여러 파일 추가 시 검증 (현재 개수 + 새 파일 개수)
 */
export function validateAddingImages(
  currentCount: number,
  newFilesCount: number
): ValidationResult {
  const totalCount = currentCount + newFilesCount;
  if (totalCount > UPLOAD_CONFIG.maxImages) {
    const remaining = UPLOAD_CONFIG.maxImages - currentCount;
    return {
      valid: false,
      error:
        remaining > 0
          ? `${remaining}장만 더 추가할 수 있습니다.`
          : `최대 ${UPLOAD_CONFIG.maxImages}장까지만 업로드할 수 있습니다.`,
    };
  }
  return { valid: true };
}

/**
 * 파일이 이미지인지 확인
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

/**
 * DataTransfer에서 이미지 파일만 추출
 */
export function extractImageFiles(dataTransfer: DataTransfer): File[] {
  const files: File[] = [];
  for (let i = 0; i < dataTransfer.files.length; i++) {
    const file = dataTransfer.files[i];
    if (isImageFile(file)) {
      files.push(file);
    }
  }
  return files;
}

/**
 * 클립보드에서 이미지 파일 추출
 */
export function extractImageFromClipboard(
  clipboardData: DataTransfer
): File | null {
  for (let i = 0; i < clipboardData.items.length; i++) {
    const item = clipboardData.items[i];
    if (item.type.startsWith("image/")) {
      return item.getAsFile();
    }
  }
  return null;
}
