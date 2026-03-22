"use client";

import { motion } from "motion/react";
import {
  useProfileStore,
  selectStats,
  formatCurrency,
  calculateAcceptRate,
} from "@/lib/stores/profileStore";

interface StatCardProps {
  value: string | number;
  label: string;
  ariaLabel: string;
  onClick?: () => void;
  delay?: number;
}

function StatCard({
  value,
  label,
  ariaLabel,
  onClick,
  delay = 0,
}: StatCardProps) {
  const isClickable = !!onClick;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`
        bg-card rounded-xl p-4 md:p-6 border border-border text-center
        ${isClickable ? "cursor-pointer hover:bg-accent/50 transition-colors" : ""}
      `}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={ariaLabel}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <div className="text-2xl md:text-3xl font-bold text-foreground">
        {value}
      </div>
      <div className="text-xs md:text-sm text-muted-foreground mt-1">
        {label}
      </div>
    </motion.div>
  );
}

export function StatsCards() {
  const stats = useProfileStore(selectStats);
  const acceptRate = calculateAcceptRate(
    stats.totalAccepted,
    stats.totalAnswers
  );

  const handlePostsClick = () => {
    console.log(
      "Navigate to /profile/activity?tab=posts - not yet implemented"
    );
    alert("활동 내역 페이지는 아직 구현되지 않았습니다.");
  };

  const handleEarningsClick = () => {
    console.log("Navigate to /profile/earnings - not yet implemented");
    alert("수익 페이지는 아직 구현되지 않았습니다.");
  };

  return (
    <div className="grid grid-cols-3 gap-3 md:gap-4">
      <StatCard
        value={stats.totalContributions}
        label="Posts"
        ariaLabel={`${stats.totalContributions}개의 게시물`}
        onClick={handlePostsClick}
        delay={0.1}
      />
      <StatCard
        value={stats.totalAnswers}
        label="Solutions"
        ariaLabel={`솔루션 ${stats.totalAnswers}개`}
        delay={0.2}
      />
      <StatCard
        value={formatCurrency(stats.totalEarnings)}
        label="Points"
        ariaLabel={`포인트 ${formatCurrency(stats.totalEarnings)}`}
        onClick={handleEarningsClick}
        delay={0.3}
      />
    </div>
  );
}

export interface ProfileStatItem {
  label: string;
  value: string | number;
}

export function ProfileStats(): ProfileStatItem[] {
  const stats = useProfileStore(selectStats);

  return [
    { label: "Posts", value: stats.totalContributions },
    { label: "Solutions", value: stats.totalAnswers },
    { label: "Points", value: formatCurrency(stats.totalEarnings) },
  ];
}
