import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import Link from "next/link";

/**
 * NavItem Variants
 *
 * Navigation item component for mobile bottom navigation.
 * Supports both Link navigation and button actions (e.g., modal triggers).
 *
 * @see docs/design-system/decoded.pen - Mobile Nav Bar spec
 */
export const navItemVariants = cva(
  "flex flex-col items-center gap-1 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      state: {
        // Active: primary color
        active: "text-primary",
        // Inactive: muted-foreground
        inactive: "text-muted-foreground",
      },
      size: {
        sm: "[&>svg]:h-[18px] [&>svg]:w-[18px] [&>span]:text-[9px]",
        md: "[&>svg]:h-[22px] [&>svg]:w-[22px] [&>span]:text-[10px]",
        lg: "[&>svg]:h-[26px] [&>svg]:w-[26px] [&>span]:text-[11px]",
      },
    },
    defaultVariants: {
      state: "inactive",
      size: "md",
    },
  }
);

export interface NavItemProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "onClick">,
    VariantProps<typeof navItemVariants> {
  /**
   * Icon element to display
   */
  icon: React.ReactNode;
  /**
   * Label text below icon
   */
  label: string;
  /**
   * Whether this nav item is currently active
   */
  active?: boolean;
  /**
   * href for Link navigation
   */
  href?: string;
  /**
   * onClick handler for button actions (e.g., modal triggers)
   */
  onClick?: () => void;
  /**
   * Whether the nav item is disabled
   */
  disabled?: boolean;
}

/**
 * NavItem Component
 *
 * Navigation item for mobile bottom navigation bar.
 * Renders as Link when href provided, button when onClick provided.
 *
 * Features:
 * - Active state with primary color
 * - Inactive state with muted-foreground
 * - Hover effect on desktop only (@media hover)
 * - 150ms color transition
 * - Icon + label layout
 *
 * @example
 * // As Link
 * <NavItem icon={<Home />} label="Home" href="/" active />
 *
 * // As Button (modal trigger)
 * <NavItem icon={<PlusCircle />} label="Request" onClick={() => openModal()} />
 *
 * // Disabled
 * <NavItem icon={<User />} label="Profile" href="/profile" disabled />
 */
export const NavItem = forwardRef<HTMLElement, NavItemProps>(
  (
    {
      className,
      icon,
      label,
      active = false,
      href,
      onClick,
      disabled = false,
      size,
      ...props
    },
    ref
  ) => {
    const state = active ? "active" : "inactive";
    const variantClasses = cn(
      navItemVariants({ state, size }),
      // Hover effect only on desktop (avoid sticky hover on touch)
      !active && !disabled && "@media(hover:hover):hover:text-foreground",
      disabled && "opacity-40 cursor-not-allowed",
      className
    );

    // Label component
    const labelElement = <span className="font-medium">{label}</span>;

    // Disabled state
    if (disabled) {
      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          disabled
          className={variantClasses}
          aria-label={`${label} (coming soon)`}
          aria-disabled="true"
          {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          {icon}
          {labelElement}
        </button>
      );
    }

    // Link navigation
    if (href) {
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={variantClasses}
          aria-current={active ? "page" : undefined}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {icon}
          {labelElement}
        </Link>
      );
    }

    // Button action (e.g., modal trigger)
    if (onClick) {
      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          onClick={onClick}
          className={variantClasses}
          aria-label={label}
          {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          {icon}
          {labelElement}
        </button>
      );
    }

    // Fallback: render as div if neither href nor onClick
    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        className={variantClasses}
        {...(props as React.HTMLAttributes<HTMLDivElement>)}
      >
        {icon}
        {labelElement}
      </div>
    );
  }
);

NavItem.displayName = "NavItem";
