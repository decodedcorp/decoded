"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { RequestFlowModal } from "@/lib/components/request/RequestFlowModal";
import { UploadFlowSteps } from "@/lib/components/request/UploadFlowSteps";
import { useRequestStore } from "@/lib/stores/requestStore";

/**
 * Intercepting route for /request/upload — thin assembler.
 *
 * Composes RequestFlowModal (chrome) + UploadFlowSteps (steps) so the
 * intercept modal shares the full feature set of the direct URL page.
 * useUploadFlow inside UploadFlowSteps owns activeInstanceId registration
 * and auto-resets on unmount; the explicit resetIfActive here is a defensive
 * no-op when unmount cleanup runs first.
 */
export default function InterceptUploadPage() {
  const router = useRouter();

  const handleClose = useCallback(() => {
    // Read activeInstanceId via getState (no subscription, no closure trap).
    // If close fires before useUploadFlow's mount effect committed, id is null
    // and cleanup falls back to the unmount path inside useUploadFlow.
    const id = useRequestStore.getState().activeInstanceId;
    if (id) {
      useRequestStore.getState().resetIfActive(id);
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }, [router]);

  return (
    <RequestFlowModal maxWidth="6xl" mobileFullScreen onClose={handleClose}>
      <UploadFlowSteps />
    </RequestFlowModal>
  );
}
