# Development Progress

## Recent Refactoring (2026-04-21)

### ✅ **Vision 파싱 파이프라인 (#260 — raw_posts → seed_\*)** (2026-04-21)

- **목표**: `warehouse.raw_posts` 의 `parse_status='pending'` 레코드를 Gemini Vision
  으로 파싱해 `ParsedDecodeResult` 로 만든 뒤 `seed_posts / seed_spots /
  seed_solutions / seed_asset` 에 적재. 플랫폼 무관 — raw_posts 가 곧
  source_media 역할을 하므로 신규 테이블 없음.
- **Architecture**:
  - `services/media/` 신규 패키지: `models` / `repository` / `vision_parser` /
    `seed_writer` / `scheduler` + `api/media_controller.py`
  - `MediaParseScheduler` — APScheduler, 10 min interval, claim_pending
    (`FOR UPDATE SKIP LOCKED` + attempts bump) → R2 GET → Gemini →
    SeedWriter → mark_parsed / mark_skipped / mark_failed
  - `MediaVisionParser` — `google-genai` + structured output
    (`response_schema=ParsedDecodeResult`) + `call_gemini_with_fallback`
    재사용 (transient 503/429 → fallback 모델)
  - `SeedWriter` — 단일 트랜잭션으로 seed_posts → seed_asset(ON CONFLICT
    image_hash) → spots+solutions. raw_posts.image_hash 가 비어있으면 sha256
    으로 backfill
  - `POST /media/items/{raw_post_id}/reparse` — admin 수동 재파싱. 동기 await
- **Schema gotchas resolved**:
  - `seed_spots.position_left/top` 이 `text NOT NULL` — int → str(clamp 0–100)
  - `seed_posts.source_post_id/source_image_id` FK (`warehouse.posts/images`)
    는 현재 대응 row 없음 → NULL 유지, 포인터는 `media_source` +
    `metadata.source_raw_post_id` 에 보관
  - `seed_asset.image_hash` UNIQUE → reparse 안전을 위해 `ON CONFLICT DO NOTHING`
  - **SeaORM migration file vs 실제 Supabase dev/prod 스키마 drift 발견**:
    실 스키마에는 `seed_solutions` 테이블 없음, `seed_posts.context` 없음,
    `seed_spots.solutions JSONB` 컬럼이 솔루션 임베드용. SeedWriter 는 실
    스키마(=프로덕션 진실) 기준으로 작성 — solutions 를 JSONB 배열로 임베드,
    seed_solutions INSERT 제거, context → metadata JSON 으로 이전. migration
    파일 자체의 동기화는 후속 작업.
- **Env vars**: `MEDIA_PARSE_INTERVAL_SECONDS=600`, `MEDIA_PARSE_BATCH_SIZE=10`,
  `MEDIA_PARSE_MAX_ATTEMPTS=3`, `GEMINI_VISION_MODEL=gemini-2.5-flash`,
  `GEMINI_VISION_FALLBACK_MODEL=gemini-2.5-flash-lite`
- **Tests**: 31 신규 unit tests (vision_parser 7 / seed_writer 6 / repository 10
  / scheduler 8). 전체 ai-server unit 수트 66/66 통과.
- **Admin UI**: 파싱 결과 표시 + reparse 버튼은 follow-up PR 로 이관.

---

## Recent Refactoring (2026-04-12)

### ✅ **Prompts switched to English (Decoded editorial voice)** (2026-04-12)

- **Problem**: AI pipeline was producing Korean content (ai_summary, editorial,
  image_analysis, post_context, link metadata) because every prompt was
  hardcoded in Korean. The product UI is English-first, so mixed-language
  content created UX inconsistency. The editorial persona also leaked the
  phrase "Hypebeast 'Tagged'" into generated copy.
- **Changes**:
  - `src/post_editorial/nodes/summary.py`: English prompt + context fallback
  - `src/post_editorial/nodes/editorial.py`: persona rewritten as
    "senior fashion editor at Decoded"; explicit ban on mentioning
    "Hypebeast" or "Tagged" in output; all section headers and output
    field descriptions translated to English
  - `src/post_editorial/nodes/image_analysis.py`: JSON schema field
    descriptions and example values in English
  - `src/services/post_context/post_context_service.py`: Ollama vision
    prompt in English; style_tags/mood/setting must be English
  - `src/services/metadata/processors/link_ai_analyzer.py`: link summary,
    qna, and keyword instructions in English
- **Scope**: new content only. Existing Korean rows in DB are untouched
  (gradual transition — existing posts keep their legacy Korean summaries
  until regenerated manually).
- **Brand names unaffected**: prompt still encourages mentioning brand /
  product names (Nike, Gucci, etc.) — only "Hypebeast"/"Tagged" are banned.

---

## Recent Refactoring (2026-03-18)

### ✅ **Post Editorial LangGraph 파이프라인 추가** (2026-03-18)

- **기능**: 포스트당 에디토리얼 매거진 자동 생성
  - Backend `POST /api/v1/post-magazines/generate` → decoded-ai gRPC → ARQ Worker → LangGraph

