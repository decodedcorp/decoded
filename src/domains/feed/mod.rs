//! Feed 도메인
//!
//! 홈 피드, 트렌딩, 큐레이션 관련 기능

pub mod dto;
pub mod handlers;
pub mod service;

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests;

pub use handlers::router;
