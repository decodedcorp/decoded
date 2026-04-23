import { describe, it, expect } from "vitest";
import {
  REPORT_STATUSES,
  isValidReportStatus,
  type ReportStatus,
} from "../reports";

describe("ReportStatus", () => {
  it("exports all 4 statuses", () => {
    expect(REPORT_STATUSES).toEqual([
      "pending",
      "reviewed",
      "dismissed",
      "actioned",
    ]);
  });

  it("isValidReportStatus returns true for valid", () => {
    expect(isValidReportStatus("pending")).toBe(true);
    expect(isValidReportStatus("reviewed")).toBe(true);
    expect(isValidReportStatus("dismissed")).toBe(true);
    expect(isValidReportStatus("actioned")).toBe(true);
  });

  it("isValidReportStatus returns false for invalid", () => {
    expect(isValidReportStatus("foo")).toBe(false);
    expect(isValidReportStatus("")).toBe(false);
    expect(isValidReportStatus("PENDING")).toBe(false);
  });

  it("ReportStatus type narrows correctly", () => {
    const value: string = "pending";
    if (isValidReportStatus(value)) {
      const narrowed: ReportStatus = value;
      expect(narrowed).toBe("pending");
    }
  });
});
