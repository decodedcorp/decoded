---
phase: A-content-crud
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/lib/api/spots.ts
  - packages/web/lib/api/types.ts
  - packages/web/lib/api/index.ts
  - packages/web/lib/hooks/useSpots.ts
  - packages/web/app/api/v1/posts/[postId]/spots/route.ts
  - packages/web/app/api/v1/spots/[spotId]/route.ts
autonomous: true

must_haves:
  truths:
    - "User can view list of spots on a post"
    - "User can add a new spot to their post"
    - "User can edit an existing spot (position, category)"
    - "User can delete a spot from their post"
    - "Spot operations require authentication"
  artifacts:
    - path: "packages/web/lib/api/spots.ts"
      provides: "Spot CRUD API functions"
      exports: ["fetchSpots", "createSpot", "updateSpot", "deleteSpot"]
    - path: "packages/web/lib/hooks/useSpots.ts"
      provides: "Spot React Query hooks"
      exports: ["useSpots", "useCreateSpot", "useUpdateSpot", "useDeleteSpot", "spotKeys"]
    - path: "packages/web/app/api/v1/posts/[postId]/spots/route.ts"
      provides: "GET and POST proxy handlers for spots"
      exports: ["GET", "POST"]
    - path: "packages/web/app/api/v1/spots/[spotId]/route.ts"
      provides: "PATCH and DELETE proxy handlers for individual spots"
      exports: ["PATCH", "DELETE"]
  key_links:
    - from: "useSpots"
      to: "fetchSpots"
      via: "queryFn"
      pattern: "queryFn.*fetchSpots"
    - from: "useCreateSpot"
      to: "createSpot"
      via: "mutationFn"
      pattern: "mutationFn.*createSpot"
---

<objective>
Implement complete Spot CRUD operations via REST API

Purpose: Enable users to manage spots (detected item markers) on their posts
Output: API functions, React Query hooks, and API proxy routes for spot list/create/update/delete
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
@packages/web/lib/api/users.ts
@packages/web/lib/hooks/useProfile.ts
@packages/web/app/api/v1/users/me/route.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add Spot Types and API Functions</name>
  <files>
    packages/web/lib/api/types.ts
    packages/web/lib/api/spots.ts
    packages/web/lib/api/index.ts
  </files>
  <action>
1. In `types.ts`, add Spot-related types:

```typescript
// ============================================================
// Spot API Types
// GET /api/v1/posts/{post_id}/spots
// POST /api/v1/posts/{post_id}/spots
// PATCH /api/v1/spots/{spot_id}
// DELETE /api/v1/spots/{spot_id}
// ============================================================

export interface Spot {
  id: string;
  post_id: string;
  position_left: string;  // e.g., "45.5%"
  position_top: string;   // e.g., "30.2%"
  category_id: string;
  category?: Category;    // Populated on GET
  solution_count: number;
  created_at: string;
}

export interface SpotListResponse {
  data: Spot[];
}

export interface CreateSpotDto {
  position_left: string;
  position_top: string;
  category_id: string;
}

export interface UpdateSpotDto {
  position_left?: string;
  position_top?: string;
  category_id?: string;
}
```

2. Create new file `packages/web/lib/api/spots.ts`:

```typescript
/**
 * Spots API Functions
 * - List spots on a post
 * - Create spot on a post
 * - Update spot
 * - Delete spot
 */

import { apiClient } from "./client";
import type {
  Spot,
  SpotListResponse,
  CreateSpotDto,
  UpdateSpotDto,
} from "./types";

// ============================================================
// List Spots
// GET /api/v1/posts/{post_id}/spots
// ============================================================

/**
 * Fetch all spots for a post
 */
export async function fetchSpots(postId: string): Promise<Spot[]> {
  const response = await apiClient<SpotListResponse>({
    path: `/api/v1/posts/${postId}/spots`,
    method: "GET",
    requiresAuth: false,  // Public data
  });
  return response.data;
}

// ============================================================
// Create Spot
// POST /api/v1/posts/{post_id}/spots
// Requires authentication
// ============================================================

/**
 * Create a new spot on a post
 */
export async function createSpot(
  postId: string,
  data: CreateSpotDto
): Promise<Spot> {
  return apiClient<Spot>({
    path: `/api/v1/posts/${postId}/spots`,
    method: "POST",
    body: data,
    requiresAuth: true,
  });
}

// ============================================================
// Update Spot
// PATCH /api/v1/spots/{spot_id}
// Requires authentication
// ============================================================

/**
 * Update an existing spot
 */
export async function updateSpot(
  spotId: string,
  data: UpdateSpotDto
): Promise<Spot> {
  return apiClient<Spot>({
    path: `/api/v1/spots/${spotId}`,
    method: "PATCH",
    body: data,
    requiresAuth: true,
  });
}

// ============================================================
// Delete Spot
// DELETE /api/v1/spots/{spot_id}
// Requires authentication
// ============================================================

/**
 * Delete a spot
 */
export async function deleteSpot(spotId: string): Promise<void> {
  await apiClient<void>({
    path: `/api/v1/spots/${spotId}`,
    method: "DELETE",
    requiresAuth: true,
  });
}
```