- **Changes Made**:
  - gRPC `ProcessPostEditorial` RPC, `ProcessPostEditorialRequest/Response` 메시지
  - `PostEditorialService.post_editorial_job` ARQ job (max_jobs=1, job_timeout=600)
  - LangGraph 파이프라인: DesignSpec, ImageAnalysis, ItemResearch → Editorial → CelebSearch, ItemSearch, Summary → Review → Publish
  - 의존성: langgraph, langchain-groq, supabase, tenacity
  - Dockerfile.ai.dev: Python 3.12 (google-genai TypedDict 호환)
  - docs/post-editorial.md 상세 문서

---

## Recent Refactoring (2026-02-04)

### ✅ **Perplexity SDK 전환 완료** (2026-02-04)

- **Problem Identified**: httpx 기반 Perplexity 클라이언트와 SDK 기반 클라이언트의 이원 구조
  - 두 개의 Perplexity 어댑터가 병행 운영되어 혼란 발생
  - `perplexity.py` (httpx 기반)와 `perplexity_sdk.py` (SDK 기반) 동시 존재
  - 라우터에서 두 클라이언트를 모두 사용하여 복잡도 증가
  - `get_provider()` 반환값이 다름 (`"perplexity"` vs `"perplexity_sdk"`)

- **Solution**: SDK 기반 구현체로 완전 전환
  - `perplexity_sdk.py`의 구현을 `perplexity.py`로 통합
  - 클래스명 `PerplexitySDKClient` → `PerplexityClient`로 변경
  - `get_provider()` 반환값을 `"perplexity"`로 통일
  - 단일 Perplexity 클라이언트만 사용하도록 정리

- **Changes Made**:
  - **파일 통합**: `perplexity_sdk.py` → `perplexity.py`
    - SDK 기반 구현을 `perplexity.py`로 이동
    - 클래스명 `PerplexityClient`로 통일
    - `get_provider()` → `"perplexity"` 반환

  - **파일 삭제**: `src/managers/llm/adapters/perplexity_sdk.py` 제거

  - **Container 업데이트**: `src/config/_container.py`
    - `perplexity_sdk_client` Singleton 제거
    - `perplexity_client`만 유지 (SDK 기반 구현 사용)
    - LLMRouter 매핑 단순화:
      - link: [perplexity_client, groq_client, local_llm_client]
      - image: perplexity_client
      - text: perplexity_client

  - **Export 정리**: `src/managers/llm/__init__.py`
    - `PerplexitySDKClient` export 제거
    - `PerplexityClient`만 export

  - **서비스 업데이트**: `src/services/metadata/core/metadata_extract_service.py`
    - `PerplexitySDKClient` → `PerplexityClient` 사용으로 통일

  - **문서 업데이트**: `src/managers/llm/README.md`
    - perplexity_sdk.py 관련 설명 제거
    - 단일 Perplexity 클라이언트 (SDK 기반) 문서화

- **Files Modified**:
  - `src/managers/llm/adapters/perplexity.py`: SDK 구현으로 교체
  - `src/config/_container.py`: perplexity_sdk_client 제거
  - `src/managers/llm/__init__.py`: PerplexitySDKClient export 제거
  - `src/services/metadata/core/metadata_extract_service.py`: PerplexityClient 사용
  - `src/managers/llm/README.md`: 문서 업데이트
  - **Deleted**: `src/managers/llm/adapters/perplexity_sdk.py`

- **Benefits**:
  - ✅ 단일 Perplexity 어댑터로 구조 단순화
  - ✅ 라우터 로직 단순화 (중복 클라이언트 제거)
  - ✅ 코드 일관성 향상 (하나의 표준 구현만 유지)
  - ✅ 유지보수성 향상 (단일 파일만 관리)
  - ✅ 공식 SDK 기반으로 장기 안정성 확보

### ✅ **Perplexity SDK 구현체 추가** (2026-02-04) - 이전 작업

- **Problem Identified**: 기존 httpx 기반 Perplexity 클라이언트의 유지보수 어려움
  - HTTP 요청 로직 직접 구현으로 인한 코드 복잡도 증가
  - API 변경사항 발생 시 수동 대응 필요
  - 재시도 로직, 에러 핸들링을 직접 구현
  - 공식 SDK의 타입 안전성 및 자동 검증 기능 미활용

- **Solution**: 공식 Perplexity Python SDK 기반 새로운 어댑터 구현
  - `perplexityai` 패키지 활용으로 코드 간소화
  - SDK 내장 재시도, 타임아웃, 에러 핸들링 활용
  - Structured Output 완벽 지원 (Pydantic → JSON Schema)
  - DefaultLLMAgent의 fallback으로 테스트 가능

