"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Settings, RefreshCw, Share2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AxiosError } from "axios";
import { Header } from "@/lib/components";
import {
  ProfileHeader,
  StatsCards,
  BadgeGrid,
  RankingList,
  BadgeModal,
  ProfileEditModal,
  ProfileDesktopLayout,
  ActivityTabs,
  ActivityContent,
  type ActivityTab,
  ProfileBio,
  FollowStats,
  PostsGrid,
  SpotsList,
  SolutionsList,
  SavedGrid,
  LikesGrid,
  TriesGrid,
  StyleDNACard,
  ArchiveStats,
  InkEconomyCard,
} from "@/lib/components/profile";
import { StyleDNAEditModal } from "@/lib/components/profile/StyleDNAEditModal";
import {
  useMe,
  useUserStats,
  useMyBadges,
  useMyRanking,
  useProfileExtras,
  useTryOnCount,
} from "@/lib/hooks/useProfile";
import { useProfileStore } from "@/lib/stores/profileStore";
import {
  apiEarnedBadgeToStoreBadge,
  apiAvailableBadgeToStoreBadge,
} from "@/lib/utils/badge-mapper";
import { apiMyRankingDetailToStoreRankings } from "@/lib/utils/ranking-mapper";
import { useAuthStore } from "@/lib/stores/authStore";

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      {/* Mobile Header Skeleton */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background sticky top-0 z-10">
        <div className="w-9 h-9 rounded-lg bg-muted animate-pulse" />
        <div className="w-16 h-6 bg-muted rounded animate-pulse" />
        <div className="w-9 h-9 rounded-lg bg-muted animate-pulse" />
      </header>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* Mobile Layout Skeleton */}
      <div className="md:hidden px-4 py-4 space-y-4">
        {/* Profile Header Skeleton */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="w-32 h-5 bg-muted rounded animate-pulse" />
              <div className="w-24 h-4 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card rounded-xl p-4 border border-border text-center"
            >
              <div className="w-12 h-8 bg-muted rounded mx-auto animate-pulse" />
              <div className="w-10 h-3 bg-muted rounded mx-auto mt-2 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Badge Grid Skeleton */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="w-24 h-5 bg-muted rounded animate-pulse mb-4" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Layout Skeleton */}
      <div className="hidden md:block pt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex gap-8">
            {/* Profile Sidebar Skeleton */}
            <div className="w-80 flex-shrink-0">
              <div className="bg-card rounded-xl p-6 border border-border">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-24 h-24 rounded-full bg-muted animate-pulse" />
                  <div className="w-40 h-6 bg-muted rounded animate-pulse" />
                  <div className="w-28 h-4 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </div>

            {/* Activity Area Skeleton */}
            <div className="flex-1 space-y-6">
              <div className="bg-card rounded-xl p-6 border border-border h-32 animate-pulse" />
              <div className="bg-card rounded-xl p-6 border border-border h-48 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileError({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background sticky top-0 z-10">
        <Link href="/" className="p-2 -ml-2 hover:bg-accent rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-semibold text-lg">Profile</h1>
        <div className="w-9" />
      </header>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* Error Content */}
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center">
          <div className="mb-4 text-4xl">⚠️</div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">
            Couldn't load profile
          </h2>
          <p className="mb-6 text-sm text-muted-foreground max-w-sm">
            {error.message || "Please try again shortly."}
          </p>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <RefreshCw className="w-4 h-4" />
            다시 시도
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProfileClient() {
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStyleDNAModalOpen, setIsStyleDNAModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActivityTab>("posts");
  const isAuthReady = useAuthStore((s) => s.isInitialized);

  // Fetch user data from API (wait for auth initialization)
  const {
    data: userData,
    isLoading: isUserLoading,
    isError: isUserError,
    error: userError,
    refetch: refetchUser,
  } = useMe({ enabled: isAuthReady });

  // Fetch stats from API (wait for auth initialization)
  const {
    data: statsData,
    isLoading: isStatsLoading,
    isError: isStatsError,
    error: statsError,
    refetch: refetchStats,
  } = useUserStats({ enabled: isAuthReady });

  // Badges & Rankings (실제 API)
  const { data: badgesData, refetch: refetchBadges } = useMyBadges();
  const { data: rankingData, refetch: refetchRankings } = useMyRanking();

  // Profile dashboard data (Supabase direct)
  const userId = userData?.id;
  const { data: profileExtras } = useProfileExtras(userId);
  const { data: tryOnCount } = useTryOnCount(userId);

  // Sync API data to store
  const setUserFromApi = useProfileStore((state) => state.setUserFromApi);
  const setStatsFromApi = useProfileStore((state) => state.setStatsFromApi);
  const setBadgesFromApi = useProfileStore((state) => state.setBadgesFromApi);
  const setRankingsFromApi = useProfileStore(
    (state) => state.setRankingsFromApi
  );

  useEffect(() => {
    if (userData) setUserFromApi(userData);
  }, [userData, setUserFromApi]);

  useEffect(() => {
    if (statsData) setStatsFromApi(statsData);
  }, [statsData, setStatsFromApi]);

  useEffect(() => {
    if (badgesData) {
      const earned = badgesData.data.map(apiEarnedBadgeToStoreBadge);
      const available = badgesData.available_badges.map(
        apiAvailableBadgeToStoreBadge
      );
      setBadgesFromApi([...earned, ...available]);
    }
  }, [badgesData, setBadgesFromApi]);

  useEffect(() => {
    if (rankingData) {
      const rankings = apiMyRankingDetailToStoreRankings(rankingData);
      setRankingsFromApi(rankings);
    }
  }, [rankingData, setRankingsFromApi]);

  // Loading state - user & stats만 블로킹 (badges/rankings는 개별 로딩)
  const isLoading = isUserLoading || isStatsLoading;

  // Error state - user & stats 실패 시에만 전체 에러
  const isError = isUserError || isStatsError;
  const error = userError || statsError;

  // 401 auth error -> redirect to login
  useEffect(() => {
    const axiosErr = error as AxiosError | null;
    if (isError && axiosErr?.response?.status === 401) {
      router.replace("/login?redirect=/profile");
    }
  }, [isError, error, router]);

  // Retry function
  const handleRetry = () => {
    refetchUser();
    refetchStats();
    refetchBadges();
    refetchRankings();
  };

  // Show skeleton during loading
  if (isLoading) {
    return <ProfileSkeleton />;
  }

  // Show error state
  if (isError && error) {
    const axiosErr = error as AxiosError;
    if (axiosErr.response?.status === 401) {
      // Show skeleton while redirect is in flight
      return <ProfileSkeleton />;
    }
    return <ProfileError error={error} onRetry={handleRetry} />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "posts":
        return <PostsGrid userId={userId} />;
      case "spots":
        return <SpotsList userId={userId} />;
      case "solutions":
        return <SolutionsList userId={userId} />;
      case "tries":
        return <TriesGrid />;
      case "saved":
        return <SavedGrid />;
      case "likes":
        return <LikesGrid />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      {/* Mobile Header - back button + title + settings */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background sticky top-0 z-10">
        <Link href="/" className="p-2 -ml-2 hover:bg-accent rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-semibold text-lg">Profile</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(window.location.href);
              } catch (_) {
                // Clipboard API not available
              }
            }}
            className="p-2 rounded-lg hover:bg-accent"
            aria-label="Share profile"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="p-2 -mr-2 hover:bg-accent rounded-lg"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* Mobile Layout - stacked */}
      <div className="md:hidden px-4 py-4 space-y-4">
        <ProfileHeader onEditClick={() => setIsEditModalOpen(true)} />
        <ProfileBio bio={userData?.bio ?? undefined} className="px-4" />
        <FollowStats
          followers={userData?.followers_count ?? 0}
          following={userData?.following_count ?? 0}
          className="px-4"
        />
        <StyleDNACard
          keywords={profileExtras?.style_dna?.keywords}
          colors={profileExtras?.style_dna?.colors}
          progress={profileExtras?.style_dna?.progress}
          editable
          onEditClick={() => setIsStyleDNAModalOpen(true)}
        />
        <ArchiveStats tryOnCount={tryOnCount} />
        <InkEconomyCard inkCredits={profileExtras?.ink_credits} />
        <BadgeGrid />
        {/* Activity Tabs */}
        <div className="mt-6">
          <ActivityTabs activeTab={activeTab} onTabChange={setActiveTab} />
          <ActivityContent activeTab={activeTab} className="pt-4">
            {renderTabContent()}
          </ActivityContent>
        </div>
      </div>

      {/* Desktop Layout - 2 column */}
      <div className="hidden md:block pt-16">
        <ProfileDesktopLayout
          profileSection={
            <>
              <ProfileHeader onEditClick={() => setIsEditModalOpen(true)} />
              <StyleDNACard
                keywords={profileExtras?.style_dna?.keywords}
                colors={profileExtras?.style_dna?.colors}
                progress={profileExtras?.style_dna?.progress}
              />
              <InkEconomyCard inkCredits={profileExtras?.ink_credits} />
            </>
          }
          activitySection={
            <>
              <ArchiveStats tryOnCount={tryOnCount} />
              <BadgeGrid />
              <RankingList />
              {/* Activity Tabs */}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <ActivityTabs
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                />
                <ActivityContent activeTab={activeTab} className="p-6">
                  {renderTabContent()}
                </ActivityContent>
              </div>
            </>
          }
        />
      </div>

      {/* Modals */}
      <BadgeModal />
      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
      {userId && (
        <StyleDNAEditModal
          isOpen={isStyleDNAModalOpen}
          onClose={() => setIsStyleDNAModalOpen(false)}
          userId={userId}
          initialKeywords={profileExtras?.style_dna?.keywords}
          initialColors={profileExtras?.style_dna?.colors}
        />
      )}
    </div>
  );
}
