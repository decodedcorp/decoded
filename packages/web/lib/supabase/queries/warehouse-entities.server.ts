/**
 * Warehouse entity query functions for artists and groups.
 *
 * These functions query the warehouse schema for proper entity data
 * (profile images, canonical names) to enrich main page sections.
 * All queries use createWarehouseServerClient and fail gracefully.
 */

import { cache } from "react";
import { createWarehouseServerClient } from "@/lib/supabase/warehouse";
import type {
  ArtistRow,
  GroupRow,
  BrandRow,
} from "@/lib/supabase/warehouse-types";

/**
 * Fetches artists from warehouse.artists with profile images.
 *
 * @param limit - Maximum number of artists to fetch (default: 50)
 * @returns Array of ArtistRow, empty on error
 */
export async function fetchWarehouseArtists(limit = 500): Promise<ArtistRow[]> {
  try {
    const wh = await createWarehouseServerClient();
    const { data, error } = await wh
      .from("artists")
      .select(
        "id, name_ko, name_en, profile_image_url, primary_instagram_account_id, metadata, created_at, updated_at"
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[warehouse-entities] fetchWarehouseArtists error:", error);
      return [];
    }

    return (data ?? []) as ArtistRow[];
  } catch (err) {
    console.error(
      "[warehouse-entities] fetchWarehouseArtists unexpected error:",
      err
    );
    return [];
  }
}

/**
 * Fetches groups from warehouse.groups with profile images.
 *
 * @param limit - Maximum number of groups to fetch (default: 50)
 * @returns Array of GroupRow, empty on error
 */
export async function fetchWarehouseGroups(limit = 500): Promise<GroupRow[]> {
  try {
    const wh = await createWarehouseServerClient();
    const { data, error } = await wh
      .from("groups")
      .select(
        "id, name_ko, name_en, profile_image_url, primary_instagram_account_id, metadata, created_at, updated_at"
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[warehouse-entities] fetchWarehouseGroups error:", error);
      return [];
    }

    return (data ?? []) as GroupRow[];
  } catch (err) {
    console.error(
      "[warehouse-entities] fetchWarehouseGroups unexpected error:",
      err
    );
    return [];
  }
}

/** Entry type returned by buildArtistProfileMap */
export interface ArtistProfileEntry {
  name: string;
  profileImageUrl: string | null;
}

/**
 * Builds a lookup map from lowercased artist/group names to profile data.
 *
 * Fetches both artists and groups in parallel and indexes each entity by
 * both name_ko and name_en (lowercased) so callers can look up by raw
 * text from public.posts regardless of language or casing.
 *
 * Example: { "karina" => { name: "Karina", profileImageUrl: "https://..." },
 *            "카리나" => { name: "카리나", profileImageUrl: "https://..." } }
 *
 * @returns Map keyed by lowercased name, empty Map on error
 */
export const buildArtistProfileMap = cache(
  async (): Promise<Map<string, ArtistProfileEntry>> => {
    const map = new Map<string, ArtistProfileEntry>();

    try {
      const [artists, groups] = await Promise.all([
        fetchWarehouseArtists(),
        fetchWarehouseGroups(),
      ]);

      const addEntity = (
        name_ko: string | null,
        name_en: string | null,
        profile_image_url: string | null
      ) => {
        // Prefer Korean name as display name (primary market), fall back to English
        const displayName = name_ko || name_en || "";
        if (!displayName) return;

        const entry: ArtistProfileEntry = {
          name: displayName,
          profileImageUrl: profile_image_url,
        };

        if (name_ko) {
          map.set(name_ko.toLowerCase(), entry);
        }
        if (name_en) {
          // English name uses English display name for readability
          const enEntry: ArtistProfileEntry = {
            name: name_en,
            profileImageUrl: profile_image_url,
          };
          map.set(name_en.toLowerCase(), enEntry);
        }
      };

      for (const artist of artists) {
        addEntity(artist.name_ko, artist.name_en, artist.profile_image_url);
      }
      for (const group of groups) {
        addEntity(group.name_ko, group.name_en, group.profile_image_url);
      }
    } catch (err) {
      console.error(
        "[warehouse-entities] buildArtistProfileMap unexpected error:",
        err
      );
    }

    return map;
  }
);

/**
 * Fetches brands from warehouse.brands with logo images.
 *
 * @param limit - Maximum number of brands to fetch (default: 100)
 * @returns Array of BrandRow, empty on error
 */
export async function fetchWarehouseBrands(limit = 500): Promise<BrandRow[]> {
  try {
    const wh = await createWarehouseServerClient();
    const { data, error } = await wh
      .from("brands")
      .select(
        "id, name_ko, name_en, logo_image_url, primary_instagram_account_id, metadata, created_at, updated_at"
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[warehouse-entities] fetchWarehouseBrands error:", error);
      return [];
    }

    return (data ?? []) as BrandRow[];
  } catch (err) {
    console.error(
      "[warehouse-entities] fetchWarehouseBrands unexpected error:",
      err
    );
    return [];
  }
}

/** Brand profile entry for lookup by brand name or ID */
export interface BrandProfileEntry {
  name: string;
  profileImageUrl: string | null;
}

/**
 * Builds a lookup map from brand names (lowercased) to profile data.
 *
 * Fetches brands and indexes each by name_ko, name_en (lowercased),
 * and by ID so callers can look up by raw text or brand_id.
 *
 * @returns Map keyed by lowercased name or brand ID, empty Map on error
 */
export const buildBrandProfileMap = cache(
  async (): Promise<Map<string, BrandProfileEntry>> => {
    const map = new Map<string, BrandProfileEntry>();

    try {
      const brands = await fetchWarehouseBrands();

      for (const brand of brands) {
        const displayName = brand.name_en || brand.name_ko || "";
        if (!displayName) continue;

        const entry: BrandProfileEntry = {
          name: displayName,
          profileImageUrl: brand.logo_image_url,
        };

        if (brand.name_ko) map.set(brand.name_ko.toLowerCase(), entry);
        if (brand.name_en) map.set(brand.name_en.toLowerCase(), entry);
        // Also key by ID for brand_id lookup
        if (brand.id) map.set(brand.id, entry);
      }
    } catch (err) {
      console.error("[warehouse-entities] buildBrandProfileMap error:", err);
    }

    return map;
  }
);
