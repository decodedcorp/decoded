# DECODED-AI

DECODED-AI는 AI inference, gRPC 기반 서비스, Redis 캐시, 다양한 외부 서비스 연동을 지원하는 통합 AI 서버 프로젝트입니다.

## 모노레포에서 실행하기

소스는 **`decoded-monorepo`의 `packages/ai-server/`** 에 있다. 레포 루트에서:

```bash
cd packages/ai-server
uv sync
uv run python -m src.main
```

또는 루트에서 `bun run dev:ai-server` (`uv` 필요). 의존성 잠금은 **`uv.lock`** 이 단일 소스입니다.

**Docker Compose** (`docker-compose-ai-dev.yml` 등)는 **빌드 컨텍스트가 이 디렉터리**(`packages/ai-server`)이어야 한다. 모노레포 루트에서 실행할 때는 `-f packages/ai-server/docker-compose-ai-dev.yml` 로 지정하고, 문서에 적힌 `context: .` 는 **`packages/ai-server`를 현재 디렉터리로 한 채** 실행하거나, compose 파일의 `context`를 필요 시 조정한다.

Rust API는 같은 모노레포의 **`packages/api-server`** 를 가리킨다.

---

## 서비스 구조 요약

이 프로젝트의 핵심은 **Manager → Service → Controller** 계층 구조입니다.

- [**Manager**](src/managers/README.md): 외부 시스템과의 통신 및 데이터 관리
- [**Service**](src/services/README.md): 비즈니스 로직 및 서비스 조합
- [**Controller**](src/controller/README.md): 외부 요청 처리 및 응답 반환

다만 로컬 ai 모델들은 manager가 아니라 [src/ai](src/ai/README.md) 에서 관리합니다.

### 핵심 기능들

- **메타데이터 추출/분석**: 링크/이미지에서 메타데이터 추출 및 AI 분석 (OG Extractor / AI Analyzer 분리)
- **LLM Fallback 시스템**: Gemini 과부하 시 자동으로 Perplexity로 전환하여 안정성 보장
- **LinkTypeClassifier**: Groq 기반 빠른 링크 타입 분류로 스키마 호환성 문제 해결
- **실패 처리 시스템**: Redis 기반 실패 아이템 관리 및 자동 재시도
- **범용 태스크 스케줄러**: 주기적 작업 자동 실행 (재시도, 정리, 통계 등)
- **LLM 라우팅**: 콘텐츠 타입별 최적 LLM 자동 선택
- **Post Editorial**: 포스트당 에디토리얼 매거진 생성 (Backend 트리거 → gRPC → ARQ → LangGraph)

---

## 프로젝트 폴더 구조

```
decoded-ai/
├── src/
│   ├── ai/                # AI 모델 및 임베딩 로직 (→ [ai/README.md](src/ai/README.md))
│   ├── config/            # 환경설정, DI 컨테이너, 로거 등
│   ├── controller/        # API/서비스 컨트롤러
│   ├── grpc/              # gRPC 관련 코드 (proto, server, client, servicer)
│   ├── managers/          # 외부 서비스 연동 매니저 (Redis, Backend 등)
│   ├── services/          # 비즈니스/리소스 서비스 계층
│   │   ├── common/        # 범용 서비스 (TaskScheduler)
│   │   ├── metadata/      # 메타데이터 관련 서비스 (실패 처리, 태스크 등)
│   │   └── post_editorial/ # Post Editorial 서비스 (ARQ job)
│   ├── post_editorial/    # Post Editorial LangGraph 파이프라인
│   └── ...                # 기타 유틸, 미들웨어 등
├── docker-compose-ai.yml      # 운영용 Docker Compose
├── docker-compose-ai-dev.yml  # 개발용 Docker Compose
├── Dockerfile.ai.prod         # ai-server용 Dockerfile
└── README.md                  # (본 파일)
```

---

## dev/prod 환경별 주요 포트 정리

