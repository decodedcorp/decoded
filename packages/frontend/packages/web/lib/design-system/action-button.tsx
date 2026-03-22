import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

/**
 * ActionButton Variants
 *
 * Circular action button for icons (like, bookmark, share).
 * Three variants: default (semi-transparent), solid (primary), outline (bordered).
 *
 * @see docs/design-system/decoded.pen
 */
export const actionButtonVariants = cva(
  "inline-flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // ActionButton/Default: fill rgba(0,0,0,0.5), icon white
        default: "bg-black/50 text-white hover:bg-black/70 active:bg-black/80",
        // ActionButton/Solid: fill primary color, icon white
        solid:
          "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
        // ActionButton/Outline: transparent bg, stroke border 1px, icon foreground
        outline:
          "bg-transparent border border-border text-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
      },
      size: {
        sm: "h-8 w-8", // 32px
        md: "h-10 w-10", // 40px
        lg: "h-12 w-12", // 48px
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface ActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof actionButtonVariants> {
  /**
   * Icon to render inside the button.
   * Typically a Lucide React icon component.
   */
  icon: React.ReactNode;
}

/**
 * ActionButton Component
 *
 * Circular button for action icons (like, bookmark, share, etc.).
 * Three variants for different contexts:
 * - default: Semi-transparent black, for overlays
 * - solid: Primary color, for emphasis
 * - outline: Bordered transparent, for standard UI
 *
 * @example
 * <ActionButton icon={<Heart className="h-5 w-5" />} />
 * <ActionButton icon={<Bookmark className="h-5 w-5" />} variant="solid" />
 * <ActionButton icon={<Share className="h-5 w-5" />} variant="outline" size="sm" />
 */
export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ className, variant, size, icon, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(actionButtonVariants({ variant, size }), className)}
        {...props}
      >
        {icon}
      </button>
    );
  }
);

ActionButton.displayName = "ActionButton";
