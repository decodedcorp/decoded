"use client";

import { useSpots } from "@/lib/hooks/useSpots";

interface SpotTagSelectorProps {
  parentPostId: string;
  selectedSpotIds: string[];
  onSelectionChange: (spotIds: string[]) => void;
}

export function SpotTagSelector({
  parentPostId,
  selectedSpotIds,
  onSelectionChange,
}: SpotTagSelectorProps) {
  const { data: spots, isLoading } = useSpots(parentPostId);

  if (isLoading || !spots || spots.length === 0) {
    return null;
  }

  const toggleSpot = (spotId: string) => {
    if (selectedSpotIds.includes(spotId)) {
      onSelectionChange(selectedSpotIds.filter((id) => id !== spotId));
    } else {
      onSelectionChange([...selectedSpotIds, spotId]);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        I have these items (optional)
      </p>
      <div className="flex flex-wrap gap-2">
        {spots.map((spot) => {
          const isSelected = selectedSpotIds.includes(spot.id);
          const label =
            spot.category?.name?.en ||
            spot.category?.name?.ko ||
            spot.category?.code ||
            "Item";
          return (
            <button
              key={spot.id}
              type="button"
              onClick={() => toggleSpot(spot.id)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-accent"
              }`}
            >
              {label}
              {isSelected && " ✓"}
            </button>
          );
        })}
      </div>
    </div>
  );
}
