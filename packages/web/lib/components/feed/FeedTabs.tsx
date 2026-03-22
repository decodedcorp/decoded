"use client";

import { Tabs, TabItem } from "@/lib/design-system";

export type FeedTabValue = "following" | "foryou" | "trending";

export interface FeedTabsProps {
  value: FeedTabValue;
  onChange: (value: FeedTabValue) => void;
  className?: string;
}

export function FeedTabs({ value, onChange, className }: FeedTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as FeedTabValue)}
      layoutId="feed-tabs"
      className={className}
    >
      <TabItem value="following">Following</TabItem>
      <TabItem value="foryou">For You</TabItem>
      <TabItem value="trending">Trending</TabItem>
    </Tabs>
  );
}
