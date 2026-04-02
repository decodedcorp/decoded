"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useVtonStore } from "@/lib/stores/vtonStore";
import { useVtonScrollLock } from "@/lib/hooks/useVtonScrollLock";
import {
  useVtonItemFetch,
  type ItemData,
  type Category,
} from "@/lib/hooks/useVtonItemFetch";
import { useVtonTryOn } from "@/lib/hooks/useVtonTryOn";
import { VtonPhotoArea } from "./VtonPhotoArea";
import { VtonItemPanel } from "./VtonItemPanel";

export { VtonBackgroundNotifier } from "./VtonBackgroundNotifier";

export function VtonModal() {
  const isOpen = useVtonStore((s) => s.isOpen);
  const close = useVtonStore((s) => s.close);
  const sourcePostId = useVtonStore((s) => s.sourcePostId);
  const preloadedItems = useVtonStore((s) => s.preloadedItems);
  const backgroundJob = useVtonStore((s) => s.backgroundJob);
  const startBackgroundJob = useVtonStore((s) => s.startBackgroundJob);
  const completeBackgroundJob = useVtonStore((s) => s.completeBackgroundJob);
  const failBackgroundJob = useVtonStore((s) => s.failBackgroundJob);
  const clearBackgroundJob = useVtonStore((s) => s.clearBackgroundJob);
  const hasActiveJob = backgroundJob != null;
  const isPostMode = preloadedItems.length > 0;

  const [personImage, setPersonImage] = useState<string | null>(null);
  const [personPreview, setPersonPreview] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>("tops");
  const [selectedItems, setSelectedItems] = useState<
    Record<Category, ItemData | null>
  >({
    tops: null,
    bottoms: null,
  });
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPostItemIds, setSelectedPostItemIds] = useState<Set<string>>(
    new Set()
  );
  const stageInterval = useRef<ReturnType<typeof setInterval>>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Restore local state from backgroundJob when modal reopens
  const restoredFromJobRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isOpen || !backgroundJob) return;
    if (restoredFromJobRef.current === backgroundJob.id) return;
    restoredFromJobRef.current = backgroundJob.id;
    setPersonPreview(backgroundJob.personPreview);
    setPersonImage(backgroundJob.personImageBase64);
    setSelectedPostItemIds(
      new Set(backgroundJob.selectedItems.map((i) => i.id))
    );
  }, [isOpen, backgroundJob]);

  // Derive display state
  const bgResult = backgroundJob?.status === "done" ? backgroundJob : null;
  const bgError = backgroundJob?.status === "error" ? backgroundJob : null;
  const displayResultImage = bgResult?.resultImage ?? null;
  const displayPersonPreview = bgResult?.personPreview ?? personPreview;
  const displayLatency = bgResult?.latencyMs ?? null;
  const isProcessing = loading || backgroundJob?.status === "processing";
  const jobSelectedItems = backgroundJob?.selectedItems ?? [];

  // Hooks
  useVtonScrollLock(isOpen);
  const { items } = useVtonItemFetch(
    isOpen,
    activeCategory,
    searchQuery,
    isPostMode ? preloadedItems : undefined
  );

  const selectedList = useMemo(() => {
    if (hasActiveJob && jobSelectedItems.length > 0) return jobSelectedItems;
    if (isPostMode)
      return items.filter((item) => selectedPostItemIds.has(item.id));
    return Object.values(selectedItems).filter(Boolean) as ItemData[];
  }, [
    hasActiveJob,
    jobSelectedItems,
    isPostMode,
    items,
    selectedPostItemIds,
    selectedItems,
  ]);
  const selectedCount = selectedList.length;

  // Sync loading from background job on re-open
  useEffect(() => {
    if (isOpen && backgroundJob?.status === "processing") {
      setLoading(true);
      setLoadingStage(0);
      stageInterval.current = setInterval(
        () => setLoadingStage((s) => Math.min(s + 1, 5)),
        2000
      );
    }
    return () => {
      if (stageInterval.current) clearInterval(stageInterval.current);
    };
  }, [isOpen, backgroundJob?.status]);

  // Stop loading animation when job completes
  useEffect(() => {
    if (backgroundJob?.status === "done" || backgroundJob?.status === "error") {
      setLoading(false);
      if (stageInterval.current) clearInterval(stageInterval.current);
    }
  }, [backgroundJob?.status]);

  // Abort on unmount
  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
    },
    []
  );

  const {
    handleTryOn,
    handleSaveToProfile,
    handleShare,
    isSaving,
    savedToProfile,
    setSavedToProfile,
  } = useVtonTryOn({
    personImage,
    personPreview,
    selectedItems: selectedList,
    sourcePostId,
    displayResultImage,
    abortControllerRef,
    onTryOnStart: () => {
      setLoading(true);
      setError(null);
      clearBackgroundJob();
      setLoadingStage(0);
      stageInterval.current = setInterval(
        () => setLoadingStage((s) => Math.min(s + 1, 5)),
        2000
      );
    },
    onTryOnComplete: (resultDataUrl, latencyMs) =>
      completeBackgroundJob(resultDataUrl, latencyMs),
    onTryOnError: (message) => {
      failBackgroundJob(message);
      setError(message);
    },
    onTryOnFinally: () => {
      if (stageInterval.current) clearInterval(stageInterval.current);
      setLoading(false);
    },
    startBackgroundJob,
  });

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (loading) {
      toast.info("Processing in background", {
        description: "We'll notify you when your try-on is ready.",
        duration: 3000,
      });
    }
    close();
    if (!loading) {
      setTimeout(() => {
        setPersonImage(null);
        setPersonPreview(null);
        setSelectedItems({ tops: null, bottoms: null });
        setSelectedPostItemIds(new Set());
        setError(null);
        setSearchQuery("");
        setActiveCategory("tops");
      }, 300);
    }
  }, [close, loading]);

  const handleReset = useCallback(() => {
    clearBackgroundJob();
    setSavedToProfile(false);
    setError(null);
  }, [clearBackgroundJob, setSavedToProfile]);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setPersonPreview(dataUrl);
        setPersonImage(dataUrl.split(",")[1]);
        clearBackgroundJob();
        setError(null);
      };
      reader.readAsDataURL(file);
    },
    [clearBackgroundJob]
  );

  const handleSelectItem = useCallback(
    (item: ItemData) => {
      if (isPostMode) {
        setSelectedPostItemIds((prev) => {
          const next = new Set(prev);
          if (next.has(item.id)) next.delete(item.id);
          else next.add(item.id);
          return next;
        });
      } else {
        setSelectedItems((prev) => {
          const current = prev[activeCategory];
          if (current?.id === item.id)
            return { ...prev, [activeCategory]: null };
          return { ...prev, [activeCategory]: item };
        });
      }
    },
    [activeCategory, isPostMode]
  );

  const handleDeselect = useCallback(
    (item: ItemData) => {
      if (isPostMode) {
        setSelectedPostItemIds((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      } else {
        const cat = (
          Object.entries(selectedItems) as [Category, ItemData | null][]
        ).find(([, v]) => v?.id === item.id)?.[0];
        if (cat) setSelectedItems((prev) => ({ ...prev, [cat]: null }));
      }
    },
    [isPostMode, selectedItems]
  );

  if (!isOpen) return null;

  return (
    <div
      data-testid="vton-modal"
      className="fixed inset-0 z-[100] flex items-center justify-center overscroll-contain"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative z-10 flex h-[90vh] w-[95vw] max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl md:flex-row">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-30 rounded-full bg-white/10 p-2 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
        >
          <X size={18} />
        </button>
        <VtonPhotoArea
          personPreview={personPreview}
          displayPersonPreview={displayPersonPreview}
          displayResultImage={displayResultImage}
          displayLatency={displayLatency}
          isProcessing={isProcessing}
          loadingStage={loadingStage}
          isSaving={isSaving}
          savedToProfile={savedToProfile}
          onFileChange={handleFileUpload}
          onSaveToProfile={handleSaveToProfile}
          onShare={handleShare}
          onReset={handleReset}
        />
        <VtonItemPanel
          isPostMode={isPostMode}
          hasActiveJob={hasActiveJob}
          activeCategory={activeCategory}
          selectedItems={selectedItems}
          selectedPostItemIds={selectedPostItemIds}
          jobSelectedItems={jobSelectedItems}
          items={items}
          selectedList={selectedList}
          selectedCount={selectedCount}
          personImage={personImage}
          isProcessing={isProcessing}
          searchQuery={searchQuery}
          error={error}
          bgError={bgError}
          onCategoryChange={(cat) => {
            setActiveCategory(cat);
            setSearchQuery("");
          }}
          onSearchChange={setSearchQuery}
          onSelectItem={handleSelectItem}
          onDeselect={handleDeselect}
          onTryOn={handleTryOn}
        />
      </div>
    </div>
  );
}
