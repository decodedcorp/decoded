"use client";

import { useEffect, useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  submitting?: boolean;
}

export function RejectModal({ open, onClose, onSubmit, submitting }: Props) {
  const [reason, setReason] = useState("");

  // Reset reason when modal closes so the next open starts clean.
  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  if (!open) return null;

  const trimmed = reason.trim();
  const canSubmit = trimmed.length > 0 && !submitting;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-modal-title"
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2
          id="reject-modal-title"
          className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4"
        >
          Reject Magazine
        </h2>
        <label
          htmlFor="reject-reason"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Reason <span className="text-red-500">*</span>
        </label>
        <textarea
          id="reject-reason"
          className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2 min-h-[100px] text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why this magazine is rejected"
          disabled={submitting}
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => canSubmit && onSubmit(trimmed)}
            disabled={!canSubmit}
            className="px-4 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
