/**
 * Admin monitoring types — mirrors Rust MetricsSnapshot
 */

export interface CurrentMetrics {
  rpm: number;
  error_count: number;
  error_rate: number;
  p50_ms: number;
  p95_ms: number;
  p99_ms: number;
}

export interface HistoryBucket {
  /** Unix timestamp (seconds, floored to minute) */
  timestamp: number;
  rpm: number;
  error_count: number;
  p50_ms: number;
  p95_ms: number;
  p99_ms: number;
}

export interface EndpointMetrics {
  path: string;
  rpm: number;
  error_rate: number;
  p95_ms: number;
}

export interface MonitoringMetrics {
  uptime_seconds: number;
  total_requests: number;
  total_errors: number;
  current?: CurrentMetrics;
  history: HistoryBucket[];
  endpoints: EndpointMetrics[];
}
