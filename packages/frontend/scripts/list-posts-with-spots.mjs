#!/usr/bin/env node
/**
 * Spot이 있는 post 목록 조회
 * 사용: node scripts/list-posts-with-spots.mjs
 * API_BASE_URL이 없으면 http://localhost:8000 사용
 */
const API_BASE = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function main() {
  const url = `${API_BASE}/api/v1/posts?per_page=100`;
  console.log("Fetching:", url);
  const res = await fetch(url);
  if (!res.ok) {
    console.error("API error:", res.status, await res.text());
    process.exit(1);
  }
  const json = await res.json();
  const posts = json.data || [];
  const withSpots = posts.filter((p) => (p.spot_count ?? 0) > 0);
  console.log("\n=== Spot이 있는 Post 목록 ===\n");
  console.log("전체 포스트 수:", posts.length);
  console.log("스팟 있는 포스트 수:", withSpots.length);
  if (withSpots.length === 0) {
    console.log("\n(스팟이 있는 포스트가 없습니다.)");
    return;
  }
  console.table(
    withSpots.map((p) => ({
      id: p.id,
      spot_count: p.spot_count,
      artist_name: p.artist_name || p.group_name || "-",
      title: (p.title || "").slice(0, 30),
    }))
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
