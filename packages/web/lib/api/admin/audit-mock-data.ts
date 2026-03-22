/**
 * Mock data generators for AI audit analysis requests.
 *
 * No real AI analysis tables exist in the database — all audit data is
 * generated deterministically so that the same request index always produces
 * the same values across server restarts and requests.
 *
 * Uses the same djb2-style hashing as mock-data.ts.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuditStatus = "pending" | "completed" | "error" | "modified";

export interface AuditItem {
  /** Unique item ID within the request */
  id: string;
  /** Item name (e.g., "Oversized Denim Jacket") */
  name: string;
  /** Fashion category */
  category: "tops" | "bottoms" | "shoes" | "bags" | "accessories" | "outerwear";
  /** Brand name */
  brand: string;
  /** AI confidence score 0-1 */
  confidence: number;
  /** Hotspot position on image (percentage 0-100) */
  position: { x: number; y: number };
}

export interface AuditRequest {
  /** Unique request ID */
  id: string;
  /** Thumbnail image URL (picsum placeholder) */
  imageUrl: string;
  /** Original image dimensions */
  imageWidth: number;
  imageHeight: number;
  /** Analysis status */
  status: AuditStatus;
  /** Number of detected items */
  itemCount: number;
  /** Detected items (full detail) */
  items: AuditItem[];
  /** Request timestamp (ISO string) */
  requestedAt: string;
  /** Completion timestamp (ISO string, null if pending) */
  completedAt: string | null;
  /** Error message (only for error status) */
  errorMessage?: string;
  /** Requesting user display name */
  requestedBy: string;
}

// ─── Deterministic hash ───────────────────────────────────────────────────────

/**
 * Simple deterministic hash of a string → integer in [0, modulo).
 * Uses djb2-style hashing so the same input always returns the same output.
 */
function deterministicInt(seed: string, modulo: number): number {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash) ^ seed.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  return hash % modulo;
}

// ─── Data pools ───────────────────────────────────────────────────────────────

/** Fashion item name pool grouped by category */
const ITEM_POOL: Array<{ name: string; category: AuditItem["category"] }> = [
  // tops
  { name: "Oversized Cotton T-Shirt", category: "tops" },
  { name: "Striped Knit Sweater", category: "tops" },
  { name: "Cropped Button Blouse", category: "tops" },
  { name: "Graphic Print Hoodie", category: "tops" },
  // bottoms
  { name: "High-Waist Straight Jeans", category: "bottoms" },
  { name: "Pleated Wide-Leg Pants", category: "bottoms" },
  { name: "Cargo Jogger Pants", category: "bottoms" },
  { name: "A-Line Mini Skirt", category: "bottoms" },
  // shoes
  { name: "Chunky Leather Sneakers", category: "shoes" },
  { name: "Pointed-Toe Ankle Boots", category: "shoes" },
  { name: "Canvas Slip-On Shoes", category: "shoes" },
  { name: "Platform Loafers", category: "shoes" },
  // bags
  { name: "Quilted Crossbody Bag", category: "bags" },
  { name: "Leather Tote Bag", category: "bags" },
  { name: "Mini Bucket Bag", category: "bags" },
  { name: "Nylon Backpack", category: "bags" },
  // accessories
  { name: "Oval Sunglasses", category: "accessories" },
  { name: "Gold Chain Necklace", category: "accessories" },
  { name: "Wool Bucket Hat", category: "accessories" },
  { name: "Leather Belt", category: "accessories" },
  // outerwear
  { name: "Oversized Denim Jacket", category: "outerwear" },
  { name: "Belted Trench Coat", category: "outerwear" },
];

const BRANDS = [
  "ZARA",
  "H&M",
  "UNIQLO",
  "Nike",
  "Adidas",
  "COS",
  "Mango",
  "ARKET",
  "Massimo Dutti",
  "& Other Stories",
  "ASOS",
  "Topshop",
];

const USER_NAMES = [
  "Kim Minjun",
  "Lee Soyeon",
  "Park Jiwoo",
  "Choi Yuna",
  "Jung Haeun",
  "Kang Doha",
  "Yoon Siwoo",
  "Han Minji",
];

const ERROR_MESSAGES = [
  "Model timeout",
  "Image too low resolution",
  "Unsupported format",
];

// ─── Status distribution ──────────────────────────────────────────────────────

/**
 * Maps a request index (0-24) to its deterministic AuditStatus.
 * Distribution: 2 pending | 16 completed | 3 error | 4 modified
 */
function statusForIndex(index: number): AuditStatus {
  if (index <= 1) return "pending";
  if (index <= 17) return "completed";
  if (index <= 20) return "error";
  return "modified";
}

// ─── Item generator ───────────────────────────────────────────────────────────

/**
 * Generates deterministic AuditItems for a given request index.
 * Item count: 1-5 (determined by hash of "audit-{index}:count").
 */
