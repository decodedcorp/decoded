---
phase: A-content-crud
plan: 03
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/lib/api/solutions.ts
  - packages/web/lib/api/types.ts
  - packages/web/lib/api/index.ts
  - packages/web/lib/hooks/useSolutions.ts
  - packages/web/app/api/v1/spots/[spotId]/solutions/route.ts
  - packages/web/app/api/v1/solutions/[solutionId]/route.ts
  - packages/web/app/api/v1/solutions/extract-metadata/route.ts
  - packages/web/app/api/v1/solutions/convert-affiliate/route.ts
autonomous: true

must_haves:
  truths:
    - "User can view list of solutions on a spot"
    - "User can submit a new solution with product URL"
    - "User can edit their existing solution"
    - "User can delete their solution"
    - "System extracts metadata from product URLs automatically"
    - "System converts regular URLs to affiliate links"
  artifacts:
    - path: "packages/web/lib/api/solutions.ts"
      provides: "Solution CRUD and metadata API functions"
      exports: ["fetchSolutions", "createSolution", "updateSolution", "deleteSolution", "extractMetadata", "convertAffiliate"]
    - path: "packages/web/lib/hooks/useSolutions.ts"
      provides: "Solution React Query hooks"
      exports: ["useSolutions", "useCreateSolution", "useUpdateSolution", "useDeleteSolution", "useExtractMetadata", "solutionKeys"]
    - path: "packages/web/app/api/v1/spots/[spotId]/solutions/route.ts"
      provides: "GET and POST proxy handlers for solutions"
      exports: ["GET", "POST"]
    - path: "packages/web/app/api/v1/solutions/[solutionId]/route.ts"
      provides: "PATCH and DELETE proxy handlers for individual solutions"
      exports: ["PATCH", "DELETE"]
    - path: "packages/web/app/api/v1/solutions/extract-metadata/route.ts"
      provides: "POST handler for metadata extraction"
      exports: ["POST"]
    - path: "packages/web/app/api/v1/solutions/convert-affiliate/route.ts"
      provides: "POST handler for affiliate link conversion"
      exports: ["POST"]
  key_links:
    - from: "useSolutions"
      to: "fetchSolutions"
      via: "queryFn"
      pattern: "queryFn.*fetchSolutions"
    - from: "useCreateSolution"
      to: "createSolution"
      via: "mutationFn"
      pattern: "mutationFn.*createSolution"
    - from: "useExtractMetadata"
      to: "extractMetadata"
      via: "mutationFn"
      pattern: "mutationFn.*extractMetadata"
---

<objective>
Implement complete Solution CRUD operations with metadata extraction and affiliate link conversion

Purpose: Enable users to submit, manage solutions (product links) for spots, with automatic metadata extraction
Output: API functions, React Query hooks, and API proxy routes for solutions including helper endpoints
</objective>

<execution_context>
@/Users/kiyeol/.claude-work/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-work/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/06-api-foundation-profile/06-01-SUMMARY.md
@packages/web/lib/api/client.ts
@packages/web/lib/api/types.ts
@packages/web/lib/hooks/useProfile.ts
@packages/web/app/api/v1/users/me/route.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add Solution Types and API Functions</name>
  <files>
    packages/web/lib/api/types.ts
    packages/web/lib/api/solutions.ts
    packages/web/lib/api/index.ts
  </files>
  <action>
1. In `types.ts`, add Solution-related types:

