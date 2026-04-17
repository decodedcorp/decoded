"use client";

import { memo } from "react";
import type { ContextType, MediaSourceType } from "@/lib/api/mutation-types";

const MEDIA_TYPES = [
  { value: "user_upload", label: "Direct upload" },
  { value: "youtube", label: "YouTube" },
  { value: "drama", label: "TV Drama" },
  { value: "music_video", label: "Music Video" },
  { value: "variety", label: "Variety Show" },
  { value: "event", label: "Event" },
  { value: "other", label: "Other" },
] as const;

const CONTEXT_OPTIONS: { value: ContextType; label: string }[] = [
  { value: "airport", label: "Airport" },
  { value: "stage", label: "Stage" },
  { value: "drama", label: "TV Drama" },
  { value: "variety", label: "Variety Show" },
  { value: "daily", label: "Daily" },
  { value: "photoshoot", label: "Editorial" },
  { value: "event", label: "Event" },
  { value: "other", label: "Other" },
];

// Helper text + dynamic placeholders ported verbatim from PR #230
// (ArtistInput.tsx, MediaSourceInput.tsx).
const MEDIA_TYPE_HELPER = "What kind of media is this image from?";
const ARTIST_HELPER = "Actor, singer, model, or public figure in the image";
const GROUP_HELPER =
  "Group (e.g., BLACKPINK) or agency (e.g., YG Entertainment)";

const DEFAULT_MEDIA_PLACEHOLDER =
  "e.g., Netflix drama XYZ, Season 2 Ep 3; airport fancam";
const MEDIA_PLACEHOLDERS: Partial<Record<MediaSourceType, string>> = {
  drama: "e.g., The Glory, Squid Game",
  music_video: "e.g., BLACKPINK - How You Like That",
  variety: "e.g., Running Man, Knowing Bros",
  event: "e.g., 2024 Met Gala, Coachella",
  other: "e.g., brand campaign, magazine cover",
};

export interface MetadataFormValues {
  mediaType: MediaSourceType;
  mediaDescription: string;
  groupName: string;
  artistName: string;
  context: ContextType | null;
}

interface MetadataInputFormProps {
  values: MetadataFormValues;
  onChange: (values: MetadataFormValues) => void;
}

/**
 * MetadataInputForm - 솔루션을 모르는 유저용 메타데이터 입력
 * media_source, group_name, artist_name, context
 *
 * Helper text + dynamic media-type placeholders are sourced from PR #230,
 * which originally targeted ArtistInput / MediaSourceInput in the deprecated
 * Details step. PR #145 PR-4 ports those strings here so they ship with the
 * unified upload flow.
 */
export const MetadataInputForm = memo(
  ({ values, onChange }: MetadataInputFormProps) => {
    const descriptionPlaceholder =
      MEDIA_PLACEHOLDERS[values.mediaType] ?? DEFAULT_MEDIA_PLACEHOLDER;

    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Photo info (optional)</h3>

        {/* Source */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Source type</label>
          <p className="text-[10px] text-muted-foreground/70">
            {MEDIA_TYPE_HELPER}
          </p>
          <select
            value={values.mediaType}
            onChange={(e) =>
              onChange({
                ...values,
                mediaType: e.target.value as MediaSourceType,
              })
            }
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg
                       focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          >
            {MEDIA_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Media description — placeholder adapts to selected media type */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">
            Where or what is this photo from?
          </label>
          <input
            type="text"
            value={values.mediaDescription}
            onChange={(e) =>
              onChange({ ...values, mediaDescription: e.target.value })
            }
            placeholder={descriptionPlaceholder}
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg
                       focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary
                       placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Group name */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">
            Group / team name
          </label>
          <p className="text-[10px] text-muted-foreground/70">{GROUP_HELPER}</p>
          <input
            type="text"
            value={values.groupName}
            onChange={(e) => onChange({ ...values, groupName: e.target.value })}
            placeholder="e.g., BLACKPINK"
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg
                       focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary
                       placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Artist name */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">
            Artist / person name
          </label>
          <p className="text-[10px] text-muted-foreground/70">
            {ARTIST_HELPER}
          </p>
          <input
            type="text"
            value={values.artistName}
            onChange={(e) =>
              onChange({ ...values, artistName: e.target.value })
            }
            placeholder="e.g., Jennie"
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg
                       focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary
                       placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Context */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Context</label>
          <select
            value={values.context ?? ""}
            onChange={(e) =>
              onChange({
                ...values,
                context: (e.target.value || null) as ContextType | null,
              })
            }
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg
                       focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          >
            <option value="">Not specified</option>
            {CONTEXT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }
);

MetadataInputForm.displayName = "MetadataInputForm";
