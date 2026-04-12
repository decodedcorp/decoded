//! Warehouse domain module
//!
//! `warehouse.*` 스키마(아티스트/그룹/브랜드 등) 의 프로필 데이터를 읽기
//! 전용으로 노출한다. 홈 페이지가 이름 → 프로필 이미지 매핑을 한 번에
//! 조회할 수 있도록 하기 위한 도메인.

pub mod dto;
pub mod handlers;
pub mod service;

pub use handlers::router;

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests;
