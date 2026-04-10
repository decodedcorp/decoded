import type { Metadata } from "next";
import { RankingsClient } from "./RankingsClient";

export const metadata: Metadata = {
  title: "Rankings | DECODED",
  description: "DECODED 커뮤니티 랭킹 — 솔루션 기여, 활동 포인트 순위",
};

export default function RankingsPage() {
  return <RankingsClient />;
}
