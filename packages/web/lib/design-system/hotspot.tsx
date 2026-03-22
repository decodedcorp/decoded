import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

/**
 * Generate consistent brand color from brand name using deterministic hash
 *
 * @param brand - Brand name string
 * @returns HSL color string (e.g., "hsl(210, 70%, 50%)")
 */
export function brandToColor(brand: string): string {
  let hash = 0;
  for (let i = 0; i < brand.length; i++) {
    hash = brand.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

/**
 * Hotspot Variants
 *
 * Interactive marker component for identifying items on images.
 * Used in item spotting/detection features.
 *
 * Design specs from decoded.pen:
 * - Hotspot/Default: 24x24px, primary fill (#CFFF4C), circle, pulsing animation
 * - Hotspot/Numbered: 32x32px, primary fill, shows number (Inter 14px fontWeight 600)
 * - Hotspot/Inactive: 24x24px, primary at 50% opacity, no animation
 *
 * Enhanced features:
 * - Selected state with scale and glow
 * - Reveal animation with delay for staggered entry
 * - Brand color glow effect
 *
 * @see docs/design-system/decoded.pen
 */
export const hotspotVariants = cva(
  [
    "absolute rounded-full cursor-pointer",
    "transition-transform duration-150 ease-out",
    "hover:scale-110 active:scale-95",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  ],
  {
    variants: {
      variant: {
        default: ["h-6 w-6 bg-primary", "animate-pulse-soft"],
        numbered: [
          "h-8 w-8 bg-primary",
          "flex items-center justify-center",
          "text-sm font-semibold text-primary-foreground",
        ],
        inactive: ["h-6 w-6 bg-primary/50"],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface HotspotPosition {
  /** X position as percentage (0-100) */
  x: number;
  /** Y position as percentage (0-100) */
  y: number;
}

export interface HotspotProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">,
    VariantProps<typeof hotspotVariants> {
  /** Position within parent container (percentages) */
  position: HotspotPosition;
  /** Number to display (only for "numbered" variant, 1-99) */
  number?: number;
  /** Item label for accessibility */
  label?: string;
  /** Optional brand color override (CSS color value, e.g., '#FF0000', 'rgb(...)', 'hsl(...)') */
  color?: string;
  /** Selected state - applies scale-125 and enhanced glow */
  selected?: boolean;
  /** Trigger spot-reveal entry animation */
  revealing?: boolean;
  /** Animation delay in milliseconds (for stagger based on Y position) */
  revealDelay?: number;
  /** Enable glow boxShadow effect */
  glow?: boolean;
}

/**
 * Hotspot Component
 *
 * Clickable marker for identifying items on images.
 * Position is specified as percentage coordinates for responsive layouts.
 *
 * IMPORTANT: Parent container must have `position: relative` for correct positioning.
 *
 * @example
 * // Default pulsing hotspot
 * <div className="relative">
 *   <Image src="..." alt="..." />
 *   <Hotspot
 *     position={{ x: 35, y: 60 }}
 *     onClick={() => handleItemClick(itemId)}
 *     label="Blue denim jacket"
 *   />
 * </div>
 *
 * @example
 * // Numbered hotspot with brand color and glow
 * <Hotspot
 *   variant="numbered"
 *   number={1}
 *   position={{ x: 20, y: 40 }}
 *   color={brandToColor("NIKE")}
 *   glow={true}
 *   onClick={handleClick}
 *   label="Item 1: Sneakers"
 * />
 *
 * @example
 * // Selected hotspot with enhanced glow
 * <Hotspot
 *   variant="numbered"
 *   number={2}
 *   position={{ x: 50, y: 50 }}
 *   selected={true}
 *   glow={true}
 *   label="Selected item"
 * />
 *
 * @example
 * // Revealing hotspot with staggered animation
 * <Hotspot
 *   variant="numbered"
 *   number={3}
 *   position={{ x: 30, y: 70 }}
 *   revealing={true}
 *   revealDelay={700}
 *   glow={true}
 *   label="NIKE: Air Max 90"
 *   onClick={handleClick}
 * />
 */
export const Hotspot = forwardRef<HTMLButtonElement, HotspotProps>(
  (
    {
      className,
      variant = "default",
      position,
      number,
      label,
      color,
      selected = false,
      revealing = false,
      revealDelay = 0,
      glow = false,
      style,
      ...props
    },
    ref
  ) => {
    // Clamp position values to valid range
    const clampedX = Math.max(0, Math.min(100, position.x));
    const clampedY = Math.max(0, Math.min(100, position.y));

    // Clamp number to displayable range
    const displayNumber =
      number !== undefined ? Math.max(1, Math.min(99, number)) : undefined;

    // Set CSS custom property for glow color
    const hotspotColor = color || "oklch(0.9519 0.1739 115.8446)";

    // Calculate glow shadow
    const glowShadow = glow
      ? selected
        ? `0 0 12px ${hotspotColor}, 0 0 24px color-mix(in oklch, ${hotspotColor} 50%, transparent)`
        : `0 0 8px color-mix(in oklch, ${hotspotColor} 50%, transparent)`
      : undefined;

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          hotspotVariants({ variant }),
          revealing && "animate-spot-reveal",
          selected && "scale-125",
          className
        )}
        style={{
          left: `${clampedX}%`,
          top: `${clampedY}%`,
          // Center the hotspot on the position point
          transform: "translate(-50%, -50%)",
          ...(color ? { backgroundColor: color } : {}),
          ...(revealing
            ? {
                opacity: 0,
                animationDelay: `${revealDelay}ms`,
              }
            : {}),
          ...(glowShadow ? { boxShadow: glowShadow } : {}),
          ["--hotspot-color" as string]: hotspotColor,
          ...style,
        }}
        aria-label={
          label || `Hotspot${displayNumber ? ` ${displayNumber}` : ""}`
        }
        {...props}
      >
        {variant === "numbered" && displayNumber !== undefined && displayNumber}
      </button>
    );
  }
);

Hotspot.displayName = "Hotspot";

/**
 * CSS Keyframes for pulse-soft animation
 *
 * Add this to your tailwind.config.js theme.extend:
 *
 * ```js
 * animation: {
 *   'pulse-soft': 'pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
 * },
 * keyframes: {
 *   'pulse-soft': {
 *     '0%, 100%': { transform: 'translate(-50%, -50%) scale(1)', opacity: '1' },
 *     '50%': { transform: 'translate(-50%, -50%) scale(1.15)', opacity: '0.8' },
 *   },
 * },
 * ```
 *
 * Alternatively, add to globals.css:
 *
 * ```css
 * @keyframes pulse-soft {
 *   0%, 100% {
 *     transform: translate(-50%, -50%) scale(1);
 *     opacity: 1;
 *   }
 *   50% {
 *     transform: translate(-50%, -50%) scale(1.15);
 *     opacity: 0.8;
 *   }
 * }
 * ```
 */
