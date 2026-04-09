"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, RefreshCw, Share2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AxiosError } from "axios";
import { Header } from "@/lib/components";
import { ProfileHeaderCard } from "@/lib/design-system";
import {
  ProfileBio,
  FollowStats,
  StyleDNACard,
  ProfileDesktopLayout,
  ActivityTabs,
  ActivityContent,
  PUBLIC_TABS,
  PostsGrid,
  SpotsList,
  SolutionsList,
  type ActivityTab,
} from "@/lib/components/profile";
import { useMe, useUser, useProfileExtras } from "@/lib/hooks/useProfile";

function PublicProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background sticky top-0 z-10">
        <div className="w-9 h-9 rounded-lg bg-muted animate-pulse" />
        <div className="w-16 h-6 bg-muted rounded animate-pulse" />
        <div className="w-9 h-9 rounded-lg bg-muted animate-pulse" />
      </header>
      <div className="hidden md:block">
        <Header />
      </div>
      <div className="md:hidden px-4 py-4 space-y-4">
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="w-32 h-5 bg-muted rounded animate-pulse" />
              <div className="w-24 h-4 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-card rounded-xl p-4 border border-border text-center"
            >
              <div className="w-12 h-8 bg-muted rounded mx-auto animate-pulse" />
              <div className="w-10 h-3 bg-muted rounded mx-auto mt-2 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UserNotFound() {
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background sticky top-0 z-10">
        <Link href="/" className="p-2 -ml-2 hover:bg-accent rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-semibold text-lg">Profile</h1>
        <div className="w-9" />
      </header>
      <div className="hidden md:block">
        <Header />
      </div>
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center">
          <div className="mb-4 text-5xl">&#128100;</div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">
            이 유저를 찾을 수 없습니다
          </h2>
          <p className="mb-6 text-sm text-muted-foreground max-w-sm">
            유저가 존재하지 않거나 삭제되었습니다.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}

function PublicProfileError({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background sticky top-0 z-10">
        <Link href="/" className="p-2 -ml-2 hover:bg-accent rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-semibold text-lg">Profile</h1>
        <div className="w-9" />
      </header>
      <div className="hidden md:block">
        <Header />
      </div>
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center">
          <div className="mb-4 text-4xl">&#9888;&#65039;</div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">
            프로필을 불러올 수 없습니다
          </h2>
          <p className="mb-6 text-sm text-muted-foreground max-w-sm">
            {error.message || "잠시 후 다시 시도해주세요."}
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

export function PublicProfileClient({ userId }: { userId: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActivityTab>("posts");

  // Fetch the target user's public data
  const {
    data: userData,
    isLoading,
    isError,
    error,
    refetch,
  } = useUser(userId);

  // Get logged-in user for self-redirect check
  const { data: me } = useMe();

  // Profile extras for StyleDNACard (no auth required; works for any userId)
  const { data: profileExtras } = useProfileExtras(userId);

  // Self-redirect: if the viewer is viewing their own profile, redirect to /profile
  useEffect(() => {
    if (me?.id && me.id === userId) {
      router.replace("/profile");
    }
  }, [me?.id, userId, router]);

  if (isLoading) return <PublicProfileSkeleton />;

  if (isError && (error as AxiosError)?.response?.status === 404) {
    return <UserNotFound />;
  }

  if (isError && error) {
    return <PublicProfileError error={error} onRetry={refetch} />;
  }

  if (!userData) return <PublicProfileSkeleton />;

  const formattedStats = [
    { label: "Points", value: userData.total_points },
    { label: "Rank", value: userData.rank },
  ];

  const shareProfile = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch (_) {
      // Clipboard API not available
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "posts":
        return <PostsGrid userId={userId} />;
      case "spots":
        return <SpotsList userId={userId} />;
      case "solutions":
        return <SolutionsList userId={userId} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background sticky top-0 z-10">
        <Link href="/" className="p-2 -ml-2 hover:bg-accent rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-semibold text-lg">
          {userData.display_name ?? userData.username}
        </h1>
        <button
          onClick={shareProfile}
          className="p-2 -mr-2 rounded-lg hover:bg-accent"
          aria-label="Share profile"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </header>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden px-4 py-4 space-y-4">
        <ProfileHeaderCard
          avatarUrl={userData.avatar_url ?? undefined}
          displayName={userData.display_name ?? userData.username}
          username={`@${userData.username}`}
          stats={formattedStats}
        />

        <ProfileBio bio={userData.bio ?? undefined} className="px-4" />

        <FollowStats
          followers={userData.followers_count}
          following={userData.following_count}
          className="px-4"
        />

        <StyleDNACard
          keywords={profileExtras?.style_dna?.keywords}
          colors={profileExtras?.style_dna?.colors}
          progress={profileExtras?.style_dna?.progress}
        />

        {/* Activity Tabs — posts/spots/solutions only */}
        <div className="mt-6">
          <ActivityTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabs={PUBLIC_TABS}
          />
          <ActivityContent activeTab={activeTab} className="pt-4">
            {renderTabContent()}
          </ActivityContent>
        </div>
      </div>

      {/* Desktop Layout — 2-column */}
      <div className="hidden md:block pt-16">
        <ProfileDesktopLayout
          profileSection={
            <>
              <ProfileHeaderCard
                avatarUrl={userData.avatar_url ?? undefined}
                displayName={userData.display_name ?? userData.username}
                username={`@${userData.username}`}
                stats={formattedStats}
              />

              <ProfileBio bio={userData.bio ?? undefined} />

              <FollowStats
                followers={userData.followers_count}
                following={userData.following_count}
              />

              <StyleDNACard
                keywords={profileExtras?.style_dna?.keywords}
                colors={profileExtras?.style_dna?.colors}
                progress={profileExtras?.style_dna?.progress}
              />
            </>
          }
          activitySection={
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <ActivityTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                tabs={PUBLIC_TABS}
              />
              <ActivityContent activeTab={activeTab} className="p-6">
                {renderTabContent()}
              </ActivityContent>
            </div>
          }
        />
      </div>
    </div>
  );
}
