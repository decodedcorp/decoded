function getEnvOrEmpty(name: string): string {
  return process.env[name] ?? "";
}

/**
 * Backend API base URL. Empty when no Rust backend is configured —
 * API routes will return 502 and clients fall back to Supabase.
 */
export const API_BASE_URL = getEnvOrEmpty("API_BASE_URL");

/**
 * ai-server base URL (FastAPI). Used by admin routes that trigger
 * scheduled pipelines (e.g. raw_posts manual source trigger).
 */
export const AI_SERVER_URL = getEnvOrEmpty("AI_SERVER_URL");
