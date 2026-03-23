# services 디렉토리

이 디렉토리는 프로젝트의 **Service 계층**을 담당합니다.

- 비즈니스 로직을 구현하며, 여러 Manager 또는 다른 Service를 조합하여 실제 서비스 기능을 제공합니다.
- 외부 시스템과의 직접 통신은 Manager 계층에 위임하고, Service는 도메인/비즈니스 중심의 로직에 집중합니다.
- Controller 계층에서 Service를 호출하여 API/gRPC 응답을 생성합니다.

**관심사의 분리, 재사용성, 유지보수성을 위해 Service 계층을 별도로 분리하였습니다.**

---

## 디렉토리 구조

```
services/
├── common/                    # 범용 서비스
│   └── task_scheduler.py     # 범용 비동기 태스크 스케줄러
├── metadata/                  # 메타데이터 도메인 서비스
│   ├── processing/           # 메타데이터 처리 핵심 로직
│   ├── failed_items_manager.py  # Redis 기반 실패 아이템 관리
│   ├── tasks.py              # 스케줄러용 태스크 함수들
```

---

## Service 계층의 세분화: business_service와 resource_service

`src/services/base.py`에서는 서비스 클래스를 두 가지 타입으로 구분하는 데코레이터를 제공합니다:

- **@resource_service**: 하나의 Manager만을 상속받아, 해당 Manager와 밀접한 비즈니스 로직을 구현합니다.
- **@business_service**: 여러 Manager와 Service를 조합하여, 실제 서비스에서 사용되는 상위 비즈니스 로직을 구현합니다.

### 이렇게 나누는 이유와 장점

- **resource_service**는 단일 Manager에 집중하여, 코드가 단순하고 명확해집니다.
- **business_service**는 다양한 Manager/Service를 조합할 수 있어, 복잡한 비즈니스 로직을 유연하게 구현할 수 있습니다.
- 이 구조를 통해 서비스 클래스의 코드가 불필요하게 길어지지 않고, 유지보수가 쉬워집니다.
- 상속 구조가 복잡해지는 문제에서 벗어나, 각 계층의 역할이 명확해집니다.

---

## 주요 서비스 컴포넌트

### 1. 범용 서비스 (common/)

#### TaskScheduler

- **목적**: 비동기 주기적 태스크 실행
- **특징**: 함수 기반 태스크 등록으로 최대 단순성 구현
- **사용법**: `scheduler.register_task(name, func, interval)`
- **자동 시작**: main.py에서 서버 시작 시 자동으로 실행

### 2. 메타데이터 서비스 (metadata/)

#### FailedItemsManager

- **목적**: Redis 기반 실패한 메타데이터 처리 아이템 관리
- **기능**:
  - 실패 아이템 저장 및 검색
  - 에러 타입별 분류 (7가지 타입)
  - 지수적 백오프 재시도 스케줄링
  - 영구 실패 아이템 관리
- **Redis 키 사용**: `failed_items`, `retry_queue`, `permanent_failed`

#### Tasks (tasks.py)

- **retry_failed_items**: 실패한 아이템들을 재시도 처리
- **cleanup_old_failed_items**: 오래된 실패 아이템 정리
- **get_failed_items_stats**: 실패 아이템 통계 로깅

### 3. 실패 처리 시스템 아키텍처

```
메타데이터 처리 실패 → FailedItemsManager → Redis 저장
                                    ↓
TaskScheduler → retry_failed_items → 재시도 처리 → 성공 시 Redis에서 제거
              → cleanup_old_items  → 오래된 아이템 정리
              → failed_items_stats → 통계 로깅
```

### 4. 에러 분류 및 재시도 전략

**재시도 가능한 에러**:

- `NETWORK_ERROR`: 네트워크 연결 오류
- `TIMEOUT`: 요청 타임아웃
- `RATE_LIMIT`: API 레이트 리밋
- `SERVER_ERROR`: 서버 내부 오류

**영구 실패 에러**:

- `API_KEY_ERROR`: API 키 인증 오류
- `INVALID_CONTENT`: 잘못된 콘텐츠 형식

**재시도 간격**: 지수적 백오프 (1분 → 2분 → 4분 → 8분 → 16분)
