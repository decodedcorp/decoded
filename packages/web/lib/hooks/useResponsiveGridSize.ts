"use client";

import { useState, useEffect } from "react";

/**
 * Hook to calculate responsive grid size based on window width
 * @returns gridSize - Size of each grid cell in pixels
 */
export const useResponsiveGridSize = () => {
  const [gridSize, setGridSize] = useState(80);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setGridSize(60); // Smaller on mobile
      } else if (width < 1024) {
        setGridSize(80); // Medium on tablet
      } else {
        setGridSize(100); // Larger on desktop
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return gridSize;
};
