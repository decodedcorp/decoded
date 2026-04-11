"use client";

import Link from "next/link";
import { formatCompactTime } from "@/lib/utils";

export interface LatestPostCardData {
  id: string;
  imageUrl: string;
  artistName: string;
  context: string;
  createdAt: string;
  createdWithSolutions: boolean | null;
  link: string;
}

interface LatestPostsScrollProps {
  posts: LatestPostCardData[];
}

export function LatestPostsScroll({ posts }: LatestPostsScrollProps) {
  if (posts.length === 0) return null;

  return (
    <div className="flex flex-col h-full min-w-0">
      {/* Sub-header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="w-8 h-[2px] bg-[#eafd67]" />
        <h3 className="text-xs uppercase tracking-[0.2em] text-white/50 font-sans font-medium">
          Latest Posts
        </h3>
      </div>

      {/* Scroll container */}
      <div
        className="latest-scroll flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2"
        style={{ scrollbarWidth: "none" }}
      >
        <style>{`.latest-scroll::-webkit-scrollbar { display: none; }`}</style>
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
              {post.createdWithSolutions !== null && (
                <span
                  className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide backdrop-blur-md ${
                    post.createdWithSolutions
                      ? "bg-[#eafd67]/90 text-[#050505]"
                      : "bg-white/15 text-white/90"
                  }`}
                >
                  {post.createdWithSolutions
                    ? "Sharing items"
                    : "Curious"}
                </span>
              )}
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
  );
}
