//! Affiliate Service
//!
//! Rakuten Advertising 기반 제휴 링크 변환 서비스

pub mod client;
pub mod config;
pub mod rakuten;

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests;

pub use client::{AffiliateClient, DummyAffiliateClient};
pub use config::{AffiliateError, AffiliateProvider, LinkConversionResult};
pub use rakuten::RakutenAffiliateClient;
