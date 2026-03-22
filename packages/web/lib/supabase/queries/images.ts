/**
 * Re-export from shared package for backwards compatibility
 * Web-specific queries can be added here if needed
 */

// Re-export all from shared
export {
  fetchLatestImages,
  fetchImageById,
  fetchFilteredImages,
  fetchImagesByPostImage,
  fetchRelatedImagesByAccount,
  fetchUnifiedImages,
  encodeCursor,
  decodeCursor,
} from "@decoded/shared";

export type {
  ImageRow,
  ImageDetail,
  ImagePage,
  ImagePageWithPostId,
  ImageWithPostId,
  CategoryFilter,
  FetchFilteredImagesParams,
  PostImageRow,
  PostSource,
} from "@decoded/shared";
