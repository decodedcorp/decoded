---
phase: A-content-crud
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/lib/api/posts.ts
  - packages/web/lib/api/types.ts
  - packages/web/lib/hooks/usePosts.ts
  - packages/web/app/api/v1/posts/[postId]/route.ts
autonomous: true

must_haves:
  truths:
    - "User can edit their own post's metadata (artist_name, group_name, context, media_source)"
    - "User can delete their own post"
    - "Edit/delete operations require authentication"
    - "UI shows loading state during mutation"
    - "UI shows success/error feedback via toast"
  artifacts:
    - path: "packages/web/lib/api/posts.ts"
      provides: "updatePost and deletePost API functions"
      exports: ["updatePost", "deletePost"]
    - path: "packages/web/lib/hooks/usePosts.ts"
      provides: "useUpdatePost and useDeletePost mutation hooks"
      exports: ["useUpdatePost", "useDeletePost", "postKeys"]
    - path: "packages/web/app/api/v1/posts/[postId]/route.ts"
      provides: "PATCH and DELETE proxy handlers"
      exports: ["PATCH", "DELETE"]
  key_links:
    - from: "useUpdatePost"
      to: "updatePost"
      via: "mutationFn"
      pattern: "mutationFn.*updatePost"
    - from: "updatePost"
      to: "/api/v1/posts/{postId}"
      via: "apiClient PATCH"
      pattern: "apiClient.*PATCH"
---

<objective>
Implement post edit and delete operations via REST API

Purpose: Allow users to modify or remove their own posts, completing the CRUD cycle for posts
Output: API functions, React Query mutation hooks, and API proxy routes for post PATCH/DELETE
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
@packages/web/lib/api/posts.ts
@packages/web/lib/api/types.ts
@packages/web/lib/hooks/usePosts.ts
@packages/web/app/api/v1/users/me/route.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add Post Update/Delete Types and API Functions</name>
  <files>
    packages/web/lib/api/types.ts
    packages/web/lib/api/posts.ts
  </files>
  <action>
1. In `types.ts`, add types for post update:

```typescript
// POST Update API
// PATCH /api/v1/posts/{post_id}

export interface UpdatePostDto {
  artist_name?: string;
  group_name?: string;
  context?: ContextType;
  media_source?: MediaSource;
}

export interface PostResponse extends Post {
  // Full post response after update (same as Post type)
}
```

2. In `posts.ts`, add API functions using the established apiClient pattern:

```typescript
/**
 * Update a post
 * PATCH /api/v1/posts/{postId}
 * Requires authentication
 */
export async function updatePost(
  postId: string,
  data: UpdatePostDto
): Promise<PostResponse> {
  return apiClient<PostResponse>({
    path: `/api/v1/posts/${postId}`,
    method: "PATCH",
    body: data,
    requiresAuth: true,
  });
}

/**
 * Delete a post
 * DELETE /api/v1/posts/{postId}
 * Requires authentication
 */
export async function deletePost(postId: string): Promise<void> {
  await apiClient<void>({
    path: `/api/v1/posts/${postId}`,
    method: "DELETE",
    requiresAuth: true,
  });
}
```

3. Export new functions from posts.ts and ensure types are exported from types.ts.
  </action>
  <verify>
Run `yarn tsc --noEmit` - should pass with no errors.
Verify exports: `grep -E "export.*(updatePost|deletePost|UpdatePostDto)" packages/web/lib/api/posts.ts packages/web/lib/api/types.ts`
  </verify>
  <done>
updatePost and deletePost functions exist in posts.ts using apiClient pattern.
UpdatePostDto type defined in types.ts.
  </done>
</task>

<task type="auto">
  <name>Task 2: Add API Proxy Routes for Post PATCH/DELETE</name>
  <files>
    packages/web/app/api/v1/posts/[postId]/route.ts
  </files>
  <action>
Create a new API route file following the pattern from `users/me/route.ts`:

