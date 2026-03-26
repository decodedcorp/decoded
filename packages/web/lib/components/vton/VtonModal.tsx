"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  X,
  Search,
  Upload,
  RotateCcw,
  Download,
  Share2,
  BookmarkPlus,
} from "lucide-react";
import { toast } from "sonner";
import { useVtonStore } from "@/lib/stores/vtonStore";

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

async function copyImageToClipboard(dataUrl: string) {
  try {
    const blob = await dataUrlToBlob(dataUrl);
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    toast.success("Image copied to clipboard!");
  } catch {
    await navigator.clipboard.writeText(dataUrl);
    toast.success("Link copied to clipboard!");
  }
}

interface ItemData {
  id: string;
  title: string;
  thumbnail_url: string;
  description: string | null;
  keywords: string[] | null;
}

type Category = "tops" | "bottoms";

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "tops", label: "Tops" },
  { key: "bottoms", label: "Bottoms" },
];

// --- Loading Animation ---
function VtonLoadingAnimation({ stage }: { stage: number }) {
  const stages = [
    { label: "Analyzing your photo", icon: "\u{1F50D}", progress: 10 },
    { label: "Mapping body structure", icon: "\u{1F4D0}", progress: 25 },
    { label: "Fitting first item", icon: "\u{1F455}", progress: 40 },
    { label: "Fitting next item", icon: "\u{1F456}", progress: 60 },
    { label: "Refining details", icon: "\u2728", progress: 80 },
    { label: "Almost there", icon: "\u{1F3A8}", progress: 95 },
  ];
  const current = stages[Math.min(stage, stages.length - 1)];

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#050505]/95 backdrop-blur-xl">
      <div className="relative mb-8 h-32 w-32">
        <div
          className="absolute inset-0 rounded-full border-2 border-[#eafd67]/20"
          style={{ animation: "vton-spin 3s linear infinite" }}
        />
        <div
          className="absolute inset-2 rounded-full border-2 border-[#eafd67]/40"
          style={{ animation: "vton-spin 2s linear infinite reverse" }}
        />
        <div
          className="absolute inset-4 rounded-full border-t-2 border-[#eafd67]"
          style={{ animation: "vton-spin 1s linear infinite" }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-3xl">
          {current.icon}
        </div>
      </div>
      <p
        className="mb-4 text-lg font-medium text-white transition-opacity duration-500"
        key={stage}
      >
        {current.label}
      </p>
      <div className="h-1 w-48 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[#eafd67] transition-all duration-1000 ease-out"
          style={{ width: `${current.progress}%` }}
        />
      </div>
      <p className="mt-6 text-xs text-white/40">
        You can close this modal — we'll notify you when it's ready
      </p>
      <style jsx>{`
        @keyframes vton-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

// --- Before/After Slider ---
function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
}: {
  beforeSrc: string;
  afterSrc: string;
}) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current || !isDragging.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full cursor-col-resize select-none overflow-hidden touch-none"
      onPointerDown={(e) => {
        isDragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerUp={(e) => {
        isDragging.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => handleMove(e.clientX)}
    >
      <img
        src={afterSrc}
        alt="Result"
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full object-contain"
      />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPos}%` }}
      >
        <img
          src={beforeSrc}
          alt="Original"
          draggable={false}
          className="pointer-events-none h-full object-contain"
          style={{
            width: `${containerRef.current ? containerRef.current.offsetWidth : 0}px`,
            maxWidth: "none",
          }}
        />
      </div>
      <div
        className="absolute top-0 bottom-0 z-10 w-0.5 bg-[#eafd67]"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#eafd67] bg-[#050505] p-1.5">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M5 3L2 8L5 13M11 3L14 8L11 13"
              stroke="#eafd67"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      <span className="absolute top-3 left-3 z-10 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
        Before
      </span>
      <span className="absolute top-3 right-3 z-10 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
        After
      </span>
    </div>
  );
}

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

