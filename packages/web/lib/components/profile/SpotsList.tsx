"use client";

import { MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { fetchSpotsByUser } from "@/lib/supabase/queries/profile";

interface SpotItem {
  id: string;
  imageUrl: string;
  label: string;
  category: string;
  createdAt: string;
}

export interface SpotsListProps {
  userId?: string;
  spots?: SpotItem[];
  className?: string;
}

export function SpotsList({ userId, spots, className }: SpotsListProps) {
  const { data: fetchedSpots, isLoading } = useQuery({
    queryKey: ["profile", "spots", userId],
    queryFn: () => fetchSpotsByUser(userId!),
    enabled: !!userId && !spots,
    select: (rows) =>
      rows.map((row) => ({
        id: row.id,
        imageUrl: row.post?.image_url || "",
        label: row.subcategory_id || "Spot",
        category: row.status,
        createdAt: row.created_at,
      })),
  });

  const displaySpots = spots ?? fetchedSpots;

  if (isLoading && !displaySpots) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!displaySpots || displaySpots.length === 0) {
    return (
      <div className="py-12 text-center">
        <MapPin className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">No spots created yet</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {displaySpots.map((spot) => (
        <div
          key={spot.id}
          className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:bg-accent/50 transition-colors cursor-pointer"
        >
          <div className="h-12 w-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
            <img
              src={spot.imageUrl}
              alt={spot.label}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{spot.label}</p>
            <p className="text-xs text-muted-foreground">{spot.category}</p>
          </div>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {new Date(spot.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      ))}
    </div>
  );
}
