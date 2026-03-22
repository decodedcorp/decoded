import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Subcategory IDs for VTON-eligible fashion categories
const SUBCATEGORY_MAP: Record<string, string> = {
  tops: "230d533e-57b1-4fd9-ae7d-1e4e14fdb091",
  bottoms: "d4367fd1-55bd-4ea6-b085-6fed80a65b99",
};

// For "all" query, include both
const ALL_SUBCATEGORY_IDS = Object.values(SUBCATEGORY_MAP);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() || "";
  const category = searchParams.get("category")?.trim() || "";
  const limit = Math.min(Number(searchParams.get("limit")) || 60, 100);

  try {
    const supabase = await createSupabaseServerClient();

    const subcategoryIds =
      category && SUBCATEGORY_MAP[category]
        ? [SUBCATEGORY_MAP[category]]
        : ALL_SUBCATEGORY_IDS;

    let dbQuery = supabase
      .from("solutions")
      .select(
        "id, title, thumbnail_url, description, keywords, spots!inner(subcategory_id)"
      )
      .eq("status", "active")
      .not("thumbnail_url", "is", null)
      .in("spots.subcategory_id", subcategoryIds)
      .order("accurate_count", { ascending: false })
      .limit(limit);

    if (query) {
      dbQuery = dbQuery.ilike("title", `%${query}%`);
    }

    const { data, error } = await dbQuery;

    if (error) {
      console.error("Error fetching vton items:", JSON.stringify(error));
      return NextResponse.json(
        { items: [], error: error.message },
        { status: 500 }
      );
    }

    const items = (data || []).map((item) => ({
      id: item.id,
      title: item.title,
      thumbnail_url: item.thumbnail_url,
      description: item.description,
      keywords: item.keywords,
    }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error("VTON items error:", err);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