| 환경 | ai-server REST | ai-server gRPC | redis-server | llama-server | (selenium)                |
| ---- | -------------- | -------------- | ------------ | ------------ | ------------------------- |
| prod | 10000:10000    | 50051:50051    | 6303:6379    |              | -                         |
| dev  | 10000:10000    | 50052:50052    | 6303:6379    |              | 4444:4444,7900:7900(주석) |
| 공용 |                |                |              | 1234:1234    |                           |

## 아키텍처

### 전체 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                         Backend (Rust)                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │ gRPC
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DECODED-AI (gRPC Server)                      │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              gRPC Service (Queue Servicer)                 │ │
│  │                                                             │ │
│  │  ┌─ ExtractOGData ────────────────────────────────────┐   │ │
│  │  │  OG metadata extraction (sync)                      │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  │                                                             │ │
│  │  ┌─ AnalyzeLink ──────────────────────────────────────┐   │ │
│  │  │  Enqueue AI analysis to ARQ (async)                 │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  │                                                             │ │
│  │  ┌─ AnalyzeLinkDirect ────────────────────────────────┐   │ │
│  │  │  Direct AI analysis (sync, for testing)            │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  │                                                             │ │
│  │  ┌─ ProcessPostEditorial ─────────────────────────────┐   │ │
│  │  │  Enqueue post editorial to ARQ (async)              │   │ │
│  │  │  → post_editorial_job → LangGraph pipeline          │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   Service Layer                            │ │
│  │                                                             │ │
│  │  MetadataExtractService ─┬─► MetadataExtractManager       │ │
│  │                          │                                 │ │
│  │                          └─► ResultAggregator              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                Processing Components                       │ │
│  │                                                             │ │
│  │  ┌─ LinkOGExtractor ──────────────────────────────────┐   │ │
│  │  │  • WebScraper + OGTagExtractor                      │   │ │
│  │  │  • SearXNG fallback                                 │   │ │
│  │  │  • No AI dependency                                 │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  │                                                             │ │
│  │  ┌─ LinkAIAnalyzer ───────────────────────────────────┐   │ │
│  │  │  • LinkTypeClassifier (Groq) → 빠른 타입 분류        │   │ │
│  │  │  • DefaultLLMAgent (Perplexity → Gemini fallback)   │   │ │
│  │  │  • Schema-based structured extraction               │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  │                                                             │ │
│  │  ┌─ ImageProcessor ───────────────────────────────────┐   │ │
│  │  │  • Image metadata extraction                        │   │ │
│  │  │  • LLM-based image analysis                         │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   Infrastructure                           │ │
│  │                                                             │ │
│  │  ┌─ QueueManager ──────────────────────────────────────┐  │ │
│  │  │  • Generic queue infrastructure                      │  │ │
│  │  │  • Service-agnostic job enqueueing                  │  │ │
│  │  │  • ARQ pool management                               │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                             │ │
│  │  • ARQ (Async Job Queue)                                   │ │
│  │  • Redis (Cache & Queue)                                  │ │
│  │  • APScheduler (Periodic Tasks)                           │ │
│  │  • FailedItemsManager (Retry Management)                  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                      │
                      ▼
          ┌───────────────────────┐
          │   External Services   │
          │                       │
          │  • Gemini (Primary)   │
          │  • Perplexity         │
          │  • Groq               │
          │  • SearXNG            │
          └───────────────────────┘
```

### 링크 처리 플로우

#### 1. OG 메타데이터 추출 (ExtractOGData)

```
┌─────────────┐
│   Backend   │
│  (Rust)     │
└──────┬──────┘
       │ gRPC: ExtractOGData(url)
       ▼
