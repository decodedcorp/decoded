//! Badges 도메인
//!
//! 뱃지 관련 기능

pub mod dto;
pub mod handlers;
pub mod service;

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests;

pub use handlers::router;
