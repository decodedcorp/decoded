"use client";

import { useRouter } from "next/navigation";
import { useRequestStore, selectCurrentStep } from "@/lib/stores/requestStore";
import { RequestFlowHeader } from "@/lib/components/request/RequestFlowHeader";
import { UploadFlowSteps } from "@/lib/components/request/UploadFlowSteps";

export default function RequestUploadPage() {
  const router = useRouter();
  const currentStep = useRequestStore(selectCurrentStep);

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <RequestFlowHeader
        title="Upload Images"
        currentStep={currentStep}
        onClose={() => router.push("/")}
      />

      <UploadFlowSteps />
    </div>
  );
}
