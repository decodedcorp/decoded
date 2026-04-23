/**
 * @vitest-environment jsdom
 */
import { describe, test, expect } from "vitest";
import {
  toMediaMetadataItems,
  fromMediaMetadataItems,
  mergeManualOverAi,
} from "@/lib/utils/mediaMetadata";
import type { MediaMetadataItem } from "@/lib/api/mutation-types";

describe("toMediaMetadataItems", () => {
  test("serializes structured fields to array preserving whitelist order", () => {
    const items = toMediaMetadataItems({
      platform: "Netflix",
      year: "2023",
      title: "The Glory",
    });
    expect(items).toEqual([
      { key: "title", value: "The Glory" },
      { key: "platform", value: "Netflix" },
      { key: "year", value: "2023" },
    ]);
  });

  test("omits empty strings and undefined", () => {
    const items = toMediaMetadataItems({
      platform: "",
      year: undefined,
      episode: "5",
    });
    expect(items).toEqual([{ key: "episode", value: "5" }]);
  });

  test("drops keys not on the whitelist (runtime defense)", () => {
    // @ts-expect-error — whitelist 외 key는 compile time에도 막혀야 하지만 런타임 방어 검증
    const items = toMediaMetadataItems({ platform: "N", random: "x" });
    expect(items.map((i) => i.key)).toEqual(["platform"]);
  });
});

describe("fromMediaMetadataItems", () => {
  test("reconstructs structured fields from wire array", () => {
    const state = fromMediaMetadataItems([
      { key: "year", value: "2023" },
      { key: "platform", value: "Netflix" },
    ]);
    expect(state).toEqual({ year: "2023", platform: "Netflix" });
  });

  test("ignores unknown keys", () => {
    const state = fromMediaMetadataItems([
      { key: "year", value: "2023" },
      { key: "unknown_key", value: "x" },
    ]);
    expect(state).toEqual({ year: "2023" });
  });

  test("last value wins for duplicate keys", () => {
    const state = fromMediaMetadataItems([
      { key: "year", value: "2022" },
      { key: "year", value: "2023" },
    ]);
    expect(state).toEqual({ year: "2023" });
  });
});

describe("mergeManualOverAi", () => {
  const ai: MediaMetadataItem[] = [
    { key: "title", value: "AI Title" },
    { key: "platform", value: "AI Netflix" },
  ];

  test("manual value overrides AI value for the same key", () => {
    const manual: MediaMetadataItem[] = [{ key: "title", value: "Manual" }];
    const merged = mergeManualOverAi(manual, ai);
    expect(merged).toContainEqual({ key: "title", value: "Manual" });
    expect(merged).toContainEqual({ key: "platform", value: "AI Netflix" });
  });

  test("keys unique to AI or manual are preserved", () => {
    const manual: MediaMetadataItem[] = [{ key: "year", value: "2024" }];
    const merged = mergeManualOverAi(manual, ai);
    expect(merged).toContainEqual({ key: "year", value: "2024" });
    expect(merged).toContainEqual({ key: "title", value: "AI Title" });
    expect(merged).toContainEqual({ key: "platform", value: "AI Netflix" });
  });

  test("result contains each key exactly once", () => {
    const manual: MediaMetadataItem[] = [
      { key: "title", value: "M" },
      { key: "year", value: "2024" },
    ];
    const merged = mergeManualOverAi(manual, ai);
    const keys = merged.map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