3. Update `packages/web/lib/api/index.ts` to export spot functions:

```typescript
// Spots
export { fetchSpots, createSpot, updateSpot, deleteSpot } from "./spots";
export type { Spot, SpotListResponse, CreateSpotDto, UpdateSpotDto } from "./types";
```
  </action>
  <verify>
Run `yarn tsc --noEmit` - should pass.
Verify: `grep -E "export.*(fetchSpots|createSpot|updateSpot|deleteSpot)" packages/web/lib/api/spots.ts`
  </verify>
  <done>
Spot types defined in types.ts.
Spot API functions (fetchSpots, createSpot, updateSpot, deleteSpot) implemented in spots.ts.
Functions exported from index.ts.
  </done>
</task>

<task type="auto">
  <name>Task 2: Add API Proxy Routes for Spots</name>
  <files>
    packages/web/app/api/v1/posts/[postId]/spots/route.ts
    packages/web/app/api/v1/spots/[spotId]/route.ts
  </files>
  <action>
1. Create `packages/web/app/api/v1/posts/[postId]/spots/route.ts`:

```typescript
/**
 * Spots List Proxy API Route
 * GET /api/v1/posts/[postId]/spots - List spots (public)
 * POST /api/v1/posts/[postId]/spots - Create spot (auth required)
 *
 * Proxies requests to the backend API to avoid CORS issues.
 */

import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL;

type RouteParams = {
  params: Promise<{ postId: string }>;
};

/**
 * GET /api/v1/posts/[postId]/spots
 * List all spots for a post
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!API_BASE_URL) {
    console.error("API_BASE_URL environment variable is not configured");
    return NextResponse.json(
      { message: "Server configuration error" },
      { status: 500 }
    );
  }

  const { postId } = await params;

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/posts/${postId}/spots`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Spots GET proxy error:", error);
    return NextResponse.json(
      { message: "Failed to fetch spots" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/posts/[postId]/spots
 * Create a new spot
 */
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

  const { postId } = await params;

  try {
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/v1/posts/${postId}/spots`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Spots POST proxy error:", error);
    return NextResponse.json(
      { message: "Failed to create spot" },
      { status: 500 }
    );
  }
}
```

2. Create `packages/web/app/api/v1/spots/[spotId]/route.ts`:

```typescript
/**
 * Individual Spot Proxy API Route
 * PATCH /api/v1/spots/[spotId] - Update spot (auth required)
 * DELETE /api/v1/spots/[spotId] - Delete spot (auth required)
 *
 * Proxies requests to the backend API to avoid CORS issues.
 */

import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL;

type RouteParams = {
  params: Promise<{ spotId: string }>;
};

/**
 * PATCH /api/v1/spots/[spotId]
 * Update a spot
 */
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

  const { spotId } = await params;

  try {
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/v1/spots/${spotId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Spot PATCH proxy error:", error);
    return NextResponse.json(
      { message: "Failed to update spot" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/spots/[spotId]
 * Delete a spot
 */
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

  const { spotId } = await params;

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/spots/${spotId}`, {
      method: "DELETE",
      headers: {
        Authorization: authHeader,
      },
    });

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Spot DELETE proxy error:", error);
    return NextResponse.json(
      { message: "Failed to delete spot" },
      { status: 500 }
    );
  }
}
```
  </action>
  <verify>
Run `yarn tsc --noEmit` - should pass.
Files exist:
- `ls packages/web/app/api/v1/posts/\[postId\]/spots/route.ts`
- `ls packages/web/app/api/v1/spots/\[spotId\]/route.ts`
  </verify>
  <done>
API proxy routes created for:
- GET/POST at /api/v1/posts/[postId]/spots
- PATCH/DELETE at /api/v1/spots/[spotId]
  </done>
</task>

<task type="auto">
  <name>Task 3: Add React Query Hooks for Spots</name>
  <files>
    packages/web/lib/hooks/useSpots.ts
  </files>
  <action>
Create new file `packages/web/lib/hooks/useSpots.ts`:

```typescript
/**
 * Spots Hooks
 * React Query hooks for spot CRUD operations
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import {
  fetchSpots,
  createSpot,
  updateSpot,
  deleteSpot,
} from "@/lib/api/spots";
import type { Spot, CreateSpotDto, UpdateSpotDto } from "@/lib/api/types";

// ============================================================
// Query Keys
// ============================================================

export const spotKeys = {
  all: ["spots"] as const,
  lists: () => [...spotKeys.all, "list"] as const,
  list: (postId: string) => [...spotKeys.lists(), postId] as const,
};

// ============================================================
// useSpots - Fetch spots for a post
// ============================================================

export function useSpots(
  postId: string,
  options?: Omit<UseQueryOptions<Spot[], Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: spotKeys.list(postId),
    queryFn: () => fetchSpots(postId),
    enabled: !!postId,
    staleTime: 1000 * 60, // 1 minute
    ...options,
  });
}

// ============================================================
// useCreateSpot - Create a new spot
// ============================================================

interface CreateSpotVariables {
  postId: string;
  data: CreateSpotDto;
}

export function useCreateSpot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, data }: CreateSpotVariables) =>
      createSpot(postId, data),
    onSuccess: (newSpot, { postId }) => {
      // Add to cache
      queryClient.setQueryData<Spot[]>(spotKeys.list(postId), (old) =>
        old ? [...old, newSpot] : [newSpot]
      );
      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: spotKeys.list(postId) });
    },
    onError: (error) => {
      console.error("[useCreateSpot] Failed to create spot:", error);
    },
  });
}

// ============================================================
// useUpdateSpot - Update an existing spot
// ============================================================

interface UpdateSpotVariables {
  spotId: string;
  postId: string; // Needed for cache invalidation
  data: UpdateSpotDto;
}

export function useUpdateSpot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ spotId, data }: UpdateSpotVariables) =>
      updateSpot(spotId, data),
    onSuccess: (updatedSpot, { postId }) => {
      // Update in cache
      queryClient.setQueryData<Spot[]>(spotKeys.list(postId), (old) =>
        old
          ? old.map((spot) =>
              spot.id === updatedSpot.id ? updatedSpot : spot
            )
          : [updatedSpot]
      );
    },
    onError: (error) => {
      console.error("[useUpdateSpot] Failed to update spot:", error);
    },
  });
}

// ============================================================
// useDeleteSpot - Delete a spot
// ============================================================

interface DeleteSpotVariables {
  spotId: string;
  postId: string; // Needed for cache invalidation
}

export function useDeleteSpot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ spotId }: DeleteSpotVariables) => deleteSpot(spotId),
    onSuccess: (_, { spotId, postId }) => {
      // Remove from cache
      queryClient.setQueryData<Spot[]>(spotKeys.list(postId), (old) =>
        old ? old.filter((spot) => spot.id !== spotId) : []
      );
    },
    onError: (error) => {
      console.error("[useDeleteSpot] Failed to delete spot:", error);
    },
  });
}
```
  </action>
  <verify>
Run `yarn tsc --noEmit` - should pass.
Verify exports: `grep -E "export.*(useSpots|useCreateSpot|useUpdateSpot|useDeleteSpot|spotKeys)" packages/web/lib/hooks/useSpots.ts`
  </verify>
  <done>
useSpots query hook and useCreateSpot, useUpdateSpot, useDeleteSpot mutation hooks implemented.
spotKeys query key factory exported.
Cache updates configured for optimistic UI.
  </done>
</task>

</tasks>

<verification>
1. TypeScript compilation: `yarn tsc --noEmit` passes
2. API functions exported from spots.ts
3. Hooks exported from useSpots.ts
4. API routes exist:
   - /api/v1/posts/[postId]/spots/route.ts
   - /api/v1/spots/[spotId]/route.ts
5. Types (Spot, CreateSpotDto, UpdateSpotDto) defined in types.ts
</verification>

<success_criteria>
- fetchSpots(postId) returns list of spots
- createSpot(postId, data) creates new spot
- updateSpot(spotId, data) updates existing spot
- deleteSpot(spotId) removes spot
- API proxy routes handle all four operations
- React Query hooks available with cache invalidation
- TypeScript compilation succeeds
</success_criteria>

<output>
After completion, create `.planning/phases/A-content-crud/A-02-SUMMARY.md`
</output>