┌──────────────────────┐
│  MetadataServicer    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────┐
│ MetadataExtractService        │
│ .extract_og_metadata()        │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ MetadataExtractManager       │
│ .do_extract_og_metadata()    │
└──────────┬───────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│              LinkOGExtractor.extract_og_data()              │
└──────┬──────────────────────────────────────────────────────┘
       │
       ├─────────────────┬─────────────────┬─────────────────┐
       │                 │                 │                 │
       ▼                 ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ WebScraper   │  │ OGTag        │  │ SearXNG     │  │ Return       │
│ Service      │  │ Extractor    │  │ (fallback)  │  │              │
│              │  │              │  │             │  │ { title,      │
│ • Selenium   │  │ • HTML       │  │ • 특정      │  │   description,│
│ • 동적 페이지│  │   parsing    │  │   도메인용  │  │   image,      │
│   스크래핑   │  │ • OG 태그    │  │   fallback  │  │   site_name } │
│              │  │   추출       │  │             │  │              │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

#### 2. AI 분석 - 비동기 (AnalyzeLink)

```
┌─────────────┐
│   Backend   │
│  (Rust)     │
└──────┬──────┘
       │ gRPC: AnalyzeLink(url, og_metadata)
       ▼
┌──────────────────────┐
│  MetadataServicer    │
│  (API Layer)         │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────┐
│ QueueManager                 │
│ .enqueue_job()               │
│ (Generic Infrastructure)     │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│   ARQ.enqueue_job()          │
└──────────┬───────────────────┘
           │
           ▼
    ┌─────────────┐
    │ Redis Queue │
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │  ARQ Worker │
    └──────┬──────┘
           │
           ▼
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                    LinkAIAnalyzer.analyze()                                  │
    └──────┬──────────────────────────────────────────────────────────────────────┘
           │
           ▼
    ┌──────────────────────────────────────────────────────────────────────────────┐
    │                                                                              │
    │  ┌──────────────────────┐    ┌──────────────────────────────────────┐    │
    │  │  Step 1:              │───►│  Step 2:                            │    │
    │  │  LinkTypeClassifier   │    │  DefaultLLMAgent                    │    │
    │  │                       │    │  (LLM Fallback Agent)               │    │
    │  │  ┌─────────────────┐  │    │                                      │    │
    │  │  │ • Groq 기반     │  │    │  ┌──────────────────────────────┐  │    │
    │  │  │ • 빠른 타입 분류 │  │    │  │ Primary: PerplexityClient   │  │    │
    │  │  │ • product/      │  │    │  │ • 웹 검색 기반 강력한 분석    │  │    │
    │  │  │   article/      │  │    │  │ • 실패 시 자동 fallback      │  │    │
    │  │  │   video/other   │  │    │  └──────────┬───────────────────┘  │    │
    │  │  │ • temp: 0.1     │  │    │             │ 실패 시               │    │
    │  │  │ • 실패→"other"  │  │    │             ▼                       │    │
    │  │  └─────────────────┘  │    │  ┌──────────────────────────────┐  │    │
    │  └──────────────────────┘    │  │ Fallback: GeminiClient        │  │    │
    │                              │  │ • Primary 실패 시 자동 전환    │  │    │
    │                              │  │ • 동일한 요청으로 재시도        │  │    │
    │                              │  │ • 둘 다 실패 시 예외 발생       │  │    │
    │                              │  └──────────────────────────────┘  │    │
    │                              └──────────┬───────────────────────────┘    │
    │                                         │                                │
    │                                         ▼                                │
    │                              ┌──────────────────────────────────────┐   │
    │                              │  Step 3:                             │   │
    │                              │  Schema-based Extraction             │   │
    │                              │                                      │   │
    │                              │  • 타입별 단일 스키마 적용           │   │
    │                              │  • ProductResponse /                 │   │
    │                              │    ArticleResponse /                  │   │
    │                              │    VideoResponse /                   │   │
    │                              │    OtherResponse                     │   │
    │                              │  • 구조화된 JSON 응답 추출           │   │
    │                              │  • summary, keywords, qna, metadata  │   │
    │                              └──────────────────────────────────────┘   │
    │                                                                         │
    └────────────────────────────────────┬────────────────────────────────────┘
                                         │
                                         ▼
                              ┌──────────────────────────┐
                              │ ResultAggregator         │
                              │ .send_results_to_backend()│
                              └──────────┬───────────────┘
                                         │
                                         ▼
                              ┌──────────────────────────┐
                              │   Backend (gRPC)         │
                              │   Callback               │
                              └──────────────────────────┘
```

