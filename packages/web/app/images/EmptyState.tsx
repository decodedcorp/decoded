type Props = {
  message?: string;
};

/**
 * Empty state component for images feed
 *
 * Displays when no images are found.
 * Message is kept flexible to accommodate future filter functionality.
 */
export function EmptyState({ message }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center">
        <div className="text-4xl mb-4">📷</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {message || "No images found yet."}
        </h2>
        <p className="text-sm text-gray-600">
          Check back later or try adjusting your filters.
        </p>
      </div>
    </div>
  );
}
