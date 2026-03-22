# DECODED Backend 구현 계획서 (PLAN.md)

이 문서는 REQUIREMENT.md와 AGENT.md를 기반으로 한 실제 구현 스펙입니다.
각 태스크 완료 시 커밋 해시를 기록합니다.

**버그 추적**: 버그 관련 내용은 [BUG.md](./BUG.md)를 참조하세요.

---

## ⚠️ 필독: 개발 규칙 및 가이드라인

### 0. 개발 전 필수 확인사항

**개발을 시작하기 전 반드시 [REQUIREMENT.md](./REQUIREMENT.md)를 참고하세요.**

- 모든 기능 명세와 데이터 구조는 REQUIREMENT.md에 정의되어 있습니다.
- API 설계, 데이터베이스 스키마, 비즈니스 로직의 기준 문서입니다.
- 불명확한 요구사항이 있다면 REQUIREMENT.md를 먼저 확인하세요.

### 1. 커밋 전 필수 체크리스트

**모든 커밋 전에 반드시 실행:**

```bash
cargo fmt --check    # 포맷 체크 (실패 시 cargo fmt 실행)
cargo check          # 빌드 체크 (컴파일 에러 확인)
```

**모든 체크가 통과해야만 커밋 가능합니다. 예외 없음.**

### 2. 기타 규칙

1. **커밋 단위**: 각 체크박스 항목 완료 시 개별 커밋
2. **커밋 메시지**: `feat(phase-X): 작업 내용` 형식
3. **커밋 해시**: 체크박스 옆에 7자리 해시 기록
4. **도메인 구조**: `mod.rs`, `handlers.rs`, `service.rs`, `dto.rs`, `tests.rs`
5. **마이그레이션**: 각 도메인 시작 시 마이그레이션 먼저 작성/실행, RLS 및 인덱스 포함
6. **Entity 재생성**: 마이그레이션 후 `sea-orm-cli generate entity` 실행
7. **Trait 기반 추상화**: 외부 서비스는 Trait로 추상화
8. **KISS 원칙**: 불필요한 추상화 지양, 단순하게 구현
9. **PLAN.md 업데이트**: 매 작업 완료 시 PLAN.md 체크박스 및 커밋 해시 즉시 업데이트
10. **TDD (Test-Driven Development)**: AGENT.md 1.3 준수 - "Red → Green → Refactor" 사이클 엄격히 적용

---

## 기술 스택 및 버전

| 크레이트             | 버전    | 비고                              |
| -------------------- | ------- | --------------------------------- |
| axum                 | 0.8.8   | REQUIREMENT.md 명시               |
| tokio                | 1.36    | 최신 버전                         |
| tower                | 0.5     | REQUIREMENT.md 명시               |
| tower-http           | 0.6     | REQUIREMENT.md 명시 (cors, trace) |
| sea-orm              | 1.1.19  | REQUIREMENT.md 명시               |
| sea-orm-migration    | 1.1.19  | 마이그레이션용                    |
| serde                | 1.0     | 최신 버전                         |
| serde_json           | 1.0     | 최신 버전                         |
| meilisearch-sdk      | 0.32.0  | REQUIREMENT.md 명시               |
| aws-sdk-s3           | 1.119.0 | REQUIREMENT.md 명시               |
| jsonwebtoken         | 9       | JWT 검증                          |
| validator            | 0.18    | DTO 검증                          |
| thiserror            | 2       | 에러 타입                         |
| tracing              | 0.1     | 로깅                              |
| tokio-cron-scheduler | 0.13    | 배치 스케줄러                     |

---

## 프로젝트 구조 (도메인별 분리)