#### 3. AI 분석 - 동기 (AnalyzeLinkDirect)

```
┌─────────────┐
│   Backend   │
│  (Rust)     │
└──────┬──────┘
       │ gRPC: AnalyzeLinkDirect(url, og_metadata)
       ▼
┌──────────────────────┐
│  MetadataServicer    │
│  (validate og_       │
│   metadata exists)   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────┐
│ MetadataExtractService        │
│ ._analyze_link()              │
│ (Business Logic)              │
└──────────┬───────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│              LinkAIAnalyzer.analyze()                       │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Step 1:      │─►│ Step 2:     │─►│ Step 3:      │      │
│  │ Type         │  │ LLM Agent   │  │ Schema       │      │
│  │ Classifier   │  │ (Fallback)  │  │ Extraction   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  (same as async flow above)                                 │
└──────────┬──────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│ Return: { summary, keywords, qna,        │
│         product_details }                │
└──────────────────────────────────────────┘
```

### 핵심 컴포넌트

#### QueueManager

- **책임**: 범용 queue 인프라 관리
- **특징**:
  - **서비스 무관**: 어떤 서비스의 어떤 job이든 enqueue 가능
  - **Job type 무관**: Job 구현에 대해 알 필요 없음
  - **재사용성**: 프로젝트 전체에서 공유되는 인프라 컴포넌트
  - **확장성**: 새 서비스 추가 시 QueueManager 수정 불필요
- **위치**: `src/managers/queue/queue_manager.py`
- **사용 예시**:
  ```python
  # gRPC Servicer에서 사용
  job_id = await self.queue_manager.enqueue_job(
      "analyze_link_job",
      url, post_id, title, description, site_name
  )
  ```

#### LinkOGExtractor

- **책임**: 순수 OG 메타데이터 추출
- **의존성**: WebScraper, OGTagExtractor, SearXNG
- **특징**: AI 의존성 없음, 동기 처리
- **위치**: `src/services/metadata/extractors/link_og_extractor.py`

#### LinkAIAnalyzer

- **책임**: AI 기반 메타데이터 심층 분석
- **의존성**: LinkTypeClassifier (Groq), DefaultLLMAgent (Perplexity → Gemini)
- **특징**:
  - 3단계 처리 파이프라인:
    1. **타입 분류**: LinkTypeClassifier로 빠른 타입 감지 (Groq)
    2. **AI 분석**: DefaultLLMAgent로 심층 분석 (Perplexity → Gemini fallback)
    3. **스키마 추출**: 타입별 단일 스키마로 구조화된 데이터 추출
  - OG 메타데이터 필수 입력 (fallback 추출 없음)
  - 스키마 기반 구조화된 응답 (Pydantic 모델)
- **위치**: `src/services/metadata/processors/link_ai_analyzer.py`

#### DefaultLLMAgent (LLM Fallback Agent)

- **책임**: Primary LLM 실패 시 Fallback LLM으로 자동 전환하는 Agent 패턴 구현
- **설계 패턴**: Adapter Pattern + Fallback Strategy
- **특징**:
  - **자동 Fallback**: Primary 실패 시 자동으로 Fallback으로 전환
  - **투명한 인터페이스**: `BaseLLMClient` 인터페이스 구현으로 기존 코드와 호환
  - **에러 처리**: Primary 실패 시 자동 재시도, 둘 다 실패 시 예외 발생
  - **로깅**: 각 단계별 상세한 로깅으로 디버깅 용이
