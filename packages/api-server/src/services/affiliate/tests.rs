//! Affiliate Service 통합 테스트
//!
//! RakutenAffiliateClient, AffiliateProvider, LinkConversionResult 통합 테스트

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod integration_tests {
    use crate::config::AffiliateConfig;
    use crate::services::affiliate::{
        AffiliateClient, AffiliateProvider, DummyAffiliateClient, LinkConversionResult,
        RakutenAffiliateClient,
    };

    #[tokio::test]
    async fn test_dummy_affiliate_client_workflow() {
        let client = DummyAffiliateClient;

        // 링크 변환
        let result = client
            .convert_to_affiliate_link("https://example.com/product/123")
            .await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "https://example.com/product/123");

        // 지원 여부 확인
        assert!(!client.is_supported("https://example.com"));

        // 링크 유효성 검증
        assert!(client.validate_link("https://example.com"));
        assert!(client.validate_link("http://example.com"));
        assert!(!client.validate_link("invalid-url"));
    }

    #[tokio::test]
    async fn test_rakuten_client_creation() {
        let config = AffiliateConfig {
            api_key: "test-key".to_string(),
            publisher_id: "test-publisher".to_string(),
        };

        let client = RakutenAffiliateClient::new(&config);
        assert!(client.is_ok());
    }

    #[tokio::test]
    async fn test_rakuten_client_empty_api_key() {
        let config = AffiliateConfig {
            api_key: String::new(),
            publisher_id: "test-publisher".to_string(),
        };

        let client = RakutenAffiliateClient::new(&config);
        assert!(client.is_ok());
    }

    #[tokio::test]
    async fn test_rakuten_client_convert_link() {
        let config = AffiliateConfig {
            api_key: "test-key".to_string(),
            publisher_id: "test-publisher".to_string(),
        };

        let client = RakutenAffiliateClient::new(&config).unwrap();
        let result = client
            .convert_to_affiliate_link("https://example.com/product")
            .await;

        assert!(result.is_ok());
        // Currently returns original URL
        assert_eq!(result.unwrap(), "https://example.com/product");
    }

    #[test]
    fn test_affiliate_provider_variants() {
        let providers = [
            AffiliateProvider::Rakuten,
            AffiliateProvider::Amazon,
            AffiliateProvider::Other,
        ];

        assert_eq!(providers.len(), 3);
        assert_eq!(providers[0].as_str(), "rakuten");
        assert_eq!(providers[1].as_str(), "amazon");
        assert_eq!(providers[2].as_str(), "other");
    }

    #[test]
    fn test_link_conversion_result_builder_pattern() {
        let result = LinkConversionResult::new(
            "https://example.com/product".to_string(),
            "https://affiliate.example.com/product".to_string(),
            AffiliateProvider::Rakuten,
        )
        .with_commission_rate(5.5)
        .with_metadata(serde_json::json!({"product_id": "12345"}));

        assert_eq!(result.original_url, "https://example.com/product");
        assert_eq!(
            result.affiliate_url,
            "https://affiliate.example.com/product"
        );
        assert_eq!(result.provider, AffiliateProvider::Rakuten);
        assert_eq!(result.commission_rate, Some(5.5));
        assert!(result.metadata.is_some());
    }

    #[test]
    fn test_link_conversion_result_serialization_deserialization() {
        let original = LinkConversionResult::new(
            "https://example.com/product".to_string(),
            "https://affiliate.example.com/product".to_string(),
            AffiliateProvider::Amazon,
        )
        .with_commission_rate(3.0);

        let json = serde_json::to_string(&original).unwrap();
        let deserialized: LinkConversionResult = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.original_url, original.original_url);
        assert_eq!(deserialized.affiliate_url, original.affiliate_url);
        assert_eq!(deserialized.provider, original.provider);
        assert_eq!(deserialized.commission_rate, original.commission_rate);
    }

    #[test]
    fn test_link_conversion_result_optional_fields() {
        let result = LinkConversionResult::new(
            "https://example.com/product".to_string(),
            "https://affiliate.example.com/product".to_string(),
            AffiliateProvider::Other,
        );

        assert!(result.commission_rate.is_none());
        assert!(result.metadata.is_none());

        let json = serde_json::to_string(&result).unwrap();
        assert!(!json.contains("commission_rate"));
        assert!(!json.contains("metadata"));
    }

    #[tokio::test]
    async fn test_affiliate_client_trait_validate_link() {
        let client = DummyAffiliateClient;

        // Valid URLs
        assert!(client.validate_link("https://www.example.com/product"));
        assert!(client.validate_link("http://shop.example.com/item/123"));

        // Invalid URLs
        assert!(!client.validate_link("ftp://example.com"));
        assert!(!client.validate_link("www.example.com"));
        assert!(!client.validate_link(""));
    }

    #[test]
    fn test_affiliate_provider_equality() {
        assert_eq!(AffiliateProvider::Rakuten, AffiliateProvider::Rakuten);
        assert_ne!(AffiliateProvider::Rakuten, AffiliateProvider::Amazon);
        assert_ne!(AffiliateProvider::Amazon, AffiliateProvider::Other);
    }

    #[test]
    fn test_affiliate_provider_display() {
        assert_eq!(format!("{}", AffiliateProvider::Rakuten), "rakuten");
        assert_eq!(format!("{}", AffiliateProvider::Amazon), "amazon");
        assert_eq!(format!("{}", AffiliateProvider::Other), "other");
    }
}
