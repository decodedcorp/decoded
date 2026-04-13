//! 인메모리 메트릭 수집 모듈
//!
//! HTTP 요청 latency, throughput, error rate를 rolling window로 수집하고
//! admin API를 통해 JSON 스냅샷으로 노출합니다.

use std::collections::{HashMap, VecDeque};
use std::sync::{Arc, RwLock};
use std::time::{Instant, SystemTime, UNIX_EPOCH};

use serde::Serialize;

/// 1분 단위 시간 버킷
#[derive(Debug, Clone)]
struct TimeBucket {
    /// 버킷 시작 시각 (Unix timestamp, 초)
    timestamp: u64,
    request_count: u64,
    error_count: u64,
    /// latency 샘플 (마이크로초). 최대 1000개 reservoir sampling
    latency_samples: Vec<u64>,
    /// 엔드포인트별 통계
    endpoints: HashMap<String, EndpointBucket>,
}

#[derive(Debug, Clone, Default)]
struct EndpointBucket {
    request_count: u64,
    error_count: u64,
    latency_samples: Vec<u64>,
}

impl TimeBucket {
    fn new(timestamp: u64) -> Self {
        Self {
            timestamp,
            request_count: 0,
            error_count: 0,
            latency_samples: Vec::new(),
            endpoints: HashMap::new(),
        }
    }
}

/// 메트릭 내부 데이터
struct MetricsData {
    /// 1분 단위 rolling window (최대 60개 = 1시간)
    buckets: VecDeque<TimeBucket>,
    /// 서버 시작 시각
    started_at: Instant,
    /// 총 요청 수 (서버 기동 이후)
    total_requests: u64,
    /// 총 에러 수 (서버 기동 이후)
    total_errors: u64,
    /// reservoir sampling 카운터 (현재 버킷)
    sample_counter: u64,
}

impl MetricsData {
    fn new() -> Self {
        Self {
            buckets: VecDeque::with_capacity(60),
            started_at: Instant::now(),
            total_requests: 0,
            total_errors: 0,
            sample_counter: 0,
        }
    }

    /// 현재 분(minute)에 해당하는 버킷을 가져오거나 새로 생성
    fn current_bucket_mut(&mut self) -> &mut TimeBucket {
        let now_ts = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        let bucket_ts = now_ts - (now_ts % 60);

        // 가장 최근 버킷이 현재 분과 다르면 새 버킷 생성
        if self
            .buckets
            .back()
            .map(|b| b.timestamp != bucket_ts)
            .unwrap_or(true)
        {
            // 최대 60개 유지
            if self.buckets.len() >= 60 {
                self.buckets.pop_front();
            }
            self.buckets.push_back(TimeBucket::new(bucket_ts));
            self.sample_counter = 0;
        }

        self.buckets.back_mut().unwrap()
    }
}

/// 요청 1건을 기록하는 메서드에서 reservoir sampling 처리
fn reservoir_sample(samples: &mut Vec<u64>, value: u64, counter: u64) {
    const MAX_SAMPLES: usize = 1000;
    if samples.len() < MAX_SAMPLES {
        samples.push(value);
    } else {
        // reservoir sampling: counter번째 샘플을 확률적으로 교체
        let j = (counter % MAX_SAMPLES as u64) as usize;
        samples[j] = value;
    }
}

/// p-번째 퍼센타일 계산 (0.0~1.0)
fn percentile(sorted: &[u64], p: f64) -> u64 {
    if sorted.is_empty() {
        return 0;
    }
    // nearest-rank 방식: ceil(p * n) - 1
    let idx = ((p * sorted.len() as f64).ceil() as usize).saturating_sub(1);
    sorted[idx.min(sorted.len() - 1)]
}

/// 메트릭 수집 저장소
#[derive(Clone)]
pub struct MetricsStore {
    data: Arc<RwLock<MetricsData>>,
}

impl MetricsStore {
    pub fn new() -> Self {
        Self {
            data: Arc::new(RwLock::new(MetricsData::new())),
        }
    }

