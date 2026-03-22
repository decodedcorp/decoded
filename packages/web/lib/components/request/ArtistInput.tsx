"use client";

import { Sparkles } from "lucide-react";

interface ArtistInputProps {
  artistName: string;
  groupName: string;
  aiRecommendedArtist?: string;
  onArtistNameChange: (name: string) => void;
  onGroupNameChange: (name: string) => void;
}

export function ArtistInput({
  artistName,
  groupName,
  aiRecommendedArtist,
  onArtistNameChange,
  onGroupNameChange,
}: ArtistInputProps) {
  const hasAiRecommendation =
    aiRecommendedArtist && aiRecommendedArtist.length > 0;
  const isUsingAiRecommendation =
    hasAiRecommendation && artistName === aiRecommendedArtist;

  const handleApplyAiRecommendation = () => {
    if (aiRecommendedArtist) {
      onArtistNameChange(aiRecommendedArtist);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">Artist</h3>
        <span className="text-xs text-muted-foreground">(Optional)</span>
      </div>

      {/* Artist Name Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs text-muted-foreground">Name</label>
          {hasAiRecommendation && !isUsingAiRecommendation && (
            <button
              type="button"
              onClick={handleApplyAiRecommendation}
              className="
                flex items-center gap-1 px-2 py-0.5 rounded-full
                bg-primary/10 text-primary text-xs font-medium
                hover:bg-primary/20 transition-colors
              "
            >
              <Sparkles className="w-3 h-3" />
              <span>Use AI suggestion: {aiRecommendedArtist}</span>
            </button>
          )}
        </div>
        <div className="relative">
          <input
            type="text"
            value={artistName}
            onChange={(e) => onArtistNameChange(e.target.value)}
            placeholder="e.g., Song Hye-kyo"
            className="
              w-full px-3 py-2 rounded-lg border border-border
              bg-background text-foreground text-sm
              placeholder:text-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-primary/50
            "
          />
          {isUsingAiRecommendation && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <span className="flex items-center gap-1 text-xs text-primary">
                <Sparkles className="w-3 h-3" />
                AI
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Group Name Input */}
      <div className="space-y-2">
        <label className="block text-xs text-muted-foreground">
          Group / Agency
        </label>
        <input
          type="text"
          value={groupName}
          onChange={(e) => onGroupNameChange(e.target.value)}
          placeholder="e.g., BLACKPINK, YG Entertainment"
          className="
            w-full px-3 py-2 rounded-lg border border-border
            bg-background text-foreground text-sm
            placeholder:text-muted-foreground
            focus:outline-none focus:ring-2 focus:ring-primary/50
          "
        />
      </div>
    </div>
  );
}
