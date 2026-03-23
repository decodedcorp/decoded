//! Search Service
//!
//! Meilisearch 기반 검색 서비스

pub mod client;
pub mod config;
pub mod index_config;
pub mod meilisearch;
pub mod synonym_manager;

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests;

pub use client::{DummySearchClient, SearchClient};
pub use config::{IndexName, SearchError, SearchOptions};
pub use index_config::IndexConfig;
pub use meilisearch::MeilisearchClient;
pub use synonym_manager::SynonymManager;
