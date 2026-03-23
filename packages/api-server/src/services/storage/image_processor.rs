//! 이미지 처리 유틸리티
//!
//! 이미지 압축, 리사이징, 포맷 변환, 썸네일 생성 기능을 제공합니다.

use image::{imageops::FilterType, DynamicImage, GenericImageView, ImageFormat as ImgFormat};
use std::io::Cursor;

use crate::error::AppError;

use super::config::{CompressionOptions, ImageFormat};

/// 이미지 프로세서
pub struct ImageProcessor;

impl ImageProcessor {
    /// 이미지 압축
    ///
    /// # Arguments
    /// * `input_data` - 원본 이미지 데이터
    /// * `options` - 압축 옵션
    ///
    /// # Returns
    /// 압축된 이미지 데이터
    pub fn compress(input_data: &[u8], options: &CompressionOptions) -> Result<Vec<u8>, AppError> {
        // 이미지 로드
        let img = image::load_from_memory(input_data)
            .map_err(|e| AppError::BadRequest(format!("Failed to load image: {}", e)))?;

        // 리사이징 (필요한 경우)
        let img = Self::resize_if_needed(img, options)?;

        // 포맷 변환 및 압축
        let mut output = Vec::new();
        let mut cursor = Cursor::new(&mut output);

        match options.format {
            ImageFormat::Jpeg => {
                let encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(
                    &mut cursor,
                    options.quality,
                );
                img.write_with_encoder(encoder).map_err(|e| {
                    AppError::InternalError(format!("Failed to encode JPEG: {}", e))
                })?;
            }
            ImageFormat::Png => {
                let encoder = image::codecs::png::PngEncoder::new(&mut cursor);
                img.write_with_encoder(encoder)
                    .map_err(|e| AppError::InternalError(format!("Failed to encode PNG: {}", e)))?;
            }
            ImageFormat::WebP => {
                // WebP는 image 크레이트의 기본 기능으로 제공
                img.write_to(&mut cursor, ImgFormat::WebP).map_err(|e| {
                    AppError::InternalError(format!("Failed to encode WebP: {}", e))
                })?;
            }
        }

        Ok(output)
    }

    /// 필요한 경우 이미지 리사이징
    fn resize_if_needed(
        img: DynamicImage,
        options: &CompressionOptions,
    ) -> Result<DynamicImage, AppError> {
        let (width, height) = img.dimensions();

        let max_width = options.max_width.unwrap_or(u32::MAX);
        let max_height = options.max_height.unwrap_or(u32::MAX);

        if width <= max_width && height <= max_height {
            return Ok(img);
        }

        // 종횡비 유지하면서 리사이징
        let (new_width, new_height) =
            Self::calculate_dimensions(width, height, max_width, max_height);

        Ok(img.resize(new_width, new_height, FilterType::Lanczos3))
    }

    /// 종횡비를 유지하면서 새로운 크기 계산
    fn calculate_dimensions(
        width: u32,
        height: u32,
        max_width: u32,
        max_height: u32,
    ) -> (u32, u32) {
        let width_ratio = max_width as f32 / width as f32;
        let height_ratio = max_height as f32 / height as f32;

        let ratio = width_ratio.min(height_ratio);

        (
            (width as f32 * ratio) as u32,
            (height as f32 * ratio) as u32,
        )
    }

    /// 포맷 변환
    ///
    /// # Arguments
    /// * `input_data` - 원본 이미지 데이터
    /// * `target_format` - 대상 포맷
    pub fn convert_format(
        input_data: &[u8],
        target_format: ImageFormat,
    ) -> Result<Vec<u8>, AppError> {
        let options = CompressionOptions {
            quality: 90,
            max_width: None,
            max_height: None,
            format: target_format,
        };

        Self::compress(input_data, &options)
    }

    /// 썸네일 생성
    ///
    /// # Arguments
    /// * `input_data` - 원본 이미지 데이터
    pub fn generate_thumbnail(input_data: &[u8]) -> Result<Vec<u8>, AppError> {
        Self::compress(input_data, &CompressionOptions::thumbnail())
    }

