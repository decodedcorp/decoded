---
phase: quick-045
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/app/api/v1/users/me/route.ts
  - packages/web/app/api/v1/users/me/stats/route.ts
  - packages/web/app/api/v1/users/me/activities/route.ts
  - packages/web/app/api/v1/badges/me/route.ts
  - packages/web/app/api/v1/rankings/me/route.ts
  - packages/web/app/api/v1/users/[userId]/route.ts
  - packages/web/app/api/v1/posts/[postId]/route.ts
  - packages/web/app/api/v1/posts/[postId]/spots/route.ts
  - packages/web/app/api/v1/posts/with-solution/route.ts
  - packages/web/app/api/v1/posts/upload/route.ts
  - packages/web/app/api/v1/posts/extract-metadata/route.ts
  - packages/web/app/api/v1/posts/analyze/route.ts
  - packages/web/app/api/v1/spots/[spotId]/route.ts
  - packages/web/app/api/v1/spots/[spotId]/solutions/route.ts
  - packages/web/app/api/v1/solutions/[solutionId]/route.ts
  - packages/web/app/api/v1/solutions/[solutionId]/adopt/route.ts
  - packages/web/app/api/v1/solutions/convert-affiliate/route.ts
  - packages/web/app/api/v1/solutions/extract-metadata/route.ts
  - packages/web/app/api/v1/categories/route.ts
  - packages/web/app/api/v1/badges/route.ts
  - packages/web/app/api/v1/rankings/route.ts
autonomous: true
requirements: []

must_haves:
  truths:
    - "Profile page loads without crashing when backend returns HTML errors"
    - "All proxy routes gracefully handle non-JSON backend responses"
    - "Error messages are meaningful (include status code) instead of generic 500"
  artifacts:
    - path: "packages/web/app/api/v1/users/me/route.ts"
      provides: "Safe JSON parsing in GET and PATCH handlers"
      contains: "JSON.parse"
    - path: "packages/web/app/api/v1/users/me/stats/route.ts"
      provides: "Safe JSON parsing in GET handler"
      contains: "JSON.parse"
  key_links:
    - from: "all proxy route.ts files"
      to: "backend API"
      via: "response.text() then JSON.parse with fallback"
      pattern: "response\\.text\\(\\)"
---

<objective>
Fix profile page access error by applying defensive JSON parsing to all API proxy routes.

Purpose: Backend sometimes returns HTML (nginx error pages, redirects) instead of JSON. The proxy routes crash with `SyntaxError: Unexpected token '<'` when calling `response.json()`, causing 500 errors that break the profile page and potentially other pages.

Output: All 20+ proxy routes use safe `response.text()` + `JSON.parse()` pattern with meaningful error fallback.
</objective>

<execution_context>
@/Users/kiyeol/.claude-pers/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-pers/get-shit-done/templates/summary.md
</execution_context>

<context>
The fix pattern is already established in `packages/web/app/api/v1/posts/route.ts` (from quick-040). The pattern replaces:

```typescript
// BEFORE (vulnerable):
const data = await response.json();
return NextResponse.json(data, { status: response.status });
```

With:

```typescript
// AFTER (safe):
const responseText = await response.text();
let data;
try {
  data = JSON.parse(responseText);
} catch {
  data = {
    message: `Backend error: ${response.status} ${response.statusText}`,
  };
}
return NextResponse.json(data, { status: response.status });
```

Also update the outer catch block to return 502 (Bad Gateway) with the actual error message instead of a generic 500:

```typescript
} catch (error) {
  console.error("...", error);
  return NextResponse.json(
    {
      message: error instanceof Error
        ? `Proxy error: ${error.message}`
        : "Failed to ...",
    },
    { status: 502 }
  );
}
```

**Already fixed (skip these):**
- `packages/web/app/api/v1/posts/route.ts` — already uses safe pattern (fixed in quick-040)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix profile-related proxy routes (5 files)</name>
  <files>
    packages/web/app/api/v1/users/me/route.ts,
    packages/web/app/api/v1/users/me/stats/route.ts,
    packages/web/app/api/v1/users/me/activities/route.ts,
    packages/web/app/api/v1/badges/me/route.ts,
    packages/web/app/api/v1/rankings/me/route.ts
  </files>
  <action>
