"use client";

import { forwardRef } from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        className={cn(
          "flex flex-col items-center justify-center py-12 px-4",
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
          {icon || <Package className="w-8 h-8 text-muted-foreground" />}
        </div>

        <h3 className="text-base font-semibold text-foreground mb-2">
          {title}
        </h3>

        {description && (
          <p className="text-sm text-muted-foreground text-center max-w-xs mb-6">
            {description}
          </p>
        )}

        {action && (
          <button
            onClick={action.onClick}
            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";
