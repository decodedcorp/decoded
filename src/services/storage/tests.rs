//! Storage Service 통합 테스트
//!
//! CloudflareR2Client, ImageProcessor, CompressionOptions 통합 테스트

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod integration_tests {
    use crate::services::storage::{
        CompressionOptions, DummyStorageClient, ImageFormat, ImageProcessor, StorageClient,
    };

    // 1x1 빨간색 PNG 이미지 (테스트용)
    const TEST_IMAGE_PNG: &[u8] = &[
        137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 2,
        0, 0, 0, 144, 119, 83, 222, 0, 0, 0, 12, 73, 68, 65, 84, 8, 215, 99, 248, 207, 192, 0, 0,
        3, 1, 1, 0, 24, 221, 141, 176, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
    ];

    #[tokio::test]
    async fn test_dummy_storage_client_upload() {
        let client = DummyStorageClient::default();
        let result = client
            .upload("test/image.jpg", vec![1, 2, 3], "image/jpeg")
            .await;

        assert!(result.is_ok());
        let url = result.unwrap();
        assert!(url.contains("test/image.jpg"));
    }

    #[tokio::test]
    async fn test_dummy_storage_client_delete() {
        let client = DummyStorageClient::default();
        let result = client.delete("test/image.jpg").await;

        assert!(result.is_ok());
    }

    #[test]
    fn test_dummy_storage_client_get_url() {
        let client = DummyStorageClient::default();
        let url = client.get_url("test/image.jpg");

        assert_eq!(url, "https://dummy.storage.example.com/test/image.jpg");
    }

    #[tokio::test]
    async fn test_dummy_storage_client_exists() {
        let client = DummyStorageClient::default();
        let result = client.exists("test/image.jpg").await;

        assert!(result.is_ok());
        assert!(result.unwrap());
    }

    #[test]
    fn test_image_processor_compress_workflow() {
        // 압축 워크플로우 테스트
        let options = CompressionOptions::default();
        let result = ImageProcessor::compress(TEST_IMAGE_PNG, &options);

        assert!(result.is_ok());
        let compressed = result.unwrap();
        assert!(!compressed.is_empty());
    }

    #[test]
    fn test_image_processor_convert_format() {
        // 포맷 변환 테스트
        let result = ImageProcessor::convert_format(TEST_IMAGE_PNG, ImageFormat::Png);

        assert!(result.is_ok());
        let converted = result.unwrap();
        assert!(!converted.is_empty());
    }

    #[test]
    fn test_image_processor_generate_thumbnail() {
        // 썸네일 생성 테스트
        let result = ImageProcessor::generate_thumbnail(TEST_IMAGE_PNG);

        assert!(result.is_ok());
        let thumbnail = result.unwrap();
        assert!(!thumbnail.is_empty());
    }

    #[test]
    fn test_image_format_enum() {
        // ImageFormat enum 테스트
        let jpeg = ImageFormat::Jpeg;
        let png = ImageFormat::Png;
        let webp = ImageFormat::WebP;

        assert!(matches!(jpeg, ImageFormat::Jpeg));
        assert!(matches!(png, ImageFormat::Png));
        assert!(matches!(webp, ImageFormat::WebP));
    }

    #[test]
    fn test_compression_options_presets() {
        // CompressionOptions 프리셋 테스트
        let default_opts = CompressionOptions::default();
        assert_eq!(default_opts.quality, 85);

        let thumbnail_opts = CompressionOptions::thumbnail();
        assert_eq!(thumbnail_opts.quality, 80);
        assert_eq!(thumbnail_opts.max_width, Some(400));

        let hq_opts = CompressionOptions::high_quality();
        assert_eq!(hq_opts.quality, 95);
    }

    #[tokio::test]
    async fn test_storage_client_full_workflow() {
        // DummyStorageClient 전체 워크플로우 테스트
        let client = DummyStorageClient::default();

        // 1. 이미지 압축
        let compressed = ImageProcessor::compress(TEST_IMAGE_PNG, &CompressionOptions::default())
            .expect("Compression failed");

        // 2. 업로드
        let url = client
            .upload("test/compressed.jpg", compressed, "image/jpeg")
            .await
            .expect("Upload failed");

        assert!(url.contains("test/compressed.jpg"));

        // 3. 존재 확인
        let exists = client
            .exists("test/compressed.jpg")
            .await
            .expect("Exists check failed");

        assert!(exists);

        // 4. 삭제
        let delete_result = client.delete("test/compressed.jpg").await;
        assert!(delete_result.is_ok());
    }

    #[test]
    fn test_image_format_content_type() {
        // ImageFormat content_type 메서드 테스트
        assert_eq!(ImageFormat::Jpeg.content_type(), "image/jpeg");
        assert_eq!(ImageFormat::Png.content_type(), "image/png");
        assert_eq!(ImageFormat::WebP.content_type(), "image/webp");
    }

    #[test]
    fn test_image_format_as_str() {
        // ImageFormat as_str 메서드 테스트
        assert_eq!(ImageFormat::Jpeg.as_str(), "jpeg");
        assert_eq!(ImageFormat::Png.as_str(), "png");
        assert_eq!(ImageFormat::WebP.as_str(), "webp");
    }

    #[test]
    fn test_image_format_from_extension() {
        // ImageFormat from_extension 메서드 테스트
        assert_eq!(ImageFormat::from_extension("jpg"), Some(ImageFormat::Jpeg));
        assert_eq!(ImageFormat::from_extension("jpeg"), Some(ImageFormat::Jpeg));
        assert_eq!(ImageFormat::from_extension("png"), Some(ImageFormat::Png));
        assert_eq!(ImageFormat::from_extension("webp"), Some(ImageFormat::WebP));
        assert_eq!(ImageFormat::from_extension("unknown"), None);
    }

    #[test]
    fn test_multiple_format_conversions() {
        // 여러 포맷 변환 테스트
        let formats = vec![ImageFormat::Jpeg, ImageFormat::Png, ImageFormat::WebP];

        for format in formats {
            let result = ImageProcessor::convert_format(TEST_IMAGE_PNG, format);
            assert!(result.is_ok(), "Format conversion failed for {:?}", format);
        }
    }
}
