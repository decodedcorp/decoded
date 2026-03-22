import Link from "next/link";
import FashionScanScene from "@/lib/components/fashion-scan/FashionScanScene";
import type { ScanData } from "@/lib/components/fashion-scan/types";

const MOCK_DATAS: Record<string, ScanData> = {
  "1": {
    photoUrl: "/images/mock_fashion_001.jpg",
    items: [
      {
        id: "item_1",
        name: "SUNGLASSES",
        confidence: 98,
        box: { top: 22.0, left: 33.5, width: 21.0, height: 13.0 },
      },
      {
        id: "item_2",
        name: "GREY TANK TOP",
        confidence: 95,
        box: { top: 49.0, left: 27.0, width: 26.5, height: 37.0 },
      },
      {
        id: "item_3",
        name: "BLACK TRACK PANTS",
        confidence: 90,
        box: { top: 87.0, left: 35.5, width: 29.0, height: 13.0 },
      },
    ],
  },

  "2": {
    photoUrl: "/images/mock_fashion_002.jpeg",
    items: [
      {
        id: "item_1",
        name: "WHITE FLORAL DRESS",
        confidence: 98,
        box: { top: 42.0, left: 18.0, width: 64.0, height: 58.0 },
      },
      {
        id: "item_2",
        name: "CLASSIC LEATHER WATCH",
        confidence: 94,
        box: { top: 38.5, left: 56.5, width: 8.0, height: 5.0 },
      },
    ],
  },
  "3": {
    photoUrl: "/images/mock_fashion_003.jpg",
    items: [
      {
        id: "item_1",
        name: "OVERSIZED VARSITY JACKET",
        confidence: 98,
        box: { top: 19.0, left: 29.0, width: 39.0, height: 28.0 },
      },
      {
        id: "item_2",
        name: "BLACK RUNNING SHORTS",
        confidence: 95,
        box: { top: 46.5, left: 32.0, width: 25.0, height: 10.0 },
      },
      {
        id: "item_3",
        name: "KNEE-HIGH LEATHER BOOTS",
        confidence: 97,
        box: { top: 67.0, left: 37.0, width: 28.0, height: 27.0 },
      },
    ],
  },
};

interface PageProps {
  searchParams: Promise<{ mock?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const mockId = params.mock || "1";
  const mockData = MOCK_DATAS[mockId] || MOCK_DATAS["1"];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="p-4 flex gap-2">
        {Object.keys(MOCK_DATAS).map((id) => (
          <Link
            key={id}
            href={`?mock=${id}`}
            className={`px-4 py-2 rounded border ${
              mockId === id
                ? "bg-[#d9fc69] text-black border-[#d9fc69]"
                : "bg-zinc-800 text-white border-zinc-600 hover:border-[#d9fc69]/50"
            } transition-colors`}
          >
            Mock {id}
          </Link>
        ))}
      </div>
      <FashionScanScene data={mockData} mockId={mockId} />
    </div>
  );
}