- **현재 구성**:
  - **Primary**: PerplexityClient (웹 검색 기반 강력한 분석)
  - **Fallback**: GeminiClient (안정적인 대안)
- **사용 예시**:

  ```python
  llm_agent = DefaultLLMAgent(
      primary=perplexity_client,    # 1차 시도
      fallback=gemini_client         # 실패 시 자동 전환
  )

  # 사용 - Perplexity 실패 시 자동으로 Gemini로 전환
  response = await llm_agent.completion(
      messages=messages,
      content_type=ContentType.TEXT,
      response_schema=ProductResponse
  )
  ```

- **위치**: `src/managers/llm/adapters/agent.py`

#### LinkTypeClassifier

- **책임**: 링크 타입 사전 분류 (product/article/video/other)
- **의존성**: GroqClient (빠른 추론)
- **특징**:
  - **빠른 분류**: Groq의 고속 추론 활용
  - **일관성**: 낮은 temperature (0.1)로 일관된 분류
  - **안정성**: 실패 시 기본값 "other" 반환
  - **목적**: Union 타입 문제 해결을 위한 사전 타입 감지
- **위치**: `src/services/metadata/processors/link_type_classifier.py`

#### MetadataExtractService

- **책임**: 메타데이터 추출 비즈니스 로직
- **역할**:
  - ExtractOGData → LinkOGExtractor
  - AnalyzeLink → QueueManager를 통한 ARQ enqueue (Servicer에서 처리)
  - AnalyzeLinkDirect → `_analyze_link()` 직접 호출
  - ARQ job: `analyze_link_job()` static method
- **특징**:
  - **순수 비즈니스 로직**: 인프라 관리 책임 없음
  - **Job 정의**: Service 내부에 static method로 정의
- **위치**: `src/services/metadata/core/metadata_extract_service.py`

### AI Analysis 파이프라인 상세

#### 파이프라인 단계별 설명

**Step 1: LinkTypeClassifier (타입 분류)**

- Groq를 사용한 빠른 링크 타입 분류
- 입력: URL, title, description
- 출력: "product" | "article" | "video" | "other"
- 목적: Union 타입 문제 해결을 위한 사전 타입 감지

**Step 2: DefaultLLMAgent (AI 분석)**

- Primary LLM (Perplexity)로 메타데이터 분석 시도
- 실패 시 Fallback LLM (Gemini)으로 자동 전환
- 동일한 요청으로 재시도하여 안정성 보장
- 구조화된 프롬프트로 summary, keywords, qna, metadata 추출

**Step 3: Schema-based Extraction (구조화)**

- 타입별 단일 스키마 적용 (ProductResponse, ArticleResponse 등)
- Pydantic 모델로 구조화된 JSON 응답 생성
- 타입 안정성 보장 및 검증

#### LLM Agent Fallback 동작 원리

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DefaultLLMAgent.completion()                        │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  Try Primary         │
                    │  PerplexityClient    │
                    └──────┬───────────────┘
                           │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌───────────────┐                      ┌───────────────┐
│   Success ✅  │                      │   Failure ❌   │
│               │                      │               │
│ Return        │                      │ Log Warning   │
│ Response      │                      └──────┬────────┘
└───────────────┘                             │
                                               ▼
                                    ┌──────────────────────┐
                                    │  Try Fallback        │
                                    │  GeminiClient        │
                                    └──────┬───────────────┘
                                           │
                    ┌──────────────────────┴───────────────────┐
                    │                                          │
                    ▼                                          ▼
            ┌───────────────┐                          ┌───────────────┐
            │   Success ✅  │                          │   Failure ❌   │
            │               │                          │               │
            │ Return        │                          │ Raise         │
            │ Response      │                          │ Exception      │
            └───────────────┘                          └───────────────┘