    /// HTTP 요청 1건 기록
    ///
    /// - `path`: 정규화된 경로 (예: `/api/v1/posts`)
    /// - `status`: HTTP 상태 코드
    /// - `duration_us`: 응답 시간 (마이크로초)
    pub fn record_request(&self, path: &str, status: u16, duration_us: u64) {
        let Ok(mut data) = self.data.write() else {
            return;
        };

        data.total_requests += 1;
        let is_error = status >= 400;
        if is_error {
            data.total_errors += 1;
        }

        data.sample_counter += 1;
        let counter = data.sample_counter;

        let bucket = data.current_bucket_mut();
        bucket.request_count += 1;
        if is_error {
            bucket.error_count += 1;
        }
        reservoir_sample(&mut bucket.latency_samples, duration_us, counter);

        // 엔드포인트별 기록 (최대 50개 엔드포인트 추적)
        if bucket.endpoints.len() < 50 || bucket.endpoints.contains_key(path) {
            let ep = bucket.endpoints.entry(path.to_string()).or_default();
            ep.request_count += 1;
            if is_error {
                ep.error_count += 1;
            }
            reservoir_sample(&mut ep.latency_samples, duration_us, counter);
        }
    }

    /// 현재 메트릭 스냅샷 반환
    pub fn snapshot(&self) -> MetricsSnapshot {
        let Ok(data) = self.data.read() else {
            return MetricsSnapshot::default();
        };

        let uptime_seconds = data.started_at.elapsed().as_secs();

        // 최근 1분 버킷 기준 current 메트릭
        let current = data.buckets.back().map(|b| {
            let mut sorted = b.latency_samples.clone();
            sorted.sort_unstable();
            CurrentMetrics {
                rpm: b.request_count,
                error_count: b.error_count,
                error_rate: if b.request_count > 0 {
                    b.error_count as f64 / b.request_count as f64
                } else {
                    0.0
                },
                p50_ms: percentile(&sorted, 0.5) / 1000,
                p95_ms: percentile(&sorted, 0.95) / 1000,
                p99_ms: percentile(&sorted, 0.99) / 1000,
            }
        });

        // 히스토리 (오래된 것 → 최신 순)
        let history: Vec<HistoryBucket> = data
            .buckets
            .iter()
            .map(|b| {
                let mut sorted = b.latency_samples.clone();
                sorted.sort_unstable();
                HistoryBucket {
                    timestamp: b.timestamp,
                    rpm: b.request_count,
                    error_count: b.error_count,
                    p50_ms: percentile(&sorted, 0.5) / 1000,
                    p95_ms: percentile(&sorted, 0.95) / 1000,
                    p99_ms: percentile(&sorted, 0.99) / 1000,
                }
            })
            .collect();

        // 엔드포인트 집계 (전체 버킷 합산, rpm 내림차순 상위 20)
        let mut ep_map: HashMap<String, EndpointStat> = HashMap::new();
        for bucket in &data.buckets {
            for (path, ep) in &bucket.endpoints {
                let stat = ep_map.entry(path.clone()).or_default();
                stat.rpm += ep.request_count;
                stat.error_count += ep.error_count;
                stat.latency_samples.extend_from_slice(&ep.latency_samples);
            }
        }
        let mut endpoints: Vec<EndpointMetrics> = ep_map
            .into_iter()
            .map(|(path, stat)| {
                let mut sorted = stat.latency_samples.clone();
                sorted.sort_unstable();
                EndpointMetrics {
                    path,
                    rpm: stat.rpm,
                    error_rate: if stat.rpm > 0 {
                        stat.error_count as f64 / stat.rpm as f64
                    } else {
                        0.0
                    },
                    p95_ms: percentile(&sorted, 0.95) / 1000,
                }
            })
            .collect();
        endpoints.sort_by(|a, b| b.rpm.cmp(&a.rpm));
        endpoints.truncate(20);

        MetricsSnapshot {
            uptime_seconds,
            total_requests: data.total_requests,
            total_errors: data.total_errors,
            current,
            history,
            endpoints,
        }
    }
}

impl Default for MetricsStore {
    fn default() -> Self {
        Self::new()
    }
}

// --- 응답 타입 ---

