pub mod app_state;
pub mod batch;
pub mod config;
pub mod constants;
pub mod domains;
pub mod entities;
pub mod error;
pub mod grpc;
pub mod handlers;
pub mod metrics;
pub mod middleware;
pub mod observability;
pub mod openapi;
pub mod router;
pub mod services;
pub mod utils;

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
pub mod tests;

pub use app_state::AppState;
pub use config::AppConfig;
pub use error::{AppError, AppResult};
pub use services::search::{IndexConfig, MeilisearchClient};
