"use client";

import { motion } from "motion/react";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import {
  useProfileStore,
  selectRankings,
  type Ranking,
} from "@/lib/stores/profileStore";

interface RankingItemProps {
  ranking: Ranking;
  delay?: number;
}

function getPeriodLabel(period: Ranking["period"]): string {
  switch (period) {
    case "week":
      return "this week";
    case "month":
      return "this month";
    case "all":
      return "overall";
    default:
      return "";
  }
}

function RankingItem({ ranking, delay = 0 }: RankingItemProps) {
  const scopeLabel = ranking.scope === "global" ? "Global" : ranking.scope;
  const periodLabel = getPeriodLabel(ranking.period);

  return (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      className="flex items-center justify-between py-2"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">
          {scopeLabel}:
        </span>
        <span className="text-sm text-muted-foreground">
          #{ranking.rank} {periodLabel}
        </span>
      </div>

      {/* Change Indicator */}
      <div className="flex items-center gap-1">
        {ranking.change > 0 && (
          <>
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xs font-medium text-green-500">
              +{ranking.change}
            </span>
          </>
        )}
        {ranking.change < 0 && (
          <>
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-xs font-medium text-red-500">
              {ranking.change}
            </span>
          </>
        )}
        {ranking.change === 0 && (
          <Minus className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
    </motion.li>
  );
}

export function RankingList() {
  const rankings = useProfileStore(selectRankings);

  // 최대 3개 표시
  const displayedRankings = rankings.slice(0, 3);

  if (rankings.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-card rounded-xl p-4 md:p-6 border border-border"
      >
        <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-primary" />
          Rankings
        </h3>
        <div className="text-center py-8 text-muted-foreground text-sm">
          활동을 시작하면 랭킹이 표시됩니다
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-card rounded-xl p-4 md:p-6 border border-border"
    >
      <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-primary" />
        Rankings
      </h3>

      <ul className="divide-y divide-border">
        {displayedRankings.map((ranking, index) => (
          <RankingItem
            key={`${ranking.scope}-${ranking.period}`}
            ranking={ranking}
            delay={0.1 * (index + 1)}
          />
        ))}
      </ul>
    </motion.section>
  );
}
