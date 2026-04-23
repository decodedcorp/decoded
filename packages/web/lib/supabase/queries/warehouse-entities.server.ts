/**
 * Warehouse profile lookup — served by api-server `/api/v1/warehouse/profiles`.
 *
 * Previously queried the warehouse schema directly via supabase-js; after the
 * #265 refactor all warehouse reads go through api-server so web has no direct
 * DB coupling. The same cached lookup-map interface is preserved so callers
 * (`main-page.server.ts`, `app/page.tsx`) stay unchanged.
 */

import { cache } from "react";
import { API_BASE_URL } from "@/lib/server-env";

interface RawArtistOrGroup {
  id: string;
  name_ko?: string | null;
  name_en?: string | null;
  profile_image_url?: string | null;
}

interface RawBrand {
  id: string;
  name_ko?: string | null;
  name_en?: string | null;
  logo_image_url?: string | null;
}

interface WarehouseProfilesResponseShape {
  artists: RawArtistOrGroup[];
  groups: RawArtistOrGroup[];
  brands: RawBrand[];
}

const PROFILES_LIMIT_DEFAULT = 500;

const fetchProfiles = cache(
  async (
    limit = PROFILES_LIMIT_DEFAULT
  ): Promise<WarehouseProfilesResponseShape> => {
    const url = `${API_BASE_URL}/api/v1/warehouse/profiles?limit=${limit}`;
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        // Server-side fetch — cache per request; Next.js handles revalidation
        next: { revalidate: 60 },
      });
      if (!res.ok) {
        console.error(
          "[warehouse-entities] profiles fetch failed:",
          res.status
        );
        return { artists: [], groups: [], brands: [] };
      }
      return (await res.json()) as WarehouseProfilesResponseShape;
    } catch (err) {
      console.error("[warehouse-entities] profiles fetch error:", err);
      return { artists: [], groups: [], brands: [] };
    }
  }
);

/** Fetches artists via api-server. */
export async function fetchWarehouseArtists(limit = PROFILES_LIMIT_DEFAULT) {
  const { artists } = await fetchProfiles(limit);
  return artists;
}

/** Fetches groups via api-server. */
export async function fetchWarehouseGroups(limit = PROFILES_LIMIT_DEFAULT) {
  const { groups } = await fetchProfiles(limit);
  return groups;
}

/** Fetches brands via api-server. */
export async function fetchWarehouseBrands(limit = PROFILES_LIMIT_DEFAULT) {
  const { brands } = await fetchProfiles(limit);
  return brands;
}

/** Entry type returned by buildArtistProfileMap */
export interface ArtistProfileEntry {
  name: string;
  profileImageUrl: string | null;
}

/**
 * Builds a lookup map from lowercased artist/group names to profile data.
 *
 * Same behavior as before — indexes by both name_ko and name_en (lowercased).
 */
export const buildArtistProfileMap = cache(
  async (): Promise<Map<string, ArtistProfileEntry>> => {
    const map = new Map<string, ArtistProfileEntry>();
    const { artists, groups } = await fetchProfiles();

    const addEntity = (
      name_ko: string | null | undefined,
      name_en: string | null | undefined,
      profile_image_url: string | null | undefined
    ) => {
      const displayName = name_en || name_ko || "";
      if (!displayName) return;
      const entry: ArtistProfileEntry = {
        name: displayName,
        profileImageUrl: profile_image_url ?? null,
      };
      if (name_ko) map.set(name_ko.toLowerCase(), entry);
      if (name_en) map.set(name_en.toLowerCase(), entry);
    };

    for (const artist of artists) {
      addEntity(artist.name_ko, artist.name_en, artist.profile_image_url);
    }
    for (const group of groups) {
      addEntity(group.name_ko, group.name_en, group.profile_image_url);
    }

    return map;
  }
);

/** Brand profile entry for lookup by brand name or ID */
export interface BrandProfileEntry {
  name: string;
  profileImageUrl: string | null;
}

/**
 * Builds a lookup map from brand names (lowercased) and IDs to profile data.
 */
export const buildBrandProfileMap = cache(
  async (): Promise<Map<string, BrandProfileEntry>> => {
    const map = new Map<string, BrandProfileEntry>();
    const { brands } = await fetchProfiles();

    for (const brand of brands) {
      const displayName = brand.name_en || brand.name_ko || "";
      if (!displayName) continue;
      const entry: BrandProfileEntry = {
        name: displayName,
        profileImageUrl: brand.logo_image_url ?? null,
      };
      if (brand.name_ko) map.set(brand.name_ko.toLowerCase(), entry);
      if (brand.name_en) map.set(brand.name_en.toLowerCase(), entry);
      if (brand.id) map.set(brand.id, entry);
    }

    return map;
  }
);
