import { MainPageB } from "@/lib/components/main-b";
import { fetchMainBPostServer } from "@/lib/supabase/queries/main-b.server";

export const metadata = {
  title: "DECODED — Main B (Lab)",
  description: "Experimental no-section editorial layout",
};

export const dynamic = "force-dynamic";

export default async function MainBPage() {
  const data = await fetchMainBPostServer();

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0d0d0d] text-white/50">
        <p>No suitable post found. Try refreshing.</p>
      </div>
    );
  }

  return (
    <MainPageB
      post={data.post}
      items={data.items}
      relatedPosts={data.relatedPosts}
    />
  );
}
