"use client";

import { ReactNode } from "react";

interface ProfileDesktopLayoutProps {
  /** Left column content (profile card + stats) */
  profileSection: ReactNode;
  /** Right column content (badges + activity tabs) */
  activitySection: ReactNode;
}

export function ProfileDesktopLayout({
  profileSection,
  activitySection,
}: ProfileDesktopLayoutProps) {
  return (
    <div className="hidden md:flex gap-8 max-w-6xl mx-auto px-8 py-8">
      {/* Left column - fixed width 320px */}
      <aside className="w-80 flex-shrink-0 space-y-6">{profileSection}</aside>

      {/* Right column - flexible width */}
      <main className="flex-1 space-y-6">{activitySection}</main>
    </div>
  );
}
