//! 외부 서비스 연동 모듈 (Trait 기반 추상화)
//!
//! 모든 외부 서비스는 Trait으로 추상화하여 구현체에 종속되지 않도록 합니다.
//! - 구현체 변경 시 AppState만 수정 (비즈니스 로직 변경 불필요)
//! - 테스트 시 Mock 구현체로 쉽게 교체
//! - 벤더 종속(Vendor Lock-in) 방지

pub mod affiliate;
pub mod audit;
pub mod backend_grpc;
pub mod decoded_ai_grpc;
pub mod embedding;

pub use backend_grpc::BackendGrpcService;
pub use decoded_ai_grpc::DecodedAIGrpcClient;
pub mod metadata;
pub mod search;
pub mod storage;

pub use affiliate::{
    AffiliateClient, AffiliateProvider, DummyAffiliateClient, LinkConversionResult,
    RakutenAffiliateClient,
};
pub use embedding::{
    upsert_solution_embedding, DummyEmbeddingClient, EmbeddingClient, OpenAIEmbeddingClient,
};
pub use search::{DummySearchClient, IndexName, MeilisearchClient, SearchClient, SearchOptions};
pub use storage::{
    CloudflareR2Client, CompressionOptions, DummyStorageClient, ImageFormat, ImageProcessor,
    StorageClient, StorageError,
};
