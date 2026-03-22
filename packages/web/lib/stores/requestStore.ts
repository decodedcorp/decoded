/**
 * Request Flow 상태 관리
 * 이미지 업로드 → AI 감지 → 태그 편집 → 요청 제출의 전체 흐름을 관리합니다.
 */

import { create } from "zustand";
import { toast } from "sonner";
import {
  createPreviewUrl,
  revokePreviewUrl,
} from "@/lib/utils/imageCompression";
import { UPLOAD_CONFIG } from "@/lib/utils/validation";
import {
  analyzeImage,
  apiToStoreCoord,
  type DetectedItem,
  type MediaSource,
  type MediaMetadataItem,
  type ContextType,
} from "@/lib/api";

export type UploadStatus = "pending" | "uploading" | "uploaded" | "error";
export type RequestStep = 1 | 2 | 3;

export interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
  uploadedUrl?: string;
  status: UploadStatus;
  progress: number;
  error?: string;
}

// Solution 정보 (사용자가 알고 있는 상품 정보)
export interface SpotSolutionData {
  title: string;
  originalUrl: string;
  thumbnailUrl?: string;
  priceAmount?: number;
  priceCurrency?: string; // default: 'KRW'
  description?: string;
}

// AI 감지 결과 - Spot 데이터
export interface DetectedSpot {
  id: string;
  index: number; // 1, 2, 3...
  center: {
    x: number; // 0-1 (0=왼쪽, 1=오른쪽)
    y: number; // 0-1 (0=위, 1=아래)
  };
  label?: string; // "TOP", "BOTTOM" 등
  categoryCode?: string; // "fashion", "beauty" 등

  // Card display fields
  title: string;
  description: string;
  brand?: string;
  priceRange?: string;
  imageUrl?: string; // 아이템 썸네일 이미지
  confidence?: number; // AI 신뢰도

  // Solution (사용자가 알고 있는 상품 정보)
  solution?: SpotSolutionData;
}

// AI 메타데이터 (Step 3 초기값으로 사용)
export interface AiMetadata {
  artistName?: string;
  context?: string;
}

interface RequestState {
  // Step 1: Upload
  images: UploadedImage[];
  currentStep: RequestStep;

  // User type (after image upload)
  userKnowsItems: boolean | null;

  // Step 2: AI Detection
  detectedSpots: DetectedSpot[];
  isDetecting: boolean;
  isRevealing: boolean; // reveal 애니메이션 진행 중
  selectedSpotId: string | null;
  aiMetadata: AiMetadata;
  detectionError: string | null;

  // Step 3: Details
  description: string;
  extractedMetadata: MediaMetadataItem[];
  isExtractingMetadata: boolean;
  mediaSource: MediaSource | null;
  artistName: string;
  groupName: string;
  context: ContextType | null;

  // Step 4: Submit
  isSubmitting: boolean;
  submitError: string | null;

  // Actions - Images
  addImage: (file: File) => string | null;
  addImages: (files: File[]) => string[];
  removeImage: (id: string) => void;
  updateImageStatus: (
    id: string,
    status: UploadStatus,
    progress?: number,
    error?: string
  ) => void;
  setImageUploadedUrl: (id: string, url: string) => void;
  clearImages: () => void;

  // Actions - Detection / Manual Spot Creation
  startDetection: () => Promise<void>;
  setDetectedSpots: (spots: DetectedSpot[]) => void;
  selectSpot: (spotId: string | null) => void;
  addSpot: (x: number, y: number, categoryCode?: string) => void;
  removeSpot: (spotId: string) => void;

  // Actions - Solution
  setSpotSolution: (spotId: string, solution: SpotSolutionData) => void;
  clearSpotSolution: (spotId: string) => void;

  // Actions - Details (Step 3)
  setDescription: (description: string) => void;
  setExtractedMetadata: (metadata: MediaMetadataItem[]) => void;
  setIsExtractingMetadata: (extracting: boolean) => void;
  setMediaSource: (source: MediaSource | null) => void;
  setArtistName: (name: string) => void;
  setGroupName: (name: string) => void;
  setContext: (context: ContextType | null) => void;

