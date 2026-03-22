import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

/**
 * NavBar Variants
 *
 * Container component for mobile bottom navigation bar.
 * Fixed at bottom on mobile, hidden on desktop.
 *
 * @see docs/design-system/decoded.pen - Mobile Nav Bar spec
 */
export const navBarVariants = cva(
  "z-50 md:hidden flex h-16 items-center justify-between border-t border-border bg-card px-6 py-2 pb-[calc(8px+env(safe-area-inset-bottom,0px))]",
  {
    variants: {
      position: {
        fixed: "fixed bottom-0 left-0 right-0",
        static: "",
      },
    },
    defaultVariants: {
      position: "fixed",
    },
  }
);

export interface NavBarProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof navBarVariants> {
  /**
   * NavItem children
   */
  children: React.ReactNode;
}

/**
 * NavBar Component
 *
 * Container for mobile bottom navigation bar per decoded.pen spec.
 *
 * Design spec:
 * - Height: 64px (h-16)
 * - Background: card color
 * - Border: top border with border color
 * - Padding: 8px 24px (px-6 py-2)
 * - Safe area: pb-[calc(8px+env(safe-area-inset-bottom,0px))]
 * - z-index: 50
 * - Hidden on desktop: md:hidden
 * - Children layout: flex items-center justify-between
 *
 * Features:
 * - Fixed positioning at bottom (default)
 * - Safe area support for iPhone notch
 * - Responsive: hidden on desktop (≥768px)
 * - Even spacing for nav items (justify-between)
 *
 * @example
 * <NavBar>
 *   <NavItem icon={<Home />} label="Home" href="/" />
 *   <NavItem icon={<Search />} label="Search" href="/search" />
 *   <NavItem icon={<User />} label="Profile" href="/profile" />
 * </NavBar>
 *
 * @example
 * // Static position for testing/storybook
 * <NavBar position="static">
 *   {navItems}
 * </NavBar>
 */
export const NavBar = forwardRef<HTMLElement, NavBarProps>(
  ({ className, children, position, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        role="navigation"
        aria-label="Main navigation"
        className={cn(navBarVariants({ position }), className)}
        {...props}
      >
        {children}
      </nav>
    );
  }
);

NavBar.displayName = "NavBar";
