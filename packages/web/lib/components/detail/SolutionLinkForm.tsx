"use client";

import { memo, useState, useCallback, useRef } from "react";
import { Link2, Loader2, Check, X, AlertTriangle } from "lucide-react";
import {
  extractMetadata,
  convertAffiliate,
} from "@/lib/api/generated/solutions/solutions";
import type { MetadataResponse } from "@/lib/api/generated/models";

export interface SolutionLinkFormData {
  original_url: string;
  affiliate_url?: string | null;
  title?: string | null;
  description?: string | null;
  thumbnail_url?: string | null;
}

interface SolutionLinkFormProps {
  spotId: string;
  onSave: (spotId: string, data: SolutionLinkFormData) => void;
  onCancel: () => void;
}

function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return str.startsWith("http://") || str.startsWith("https://");
  } catch {
    return false;
  }
}

/**
 * OG Preview Card - 마우스 반응 카드
 * 제휴 링크 여부는 백엔드(extract-metadata) 응답 is_affiliate_supported 사용
 */
function OGPreviewCard({ meta }: { meta: MetadataResponse }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });

  const imageUrl = meta.thumbnail_url ?? meta.image ?? null;
  const isAffiliateSupported = meta.is_affiliate_supported === true;

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMouse({ x, y });
  }, []);

  return (
    <div className="space-y-4">
      {/* OG Card - mouse reactive */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setMouse({ x: 0.5, y: 0.5 })}
        className="group relative overflow-hidden rounded-xl border border-border/40 bg-muted/5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
      >
        {/* Parallax glow effect based on mouse */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle at ${mouse.x * 100}% ${mouse.y * 100}%, oklch(var(--primary) / 0.08), transparent 50%)`,
          }}
        />
        <div className="relative flex gap-4 p-4">
          {imageUrl && (
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={meta.title ?? "Preview"}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            {meta.site_name && (
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">
                {meta.site_name}
              </p>
            )}
            <h4 className="font-serif font-medium text-foreground line-clamp-2">
              {meta.title || "Untitled"}
            </h4>
            {meta.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {meta.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 제휴 링크 여부 - 백엔드 is_affiliate_supported 기준 */}
      {isAffiliateSupported ? (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              You can earn revenue from this link
            </p>
            <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-1">
              It will be converted to an affiliate link before saving.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
          <AlertTriangle className="w-5 h-5 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Not an affiliate link
            </p>
            <p className="text-xs text-blue-700/80 dark:text-blue-300/80 mt-1">
              We'll let you know if it becomes eligible for affiliate later.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * SolutionLinkForm - 링크 입력 → 메타데이터 추출(등록) → 백엔드 제휴 여부 기준 → 저장
 * 백엔드 플로우: extract-metadata → is_affiliate_supported (백엔드 응답) → (convert-affiliate if true) → create
 */
export const SolutionLinkForm = memo(
  ({ spotId, onSave, onCancel }: SolutionLinkFormProps) => {
    const [url, setUrl] = useState("");
    const [isExtracting, setIsExtracting] = useState(false);
    const [meta, setMeta] = useState<MetadataResponse | null>(null);
    const [isConverting, setIsConverting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleExtract = useCallback(async () => {
      const trimmed = url.trim();
      if (!trimmed || !isValidUrl(trimmed) || isExtracting) return;

      setIsExtracting(true);
      setMeta(null);
      try {
        const result = await extractMetadata({ url: trimmed });
        setMeta({
          ...result,
          url: result.url ?? trimmed,
          title: result.title ?? "Unknown",
          is_affiliate_supported: result.is_affiliate_supported ?? false,
        });
      } catch {
        setMeta({
          url: trimmed,
          title: "Unknown",
          is_affiliate_supported: false,
        });
      } finally {
        setIsExtracting(false);
      }
    }, [url, isExtracting]);

    const handleSave = useCallback(async () => {
      if (!meta || !url.trim()) return;

      setIsSaving(true);
      try {
        let affiliateUrl: string | null = null;
        if (meta.is_affiliate_supported === true) {
          setIsConverting(true);
          try {
            const res = await convertAffiliate({ url: url.trim() });
            affiliateUrl = res.affiliate_url;
          } finally {
            setIsConverting(false);
          }
        }

        const data: SolutionLinkFormData = {
          original_url: url.trim(),
          affiliate_url: affiliateUrl,
          title: meta.title ?? null,
          description: meta.description ?? null,
          thumbnail_url: meta.thumbnail_url ?? meta.image ?? null,
        };
        onSave(spotId, data);
      } catch (err) {
        console.error("[SolutionLinkForm] Save failed:", err);
        throw err;
      } finally {
        setIsSaving(false);
      }
    }, [meta, url, spotId, onSave]);

    const canSave = meta && url.trim();

    return (
      <div className="space-y-6">
        {/* Step 1: URL 입력 + 등록 (메타 추출 전에만 표시) */}
        {!meta && (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Paste an item link and tap Submit.
            </p>
            <div className="space-y-3">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <Link2 className="w-3 h-3" />
                Link
              </label>
              <div className="flex gap-3">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onBlur={() =>
                    url.trim() && isValidUrl(url) && handleExtract()
                  }
                  placeholder="https://..."
                  disabled={isExtracting}
                  className="flex-1 min-w-0 px-4 py-3 text-sm bg-background border border-border rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                         placeholder:text-muted-foreground/50 disabled:opacity-70"
                />
                <button
                  type="button"
                  onClick={handleExtract}
                  disabled={!url.trim() || !isValidUrl(url) || isExtracting}
                  className="shrink-0 px-6 py-3 text-sm font-medium rounded-xl bg-primary text-primary-foreground
                         hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2 min-w-[72px]"
                >
                  {isExtracting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Submit"
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Step 2: OG 카드 + 제휴 여부 + 취소/저장 (메타 추출 후 링크 카드로 대체) */}
        {meta && (
          <>
            <OGPreviewCard meta={meta} />

            {/* 취소/저장 - 메타 추출 완료 후에만 표시 */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium
                         text-muted-foreground bg-muted/50 rounded-xl
                         hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave || isSaving || isConverting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium
                         text-primary-foreground bg-primary rounded-xl
                         hover:bg-primary/90 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving || isConverting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {isConverting
                  ? "Converting..."
                  : isSaving
                    ? "Saving..."
                    : "Save"}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }
);

SolutionLinkForm.displayName = "SolutionLinkForm";