```typescript
// ============================================================
// Solution API Types
// GET /api/v1/spots/{spot_id}/solutions
// POST /api/v1/spots/{spot_id}/solutions
// PATCH /api/v1/solutions/{solution_id}
// DELETE /api/v1/solutions/{solution_id}
// POST /api/v1/solutions/extract-metadata
// POST /api/v1/solutions/convert-affiliate
// ============================================================

export interface Solution {
  id: string;
  spot_id: string;
  user_id: string;
  user?: PostUser;           // Populated on GET
  product_url: string;
  affiliate_url: string | null;
  product_name: string | null;
  brand: string | null;
  price: number | null;
  currency: string | null;
  image_url: string | null;
  vote_count: number;
  is_adopted: boolean;
  created_at: string;
  updated_at: string;
}

export interface SolutionListResponse {
  data: Solution[];
}

export interface CreateSolutionDto {
  product_url: string;
  product_name?: string;
  brand?: string;
  price?: number;
  currency?: string;
  image_url?: string;
}

export interface UpdateSolutionDto {
  product_url?: string;
  product_name?: string;
  brand?: string;
  price?: number;
  currency?: string;
  image_url?: string;
}

// Metadata extraction
export interface ExtractMetadataRequest {
  url: string;
}

export interface ExtractMetadataResponse {
  product_name: string | null;
  brand: string | null;
  price: number | null;
  currency: string | null;
  image_url: string | null;
  description: string | null;
}

// Affiliate link conversion
export interface ConvertAffiliateRequest {
  url: string;
}

export interface ConvertAffiliateResponse {
  affiliate_url: string;
  original_url: string;
}
```

2. Create new file `packages/web/lib/api/solutions.ts`:

```typescript
/**
 * Solutions API Functions
 * - List solutions on a spot
 * - Create solution on a spot
 * - Update solution
 * - Delete solution
 * - Extract metadata from product URL
 * - Convert URL to affiliate link
 */

import { apiClient } from "./client";
import type {
  Solution,
  SolutionListResponse,
  CreateSolutionDto,
  UpdateSolutionDto,
  ExtractMetadataRequest,
  ExtractMetadataResponse,
  ConvertAffiliateRequest,
  ConvertAffiliateResponse,
} from "./types";

// ============================================================
// List Solutions
// GET /api/v1/spots/{spot_id}/solutions
// ============================================================

/**
 * Fetch all solutions for a spot
 */
export async function fetchSolutions(spotId: string): Promise<Solution[]> {
  const response = await apiClient<SolutionListResponse>({
    path: `/api/v1/spots/${spotId}/solutions`,
    method: "GET",
    requiresAuth: false, // Public data
  });
  return response.data;
}

// ============================================================
// Create Solution
// POST /api/v1/spots/{spot_id}/solutions
// Requires authentication
// ============================================================

/**
 * Create a new solution on a spot
 */
export async function createSolution(
  spotId: string,
  data: CreateSolutionDto
): Promise<Solution> {
  return apiClient<Solution>({
    path: `/api/v1/spots/${spotId}/solutions`,
    method: "POST",
    body: data,
    requiresAuth: true,
  });
}

// ============================================================
// Update Solution
// PATCH /api/v1/solutions/{solution_id}
// Requires authentication
// ============================================================

/**
 * Update an existing solution
 */
export async function updateSolution(
  solutionId: string,
  data: UpdateSolutionDto
): Promise<Solution> {
  return apiClient<Solution>({
    path: `/api/v1/solutions/${solutionId}`,
    method: "PATCH",
    body: data,
    requiresAuth: true,
  });
}

// ============================================================
// Delete Solution
// DELETE /api/v1/solutions/{solution_id}
// Requires authentication
// ============================================================

/**
 * Delete a solution
 */
export async function deleteSolution(solutionId: string): Promise<void> {
  await apiClient<void>({
    path: `/api/v1/solutions/${solutionId}`,
    method: "DELETE",
    requiresAuth: true,
  });
}

// ============================================================
// Extract Metadata
// POST /api/v1/solutions/extract-metadata
// Requires authentication
// ============================================================

/**
 * Extract product metadata from a URL
 */
export async function extractMetadata(
  url: string
): Promise<ExtractMetadataResponse> {
  const request: ExtractMetadataRequest = { url };
  return apiClient<ExtractMetadataResponse>({
    path: "/api/v1/solutions/extract-metadata",
    method: "POST",
    body: request,
    requiresAuth: true,
  });
}

// ============================================================
// Convert to Affiliate Link
// POST /api/v1/solutions/convert-affiliate
// Requires authentication
// ============================================================

/**
 * Convert a product URL to an affiliate link
 */
export async function convertAffiliate(
  url: string
): Promise<ConvertAffiliateResponse> {
  const request: ConvertAffiliateRequest = { url };
  return apiClient<ConvertAffiliateResponse>({
    path: "/api/v1/solutions/convert-affiliate",
    method: "POST",
    body: request,
    requiresAuth: true,
  });
}
```

