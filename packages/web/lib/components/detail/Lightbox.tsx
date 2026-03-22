"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt?: string;
}

/**
 * Lightbox - Fullscreen image viewer with zoom capability
 *
 * Features:
 * - Fullscreen overlay with backdrop
 * - Pinch-to-zoom on touch devices
 * - Double-tap to toggle zoom
 * - Close via X button, backdrop click, or Escape key
 * - Smooth fade/scale animations
 */
export function Lightbox({ isOpen, onClose, imageUrl, alt }: LightboxProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  // Handle Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Reset zoom when closing
  useEffect(() => {
    if (!isOpen) {
      setIsZoomed(false);
    }
  }, [isOpen]);

  // Handle double-tap/click to zoom
  const handleImageClick = () => {
    setIsZoomed(!isZoomed);
  };

  // Handle backdrop click (close lightbox)
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking the backdrop, not the image
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[60] bg-black"
          onClick={handleBackdropClick}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="fixed right-4 top-4 z-[70] flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20"
            aria-label="Close fullscreen view"
          >
            <X className="h-5 w-5 text-white" />
          </button>

          {/* Image container */}
          <div className="flex h-full w-full items-center justify-center p-4">
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              transition={{ duration: 0.3 }}
              src={imageUrl}
              alt={alt || "Fullscreen image"}
              className={`max-h-full max-w-full object-contain transition-transform duration-300 ${
                isZoomed ? "cursor-zoom-out scale-150" : "cursor-zoom-in"
              }`}
              onClick={handleImageClick}
              style={{
                touchAction: "pinch-zoom",
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
