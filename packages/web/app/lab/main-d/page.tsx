import { MainPageD } from "@/lib/components/main-d";
import {
  fetchMainDPostsServer,
  fetchTrendingKeywordsServer,
} from "@/lib/supabase/queries/main-d.server";

export const metadata = {
  title: "DECODED — Main D (Lab)",
  description: "Sticker canvas experimental layout",
};

export const dynamic = "force-dynamic";

export default async function MainDPage() {
  const [posts, trendingKeywords] = await Promise.all([
    fetchMainDPostsServer(),
    fetchTrendingKeywordsServer(),
  ]);

  if (!posts.length) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0d0d0d] text-white/50">
        <p>No posts found. Try refreshing.</p>
      </div>
    );
  }

  return <MainPageD posts={posts} trendingKeywords={trendingKeywords} />;
}
