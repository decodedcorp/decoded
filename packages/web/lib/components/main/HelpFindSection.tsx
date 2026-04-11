"use client";

import Link from "next/link";
import { formatCompactTime } from "@/lib/utils";
import type { LatestPostCardData } from "./LatestPostsScroll";

interface HelpFindSectionProps {
  posts: LatestPostCardData[];
}

export function HelpFindSection({ posts }: HelpFindSectionProps) {
  if (posts.length === 0) return null;

  return (
    <section className="py-10 lg:py-14 px-6 md:px-12 lg:px-20">
      <div className="mx-auto max-w-[1400px]">
        {/* Section header */}
        <div className="flex items-end justify-between mb-10 md:mb-14">
          <div>
            <span className="text-[10px] md:text-xs font-sans font-bold tracking-[0.4em] text-[#eafd67] uppercase mb-4 block">
              Community
            </span>
            <h2 className="text-4xl md:text-6xl font-serif font-bold italic tracking-tighter text-white">
              Help identify items
            </h2>
          </div>
          <Link
            href="/feed"
            className="group flex items-center gap-4 text-[10px] font-sans font-bold tracking-[0.3em] text-white/30 hover:text-white transition-all uppercase"
          >
            <span>View All</span>
            <div className="w-10 h-[1px] bg-white/10 group-hover:bg-[#eafd67] transition-all group-hover:w-14" />
          </Link>
        </div>

        {/* Scroll container */}
        <div
          className="helpfind-scroll flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 min-w-0"
          style={{ scrollbarWidth: "none" }}
        >
          <style>{`.helpfind-scroll::-webkit-scrollbar { display: none; }`}</style>
          {posts.map((post) => (
            <Link
              key={post.id}
              href={post.link}
              className="group min-w-[200px] md:min-w-[220px] flex-shrink-0 snap-start"
            >
              {/* Image */}
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#0a0a0a] border border-white/[0.06] mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.imageUrl}
                  alt={post.artistName}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide backdrop-blur-md bg-white/15 text-white/90">
                  Curious
                </span>
              </div>

              {/* Text */}
              <p className="text-sm font-semibold text-white/90 truncate">
                {post.artistName}
              </p>
              <p className="text-xs text-white/50 line-clamp-2 mt-0.5">
                {post.context}
              </p>
              <p className="text-[10px] text-white/30 mt-1">
                {formatCompactTime(post.createdAt)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
