//! Storage 설정 및 공통 타입

use serde::{Deserialize, Serialize};
use thiserror::Error;

/// 이미지 포맷
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ImageFormat {
    Jpeg,
    Png,
    WebP,
}

impl ImageFormat {
    pub fn as_str(&self) -> &'static str {
        match self {
            ImageFormat::Jpeg => "jpeg",
            ImageFormat::Png => "png",
            ImageFormat::WebP => "webp",
        }
    }

    pub fn content_type(&self) -> &'static str {
        match self {
            ImageFormat::Jpeg => "image/jpeg",
            ImageFormat::Png => "image/png",
            ImageFormat::WebP => "image/webp",
        }
    }

    pub fn from_extension(ext: &str) -> Option<Self> {
        match ext.to_lowercase().as_str() {
            "jpg" | "jpeg" => Some(ImageFormat::Jpeg),
            "png" => Some(ImageFormat::Png),
            "webp" => Some(ImageFormat::WebP),
            _ => None,
        }
    }
}

/// 압축 옵션
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompressionOptions {
    /// 품질 (1-100)
    pub quality: u8,
    /// 최대 너비 (픽셀)
    pub max_width: Option<u32>,
    /// 최대 높이 (픽셀)
    pub max_height: Option<u32>,
    /// 출력 포맷
    pub format: ImageFormat,
}

impl Default for CompressionOptions {
    fn default() -> Self {
        Self {
            quality: 85,
            max_width: Some(2048),
            max_height: Some(2048),
            format: ImageFormat::Jpeg,
        }
    }
}

impl CompressionOptions {
    /// 썸네일용 옵션
    pub fn thumbnail() -> Self {
        Self {
            quality: 80,
            max_width: Some(400),
            max_height: Some(400),
            format: ImageFormat::Jpeg,
        }
    }

    /// 고품질 옵션
    pub fn high_quality() -> Self {
        Self {
            quality: 95,
            max_width: Some(4096),
            max_height: Some(4096),
            format: ImageFormat::Png,
        }
    }
}

/// Storage 에러
#[derive(Debug, Error)]
pub enum StorageError {
    #[error("Upload error: {0}")]
    UploadError(String),

    #[error("Delete error: {0}")]
    DeleteError(String),

    #[error("Compression error: {0}")]
    CompressionError(String),

    #[error("Configuration error: {0}")]
    ConfigError(String),

    #[error("Invalid image format: {0}")]
    InvalidFormat(String),

    #[error("Image too large: {0} bytes (max: {1} bytes)")]
    ImageTooLarge(usize, usize),

    #[error("Invalid image dimensions: {0}x{1}")]
    InvalidDimensions(u32, u32),
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;

    #[test]
    fn test_image_format_conversion() {
        assert_eq!(ImageFormat::Jpeg.as_str(), "jpeg");
        assert_eq!(ImageFormat::Jpeg.content_type(), "image/jpeg");

        assert_eq!(ImageFormat::from_extension("jpg"), Some(ImageFormat::Jpeg));
        assert_eq!(ImageFormat::from_extension("png"), Some(ImageFormat::Png));
        assert_eq!(ImageFormat::from_extension("webp"), Some(ImageFormat::WebP));
        assert_eq!(ImageFormat::from_extension("invalid"), None);
    }

    #[test]
    fn test_compression_options() {
        let default = CompressionOptions::default();
        assert_eq!(default.quality, 85);
        assert_eq!(default.max_width, Some(2048));

        let thumbnail = CompressionOptions::thumbnail();
        assert_eq!(thumbnail.quality, 80);
        assert_eq!(thumbnail.max_width, Some(400));

        let high_quality = CompressionOptions::high_quality();
        assert_eq!(high_quality.quality, 95);
        assert_eq!(high_quality.format, ImageFormat::Png);
    }
}
