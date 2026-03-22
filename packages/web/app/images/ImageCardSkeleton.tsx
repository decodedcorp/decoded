/**
 * Skeleton component for ImageCard
 *
 * Used during loading state to show placeholder cards.
 * Matches the layout structure of ImageCard for consistent UX.
 */
export function ImageCardSkeleton() {
  return (
    <article className="border border-gray-200 rounded-xl overflow-hidden relative animate-pulse">
      {/* Image thumbnail skeleton */}
      <div className="aspect-square bg-gray-200" />

      {/* Status badge skeleton */}
      <div className="absolute bottom-2 right-2">
        <div className="h-5 w-16 bg-gray-300 rounded" />
      </div>

      {/* Bottom info skeleton */}
      <div className="p-2">
        <div className="h-3 w-20 bg-gray-300 rounded" />
      </div>
    </article>
  );
}
