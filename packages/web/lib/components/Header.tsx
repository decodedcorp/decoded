"use client";

import React from "react";
import Link from "next/link";
import { SearchInput } from "./SearchInput";
import { SimpleFilterDropdown } from "./SimpleFilterDropdown";
import DecodedLogo from "./DecodedLogo";

/**
 * Header - Mobile-only header component
 *
 * Features:
 * - Only visible on mobile (<768px)
 * - Hidden on desktop/tablet (md:hidden) - Sidebar takes over
 * - Logo, Search, and Filter
 */
export function Header() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-[9999] w-full bg-background/80 backdrop-blur-md pointer-events-none md:hidden"
      aria-label="Mobile header"
    >
      <div className="w-full px-2 h-14 flex items-center justify-between gap-2 pointer-events-auto">
        {/* Left section: Logo */}
        <div className="flex items-center flex-shrink-0 overflow-visible">
          {/* Logo - mobile size */}
          <Link
            href="/"
            className="relative w-48 h-14 flex items-center justify-center -ml-4 hover:opacity-80 transition-opacity overflow-visible"
            aria-label="Go to home"
          >
            <DecodedLogo
              asciiFontSize={3}
              textFontSize={200}
              planeBaseHeight={12}
              enableWaves={false}
              enableHueRotate={true}
            />
          </Link>
        </div>

        {/* Right section: Search + Filter */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <SearchInput />
          <SimpleFilterDropdown />
        </div>
      </div>
    </header>
  );
}