- **Changes Made**:
  - **신규 파일**: `src/managers/llm/adapters/perplexity_sdk.py`
    - PerplexitySDKClient 클래스 구현
    - TEXT/IMAGE ContentType 모두 지원
    - response_schema를 통한 Structured Output 지원
    - Base64 이미지 검증 및 Data URI 변환 로직 포함
    - 기존 PerplexityClient와 동일한 인터페이스 제공

  - **의존성 추가**: `pyproject.toml`
    - `perplexityai (>=0.27.0,<0.28.0)` 추가

  - **Container 업데이트**: `src/config/_container.py`
    - `perplexity_sdk_client` Singleton 추가
    - LLMRouter 매핑 업데이트 (SDK 클라이언트 우선 순위 부여)
    - link: [perplexity_sdk_client, perplexity_client, groq_client, local_llm_client]
    - image: perplexity_sdk_client
    - text: perplexity_sdk_client

  - **Export 추가**: `src/managers/llm/__init__.py`
    - PerplexitySDKClient import 추가

- **Testing Strategy**:
  - DefaultLLMAgent의 fallback으로 테스트
  - 기존 perplexity_client와 병렬 운영으로 안정성 검증
  - Structured Output 파싱 정확도 확인
  - 검증 완료 후 기존 구현체 대체 고려

- **Files Modified**:
  - `src/managers/llm/adapters/perplexity_sdk.py` (신규)
  - `pyproject.toml`
  - `src/config/_container.py`
  - `src/managers/llm/__init__.py`

- **Benefits**:
  - 코드 간소화 (~450줄 → ~450줄, 더 명확한 구조)
  - SDK 자동 재시도 및 에러 핸들링
  - API 변경사항 SDK 업데이트로 자동 반영
  - 타입 안전성 향상으로 개발 오류 감소
  - 공식 지원으로 장기 유지보수성 향상

## Recent Refactoring (2026-02-04)

### ✅ **ContentType Enum 도입 및 타입 안정성 개선** (2026-02-04)

- **Problem Identified**: LLM 클라이언트 인터페이스의 타입 안정성 부족
  - `content_type: str` 파라미터로 인한 오타 가능성
  - IDE 자동완성 지원 부족
  - 런타임에만 발견되는 잘못된 content_type 사용
  - `locale` 파라미터가 모든 메소드에 명시되어 있어 유연성 저하

- **Solution**: ContentType Enum 도입 및 인터페이스 단순화
  - TEXT와 IMAGE 두 가지 타입으로 단순화
  - LINK와 ANALYSIS 제거 (TEXT + url kwarg로 통합)
  - 각 어댑터에 \_validate_kwargs() 메소드 추가
  - locale 파라미터를 kwargs로 이동 (선택적 사용)

- **Changes Made**:
  - **신규 파일**: `src/managers/llm/base/types.py`
    - ContentType Enum 정의 (TEXT, IMAGE)

  - **BaseLLMClient 인터페이스 업데이트**:
    - `content_type: str` → `content_type: ContentType`
    - `locale: str` 파라미터 제거 (kwargs로 이동)
    - `_validate_kwargs()` 메소드 추가

  - **어댑터 업데이트** (PerplexityClient, GroqClient, LocalLLMClient, DefaultLLMAgent):
    - ContentType import 추가
    - completion() 시그니처에서 locale 제거
    - 문자열 비교를 Enum 비교로 변경
    - url kwarg 존재 여부로 link/text 분기 처리
    - locale을 kwargs에서 가져오도록 변경 (기본값 "ko")
    - \_validate_kwargs() 구현 추가

  - **LLMRouter 업데이트**:
    - ContentType enum 지원
    - locale 파라미터를 kwargs로 이동

  - **서비스 레이어 업데이트**:
    - LinkAIAnalyzer: `content_type="analysis"` → `ContentType.TEXT` + url kwarg
    - LinkTypeClassifier: `content_type="text"` → `ContentType.TEXT`
    - ImageProcessor: `content_type="image"` → `ContentType.IMAGE`

- **Files Modified**:
  - `src/managers/llm/base/types.py` (신규)
  - `src/managers/llm/base/client.py`
  - `src/managers/llm/adapters/perplexity.py`
  - `src/managers/llm/adapters/groq.py`
  - `src/managers/llm/adapters/local_llm.py`
  - `src/managers/llm/adapters/gemini.py`
  - `src/managers/llm/adapters/agent.py`
  - `src/managers/llm/routing/router.py`
  - `src/services/metadata/processors/link_ai_analyzer.py`
  - `src/services/metadata/processors/link_type_classifier.py`
  - `src/services/metadata/processors/image_processor.py`

- **Benefits**:
  - ✅ IDE 자동완성으로 개발 생산성 향상
  - ✅ 오타 방지 및 컴파일 타임 타입 체크
  - ✅ kwargs 검증으로 런타임 에러 조기 발견
  - ✅ 코드 가독성 및 유지보수성 향상
  - ✅ 단순화된 타입 체계 (TEXT, IMAGE만 사용)

- **Usage Pattern**:

  ```python
  from src.managers.llm.base.types import ContentType

  # 일반 텍스트 처리
  response = await client.completion(
      messages=messages,
      content_type=ContentType.TEXT
  )

  # 링크 분석 (TEXT + url kwarg)
  response = await client.completion(
      messages=messages,
      content_type=ContentType.TEXT,
      url="https://example.com",
      locale="ko"  # 선택적, kwargs로 전달
  )

  # 이미지 분석
  response = await client.completion(
      messages=messages,
      content_type=ContentType.IMAGE,
      image_data=base64_data,
      locale="en"  # 선택적, kwargs로 전달
  )
  ```