```

**Fallback 트리거 조건**:

- 네트워크 오류
- API 레이트 리밋
- 타임아웃
- 서버 오류 (5xx)
- 기타 예외 상황

### 주요 설계 원칙

1. **책임 분리**: OG 추출 ↔ AI 분석 완전 분리
2. **인프라 분리**: QueueManager는 범용 인프라, Service는 비즈니스 로직만
3. **OG 메타데이터 필수**: AI 분석은 반드시 OG 데이터 선행 요구
4. **No Fallback 추출**: AI 분석 중 자동 OG 추출 금지
5. **LLM Fallback**: Agent 레벨 fallback (Perplexity → Gemini)
6. **ARQ 기반 비동기**: Legacy Redis queue 제거, ARQ 전용
7. **타입 안정성**: 사전 타입 분류로 Union 타입 문제 해결
8. **명시적 Job 등록**: Worker에서 실행 가능한 job을 명시적으로 선언

### gRPC API 엔드포인트

#### ExtractOGData (동기)

**목적**: OG 메타데이터 추출

```protobuf
rpc ExtractOGData (ExtractOGDataRequest) returns (ExtractOGDataResponse);
```

**Request**:

```json
{
  "url": "https://example.com/article"
}
```

**Response**:

```json
{
  "success": true,
  "url": "https://example.com/article",
  "title": "Article Title",
  "description": "Article description...",
  "image": "https://example.com/og-image.jpg",
  "site_name": "Example Site"
}
```

**사용 시나리오**: Backend가 링크 저장 시 기본 메타데이터 즉시 확보

---

#### AnalyzeLink (비동기)

**목적**: AI 분석 작업을 ARQ 큐에 추가

```protobuf
rpc AnalyzeLink (AnalyzeLinkRequest) returns (AnalyzeLinkResponse);
```

**Request**:

```json
{
  "url": "https://example.com/article",
  "post_id": "post_123",
  "title": "Article Title",
  "description": "Article description...",
  "site_name": "Example Site"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Analysis job enqueued",
  "batch_id": "job_abc123"
}
```

**플로우**:

1. MetadataServicer가 QueueManager를 통해 ARQ job queue에 작업 추가
2. 즉시 응답 반환 (비동기)
3. ARQ worker가 백그라운드에서 `analyze_link_job` 실행
4. MetadataExtractService의 `_analyze_link()`로 비즈니스 로직 처리
5. 완료 시 Backend gRPC로 결과 전송 (향후 구현)

**사용 시나리오**: 사용자가 링크 저장 → 백그라운드 AI 분석 → 완료 시 알림

---

#### AnalyzeLinkDirect (동기)

**목적**: 즉시 AI 분석 결과 반환 (테스트/개발용)

```protobuf
rpc AnalyzeLinkDirect (AnalyzeLinkRequest) returns (AnalyzeLinkDirectResponse);
```

**Request**: AnalyzeLink와 동일

**Response**:

```json
{
  "success": true,
  "summary": "This article discusses...",
  "keywords": ["AI", "technology", "innovation"],
  "qna": [
    {
      "question": "What is the main topic?",
      "answer": "The article focuses on..."
    }
  ],
  "product_details": {
    "category": "Electronics",
    "brand": "Samsung",
    "price": "999",
    "currency": "USD"
  }
}
```

**사용 시나리오**: 개발/테스트 시 즉시 결과 확인

---

#### ProcessPostEditorial (비동기)

**목적**: 포스트당 에디토리얼 매거진 생성 (Backend `POST /api/v1/post-magazines/generate` → decoded-ai gRPC)

```protobuf
rpc ProcessPostEditorial (ProcessPostEditorialRequest) returns (ProcessPostEditorialResponse);
```

**Request**:
- `post_magazine_id`: UUID (Backend에서 생성)
- `post_data_json`: JSON 직렬화 PostData (post, spots, solutions)

**Response**:
- `success`: bool
- `message`: str
- `batch_id`: optional (ARQ job_id)

**처리 흐름**: gRPC Servicer → QueueManager.enqueue_job("post_editorial_job") → ARQ Worker → PostEditorialService.post_editorial_job → LangGraph 파이프라인 (DesignSpec, Editorial, CelebSearch, ItemSearch, Review, Publish) → Supabase post_magazines 업데이트

상세 문서: [docs/post-editorial.md](docs/post-editorial.md)

---

## 최근 주요 변경사항 (2026.02)

### QueueManager 리팩토링: 인프라와 비즈니스 로직 분리

**변경 목적**: 서비스에 혼재된 queue 관리 책임을 범용 인프라로 분리

#### 주요 변경사항

- **QueueManager 생성**: 범용 queue 인프라 컴포넌트 추가
  - 어떤 서비스의 어떤 job이든 enqueue 가능
  - Job type에 무관한 generic API
  - InfrastructureContainer에 등록되어 프로젝트 전체에서 재사용

- **MetadataExtractService 리팩토링**:
  - ARQ pool 관리 코드 제거 (`arq_pool`, `initialize_arq_pool()`)
  - Job enqueue 코드 제거 (`enqueue_analyze_link_job()`)
  - `process_link_direct` → `_analyze_link` 메서드명 변경
  - `analyze_link_job` static method 추가 (ARQ job entry point)

- **gRPC Servicer 업데이트**:
  - QueueManager 주입하여 직접 enqueue 수행
  - API 레이어에서 인프라 직접 사용

- **Worker 업데이트**:
  - 명시적 job functions 선언 (`MetadataExtractService.analyze_link_job`)
  - Service에서 직접 import (의존성 방향: Worker → Service)

- **jobs.py 삭제**: 모든 job 로직이 서비스로 이동

**아키텍처 개선**:

**Before**:

```
MetadataExtractService (혼재)
  ├─ arq_pool (인프라)
  ├─ initialize_arq_pool() (인프라)
  ├─ enqueue_analyze_link_job() (인프라)
  └─ analyze_link() (비즈니스 로직)
