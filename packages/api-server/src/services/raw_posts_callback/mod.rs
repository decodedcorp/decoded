//! Raw Posts gRPC callback service (#258)
//!
//! Receives results from ai-server after it finishes scraping a source
//! and uploading images to R2. Writes rows into `warehouse.raw_posts`
//! and updates `warehouse.raw_post_sources.last_scraped_at` on success.

pub mod server;
pub use server::RawPostsCallbackService;
