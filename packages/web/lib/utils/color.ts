/**
 * Utility for color extraction and naming
 */

export interface ColorResult {
  hex: string;
  name: string;
  isDark: boolean;
}

/**
 * Maps a HEX color to a fashion-friendly name
 */
export function getFashionColorName(hex: string): string {
  // Simple heuristic-based naming or specific color ranges
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Convert RGB to HSL for better categorization
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2 / 255;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (510 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  // Naming logic based on HSL
  if (l < 0.1) return "Obsidian";
  if (l > 0.9) return "Alabaster";
  if (s < 0.1) {
    if (l < 0.3) return "Charcoal";
    if (l < 0.7) return "Stone Gray";
    return "Silver";
  }

  const hue = h * 360;
  if (hue < 20) return l < 0.5 ? "Deep Terracotta" : "Soft Coral";
  if (hue < 45) return l < 0.5 ? "Sienna" : "Sand Beige";
  if (hue < 70) return l < 0.5 ? "Olive Drab" : "Pale Gold";
  if (hue < 160) return l < 0.5 ? "Forest Green" : "Sage";
  if (hue < 200) return l < 0.5 ? "Deep Teal" : "Sky Blue";
  if (hue < 260) return l < 0.5 ? "Midnight Blue" : "Lavender";
  if (hue < 320) return l < 0.5 ? "Plum" : "Dusty Rose";
  return "Crimson";
}

/**
 * Extracts dominant colors from an image URL using Canvas
 */
export async function extractDominantColors(
  imageUrl: string,
  colorCount: number = 4
): Promise<ColorResult[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Could not get canvas context");

        // Scale down for performance
        const size = 50;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const data = ctx.getImageData(0, 0, size, size).data;
        const colorMap: Record<string, number> = {};

        // Sample pixels
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a < 128) continue; // Skip transparent

          // Quantize to reduce noise (group similar colors)
          const qr = Math.round(r / 15) * 15;
          const qg = Math.round(g / 15) * 15;
          const qb = Math.round(b / 15) * 15;

          const hex = `#${((1 << 24) + (qr << 16) + (qg << 8) + qb).toString(16).slice(1)}`;
          colorMap[hex] = (colorMap[hex] || 0) + 1;
        }

        // Sort by frequency
        const sortedColors = Object.entries(colorMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, colorCount)
          .map(([hex]) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            const isDark = r * 0.299 + g * 0.587 + b * 0.114 < 128;

            return {
              hex,
              name: getFashionColorName(hex),
              isDark,
            };
          });

        resolve(sortedColors);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject("Image failed to load");
  });
}
