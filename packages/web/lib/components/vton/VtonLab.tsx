"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface ItemData {
  id: number;
  brand: string | null;
  sam_prompt: string;
  cropped_image_path: string;
}

// Single RegExp avoids array iteration and toLowerCase() on every call
const VTON_ELIGIBLE_REGEX =
  /dress|top|shirt|blouse|jacket|coat|sweater|hoodie|cardigan|vest|tank|jumpsuit|romper|bodysuit|polo|tee/i;

function isVtonEligible(samPrompt: string): boolean {
  return VTON_ELIGIBLE_REGEX.test(samPrompt);
}

export function VtonLab() {
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [personPreview, setPersonPreview] = useState<string | null>(null);
  const [items, setItems] = useState<ItemData[]>([]);
  const [selectedItem, setSelectedItem] = useState<ItemData | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Fetch eligible items from DB
  useEffect(() => {
    fetch("/api/v1/vton/items")
      .then((res) => res.json())
      .then((data) => {
        const eligible = (data.items || []).filter((item: ItemData) =>
          isVtonEligible(item.sam_prompt)
        );
        setItems(eligible);
      })
      .catch(() => setItems([]));
  }, []);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setPersonPreview(dataUrl);
        // Strip data:image/...;base64, prefix
        setPersonImage(dataUrl.split(",")[1]);
        setResultImage(null);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleTryOn = useCallback(async () => {
    if (!personImage || !selectedItem) return;

    setLoading(true);
    setError(null);
    setResultImage(null);

    try {
      // Send product image URL to server — server fetches it (avoids CORS)
      const res = await fetch("/api/v1/vton", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personImageBase64: personImage,
          productImageUrl: selectedItem.cropped_image_path,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "VTON failed");
      }

      setResultImage(`data:${data.mimeType};base64,${data.resultImage}`);
      setLatency(data.latencyMs);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [personImage, selectedItem]);

  // Slider drag handling
  const handleSliderMove = useCallback((clientX: number) => {
    if (!sliderRef.current || !isDragging.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  }, []);

  const handlePointerDown = useCallback(() => {
    isDragging.current = true;
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => handleSliderMove(e.clientX),
    [handleSliderMove]
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-[#050505]/90 px-6 py-4 backdrop-blur-md">
        <a href="/lab" className="text-sm text-white/50 hover:text-white">
          &larr; Lab
        </a>
        <h1 className="text-lg font-semibold tracking-tight">
          Virtual Try-On <span className="text-[#eafd67]">PoC</span>
        </h1>
        <div className="w-12" />
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Left: Main viewport */}
          <div className="space-y-6">
            {/* Result / Before-After */}
            {resultImage && personPreview ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <span className="h-2 w-2 rounded-full bg-[#eafd67]" />
                  Result — {latency ? `${(latency / 1000).toFixed(1)}s` : ""}
                  <span className="ml-auto text-xs">drag to compare</span>
                </div>
                <div
                  ref={sliderRef}
                  className="relative aspect-[3/4] w-full cursor-col-resize overflow-hidden rounded-2xl border border-white/10"
                  onPointerDown={handlePointerDown}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  onPointerMove={handlePointerMove}
                >
                  {/* After (result) - full width */}
                  <img
                    src={resultImage}
                    alt="Try-on result"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  {/* Before (original) - clipped */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${sliderPos}%` }}
                  >
                    <img
                      src={personPreview}
                      alt="Original"
                      className="h-full w-full object-cover"
                      style={{
                        width: `${(100 / sliderPos) * 100}%`,
                        maxWidth: "none",
                      }}
                    />
                  </div>
                  {/* Divider */}
                  <div
                    className="absolute top-0 bottom-0 z-10 w-0.5 bg-[#eafd67]"
                    style={{ left: `${sliderPos}%` }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#eafd67] bg-[#050505] p-2">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
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
                  {/* Labels */}
                  <span className="absolute top-3 left-3 rounded-full bg-black/60 px-2 py-0.5 text-xs">
                    Before
                  </span>
                  <span className="absolute top-3 right-3 rounded-full bg-black/60 px-2 py-0.5 text-xs">
                    After
                  </span>
                </div>
              </div>
            ) : (
              /* Upload area */
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-[3/4] w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-white/5 transition-colors hover:border-[#eafd67]/50 hover:bg-white/10"
              >
                {personPreview ? (
                  <img
                    src={personPreview}
                    alt="Uploaded person"
                    className="h-full w-full rounded-2xl object-cover"
                  />
                ) : (
                  <>
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="mb-4 text-white/30"
                    >
                      <path
                        d="M12 5v14M5 12h14"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    <p className="text-sm text-white/50">
                      Upload a full-body photo
                    </p>
                    <p className="mt-1 text-xs text-white/30">
                      Best results with standing pose
                    </p>
                  </>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Action buttons */}
            <div className="flex gap-3">
              {personPreview && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/10"
                >
                  Change Photo
                </button>
              )}
              {resultImage && (
                <button
                  onClick={() => {
                    setResultImage(null);
                    setSliderPos(50);
                  }}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/10"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}
          </div>

          {/* Right: Item selector + Try On button */}
          <div className="space-y-6">
            <div>
              <h2 className="mb-3 text-sm font-medium text-white/70">
                Select Item ({items.length} eligible)
              </h2>
              <div className="grid max-h-[60vh] grid-cols-2 gap-2 overflow-y-auto pr-1">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`group relative overflow-hidden rounded-xl border-2 transition-all ${
                      selectedItem?.id === item.id
                        ? "border-[#eafd67] shadow-[0_0_20px_rgba(234,253,103,0.15)]"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="aspect-square">
                      <img
                        src={item.cropped_image_path}
                        alt={item.sam_prompt}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="truncate text-xs text-white/80">
                        {item.sam_prompt}
                      </p>
                      {item.brand && (
                        <p className="truncate text-[10px] text-white/40">
                          {item.brand}
                        </p>
                      )}
                    </div>
                    {selectedItem?.id === item.id && (
                      <div className="absolute top-1.5 right-1.5 rounded-full bg-[#eafd67] p-0.5">
                        <svg
                          width="12"
                          height="12"
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
                ))}
              </div>
            </div>

            {/* Selected item info */}
            {selectedItem && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/80">
                  {selectedItem.sam_prompt}
                </p>
                {selectedItem.brand && (
                  <p className="mt-0.5 text-xs text-[#eafd67]">
                    {selectedItem.brand}
                  </p>
                )}
              </div>
            )}

            {/* Try On button */}
            <button
              onClick={handleTryOn}
              disabled={!personImage || !selectedItem || loading}
              className="w-full rounded-xl bg-[#eafd67] py-3.5 text-sm font-semibold text-[#050505] transition-all hover:bg-[#d4e85c] disabled:cursor-not-allowed disabled:opacity-30"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="2"
                      opacity="0.3"
                    />
                    <path
                      d="M12 2a10 10 0 019.95 9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  Generating... (~10s)
                </span>
              ) : (
                "Try On"
              )}
            </button>

            {!personImage && (
              <p className="text-center text-xs text-white/30">
                Upload a photo first
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
