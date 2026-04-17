import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

type RpcArgs = { p_from_ts: string; p_to_ts: string };

const rpcMock = vi.fn();
const fromMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    rpc: (name: string, args: RpcArgs) => rpcMock(name, args),
    from: (table: string) => fromMock(table),
  }),
}));

function countMock(value: number | null) {
  return {
    select: () => Promise.resolve({ count: value, error: null }),
  };
}

describe("fetchDashboardStats", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-17T05:00:00Z"));
    rpcMock.mockReset();
    fromMock.mockReset();
    fromMock.mockImplementation(() => countMock(10));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls admin_distinct_user_count 4 times with correct half-open ranges", async () => {
    rpcMock.mockResolvedValue({ data: 0, error: null });
    const { fetchDashboardStats } = await import("../dashboard");
    await fetchDashboardStats();

    const calls = rpcMock.mock.calls.filter(
      ([name]) => name === "admin_distinct_user_count"
    );
    expect(calls).toHaveLength(4);

    const today = "2026-04-17T00:00:00.000Z";
    const tomorrow = "2026-04-18T00:00:00.000Z";
    const yesterday = "2026-04-16T00:00:00.000Z";
    const d30ago = "2026-03-18T00:00:00.000Z";
    const d60ago = "2026-02-16T00:00:00.000Z";

    const argsList = calls.map(([, args]) => args);
    expect(argsList).toContainEqual({ p_from_ts: today, p_to_ts: tomorrow });
    expect(argsList).toContainEqual({ p_from_ts: d30ago, p_to_ts: tomorrow });
    expect(argsList).toContainEqual({ p_from_ts: yesterday, p_to_ts: today });
    expect(argsList).toContainEqual({ p_from_ts: d60ago, p_to_ts: d30ago });
  });

  it("maps RPC values to KPIStats and computes deltas", async () => {
    rpcMock.mockImplementation((_name, args: RpcArgs) => {
      const tomorrow = "2026-04-18T00:00:00.000Z";
      if (
        args.p_to_ts === tomorrow &&
        args.p_from_ts === "2026-04-17T00:00:00.000Z"
      )
        return Promise.resolve({ data: 100, error: null });
      if (
        args.p_to_ts === tomorrow &&
        args.p_from_ts === "2026-03-18T00:00:00.000Z"
      )
        return Promise.resolve({ data: 1000, error: null });
      if (args.p_from_ts === "2026-04-16T00:00:00.000Z")
        return Promise.resolve({ data: 80, error: null });
      return Promise.resolve({ data: 800, error: null });
    });
    fromMock.mockImplementation((t: string) => {
      if (t === "post") return countMock(42);
      if (t === "item") return countMock(17);
      if (t === "users") return countMock(500);
      return countMock(0);
    });

    const { fetchDashboardStats } = await import("../dashboard");
    const stats = await fetchDashboardStats();

    expect(stats.dau).toBe(100);
    expect(stats.mau).toBe(1000);
    expect(stats.totalUsers).toBe(500);
    expect(stats.totalPosts).toBe(42);
    expect(stats.totalSolutions).toBe(17);
    expect(stats.dauDelta).toBe(25);
    expect(stats.mauDelta).toBe(25);
  });

  it("returns zeros on RPC error", async () => {
    rpcMock.mockResolvedValue({ data: null, error: new Error("boom") });
    const { fetchDashboardStats } = await import("../dashboard");
    const stats = await fetchDashboardStats();
    expect(stats).toMatchObject({
      dau: 0,
      mau: 0,
      totalUsers: 0,
      totalPosts: 0,
      totalSolutions: 0,
    });
  });

  it("treats null RPC data as 0", async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });
    const { fetchDashboardStats } = await import("../dashboard");
    const stats = await fetchDashboardStats();
    expect(stats.dau).toBe(0);
    expect(stats.mau).toBe(0);
  });
});

describe("fetchChartData", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-17T05:00:00Z"));
    rpcMock.mockReset();
    fromMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls admin_daily_metrics once with 30-day half-open range", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });
    const { fetchChartData } = await import("../dashboard");
    await fetchChartData(30);

    expect(rpcMock).toHaveBeenCalledTimes(1);
    const [name, args] = rpcMock.mock.calls[0];
    expect(name).toBe("admin_daily_metrics");
    expect(args).toEqual({
      p_from_ts: "2026-03-19T00:00:00.000Z",
      p_to_ts: "2026-04-18T00:00:00.000Z",
    });
  });

  it("clamps days to 90", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });
    const { fetchChartData } = await import("../dashboard");
    await fetchChartData(120);

    const [, args] = rpcMock.mock.calls[0];
    expect(args.p_from_ts).toBe("2026-01-18T00:00:00.000Z");
    expect(args.p_to_ts).toBe("2026-04-18T00:00:00.000Z");
  });

  it("clamps days to minimum 1", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });
    const { fetchChartData } = await import("../dashboard");
    await fetchChartData(0);

    const [, args] = rpcMock.mock.calls[0];
    expect(args.p_from_ts).toBe("2026-04-17T00:00:00.000Z");
    expect(args.p_to_ts).toBe("2026-04-18T00:00:00.000Z");
  });

  it("maps RPC rows to DailyMetric", async () => {
    rpcMock.mockResolvedValue({
      data: [
        { day: "2026-04-16", clicks: 5, searches: 3, dau: 10 },
        { day: "2026-04-17", clicks: 7, searches: 1, dau: 12 },
      ],
      error: null,
    });
    const { fetchChartData } = await import("../dashboard");
    const out = await fetchChartData(2);

    expect(out).toEqual([
      { date: "2026-04-16", dau: 10, searches: 3, clicks: 5 },
      { date: "2026-04-17", dau: 12, searches: 1, clicks: 7 },
    ]);
  });

  it("returns [] on RPC error", async () => {
    rpcMock.mockResolvedValue({ data: null, error: new Error("boom") });
    const { fetchChartData } = await import("../dashboard");
    const out = await fetchChartData(30);
    expect(out).toEqual([]);
  });

  it("handles null RPC fields with 0 fallback", async () => {
    rpcMock.mockResolvedValue({
      data: [{ day: "2026-04-17", clicks: null, searches: null, dau: null }],
      error: null,
    });
    const { fetchChartData } = await import("../dashboard");
    const out = await fetchChartData(1);
    expect(out).toEqual([
      { date: "2026-04-17", dau: 0, searches: 0, clicks: 0 },
    ]);
  });
});
