//! Admin domain module
//!
//! 관리자 기능 모듈 (콘텐츠 관리, 카테고리 관리, 동의어 관리, 큐레이션 관리, 대시보드)

// 하위 모듈들은 Phase 16.3~16.9에서 구현 예정
pub mod badges;
pub mod categories;
pub mod curations;
pub mod dashboard;
pub mod editorial_candidates;
pub mod magazine_sessions;
pub mod posts;
pub mod solutions;
pub mod spots;
pub mod synonyms;

pub use handlers::router;

mod handlers;

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests;
