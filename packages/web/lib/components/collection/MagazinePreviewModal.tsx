"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { MagazineIssue } from "./types";

interface MagazinePreviewModalProps {
  issues: MagazineIssue[];
  initialIndex: number;
  onClose: () => void;
}

export function MagazinePreviewModal({
  issues,
  initialIndex,
  onClose,
}: MagazinePreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const issue = issues[currentIndex];

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < issues.length - 1;

  const goPrev = useCallback(() => {
    if (hasPrev) setCurrentIndex((i) => i - 1);
  }, [hasPrev]);

  const goNext = useCallback(() => {
    if (hasNext) setCurrentIndex((i) => i + 1);
  }, [hasNext]);

  // Keyboard: Escape, Left, Right
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goPrev, goNext]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!issue) return null;

  const volumeLabel = `Vol.${String(issue.issue_number).padStart(2, "0")}`;
  const components = issue.layout_json?.components ?? [];
  const heroData = components.find((c) => c.type === "hero-image")?.data as
    | { image_url?: string; headline?: string }
    | undefined;
  const bodyText =
    (components.find((c) => c.type === "text-block")?.data
      ?.content as string) || "";
  const items = components
    .filter((c) => c.type === "item-card")
    .map(
      (c) =>
        c.data as unknown as {
          item_id: string;
          image_url: string;
          brand: string;
          name: string;
          price: string;
        }
    );
  const galleryImages =
    (components.find((c) => c.type === "grid-gallery")?.data
      ?.images as string[]) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      {/* Navigation arrows */}
      {hasPrev && (
        <button
          onClick={goPrev}
          className="absolute left-3 md:left-6 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ChevronLeft size={24} className="text-white" />
        </button>
      )}
      {hasNext && (
        <button
          onClick={goNext}
          className="absolute right-3 md:right-6 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ChevronRight size={24} className="text-white" />
        </button>
      )}

      {/* Magazine card */}
      <div
        key={issue.id}
        className="relative z-10 w-full max-w-md max-h-[88vh] mx-12 overflow-y-auto rounded-2xl border border-white/10 animate-in fade-in duration-200"
        style={{ backgroundColor: issue.theme_palette?.bg || "#0a0a0a" }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="sticky top-3 float-right mr-3 z-20 p-1.5 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
        >
          <X size={16} className="text-white" />
        </button>

        {/* Cover */}
        <div className="relative w-full aspect-[3/4]">
          {issue.cover_image_url ? (
            <Image
              src={issue.cover_image_url}
              alt={issue.title}
              fill
              className="object-cover"
              sizes="(max-width: 448px) 100vw, 448px"
              priority
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ color: (issue.theme_palette?.text || "#fff") + "33" }}
            >
              No Cover
            </div>
          )}
          <div
            className="absolute inset-0 bg-gradient-to-t from-current via-transparent to-transparent"
            style={{ color: issue.theme_palette?.bg || "#0a0a0a" }}
          />
          <div className="absolute bottom-4 left-5 right-5">
            <span
              className="text-xs font-bold tracking-[0.15em] uppercase"
              style={{ color: issue.theme_palette?.accent || "#eafd67" }}
            >
              {volumeLabel}
            </span>
            <h2
              className="text-2xl font-bold mt-1 leading-tight"
              style={{ color: issue.theme_palette?.text || "#fff" }}
            >
              {issue.title}
            </h2>
            {issue.subtitle && (
              <p
                className="text-sm mt-1 opacity-60"
                style={{ color: issue.theme_palette?.text || "#fff" }}
              >
                {issue.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Hero image (editorial spread) */}
          {heroData?.image_url && (
            <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden">
              <Image
                src={heroData.image_url}
                alt={heroData.headline || ""}
                fill
                className="object-cover"
                sizes="400px"
              />
            </div>
          )}

          {/* Body text */}
          {bodyText && (
            <p
              className="text-sm leading-relaxed opacity-60"
              style={{ color: issue.theme_palette?.text || "#fff" }}
            >
              {bodyText}
            </p>
          )}

          {/* Gallery */}
          {galleryImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {galleryImages.slice(0, 6).map((url, i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-lg overflow-hidden bg-white/5"
                >
                  <Image
                    src={url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Items */}
          {items.length > 0 && (
            <div>
              <p
                className="text-xs uppercase tracking-wider mb-2 opacity-40"
                style={{ color: issue.theme_palette?.text || "#fff" }}
              >
                Featured Items
              </p>
              <div className="grid grid-cols-2 gap-2">
                {items.slice(0, 4).map((item) => (
                  <div
                    key={item.item_id}
                    className="flex gap-2 p-2 rounded-lg bg-white/5"
                  >
                    <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-white/10">
                      {item.image_url && (
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        className="text-[9px] uppercase opacity-40"
                        style={{ color: issue.theme_palette?.text || "#fff" }}
                      >
                        {item.brand}
                      </p>
                      <p
                        className="text-xs truncate"
                        style={{ color: issue.theme_palette?.text || "#fff" }}
                      >
                        {item.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Keywords */}
          {issue.theme_keywords && issue.theme_keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {issue.theme_keywords.map((kw) => (
                <span
                  key={kw}
                  className="px-2 py-0.5 text-[10px] rounded-full border"
                  style={{
                    backgroundColor:
                      (issue.theme_palette?.accent || "#eafd67") + "1a",
                    color: (issue.theme_palette?.accent || "#eafd67") + "cc",
                    borderColor:
                      (issue.theme_palette?.accent || "#eafd67") + "33",
                  }}
                >
                  {kw}
                </span>
              ))}
            </div>
          )}

          {/* Page indicator */}
          <div className="flex items-center justify-center gap-1.5 pt-2 pb-1">
            {issues.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === currentIndex ? 20 : 6,
                  height: 6,
                  backgroundColor:
                    i === currentIndex
                      ? issue.theme_palette?.accent || "#eafd67"
                      : (issue.theme_palette?.text || "#fff") + "33",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
