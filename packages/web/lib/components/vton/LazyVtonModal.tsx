"use client";

import dynamic from "next/dynamic";

const VtonModal = dynamic(
  () => import("./VtonModal").then((mod) => ({ default: mod.VtonModal })),
  { ssr: false }
);

const VtonBackgroundNotifier = dynamic(
  () =>
    import("./VtonModal").then((mod) => ({
      default: mod.VtonBackgroundNotifier,
    })),
  { ssr: false }
);

export function LazyVtonModal() {
  return (
    <>
      <VtonModal />
      <VtonBackgroundNotifier />
    </>
  );
}
