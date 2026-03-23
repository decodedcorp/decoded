# ARQ Migration Summary

## 목표 달성 완료

링크 분석 작업을 폴링 기반 스케줄러(APScheduler)에서 이벤트 기반 ARQ(Async Redis Queue) 워커 시스템으로 성공적으로 마이그레이션했습니다.

## 구현 내역

### 1. 의존성 추가 ✅

- `pyproject.toml`에 `arq (>=0.26.0,<0.27.0)` 추가
- 기존 Redis 인프라를 활용하므로 추가 인프라 구축 불필요

### 2. 큐 관리자 생성 ✅

**새로운 패키지**: `src/managers/queue/`

#### `jobs.py`

- `analyze_link_job`: 링크 분석을 처리하는 ARQ 작업
- 기존 `MetadataExtractManager.process_batch` 로직 재사용
- 통계 수집 및 결과 백엔드 전송 자동 처리

#### `worker.py`

- `WorkerSettings`: ARQ 워커 설정 (최대 동시 작업 10개, 타임아웃 5분)
- `create_worker`: 의존성 주입을 통한 워커 초기화
- `get_arq_pool`: 작업 큐잉을 위한 연결 풀 생성

### 3. MetadataExtractManager 업데이트 ✅

**파일**: `src/services/metadata/core/metadata_extract_manager.py`

변경 사항:

- `arq_pool` 속성 추가 (ARQ 연결 풀)
- `initialize_arq_pool()`: ARQ 풀 초기화 메서드 추가
- `enqueue_analysis_request()`: ARQ 작업 큐잉으로 업데이트
  - ARQ 사용 가능 시 → `arq_pool.enqueue_job()` 사용
  - ARQ 불가 시 → 레거시 Redis 리스트 큐로 폴백 (안전장치)

### 4. 메인 애플리케이션 통합 ✅

**파일**: `src/main.py`

추가 사항:

- `start_arq_worker()`: ARQ 워커를 시작하는 새로운 코루틴
  - 워커 초기화 및 의존성 주입
  - MetadataExtractManager의 ARQ 풀 초기화
  - 워커 실행 (`worker.async_run()`)
- `main()`: ARQ 워커를 다른 서비스들과 함께 병렬 실행
  - API 서버
  - gRPC 서버
  - Task Scheduler (기존 재시도 작업 유지)
  - **ARQ Worker** (신규)

### 5. 기존 스케줄러 정리 ✅

**파일**: `src/services/metadata/management/task_configuration.py`

제거 사항:

- `process_ai_analysis_queue` 작업 등록 제거 (10초 폴링 작업)
- 설명 주석 추가: ARQ로 마이그레이션되었음을 명시

유지 사항:

- 기존 재시도 작업들은 그대로 유지:
  - `retry_failed_items` (1분마다)
  - `cleanup_old_items` (6시간마다)
  - `failed_items_stats` (5분마다)
  - `process_partial_retries` (2분마다)
  - `partial_retry_stats` (5분마다)

## 아키텍처 변경

### 이전 (폴링 방식)

```
gRPC Request → Redis List Queue
                     ↓
              [10초마다 폴링]
                     ↓
              Batch Processing
```

**문제점**:

- 10초마다 실행되는 작업이 이전 작업이 끝나기 전에 다시 실행 시도
- `max_instances=1` 제한으로 인해 "maximum number of running instances reached" 에러 발생
- 리소스 낭비 (빈 큐도 계속 폴링)

### 이후 (이벤트 방식)

```
gRPC Request → ARQ Job Queue
                     ↓
               [즉시 처리]
                     ↓
              ARQ Worker Pool
                     ↓
              Batch Processing
```

**장점**:

- ✅ 이벤트 기반: 작업이 들어올 때만 처리 (리소스 효율적)
- ✅ 중복 실행 없음: 큐잉 시스템이 순차 처리 보장
- ✅ 확장성: 워커를 여러 개 띄워도 안전 (Redis 기반 분산 처리)
- ✅ 재시도 지원: ARQ 내장 재시도 메커니즘
- ✅ 모니터링: ARQ는 작업 상태 추적 기능 제공

## 핵심 개선 사항

1. **max_instances 에러 해결**: 폴링이 아닌 큐잉 방식으로 작업이 쌓여도 순차 처리
2. **즉시 처리**: 10초 대기 없이 즉시 작업 시작
3. **리소스 효율**: 작업이 없을 때는 대기 상태 (CPU 사용 없음)
4. **안전 장치**: ARQ 초기화 실패 시 레거시 큐로 자동 폴백

## 실행 방법

```bash
# 의존성 설치
uv sync

# 실행 (ARQ 워커 자동 시작)
python src/main.py
```

로그에서 다음 메시지 확인:

```
Starting API, gRPC dev servers, ARQ worker and task scheduler
ARQ Worker: Processing link analysis jobs
ARQ worker initialized successfully
```

## 검증 포인트

1. ✅ ARQ 의존성 추가됨
2. ✅ 큐 관리자 패키지 생성 (`src/managers/queue/`)
3. ✅ 작업 함수 구현 (`analyze_link_job`)
4. ✅ 워커 설정 구현 (`WorkerSettings`, `create_worker`)
5. ✅ MetadataExtractManager ARQ 통합
6. ✅ main.py에 워커 시작 로직 추가
7. ✅ 기존 폴링 작업 제거

## 다음 단계 (선택사항)

- ARQ 대시보드 연동: 작업 모니터링 UI 추가 가능
- 작업 우선순위 구현: 중요한 링크 먼저 처리
- 배치 크기 조정: 워커 설정에서 `max_jobs` 튜닝
- 타임아웃 조정: 작업 특성에 맞게 `job_timeout` 조정