```

**After**:

```
QueueManager (범용 인프라)
  └─ enqueue_job(job_name, *args, **kwargs)

MetadataExtractService (비즈니스 로직만)
  ├─ analyze_link_job() [static]
  └─ _analyze_link() [instance]

gRPC Servicer (API 레이어)
  ├─ queue_manager (주입)
  └─ metadata_extract_service (주입)
```

**개선점**:

1. **단일 책임**: QueueManager는 인프라, Service는 비즈니스 로직, Servicer는 API 레이어
2. **범용성**: QueueManager는 어떤 서비스에서든 재사용 가능
3. **명시성**: Worker에서 실행 가능한 job이 명확히 선언됨
4. **테스트 용이성**: QueueManager mock으로 서비스 테스트 가능
5. **확장성**: 새 서비스 추가 시 QueueManager 수정 불필요

---

### 대규모 리팩토링: 코드 경량화 및 책임 분리

**변경 규모**: ~1,000줄 이상 삭제

#### Phase 1-7: 레거시 코드 제거

- Redis `ex` 파라미터 버그 수정
- Debug print 및 미사용 메서드 제거
- LLM Adapter 클래스 통합 (PerplexityAdapter/Client → PerplexityClient)
- 네이밍 일관성 (UnifiedRetryManager → FailedItemsManager)
- **Fallback 로직 제거**:
  - OG 추출 fallback 제거 → OG 메타데이터 필수화
  - DI 초기화 fallback 제거 → 엄격한 의존성 주입

#### Phase 8: ProcessDataBatch RPC 완전 삭제 (767줄 삭제)

- 배치 처리 RPC 및 인프라 제거
- Proto 파일에서 DataItem, ProcessDataBatchRequest/Response 삭제
- Manager에서 11개 배치 관련 메서드 삭제
- **남은 엔드포인트**: ExtractOGData, AnalyzeLink, AnalyzeLinkDirect

#### Phase 10: Legacy Redis Queue 제거 (102줄 삭제)

- Redis list 기반 legacy queue 완전 제거
- ARQ 전용 아키텍처로 전환
- `dequeue_analysis_requests()` 메서드 삭제

### 아키텍처 개선 효과

**Before**:

```
ProcessDataBatch
  ├─ 배치로 여러 아이템 처리
  ├─ OG 없으면 자동 추출 (fallback)
  └─ Legacy Redis queue + ARQ 혼용
