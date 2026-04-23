/**
 * @vitest-environment jsdom
 *
 * MonitoringPage empty state tests.
 *
 * The monitoring dashboard renders three sections (KPI cards, charts,
 * endpoint table). When the metrics snapshot reports no traffic at all
 * (no `current` data + empty `history` + empty `endpoints`), the page
 * should surface a single shared <AdminEmptyState/> wrapped in a card
 * container instead of empty KPI/chart placeholders.
 *
 * When ANY data is present, the regular widgets are rendered.
 */
import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// --- Mocks for the data hook ---

const useMonitoringMetricsMock = vi.fn();

vi.mock("@/lib/hooks/admin/useMonitoring", () => ({
  useMonitoringMetrics: (...args: unknown[]) =>
    useMonitoringMetricsMock(...args),
}));

// Stub the heavy chart/table widgets so their internal placeholders
// don't collide with the page-level empty state under test.
vi.mock("@/lib/components/admin/monitoring/MetricsKPICards", () => ({
  MetricsKPICards: ({ data }: { data: { total_requests: number } }) => (
    <div data-testid="kpi-cards" data-total={data.total_requests} />
  ),
  MetricsKPICardsSkeleton: () => <div data-testid="kpi-cards-skeleton" />,
}));

vi.mock("@/lib/components/admin/monitoring/LatencyChart", () => ({
  LatencyChart: ({ data }: { data: unknown[] }) => (
    <div data-testid="latency-chart" data-points={data.length} />
  ),
  LatencyChartSkeleton: () => <div data-testid="latency-chart-skeleton" />,
}));

vi.mock("@/lib/components/admin/monitoring/ThroughputChart", () => ({
  ThroughputChart: ({ data }: { data: unknown[] }) => (
    <div data-testid="throughput-chart" data-points={data.length} />
  ),
  ThroughputChartSkeleton: () => (
    <div data-testid="throughput-chart-skeleton" />
  ),
}));

vi.mock("@/lib/components/admin/monitoring/EndpointTable", () => ({
  EndpointTable: ({ data }: { data: unknown[] }) => (
    <div data-testid="endpoint-table" data-rows={data.length} />
  ),
  EndpointTableSkeleton: () => <div data-testid="endpoint-table-skeleton" />,
}));

import MonitoringPage from "../page";

beforeEach(() => {
  useMonitoringMetricsMock.mockReset();
});

describe("MonitoringPage — empty state", () => {
  test("renders AdminEmptyState when metrics snapshot has no traffic", () => {
    useMonitoringMetricsMock.mockReturnValue({
      data: {
        uptime_seconds: 0,
        total_requests: 0,
        total_errors: 0,
        current: undefined,
        history: [],
        endpoints: [],
      },
      isLoading: false,
      isError: false,
    });

    render(<MonitoringPage />);

    expect(screen.getByText("No monitoring data yet")).toBeInTheDocument();
    // Widgets must not render when the page-level empty state is up.
    expect(screen.queryByTestId("kpi-cards")).not.toBeInTheDocument();
    expect(screen.queryByTestId("latency-chart")).not.toBeInTheDocument();
    expect(screen.queryByTestId("throughput-chart")).not.toBeInTheDocument();
    expect(screen.queryByTestId("endpoint-table")).not.toBeInTheDocument();
  });

  test("renders KPI/charts/table when metrics contain data", () => {
    useMonitoringMetricsMock.mockReturnValue({
      data: {
        uptime_seconds: 3600,
        total_requests: 1234,
        total_errors: 2,
        current: {
          rpm: 12,
          error_count: 0,
          error_rate: 0,
          p50_ms: 30,
          p95_ms: 90,
          p99_ms: 150,
        },
        history: [
          {
            timestamp: 1_700_000_000,
            rpm: 12,
            error_count: 0,
            p50_ms: 30,
            p95_ms: 90,
            p99_ms: 150,
          },
        ],
        endpoints: [
          { path: "/api/v1/posts", rpm: 6, error_rate: 0, p95_ms: 80 },
        ],
      },
      isLoading: false,
      isError: false,
    });

    render(<MonitoringPage />);

    expect(screen.getByTestId("kpi-cards")).toBeInTheDocument();
    expect(screen.getByTestId("latency-chart")).toBeInTheDocument();
    expect(screen.getByTestId("throughput-chart")).toBeInTheDocument();
    expect(screen.getByTestId("endpoint-table")).toBeInTheDocument();
    expect(
      screen.queryByText("No monitoring data yet")
    ).not.toBeInTheDocument();
  });

  test("renders skeletons while loading (empty state must not appear)", () => {
    useMonitoringMetricsMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(<MonitoringPage />);

    expect(screen.getByTestId("kpi-cards-skeleton")).toBeInTheDocument();
    expect(screen.getByTestId("latency-chart-skeleton")).toBeInTheDocument();
    expect(screen.getByTestId("throughput-chart-skeleton")).toBeInTheDocument();
    expect(screen.getByTestId("endpoint-table-skeleton")).toBeInTheDocument();
    expect(
      screen.queryByText("No monitoring data yet")
    ).not.toBeInTheDocument();
  });

  test("renders error banner on error (no empty state)", () => {
    useMonitoringMetricsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(<MonitoringPage />);

    expect(
      screen.getByText(/Failed to load monitoring metrics/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByText("No monitoring data yet")
    ).not.toBeInTheDocument();
  });
});
