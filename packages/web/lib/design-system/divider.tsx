import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Text to display in the center of the divider
   * @default "or"
   */
  text?: string;
}

/**
 * Divider Component
 *
 * Horizontal divider with centered text between two lines.
 * Matches decoded.pen specs:
 * - Lines: #FFFFFF33 (white/20)
 * - Text: #FFFFFF66 (white/40), 12px font size
 *
 * @example
 * <Divider />
 * <Divider text="or continue with" />
 */
export const Divider = forwardRef<HTMLDivElement, DividerProps>(
  ({ className, text = "or", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative flex w-full items-center", className)}
        {...props}
      >
        <hr className="flex-1 border-t border-white/20" />
        <span className="px-3 text-xs text-white/40">{text}</span>
        <hr className="flex-1 border-t border-white/20" />
      </div>
    );
  }
);

Divider.displayName = "Divider";