### ✅ **FallbackLLMClient → DefaultLLMAgent 이름 변경** (2026-02-04)

- **Problem Identified**: LLM 클라이언트 wrapper 이름이 표준 사용 패턴을 명확히 표현하지 못함
  - `FallbackLLMClient`: "Fallback"이라는 이름이 실패 케이스를 강조하여 부정적인 느낌
  - 이 클래스가 LLM 작업의 표준 래퍼로 사용될 예정이지만 이름에서 드러나지 않음
  - Agent 패턴을 반영하지 못하고 단순 클라이언트로 보임

- **Solution**: 역할과 의도를 명확히 하는 이름으로 변경
  - `FallbackLLMClient` → `DefaultLLMAgent`
  - "Default"는 표준 사용을 의미하고, "Agent"는 지능적 fallback 관리를 표현

- **Changes Made**:
  - **Renamed** file: `fallback.py` → `agent.py` to better align with class name
  - **Renamed** class: `FallbackLLMClient` → `DefaultLLMAgent` in `agent.py`
  - **Updated** docstring: 표준 LLM 래퍼로서의 역할 명시
  - **Updated** example code: `fallback_client` → `llm_agent` 변수명 변경
  - **Updated** import statements in `metadata_extract_service.py`
  - **Updated** variable names: `fallback_client` → `llm_agent` for clarity
  - **Added** export to `src/managers/llm/adapters/__init__.py`
  - **Updated** documentation in `README.md` and `src/managers/llm/README.md`

- **Files Modified**:
  - `src/managers/llm/adapters/agent.py`: File renamed, class 및 docstring 업데이트
  - `src/services/metadata/core/metadata_extract_service.py`: Import 및 사용처 업데이트
  - `src/managers/llm/adapters/__init__.py`: DefaultLLMAgent export 추가
  - `src/managers/llm/README.md`: 사용 예시 및 설명 업데이트 (4곳)
  - `README.md`: 아키텍처 문서 업데이트 (3곳)

- **Benefits**:
  - ✅ 표준 LLM 래퍼로서의 역할이 이름에서 명확히 드러남
  - ✅ Agent 패턴을 반영하여 지능적 동작을 의미
  - ✅ 긍정적인 네이밍으로 사용성 향상
  - ✅ 향후 모든 LLM 작업의 기본 진입점으로 사용 가능

- **Usage Pattern**:

  ```python
  llm_agent = DefaultLLMAgent(
      primary=gemini_client,
      fallback=perplexity_client
  )

  # 모든 LLM 작업은 agent를 통해 수행
  result = await llm_agent.completion(messages, content_type="link")
  ```

- **No Breaking Changes**:
  - 모든 consumer는 `BaseLLMClient` 인터페이스를 다형적으로 사용
  - 실제 사용처는 `metadata_extract_service.py` 단 1곳

---

## Recent Refactoring (2026-02-03)

### ✅ **gRPC Proto 폴더 네이밍 개선** (2026-02-03)

- **Problem Identified**: Proto 폴더명이 역할과 방향성을 명확히 표현하지 못함
  - `src/grpc/proto/ai/`: 이름만으로는 어떤 gRPC 역할인지 불명확
  - `src/grpc/proto/backend/`: 실제 backend 서버로 나가는 요청인데 이름이 혼란스러움
  - 데이터 흐름 방향이 명확하지 않아 코드 이해에 어려움

- **Solution**: 데이터 흐름 방향을 명확히 표현하는 네이밍으로 변경
  - `ai/` → `inbound/`: 외부 클라이언트 → AI 서버로 들어오는 요청
  - `backend/` → `outbound/`: AI 서버 → Backend 서버로 나가는 콜백

- **Changes Made**:
  - **Renamed** proto folders: `ai/` → `inbound/`, `backend/` → `outbound/`
  - **Renamed** proto files: `ai.proto` → `inbound.proto`, `backend.proto` → `outbound.proto`
  - **Updated** proto package declarations: `package ai;` → `package inbound;`, `package backend;` → `package outbound;`
  - **Regenerated** compiled proto files: `inbound_pb2.py`, `inbound_pb2_grpc.py`, `outbound_pb2.py`, `outbound_pb2_grpc.py`
  - **Updated** all Python imports across the codebase

- **Files Modified**:
  - `src/grpc/proto/inbound/inbound.proto` (renamed from ai.proto, package updated)
  - `src/grpc/proto/outbound/outbound.proto` (renamed from backend.proto, package updated)
  - `src/grpc/servicer/metadata_servicer.py`: Import paths updated to use `inbound_pb2`
  - `src/grpc/client/backend_client.py`: Import paths updated to use `outbound_pb2`
  - `src/main.py`: Import paths updated to use `inbound_pb2_grpc`
  - `src/adapters/protobuf_adapter.py`: Import paths updated to use `outbound_pb2`

- **Benefits**:
  - ✅ Clear data flow direction (inbound = incoming, outbound = outgoing)
  - ✅ Improved code readability and maintainability
  - ✅ Consistent naming convention for future microservices
  - ✅ Better onboarding experience for new developers

