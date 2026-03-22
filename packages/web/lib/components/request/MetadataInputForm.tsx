"use client";

import { memo } from "react";
import type { ContextType, MediaSourceType } from "@/lib/api/types";

const MEDIA_TYPES = [
  { value: "user_upload", label: "직접 촬영" },
  { value: "youtube", label: "유튜브" },
  { value: "drama", label: "드라마" },
  { value: "music_video", label: "뮤직비디오" },
  { value: "variety", label: "예능" },
  { value: "event", label: "이벤트" },
  { value: "other", label: "기타" },
] as const;

const CONTEXT_OPTIONS: { value: ContextType; label: string }[] = [
  { value: "airport", label: "공항" },
  { value: "stage", label: "무대" },
  { value: "drama", label: "드라마" },
  { value: "variety", label: "예능" },
  { value: "daily", label: "일상" },
  { value: "photoshoot", label: "화보" },
  { value: "event", label: "이벤트" },
  { value: "other", label: "기타" },
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
        <h3 className="text-sm font-medium">사진 정보 (선택)</h3>

        {/* 미디어 유형 */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">출처 유형</label>
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

        {/* 미디어 설명 */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">
            어디서/무엇에 관한 사진인가요?
          </label>
          <input
            type="text"
            value={values.mediaDescription}
            onChange={(e) =>
              onChange({ ...values, mediaDescription: e.target.value })
            }
            placeholder="예: 넷플릭스 드라마 ㅇㅇㅇ 시즌2 3화, 공항 직캠"
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg
                       focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary
                       placeholder:text-muted-foreground/50"
          />
        </div>

        {/* 그룹명 */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">그룹/팀명</label>
          <input
            type="text"
            value={values.groupName}
            onChange={(e) => onChange({ ...values, groupName: e.target.value })}
            placeholder="예: BLACKPINK"
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg
                       focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary
                       placeholder:text-muted-foreground/50"
          />
        </div>

        {/* 아티스트명 */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">
            아티스트/인물명
          </label>
          <input
            type="text"
            value={values.artistName}
            onChange={(e) =>
              onChange({ ...values, artistName: e.target.value })
            }
            placeholder="예: Jennie"
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg
                       focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary
                       placeholder:text-muted-foreground/50"
          />
        </div>

        {/* 상황 */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">상황</label>
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
            <option value="">선택 안 함</option>
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
