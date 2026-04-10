"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Trophy, Medal, Crown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/lib/components";
import { customInstance } from "@/lib/api/mutator/custom-instance";

interface RankingUser {
  id: string;
  username: string;
  avatar_url: string | null;
  rank: string;
}

interface RankingItem {
  rank: number;
  user: RankingUser;
  total_points: number;
  weekly_points: number;
  solution_count: number;
  adopted_count: number;
  verified_count: number;
}

interface RankingListResponse {
  data: RankingItem[];
  my_ranking?: { rank: number; total_points: number; weekly_points: number };
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
  };
}

type Period = "weekly" | "monthly" | "all_time";

function useRankings(period: Period) {
  return useQuery({
    queryKey: ["rankings", period],
    queryFn: () =>
      customInstance<RankingListResponse>({
        url: `/api/v1/rankings?period=${period}`,
        method: "GET",
      }),
    staleTime: 1000 * 60 * 2,
  });
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return (
    <span className="text-sm font-mono text-muted-foreground w-5 text-center">
      {rank}
    </span>
  );
}

export function RankingsClient() {
  const [period, setPeriod] = useState<Period>("weekly");
  const { data, isLoading } = useRankings(period);

  const periods: { value: Period; label: string }[] = [
    { value: "weekly", label: "This Week" },
    { value: "monthly", label: "This Month" },
    { value: "all_time", label: "All Time" },
  ];

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background sticky top-0 z-10">
        <Link href="/" className="p-2 -ml-2 hover:bg-accent rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-semibold text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Rankings
        </h1>
        <div className="w-9" />
      </header>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 md:pt-24">
        {/* My Ranking Banner */}
        {data?.my_ranking && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-mono uppercase">
                Your Rank
              </p>
              <p className="text-2xl font-bold text-foreground">
                #{data.my_ranking.rank}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground font-mono uppercase">
                Points
              </p>
              <p className="text-2xl font-bold text-primary">
                {data.my_ranking.total_points.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Period Tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1 mb-6">
          {periods.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                period === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Rankings List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border animate-pulse"
              >
                <div className="w-5 h-5 bg-muted rounded" />
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="w-24 h-4 bg-muted rounded" />
                  <div className="w-16 h-3 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {data?.data.map((item) => (
              <Link
                key={item.user.id}
                href={`/profile/${item.user.id}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:bg-accent transition-colors"
              >
                <RankIcon rank={item.rank} />
                <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  {item.user.avatar_url ? (
                    <Image
                      src={item.user.avatar_url}
                      alt={item.user.username}
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground text-sm font-bold">
                      {item.user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.user.username}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.solution_count} solutions · {item.adopted_count}{" "}
                    adopted
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">
                    {item.total_points.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">pts</p>
                </div>
              </Link>
            ))}

            {data?.data.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No rankings yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
