"use client";

import dynamic from "next/dynamic";

const OnboardingSheet = dynamic(
  () => import("@/lib/components/auth/OnboardingSheet"),
  { ssr: false }
);

export function LazyOnboardingSheet() {
  return <OnboardingSheet />;
}