```
decoded-api/
├── Cargo.toml
├── .env.example
├── migration/                 # SeaORM 마이그레이션
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs
│       ├── main.rs
│       ├── m20240101_000001_create_users.rs
│       ├── m20240101_000002_create_categories.rs
│       └── ...
├── entity/                    # SeaORM 엔티티 (자동 생성)
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs
│       ├── prelude.rs
│       ├── users.rs
│       ├── posts.rs
│       └── ...
└── src/
    ├── main.rs
    ├── lib.rs
    ├── config.rs              # AppConfig, AppState
    ├── error.rs               # AppError, AppResult
    ├── middleware/
    │   ├── mod.rs
    │   ├── auth.rs            # JWT 검증
    │   ├── logger.rs          # 요청/응답 로깅
    │   └── cors.rs            # CORS 설정
    ├── domains/               # 도메인별 비즈니스 로직
    │   ├── mod.rs
    │   ├── users/
    │   │   ├── mod.rs
    │   │   ├── handlers.rs
    │   │   ├── service.rs
    │   │   ├── dto.rs
    │   │   └── tests.rs
    │   ├── posts/
    │   ├── spots/
    │   ├── solutions/
    │   ├── votes/
    │   ├── comments/
    │   ├── rankings/
    │   ├── badges/
    │   ├── feed/
    │   ├── search/
    │   ├── earnings/
    │   └── admin/
    ├── services/              # 외부 서비스 연동 (Trait 기반)
    │   ├── mod.rs
    │   ├── llm.rs             # LLMClient trait + LLMMessage/LLMResponse
    │   ├── storage.rs         # StorageClient trait
    │   ├── search.rs          # SearchClient trait
    │   └── affiliate.rs       # AffiliateClient trait (Rakuten)
    ├── batch/                 # 배치 작업
    │   ├── mod.rs
    │   ├── scheduler.rs       # 스케줄러 설정
    │   ├── rank_update.rs
    │   ├── badge_check.rs
    │   ├── trending_calc.rs
    │   └── click_aggregation.rs
    ├── utils/
    │   ├── mod.rs
    │   ├── jwt.rs
    │   └── pagination.rs
    └── tests/                 # 테스트 유틸리티
        ├── mod.rs
        ├── helpers.rs         # create_test_state(), create_test_app()
        └── fixtures.rs
```

... (Phase 0 ~ Phase 22 내용 생략) ...

## Phase 23: AI 데이터 구조 개선 (keywords, metadata)

### 목표

최신 Gemini 출력 구조에 맞춰 데이터 파이프라인을 개선하고, 다국어 키워드 지원을 추가합니다. `solutions` 테이블 스키마를 변경하고 gRPC 프로토콜을 업데이트합니다.

### 23.1 DB 마이그레이션 (decoded-api)

- [x] `migration/src/m20260127_000001_update_solutions_schema.rs` 작성 | 커밋: d8366f2
  - `solutions` 테이블에 `keywords` JSONB 컬럼 추가
  - `ai_metadata` 컬럼명을 `metadata`로 변경 (기존 데이터 보존)
  - `metadata` 컬럼 코멘트 업데이트
- [ ] 마이그레이션 실행 및 Entity 재생성 | 커밋: (마이그레이션 실행 필요)

### 23.2 gRPC 스키마 업데이트 (Both)

- [x] `backend.proto` 수정 | 커밋: d8366f2 (decoded-api), 36ed5ee (decoded-ai)
  - `LinkMetadata` 메시지 구조 변경
  - `content_metadata` -> `metadata` (field 10)
  - `qa_pairs` -> `qna` (field 2)
  - `keywords` (field 12) 확인 및 유지

### 23.3 Backend 로직 수정 (decoded-api)

- [x] `src/entities/solutions.rs` 업데이트 | 커밋: d8366f2
  - `ai_metadata` 필드를 `metadata`로 변경
  - `keywords` 필드 추가
- [x] `src/services/backend_grpc/server.rs` 업데이트 | 커밋: d8366f2
  - `ProcessedBatchUpdate` 핸들러 수정
  - `LinkMetadata` 매핑 로직 변경
  - `keywords` -> `active_solution.keywords`
  - `metadata` -> `active_solution.metadata`
  - `qna` -> `active_solution.qna`
- [x] `src/batch/qa_generation.rs` 업데이트 | 커밋: d8366f2
  - `ai_metadata` -> `metadata` 필드명 변경
  - **참고**: 이 파일은 Phase 27에서 제거됨 (QA 생성은 decoded-ai 서버에서 처리)
- [x] `src/domains/solutions/service.rs` 업데이트 | 커밋: d8366f2
  - `ai_metadata` -> `metadata` 필드명 변경

### 23.4 AI 서비스 수정 (decoded-ai)

- [x] `src/services/metadata/processors/link_processor.py` 수정 | 커밋: 36ed5ee
  - **프롬프트 업데이트**: 키워드를 일본어, 태국어, 한국어, 영어로 추출하도록 지시
  - Gemini 응답 처리 로직 수정 (`metadata`, `keywords` 추출)
  - `keywords`를 `llm_data`에서 직접 추출하도록 변경
