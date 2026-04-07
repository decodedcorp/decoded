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
    { value: "daily", label: "Daily", emoji: "👕" },
    { value: "street", label: "Street", emoji: "🚶" },
    { value: "airport", label: "Airport", emoji: "✈️" },
    { value: "stage", label: "Stage", emoji: "🎤" },
    { value: "photoshoot", label: "Photoshoot", emoji: "📸" },
    { value: "brand_campaign", label: "Campaign", emoji: "💎" },
    { value: "event", label: "Event", emoji: "🎉" },
    { value: "drama", label: "Drama", emoji: "🎬" },
    { value: "variety", label: "Variety", emoji: "📺" },
    { value: "sns", label: "SNS", emoji: "📱" },
    { value: "fan_meeting", label: "Fan Meeting", emoji: "🤝" },
    { value: "interview", label: "Interview", emoji: "🎙️" },
  ];

export { CONTEXT_OPTIONS };

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
        {aiRecommendedContext && !value && (
          <span className="flex items-center gap-1 text-[10px] text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded-full">
            <Sparkles className="w-2.5 h-2.5" />
            AI
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CONTEXT_OPTIONS.map(({ value: optionValue, label, emoji }) => {
          const isSelected = value === optionValue;
          const isRecommended = isAiRecommended(optionValue);

          return (
            <button
              key={optionValue}
              type="button"
              onClick={() => onChange(isSelected ? null : optionValue)}
              className={`
                relative flex items-center gap-1 px-2.5 py-1 rounded-full
                text-xs font-medium transition-all duration-150
                ${
                  isSelected
                    ? "bg-foreground text-background shadow-sm"
                    : isRecommended
                      ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                      : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10 hover:text-foreground/80"
                }
              `}
            >
              <span className="text-[11px]">{emoji}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