3. Update `packages/web/lib/api/index.ts` to export solution functions:

```typescript
// Solutions
export {
  fetchSolutions,
  createSolution,
  updateSolution,
  deleteSolution,
  extractMetadata,
  convertAffiliate,
} from "./solutions";
export type {
  Solution,
  SolutionListResponse,
  CreateSolutionDto,
  UpdateSolutionDto,
  ExtractMetadataRequest,
  ExtractMetadataResponse,
  ConvertAffiliateRequest,
  ConvertAffiliateResponse,
} from "./types";
```
  </action>
  <verify>
Run `yarn tsc --noEmit` - should pass.
Verify: `grep -E "export.*(fetchSolutions|createSolution|extractMetadata|convertAffiliate)" packages/web/lib/api/solutions.ts`
  </verify>
  <done>
Solution types defined in types.ts.
Solution API functions implemented in solutions.ts.
Functions exported from index.ts.
  </done>
</task>

<task type="auto">
  <name>Task 2: Add API Proxy Routes for Solutions</name>
  <files>
    packages/web/app/api/v1/spots/[spotId]/solutions/route.ts
    packages/web/app/api/v1/solutions/[solutionId]/route.ts
    packages/web/app/api/v1/solutions/extract-metadata/route.ts
    packages/web/app/api/v1/solutions/convert-affiliate/route.ts
  </files>
  <action>
1. Create `packages/web/app/api/v1/spots/[spotId]/solutions/route.ts`:

