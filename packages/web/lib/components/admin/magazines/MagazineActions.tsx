"use client";

import type { MagazineStatus } from "@/lib/api/admin/magazines";

interface Props {
  status: MagazineStatus;
  disabled?: boolean;
  onApprove: () => void;
  onReject: () => void;
  onRevert: () => void;
}

/**
 * Inline action buttons per magazine row.
 *
 * - pending: Approve + Reject
 * - published: Unpublish (revert → draft)
 * - draft / rejected: none
 */
export function MagazineActions({
  status,
  disabled,
  onApprove,
  onReject,
  onRevert,
}: Props) {
  if (status === "pending") {
    return (
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          disabled={disabled}
          onClick={onApprove}
          className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onReject}
          className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    );
  }

  if (status === "published") {
    return (
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          disabled={disabled}
          onClick={onRevert}
          className="px-3 py-1.5 text-xs font-medium bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50"
        >
          Unpublish
        </button>
      </div>
    );
  }

  return <span className="text-xs text-gray-400">—</span>;
}
