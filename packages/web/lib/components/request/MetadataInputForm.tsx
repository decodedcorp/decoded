"use client";

import { memo } from "react";
import type {
  ContextType,
  MediaSourceType,
  StructuredFieldsState,
} from "@/lib/api/mutation-types";

const MEDIA_TYPES = [
  { value: "user_upload", label: "Direct upload" },
  { value: "youtube", label: "YouTube" },
  { value: "drama", label: "TV Drama" },
  { value: "movie", label: "Movie" },
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

const STRUCTURED_TYPES = new Set<MediaSourceType>([
  "drama",
  "movie",
  "music_video",
  "variety",
  "event",
]);

function titlePlaceholder(type: MediaSourceType): string {
  switch (type) {
    case "drama":
      return "e.g., The Glory";
    case "movie":
      return "e.g., Parasite (2019)";
    case "music_video":
      return "e.g., How You Like That";
    case "variety":
      return "e.g., Running Man";
    case "event":
      return "e.g., Met Gala";
    default:
      return "";
  }
}

function artistPlaceholder(type: MediaSourceType): string {
  return type === "music_video" ? "e.g., BLACKPINK" : "e.g., Jennie";
}

export interface MetadataFormValues {
  mediaType: MediaSourceType;
  mediaDescription: string;
  groupName: string;
  artistName: string;
  context: ContextType | null;
  /**
   * 구조화 필드 viewmodel. source type별 조건부 렌더링에 사용. (#305)
   * wire 직렬화는 submit 지점에서 `toMediaMetadataItems`로 변환.
   */
  structured: StructuredFieldsState;
}

interface MetadataInputFormProps {
  values: MetadataFormValues;
  onChange: (values: MetadataFormValues) => void;
}

const inputClass =
  "w-full px-3 py-2 text-sm bg-background border border-border rounded-lg " +
  "focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary " +
  "placeholder:text-muted-foreground/50";

/**
 * MetadataInputForm — 솔루션을 모르는 유저용 메타데이터 입력
 * #305 Phase A: source type별 구조화 필드 (Title/Platform/Year/Episode/Location)
 */
export const MetadataInputForm = memo(
  ({ values, onChange }: MetadataInputFormProps) => {
    const showDescription = !STRUCTURED_TYPES.has(values.mediaType);

    const handleStructuredChange =
      (key: keyof StructuredFieldsState) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({
          ...values,
          structured: { ...values.structured, [key]: e.target.value },
        });
      };

    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Photo info (optional)</h3>

        {/* Source type */}
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

        {/* Description (non-structured types only) */}
        {showDescription && (
          <label className="block space-y-1">
            <span className="text-xs text-muted-foreground">
              Where is this photo from?
            </span>
            <textarea
              value={values.mediaDescription}
              onChange={(e) =>
                onChange({ ...values, mediaDescription: e.target.value })
              }
              placeholder="e.g., Netflix drama XYZ, Season 2 Ep 3; airport fancam"
              rows={2}
              className={inputClass}
            />
          </label>
        )}

        {/* Structured fields (structured types only) */}
        {!showDescription && (
          <div className="space-y-3">
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Title</span>
              <input
                type="text"
                value={values.structured.title ?? ""}
                onChange={handleStructuredChange("title")}
                placeholder={titlePlaceholder(values.mediaType)}
                className={inputClass}
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(values.mediaType === "drama" ||
                values.mediaType === "movie") && (
                <>
                  <label className="block space-y-1">
                    <span className="text-xs text-muted-foreground">
                      Platform
                    </span>
                    <input
                      type="text"
                      value={values.structured.platform ?? ""}
                      onChange={handleStructuredChange("platform")}
                      placeholder="e.g., Netflix, Disney+"
                      className={inputClass}
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs text-muted-foreground">Year</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={values.structured.year ?? ""}
                      onChange={handleStructuredChange("year")}
                      placeholder="e.g., 2023"
                      className={inputClass}
                    />
                  </label>
                </>
              )}

              {values.mediaType === "music_video" && (
                <label className="block space-y-1">
                  <span className="text-xs text-muted-foreground">Year</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={values.structured.year ?? ""}
                    onChange={handleStructuredChange("year")}
                    placeholder="e.g., 2020"
                    className={inputClass}
                  />
                </label>
              )}

              {values.mediaType === "variety" && (
                <label className="block space-y-1">
                  <span className="text-xs text-muted-foreground">Episode</span>
                  <input
                    type="text"
                    value={values.structured.episode ?? ""}
                    onChange={handleStructuredChange("episode")}
                    placeholder="e.g., EP 42"
                    className={inputClass}
                  />
                </label>
              )}

              {values.mediaType === "event" && (
                <>
                  <label className="block space-y-1">
                    <span className="text-xs text-muted-foreground">Year</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={values.structured.year ?? ""}
                      onChange={handleStructuredChange("year")}
                      placeholder="e.g., 2024"
                      className={inputClass}
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs text-muted-foreground">
                      Location
                    </span>
                    <input
                      type="text"
                      value={values.structured.location ?? ""}
                      onChange={handleStructuredChange("location")}
                      placeholder="e.g., Paris Fashion Week"
                      className={inputClass}
                    />
                  </label>
                </>
              )}
            </div>
          </div>
        )}

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
            className={inputClass}
          />
        </div>

        {/* Artist name (nested for getByLabelText) */}
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">
            Artist / person name
          </span>
          <input
            type="text"
            value={values.artistName}
            onChange={(e) =>
              onChange({ ...values, artistName: e.target.value })
            }
            placeholder={artistPlaceholder(values.mediaType)}
            className={inputClass}
          />
        </label>

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