- **Architecture Clarity**:
  - **inbound proto** (Queue service): External clients call AI server
    - RPCs: `ExtractOGData`, `AnalyzeLink`, `AnalyzeLinkDirect`
    - Implementation: `MetadataServicer` implements `QueueServicer`
  - **outbound proto** (Metadata service): AI server calls Backend server
    - RPCs: `ProcessedBatchUpdate`
    - Implementation: `GRPCBackendClient` calls `MetadataStub`

---

### ✅ **Proto Cleanup - Remove Unused LinkMetadata and Broken Tests** (2026-02-03)

- **Problem Identified**: Post-refactoring cleanup needed
  - `LinkMetadata` message in ai.proto (lines 21-29) with zero references
  - `test_grpc_batch_processing.py` testing removed `ProcessDataBatch` RPC (broken)

- **Root Cause**: Phase 8 refactoring removed `ProcessDataBatch` RPC but left artifacts
  - Test file imported non-existent classes (QueueServicer, ProcessDataBatchRequest)
  - LinkMetadata message never used (leftover from old product extraction)
  - Confusion between two different "LinkMetadata" messages (ai.proto vs backend.proto)

- **Changes Made**:
  - **Removed** unused `LinkMetadata` message from ai.proto (9 lines)
  - **Regenerated** ai_pb2.py and ai_pb2_grpc.py without LinkMetadata
  - **Fixed** import path in ai_pb2_grpc.py to use absolute imports
  - **Deleted** broken test file test_grpc_batch_processing.py (410 lines)

- **Benefits**:
  - ✅ Removed 419 lines of dead/broken code
  - ✅ Cleaned up proto definitions (ai.proto now only active messages)
  - ✅ Eliminated broken test file that couldn't run
  - ✅ Simplified proto schema maintenance
  - ✅ No functionality impacted (zero references removed)

- **Important Note**: backend.proto's batch-related messages are **still in use**
  - ProcessedBatchUpdate RPC: AI Server → Backend Server (result transmission)
  - Used by ResultAggregator to send processing results to backend
  - Different from removed ProcessDataBatch (Frontend → AI Server, removed in Phase 8)

- **Files Modified**:
  - `src/grpc/proto/ai/ai.proto`: Removed LinkMetadata message (-9 lines)
  - `src/grpc/proto/ai/ai_pb2.py`: Regenerated without LinkMetadata
  - `src/grpc/proto/ai/ai_pb2_grpc.py`: Regenerated + fixed import path
  - **Deleted**: `tests/e2e/test_grpc_batch_processing.py` (-410 lines)

---

### ✅ **MetadataExtractManager와 MetadataExtractService 통합** (2026-02-03)

- **Problem Identified**: MetadataExtractService가 단순 pass-through wrapper
  - Service는 Manager에게 모든 메서드를 위임만 함 (불필요한 indirection)
  - 실제 비즈니스 로직은 Manager에 있고, Service는 빈 껍데기
  - 프로젝트 패턴 불일치: services/에 비즈니스 로직이 있어야 함
  - 혼란스러운 네이밍: `do_extract_og_metadata` vs `extract_og_metadata`

- **Solution**: Manager를 Service로 완전히 통합
  - **병합**: MetadataExtractManager의 모든 로직을 MetadataExtractService로 이동
    - `_initialize_components()` 메서드: 모든 컴포넌트 초기화 (LinkOGExtractor, LinkAIAnalyzer, ImageProcessor, LLM clients)
    - `initialize_arq_pool()` 메서드: ARQ 연결 풀 관리
    - `extract_og_metadata()`: 직접 LinkOGExtractor 호출 (위임 제거)
    - `analyze_link()`: 직접 LinkAIAnalyzer 호출
  - **삭제**: metadata_extract_manager.py 파일 제거 (233 lines)
  - **단순화**: DI Container에서 manager provider 제거
  - **일관성**: ARQ worker, jobs, tasks도 service 사용하도록 업데이트

- **Benefits**:
  - ✅ 불필요한 레이어 제거 (YAGNI 원칙)
  - ✅ 명확한 의존성 (gRPC Servicer → Service, 1 단계)
  - ✅ 프로젝트 패턴 준수 (managers/ = 인프라, services/ = 비즈니스 로직)
  - ✅ 메서드 네이밍 일관성 (`do_*` prefix 제거)
  - ✅ 코드 감소: -94 lines (불필요한 indirection 제거)

- **Complexity Management**:
  - Service 크기: ~230 lines (적절한 수준)
  - 컴포넌트는 이미 잘 분리됨 (LinkOGExtractor, LinkAIAnalyzer, ImageProcessor)
  - Service는 orchestration 역할만 수행
  - 추가 Manager 불필요 (YAGNI)

