"use client";

import { memo, useState, useCallback } from "react";
import { Link2, Tag, DollarSign, X, Check, Loader2 } from "lucide-react";
import type { SpotSolutionData } from "@/lib/stores/requestStore";
import { extractMetadata } from "@/lib/api/generated/solutions/solutions";

interface SolutionInputFormProps {
  spotId: string;
  initialData?: SpotSolutionData;
  onSave: (spotId: string, solution: SpotSolutionData) => void;
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
 * SolutionInputForm - Spot에 대한 상품 정보 입력 폼
 * 링크 입력 시 extract-metadata API로 제목/썸네일/가격 자동 채움
 */
export const SolutionInputForm = memo(
  ({ spotId, initialData, onSave, onCancel }: SolutionInputFormProps) => {
    const [title, setTitle] = useState(initialData?.title || "");
    const [originalUrl, setOriginalUrl] = useState(
      initialData?.originalUrl || ""
    );
    const [thumbnailUrl, setThumbnailUrl] = useState(
      initialData?.thumbnailUrl || ""
    );
    const [priceAmount, setPriceAmount] = useState(
      initialData?.priceAmount?.toString() || ""
    );
    const [priceCurrency, setPriceCurrency] = useState(
      initialData?.priceCurrency || "KRW"
    );
    const [description, setDescription] = useState(
      initialData?.description || ""
    );
    const [isExtracting, setIsExtracting] = useState(false);

    const isValid = title.trim() && originalUrl.trim();

    const handleUrlBlur = useCallback(async () => {
      const url = originalUrl.trim();
      if (!url || !isValidUrl(url) || isExtracting) return;

      setIsExtracting(true);
      try {
        const meta = await extractMetadata({ url });
        if (meta.title) setTitle(meta.title);
        if (meta.description) setDescription(meta.description);
        const thumb = meta.thumbnail_url ?? meta.image;
        if (thumb) setThumbnailUrl(thumb);
        const priceVal = meta.extra_metadata?.price;
        const curr = meta.extra_metadata?.currency ?? "KRW";
        if (priceVal != null) {
          const num =
            typeof priceVal === "number"
              ? priceVal
              : parseInt(String(priceVal).replace(/[^0-9]/g, ""), 10);
          if (!isNaN(num)) setPriceAmount(String(num));
        }
        if (curr) setPriceCurrency(curr);
      } catch {
        // 실패 시 무시 (사용자가 수동 입력)
      } finally {
        setIsExtracting(false);
      }
    }, [originalUrl, isExtracting]);

    const handleSave = useCallback(() => {
      if (!isValid) return;

      const solution: SpotSolutionData = {
        title: title.trim(),
        originalUrl: originalUrl.trim(),
        priceCurrency,
        ...(priceAmount && { priceAmount: parseInt(priceAmount, 10) }),
        ...(thumbnailUrl && { thumbnailUrl }),
        ...(description && { description }),
      };

      onSave(spotId, solution);
    }, [
      spotId,
      title,
      originalUrl,
      priceAmount,
      priceCurrency,
      thumbnailUrl,
      description,
      isValid,
      onSave,
    ]);

    return (
      <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Tag className="w-3 h-3" />
          <span>Add product info (optional)</span>
        </div>

        {/* Product name */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Product name *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Nike Air Force 1"
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg
                       focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary
                       placeholder:text-muted-foreground/50"
          />
        </div>

        {/* 구매 링크 - blur 시 메타데이터 자동 추출 */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground flex items-center gap-1">
            <Link2 className="w-3 h-3" />
            Purchase link *
            {isExtracting && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
          </label>
          <input
            type="url"
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            onBlur={handleUrlBlur}
            placeholder="https://..."
            disabled={isExtracting}
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg
                       focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary
                       placeholder:text-muted-foreground/50 disabled:opacity-70"
          />
        </div>

        {/* 가격 */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            Price
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={priceAmount}
              onChange={(e) => setPriceAmount(e.target.value)}
              placeholder="129000"
              className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg
                         focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary
                         placeholder:text-muted-foreground/50"
            />
            <span className="px-3 py-2 text-sm text-muted-foreground bg-muted rounded-lg">
              {priceCurrency}
            </span>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm
                       text-muted-foreground bg-muted rounded-lg
                       hover:bg-muted/80 transition-colors"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm
                       text-primary-foreground bg-primary rounded-lg
                       hover:bg-primary/90 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>
    );
  }
);

SolutionInputForm.displayName = "SolutionInputForm";
