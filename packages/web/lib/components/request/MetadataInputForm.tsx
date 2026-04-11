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
 */
export const MetadataInputForm = memo(
  ({ values, onChange }: MetadataInputFormProps) => {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Photo info (optional)</h3>

        {/* Source */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Source type</label>
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

        {/* Media description */}
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
            placeholder="e.g., Netflix drama XYZ, Season 2 Ep 3; airport fancam"
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