Apply the safe JSON parsing pattern to all 5 profile-related proxy routes. For each file:

1. Replace every `const data = await response.json()` with the safe pattern:
   ```
   const responseText = await response.text();
   let data;
   try { data = JSON.parse(responseText); }
   catch { data = { message: `Backend error: ${response.status} ${response.statusText}` }; }
   ```

2. Update the outer catch block to return 502 with actual error message:
   ```
   return NextResponse.json(
     { message: error instanceof Error ? `Proxy error: ${error.message}` : "Failed to ..." },
     { status: 502 }
   );
   ```

Note: `users/me/route.ts` has both GET and PATCH — fix BOTH handlers.
  </action>
  <verify>
    <automated>cd /Users/kiyeol/development/decoded/decoded-app && grep -rn "await response.json()" packages/web/app/api/v1/users/me/ packages/web/app/api/v1/badges/me/ packages/web/app/api/v1/rankings/me/ | wc -l | xargs test 0 -eq && echo "PASS: No unsafe response.json() in profile routes" || echo "FAIL: Still has unsafe response.json()"</automated>
  </verify>
  <done>All 5 profile proxy routes use safe JSON parsing. Zero instances of `await response.json()` in users/me/*, badges/me/*, rankings/me/*.</done>
</task>

<task type="auto">
  <name>Task 2: Fix remaining proxy routes (15+ files)</name>
  <files>
    packages/web/app/api/v1/users/[userId]/route.ts,
    packages/web/app/api/v1/posts/[postId]/route.ts,
    packages/web/app/api/v1/posts/[postId]/spots/route.ts,
    packages/web/app/api/v1/posts/with-solution/route.ts,
    packages/web/app/api/v1/posts/upload/route.ts,
    packages/web/app/api/v1/posts/extract-metadata/route.ts,
    packages/web/app/api/v1/posts/analyze/route.ts,
    packages/web/app/api/v1/spots/[spotId]/route.ts,
    packages/web/app/api/v1/spots/[spotId]/solutions/route.ts,
    packages/web/app/api/v1/solutions/[solutionId]/route.ts,
    packages/web/app/api/v1/solutions/[solutionId]/adopt/route.ts,
    packages/web/app/api/v1/solutions/convert-affiliate/route.ts,
    packages/web/app/api/v1/solutions/extract-metadata/route.ts,
    packages/web/app/api/v1/categories/route.ts,
    packages/web/app/api/v1/badges/route.ts,
    packages/web/app/api/v1/rankings/route.ts
  </files>
  <action>
Apply the identical safe JSON parsing pattern to ALL remaining proxy routes that still use `await response.json()`. Same two changes per handler:

1. Replace `await response.json()` with `response.text()` + `JSON.parse` + fallback
2. Update outer catch to return 502 with actual error message

Skip `posts/route.ts` (already fixed in quick-040).

For each file, fix EVERY handler (GET, POST, PATCH, etc.) that contains the vulnerable pattern.
  </action>
  <verify>
    <automated>cd /Users/kiyeol/development/decoded/decoded-app && grep -rn "await response.json()" packages/web/app/api/v1/ | wc -l | xargs test 0 -eq && echo "PASS: No unsafe response.json() in any proxy route" || echo "FAIL: Still has unsafe response.json()"</automated>
  </verify>
  <done>Zero instances of `await response.json()` across all proxy routes in `app/api/v1/`. Every route uses safe text-then-parse pattern.</done>
</task>

</tasks>

<verification>
1. `grep -rn "await response.json()" packages/web/app/api/v1/` returns zero matches
2. `grep -rn "JSON.parse" packages/web/app/api/v1/` shows safe parsing in every route
3. `yarn build` succeeds with no TypeScript errors
</verification>

<success_criteria>
- Profile page no longer crashes when backend returns HTML errors
- All 20+ API proxy routes handle non-JSON responses gracefully
- Build passes with no type errors
- Error responses include meaningful status info (not generic "Failed to...")
</success_criteria>

<output>
After completion, create `.planning/quick/045-profile-page-access-error-fix/045-SUMMARY.md`
</output>
