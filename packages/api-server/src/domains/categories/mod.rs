//! Categories domain module
//!
//! 카테고리 관리 및 API 엔드포인트

pub mod cache;
pub mod dto;
pub mod handlers;
pub mod service;

pub use cache::*;
pub use dto::*;
pub use handlers::*;
pub use service::*;

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests;
