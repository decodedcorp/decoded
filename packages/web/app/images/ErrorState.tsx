"use client";

type Props = {
  error: Error | null;
  onRetry?: () => void;
};

/**
 * Error state component for images feed
 *
 * Displays user-friendly error message with retry functionality.
 * Logs error to console in development mode.
 */
export function ErrorState({ error, onRetry }: Props) {
  // Log error in development mode
  if (process.env.NODE_ENV === "development" && error) {
    console.error("Failed to load images:", error);
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Failed to load images
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {error?.message || "Something went wrong while loading images."}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
