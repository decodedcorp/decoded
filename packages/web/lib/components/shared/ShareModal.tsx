"use client";

import { useState } from "react";
import { X, Copy, Check } from "lucide-react";
import {
  RiKakaoTalkFill,
  RiTwitterXFill,
  RiFacebookFill,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  url?: string;
  title?: string;
  className?: string;
}

const SHARE_OPTIONS = [
  {
    id: "kakao",
    label: "KakaoTalk",
    icon: RiKakaoTalkFill,
    color: "bg-[#FEE500] text-[#391B1B]",
  },
  {
    id: "twitter",
    label: "X (Twitter)",
    icon: RiTwitterXFill,
    color: "bg-foreground text-background",
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: RiFacebookFill,
    color: "bg-[#1877F2] text-white",
  },
] as const;

export function ShareModal({
  open,
  onClose,
  url,
  title = "",
  className,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const shareUrl =
    url || (typeof window !== "undefined" ? window.location.href : "");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(title);

    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    };

    if (platform === "kakao") {
      toast.info("KakaoTalk share requires SDK integration");
      return;
    }

    if (urls[platform]) {
      window.open(urls[platform], "_blank", "width=600,height=400");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div
        className={cn(
          "relative w-full sm:max-w-sm bg-card rounded-t-2xl sm:rounded-2xl p-6 space-y-5",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Share</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-accent transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Social buttons */}
        <div className="flex justify-center gap-4">
          {SHARE_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => handleShare(option.id)}
              className="flex flex-col items-center gap-2"
            >
              <div
                className={cn(
                  "flex items-center justify-center h-12 w-12 rounded-full transition-opacity hover:opacity-80",
                  option.color
                )}
              >
                <option.icon className="h-5 w-5" />
              </div>
              <span className="text-xs text-muted-foreground">
                {option.label}
              </span>
            </button>
          ))}
        </div>

        {/* Copy link */}
        <div className="flex items-center gap-2 rounded-lg bg-muted p-2">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="flex-1 bg-transparent text-sm text-foreground truncate px-2 focus:outline-none"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
