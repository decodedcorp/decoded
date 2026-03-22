"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  useAuthStore,
  selectNeedsOnboarding,
  selectProfile,
  selectUser,
} from "@/lib/stores/authStore";

/**
 * Validate username: 3-20 chars, alphanumeric + underscore only
 */
function validateUsername(value: string): string | null {
  if (value.length < 3) return "Username must be at least 3 characters";
  if (value.length > 20) return "Username must be 20 characters or less";
  if (!/^[a-zA-Z0-9_]+$/.test(value))
    return "Only letters, numbers, and underscores allowed";
  return null;
}

export default function OnboardingSheet() {
  const needsOnboarding = useAuthStore(selectNeedsOnboarding);
  const profile = useAuthStore(selectProfile);
  const user = useAuthStore(selectUser);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Pre-fill from profile when it loads
  useEffect(() => {
    if (profile) {
      setUsername(profile.username ?? "");
      setDisplayName(profile.display_name ?? "");
      setBio(profile.bio ?? "");
    }
  }, [profile]);

  const handleUsernameChange = useCallback((value: string) => {
    setUsername(value);
    setUsernameError(validateUsername(value));
  }, []);

  const handleComplete = useCallback(async () => {
    const validationError = validateUsername(username);
    if (validationError) {
      setUsernameError(validationError);
      return;
    }

    setIsSubmitting(true);
    setUsernameError(null);

    const success = await updateProfile({
      username,
      display_name: displayName || username,
      bio: bio || null,
    });

    if (success) {
      completeOnboarding();
    } else {
      setUsernameError("Username already taken. Try another one.");
    }

    setIsSubmitting(false);
  }, [username, displayName, bio, updateProfile, completeOnboarding]);

  const handleSkip = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  // Avatar: use OAuth avatar or first letter fallback
  const avatarUrl = user?.avatarUrl;
  const initial = (displayName || username || "U").charAt(0).toUpperCase();

  if (!needsOnboarding) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-[#242424] rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center gap-6">
          {/* Avatar preview */}
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-[#3D3D3D] flex items-center justify-center shrink-0">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Profile"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <span className="text-2xl font-bold text-white">{initial}</span>
            )}
          </div>

          <div className="text-center">
            <h2 className="text-xl font-semibold text-white mb-1">
              Welcome to Decoded
            </h2>
            <p className="text-sm text-gray-400">Set up your profile</p>
          </div>

          {/* Username input */}
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="your_username"
              maxLength={20}
              className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#3D3D3D] rounded-lg text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-white/40 transition-colors"
            />
            {usernameError && (
              <p className="mt-1 text-xs text-red-400">{usernameError}</p>
            )}
          </div>

          {/* Display Name input */}
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How should we call you?"
              maxLength={50}
              className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#3D3D3D] rounded-lg text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-white/40 transition-colors"
            />
          </div>

          {/* Bio textarea */}
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              maxLength={160}
              rows={3}
              className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#3D3D3D] rounded-lg text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-white/40 transition-colors resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">{bio.length}/160</p>
          </div>

          {/* Action buttons */}
          <div className="w-full flex gap-3 mt-2">
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-300 transition-colors"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={handleComplete}
              disabled={isSubmitting || !!usernameError}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Saving..." : "Complete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
