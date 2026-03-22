"use client";

import { useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
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
} from "lucide-react";
import {
  useProfileStore,
  selectBadges,
  selectBadgeModalMode,
  selectSelectedBadge,
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

interface BadgeModalContentProps {
  onClose: () => void;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function SingleBadgeContent({ badge }: { badge: Badge }) {
  const IconComponent = BADGE_ICONS[badge.icon] || Trophy;
  const isLocked = badge.isLocked || badge.earnedAt.getTime() === 0;

  return (
    <div className="text-center">
      <div className="flex justify-center mb-4">
        <IconComponent
          className={`w-16 h-16 ${isLocked ? "text-muted-foreground/40" : "text-primary"}`}
        />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">{badge.name}</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {badge.description || `${badge.category} 카테고리 뱃지`}
      </p>
      {!isLocked && (
        <p className="text-xs text-muted-foreground">
          획득일: {formatDate(badge.earnedAt)}
        </p>
      )}
    </div>
  );
}

function AllBadgesContent({
  badges,
  onBadgeClick,
}: {
  badges: Badge[];
  onBadgeClick: (badge: Badge) => void;
}) {
  return (
    <div>
      <h3 className="text-lg font-bold text-foreground mb-4 text-center">
        내 뱃지 ({badges.length})
      </h3>
      <div className="grid grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
        {badges.map((badge) => {
          const IconComponent = BADGE_ICONS[badge.icon] || Trophy;
          return (
            <button
              key={badge.id}
              onClick={() => onBadgeClick(badge)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-accent/30 hover:bg-accent transition-colors"
            >
              <IconComponent className="w-8 h-8 text-primary" />
              <span className="text-xs font-medium text-foreground text-center line-clamp-2">
                {badge.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ModalContent({ onClose }: BadgeModalContentProps) {
  const badges = useProfileStore(selectBadges);
  const badgeModalMode = useProfileStore(selectBadgeModalMode);
  const selectedBadge = useProfileStore(selectSelectedBadge);
  const openBadgeModal = useProfileStore((state) => state.openBadgeModal);

  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const handleBadgeClick = (badge: Badge) => {
    openBadgeModal("single", badge);
  };

  // Focus trap
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, [badgeModalMode]);

  // ESC key handling
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Modal */}
      <motion.div
        ref={modalRef}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative bg-card rounded-2xl p-6 w-full max-w-md shadow-xl border border-border"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="badge-modal-title"
      >
        {/* Close Button */}
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-accent transition-colors"
          aria-label="닫기"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Content */}
        <div className="pt-4">
          {badgeModalMode === "single" && selectedBadge && (
            <SingleBadgeContent badge={selectedBadge} />
          )}
          {badgeModalMode === "all" && (
            <AllBadgesContent badges={badges} onBadgeClick={handleBadgeClick} />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function BadgeModal() {
  const badgeModalMode = useProfileStore(selectBadgeModalMode);
  const closeBadgeModal = useProfileStore((state) => state.closeBadgeModal);

  // Only render portal on client side
  if (typeof window === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {badgeModalMode && <ModalContent onClose={closeBadgeModal} />}
    </AnimatePresence>,
    document.body
  );
}
