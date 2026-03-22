"use client";

import dynamic from "next/dynamic";

const VtonLab = dynamic(
  () =>
    import("@/lib/components/vton/VtonLab").then((mod) => ({
      default: mod.VtonLab,
    })),
  { ssr: false }
);

export default function VtonPage() {
  return <VtonLab />;
}
