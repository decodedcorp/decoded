"use client";

import { useRef, useEffect } from "react";
import { toast } from "sonner";
import { useVtonStore } from "@/lib/stores/vtonStore";

// --- Background Job Notifier (renders outside modal) ---
export function VtonBackgroundNotifier() {
  const backgroundJob = useVtonStore((s) => s.backgroundJob);
  const isOpen = useVtonStore((s) => s.isOpen);
  const reopen = useVtonStore((s) => s.reopen);
  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (!backgroundJob) {
      prevStatusRef.current = null;
      return;
    }

    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = backgroundJob.status;

    // Only notify on status transition, and only when modal is closed
    if (prevStatus === backgroundJob.status) return;
    if (isOpen) return;

    if (backgroundJob.status === "done") {
      toast.success("Try-on complete!", {
        description: "Tap to view your result.",
        duration: 8000,
        onDismiss: () => reopen(),
        action: {
          label: "View Result",
          onClick: () => reopen(),
        },
        style: { cursor: "pointer" },
      });
    } else if (backgroundJob.status === "error") {
      toast.error("Try-on failed", {
        description: backgroundJob.error || "Something went wrong.",
        duration: 6000,
      });
    }
  }, [backgroundJob?.status, isOpen, reopen, backgroundJob?.error]);

  return null;
}
