//! Rankings 도메인
//!
//! 랭킹 및 포인트 관련 기능

pub mod dto;
pub mod handlers;
pub mod service;

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests;

pub use handlers::router;
