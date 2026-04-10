"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { LogOut } from "lucide-react";
import {
  useProfileStore,
  selectUser,
  selectStats,
  formatCurrency,
} from "@/lib/stores/profileStore";
import {
  useAuthStore,
  selectLogout,
  selectIsLoading,
} from "@/lib/stores/authStore";
import { ProfileHeaderCard } from "@/lib/design-system/profile-header-card";

interface ProfileHeaderProps {
  onEditClick?: () => void;
}

export function ProfileHeader({ onEditClick }: ProfileHeaderProps) {
  const user = useProfileStore(selectUser);
  const stats = useProfileStore(selectStats);
  const router = useRouter();
  const logout = useAuthStore(selectLogout);
  const isLoading = useAuthStore(selectIsLoading);

  // Format stats for ProfileHeaderCard
  const formattedStats = [
    { label: "Posts", value: stats.totalContributions },
    { label: "Solutions", value: stats.totalAnswers },
    { label: "Points", value: formatCurrency(stats.totalEarnings) },
  ];

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <ProfileHeaderCard
        avatarUrl={user.avatarUrl}
        displayName={user.displayName}
        username={user.username}
        bio={user.bio}
        stats={formattedStats}
        actions={
          <>
            <button
              onClick={onEditClick}
              className="px-4 py-2 text-sm font-medium rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              Edit Profile
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="p-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5 text-muted-foreground" />
            </button>
          </>
        }
      />
    </motion.div>
  );
}
