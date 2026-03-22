//! Spots domain module
//!
//! Spot 관리 및 API 엔드포인트

pub mod dto;
pub mod handlers;
pub mod service;

pub use dto::*;
pub use handlers::router;
pub use service::*;

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests;
