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