  // Actions - Submit (Step 4)
  setSubmitting: (submitting: boolean) => void;
  setSubmitError: (error: string | null) => void;

  // Actions - Navigation
  setStep: (step: RequestStep) => void;
  canProceedToNextStep: () => boolean;

  // Actions - Reset
  resetRequestFlow: () => void;

  // User type selection
  setUserKnowsItems: (value: boolean) => void;
}

function generateId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * API 응답을 DetectedSpot으로 변환
 */
function convertApiToSpot(item: DetectedItem, index: number): DetectedSpot {
  return {
    id: `spot_${index + 1}`,
    index: index + 1,
    center: {
      x: apiToStoreCoord(item.left),
      y: apiToStoreCoord(item.top),
    },
    label: item.label.toUpperCase(),
    categoryCode: item.category,
    title: item.label,
    description: `Detected with ${Math.round(item.confidence * 100)}% confidence`,
    confidence: item.confidence,
  };
}

const initialState = {
  images: [] as UploadedImage[],
  currentStep: 1 as RequestStep,
  userKnowsItems: null as boolean | null,
  detectedSpots: [] as DetectedSpot[],
  isDetecting: false,
  isRevealing: false,
  selectedSpotId: null as string | null,
  aiMetadata: {} as AiMetadata,
  detectionError: null as string | null,
  // Step 3
  description: "",
  extractedMetadata: [] as MediaMetadataItem[],
  isExtractingMetadata: false,
  mediaSource: null as MediaSource | null,
  artistName: "",
  groupName: "",
  context: null as ContextType | null,
  // Step 4
  isSubmitting: false,
  submitError: null as string | null,
};

