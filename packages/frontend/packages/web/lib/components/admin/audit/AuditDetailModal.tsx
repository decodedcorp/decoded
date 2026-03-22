"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { Hotspot, brandToColor } from "@/lib/design-system";
import { useAuditDetail } from "@/lib/hooks/admin/useAudit";
import { ItemEditor } from "./ItemEditor";
import type { AuditItem, AuditStatus } from "@/lib/api/admin/audit";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditDetailModalProps {
  requestId: string;
  onClose: () => void;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<AuditStatus | "modified-local", string> = {
  pending:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  completed:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  modified: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "modified-local":
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

function StatusBadge({ status }: { status: AuditStatus | "modified-local" }) {
  const label = status === "modified-local" ? "Modified" : status;
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[status]}`}
    >
      {label}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Detail modal for reviewing a single AI audit request.
 *
 * Left panel: image with numbered Hotspot overlays.
 * Right panel: ItemEditor for inline item editing.
 *
 * Bidirectional sync:
 * - Clicking a hotspot highlights the corresponding item row
 * - Hovering an item row highlights the corresponding hotspot
 *
 * Any edit (add, delete, field change) sets isModified = true,
 * changing the displayed status badge to "Modified" (client-side only).
 *
 * ESC key and backdrop click both close the modal.
 */
export function AuditDetailModal({
  requestId,
  onClose,
}: AuditDetailModalProps) {
  const { data, isLoading, isError, refetch } = useAuditDetail(requestId);

  // Local items state — initialized from API data on first load
  const [localItems, setLocalItems] = useState<AuditItem[] | null>(null);
  const [isModified, setIsModified] = useState(false);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(
    null
  );

  // Initialize local items when data arrives
  useEffect(() => {
    if (data?.data.items && localItems === null) {
      setLocalItems(data.data.items);
    }
  }, [data, localItems]);

  // ESC key closes modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleItemsChange = useCallback((items: AuditItem[]) => {
    setLocalItems(items);
    setIsModified(true);
  }, []);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  // ─── Derived state ────────────────────────────────────────────────────────

  const request = data?.data;
  const displayStatus: AuditStatus | "modified-local" = isModified
    ? "modified-local"
    : (request?.status ?? "pending");

  const items = localItems ?? request?.items ?? [];

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
      aria-label="Audit detail"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {requestId}
            </h2>
            <StatusBadge status={displayStatus} />
            {isModified && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                (unsaved)
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal body */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0">
          {/* ─── Loading state ─────────────────────────────────────────────── */}
          {isLoading && (
            <div className="flex-1 flex items-center justify-center py-16">
              <div className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700 border-t-blue-500 animate-spin" />
            </div>
          )}

          {/* ─── Error state ───────────────────────────────────────────────── */}
          {isError && (
            <div className="flex-1 flex flex-col items-center justify-center py-16 gap-4">
              <p className="text-sm text-red-500 dark:text-red-400">
                Failed to load audit details.
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="px-4 py-2 text-sm bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:opacity-90 transition-opacity"
              >
                Retry
              </button>
            </div>
          )}

          {/* ─── Loaded state ──────────────────────────────────────────────── */}
          {request && (
            <>
              {/* Left panel: image + hotspots */}
              <div className="md:w-1/2 flex-shrink-0 p-4 flex items-center justify-center bg-gray-50 dark:bg-gray-950 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800">
                <div
                  className="relative w-full"
                  style={{
                    aspectRatio: `${request.imageWidth} / ${request.imageHeight}`,
                    maxHeight: "calc(90vh - 160px)",
                  }}
                >
                  <Image
                    src={request.imageUrl}
                    alt={`Audit ${requestId}`}
                    fill
                    className="object-contain rounded-lg"
                    sizes="(max-width: 768px) 90vw, 45vw"
                  />

                  {/* Hotspot overlays */}
                  {items.map((item, idx) => (
                    <Hotspot
                      key={item.id}
                      variant="numbered"
                      number={idx + 1}
                      position={item.position}
                      color={brandToColor(item.brand || "default")}
                      selected={item.id === highlightedItemId}
                      glow={true}
                      onClick={() =>
                        setHighlightedItemId(
                          item.id === highlightedItemId ? null : item.id
                        )
                      }
                      label={`Item ${idx + 1}: ${item.name}`}
                    />
                  ))}
                </div>
              </div>

              {/* Right panel: item editor */}
              <div className="md:w-1/2 flex flex-col min-h-0">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Detected Items{" "}
                    <span className="text-gray-400 dark:text-gray-500 font-normal">
                      ({items.length})
                    </span>
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto py-2">
                  <ItemEditor
                    items={items}
                    onItemsChange={handleItemsChange}
                    onItemHover={setHighlightedItemId}
                    highlightedItemId={highlightedItemId}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
