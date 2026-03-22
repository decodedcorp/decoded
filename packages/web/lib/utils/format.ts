/**
 * Number and text formatting utilities
 *
 * Provides consistent formatting for statistics, numbers, and text throughout the application.
 */

/**
 * Format large numbers with abbreviations
 *
 * Uses Intl.NumberFormat for proper locale handling and compact notation.
 * Numbers < 1,000 display as-is with locale formatting.
 * Numbers >= 1,000 display with K/M abbreviations.
 *
 * @param value - Numeric value to format
 * @returns Formatted string (e.g., "1.2K", "1.2M", "999")
 *
 * @example
 * formatStatValue(999)       // "999"
 * formatStatValue(1234)      // "1.2K"
 * formatStatValue(1234567)   // "1.2M"
 * formatStatValue(1000)      // "1K"
 */
export function formatStatValue(value: number): string {
  if (value >= 1_000_000) {
    return new Intl.NumberFormat("en", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  if (value >= 1_000) {
    return new Intl.NumberFormat("en", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return value.toLocaleString();
}
