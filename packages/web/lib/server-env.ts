function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

/** Evaluated at module load — fails fast if missing */
export const API_BASE_URL = requireEnv("API_BASE_URL");