- [x] `src/adapters/protobuf_adapter.py` 수정 | 커밋: 36ed5ee
  - `ProcessedLinkMetadata` -> `LinkMetadata` 매핑 수정
  - `content_metadata` -> `metadata` 매핑
  - `qa_pairs` -> `qna` 매핑

## Phase 24: Solution 스키마 최적화 (Column Cleanup)

### 목표

다양한 링크 타입(뉴스, 영상 등) 지원을 위해 `solutions` 테이블에서 상품 전용 컬럼(`price_amount`, `price_currency`, `brand`)을 제거하고 `metadata` JSONB 컬럼으로 통합합니다.

### 24.1 DB 마이그레이션 (decoded-api)

- [x] `migration/src/m20260129_000001_remove_product_fields_from_solutions.rs` 작성 | 커밋: 4a2b3c1
  - `solutions` 테이블에서 `price_amount`, `price_currency`, `brand` 컬럼 삭제
- [x] 마이그레이션 실행 및 Entity 재생성 | 커밋: 4a2b3c1

### 24.2 코드 리팩토링 (decoded-api)

- [x] `src/entities/solutions.rs` 수정 | 커밋: 4a2b3c1
  - 삭제된 필드 제거
- [x] `src/domains/solutions/dto.rs` 수정 | 커밋: 4a2b3c1
  - DTO에서 해당 필드 제거 및 `metadata` 활용
- [x] `src/domains/solutions/service.rs` 수정 | 커밋: 4a2b3c1
  - `create_solution`, `update_solution` 로직 수정
- [x] `src/services/backend_grpc/server.rs` 수정 | 커밋: 4a2b3c1
  - gRPC 데이터 매핑 로직 확인 및 수정
- [x] `src/domains/solutions/handlers.rs` 수정 | 커밋: 4a2b3c1
  - 테스트 핸들러 등 수정

## Phase 25: Solution 테이블 컬럼명 변경 (product_name -> title)

### 목표

`solutions` 테이블의 `product_name` 컬럼을 `title`로 변경하여 상품 외 다양한 콘텐츠(뉴스, 영상 등)를 포괄할 수 있도록 일반화합니다.

### 25.1 DB 마이그레이션 (decoded-api)

- [x] `migration/src/m20260129_000002_rename_solution_product_name_to_title.rs` 작성 | 커밋: 8b3c4d5
  - `ALTER TABLE solutions RENAME COLUMN product_name TO title`
- [x] 마이그레이션 실행 및 Entity 재생성 | 커밋: 8b3c4d5

### 25.2 코드 리팩토링 (decoded-api)

- [x] `src/entities/solutions.rs` 수정 (`product_name` -> `title`) | 커밋: 8b3c4d5
- [x] `src/domains/solutions/dto.rs` 수정 | 커밋: 8b3c4d5
- [x] `src/domains/solutions/service.rs` 수정 | 커밋: 8b3c4d5
- [x] `src/domains/posts/dto.rs` & `service.rs` 수정 | 커밋: 8b3c4d5
- [x] `src/domains/votes/dto.rs` & `service.rs` 수정 | 커밋: 8b3c4d5
- [x] `src/services/backend_grpc/server.rs` 수정 | 커밋: 8b3c4d5
- [x] `src/domains/solutions/handlers.rs` 등 핸들러 수정 | 커밋: 8b3c4d5

### 25.3 검증

- [x] 전체 빌드 및 테스트 | 커밋: 8b3c4d5

## Phase 26: LinkMetadata 타입 정리 및 link_type 지원

### 목표

LinkMetadata 구조를 단순화하고 link_type 기반의 동적 메타데이터 구조로 변경합니다. solutions 테이블에 link_type 컬럼을 추가하여 프론트엔드에서 타입별 UI를 구분할 수 있도록 합니다.

### 26.1 Protobuf 스키마 정리 (Both)

- [x] `decoded-ai/src/grpc/proto/backend/backend.proto` 수정 | 커밋: (AI 서버)
  - ProductDetails, AIAnalysisResult 메시지 제거
  - LinkMetadata에서 og\_\* 필드 제거 (필드 3-9)
  - link_type 필드 추가 (필드 6)
  - BatchItemResult에서 ai_analysis_result 필드 제거
