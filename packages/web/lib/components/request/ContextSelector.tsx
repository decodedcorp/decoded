"use client";

import { Sparkles } from "lucide-react";
import { type ContextType } from "@/lib/api";

interface ContextSelectorProps {
  value: ContextType | null;
  aiRecommendedContext?: string;
  onChange: (context: ContextType | null) => void;
}

const CONTEXT_OPTIONS: { value: ContextType; label: string; emoji: string }[] =
  [
    { value: "airport", label: "Airport", emoji: "✈️" },
    { value: "stage", label: "Stage", emoji: "🎤" },
    { value: "drama", label: "Drama", emoji: "🎬" },
    { value: "variety", label: "Variety", emoji: "📺" },
    { value: "daily", label: "Daily", emoji: "👕" },
    { value: "photoshoot", label: "Photoshoot", emoji: "📸" },
    { value: "event", label: "Event", emoji: "🎉" },
    { value: "other", label: "Other", emoji: "✨" },
  ];

export function ContextSelector({
  value,
  aiRecommendedContext,
  onChange,
}: ContextSelectorProps) {
  const isAiRecommended = (contextValue: ContextType) =>
    aiRecommendedContext === contextValue;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">Context</h3>
        <span className="text-xs text-muted-foreground">(Optional)</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {CONTEXT_OPTIONS.map(({ value: optionValue, label, emoji }) => {
          const isSelected = value === optionValue;
          const isRecommended = isAiRecommended(optionValue);

          return (
            <button
              key={optionValue}
              type="button"
              onClick={() => onChange(isSelected ? null : optionValue)}
              className={`
                relative flex items-center gap-1.5 px-3 py-1.5 rounded-full
                text-xs font-medium transition-all
                ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10"
                }
              `}
            >
              <span>{emoji}</span>
              <span>{label}</span>
              {isRecommended && !isSelected && (
                <Sparkles className="w-3 h-3 text-primary ml-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {aiRecommendedContext && !value && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-primary" />
          <span>
            AI suggests:{" "}
            {CONTEXT_OPTIONS.find((o) => o.value === aiRecommendedContext)
              ?.label || aiRecommendedContext}
          </span>
        </p>
      )}
    </div>
  );
}
