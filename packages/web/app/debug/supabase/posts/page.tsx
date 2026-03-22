/**
 * DEBUG ONLY: Supabase Posts Debug Page
 *
 * This page is for debugging/reference purposes only.
 * Production code should use image-based routes instead.
 */
import { fetchLatestPostsServer } from "@/lib/supabase/queries/debug/posts.server";
import { PostsClient } from "./PostsClient";

// Disable caching for debug page
export const revalidate = 0;

export default async function DebugPostsPage() {
  const posts = await fetchLatestPostsServer(10);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Posts Debug Page</h1>
      <p className="text-sm text-gray-600 mb-4">
        This page demonstrates Supabase connection and type safety. Data is
        fetched using the query layer (not direct from() calls).
      </p>

      {/* Server Component (SSR) version */}
      <div className="mb-8 p-6 border-2 border-gray-200 rounded">
        <h2 className="text-xl font-semibold mb-2 text-gray-700">
          Server Component (SSR)
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          This section uses Server Component with fetchLatestPostsServer. Data
          is fetched on the server during page render.
        </p>
        <div className="bg-gray-100 p-4 rounded">
          <pre className="text-xs overflow-auto">
            {JSON.stringify(posts, null, 2)}
          </pre>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          Total posts fetched: {posts.length}
        </div>
      </div>

      {/* Client Component (CSR with React Query) version */}
      <PostsClient />
    </div>
  );
}