- **Files Modified**:
  - `src/services/metadata/core/metadata_extract_service.py`: Manager 로직 통합 (+120 lines)
  - `src/config/_container.py`: manager provider 제거, service에 직접 의존성 주입
  - `src/main.py`: ARQ worker가 service 사용
  - `src/managers/queue/worker.py`: Context에 service 주입
  - `src/managers/queue/jobs.py`: Job이 service 사용
  - `src/services/metadata/management/task_configuration.py`: service 사용
  - `src/services/metadata/management/tasks.py`: service 사용
  - `src/api/metadata_controller.py`: service 사용
  - `src/services/metadata/core/__init__.py`: Manager export 제거
  - **Deleted**: `src/services/metadata/core/metadata_extract_manager.py` (-233 lines)

---

### ✅ **SearXNGClient Refactoring - Metadata Extraction** (2026-02-03)

- **Problem Identified**: `_extract_with_searxng` logic was in LinkOGExtractor, but it's actually SearXNG result formatting
  - LinkOGExtractor had two responsibilities: OG extraction + SearXNG result formatting
  - SearXNGClient only performed search, not metadata extraction
  - Poor separation of concerns

- **Solution**: Moved metadata extraction logic to SearXNGClient
  - **Added** `extract_metadata()` method to SearXNGClient (performs search + formats results)
  - **Added** `_extract_site_name()` helper method for URL parsing
  - **Simplified** LinkOGExtractor's `_extract_with_searxng` from 55 lines → 7 lines (delegation only)

- **Benefits**:
  - ✅ Clear responsibility separation (SRP):
    - SearXNGClient: Search + result formatting
    - LinkOGExtractor: OG tag extraction + strategy selection
  - ✅ Reusable metadata extraction for other components
  - ✅ Better testability (independent testing of metadata extraction)
  - ✅ LinkOGExtractor simplified by 48 lines
  - ✅ Aligned with "lightweight code with clear responsibility" goal

- **Files Modified**:
  - `src/services/metadata/clients/searxng_client.py`: Added extract_metadata, \_extract_site_name (+60 lines)
  - `src/services/metadata/extractors/link_og_extractor.py`: Simplified \_extract_with_searxng (-48 lines)

---

### ✅ **ContextEnhancer Removal** (2026-02-03)

- **Problem Identified**: ContextEnhancer (410+ lines) was not being used in the current architecture
  - Only 2 usage sites: LinkOGExtractor accessing `context_enhancer.searxng_client`
  - All context building methods (`build_context`, `build_context_with_results`, etc.) were never called
  - LinkAIAnalyzer uses simple prompts with OG metadata only, doesn't need rich context

- **Architectural Context**: After refactoring that separated LinkProcessor into LinkOGExtractor + LinkAIAnalyzer
  - New architecture emphasizes separation of concerns and simplicity
  - OG extraction and AI analysis are completely separated
  - Rich context building was no longer aligned with the simplified design

- **Changes Made**:
  - **Removed** ContextEnhancer class (411 lines deleted)
  - **Updated** LinkOGExtractor to directly inject `SearXNGClient` instead of ContextEnhancer
  - **Updated** MetadataExtractManager to remove context_enhancer dependency
  - **Updated** DI Container to remove context_enhancer provider
  - **Deleted** entire `src/services/metadata/context/` directory
  - **Total**: ~430 lines of unused code removed

- **Benefits**:
  - ✅ Removed 410+ lines of dead code
  - ✅ Simplified dependency graph
  - ✅ Improved code maintainability and understandability
  - ✅ Aligned with "lightweight code with clear responsibility separation" goal
  - ✅ YAGNI principle applied (can reimplement if needed in future)

- **Files Modified**:
  - `src/services/metadata/extractors/link_og_extractor.py`: Direct SearXNGClient injection
  - `src/services/metadata/core/metadata_extract_manager.py`: Removed context_enhancer parameter
  - `src/config/_container.py`: Removed context_enhancer provider
  - Deleted: `src/services/metadata/context/` directory

### 📝 **Note on Previous ContextEnhancer Architecture**

The ContextEnhancer architecture described below was part of a previous design iteration. While it provided sophisticated context building capabilities (YouTube transcripts, page content extraction, search results integration), the recent refactoring to LinkOGExtractor + LinkAIAnalyzer design made this complexity unnecessary. The current system works effectively with simpler OG metadata-based prompts.

---

## Progressive Enhancement System Implementation

### ✅ **Completed Features**

#### **Context Enhancement & Cost Optimization System** (2025-08-10)

- **ContextEnhancer Architecture Implementation**
  - Created unified `ContextEnhancer` class replacing scattered context building logic
  - Eliminated confusion between `enhanced_content` vs `enriched_context`
  - Consolidated all context building into single responsibility class
  - Support for multiple content types: `link`, `image`, `text`

- **LLM Router Simplification**
  - Removed complex `"local"` content_type - all links now use unified `"link"` type
  - Simplified content type mapping to 3 clear types: `link`, `image`, `text`
  - Platform-specific handling (YouTube, GitHub, etc.) moved to ContextEnhancer
  - LLM Router now focuses purely on client selection and routing

