"use client";

import { useState, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { extractPostMetadata } from "@/lib/api";
import {
  useRequestStore,
  selectDescription,
  selectExtractedMetadata,
  selectIsExtractingMetadata,
  selectMediaSource,
} from "@/lib/stores/requestStore";

const MAX_DESCRIPTION_LENGTH = 500;
const MIN_DESCRIPTION_LENGTH = 10;
const DEBOUNCE_DELAY = 500;

export function DescriptionInput() {
  const description = useRequestStore(selectDescription);
  const extractedMetadata = useRequestStore(selectExtractedMetadata);
  const isExtracting = useRequestStore(selectIsExtractingMetadata);
  const mediaSource = useRequestStore(selectMediaSource);

  const setDescription = useRequestStore((s) => s.setDescription);
  const setExtractedMetadata = useRequestStore((s) => s.setExtractedMetadata);
  const setIsExtractingMetadata = useRequestStore(
    (s) => s.setIsExtractingMetadata
  );
  const setMediaSource = useRequestStore((s) => s.setMediaSource);

  const [localValue, setLocalValue] = useState(description);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  // Handle metadata extraction
  const handleExtract = useCallback(
    async (text: string) => {
      if (text.length < MIN_DESCRIPTION_LENGTH) {
        return;
      }

      setIsExtractingMetadata(true);

      try {
        const response = await extractPostMetadata(text);

        // Update store with extracted metadata
        setExtractedMetadata(response.media_metadata);

        // Auto-fill media source title if extracted and not already set
        if (response.title && !mediaSource?.title) {
          setMediaSource({
            type: mediaSource?.type || "drama",
            title: response.title,
            platform: mediaSource?.platform,
            year: mediaSource?.year,
          });
        }

        if (response.media_metadata.length > 0) {
          toast.success("Metadata extracted successfully");
        }
      } catch (error) {
        console.error("Failed to extract metadata:", error);
        // Don't show error toast to user - extraction is optional
      } finally {
        setIsExtractingMetadata(false);
      }
    },
    [mediaSource, setExtractedMetadata, setIsExtractingMetadata, setMediaSource]
  );

  // Handle input change with debouncing
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;

    if (newValue.length > MAX_DESCRIPTION_LENGTH) {
      return;
    }

    setLocalValue(newValue);

    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer for debounced update
    const timer = setTimeout(() => {
      setDescription(newValue);
      if (newValue.length >= MIN_DESCRIPTION_LENGTH) {
        handleExtract(newValue);
      }
    }, DEBOUNCE_DELAY);

    setDebounceTimer(timer);
  };

  // Handle blur event
  const handleBlur = () => {
    // Clear debounce timer and update immediately
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      setDebounceTimer(null);
    }

    if (localValue !== description) {
      setDescription(localValue);
      if (localValue.length >= MIN_DESCRIPTION_LENGTH) {
        handleExtract(localValue);
      }
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">Description</h3>
        <span className="px-2 py-0.5 text-xs bg-foreground/5 text-muted-foreground rounded">
          Optional
        </span>
        {isExtracting && (
          <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
        )}
      </div>

      <div className="space-y-2">
        <textarea
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="e.g., Outfit from Netflix drama XYZ, Season 2 Episode 3 café scene..."
          className="w-full px-3 py-2 min-h-[100px] text-sm bg-background border border-border rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                     placeholder:text-muted-foreground/50 resize-none"
          disabled={isExtracting}
        />

        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>
            {localValue.length >= MIN_DESCRIPTION_LENGTH
              ? "AI will auto-fill title, year, and platform"
              : `Enter at least ${MIN_DESCRIPTION_LENGTH} characters to trigger AI extraction`}
          </span>
          <span>
            {localValue.length}/{MAX_DESCRIPTION_LENGTH}
          </span>
        </div>
      </div>

      {/* Extracted Metadata Display */}
      {extractedMetadata.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Extracted metadata:</p>
          <div className="flex flex-wrap gap-2">
            {extractedMetadata.map((item, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs"
              >
                <span className="font-medium">{item.key}:</span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
