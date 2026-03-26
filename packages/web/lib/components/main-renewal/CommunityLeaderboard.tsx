"use client";

import Image from "next/image";
import type { CommunityLeaderboardData } from "./types";

interface CommunityLeaderboardProps {
  data: CommunityLeaderboardData;
  className?: string;
}

const RANK_COLORS = [
  "from-yellow-400 to-amber-500", // #1 Gold
  "from-slate-300 to-slate-400",  // #2 Silver
  "from-amber-600 to-orange-700", // #3 Bronze
];

const RANK_BORDER = [
  "border-yellow-500/40",
  "border-slate-400/40",
  "border-amber-600/40",
];

export default function CommunityLeaderboard({
  data,
  className,
}: CommunityLeaderboardProps) {
  const top3 = data.trendingUsers.slice(0, 3);
  const rest = data.trendingUsers.slice(3);

  return (
    <section
      className={`relative py-24 bg-[var(--mag-bg)] overflow-hidden ${className ?? ""}`}
      aria-label="Community leaderboard"
    >
      {/* Section header */}
      <div className="mx-auto max-w-7xl px-6 mb-14">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--mag-accent)] mb-3">
          Community
        </p>
        <h2 className="text-3xl md:text-5xl font-bold text-[var(--mag-text)]">
          Style DNA &amp;{" "}
          <span className="text-[var(--mag-accent)]">Rank</span>
        </h2>
      </div>

      {/* Top 3 Podium */}
      {top3.length > 0 && (
        <div className="mx-auto max-w-7xl px-6 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {top3.map((user, i) => (
              <div
                key={user.id}
                className={`relative rounded-2xl border ${RANK_BORDER[i]} bg-neutral-900/60 backdrop-blur-sm p-6 ${
                  i === 0 ? "md:order-2 md:-mt-4" : i === 1 ? "md:order-1" : "md:order-3"
                }`}
              >
                {/* Rank badge */}
                <div
                  className={`absolute -top-3 left-6 w-8 h-8 rounded-full bg-gradient-to-b ${RANK_COLORS[i]} flex items-center justify-center text-xs font-black text-black shadow-lg`}
                >
                  {i + 1}
                </div>

                <div className="flex items-center gap-4 mt-2">
                  {/* Avatar */}
                  <div className="relative flex-none w-12 h-12 rounded-full overflow-hidden bg-neutral-800 ring-2 ring-neutral-700">
                    {user.avatarUrl ? (
                      <Image
                        src={user.avatarUrl}
                        alt={user.username}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg font-bold text-neutral-500">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--mag-text)] truncate">
                      {user.username}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {user.score > 0
                        ? `${user.score.toLocaleString()} ink`
                        : "Style Pioneer"}
                    </p>
                  </div>
                </div>

                {/* Style DNA tags */}
                {user.styleTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {user.styleTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium
                                   bg-[var(--mag-accent)]/10 text-[var(--mag-accent)] border border-[var(--mag-accent)]/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rest of leaderboard (horizontal scroll) */}
      {rest.length > 0 && (
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {rest.map((user, i) => (
              <div
                key={user.id}
                className="flex-none w-56 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-400">
                    #{i + 4}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--mag-text)] truncate">
                      {user.username}
                    </p>
                    <p className="text-[10px] text-neutral-500">
                      {user.score > 0
                        ? `${user.score.toLocaleString()} ink`
                        : "Style Pioneer"}
                    </p>
                  </div>
                </div>

                {user.styleTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {user.styleTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded-full text-[9px]
                                   bg-neutral-800 text-neutral-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {data.trendingUsers.length === 0 && (
        <div className="mx-auto max-w-7xl px-6">
          <div className="w-full py-16 text-center text-neutral-600">
            <p className="text-sm">Leaderboard data will appear here</p>
          </div>
        </div>
      )}

      {/* Trending tags */}
      {data.trendingTags && data.trendingTags.length > 0 && (
        <div className="mx-auto max-w-7xl px-6 mt-14">
          <p className="text-xs uppercase tracking-widest text-neutral-500 mb-4">
            Trending This Week
          </p>
          <div className="flex flex-wrap gap-2">
            {data.trendingTags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 rounded-full text-xs font-medium
                           border border-neutral-700 text-neutral-400 hover:border-[var(--mag-accent)] hover:text-[var(--mag-accent)] transition-colors cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
