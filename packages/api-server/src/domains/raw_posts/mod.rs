//! Raw Posts domain (#258)
//!
//! `/api/v1/raw-posts/*` — admin-gated CRUD + listing for the
//! platform-independent raw post collection pipeline.
//!
//! Writes to `public.raw_posts` are driven by the ai-server callback
//! (`services::raw_posts_callback`), not these handlers.

pub mod dto;
pub mod handlers;
pub mod service;

pub use handlers::router;
