import { MainPageC } from "@/lib/components/main-c";
import { fetchMainCPostsServer } from "@/lib/supabase/queries/main-c.server";

export const metadata = {
  title: "DECODED — Main C (Lab)",
  description: "Experimental avant-garde editorial layout",
};

export const dynamic = "force-dynamic";

export default async function MainCPage() {
  const posts = await fetchMainCPostsServer();

  if (!posts.length) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#080808] text-white/50">
        <p>No suitable posts found. Try refreshing.</p>
      </div>
    );
  }

  return <MainPageC posts={posts} />;
}