- [x] `decoded-api/proto/backend/backend.proto` 동기화 | 커밋: 0cabe20
- [x] Python protobuf 재생성 | 커밋: (AI 서버)
- [x] Rust protobuf 재생성 | 커밋: 0cabe20

### 26.2 AI 서버 도메인 모델 단순화 (decoded-ai)

- [x] `src/database/models/content.py` 수정 | 커밋: (AI 서버)
  - ProductDetails 클래스 제거
  - ProcessedLinkMetadata 단순화 (og\_\* 필드 제거, link_type 추가, metadata Dict로 변경)
- [x] `src/adapters/protobuf_adapter.py` 수정 | 커밋: (AI 서버)
  - to_link_metadata()에서 JSON 직렬화 로직 추가 (복잡한 타입은 JSON 문자열로 변환)
  - link_type 필드 매핑 추가
- [x] `src/grpc/client/backend_client.py` 수정 | 커밋: (AI 서버)
  - _build_processed_link_metadata() 단순화 (og_\* 필드 제거, link_type 추가)
- [x] `src/services/metadata/processors/link_ai_analyzer.py` 수정 | 커밋: (AI 서버)
  - \_create_product_details() 메서드 제거
  - LLM 응답의 metadata를 직접 사용하도록 변경

### 26.3 백엔드 DB 스키마 확장 (decoded-api)

- [x] `migration/src/m20260130_000001_add_link_type_to_solutions.rs` 작성 | 커밋: 0cabe20
  - solutions 테이블에 link_type 컬럼 추가 (VARCHAR(20), nullable, default "other")
- [x] 마이그레이션 실행 및 Entity 재생성 | 커밋: 0cabe20

### 26.4 백엔드 코드 업데이트 (decoded-api)

- [x] `src/entities/solutions.rs` 수정 | 커밋: 0cabe20
  - link_type 필드 추가
- [x] `src/domains/solutions/dto.rs` 수정 | 커밋: 0cabe20
  - SolutionResponse, SolutionListItem에 link_type 필드 추가
- [x] `src/domains/solutions/service.rs` 수정 | 커밋: 0cabe20
  - DTO 매핑에 link_type 추가
- [x] `src/services/backend_grpc/server.rs` 수정 | 커밋: 0cabe20
  - ai_analysis_result 분기 제거
  - link_metadata에서 link_type 저장 로직 추가
  - metadata JSON 직렬화 처리 (복잡한 값은 JSON 파싱)

### 26.5 검증

- [x] 전체 빌드 및 테스트 | 커밋: 0cabe20

## Phase 27: Gemini 클라이언트 제거 및 이미지 분석 gRPC 전환

### 목표

이미지 분석 기능을 decoded-ai gRPC 서버로 완전히 이전하고, 로컬 Gemini 클라이언트 구현을 제거합니다. QA 생성 배치 작업도 제거하여 모든 AI 처리를 decoded-ai 서버에서 일원화합니다.

### 27.1 Gemini 클라이언트 제거 (decoded-api)

- [x] `src/services/llm/clients/gemini.rs` 제거 | 커밋: 3fcefe9
- [x] `src/services/llm/mod.rs`에서 Gemini 관련 export 제거 | 커밋: 3fcefe9
- [x] `src/services/llm/base/config.rs`에서 Gemini Provider enum 값 제거 | 커밋: 3fcefe9
- [x] `src/config.rs`에서 Gemini 환경 변수 제거 | 커밋: 1286fb4

### 27.2 이미지 분석 gRPC 전환 (decoded-api)

- [x] `proto/ai.proto`에 `AnalyzeImage` RPC 추가 | 커밋: 54e4d23
  - `AnalyzeImageRequest` 메시지 (image_data, item_id, category_rules)
  - `AnalyzeImageResponse` 메시지 (subject, items, metadata)
- [x] `src/services/decoded_ai_grpc/client.rs`에 `analyze_image` 메서드 구현 | 커밋: 54e4d23
- [x] `src/domains/posts/handlers.rs`에서 이미지 분석 핸들러를 gRPC 클라이언트 사용하도록 변경 | 커밋: c3fc4b4
- [x] 이미지 분석 프로세스 문서 업데이트 | 커밋: (문서 업데이트)

