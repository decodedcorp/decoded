"use client";

import { Heading } from "@/lib/design-system";

export function FeedHeader() {
  return (
    <div className="hidden md:block px-12 lg:px-16 pt-8 pb-6">
      <Heading variant="h1" className="font-serif text-4xl">
        Latest Feed
      </Heading>
    </div>
  );
}