```typescript
/**
 * Solutions List Proxy API Route
 * GET /api/v1/spots/[spotId]/solutions - List solutions (public)
 * POST /api/v1/spots/[spotId]/solutions - Create solution (auth required)
 */

import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL;

type RouteParams = {
  params: Promise<{ spotId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!API_BASE_URL) {
    console.error("API_BASE_URL environment variable is not configured");
    return NextResponse.json(
      { message: "Server configuration error" },
      { status: 500 }
    );
  }

  const { spotId } = await params;

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/spots/${spotId}/solutions`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Solutions GET proxy error:", error);
    return NextResponse.json(
      { message: "Failed to fetch solutions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!API_BASE_URL) {
    console.error("API_BASE_URL environment variable is not configured");
    return NextResponse.json(
      { message: "Server configuration error" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 }
    );
  }

  const { spotId } = await params;

  try {
    const body = await request.json();

    const response = await fetch(
      `${API_BASE_URL}/api/v1/spots/${spotId}/solutions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Solutions POST proxy error:", error);
    return NextResponse.json(
      { message: "Failed to create solution" },
      { status: 500 }
    );
  }
}
```

2. Create `packages/web/app/api/v1/solutions/[solutionId]/route.ts`:

```typescript
/**
 * Individual Solution Proxy API Route
 * PATCH /api/v1/solutions/[solutionId] - Update solution (auth required)
 * DELETE /api/v1/solutions/[solutionId] - Delete solution (auth required)
 */

import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL;

type RouteParams = {
  params: Promise<{ solutionId: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!API_BASE_URL) {
    console.error("API_BASE_URL environment variable is not configured");
    return NextResponse.json(
      { message: "Server configuration error" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 }
    );
  }

  const { solutionId } = await params;

  try {
    const body = await request.json();

    const response = await fetch(
      `${API_BASE_URL}/api/v1/solutions/${solutionId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Solution PATCH proxy error:", error);
    return NextResponse.json(
      { message: "Failed to update solution" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!API_BASE_URL) {
    console.error("API_BASE_URL environment variable is not configured");
    return NextResponse.json(
      { message: "Server configuration error" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 }
    );
  }

  const { solutionId } = await params;

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/solutions/${solutionId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: authHeader,
        },
      }
    );

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Solution DELETE proxy error:", error);
    return NextResponse.json(
      { message: "Failed to delete solution" },
      { status: 500 }
    );
  }
}
```

3. Create `packages/web/app/api/v1/solutions/extract-metadata/route.ts`:

```typescript
/**
 * Metadata Extraction Proxy API Route
 * POST /api/v1/solutions/extract-metadata - Extract product metadata from URL
 */

import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL;

export async function POST(request: NextRequest) {
  if (!API_BASE_URL) {
    console.error("API_BASE_URL environment variable is not configured");
    return NextResponse.json(
      { message: "Server configuration error" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const response = await fetch(
      `${API_BASE_URL}/api/v1/solutions/extract-metadata`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Extract metadata proxy error:", error);
    return NextResponse.json(
      { message: "Failed to extract metadata" },
      { status: 500 }
    );
  }
}
```

4. Create `packages/web/app/api/v1/solutions/convert-affiliate/route.ts`:

```typescript
/**
 * Affiliate Link Conversion Proxy API Route
 * POST /api/v1/solutions/convert-affiliate - Convert URL to affiliate link
 */

import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL;

export async function POST(request: NextRequest) {
  if (!API_BASE_URL) {
    console.error("API_BASE_URL environment variable is not configured");
    return NextResponse.json(
      { message: "Server configuration error" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const response = await fetch(
      `${API_BASE_URL}/api/v1/solutions/convert-affiliate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Convert affiliate proxy error:", error);
    return NextResponse.json(
      { message: "Failed to convert affiliate link" },
      { status: 500 }
    );
  }
}
```
  </action>
  <verify>
Run `yarn tsc --noEmit` - should pass.
Files exist:
- `ls packages/web/app/api/v1/spots/\[spotId\]/solutions/route.ts`
- `ls packages/web/app/api/v1/solutions/\[solutionId\]/route.ts`
- `ls packages/web/app/api/v1/solutions/extract-metadata/route.ts`
- `ls packages/web/app/api/v1/solutions/convert-affiliate/route.ts`
  </verify>
  <done>
API proxy routes created for:
- GET/POST at /api/v1/spots/[spotId]/solutions
- PATCH/DELETE at /api/v1/solutions/[solutionId]
- POST at /api/v1/solutions/extract-metadata
- POST at /api/v1/solutions/convert-affiliate
  </done>
</task>

<task type="auto">
  <name>Task 3: Add React Query Hooks for Solutions</name>
  <files>
    packages/web/lib/hooks/useSolutions.ts
  </files>
  <action>
Create new file `packages/web/lib/hooks/useSolutions.ts`:

```typescript
/**
 * Solutions Hooks
 * React Query hooks for solution CRUD and metadata operations
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import {
  fetchSolutions,
  createSolution,
  updateSolution,
  deleteSolution,
  extractMetadata,
  convertAffiliate,
} from "@/lib/api/solutions";
import type {
  Solution,
  CreateSolutionDto,
  UpdateSolutionDto,
  ExtractMetadataResponse,
  ConvertAffiliateResponse,
} from "@/lib/api/types";

// ============================================================
// Query Keys
// ============================================================

export const solutionKeys = {
  all: ["solutions"] as const,
  lists: () => [...solutionKeys.all, "list"] as const,
  list: (spotId: string) => [...solutionKeys.lists(), spotId] as const,
};

// ============================================================
// useSolutions - Fetch solutions for a spot
// ============================================================

export function useSolutions(
  spotId: string,
  options?: Omit<UseQueryOptions<Solution[], Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: solutionKeys.list(spotId),
    queryFn: () => fetchSolutions(spotId),
    enabled: !!spotId,
    staleTime: 1000 * 60, // 1 minute
    ...options,
  });
}

// ============================================================
// useCreateSolution - Create a new solution
// ============================================================

interface CreateSolutionVariables {
  spotId: string;
  data: CreateSolutionDto;
}

export function useCreateSolution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ spotId, data }: CreateSolutionVariables) =>
      createSolution(spotId, data),
    onSuccess: (newSolution, { spotId }) => {
      // Add to cache
      queryClient.setQueryData<Solution[]>(
        solutionKeys.list(spotId),
        (old) => (old ? [...old, newSolution] : [newSolution])
      );
      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: solutionKeys.list(spotId) });
    },
    onError: (error) => {
      console.error("[useCreateSolution] Failed to create solution:", error);
    },
  });
}

// ============================================================
// useUpdateSolution - Update an existing solution
// ============================================================

interface UpdateSolutionVariables {
  solutionId: string;
  spotId: string; // Needed for cache invalidation
  data: UpdateSolutionDto;
}

export function useUpdateSolution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ solutionId, data }: UpdateSolutionVariables) =>
      updateSolution(solutionId, data),
    onSuccess: (updatedSolution, { spotId }) => {
      // Update in cache
      queryClient.setQueryData<Solution[]>(
        solutionKeys.list(spotId),
        (old) =>
          old
            ? old.map((sol) =>
                sol.id === updatedSolution.id ? updatedSolution : sol
              )
            : [updatedSolution]
      );
    },
    onError: (error) => {
      console.error("[useUpdateSolution] Failed to update solution:", error);
    },
  });
}

// ============================================================
// useDeleteSolution - Delete a solution
// ============================================================

interface DeleteSolutionVariables {
  solutionId: string;
  spotId: string; // Needed for cache invalidation
}

export function useDeleteSolution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ solutionId }: DeleteSolutionVariables) =>
      deleteSolution(solutionId),
    onSuccess: (_, { solutionId, spotId }) => {
      // Remove from cache
      queryClient.setQueryData<Solution[]>(
        solutionKeys.list(spotId),
        (old) => (old ? old.filter((sol) => sol.id !== solutionId) : [])
      );
    },
    onError: (error) => {
      console.error("[useDeleteSolution] Failed to delete solution:", error);
    },
  });
}

// ============================================================
// useExtractMetadata - Extract metadata from URL
// ============================================================

export function useExtractMetadata() {
  return useMutation<ExtractMetadataResponse, Error, string>({
    mutationFn: (url: string) => extractMetadata(url),
    onError: (error) => {
      console.error("[useExtractMetadata] Failed to extract metadata:", error);
    },
  });
}

// ============================================================
// useConvertAffiliate - Convert URL to affiliate link
// ============================================================

export function useConvertAffiliate() {
  return useMutation<ConvertAffiliateResponse, Error, string>({
    mutationFn: (url: string) => convertAffiliate(url),
    onError: (error) => {
      console.error(
        "[useConvertAffiliate] Failed to convert affiliate:",
        error
      );
    },
  });
}
```
  </action>
  <verify>
Run `yarn tsc --noEmit` - should pass.
Verify exports: `grep -E "export.*(useSolutions|useCreateSolution|useExtractMetadata|useConvertAffiliate|solutionKeys)" packages/web/lib/hooks/useSolutions.ts`
  </verify>
  <done>
useSolutions query hook implemented.
useCreateSolution, useUpdateSolution, useDeleteSolution mutation hooks implemented.
useExtractMetadata and useConvertAffiliate helper mutation hooks implemented.
solutionKeys query key factory exported.
Cache updates configured for optimistic UI.
  </done>
</task>

</tasks>

<verification>
1. TypeScript compilation: `yarn tsc --noEmit` passes
2. API functions exported from solutions.ts
3. Hooks exported from useSolutions.ts
4. API routes exist:
   - /api/v1/spots/[spotId]/solutions/route.ts
   - /api/v1/solutions/[solutionId]/route.ts
   - /api/v1/solutions/extract-metadata/route.ts
   - /api/v1/solutions/convert-affiliate/route.ts
5. Types (Solution, CreateSolutionDto, etc.) defined in types.ts
</verification>

<success_criteria>
- fetchSolutions(spotId) returns list of solutions
- createSolution(spotId, data) creates new solution
- updateSolution(solutionId, data) updates existing solution
- deleteSolution(solutionId) removes solution
- extractMetadata(url) extracts product info from URL
- convertAffiliate(url) converts to affiliate link
- API proxy routes handle all six operations
- React Query hooks available with cache invalidation
- TypeScript compilation succeeds
</success_criteria>

<output>
After completion, create `.planning/phases/A-content-crud/A-03-SUMMARY.md`
</output>
