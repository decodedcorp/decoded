//! Search 도메인
//!
//! 검색 관련 기능

pub mod dto;
pub mod handlers;
pub mod service;

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests;

pub use dto::*;
pub use handlers::router;
pub use service::SearchService;
