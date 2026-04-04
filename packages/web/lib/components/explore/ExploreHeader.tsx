"use client";

import { Heading, Text } from "@/lib/design-system/typography";

interface ExploreHeaderProps {
  title?: string;
  description?: string;
}

export function ExploreHeader({
  title = "Explore",
  description = "Discover trending styles and celebrity fashion",
}: ExploreHeaderProps) {
  return (
    <div className="px-4 md:px-6 lg:px-8 py-6 md:py-8">
      <div className="max-w-7xl mx-auto">
        <Heading variant="h1" className="mb-2">
          {title}
        </Heading>
        <Text variant="body" textColor="muted">
          {description}
        </Text>
      </div>
    </div>
  );
}