- **LocalLLM Cost Optimization Integration**
  - **Cost-Aware Context Building**: LocalLLM now serves as cost optimization layer
  - **Intelligent Summarization**: Long contexts (>2000 tokens) automatically summarized via LocalLLM
  - **Significant Cost Savings**: Estimated 60-80% reduction in external API costs
    - Before: 5000 token context → Perplexity ($5.00) / Groq ($0.05)
    - After: LocalLLM summary (1000 tokens) → Perplexity ($1.00) / Groq ($0.01)
  - **Quality Preservation**: Summarization preserves all essential metadata extraction information
  - **Configurable Threshold**: `COST_OPTIMIZATION_THRESHOLD` environment variable (default: 2000 tokens)

- **Architectural Benefits**
  - **Single Responsibility**: ContextEnhancer handles context, LinkProcessor handles orchestration
  - **Dependency Injection**: Clean DI pattern with all required services
  - **Extensibility**: Easy to add new platform extractors or content types
  - **Maintainability**: ~150 lines of complex branching logic removed from LinkProcessor

#### **Link Processing Progressive Enhancement** (2025-08-08)

- **PARTIAL Status Backend Transmission**
  - Modified `ResultAggregator` to send both SUCCESS and PARTIAL items to backend
  - Enables immediate availability of partial data while enhancement continues

- **LLM Success/Failure Tracking**
  - Enhanced `ProcessedLinkMetadata` with tracking fields:
    - `llm_enhanced`: Boolean flag for LLM processing success
    - `og_extraction_success`: Boolean flag for OG tag extraction success
    - `search_enhanced`: Boolean flag for image search enhancement
    - `missing_fields`: List of fields that need enhancement
  - Modified `LinkProcessor._get_llm_enhancement` to return success flag

- **Enhanced Status Determination Logic**
  - Improved `_determine_processing_status` to consider LLM success/failure
  - Fixed critical bug where LLM failures were incorrectly classified as SUCCESS
  - Proper PARTIAL/SUCCESS classification based on enhancement success

- **Selective Retry Mechanism**
  - Created `PartialItemRetryManager` class for intelligent retry processing
  - **Smart Target Selection**: Only retries what's needed
    - LLM enhancement failed → retry only LLM processing
    - Image missing → retry only image search
    - OG extraction failed → retry only OG extraction
  - Priority-based retry queue (based on missing fields count)
  - Redis-backed queue management with processing tracking

- **Update Transmission System**
  - Added `send_retry_updates_to_backend` to `ResultAggregator`
  - Automatic backend updates when retry processing improves data quality
  - Support for progressive data enhancement via same item_id updates

- **Automated Task Scheduling**
  - Added partial retry processing task (every 2 minutes)
  - Added partial retry statistics task (every 5 minutes)
  - Automatic queueing of PARTIAL items after batch processing
  - Integrated with existing TaskScheduler system

#### **Unified Retry Management System** (2025-08-08)

- **Consolidated Architecture**
  - Merged `FailedItemsManager` and `PartialItemRetryManager` into `UnifiedRetryManager`
  - Created single `RetryItem` class to handle both FAILED and PARTIAL items
  - Added `ItemStatus` enum for consistent status handling
  - Eliminated code duplication and management complexity

- **Enhanced Redis Structure**
  - Unified Redis keys: `retry_items`, `failed_retry_queue`, `partial_retry_queue`
  - Added processing tracking with `retry_processing` set
  - Maintained separate queues for different retry strategies (time-based vs priority-based)

- **Backward Compatibility**
  - Added legacy aliases (`FailedItemsManager = UnifiedRetryManager`)
  - Updated task configuration with parameter renaming
  - Preserved existing API interfaces for smooth transition

#### **Core System Benefits**

- **Resource Efficiency**: Only processes what needs improvement
- **Fast User Experience**: Immediate data availability with background enhancement
- **Data Loss Prevention**: PARTIAL data is utilized instead of discarded
- **Quality Improvement**: Progressive enhancement increases data completeness over time

### ⚠️ **Current Limitations**

#### **Image Processing - Legacy Approach**

- Image processing still uses original "All or Nothing" approach
- `ProcessedImageMetadata` lacks enhancement tracking fields
- No selective retry mechanism for images
- Image PARTIAL items are sent to backend but no progressive enhancement

### 🔄 **Next Steps / TODO**

#### **Image Processing Progressive Enhancement**

1. **Add Enhancement Tracking to ProcessedImageMetadata**
   - Add fields: `llm_enhanced`, `extraction_success`, `missing_fields`

2. **Modify ImageProcessor**
   - Add LLM success/failure tracking
   - Implement enhanced status determination logic
   - Track missing fields for selective retry

3. **Extend PartialItemRetryManager**
   - Add Image selective retry support
   - Implement image-specific retry targets
   - Add image retry processing methods

4. **Update Task Configuration**
   - Extend partial retry tasks to handle both links and images
   - Add image-specific retry statistics

#### **System Monitoring & Optimization**

1. **Add Monitoring Dashboard**
   - Progressive enhancement success rates
   - Average time to completion tracking
   - Resource usage optimization metrics

2. **Performance Optimization**
   - Optimize retry frequency based on success patterns
   - Implement smart retry scheduling
   - Add batch processing for retry updates

#### **Quality Assurance**

1. **Integration Testing**
   - End-to-end progressive enhancement testing
   - Backend integration validation
   - Retry mechanism stress testing

