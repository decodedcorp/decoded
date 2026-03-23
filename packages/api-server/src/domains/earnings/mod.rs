//! Earnings domain module
//!
//! 클릭 추적 및 수익/정산 관리 (Phase 15: 클릭 추적만 구현)

pub mod dto;
pub mod handlers;
pub mod service;

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests;

pub use dto::*;
pub use handlers::router;
pub use service::*;
