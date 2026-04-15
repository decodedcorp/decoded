import type { Metadata } from "next";
import { RankingsClient } from "./RankingsClient";

export const metadata: Metadata = {
  title: "Rankings | DECODED",
  description:
    "DECODED community rankings — solution contributions and activity points",
};

export default function RankingsPage() {
  return <RankingsClient />;
}