```

**After**:

```
ExtractOGData (동기) → OG 메타데이터만 추출
       ↓
AnalyzeLink (비동기) → ARQ로 AI 분석 큐잉
       ↓
ARQ Worker → 백그라운드 처리 → Backend 콜백
```

**개선점**:

1. **책임 명확화**: OG 추출과 AI 분석 완전 분리
2. **코드 간소화**: 1,000줄+ 레거시 코드 제거
3. **의존성 명확화**: OG 메타데이터 필수 입력
4. **단순한 비동기**: ARQ 단일 queue 시스템

---

## 실행 방법

### 1. 환경 변수 설정

- `.prod.env`, `.dev.env` 등 환경 파일을 준비하세요.
- 예시 변수: `APP_ENV`, `REDIS_PASSWORD`, `API_SERVER_ACCESS_TOKEN` 등

### 2. Docker Compose로 실행

#### prod 환경 실행

```bash
docker-compose -f docker-compose-ai.yml up --build
```

#### dev 환경 실행

```bash
docker-compose -f docker-compose-ai-dev.yml up --build
```

### 3. Llama 서버(로컬 LLM) 셋업 및 실행

- **llama.cpp 설치**
  ```bash
  brew install llama.cpp
  ```
- **모델 다운로드 및 준비**
  ```bash
  llama-cli -hf google/gemma-3-4b-it-qat-q4_0-gguf --hf-token <your_huggingface_token>
  ```
- **llama 서버 실행**
  ```bash
  llama-server --model /Users/dongho/Library/Caches/llama.cpp/google_gemma-3-4b-it-qat-q4_0-gguf_gemma-3-4b-it-q4_0.gguf --port 1234
  ```
- 서버가 정상적으로 실행되면, [src/managers/llm/\_llama.py](src/managers/llm/_llama.py)에서 해당 서버(포트 1234)로 API 요청을 보냅니다.
- **테스트**: 서버 실행 후 다음 명령어로 llama manager가 정상 작동하는지 테스트할 수 있습니다.
  ```bash
  pytest tests/manager/test_llama.py
  ```

### 4. 실패 처리 및 재시도 시스템 테스트

시스템에는 자동 실패 처리 및 재시도 기능이 내장되어 있습니다:

- **자동 시작**: 서버 시작시 TaskScheduler가 자동으로 시작됩니다
- **실패 감지**: 메타데이터 추출 실패시 자동으로 Redis에 저장됩니다
- **자동 재시도**: 설정된 간격에 따라 실패한 아이템들이 자동 재시도됩니다
- **정리 작업**: 오래된 실패 아이템들이 자동으로 정리됩니다

#### 테스트 방법

```bash
# 태스크 스케줄러 및 실패 처리 시스템 테스트
python test_task_scheduler.py

# 구 버전 테스트 (참고용)
python test_retry_system.py
```

#### 실패 처리 시스템 구조

- **실패 분류**: 7가지 에러 타입으로 자동 분류 (네트워크, 타임아웃, 레이트 리밋 등)
- **스마트 재시도**: Exponential backoff (1분 → 2분 → 4분 → 8분 → 16분)
- **영구 실패 처리**: API 키 오류, 무효 콘텐츠 등은 재시도하지 않음
- **Redis 저장소**: `failed_items`, `retry_queue`, `permanent_failed` 키 사용