2. **Production Deployment**
   - Gradual rollout strategy
   - Performance monitoring during deployment
   - Rollback procedures if needed

### 📈 **Impact Metrics**

#### **Problems Solved**

- ❌ **Fixed**: LLM failures incorrectly marked as SUCCESS
- ❌ **Fixed**: PARTIAL data being completely discarded
- ❌ **Fixed**: Inefficient full re-processing of failed items
- ❌ **Fixed**: No progressive data quality improvement

#### **Expected Improvements**

- **Response Time**: ~50% faster initial data availability
- **Resource Usage**: ~30% reduction in unnecessary re-processing
- **Data Quality**: Progressive improvement from PARTIAL → SUCCESS
- **User Experience**: Immediate data availability with background enhancement
- **Maintenance**: Reduced complexity with unified retry management system

---

## Other Development Notes

### Architecture Decisions

- **Progressive Enhancement**: Chosen over "All or Nothing" for better UX
- **Redis-based Queue**: Selected for reliable retry job management
- **gRPC Updates**: Leveraged existing backend communication protocol
- **Selective Targeting**: Implemented to minimize resource waste

### Technical Debt

- Image processing system needs Progressive Enhancement implementation
- ~~Legacy retry system still exists alongside new selective retry~~ **✅ RESOLVED** (Unified retry management system implemented)
- Some code duplication between Link and Image processors

## Bug Fixes & Optimizations

### ✅ **OG Metadata Extraction Fix** (2025-08-08)

- **Problem**: `og_title` and `og_description` were returning `None` despite having content in `link_preview`
- **Root Cause**: Regex patterns in `_extract_title_from_preview()` and `_extract_description_from_preview()` were looking for single-quoted format (`title='value'`) but `LinkPreviewMetadata.__str__()` outputs unquoted format (`Title: value, Description: value`)
- **Solution**: Updated regex patterns to match actual string format:
  - Changed `title='([^']*)'` to `Title: ([^,]+)`
  - Changed `description='([^']*)'` to `Description: ([^,]+(?:, [^,]+)*?)(?:, Site Name:|$)`
- **Impact**: SearXNG searches now work with proper metadata instead of `None` values, improving search context quality
- **Files Modified**: `src/services/metadata/processors/link_processor.py:475, 500`

### ✅ **SearXNG Query Optimization** (2025-08-08)

- **Change**: Modified search query strategy from combined queries to single-value priority
- **Previous Logic**: URL + Title combination → URL + Description combination → URL only
- **New Logic**: Title only → Description only → URL only (single value priority)
- **Reasoning**: Clean single queries often produce better search results than combined URL+metadata queries
- **Implementation**: Updated `_build_optimal_query()` method in `searxng_client.py`
- **Impact**: More focused and cleaner search queries for better context retrieval
- **Files Modified**: `src/services/metadata/clients/searxng_client.py:74-100`

### ✅ **SearXNG URL Parsing & Parallel Search Optimization** (2025-08-10)

- **URL Parsing Query Generation**
  - **Problem**: Title/description 기반 검색 시 부정확한 결과 발생
  - **Solution**: 항상 URL 파싱 결과만 사용하도록 변경
  - **Implementation**: `_parse_url_for_query()` 메서드로 URL을 의미있는 키워드로 변환
    - 도메인에서 서브도메인 제거 (www, blog, news 등)
    - path 세그먼트에서 하이픈/언더스코어를 공백으로 변환
    - 불필요한 패턴 필터링 (숫자, 일반적인 단어 등)
  - **Example**: `https://techcrunch.com/2024/08/10/ai-startup-funding` → `techcrunch ai startup funding`
  - **Files Modified**: `src/services/metadata/clients/searxng_client.py:89-176`

- **Parallel Search Architecture**
  - **Problem**: LinkProcessor에서 SearXNG을 2번 호출 (컨텍스트 + 이미지)
  - **Solution**: 병렬 검색으로 API 호출 50% 감소
  - **Implementation**:
    - `search_parallel()` 메서드로 links + images 동시 검색
    - 도메인 매칭 기반 이미지 품질 점수 시스템
    - `_get_llm_enhancement_with_search()` 통합 처리
  - **Domain Matching Logic**:
    - 정확한 도메인 일치: +2.0 점수
    - 서브도메인 일치: +1.0 점수
    - 같은 루트 도메인: +0.5 점수
  - **Files Modified**:
    - `src/services/metadata/clients/searxng_client.py:178-225, 458-514`
    - `src/services/metadata/processors/link_processor.py:36-64, 93-103`
    - `src/services/metadata/context/context_enhancer.py:143-203`

- **Performance & Quality Impact**
  - **API 호출 최적화**: 2회 → 1회 (50% 감소)
  - **일관된 검색 쿼리**: 동일한 URL 파싱 결과로 links와 images 검색
  - **관련성 높은 이미지**: 도메인 매칭으로 더 정확한 이미지 선택
  - **처리 속도 향상**: 병렬 처리로 전체 응답 시간 단축

### Dependencies

- Redis for retry queue management
- gRPC for backend communication
- TaskScheduler for automated processing
- Existing LLM routing infrastructure
