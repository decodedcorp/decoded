---
phase: quick-050
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .env.local.example
autonomous: true
requirements: [ENV-LOCAL-BACKEND]

must_haves:
  truths:
    - ".env.local.example documents all variables needed to connect frontend to local backend"
    - "Developer can copy .env.local.example to .env.local and fill in Supabase values to run locally"
  artifacts:
    - path: ".env.local.example"
      provides: "Environment variable template with local backend configuration"
      contains: "API_BASE_URL=http://localhost:8000"
  key_links:
    - from: ".env.local.example"
      to: "packages/web/app/api/v1/*/route.ts"
      via: "API_BASE_URL env var used by all proxy routes"
      pattern: "process\\.env\\.API_BASE_URL"
---

<objective>
Update .env.local.example to document local backend connection configuration.

Purpose: Enable frontend-to-local-backend connectivity by documenting the correct environment variable values for local development (backend at localhost:8000).
Output: Updated .env.local.example with local backend defaults and clear instructions.
</objective>

<execution_context>
@/Users/kiyeol/.claude-pers/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-pers/get-shit-done/templates/summary.md
</execution_context>

<context>
@.env.local.example
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update .env.local.example with local backend configuration</name>
  <files>.env.local.example</files>
  <action>
Update `.env.local.example` to include clear local development configuration:

1. Keep existing structure and comments intact.

2. Update the `API_BASE_URL` line:
   - Change default value from `https://dev.decoded.style` to `http://localhost:8000`
   - Add comment: `# Local backend: http://localhost:8000 | Production: https://dev.decoded.style`

3. Update `NEXT_PUBLIC_API_BASE_URL` comment to clarify it's optional when using proxy (which is the current pattern).

4. Add a new section at the top of the file (after the header comments) with a "Local Development Quick Start" block:
   ```
   # === Local Development Quick Start ===
   # 1. Copy this file: cp .env.local.example .env.local
   # 2. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
   #    (same values as your backend .env)
   # 3. API_BASE_URL is already set to localhost:8000
   # 4. Ensure backend CORS allows http://localhost:3000
   #    (ALLOWED_ORIGINS=http://localhost:3000 in backend .env)
   # =====================================
   ```

5. DO NOT modify .env.local directly (security constraint).
  </action>
  <verify>
    <automated>grep -q "localhost:8000" .env.local.example && grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local.example && grep -q "Local Development" .env.local.example && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <done>.env.local.example contains local backend URL (localhost:8000), Supabase placeholders, and clear setup instructions for local development</done>
</task>

</tasks>

<verification>
- `.env.local.example` has `API_BASE_URL=http://localhost:8000`
- All three required env vars are documented: `API_BASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Quick start instructions are present at top of file
- No actual secrets committed
</verification>

<success_criteria>
A developer can read .env.local.example, copy it to .env.local, fill in their Supabase credentials (matching backend .env), and the frontend will connect to localhost:8000 backend through the existing Next.js API proxy routes.
</success_criteria>

<output>
After completion, create `.planning/quick/50-env-api/50-SUMMARY.md`
</output>
