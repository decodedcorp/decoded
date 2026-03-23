/**
 * API Functions
 * Re-export all API functions and types
 */

// Client (still used by postLikes.ts, savedPosts.ts, posts.ts)
export { apiClient, getAuthToken } from "./client";
export type { ApiClientOptions } from "./client";

// Mutation types (manual types for mutations, uploads, and server-side functions)
export * from "./mutation-types";

// Post APIs (upload, create, analyze, server-fetch, magazine)
export {
  uploadImage,
  analyzeImage,
  extractPostMetadata,
  createPost,
  createPostWithFile,
  createPostWithFileAndSolutions,
  createPostWithSolution,
  fetchPostsServer,
  fetchPostMagazine,
} from "./posts";
export type {
  UploadImageOptions,
  CreatePostWithFileRequest,
  CreatePostWithFileAndSolutionsRequest,
} from "./posts";
