"use client";

import { motion } from "motion/react";
import { useProfileStore, selectStats } from "@/lib/stores/profileStore";

interface ArchiveStatProps {
  value: string | number;
  label: string;
  accent?: boolean;
  delay?: number;
}

function ArchiveStat({ value, label, accent, delay = 0 }: ArchiveStatProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 md:p-5 text-center"
    >
      <div
        className={`text-2xl font-bold ${accent ? "text-[#eafd67]" : "text-white"}`}
      >
        {value}
      </div>
      <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-400 mt-1">
        {label}
      </div>
    </motion.div>
  );
}

interface ArchiveStatsProps {
  tryOnCount: number;
}

export function ArchiveStats({ tryOnCount = 0 }: Partial<ArchiveStatsProps>) {
  const stats = useProfileStore(selectStats);

  const totalPoints = stats.totalEarnings;
  let socialRank = "Member";
  if (totalPoints >= 1000) socialRank = "Expert";
  else if (totalPoints >= 300) socialRank = "Contributor";

  return (
    <div className="grid grid-cols-3 gap-3">
      <ArchiveStat
        value={stats.totalContributions}
        label="Total Issues"
        delay={0.1}
      />
      <ArchiveStat value={tryOnCount} label="Try-on History" delay={0.2} />
      <ArchiveStat value={socialRank} label="Social Rank" accent delay={0.3} />
    </div>
  );
}