#[derive(Debug, Serialize, Default)]
pub struct MetricsSnapshot {
    pub uptime_seconds: u64,
    pub total_requests: u64,
    pub total_errors: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub current: Option<CurrentMetrics>,
    pub history: Vec<HistoryBucket>,
    pub endpoints: Vec<EndpointMetrics>,
}

#[derive(Debug, Serialize)]
pub struct CurrentMetrics {
    pub rpm: u64,
    pub error_count: u64,
    pub error_rate: f64,
    pub p50_ms: u64,
    pub p95_ms: u64,
    pub p99_ms: u64,
}

#[derive(Debug, Serialize)]
pub struct HistoryBucket {
    /// Unix timestamp (초, 분 단위로 내림)
    pub timestamp: u64,
    pub rpm: u64,
    pub error_count: u64,
    pub p50_ms: u64,
    pub p95_ms: u64,
    pub p99_ms: u64,
}

#[derive(Debug, Serialize)]
pub struct EndpointMetrics {
    pub path: String,
    pub rpm: u64,
    pub error_rate: f64,
    pub p95_ms: u64,
}

#[derive(Default)]
struct EndpointStat {
    rpm: u64,
    error_count: u64,
    latency_samples: Vec<u64>,
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;

    #[test]
    fn test_record_and_snapshot_empty() {
        let store = MetricsStore::new();
        let snap = store.snapshot();
        assert_eq!(snap.total_requests, 0);
        assert!(snap.current.is_none());
    }

    #[test]
    fn test_record_requests() {
        let store = MetricsStore::new();
        store.record_request("/api/v1/posts", 200, 10_000); // 10ms
        store.record_request("/api/v1/posts", 200, 50_000); // 50ms
        store.record_request("/api/v1/posts", 500, 200_000); // 200ms (error)

        let snap = store.snapshot();
        assert_eq!(snap.total_requests, 3);
        assert_eq!(snap.total_errors, 1);

        let current = snap.current.unwrap();
        assert_eq!(current.rpm, 3);
        assert_eq!(current.error_count, 1);
        assert!((current.error_rate - 1.0 / 3.0).abs() < 1e-9);
        // p50 = 50ms, p95/p99 = 200ms (3 samples)
        assert_eq!(current.p50_ms, 50);
        assert_eq!(current.p95_ms, 200);
    }

    #[test]
    fn test_endpoint_tracking() {
        let store = MetricsStore::new();
        store.record_request("/api/v1/posts", 200, 10_000);
        store.record_request("/api/v1/search", 200, 30_000);
        store.record_request("/api/v1/posts", 404, 5_000);

        let snap = store.snapshot();
        let posts = snap.endpoints.iter().find(|e| e.path == "/api/v1/posts");
        assert!(posts.is_some());
        let posts = posts.unwrap();
        assert_eq!(posts.rpm, 2);
        assert!((posts.error_rate - 0.5).abs() < 1e-9);
    }

    #[test]
    fn test_percentile() {
        // nearest-rank: ceil(p * n) - 1
        // n=10, p50 → ceil(5.0)-1=4 → 50
        // n=10, p95 → ceil(9.5)-1=9 → 100
        // n=10, p99 → ceil(9.9)-1=9 → 100
        let samples = vec![10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
        assert_eq!(percentile(&samples, 0.5), 50);
        assert_eq!(percentile(&samples, 0.95), 100);
        assert_eq!(percentile(&samples, 0.99), 100);
        // n=20 범위로 p95 재검증
        let samples2: Vec<u64> = (1..=20).map(|x| x * 10).collect();
        // p95 → ceil(19.0)-1=18 → 190
        assert_eq!(percentile(&samples2, 0.95), 190);
    }

    #[test]
    fn test_reservoir_sampling_cap() {
        let store = MetricsStore::new();
        // 1001개 기록해도 샘플은 1000개를 넘지 않아야 함
        for i in 0..1001u64 {
            store.record_request("/api/v1/test", 200, i * 1000);
        }
        let data = store.data.read().unwrap();
        let bucket = data.buckets.back().unwrap();
        assert!(bucket.latency_samples.len() <= 1000);
    }
}
