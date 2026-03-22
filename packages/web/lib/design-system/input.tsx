import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import { Search, X } from "lucide-react";

/**
 * Input Variants
 *
 * Form input component with icon slots, labels, and error states.
 * Integrates with design system tokens.
 *
 * @see docs/design-system/decoded.pen
 */
export const inputVariants = cva(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "",
        error: "border-destructive focus-visible:ring-destructive",
        search: "rounded-full pl-10 pr-10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  label?: string;
  helperText?: string;
  error?: string;
}

/**
 * Input Component
 *
 * Base input with optional icons, label, helper text, and error state.
 * Icon slots positioned absolutely with appropriate padding adjustments.
 *
 * @example
 * <Input label="Email" placeholder="you@example.com" />
 * <Input leftIcon={<Mail />} placeholder="Email" />
 * <Input error="Required field" />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      leftIcon,
      rightIcon,
      label,
      helperText,
      error,
      type = "text",
      ...props
    },
    ref
  ) => {
    const hasError = !!error;
    const effectiveVariant = hasError ? "error" : variant;

    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            type={type}
            className={cn(
              inputVariants({ variant: effectiveVariant }),
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>

        {helperText && !hasError && (
          <p className="mt-1.5 text-sm text-muted-foreground">{helperText}</p>
        )}

        {hasError && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export interface SearchInputProps
  extends Omit<InputProps, "leftIcon" | "rightIcon" | "variant"> {
  onClear?: () => void;
}

/**
 * SearchInput Component
 *
 * Specialized input for search functionality with built-in search icon
 * and clear button. Automatically shows clear button when value is present.
 *
 * @example
 * <SearchInput
 *   value={query}
 *   onChange={(e) => setQuery(e.target.value)}
 *   onClear={() => setQuery('')}
 * />
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onClear, placeholder = "Search...", className, ...props }, ref) => {
    const hasValue = value !== undefined && value !== "";

    const handleClear = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (onClear) {
        onClear();
      }
    };

    return (
      <Input
        ref={ref}
        value={value}
        placeholder={placeholder}
        variant="search"
        leftIcon={<Search className="h-4 w-4" />}
        rightIcon={
          hasValue ? (
            <button
              type="button"
              onClick={handleClear}
              className="pointer-events-auto cursor-pointer text-muted-foreground transition-opacity hover:text-foreground hover:opacity-80"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null
        }
        className={className}
        {...props}
      />
    );
  }
);

SearchInput.displayName = "SearchInput";