### 27.3 QA 생성 배치 작업 제거 (decoded-api)

- [x] `src/batch/qa_generation.rs` 파일 제거 | 커밋: 2e84171
- [x] `src/batch/mod.rs`에서 QA 생성 배치 export 제거 | 커밋: 2e84171
- [x] `src/batch/scheduler.rs`에서 QA 생성 배치 스케줄 제거 | 커밋: 2e84171

### 27.4 프로토콜 변경에 따른 서비스/도메인 업데이트 (decoded-api)

- [x] `src/services/decoded_ai_grpc/client.rs` 프로토콜 변경사항 반영 | 커밋: c3fc4b4
- [x] `src/domains/posts/service.rs` 이미지 분석 로직 업데이트 | 커밋: c3fc4b4
- [x] `src/domains/posts/dto.rs` 이미지 분석 응답 DTO 업데이트 | 커밋: c3fc4b4
- [x] 기타 도메인 서비스 프로토콜 변경사항 반영 | 커밋: c3fc4b4

### 27.5 테스트 및 설정 업데이트 (decoded-api)

- [x] 도메인 테스트 업데이트 (프로토콜 변경사항 반영) | 커밋: d7ec277
- [x] 설정 및 환경 변수 업데이트 | 커밋: 1286fb4
- [x] `.env.example`에서 Gemini 환경 변수 제거 | 커밋: 1286fb4

### 27.6 검증

- [x] 전체 빌드 및 테스트 | 커밋: d7ec277

## Phase 28: 배치 결과 수신 구현 (Idempotency, Bulk Processing, Retry)

### 목표

AI 서버(decoded-ai)에서 30초 주기로 최대 50개씩 배치 전송되는 링크 메타데이터를 안정적으로 수신하고 Solutions 엔티티에 저장합니다. Idempotency, Bulk 처리 최적화, Status 기반 처리, 자동 재시도 메커니즘을 포함합니다.

### 28.1 Proto 필드 정리 (item_id로 통일)

- [x] `proto/backend/backend.proto`에서 `post_id` 필드 제거 | 커밋: 3b04212
- [x] `proto/backend/backend.proto`에서 `ImageMetadata` 메시지 제거 | 커밋: 3b04212
- [x] `item_id` 필드로 통일 (AI 서버와 일치) | 커밋: 3b04212

### 28.2 Migration 및 엔티티 생성

- [x] `migration/src/m20260205_000001_create_processed_batches.rs` 작성 | 커밋: 3b04212
  - Idempotency 체크용 테이블 (batch_id 기반 중복 처리 방지)
- [x] `migration/src/m20260205_000002_create_failed_batch_items.rs` 작성 | 커밋: 3b04212
  - 재시도 큐 테이블 (retry_count, next_retry_at 포함)
- [x] `src/entities/processed_batches.rs` 생성 | 커밋: 3b04212
- [x] `src/entities/failed_batch_items.rs` 생성 | 커밋: 3b04212

### 28.3 핵심 로직 리팩토링 (server.rs)

- [x] `src/services/backend_grpc/server.rs` 전체 리팩토링 | 커밋: 3b04212
  - Idempotency 체크 로직 추가 (배치 중복 처리 방지)
  - Bulk SELECT 구현 (N+1 쿼리 문제 해결)
  - Status 기반 처리 (success/partial/failed 구분)
  - 트랜잭션으로 전체 래핑 (데이터 일관성 보장)
  - 실패 항목 재시도 큐 저장
  - Generic ConnectionTrait 사용 (트랜잭션 지원)

### 28.4 재시도 배치 작업 구현

- [x] `src/batch/retry_failed_items.rs` 생성 | 커밋: 3b04212
  - 5분마다 실행 (cron: "0 */5 * * * *")
  - 지수적 백오프 (2초 → 4초 → 8초)
  - 최대 3회 재시도
- [x] `src/batch/scheduler.rs` 재시도 job 등록 | 커밋: 3b04212
- [x] `src/batch/mod.rs` export 추가 | 커밋: 3b04212

### 28.5 검증

- [x] 전체 빌드 및 컴파일 에러 수정 | 커밋: 3b04212
- [x] 코드 리뷰 및 최종 검증 | 커밋: 3b04212
