"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useRequestStore } from "@/lib/stores/requestStore";

export interface UseUploadFlowReturn {
  instanceId: string;
  isSubmitting: boolean;
  submitError: string | null;
  submit: () => Promise<void>;
  close: () => void;
}

/**
 * Headless state + actions for the Request/Upload flow.
 *
 * Registers the caller as the current owner of `requestStore` via
 * `activeInstanceId` so that unmount of one mount (e.g., intercept modal)
 * does not clobber state belonging to another mount (e.g., direct URL page).
 *
 * Submit logic is filled in Task B4; this scaffold only wires the lifecycle
 * and exposes stable handles.
 */
export function useUploadFlow(): UseUploadFlowReturn {
  const instanceId = useId();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    useRequestStore.getState().setActiveInstance(instanceId);
    return () => {
      useRequestStore.getState().resetIfActive(instanceId);
    };
  }, [instanceId]);

  const submit = useCallback(async () => {
    // Implemented in Task B4 — migrate from app/request/upload/page.tsx
    setIsSubmitting(false);
    setSubmitError(null);
  }, []);

  const close = useCallback(() => {
    useRequestStore.getState().resetIfActive(instanceId);
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }, [instanceId, router]);

  return { instanceId, isSubmitting, submitError, submit, close };
}
