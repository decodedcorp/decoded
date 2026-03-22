/**
 * Main Page C — Avant-Garde Editorial Layout Types
 */

export interface MainCPost {
  id: string;
  imageUrl: string;
  artistName: string | null;
  /** Primary item brand found in this image */
  brand: string | null;
  /** Primary item product name */
  productName: string | null;
  /** Number of detected items in this image */
  itemCount: number;
}
