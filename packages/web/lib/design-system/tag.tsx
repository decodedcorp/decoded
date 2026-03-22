import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

/**
 * Tag Variants
 *
 * Category tag component with pill shape and category-specific colors.
 * Used for content filtering and category display.
 *
 * @see docs/design-system/decoded.pen
 */
export const tagVariants = cva(
  "inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      category: {
        // Tag/All: fill #1A1A2E (dark), text white
        all: "bg-[#1A1A2E] text-white hover:bg-[#1A1A2E]/90",
        // Tag/Latest: fill #FEF3C7 (amber-100), text #92400E (amber-800)
        latest: "bg-amber-100 text-amber-800 hover:bg-amber-200",
        // Tag/Clothing: fill #FCE7F3 (pink-100), text #831843 (pink-900)
        clothing: "bg-pink-100 text-pink-900 hover:bg-pink-200",
        // Tag/Accessories: fill #EDE9FE (violet-100), text #5B21B6 (violet-800)
        accessories: "bg-violet-100 text-violet-800 hover:bg-violet-200",
        // Tag/Shoes: fill #E0F2FE (sky-100), text #075985 (sky-800)
        shoes: "bg-sky-100 text-sky-800 hover:bg-sky-200",
        // Tag/Bags: fill #F5F5F4 (stone-100), text #57534E (stone-600)
        bags: "bg-stone-100 text-stone-600 hover:bg-stone-200",
      },
      size: {
        sm: "h-6 px-3 text-[10px]",
        md: "h-8 px-4 text-xs",
        lg: "h-10 px-5 text-sm",
      },
      active: {
        true: "ring-2 ring-ring ring-offset-2",
        false: "",
      },
    },
    defaultVariants: {
      category: "all",
      size: "md",
      active: false,
    },
  }
);

export interface TagProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof tagVariants> {
  /**
   * Whether the tag is currently active/selected
   */
  active?: boolean;
}

/**
 * Tag Component
 *
 * Category tag with pill shape and category-specific colors.
 * Renders as a button for filter interaction.
 *
 * @example
 * <Tag category="clothing">Clothing</Tag>
 * <Tag category="shoes" size="sm" active>Shoes</Tag>
 * <Tag category="all" onClick={() => handleFilter('all')}>All</Tag>
 */
export const Tag = forwardRef<HTMLButtonElement, TagProps>(
  ({ className, category, size, active, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(tagVariants({ category, size, active }), className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Tag.displayName = "Tag";
