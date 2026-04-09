/**
 * 오프라인 임시 저장 유틸리티
 * Request flow 진행 중 데이터를 localStorage에 저장하여
 * 페이지 이탈/네트워크 오류 시 복원할 수 있게 합니다.
 */

import type { MediaSource, ContextType } from "@/lib/api/mutation-types";

const DRAFT_KEY = "decoded_request_draft";
const DRAFT_THUMBNAIL_KEY = "decoded_request_draft_thumb";
const MAX_THUMBNAIL_SIZE = 100 * 1024; // 100KB

export interface RequestDraft {
  savedAt: number;
  userKnowsItems: boolean | null;
  spots: Array<{
    id: string;
    index: number;
    center: { x: number; y: number };
    label?: string;
    categoryCode?: string;
    title: string;
    description: string;
    solution?: {
      title: string;
      originalUrl: string;
      thumbnailUrl?: string;
      priceAmount?: number;
      priceCurrency?: string;
      description?: string;
    };
  }>;
  mediaSource: MediaSource | null;
  artistName: string;
  groupName: string;
  context: ContextType | null;
}

/**
 * Request flow 상태를 localStorage에 저장
 */
export function saveDraft(draft: Omit<RequestDraft, "savedAt">): void {
  try {
    const data: RequestDraft = { ...draft, savedAt: Date.now() };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch {
    // localStorage가 가득 찬 경우 등 무시
  }
}

/**
 * 이미지 썸네일을 base64로 저장 (복원 시 시각적 확인용)
 */
export async function saveDraftThumbnail(file: File): Promise<void> {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const url = URL.createObjectURL(file);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    URL.revokeObjectURL(url);

    // 최대 200px로 리사이즈
    const scale = Math.min(200 / img.naturalWidth, 200 / img.naturalHeight, 1);
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
    if (dataUrl.length <= MAX_THUMBNAIL_SIZE) {
      localStorage.setItem(DRAFT_THUMBNAIL_KEY, dataUrl);
    }
  } catch {
    // 썸네일 저장 실패는 무시
  }
}

/**
 * 저장된 draft 불러오기
 * 24시간 이상 경과한 draft는 무효 처리
 */
export function loadDraft(): RequestDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;

    const draft: RequestDraft = JSON.parse(raw);
    const ageMs = Date.now() - draft.savedAt;
    const MAX_AGE = 24 * 60 * 60 * 1000; // 24시간

    if (ageMs > MAX_AGE) {
      clearDraft();
      return null;
    }

    return draft;
  } catch {
    clearDraft();
    return null;
  }
}

/**
 * 저장된 썸네일 불러오기
 */
export function loadDraftThumbnail(): string | null {
  try {
    return localStorage.getItem(DRAFT_THUMBNAIL_KEY);
  } catch {
    return null;
  }
}

/**
 * Draft 삭제 (포스트 생성 성공 시 호출)
 */
export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(DRAFT_THUMBNAIL_KEY);
  } catch {
    // 무시
  }
}

/**
 * Draft가 존재하는지 확인
 */
export function hasDraft(): boolean {
  return loadDraft() !== null;
}
