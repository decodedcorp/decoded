"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  targetType?: string;
  className?: string;
}

const REPORT_REASONS = [
  { id: "spam", label: "Spam or misleading" },
  { id: "inappropriate", label: "Inappropriate content" },
  { id: "copyright", label: "Copyright violation" },
  { id: "incorrect", label: "Incorrect information" },
  { id: "other", label: "Other" },
] as const;

export function ReportModal({
  open,
  onClose,
  targetType = "content",
  className,
}: ReportModalProps) {
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");

  if (!open) return null;

  const handleSubmit = () => {
    if (!reason) return;
    toast.success("Report submitted. Thank you for your feedback.");
    setReason("");
    setDetails("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div
        className={cn(
          "relative w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl p-6 space-y-5",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Report {targetType}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-accent transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Reasons */}
        <div className="space-y-2">
          {REPORT_REASONS.map((r) => (
            <label
              key={r.id}
              className={cn(
                "flex items-center gap-3 rounded-lg p-3 cursor-pointer transition-colors border",
                reason === r.id
                  ? "border-primary bg-primary/5"
                  : "border-transparent hover:bg-accent"
              )}
            >
              <input
                type="radio"
                name="report-reason"
                value={r.id}
                checked={reason === r.id}
                onChange={(e) => setReason(e.target.value)}
                className="accent-primary"
              />
              <span className="text-sm">{r.label}</span>
            </label>
          ))}
        </div>

        {/* Details */}
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Add more details (optional)..."
          rows={3}
          className="w-full rounded-lg bg-muted p-3 text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason}
            className="flex-1 rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
}
