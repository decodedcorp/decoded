"use client";

import { useState, useRef, useCallback } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { AuditItem } from "@/lib/api/admin/audit";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ItemEditorProps {
  items: AuditItem[];
  onItemsChange: (items: AuditItem[]) => void;
  onItemHover: (itemId: string | null) => void;
  highlightedItemId: string | null;
}

type EditingField = {
  itemId: string;
  field: "name" | "brand" | "confidence";
} | null;

// ─── Category options ──────────────────────────────────────────────────────────

const CATEGORIES: AuditItem["category"][] = [
  "tops",
  "bottoms",
  "shoes",
  "bags",
  "accessories",
  "outerwear",
];

// ─── Confidence display ───────────────────────────────────────────────────────

function ConfidenceDisplay({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const colorClass =
    value >= 0.85
      ? "text-emerald-600 dark:text-emerald-400"
      : value >= 0.7
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-red-600 dark:text-red-400";

  return <span className={`text-xs font-mono ${colorClass}`}>{pct}%</span>;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Inline editable item list for the detail modal.
 * Supports click-to-edit for name, category, brand, and confidence.
 * Delete uses sonner toast with 5-second undo window.
 * Hover syncs with hotspot highlighting on the image.
 */
export function ItemEditor({
  items,
  onItemsChange,
  onItemHover,
  highlightedItemId,
}: ItemEditorProps) {
  const [editingField, setEditingField] = useState<EditingField>(null);
  // Track draft value while editing (for cancel/revert)
  const draftRef = useRef<string>("");

  // ─── Edit helpers ──────────────────────────────────────────────────────────

  function startEdit(
    itemId: string,
    field: "name" | "brand" | "confidence",
    currentValue: string
  ) {
    setEditingField({ itemId, field });
    draftRef.current = currentValue;
  }

  function commitEdit(itemId: string, field: string, value: string) {
    setEditingField(null);

    onItemsChange(
      items.map((item) => {
        if (item.id !== itemId) return item;

        if (field === "name") return { ...item, name: value };
        if (field === "brand") return { ...item, brand: value };
        if (field === "confidence") {
          const parsed = parseFloat(value);
          const clamped = isNaN(parsed)
            ? item.confidence
            : Math.max(0, Math.min(1, parsed));
          return { ...item, confidence: clamped };
        }
        return item;
      })
    );
  }

  function cancelEdit() {
    setEditingField(null);
  }

  function handleCategoryChange(
    itemId: string,
    category: AuditItem["category"]
  ) {
    onItemsChange(
      items.map((item) => (item.id === itemId ? { ...item, category } : item))
    );
  }

  // ─── Delete with undo ──────────────────────────────────────────────────────

  const handleDelete = useCallback(
    (itemId: string) => {
      const index = items.findIndex((i) => i.id === itemId);
      const deletedItem = items[index];

      // Remove immediately
      const newItems = items.filter((i) => i.id !== itemId);
      onItemsChange(newItems);

      // Show undo toast
      toast("Item deleted", {
        duration: 5000,
        action: {
          label: "Undo",
          onClick: () => {
            // Re-insert at original position
            const restored = [...newItems];
            restored.splice(index, 0, deletedItem);
            onItemsChange(restored);
          },
        },
      });
    },
    [items, onItemsChange]
  );

  // ─── Add new item ──────────────────────────────────────────────────────────

  function handleAddItem() {
    const newItem: AuditItem = {
      id: `item-new-${Date.now()}`,
      name: "",
      category: "tops",
      brand: "",
      confidence: 0.8,
      position: { x: 50, y: 50 },
    };

    onItemsChange([...items, newItem]);

    // Auto-focus the name field after state update
    setTimeout(() => {
      setEditingField({ itemId: newItem.id, field: "name" });
      draftRef.current = "";
    }, 0);
  }

  // ─── Inline field renderers ────────────────────────────────────────────────

  function renderTextField(
    item: AuditItem,
    field: "name" | "brand",
    displayClassName: string,
    placeholder: string
  ) {
    const isEditing =
      editingField?.itemId === item.id && editingField?.field === field;

    if (isEditing) {
      return (
        <input
          autoFocus
          type="text"
          defaultValue={item[field]}
          placeholder={placeholder}
          className="text-sm bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 w-full min-w-0"
          onChange={(e) => {
            draftRef.current = e.target.value;
          }}
          onBlur={(e) => commitEdit(item.id, field, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            } else if (e.key === "Escape") {
              cancelEdit();
            }
          }}
        />
      );
    }

    return (
      <button
        type="button"
        onClick={() => startEdit(item.id, field, item[field])}
        className={`text-left w-full min-w-0 truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${displayClassName}`}
        title="Click to edit"
      >
        {item[field] || (
          <span className="text-gray-400 italic">{placeholder}</span>
        )}
      </button>
    );
  }

  function renderConfidenceField(item: AuditItem) {
    const isEditing =
      editingField?.itemId === item.id && editingField?.field === "confidence";

    if (isEditing) {
      return (
        <input
          autoFocus
          type="number"
          defaultValue={item.confidence}
          min={0}
          max={1}
          step={0.01}
          className="text-xs font-mono w-16 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500"
          onChange={(e) => {
            draftRef.current = e.target.value;
          }}
          onBlur={(e) => commitEdit(item.id, "confidence", e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            } else if (e.key === "Escape") {
              cancelEdit();
            }
          }}
        />
      );
    }

    return (
      <button
        type="button"
        onClick={() =>
          startEdit(item.id, "confidence", String(item.confidence))
        }
        className="hover:opacity-70 transition-opacity"
        title="Click to edit confidence"
      >
        <ConfidenceDisplay value={item.confidence} />
      </button>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col">
      {/* Item rows */}
      <div className="flex flex-col gap-1">
        {items.map((item, idx) => {
          const isHighlighted = item.id === highlightedItemId;

          return (
            <div
              key={item.id}
              onMouseEnter={() => onItemHover(item.id)}
              onMouseLeave={() => onItemHover(null)}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-lg group transition-colors",
                isHighlighted
                  ? "bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200 dark:ring-blue-800"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800/50",
              ].join(" ")}
            >
              {/* Index dot */}
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                {idx + 1}
              </span>

              {/* Name + brand block (takes remaining space) */}
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                {renderTextField(
                  item,
                  "name",
                  "text-sm font-medium text-gray-900 dark:text-gray-100",
                  "Item name"
                )}
                {renderTextField(
                  item,
                  "brand",
                  "text-xs text-gray-500 dark:text-gray-400",
                  "Brand"
                )}
              </div>

              {/* Category select */}
              <select
                value={item.category}
                onChange={(e) =>
                  handleCategoryChange(
                    item.id,
                    e.target.value as AuditItem["category"]
                  )
                }
                className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-0 focus:ring-1 focus:ring-blue-500 cursor-pointer capitalize"
                aria-label="Category"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="capitalize">
                    {cat}
                  </option>
                ))}
              </select>

              {/* Confidence */}
              {renderConfidenceField(item)}

              {/* Delete button */}
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-all"
                aria-label={`Delete ${item.name || "item"}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add item button */}
      <button
        type="button"
        onClick={handleAddItem}
        className="mt-3 mx-3 flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors self-start"
      >
        <Plus className="w-4 h-4" />
        Add Item
      </button>
    </div>
  );
}
