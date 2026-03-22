"use client";

import Image from "next/image";
import { MapPin, Film, User, Hash } from "lucide-react";
import {
  useRequestStore,
  selectImages,
  selectDetectedSpots,
  selectMediaSource,
  selectArtistName,
  selectGroupName,
  selectContext,
} from "@/lib/stores/requestStore";

const CONTEXT_LABELS: Record<string, string> = {
  airport: "Airport",
  stage: "Stage",
  drama: "Drama",
  variety: "Variety",
  daily: "Daily",
  photoshoot: "Photoshoot",
  event: "Event",
  other: "Other",
};

const MEDIA_TYPE_LABELS: Record<string, string> = {
  drama: "Drama",
  movie: "Movie",
  music_video: "Music Video",
  variety: "Variety",
  other: "Other",
};

export function SubmitPreview() {
  const images = useRequestStore(selectImages);
  const detectedSpots = useRequestStore(selectDetectedSpots);
  const mediaSource = useRequestStore(selectMediaSource);
  const artistName = useRequestStore(selectArtistName);
  const groupName = useRequestStore(selectGroupName);
  const context = useRequestStore(selectContext);

  const uploadedImage = images.find((img) => img.status === "uploaded");

  return (
    <div className="space-y-4">
      {/* Image Preview with Spots Count */}
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-foreground/5">
        {uploadedImage && (
          <Image
            src={uploadedImage.previewUrl}
            alt="Preview"
            fill
            className="object-cover"
          />
        )}
        {/* Spots badge */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-white">
            {detectedSpots.length} items detected
          </span>
        </div>
      </div>

      {/* Details Summary */}
      <div className="space-y-3">
        {/* Media Source */}
        {mediaSource && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-foreground/[0.02] border border-border">
            <Film className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {mediaSource.title}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{MEDIA_TYPE_LABELS[mediaSource.type]}</span>
                {mediaSource.platform && (
                  <>
                    <span>·</span>
                    <span>{mediaSource.platform}</span>
                  </>
                )}
                {mediaSource.year && (
                  <>
                    <span>·</span>
                    <span>{mediaSource.year}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Artist Info */}
        {(artistName || groupName) && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-foreground/[0.02] border border-border">
            <User className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div className="flex-1 min-w-0">
              {artistName && (
                <p className="text-sm font-medium text-foreground">
                  {artistName}
                </p>
              )}
              {groupName && (
                <p className="text-xs text-muted-foreground">{groupName}</p>
              )}
            </div>
          </div>
        )}

        {/* Context */}
        {context && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-foreground/[0.02] border border-border">
            <Hash className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">
              {CONTEXT_LABELS[context]}
            </span>
          </div>
        )}
      </div>

      {/* Detected Items Summary */}
      <div className="pt-2">
        <h4 className="text-xs font-medium text-muted-foreground mb-2">
          Detected Items ({detectedSpots.length})
        </h4>
        <div className="flex flex-wrap gap-2">
          {detectedSpots.map((spot) => (
            <span
              key={spot.id}
              className="px-2.5 py-1 rounded-full bg-foreground/5 text-xs font-medium text-foreground/70"
            >
              {spot.label || spot.title}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