    /// 이미지 파일 검증
    ///
    /// # Arguments
    /// * `data` - 이미지 데이터
    /// * `max_size` - 최대 파일 크기 (바이트)
    ///
    /// # Returns
    /// (width, height, format)
    pub fn validate_image(
        data: &[u8],
        max_size: usize,
    ) -> Result<(u32, u32, ImageFormat), AppError> {
        // 파일 크기 검증
        if data.len() > max_size {
            return Err(AppError::BadRequest(format!(
                "Image too large: {} bytes (max: {} bytes)",
                data.len(),
                max_size
            )));
        }

        // 이미지 로드 및 포맷 검증
        let img = image::load_from_memory(data)
            .map_err(|e| AppError::BadRequest(format!("Invalid image format: {}", e)))?;

        let (width, height) = img.dimensions();

        // 최소 크기 검증 (너무 작은 이미지 방지)
        if width < 10 || height < 10 {
            return Err(AppError::BadRequest(format!(
                "Image too small: {}x{}",
                width, height
            )));
        }

        // 최대 크기 검증 (너무 큰 이미지 방지)
        if width > 10000 || height > 10000 {
            return Err(AppError::BadRequest(format!(
                "Image too large: {}x{}",
                width, height
            )));
        }

        // 포맷 추정 (기본값: JPEG)
        let format = ImageFormat::Jpeg;

        Ok((width, height, format))
    }

    /// EXIF 데이터 제거
    ///
    /// 이미지에서 EXIF 메타데이터를 제거하여 프라이버시를 보호합니다.
    /// 이미지를 재인코딩하면 자동으로 EXIF가 제거됩니다.
    pub fn remove_exif(input_data: &[u8]) -> Result<Vec<u8>, AppError> {
        // 기본 압축 옵션으로 재인코딩 (EXIF 자동 제거)
        Self::compress(input_data, &CompressionOptions::default())
    }
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;

    // 1x1 빨간색 PNG 이미지 (base64 디코딩)
    const TEST_IMAGE_PNG: &[u8] = &[
        137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 2,
        0, 0, 0, 144, 119, 83, 222, 0, 0, 0, 12, 73, 68, 65, 84, 8, 215, 99, 248, 207, 192, 0, 0,
        3, 1, 1, 0, 24, 221, 141, 176, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
    ];

    #[test]
    fn test_calculate_dimensions() {
        // 가로가 더 큰 경우
        let (w, h) = ImageProcessor::calculate_dimensions(1000, 500, 400, 400);
        assert_eq!((w, h), (400, 200));

        // 세로가 더 큰 경우
        let (w, h) = ImageProcessor::calculate_dimensions(500, 1000, 400, 400);
        assert_eq!((w, h), (200, 400));

        // 작은 이미지도 max_width/max_height까지 확대됨 (현재 구현)
        let (w, h) = ImageProcessor::calculate_dimensions(100, 100, 400, 400);
        assert_eq!((w, h), (400, 400));
    }

    #[test]
    fn test_validate_image_too_small() {
        // 1x1 이미지는 최소 크기 요구사항(10x10)을 만족하지 못함
        let result = ImageProcessor::validate_image(TEST_IMAGE_PNG, 1024 * 1024);
        assert!(result.is_err());

        if let Err(e) = result {
            let error_msg = format!("{:?}", e);
            assert!(error_msg.contains("too small"));
        }
    }

    #[test]
    fn test_validate_image_too_large() {
        let result = ImageProcessor::validate_image(TEST_IMAGE_PNG, 10);
        assert!(result.is_err());
    }

    #[test]
    fn test_compress() {
        let options = CompressionOptions::default();
        let result = ImageProcessor::compress(TEST_IMAGE_PNG, &options);
        assert!(result.is_ok());

        let compressed = result.unwrap();
        assert!(!compressed.is_empty());
    }

    #[test]
    fn test_generate_thumbnail() {
        let result = ImageProcessor::generate_thumbnail(TEST_IMAGE_PNG);
        assert!(result.is_ok());

        let thumbnail = result.unwrap();
        assert!(!thumbnail.is_empty());
    }

    #[test]
    fn test_remove_exif() {
        let result = ImageProcessor::remove_exif(TEST_IMAGE_PNG);
        assert!(result.is_ok());
    }

    #[test]
    fn test_compress_png_encoder_branch() {
        let opts = CompressionOptions {
            quality: 90,
            max_width: None,
            max_height: None,
            format: ImageFormat::Png,
        };
        let out = ImageProcessor::compress(TEST_IMAGE_PNG, &opts).expect("png encode");
        assert!(!out.is_empty());
    }

    #[test]
    fn test_compress_webp_branch() {
        let opts = CompressionOptions {
            quality: 80,
            max_width: None,
            max_height: None,
            format: ImageFormat::WebP,
        };
        let out = ImageProcessor::compress(TEST_IMAGE_PNG, &opts).expect("webp encode");
        assert!(!out.is_empty());
    }

    #[test]
    fn test_convert_format_webp() {
        let out =
            ImageProcessor::convert_format(TEST_IMAGE_PNG, ImageFormat::WebP).expect("convert");
        assert!(!out.is_empty());
    }
}
