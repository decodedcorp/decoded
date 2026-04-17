"use client";

import { type MediaSource, type MediaSourceType } from "@/lib/api";

interface MediaSourceInputProps {
  value: MediaSource | null;
  onChange: (source: MediaSource | null) => void;
}

const MEDIA_TYPES: { value: MediaSourceType; label: string }[] = [
  { value: "drama", label: "Drama" },
  { value: "movie", label: "Movie" },
  { value: "music_video", label: "Music Video" },
  { value: "variety", label: "Variety" },
  { value: "other", label: "Other" },
];

const DEFAULT_TITLE_PLACEHOLDER = "e.g., The Glory, Squid Game";
const TITLE_PLACEHOLDERS: Partial<Record<MediaSourceType, string>> = {
  drama: DEFAULT_TITLE_PLACEHOLDER,
  movie: "e.g., Parasite, Past Lives",
  music_video: "e.g., BLACKPINK - How You Like That",
  variety: "e.g., Running Man, Knowing Bros",
  other: "e.g., brand campaign, magazine cover",
};

const PLATFORMS = [
  "Netflix",
  "Disney+",
  "Wavve",
  "Tving",
  "Watcha",
  "Apple TV+",
  "Amazon Prime",
  "YouTube",
  "Other",
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => currentYear - i);

export function MediaSourceInput({ value, onChange }: MediaSourceInputProps) {
  const handleTypeChange = (type: MediaSourceType) => {
    onChange({
      type,
      title: value?.title || "",
      platform: value?.platform,
      year: value?.year,
    });
  };

  const handleTitleChange = (title: string) => {
    if (!value?.type) {
      // type이 없으면 기본값 설정
      onChange({
        type: "drama",
        title,
        platform: undefined,
        year: undefined,
      });
    } else {
      onChange({
        ...value,
        title,
      });
    }
  };

  const handlePlatformChange = (platform: string) => {
    if (!value) return;
    onChange({
      ...value,
      platform: platform || undefined,
    });
  };

  const handleYearChange = (year: string) => {
    if (!value) return;
    onChange({
      ...value,
      year: year ? parseInt(year, 10) : undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">Media Source</h3>
        <span className="text-xs text-red-500">*Required</span>
      </div>

      {/* Type Selection */}
      <div className="space-y-2">
        <div className="space-y-0.5">
          <label className="block text-xs text-muted-foreground">Type *</label>
          <p className="text-[10px] text-muted-foreground/70">
            What kind of media is this image from?
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {MEDIA_TYPES.map(({ value: typeValue, label }) => (
            <button
              key={typeValue}
              type="button"
              onClick={() => handleTypeChange(typeValue)}
              className={`
                px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${
                  value?.type === typeValue
                    ? "bg-primary text-primary-foreground"
                    : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10"
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Title Input */}
      <div className="space-y-2">
        <label className="block text-xs text-muted-foreground">Title *</label>
        <input
          type="text"
          value={value?.title || ""}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder={
            (value?.type && TITLE_PLACEHOLDERS[value.type]) ??
            DEFAULT_TITLE_PLACEHOLDER
          }
          className="
            w-full px-3 py-2 rounded-lg border border-border
            bg-background text-foreground text-sm
            placeholder:text-muted-foreground
            focus:outline-none focus:ring-2 focus:ring-primary/50
          "
        />
      </div>

      {/* Platform & Year (Optional) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="block text-xs text-muted-foreground">
            Platform
          </label>
          <select
            value={value?.platform || ""}
            onChange={(e) => handlePlatformChange(e.target.value)}
            className="
              w-full px-3 py-2 rounded-lg border border-border
              bg-background text-foreground text-sm
              focus:outline-none focus:ring-2 focus:ring-primary/50
            "
          >
            <option value="">Select platform</option>
            {PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-xs text-muted-foreground">Year</label>
          <select
            value={value?.year || ""}
            onChange={(e) => handleYearChange(e.target.value)}
            className="
              w-full px-3 py-2 rounded-lg border border-border
              bg-background text-foreground text-sm
              focus:outline-none focus:ring-2 focus:ring-primary/50
            "
          >
            <option value="">Select year</option>
            {YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