function generateItemsForRequest(requestIndex: number): AuditItem[] {
  const countSeed = `audit-${requestIndex}:count`;
  // Hash gives [0, 5), add 1 → [1, 5]
  const count = 1 + deterministicInt(countSeed, 5);

  const items: AuditItem[] = [];

  for (let i = 0; i < count; i++) {
    const base = `audit-${requestIndex}:item-${i}`;

    // Pick item from pool
    const poolIndex = deterministicInt(base + ":pool", ITEM_POOL.length);
    const { name, category } = ITEM_POOL[poolIndex];

    // Pick brand
    const brandIndex = deterministicInt(base + ":brand", BRANDS.length);
    const brand = BRANDS[brandIndex];

    // Confidence: 0.60-0.98 range (38 increments of 0.01)
    const confidenceSteps = deterministicInt(base + ":conf", 39); // [0, 38]
    const confidence = Math.round((0.6 + confidenceSteps * 0.01) * 100) / 100;

    // Position: x in [15, 85], y in [15, 85]
    // Spread out items by using different seeds per axis
    const xSteps = deterministicInt(base + ":px", 71); // [0, 70] → [15, 85]
    const ySteps = deterministicInt(base + ":py", 71); // [0, 70] → [15, 85]
    const position = { x: 15 + xSteps, y: 15 + ySteps };

    items.push({
      id: `item-${requestIndex}-${i}`,
      name,
      category,
      brand,
      confidence,
      position,
    });
  }

  return items;
}

// ─── Timestamp generator ──────────────────────────────────────────────────────

/**
 * Generates a deterministic requestedAt timestamp for a given request index.
 * Spreads 25 requests over the last 14 days (most recent index = most recent date).
 * Index 0 is most recent; index 24 is oldest.
 */
function timestampForIndex(index: number): {
  requestedAt: string;
  completedAt: string | null;
  status: AuditStatus;
} {
  const status = statusForIndex(index);

  // Index 0 = today, index 24 = 14 days ago (spread across 14 days)
  const daysAgo = Math.floor((index / 24) * 14);

  // Deterministic hour/minute within that day
  const hour = deterministicInt(`audit-${index}:hour`, 24);
  const minute = deterministicInt(`audit-${index}:min`, 60);

  const requestedDate = new Date();
  requestedDate.setUTCDate(requestedDate.getUTCDate() - daysAgo);
  requestedDate.setUTCHours(hour, minute, 0, 0);

  const requestedAt = requestedDate.toISOString();

  let completedAt: string | null = null;
  if (status === "completed" || status === "modified" || status === "error") {
    // Completion is 5-60 minutes after request (deterministic)
    const processingMinutes = 5 + deterministicInt(`audit-${index}:proc`, 56);
    const completedDate = new Date(
      requestedDate.getTime() + processingMinutes * 60 * 1000
    );
    completedAt = completedDate.toISOString();
  }

  return { requestedAt, completedAt, status };
}

// ─── Main generators ──────────────────────────────────────────────────────────

let _cachedRequests: AuditRequest[] | null = null;

/**
 * Generates exactly 25 deterministic AI audit requests.
 *
 * Results are cached in-process for performance (module-level singleton).
 * Status distribution: 2 pending | 16 completed | 3 error | 4 modified
 */
export function generateAuditRequests(): AuditRequest[] {
  if (_cachedRequests) return _cachedRequests;

  const requests: AuditRequest[] = [];

  for (let i = 0; i < 25; i++) {
    const id = `audit-${1001 + i}`;
    const imageUrl = `https://picsum.photos/seed/audit${i}/800/1000`;
    const imageWidth = 800;
    const imageHeight = 1000;

    const { requestedAt, completedAt, status } = timestampForIndex(i);
    const items = generateItemsForRequest(i);

    // requestedBy: pick from user pool
    const userIndex = deterministicInt(`audit-${i}:user`, USER_NAMES.length);
    const requestedBy = USER_NAMES[userIndex];

    const request: AuditRequest = {
      id,
      imageUrl,
      imageWidth,
      imageHeight,
      status,
      itemCount: items.length,
      items,
      requestedAt,
      completedAt,
      requestedBy,
    };

    if (status === "error") {
      const errIndex = deterministicInt(
        `audit-${i}:err`,
        ERROR_MESSAGES.length
      );
      request.errorMessage = ERROR_MESSAGES[errIndex];
    }

    requests.push(request);
  }

  _cachedRequests = requests;
  return requests;
}

/**
 * Looks up a single audit request by ID.
 *
 * @param id - Request ID (e.g., "audit-1001")
 * @returns The matching AuditRequest, or undefined if not found
 */
export function getAuditRequestById(id: string): AuditRequest | undefined {
  const requests = generateAuditRequests();
  return requests.find((r) => r.id === id);
}
