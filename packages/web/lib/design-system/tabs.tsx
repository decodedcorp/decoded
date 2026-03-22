"use client";

import { createContext, useContext, forwardRef } from "react";
import { motion } from "motion/react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * TabItem Variants
 *
 * Generic tab item with active/inactive states.
 * Used within Tabs component for navigation.
 *
 * @see docs/design-system/decoded.pen
 */
export const tabItemVariants = cva(
  "relative px-4 py-3 text-sm font-medium transition-colors",
  {
    variants: {
      state: {
        active: "text-foreground",
        inactive: "text-muted-foreground hover:text-foreground",
      },
    },
    defaultVariants: {
      state: "inactive",
    },
  }
);

/**
 * Tabs Context
 *
 * Provides active value, onValueChange, and layoutId to TabItem children
 */
interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
  layoutId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("TabItem must be used within Tabs");
  }
  return context;
}

/**
 * Tabs Props
 */
export interface TabsProps {
  /**
   * TabItem children
   */
  children: React.ReactNode;
  /**
   * Current active tab id
   */
  value: string;
  /**
   * Handler when tab changes
   */
  onValueChange: (value: string) => void;
  /**
   * Custom className for tabs container
   */
  className?: string;
  /**
   * LayoutId for motion sliding underline animation
   * Defaults to "tabs-underline"
   */
  layoutId?: string;
}

/**
 * Tabs Component
 *
 * Generic tabs container with sliding underline animation.
 * Provides context to TabItem children.
 *
 * @example
 * <Tabs value="all" onValueChange={setTab}>
 *   <TabItem value="all">All</TabItem>
 *   <TabItem value="media" count={42}>Media</TabItem>
 * </Tabs>
 */
export function Tabs({
  children,
  value,
  onValueChange,
  className,
  layoutId = "tabs-underline",
}: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange, layoutId }}>
      <div
        role="tablist"
        className={cn(
          "flex items-center gap-1 border-b border-border",
          className
        )}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}

/**
 * TabItem Props
 */
export interface TabItemProps {
  /**
   * Unique tab id
   */
  value: string;
  /**
   * Tab label content
   */
  children: React.ReactNode;
  /**
   * Optional count display (shows as "Label (count)")
   */
  count?: number;
  /**
   * Custom className
   */
  className?: string;
}

/**
 * TabItem Component
 *
 * Individual tab item with active state and optional count.
 * Must be used within Tabs component.
 *
 * Features:
 * - Active state styling
 * - Sliding underline animation on active tab
 * - Optional count display in "Label (count)" format
 * - Spring animation for underline
 *
 * @example
 * <TabItem value="all">All</TabItem>
 * <TabItem value="media" count={42}>Media</TabItem>
 */
export const TabItem = forwardRef<HTMLButtonElement, TabItemProps>(
  ({ value, children, count, className }, ref) => {
    const { value: activeValue, onValueChange, layoutId } = useTabsContext();
    const isActive = activeValue === value;

    // Format count display: "Label (count)" or "Label (999+)"
    const displayContent =
      count !== undefined && count > 0 ? (
        <>
          {children} ({count > 999 ? "999+" : count})
        </>
      ) : (
        children
      );

    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={isActive}
        onClick={() => onValueChange(value)}
        className={cn(
          tabItemVariants({ state: isActive ? "active" : "inactive" }),
          className
        )}
      >
        {displayContent}
        {/* Animated sliding underline indicator */}
        {isActive && (
          <motion.span
            layoutId={layoutId}
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
      </button>
    );
  }
);

TabItem.displayName = "TabItem";
