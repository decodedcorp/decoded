/**
 * API Badge 응답 → Profile Store Badge 매핑
 */

import type {
  ApiEarnedBadgeItem,
  ApiAvailableBadgeItem,
} from "@/lib/api/types";
import type { Badge, BadgeIconType } from "@/lib/stores/profileStore";

const BADGE_TYPE_TO_ICON: Record<string, BadgeIconType> = {
  specialist: "trophy",
  category: "star",
  achievement: "medal",
  milestone: "rocket",
  explorer: "sparkles",
  shopper: "heart",
  // fallbacks
  fandom: "heart",
  special: "crown",
  default: "award",
};

const BADGE_RARITY_TO_ICON: Record<string, BadgeIconType> = {
  common: "medal",
  rare: "star",
  epic: "gem",
  legendary: "crown",
  default: "award",
};

function getIconForBadge(type?: string, rarity?: string): BadgeIconType {
  if (type && BADGE_TYPE_TO_ICON[type]) {
    return BADGE_TYPE_TO_ICON[type];
  }
  if (rarity && BADGE_RARITY_TO_ICON[rarity]) {
    return BADGE_RARITY_TO_ICON[rarity];
  }
  return BADGE_TYPE_TO_ICON.default || "award";
}

export function apiEarnedBadgeToStoreBadge(item: ApiEarnedBadgeItem): Badge {
  return {
    id: item.id,
    name: item.name,
    icon: getIconForBadge(item.type, item.rarity),
    category: item.type || "achievement",
    earnedAt: new Date(item.earned_at),
    description: item.description,
    isLocked: false,
  };
}

export function apiAvailableBadgeToStoreBadge(
  item: ApiAvailableBadgeItem
): Badge {
  return {
    id: item.id,
    name: item.name,
    icon: getIconForBadge(undefined, item.rarity),
    category: "achievement",
    earnedAt: new Date(0), // Locked - no earned date
    description: item.description,
    isLocked: true,
  };
}
