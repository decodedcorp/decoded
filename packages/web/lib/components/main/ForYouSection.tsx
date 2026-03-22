"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { StyleCard, type StyleCardData } from "./StyleCard";
import { cn } from "@/lib/utils";

type TabId = "following" | "for-you" | "trending";

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: "following", label: "Following" },
  { id: "for-you", label: "For You" },
  { id: "trending", label: "Trending" },
];

export interface ForYouSectionProps {
  forYouPosts: StyleCardData[];
  trendingPosts: StyleCardData[];
  followingPosts: StyleCardData[];
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center py-24 gap-6 text-center"
    >
      <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center mb-2">
        <svg
          className="w-7 h-7 text-white/20"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      </div>
      <p className="text-white/30 font-sans text-sm tracking-wider max-w-xs leading-relaxed">
        Start exploring to unlock your personalized feed.
      </p>
      <Link
        href="/explore"
        className="mt-2 px-8 py-3 border border-white/10 rounded-full text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-white/40 hover:text-white hover:border-white/30 transition-all"
      >
        Explore Now
      </Link>
    </motion.div>
  );
}

export function ForYouSection({
  forYouPosts,
  trendingPosts,
  followingPosts,
}: ForYouSectionProps) {
  const [activeTab, setActiveTab] = useState<TabId>("for-you");

  // Avoid creating a new object on every render — resolve directly by tab value
  const activePosts =
    activeTab === "following"
      ? followingPosts
      : activeTab === "for-you"
        ? forYouPosts
        : trendingPosts;

  return (
    <section className="py-24 md:py-32 bg-[#050505] px-6 md:px-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-primary font-sans font-bold tracking-[0.4em] text-[10px] md:text-xs uppercase mb-4 block">
              Based on your browsing style
            </span>
            <h2 className="text-6xl md:text-8xl font-serif font-bold italic tracking-tighter text-white leading-[0.85]">
              For You
            </h2>
          </motion.div>

          {/* Tab Bar */}
          <div className="flex gap-8 overflow-x-auto no-scrollbar pb-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative text-xs font-sans font-bold tracking-[0.2em] uppercase transition-all duration-500 py-2 whitespace-nowrap",
                  activeTab === tab.id
                    ? "text-primary"
                    : "text-white/20 hover:text-white/60"
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabUnderlineForYou"
                    className="absolute bottom-0 left-0 w-full h-[1px] bg-primary"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activePosts.length === 0 ? (
            <EmptyState key={`empty-${activeTab}`} />
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {activePosts.map((post, index) => (
                <StyleCard key={post.id} data={post} index={index} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
