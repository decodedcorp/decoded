"use client";

import { useState } from "react";
import { MousePointer2, PenTool, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

type Tool = "select" | "draw" | "zoom";

export interface DetectionToolbarProps {
  activeTool?: Tool;
  onToolChange?: (tool: Tool) => void;
  className?: string;
}

const TOOLS: { id: Tool; label: string; icon: typeof MousePointer2 }[] = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "draw", label: "Draw", icon: PenTool },
  { id: "zoom", label: "Zoom", icon: ZoomIn },
];

export function DetectionToolbar({
  activeTool: controlledTool,
  onToolChange,
  className,
}: DetectionToolbarProps) {
  const [internalTool, setInternalTool] = useState<Tool>("select");
  const activeTool = controlledTool ?? internalTool;

  const handleToolChange = (tool: Tool) => {
    setInternalTool(tool);
    onToolChange?.(tool);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full bg-card border border-border p-1",
        className
      )}
    >
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          onClick={() => handleToolChange(tool.id)}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            activeTool === tool.id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
          aria-label={tool.label}
          title={tool.label}
        >
          <tool.icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{tool.label}</span>
        </button>
      ))}
    </div>
  );
}