// --- Main Modal ---
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
  const [items, setItems] = useState<ItemData[]>([]);
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stageInterval = useRef<ReturnType<typeof setInterval>>(null);
  // AbortController for direct fetch calls (VTON and save-to-profile)
  const abortControllerRef = useRef<AbortController | null>(null);

  // Restore local state from backgroundJob when modal reopens with an active job
  const restoredFromJobRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isOpen || !backgroundJob) return;
    // Only restore once per job
    if (restoredFromJobRef.current === backgroundJob.id) return;
    restoredFromJobRef.current = backgroundJob.id;

    setPersonPreview(backgroundJob.personPreview);
    setPersonImage(backgroundJob.personImageBase64);
    setItems(backgroundJob.selectedItems);
    setSelectedPostItemIds(
      new Set(backgroundJob.selectedItems.map((i) => i.id))
    );
  }, [isOpen, backgroundJob]);

  // Derive display state: show background job result if available
  const bgResult = backgroundJob?.status === "done" ? backgroundJob : null;
  const bgError = backgroundJob?.status === "error" ? backgroundJob : null;
  const displayResultImage = bgResult?.resultImage ?? null;
  const displayPersonPreview = bgResult?.personPreview ?? personPreview;
  const displayLatency = bgResult?.latencyMs ?? null;
  const isProcessing = loading || backgroundJob?.status === "processing";

  // When there's an active job, show its selected items in the summary
  const jobSelectedItems = backgroundJob?.selectedItems ?? [];

  const selectedList = useMemo(() => {
    // If processing/done, show items from the job
    if (hasActiveJob && jobSelectedItems.length > 0) {
      return jobSelectedItems;
    }
    if (isPostMode) {
      return items.filter((item) => selectedPostItemIds.has(item.id));
    }
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

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [isOpen]);

  // Escape key — now allowed during loading too
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  // Abort any in-flight fetch when component unmounts
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Debounced search
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch items by category
  useEffect(() => {
    if (!isOpen) return;
    if (preloadedItems.length > 0) {
      setItems(preloadedItems);
      return;
    }
    const controller = new AbortController();
    const params = new URLSearchParams({ category: activeCategory });
    if (debouncedQuery) params.set("q", debouncedQuery);
    fetch(`/api/v1/vton/items?${params}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => setItems(data.items || []))
      .catch((err) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setItems([]);
      });
    return () => controller.abort();
  }, [isOpen, activeCategory, debouncedQuery, preloadedItems]);

  // Sync loading state from background job when modal is re-opened
  useEffect(() => {
    if (isOpen && backgroundJob?.status === "processing") {
      setLoading(true);
      // Restart stage animation
      setLoadingStage(0);
      stageInterval.current = setInterval(() => {
        setLoadingStage((s) => Math.min(s + 1, 5));
      }, 2000);
    }
    return () => {
      if (stageInterval.current) clearInterval(stageInterval.current);
    };
  }, [isOpen, backgroundJob?.status]);

  // When background job completes while modal is open, stop loading animation
  useEffect(() => {
    if (backgroundJob?.status === "done" || backgroundJob?.status === "error") {
      setLoading(false);
      if (stageInterval.current) clearInterval(stageInterval.current);
    }
  }, [backgroundJob?.status]);

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

  const handleTryOn = useCallback(async () => {
    if (!personImage || !personPreview || selectedCount === 0) return;

    setLoading(true);
    setError(null);
    clearBackgroundJob();
    setLoadingStage(0);

    stageInterval.current = setInterval(() => {
      setLoadingStage((s) => Math.min(s + 1, 5));
    }, 2000);

    // Register background job so it persists across modal close
    startBackgroundJob(personPreview, personImage, selectedList);

    // Abort any previous in-flight request and create a fresh controller
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      const productImageUrls = selectedList.map((item) => item.thumbnail_url);

      const res = await fetch("/api/v1/vton", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personImageBase64: personImage,
          productImageUrls,
        }),
        signal: abortControllerRef.current.signal,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      const resultDataUrl = `data:${data.mimeType};base64,${data.resultImage}`;
      completeBackgroundJob(resultDataUrl, data.latencyMs);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      const message = (err as Error).message;
      failBackgroundJob(message);
      setError(message);
    } finally {
      clearInterval(stageInterval.current);
      setLoading(false);
    }
  }, [
    personImage,
    personPreview,
    selectedCount,
    selectedList,
    startBackgroundJob,
    completeBackgroundJob,
    failBackgroundJob,
    clearBackgroundJob,
  ]);

  const handleReset = useCallback(() => {
    clearBackgroundJob();
    setSavedToProfile(false);
    setError(null);
  }, [clearBackgroundJob]);

  // --- Save to Profile ---
  const [isSaving, setIsSaving] = useState(false);
  const [savedToProfile, setSavedToProfile] = useState(false);

  const handleSaveToProfile = useCallback(async () => {
    if (!displayResultImage || savedToProfile) return;
    setIsSaving(true);

    // Abort any previous in-flight request and create a fresh controller
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch("/api/v1/tries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          result_image: displayResultImage,
          source_post_id: sourcePostId,
          selected_item_ids: selectedList.map((i) => i.id),
        }),
        signal: abortControllerRef.current.signal,
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Please log in to save");
        if (res.status === 413) throw new Error("Image too large");
        throw new Error("Failed to save");
      }
      setSavedToProfile(true);
      toast.success("Saved to My Tries!");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      console.error("[VtonModal] Save error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to save. Try again.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }, [displayResultImage, savedToProfile, sourcePostId, selectedList]);

  // --- Share ---
  const handleShare = useCallback(async () => {
    if (!displayResultImage) return;
    if (navigator.share) {
      try {
        const blob = await dataUrlToBlob(displayResultImage);
        const file = new File([blob], `vton-${Date.now()}.png`, {
          type: blob.type,
        });
        await navigator.share({
          title: "My Virtual Try-On",
          files: [file],
        });
      } catch {
        await copyImageToClipboard(displayResultImage);
      }
    } else {
      await copyImageToClipboard(displayResultImage);
    }
  }, [displayResultImage]);

  const handleClose = useCallback(() => {
    // Allow closing even during loading — job continues in background
    if (loading) {
      toast.info("Processing in background", {
        description: "We'll notify you when your try-on is ready.",
        duration: 3000,
      });
    }
    close();
    // Only reset UI state if no active job
    if (!loading) {
      setTimeout(() => {
        setPersonImage(null);
        setPersonPreview(null);
        setSelectedItems({ tops: null, bottoms: null });
        setSelectedPostItemIds(new Set());
        setError(null);
        setSearchQuery("");
        setActiveCategory("tops");
        // Don't clear background job — keep it for notification
      }, 300);
    }
  }, [close, loading]);

  if (!isOpen) return null;

  const currentSelected = selectedItems[activeCategory];
  const showResult =
    displayResultImage && displayPersonPreview && !isProcessing;
  const showBgError = bgError && !loading;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overscroll-contain">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative z-10 flex h-[90vh] w-[95vw] max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl md:flex-row">
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-30 rounded-full bg-white/10 p-2 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
        >
          <X size={18} />
        </button>

        {/* Left: Photo area */}
        <div className="relative flex flex-1 items-center justify-center bg-[#050505] md:flex-[3]">
          {isProcessing && <VtonLoadingAnimation stage={loadingStage} />}

          {showResult ? (
            <div className="relative h-full w-full">
              <BeforeAfterSlider
                beforeSrc={displayPersonPreview}
                afterSrc={displayResultImage}
              />
              <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-4 py-3">
                <span className="h-2 w-2 rounded-full bg-[#eafd67]" />
                <span className="text-sm text-white/70">
                  {displayLatency
                    ? `${(displayLatency / 1000).toFixed(1)}s`
                    : ""}
                </span>
                <span className="text-xs text-white/40">drag to compare</span>
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={handleSaveToProfile}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 rounded-lg bg-[#eafd67] px-3 py-1.5 text-xs font-medium text-[#050505] hover:bg-[#d4e85c] disabled:opacity-50"
                  >
                    <BookmarkPlus size={12} />
                    {isSaving ? "Saving..." : savedToProfile ? "Saved" : "Save"}
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/20"
                  >
                    <Share2 size={12} /> Share
                  </button>
                  <a
                    href={displayResultImage || ""}
                    download={`vton-${Date.now()}.png`}
                    className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/20"
                  >
                    <Download size={12} />
                  </a>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/20"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>
              </div>
            </div>
          ) : !isProcessing ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex h-full w-full cursor-pointer flex-col items-center justify-center transition-colors hover:bg-white/5"
            >
              {personPreview ? (
                <img
                  src={personPreview}
                  alt="Uploaded"
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="rounded-2xl border-2 border-dashed border-white/20 p-6">
                    <Upload size={32} className="text-white/30" />
                  </div>
                  <p className="text-sm font-medium text-white/60">
                    Upload a full-body photo
                  </p>
                  <p className="text-xs text-white/30">
                    Best results with standing pose
                  </p>
                </div>
              )}
            </div>
          ) : null}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          {personPreview && !isProcessing && !showResult && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-4 left-4 rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white/70 backdrop-blur-sm hover:bg-black/80"
            >
              Change Photo
            </button>
          )}
        </div>

        {/* Right: Item panel */}
        <div className="flex w-full flex-col border-t border-white/10 md:w-[340px] md:border-t-0 md:border-l">
          {/* Header */}
          <div className="border-b border-white/10 px-4 py-3">
            <h2 className="text-sm font-semibold text-white">
              Virtual Try-On
              <span className="ml-2 text-[#eafd67]">PoC</span>
            </h2>
          </div>

          {/* Category tabs — hidden in post mode */}
          {!isPostMode && (
            <div className="flex border-b border-white/10">
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.key;
                const hasSelection = !!selectedItems[cat.key];
                return (
                  <button
                    key={cat.key}
                    onClick={() => {
                      setActiveCategory(cat.key);
                      setSearchQuery("");
                    }}
                    className={`relative flex-1 py-2.5 text-xs font-medium transition-colors ${
                      isActive
                        ? "text-[#eafd67]"
                        : hasSelection
                          ? "text-white/70"
                          : "text-white/40 hover:text-white/60"
                    }`}
                  >
                    {cat.label}
                    {hasSelection && (
                      <span className="absolute top-1.5 right-1/4 h-1.5 w-1.5 rounded-full bg-[#eafd67]" />
                    )}
                    {isActive && (
                      <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full bg-[#eafd67]" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Post mode header */}
          {isPostMode && (
            <div className="border-b border-white/10 px-4 py-2.5">
              <p className="text-xs text-white/50">
                이 포스트의 아이템 — 여러 개 선택 가능
              </p>
            </div>
          )}

          {/* Search — hidden in post mode */}
          {!isPostMode && (
            <div className="border-b border-white/10 px-4 py-2">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute top-1/2 left-2.5 -translate-y-1/2 text-white/30"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${CATEGORIES.find((c) => c.key === activeCategory)?.label.toLowerCase()}...`}
                  className="w-full rounded-lg bg-white/5 py-2 pr-3 pl-8 text-sm text-white placeholder-white/30 outline-none ring-1 ring-white/10 transition-all focus:ring-[#eafd67]/50"
                />
              </div>
            </div>
          )}

          {/* Item grid */}
          <div className="flex-1 overflow-y-auto px-3 py-3">
            <p className="mb-2 text-xs text-white/40">
              {items.length} item{items.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {items.map((item) => {
                const isSelected = hasActiveJob
                  ? jobSelectedItems.some((j) => j.id === item.id)
                  : isPostMode
                    ? selectedPostItemIds.has(item.id)
                    : currentSelected?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className={`group relative overflow-hidden rounded-xl border-2 transition-all ${
                      isSelected
                        ? "border-[#eafd67] shadow-[0_0_16px_rgba(234,253,103,0.12)]"
                        : "border-white/10 hover:border-white/25"
                    }`}
                  >
                    <div className="aspect-square">
                      <img
                        src={item.thumbnail_url}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                      <p className="truncate text-[10px] text-white/80">
                        {item.title}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1 right-1 rounded-full bg-[#eafd67] p-0.5">
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 12 12"
                          fill="none"
                        >
                          <path
                            d="M3 6l2 2 4-4"
                            stroke="#050505"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected summary + Try On */}
          <div className="border-t border-white/10 p-4">
            {selectedCount > 0 && (
              <div className="mb-3 flex gap-2 overflow-x-auto">
                {selectedList.map((item) => (
                  <div key={item.id} className="relative flex-shrink-0">
                    <img
                      src={item.thumbnail_url}
                      alt={item.title}
                      className="h-12 w-12 rounded-lg border border-[#eafd67]/50 object-cover"
                    />
                    <button
                      onClick={() => {
                        if (isPostMode) {
                          setSelectedPostItemIds((prev) => {
                            const next = new Set(prev);
                            next.delete(item.id);
                            return next;
                          });
                        } else {
                          const cat = (
                            Object.entries(selectedItems) as [
                              Category,
                              ItemData | null,
                            ][]
                          ).find(([, v]) => v?.id === item.id)?.[0];
                          if (cat)
                            setSelectedItems((prev) => ({
                              ...prev,
                              [cat]: null,
                            }));
                        }
                      }}
                      className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[8px] text-white hover:bg-white/40"
                    >
                      <X size={8} />
                    </button>
                  </div>
                ))}
                <span className="flex items-center text-[10px] text-white/40">
                  {selectedCount} item{selectedCount > 1 ? "s" : ""}
                </span>
              </div>
            )}

            <button
              onClick={handleTryOn}
              disabled={!personImage || selectedCount === 0 || isProcessing}
              className="w-full rounded-xl bg-[#eafd67] py-3 text-sm font-semibold text-[#050505] transition-all hover:bg-[#d4e85c] disabled:cursor-not-allowed disabled:opacity-30"
            >
              {isProcessing
                ? "Generating..."
                : selectedCount > 1
                  ? `Try On ${selectedCount} Items`
                  : "Try On"}
            </button>

            {!personImage && selectedCount === 0 && (
              <p className="mt-2 text-center text-[10px] text-white/30">
                Upload a photo & select items
              </p>
            )}

            {(error || showBgError) && (
              <p className="mt-2 text-center text-xs text-red-400">
                {error || bgError?.error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
