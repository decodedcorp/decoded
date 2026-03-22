import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

/**
 * Heading Variants
 *
 * Typography system for display and heading text.
 * Uses Playfair Display (font-serif) with responsive sizing.
 *
 * @see docs/design-system/decoded.pen
 * @see docs/design-system/typography.md
 */
export const headingVariants = cva(
  "font-serif tracking-tight", // Base styles for all headings
  {
    variants: {
      variant: {
        hero: "text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.1]",
        h1: "text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.15]",
        h2: "text-3xl md:text-4xl lg:text-5xl font-semibold leading-[1.2]",
        h3: "text-2xl md:text-3xl font-semibold leading-[1.25]",
        h4: "text-xl md:text-2xl font-semibold leading-[1.3]",
      },
    },
    defaultVariants: {
      variant: "h2",
    },
  }
);

type HeadingElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: HeadingElement;
}

/**
 * Heading Component
 *
 * Semantic heading component with design system variants.
 * Automatically maps variants to semantic HTML elements (h1, h2, h3, h4).
 * Override with `as` prop if needed.
 *
 * @example
 * <Heading variant="hero">Welcome</Heading>
 * <Heading variant="h1">Page Title</Heading>
 * <Heading variant="h2" as="h1">Section Title</Heading>
 */
export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, variant, as, children, ...props }, ref) => {
    // Map variant to default semantic element
    const defaultElement: Record<string, HeadingElement> = {
      hero: "h1",
      h1: "h1",
      h2: "h2",
      h3: "h3",
      h4: "h4",
    };

    const Component = as || defaultElement[variant || "h2"] || "h2";

    return (
      <Component
        ref={ref}
        className={cn(headingVariants({ variant }), className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Heading.displayName = "Heading";

/**
 * Text Variants
 *
 * Typography system for body text and UI labels.
 * Uses Inter (font-sans) with responsive sizing.
 *
 * @see docs/design-system/decoded.pen
 * @see docs/design-system/typography.md
 */
export const textVariants = cva(
  "font-sans", // Base styles for all text
  {
    variants: {
      variant: {
        body: "text-sm md:text-base leading-relaxed",
        small: "text-sm leading-normal",
        caption: "text-xs leading-snug",
        label: "text-sm font-medium",
        overline: "text-xs uppercase tracking-widest font-medium",
      },
      textColor: {
        default: "text-foreground",
        muted: "text-muted-foreground",
        primary: "text-primary",
        destructive: "text-destructive",
      },
    },
    defaultVariants: {
      variant: "body",
      textColor: "default",
    },
  }
);

type TextElement = "p" | "span" | "div" | "label";

export interface TextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "color">,
    VariantProps<typeof textVariants> {
  as?: TextElement;
}

/**
 * Text Component
 *
 * Semantic text component for body content and UI labels.
 * Supports textColor variants for different semantic uses.
 *
 * @example
 * <Text>Default body text</Text>
 * <Text variant="small" textColor="muted">Small muted text</Text>
 * <Text variant="label" as="label">Form label</Text>
 * <Text variant="overline">Section Label</Text>
 */
export const Text = forwardRef<HTMLElement, TextProps>(
  (
    { className, variant, textColor, as: Component = "p", children, ...props },
    ref
  ) => {
    return (
      <Component
        ref={ref as any}
        className={cn(textVariants({ variant, textColor }), className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Text.displayName = "Text";
