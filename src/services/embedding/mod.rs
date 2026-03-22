//! Embedding Service (OpenAI Embeddings API)
//!
//! Vector Search용 텍스트 임베딩 생성 서비스

pub mod client;
pub mod sync;

pub use client::{DummyEmbeddingClient, EmbeddingClient, OpenAIEmbeddingClient};
pub use sync::upsert_solution_embedding;