export const useRequestStore = create<RequestState>((set, get) => ({
  ...initialState,

  addImage: (file: File) => {
    const { images } = get();
    if (images.length >= UPLOAD_CONFIG.maxImages) {
      return null;
    }

    const id = generateId();
    const previewUrl = createPreviewUrl(file);

    const newImage: UploadedImage = {
      id,
      file,
      previewUrl,
      status: "pending",
      progress: 0,
    };

    set((state) => ({
      images: [...state.images, newImage],
    }));

    return id;
  },

  addImages: (files: File[]) => {
    const { images } = get();
    const remainingSlots = UPLOAD_CONFIG.maxImages - images.length;
    const filesToAdd = files.slice(0, remainingSlots);

    const newImages: UploadedImage[] = filesToAdd.map((file) => ({
      id: generateId(),
      file,
      previewUrl: createPreviewUrl(file),
      status: "pending" as const,
      progress: 0,
    }));

    set((state) => ({
      images: [...state.images, ...newImages],
    }));

    return newImages.map((img) => img.id);
  },

  removeImage: (id: string) => {
    const { images } = get();
    const imageToRemove = images.find((img) => img.id === id);

    if (imageToRemove) {
      revokePreviewUrl(imageToRemove.previewUrl);
    }

    set((state) => ({
      images: state.images.filter((img) => img.id !== id),
    }));
  },

  updateImageStatus: (id, status, progress, error) => {
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id
          ? {
              ...img,
              status,
              progress: progress ?? img.progress,
              error: error ?? (status === "error" ? img.error : undefined),
            }
          : img
      ),
    }));
  },

  setImageUploadedUrl: (id, url) => {
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id
          ? {
              ...img,
              uploadedUrl: url,
              status: "uploaded" as const,
              progress: 100,
            }
          : img
      ),
    }));
  },

  clearImages: () => {
    const { images } = get();
    images.forEach((img) => revokePreviewUrl(img.previewUrl));
    set({ images: [] });
  },

  // Detection Actions
  startDetection: async () => {
    const { images } = get();
    const uploadedImage = images.find((img) => img.status === "uploaded");

    if (!uploadedImage?.uploadedUrl) {
      toast.error("업로드된 이미지가 없습니다.");
      return;
    }

    set({
      isDetecting: true,
      currentStep: 2,
      detectionError: null,
    });

    try {
      const response = await analyzeImage(uploadedImage.uploadedUrl);

      // API 응답을 DetectedSpot으로 변환
      const spots = response.detected_items.map((item, index) =>
        convertApiToSpot(item, index)
      );

      // AI 메타데이터 저장 (Step 3 초기값)
      const aiMetadata: AiMetadata = {
        artistName: response.metadata.artist_name,
        context: response.metadata.context,
      };

      set({
        detectedSpots: spots,
        isDetecting: false,
        isRevealing: true,
        aiMetadata,
        // AI 추천값으로 Step 3 초기화
        artistName: response.metadata.artist_name || "",
        context: (response.metadata.context as ContextType) || null,
      });

      // reveal 애니메이션 종료 (1.5초 후)
      setTimeout(() => {
        set({ isRevealing: false });
      }, 1500);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "AI 분석에 실패했습니다.";
      set({
        isDetecting: false,
        detectionError: errorMessage,
      });
      toast.error(errorMessage);
    }
  },

  setDetectedSpots: (spots) => {
    set({ detectedSpots: spots });
  },

  selectSpot: (spotId) => {
    set({ selectedSpotId: spotId });
  },

  // Manual Spot Creation
  addSpot: (x, y, categoryCode) => {
    const { detectedSpots } = get();
    const newIndex = detectedSpots.length + 1;
    const newSpot: DetectedSpot = {
      id: `spot_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      index: newIndex,
      center: { x, y },
      categoryCode: categoryCode || "fashion", // 기본 카테고리
      title: `Spot ${newIndex}`,
      description: "Tap to add product info",
    };

    set((state) => ({
      detectedSpots: [...state.detectedSpots, newSpot],
      selectedSpotId: newSpot.id, // 새로 추가된 spot 자동 선택
    }));
  },

  removeSpot: (spotId) => {
    set((state) => {
      const filteredSpots = state.detectedSpots.filter((s) => s.id !== spotId);
      // Re-index spots
      const reindexedSpots = filteredSpots.map((spot, idx) => ({
        ...spot,
        index: idx + 1,
        title: spot.solution?.title || `Spot ${idx + 1}`,
      }));
      return {
        detectedSpots: reindexedSpots,
        selectedSpotId:
          state.selectedSpotId === spotId ? null : state.selectedSpotId,
      };
    });
  },

  // Solution Actions
  setSpotSolution: (spotId, solution) => {
    set((state) => ({
      detectedSpots: state.detectedSpots.map((spot) =>
        spot.id === spotId ? { ...spot, solution } : spot
      ),
    }));
  },

  clearSpotSolution: (spotId) => {
    set((state) => ({
      detectedSpots: state.detectedSpots.map((spot) =>
        spot.id === spotId ? { ...spot, solution: undefined } : spot
      ),
    }));
  },

  // Step 3 Actions
  setDescription: (description) => {
    set({ description });
  },

  setExtractedMetadata: (metadata) => {
    set({ extractedMetadata: metadata });
  },

  setIsExtractingMetadata: (extracting) => {
    set({ isExtractingMetadata: extracting });
  },

  setMediaSource: (source) => {
    set({ mediaSource: source });
  },

  setArtistName: (name) => {
    set({ artistName: name });
  },

  setGroupName: (name) => {
    set({ groupName: name });
  },

  setContext: (context) => {
    set({ context: context });
  },

  // Step 4 Actions
  setSubmitting: (submitting) => {
    set({ isSubmitting: submitting });
  },

  setSubmitError: (error) => {
    set({ submitError: error });
  },

  setStep: (step) => {
    set({ currentStep: step });
  },

  canProceedToNextStep: () => {
    const { images, currentStep, detectedSpots, mediaSource } = get();

    switch (currentStep) {
      case 1:
        // Step 1: 최소 1장 이상의 이미지가 업로드 완료되어야 함
        return images.some((img) => img.status === "uploaded");
      case 2:
        // Step 2: AI 감지 완료 - spots가 있어야 함
        return detectedSpots.length > 0;
      case 3:
        // Step 3: 필수 필드 검증 - media_source의 type과 title이 있어야 함 (Submit merged into Details)
        return !!(mediaSource?.type && mediaSource?.title);
      default:
        return false;
    }
  },

  resetRequestFlow: () => {
    const { images } = get();
    images.forEach((img) => revokePreviewUrl(img.previewUrl));
    set(initialState);
  },

  setUserKnowsItems: (value) => {
    set({ userKnowsItems: value });
  },
}));

// Selector helpers
export const selectImages = (state: RequestState) => state.images;
export const selectCurrentStep = (state: RequestState) => state.currentStep;

/**
 * canProceed를 상태 기반으로 직접 계산 (함수 호출 대신)
 * 함수 호출은 매번 새 참조를 만들어 불필요한 리렌더링 유발
 */
export const selectCanProceed = (state: RequestState): boolean => {
  const { images, currentStep, detectedSpots, mediaSource } = state;

  switch (currentStep) {
    case 1:
      // Step 1: 최소 1장 이상의 이미지가 업로드 완료되어야 함
      return images.some((img) => img.status === "uploaded");
    case 2:
      // Step 2: AI 감지 완료 - spots가 있어야 함
      return detectedSpots.length > 0;
    case 3:
      // Step 3: 필수 필드 검증 - media_source의 type과 title이 있어야 함
      return !!(mediaSource?.type && mediaSource?.title);
    default:
      return false;
  }
};

export const selectUserKnowsItems = (state: RequestState) =>
  state.userKnowsItems;
export const selectImageCount = (state: RequestState) => state.images.length;
export const selectHasImages = (state: RequestState) => state.images.length > 0;
export const selectIsMaxImages = (state: RequestState) =>
  state.images.length >= UPLOAD_CONFIG.maxImages;

// Detection selectors
export const selectDetectedSpots = (state: RequestState) => state.detectedSpots;
export const selectIsDetecting = (state: RequestState) => state.isDetecting;
export const selectIsRevealing = (state: RequestState) => state.isRevealing;
export const selectSelectedSpotId = (state: RequestState) =>
  state.selectedSpotId;
export const selectDetectionError = (state: RequestState) =>
  state.detectionError;
export const selectAiMetadata = (state: RequestState) => state.aiMetadata;

// Solution selectors
export const selectHasSolutions = (state: RequestState): boolean =>
  state.detectedSpots.some((spot) => spot.solution !== undefined);
export const selectSpotsWithSolutions = (state: RequestState) =>
  state.detectedSpots.filter((spot) => spot.solution !== undefined);

// Step 3 selectors
export const selectDescription = (state: RequestState) => state.description;
export const selectExtractedMetadata = (state: RequestState) =>
  state.extractedMetadata;
export const selectIsExtractingMetadata = (state: RequestState) =>
  state.isExtractingMetadata;
export const selectMediaSource = (state: RequestState) => state.mediaSource;
export const selectArtistName = (state: RequestState) => state.artistName;
export const selectGroupName = (state: RequestState) => state.groupName;
export const selectContext = (state: RequestState) => state.context;

// Step 4 selectors
export const selectIsSubmitting = (state: RequestState) => state.isSubmitting;
export const selectSubmitError = (state: RequestState) => state.submitError;

/**
 * Action들을 렌더링 없이 직접 접근
 * 컴포넌트에서 action만 필요할 때 사용 (구독 없음)
 */
export const getRequestActions = () => {
  const state = useRequestStore.getState();
  return {
    addImage: state.addImage,
    addImages: state.addImages,
    removeImage: state.removeImage,
    updateImageStatus: state.updateImageStatus,
    setImageUploadedUrl: state.setImageUploadedUrl,
    clearImages: state.clearImages,
    startDetection: state.startDetection,
    setDetectedSpots: state.setDetectedSpots,
    selectSpot: state.selectSpot,
    addSpot: state.addSpot,
    removeSpot: state.removeSpot,
    setSpotSolution: state.setSpotSolution,
    clearSpotSolution: state.clearSpotSolution,
    setDescription: state.setDescription,
    setExtractedMetadata: state.setExtractedMetadata,
    setIsExtractingMetadata: state.setIsExtractingMetadata,
    setMediaSource: state.setMediaSource,
    setArtistName: state.setArtistName,
    setGroupName: state.setGroupName,
    setContext: state.setContext,
    setSubmitting: state.setSubmitting,
    setSubmitError: state.setSubmitError,
    setStep: state.setStep,
    resetRequestFlow: state.resetRequestFlow,
    setUserKnowsItems: state.setUserKnowsItems,
  };
};