```typescript
/**
 * Post Proxy API Route
 * PATCH /api/v1/posts/[postId] - Update post (auth required)
 * DELETE /api/v1/posts/[postId] - Delete post (auth required)
 *
 * Proxies requests to the backend API to avoid CORS issues.
 */

import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL;

type RouteParams = {
  params: Promise<{ postId: string }>;
};

/**
 * PATCH /api/v1/posts/[postId]
 * Update a post
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

  const { postId } = await params;

  try {
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/v1/posts/${postId}`, {
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
    console.error("Posts PATCH proxy error:", error);
    return NextResponse.json(
      { message: "Failed to update post" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/posts/[postId]
 * Delete a post
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

  const { postId } = await params;

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/posts/${postId}`, {
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
    console.error("Posts DELETE proxy error:", error);
    return NextResponse.json(
      { message: "Failed to delete post" },
      { status: 500 }
    );
  }
}
```

Note: Use Next.js 15 async params pattern (params is a Promise).
  </action>
  <verify>
Run `yarn tsc --noEmit` - should pass.
File exists: `ls packages/web/app/api/v1/posts/\[postId\]/route.ts`
  </verify>
  <done>
API proxy routes for PATCH and DELETE exist at /api/v1/posts/[postId].
Routes forward requests to backend with auth header passthrough.
  </done>
</task>

<task type="auto">
  <name>Task 3: Add React Query Mutation Hooks</name>
  <files>
    packages/web/lib/hooks/usePosts.ts
  </files>
  <action>
Add mutation hooks to usePosts.ts following the useUpdateProfile pattern from useProfile.ts:

1. Add imports at top:
```typescript
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePost, deletePost, fetchPosts } from "@/lib/api/posts";
import type { UpdatePostDto, PostResponse } from "@/lib/api/types";
```

2. Add query keys object (if not exists):
```typescript
export const postKeys = {
  all: ["posts"] as const,
  lists: () => [...postKeys.all, "list"] as const,
  list: (params: UseInfinitePostsParams) => [...postKeys.lists(), params] as const,
  details: () => [...postKeys.all, "detail"] as const,
  detail: (id: string) => [...postKeys.details(), id] as const,
};
```

3. Add mutation hooks:
```typescript
/**
 * Mutation hook for updating a post
 * Invalidates both post detail and lists after success
 */
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: UpdatePostDto }) =>
      updatePost(postId, data),
    onSuccess: (updatedPost, { postId }) => {
      // Update cache with new data
      queryClient.setQueryData(postKeys.detail(postId), updatedPost);
      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
    onError: (error) => {
      console.error("[useUpdatePost] Failed to update post:", error);
    },
  });
}

/**
 * Mutation hook for deleting a post
 * Invalidates lists after success, removes detail from cache
 */
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => deletePost(postId),
    onSuccess: (_, postId) => {
      // Remove from detail cache
      queryClient.removeQueries({ queryKey: postKeys.detail(postId) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
    onError: (error) => {
      console.error("[useDeletePost] Failed to delete post:", error);
    },
  });
}
```

4. Update usePostById to use postKeys:
```typescript
export function usePostById(id: string) {
  return useQuery<PostDetail | null>({
    queryKey: postKeys.detail(id),
    queryFn: () => fetchPostWithImagesAndItems(id),
    enabled: !!id,
  });
}
```

5. Export postKeys and new hooks.
  </action>
  <verify>
Run `yarn tsc --noEmit` - should pass.
Verify exports: `grep -E "export.*(useUpdatePost|useDeletePost|postKeys)" packages/web/lib/hooks/usePosts.ts`
  </verify>
  <done>
useUpdatePost and useDeletePost mutation hooks exist.
postKeys query key factory exported.
Cache invalidation configured for both mutations.
  </done>
</task>

</tasks>

<verification>
1. TypeScript compilation: `yarn tsc --noEmit` passes
2. All exports present:
   - `grep "export" packages/web/lib/api/posts.ts` shows updatePost, deletePost
   - `grep "export" packages/web/lib/hooks/usePosts.ts` shows useUpdatePost, useDeletePost, postKeys
3. API route exists: `ls packages/web/app/api/v1/posts/\[postId\]/route.ts`
4. Types match: UpdatePostDto includes optional artist_name, group_name, context, media_source
</verification>

<success_criteria>
- updatePost(postId, data) and deletePost(postId) functions implemented
- API proxy routes handle PATCH and DELETE at /api/v1/posts/[postId]
- useUpdatePost and useDeletePost hooks available for components
- Cache invalidation works (lists refresh after mutation)
- TypeScript compilation succeeds
</success_criteria>

<output>
After completion, create `.planning/phases/A-content-crud/A-01-SUMMARY.md`
</output>
