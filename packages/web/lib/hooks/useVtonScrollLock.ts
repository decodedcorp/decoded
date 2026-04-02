import { useEffect } from "react";

/**
 * Locks body scroll when the VTON modal is open.
 * Restores all overflow/touchAction styles on cleanup.
 */
export function useVtonScrollLock(isOpen: boolean): void {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [isOpen]);
}
