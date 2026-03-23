/**
 * API Functions
 * Re-export all API functions and types
 */

// Client
export { apiClient, getAuthToken } from "./client";
export type { ApiClientOptions } from "./client";

// Types
export * from "./types";

// Post APIs
export {
  uploadImage,
  analyzeImage,
  extractPostMetadata,
  createPost,
  createPostWithFile,
  createPostWithFileAndSolutions,
  createPostWithSolution,
} from "./posts";
export type {
  UploadImageOptions,
  CreatePostWithFileRequest,
  CreatePostWithFileAndSolutionsRequest,
} from "./posts";

// User APIs
export {
  fetchMe,
  updateMe,
  fetchUserStats,
  fetchUserById,
  fetchUserActivities,
} from "./users";

// Spot APIs
export { createSpot, updateSpot, deleteSpot } from "./spots";

// Solution APIs
export {
  createSolution,
  updateSolution,
  deleteSolution,
  adoptSolution,
  unadoptSolution,
  extractSolutionMetadata,
  convertAffiliate,
} from "./solutions";
export type { AdoptSolutionDto, AdoptResponse } from "./solutions";
