"use client";

import { motion } from "motion/react";
import {
  Trophy,
  Heart,
  Rabbit,
  Sparkles,
  Star,
  Gem,
  Rocket,
  Crown,
  Medal,
  Award,
  Lock,
} from "lucide-react";
import {
  useProfileStore,
  selectBadges,
  type Badge,
  type BadgeIconType,
} from "@/lib/stores/profileStore";

const BADGE_ICONS: Record<
  BadgeIconType,
  React.ComponentType<{ className?: string }>
> = {
  trophy: Trophy,
  heart: Heart,
  rabbit: Rabbit,
  sparkles: Sparkles,
  star: Star,
  gem: Gem,
  rocket: Rocket,
  crown: Crown,
  medal: Medal,
  award: Award,
};

interface BadgeItemProps {
  badge: Badge;
  onClick: () => void;
  delay?: number;
  isLocked?: boolean;
}

function BadgeItem({
  badge,
  onClick,
  delay = 0,
  isLocked = false,
}: BadgeItemProps) {
  const IconComponent = BADGE_ICONS[badge.icon] || Trophy;

  if (isLocked) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay }}
        onClick={onClick}
        className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary border border-border hover:bg-secondary/80 transition-colors"
        aria-label={`${badge.name} badge (locked)`}
      >
        <div className="relative">
          <IconComponent className="w-7 h-7 md:w-8 md:h-8 text-muted-foreground/40" />
          <Lock className="absolute -bottom-1 -right-1 w-3 h-3 text-muted-foreground" />
        </div>
        <span className="text-xs font-medium text-muted-foreground text-center line-clamp-1">
          {badge.name}
        </span>
      </motion.button>
    );
  }

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      onClick={onClick}
      className="flex flex-col items-center gap-1 p-3 rounded-xl bg-accent/30 hover:bg-accent transition-colors"
      aria-label={`${badge.name} badge`}
    >
      <IconComponent className="w-7 h-7 md:w-8 md:h-8 text-primary" />
      <span className="text-xs font-medium text-foreground text-center line-clamp-1">
        {badge.name}
      </span>
    </motion.button>
  );
}

interface MoreBadgesButtonProps {
  count: number;
  onClick: () => void;
  delay?: number;
}

function MoreBadgesButton({
  count,
  onClick,
  delay = 0,
}: MoreBadgesButtonProps) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
      aria-label={`${count}개 더 보기`}
    >
      <span className="text-lg md:text-xl font-bold text-primary">
        +{count}
      </span>
      <span className="text-xs font-medium text-primary">more</span>
    </motion.button>
  );
}

export function BadgeGrid() {
  const badges = useProfileStore(selectBadges);
  const openBadgeModal = useProfileStore((state) => state.openBadgeModal);

  // Desktop: 4개 표시, Mobile: 3개 표시 (CSS로 반응형 처리)
  const maxDisplayDesktop = 4;
  const maxDisplayMobile = 3;

  const displayedBadgesDesktop = badges.slice(0, maxDisplayDesktop - 1);
  const displayedBadgesMobile = badges.slice(0, maxDisplayMobile - 1);
  const remainingCountDesktop = badges.length - (maxDisplayDesktop - 1);
  const remainingCountMobile = badges.length - (maxDisplayMobile - 1);

  const handleBadgeClick = (badge: Badge) => {
    openBadgeModal("single", badge);
  };

  const handleViewAllClick = () => {
    openBadgeModal("all");
  };

  if (badges.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-card rounded-xl p-4 md:p-6 border border-border"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            My Badges
          </h3>
        </div>
        <div className="text-center py-8 text-muted-foreground text-sm">
          아직 획득한 뱃지가 없습니다
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-card rounded-xl p-4 md:p-6 border border-border"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          My Badges
          <span className="text-sm text-muted-foreground font-normal">
            ({badges.filter((b) => !b.isLocked).length} 획득)
          </span>
        </h3>
        <button
          onClick={handleViewAllClick}
          className="text-sm text-primary hover:underline"
        >
          View All
        </button>
      </div>

      {/* Mobile Grid (3 columns) */}
      <div className="grid grid-cols-3 gap-3 md:hidden">
        {displayedBadgesMobile.map((badge, index) => (
          <BadgeItem
            key={badge.id}
            badge={badge}
            onClick={() => handleBadgeClick(badge)}
            delay={0.1 * (index + 1)}
            isLocked={badge.isLocked}
          />
        ))}
        {remainingCountMobile > 0 && (
          <MoreBadgesButton
            count={remainingCountMobile}
            onClick={handleViewAllClick}
            delay={0.1 * maxDisplayMobile}
          />
        )}
      </div>

      {/* Desktop Grid (4 columns) */}
      <div className="hidden md:grid grid-cols-4 gap-3">
        {displayedBadgesDesktop.map((badge, index) => (
          <BadgeItem
            key={badge.id}
            badge={badge}
            onClick={() => handleBadgeClick(badge)}
            delay={0.1 * (index + 1)}
            isLocked={badge.isLocked}
          />
        ))}
        {remainingCountDesktop > 0 && (
          <MoreBadgesButton
            count={remainingCountDesktop}
            onClick={handleViewAllClick}
            delay={0.1 * maxDisplayDesktop}
          />
        )}
      </div>
    </motion.section>
  );
}
