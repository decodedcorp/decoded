import { describe, it, expect } from "vitest";
import {
  POST_STATUSES,
  isValidPostStatus,
  type PostStatus,
} from "../posts";

describe("PostStatus", () => {
  it("exports all 3 statuses", () => {
    expect(POST_STATUSES).toEqual(["active", "hidden", "deleted"]);
  });

  it("isValidPostStatus returns true for valid", () => {
    expect(isValidPostStatus("active")).toBe(true);
    expect(isValidPostStatus("hidden")).toBe(true);
    expect(isValidPostStatus("deleted")).toBe(true);
  });

  it("isValidPostStatus returns false for invalid", () => {
    expect(isValidPostStatus("foo")).toBe(false);
    expect(isValidPostStatus("")).toBe(false);
    expect(isValidPostStatus("ACTIVE")).toBe(false);
  });

  it("PostStatus type narrows correctly", () => {
    const value: string = "active";
    if (isValidPostStatus(value)) {
      const narrowed: PostStatus = value;
      expect(narrowed).toBe("active");
    }
  });
});
