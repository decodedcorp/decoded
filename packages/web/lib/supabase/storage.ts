/**
 * Supabase Storage 유틸리티
 * 이미지 업로드 및 URL 관리
 */

import { supabaseBrowserClient } from "./client";

const BUCKET_NAME = "request-images";

/**
 * 고유한 파일 경로 생성
 */
function generateFilePath(file: File): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).slice(2, 9);
  const extension = file.name.split(".").pop() || "jpg";
  return `temp/${timestamp}_${randomId}.${extension}`;
}

/**
 * Supabase Storage에 이미지 업로드
 * @param file - 업로드할 파일
 * @returns 공개 URL
 */
export async function uploadToSupabaseStorage(file: File): Promise<string> {
  const filePath = generateFilePath(file);

  const { error: uploadError } = await supabaseBrowserClient.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "31536000, immutable",
      upsert: false,
    });

  if (uploadError) {
    console.error("Supabase Storage upload error:", uploadError);
    throw new Error(`이미지 업로드 실패: ${uploadError.message}`);
  }

  // 공개 URL 가져오기
  const {
    data: { publicUrl },
  } = supabaseBrowserClient.storage.from(BUCKET_NAME).getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Supabase Storage에서 이미지 삭제
 * @param url - 삭제할 이미지의 공개 URL
 */
export async function deleteFromSupabaseStorage(url: string): Promise<void> {
  // URL에서 파일 경로 추출
  const urlParts = url.split(`${BUCKET_NAME}/`);
  if (urlParts.length < 2) {
    console.warn("Invalid storage URL format:", url);
    return;
  }

  const filePath = urlParts[1];

  const { error } = await supabaseBrowserClient.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    console.error("Failed to delete from storage:", error);
  }
}
