"use client";

import { Search, X } from "lucide-react";
import { CATEGORIES, type ItemData, type Category } from "@/lib/hooks/useVtonItemFetch";

interface VtonItemPanelProps {
  isPostMode: boolean;
  hasActiveJob: boolean;
  activeCategory: Category;
  selectedItems: Record<Category, ItemData | null>;
  selectedPostItemIds: Set<string>;
  jobSelectedItems: ItemData[];
  items: ItemData[];
  selectedList: ItemData[];
  selectedCount: number;
  personImage: string | null;
  isProcessing: boolean;
  searchQuery: string;
  error: string | null;
  bgError: { error: string | null } | null;
  onCategoryChange: (category: Category) => void;
  onSearchChange: (query: string) => void;
  onSelectItem: (item: ItemData) => void;
  onDeselect: (item: ItemData) => void;
  onTryOn: () => void;
}

export function VtonItemPanel({
  isPostMode,
  hasActiveJob,
  activeCategory,
  selectedItems,
  selectedPostItemIds,
  jobSelectedItems,
  items,
  selectedList,
  selectedCount,
  personImage,
  isProcessing,
  searchQuery,
  error,
  bgError,
  onCategoryChange,
  onSearchChange,
  onSelectItem,
  onDeselect,
  onTryOn,
}: VtonItemPanelProps) {
  const currentSelected = selectedItems[activeCategory];

  return (
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
                onClick={() => onCategoryChange(cat.key)}
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
              onChange={(e) => onSearchChange(e.target.value)}
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
                onClick={() => onSelectItem(item)}
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
                  <p className="truncate text-[10px] text-white/80">{item.title}</p>
                </div>
                {isSelected && (
                  <div className="absolute top-1 right-1 rounded-full bg-[#eafd67] p-0.5">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
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
                  onClick={() => onDeselect(item)}
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
          onClick={onTryOn}
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
            Upload a photo &amp; select items
          </p>
        )}

        {(error || bgError) && (
          <p className="mt-2 text-center text-xs text-red-400">
            {error || bgError?.error}
          </p>
        )}
      </div>
    </div>
  );
}
