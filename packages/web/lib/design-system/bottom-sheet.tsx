"use client";

import {
  useRef,
  useEffect,
  useCallback,
  useState,
  forwardRef,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export interface BottomSheetProps {
  /** Whether the sheet is open */
  isOpen: boolean;
  /** Callback when sheet should close */
  onClose?: () => void;
  /** Snap points as viewport height percentages */
  snapPoints?: number[];
  /** Default snap point when opened */
  defaultSnapPoint?: number;
  /** Sheet content */
  children: ReactNode;
  /** Custom header content */
  header?: ReactNode;
  /** Sheet title (rendered in header if no custom header) */
  title?: string;
  /** Callback when snap point changes */
  onSnapChange?: (snapPoint: number) => void;
  /** Additional class name */
  className?: string;
  /** Backdrop overlay classes (e.g. z-index above fixed UI) */
  backdropClassName?: string;
  /** Center content vertically and horizontally */
  contentCenter?: boolean;
}

/**
 * BottomSheet Component
 *
 * Draggable bottom sheet with snap points following decoded.pen specs:
 * - Background: #242424
 * - Handle: 40x4px #3D3D3D with rounded corners
 * - Rounded top corners (20px)
 * - Backdrop overlay with black/50 opacity
 *
 * @example
 * <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)}>
 *   <div className="p-5">Content</div>
 * </BottomSheet>
 *
 * @example
 * <BottomSheet
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Filter Options"
 *   snapPoints={[0.4, 0.8]}
 *   defaultSnapPoint={0.4}
 * >
 *   <FilterContent />
 * </BottomSheet>
 */
export const BottomSheet = forwardRef<HTMLDivElement, BottomSheetProps>(
  (
    {
      isOpen,
      onClose,
      snapPoints = [0.3, 0.6, 0.9],
      defaultSnapPoint = 0.3,
      children,
      header,
      title,
      onSnapChange,
      className,
      backdropClassName,
      contentCenter = false,
    },
    ref
  ) => {
    const sheetRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [currentSnap, setCurrentSnap] = useState(defaultSnapPoint);
    const [isDragging, setIsDragging] = useState(false);
    const startYRef = useRef(0);
    const startSnapRef = useRef(0);

    // Find nearest snap point
    const findNearestSnap = useCallback(
      (value: number): number => {
        return snapPoints.reduce((prev, curr) =>
          Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
        );
      },
      [snapPoints]
    );

    // Handle drag start
    const handleDragStart = useCallback(
      (clientY: number) => {
        setIsDragging(true);
        startYRef.current = clientY;
        startSnapRef.current = currentSnap;
      },
      [currentSnap]
    );

    // Handle drag move
    const handleDragMove = useCallback(
      (clientY: number) => {
        if (!isDragging) return;

        const deltaY = startYRef.current - clientY;
        const viewportHeight = window.innerHeight;
        const deltaPercent = deltaY / viewportHeight;

        let newSnap = startSnapRef.current + deltaPercent;
        newSnap = Math.max(
          snapPoints[0],
          Math.min(snapPoints.at(-1)!, newSnap)
        );

        setCurrentSnap(newSnap);
      },
      [isDragging, snapPoints]
    );

    // Handle drag end
    const handleDragEnd = useCallback(() => {
      if (!isDragging) return;
      setIsDragging(false);

      const nearestSnap = findNearestSnap(currentSnap);
      setCurrentSnap(nearestSnap);
      onSnapChange?.(nearestSnap);

      // Close if dragged below minimum snap
      if (currentSnap < snapPoints[0] * 0.5) {
        onClose?.();
      }
    }, [
      isDragging,
      currentSnap,
      findNearestSnap,
      onSnapChange,
      snapPoints,
      onClose,
    ]);

    // Touch event handlers
    const handleTouchStart = useCallback(
      (e: React.TouchEvent) => {
        handleDragStart(e.touches[0].clientY);
      },
      [handleDragStart]
    );

    const handleTouchMove = useCallback(
      (e: React.TouchEvent) => {
        handleDragMove(e.touches[0].clientY);
      },
      [handleDragMove]
    );

    const handleTouchEnd = useCallback(() => {
      handleDragEnd();
    }, [handleDragEnd]);

    // Mouse event handlers (for desktop testing)
    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        handleDragStart(e.clientY);
      },
      [handleDragStart]
    );

    useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        handleDragMove(e.clientY);
      };

      const handleMouseUp = () => {
        handleDragEnd();
      };

      if (isDragging) {
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
      }

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }, [isDragging, handleDragMove, handleDragEnd]);

    // Reset to default snap when opened
    useEffect(() => {
      if (isOpen) {
        setCurrentSnap(defaultSnapPoint);
      }
    }, [isOpen, defaultSnapPoint]);

    // Handle escape key
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && isOpen) {
          onClose?.();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sheetHeight = `${currentSnap * 100}%`;

    return (
      <>
        {/* Backdrop overlay */}
        <div
          className={cn("fixed inset-0 z-40 bg-black/50", backdropClassName)}
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Sheet */}
        <div
          ref={ref || sheetRef}
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50 flex flex-col",
            "bg-[#242424] rounded-t-[20px]",
            "shadow-[0_-4px_20px_rgba(0,0,0,0.3)]",
            "pb-[env(safe-area-inset-bottom,0px)]",
            isDragging ? "" : "transition-[height] duration-300 ease-out",
            className
          )}
          style={{
            height: sheetHeight,
            maxHeight: "90vh",
          }}
          role="dialog"
          aria-modal="true"
        >
          {/* Drag handle - 40x4px #3D3D3D per decoded.pen */}
          <div
            className="shrink-0 flex items-center justify-center py-3 cursor-grab active:cursor-grabbing touch-none select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
          >
            <div className="w-10 h-1 bg-[#3D3D3D] rounded-sm" />
          </div>

          {/* Header with title */}
          {(header || title) && (
            <div className="shrink-0 px-5 pb-4 border-b border-border">
              {header || (
                <h2 className="text-lg font-semibold text-white">{title}</h2>
              )}
            </div>
          )}

          {/* Content - flex-1 min-h-0 for proper overflow scroll */}
          <div
            ref={contentRef}
            className={cn(
              "flex-1 min-h-0 overflow-y-auto overscroll-contain p-5",
              contentCenter && "flex flex-col items-center justify-center"
            )}
            style={{
              paddingBottom: "max(2rem, env(safe-area-inset-bottom, 32px))",
            }}
          >
            {children}
          </div>
        </div>
      </>
    );
  }
);

BottomSheet.displayName = "BottomSheet";
