/**
 * Environment variable utilities for Supabase
 *
 * Designed to be Supabase-specific initially, but structured to allow
 * future generalization for other services if needed.
 */

/**
 * Gets an environment variable value, throwing an error if it's not set.
 *
 * @param name - The name of the environment variable
 * @returns The environment variable value
 * @throws Error if the environment variable is not set
 */
export function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

// Dual-read mapping: new DATABASE_* names are primary; legacy SUPABASE_* are fallback.
// Callers should migrate to the primary name; fallback exists for zero-downtime rollout (#268).
const ENV_ALIASES: Record<string, string> = {
  NEXT_PUBLIC_DATABASE_API_URL: "NEXT_PUBLIC_SUPABASE_URL",
  NEXT_PUBLIC_DATABASE_ANON_KEY: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  DATABASE_SERVICE_ROLE_KEY: "SUPABASE_SERVICE_ROLE_KEY",
  DATABASE_JWT_SECRET: "SUPABASE_JWT_SECRET",
  DATABASE_API_URL: "SUPABASE_URL",
  DATABASE_ANON_KEY: "SUPABASE_ANON_KEY",
  // Reverse direction (legacy callers still asking for SUPABASE_*):
  NEXT_PUBLIC_SUPABASE_URL: "NEXT_PUBLIC_DATABASE_API_URL",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "NEXT_PUBLIC_DATABASE_ANON_KEY",
  SUPABASE_SERVICE_ROLE_KEY: "DATABASE_SERVICE_ROLE_KEY",
  SUPABASE_JWT_SECRET: "DATABASE_JWT_SECRET",
  SUPABASE_URL: "DATABASE_API_URL",
  SUPABASE_ANON_KEY: "DATABASE_ANON_KEY",
};

/**
 * Like `getEnv`, but falls back to a legacy alias if the primary name is unset.
 * Accepts either direction of the rename, so old callers still work during rollout.
 */
export function getEnvWithAlias(name: string): string {
  const value = process.env[name];
  if (value) return value;
  const alias = ENV_ALIASES[name];
  if (alias) {
    const aliased = process.env[alias];
    if (aliased) return aliased;
  }
  throw new Error(
    `Missing environment variable: ${name}${alias ? ` (also tried ${alias})` : ""}`
  );
}
