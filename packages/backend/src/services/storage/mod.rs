//! Storage Service
//!
//! 파일 스토리지 추상화 및 Cloudflare R2 구현

pub mod client;
pub mod config;
pub mod image_processor;
pub mod r2;

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests;

pub use client::{DummyStorageClient, StorageClient};
pub use config::{CompressionOptions, ImageFormat, StorageError};
pub use image_processor::ImageProcessor;
pub use r2::CloudflareR2Client;
