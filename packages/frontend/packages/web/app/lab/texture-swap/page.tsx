"use client";

import dynamic from "next/dynamic";

const TextureSwapSpike = dynamic(
  () =>
    import("@/lib/components/collection/studio/TextureSwapSpike").then(
      (mod) => ({ default: mod.TextureSwapSpike })
    ),
  { ssr: false }
);

export default function TextureSwapPage() {
  return <TextureSwapSpike />;
}
