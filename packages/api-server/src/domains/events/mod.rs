//! Events domain — behavioral analytics event ingest.
//!
//! `POST /api/v1/events` — web 의 behaviorStore.flush() (sendBeacon) 배치 수집 엔드포인트.
//! 인증된 유저만 허용 (익명 401 반환). 서버가 user_id 를 JWT 에서 강제 주입하여
//! 클라이언트 조작 불가.

pub mod dto;
pub mod handlers;
pub mod service;

pub use handlers::router;
