//! Posts domain module
//!
//! 게시물 관리 및 API 엔드포인트

pub mod dto;
pub mod handlers;
pub mod magazine_preview;
pub mod service;

pub use dto::*;
pub use handlers::router;
pub use magazine_preview::{parse_magazine_preview_items, PostMagazinePreviewItem};
pub use service::*;

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests;
