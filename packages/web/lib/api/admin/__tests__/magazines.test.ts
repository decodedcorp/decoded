import { describe, it, expect } from "vitest";
import {
  MAGAZINE_STATUSES,
  isValidMagazineStatus,
  type MagazineStatus,
} from "../magazines";

describe("MagazineStatus", () => {
  it("exports all 4 statuses", () => {
    expect(MAGAZINE_STATUSES).toEqual([
      "draft",
      "pending",
      "published",
      "rejected",
    ]);
  });

  it("isValidMagazineStatus returns true for valid", () => {
    expect(isValidMagazineStatus("pending")).toBe(true);
    expect(isValidMagazineStatus("published")).toBe(true);
    expect(isValidMagazineStatus("draft")).toBe(true);
    expect(isValidMagazineStatus("rejected")).toBe(true);
  });

  it("isValidMagazineStatus returns false for invalid", () => {
    expect(isValidMagazineStatus("foo")).toBe(false);
    expect(isValidMagazineStatus("")).toBe(false);
    expect(isValidMagazineStatus("PUBLISHED")).toBe(false);
  });

  it("MagazineStatus type narrows correctly", () => {
    const value: string = "pending";
    if (isValidMagazineStatus(value)) {
      const narrowed: MagazineStatus = value;
      expect(narrowed).toBe("pending");
    }
  });
});
