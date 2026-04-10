"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus, Loader2 } from "lucide-react";
import { supabaseBrowserClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { profileDashboardKeys } from "@/lib/hooks/useProfile";
import { toast } from "sonner";

const PRESET_COLORS = [
  "#1a1a1a",
  "#eafd67",
  "#f5f5f0",
  "#8b7355",
  "#c9302c",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#10b981",
];

interface StyleDNAEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  initialKeywords?: string[];
  initialColors?: string[];
}

export function StyleDNAEditModal({
  isOpen,
  onClose,
  userId,
  initialKeywords = [],
  initialColors = [],
}: StyleDNAEditModalProps) {
  const queryClient = useQueryClient();
  const [keywords, setKeywords] = useState<string[]>(initialKeywords);
  const [colors, setColors] = useState<string[]>(initialColors);
  const [newKeyword, setNewKeyword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const addKeyword = () => {
    const trimmed = newKeyword.trim();
    if (!trimmed || keywords.length >= 8 || keywords.includes(trimmed)) return;
    setKeywords([...keywords, trimmed]);
    setNewKeyword("");
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const toggleColor = (color: string) => {
    if (colors.includes(color)) {
      setColors(colors.filter((c) => c !== color));
    } else if (colors.length < 5) {
      setColors([...colors, color]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabaseBrowserClient
        .from("users")
        .update({
          style_dna: { keywords, colors, progress: keywords.length * 12.5 },
        })
        .eq("id", userId);

      if (error) throw error;

      queryClient.invalidateQueries({
        queryKey: profileDashboardKeys.extras(userId),
      });
      toast.success("Style DNA updated");
      onClose();
    } catch {
      toast.error("Failed to update Style DNA");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md bg-card rounded-xl border border-border shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                Edit Style DNA
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-4 space-y-5">
              {/* Keywords */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Keywords ({keywords.length}/8)
                </label>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="inline-flex items-center gap-1 border border-primary/30 text-primary rounded-full px-3 py-1 text-xs font-mono"
                    >
                      {keyword}
                      <button
                        onClick={() => removeKeyword(keyword)}
                        className="hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addKeyword())
                    }
                    placeholder="Add keyword..."
                    maxLength={20}
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={addKeyword}
                    disabled={!newKeyword.trim() || keywords.length >= 8}
                    className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Colors */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Palette ({colors.length}/5)
                </label>
                <div className="flex flex-wrap gap-3">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => toggleColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        colors.includes(color)
                          ? "border-primary scale-110 ring-2 ring-primary/30"
                          : "border-border hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
