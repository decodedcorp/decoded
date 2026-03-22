//! Affiliate Service 설정 및 타입
//!
//! AffiliateProvider, LinkConversionResult, AffiliateError 등 제휴 관련 타입 정의

use serde::{Deserialize, Serialize};
use std::fmt;

/// 제휴 서비스 프로바이더
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AffiliateProvider {
    /// Rakuten Advertising
    Rakuten,
    /// Amazon Associates (향후 확장)
    Amazon,
    /// 기타 제휴 서비스
    Other,
}

impl AffiliateProvider {
    /// 프로바이더 이름을 문자열로 반환
    pub fn as_str(&self) -> &'static str {
        match self {
            AffiliateProvider::Rakuten => "rakuten",
            AffiliateProvider::Amazon => "amazon",
            AffiliateProvider::Other => "other",
        }
    }
}

impl fmt::Display for AffiliateProvider {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.as_str())
    }
}

/// 링크 변환 결과
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LinkConversionResult {
    /// 원본 URL
    pub original_url: String,

    /// 제휴 링크 URL
    pub affiliate_url: String,

    /// 프로바이더
    pub provider: AffiliateProvider,

    /// 커미션 비율 (퍼센트, 예: 5.5)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub commission_rate: Option<f64>,

    /// 추가 메타데이터
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
}

impl LinkConversionResult {
    /// 새로운 링크 변환 결과 생성
    pub fn new(original_url: String, affiliate_url: String, provider: AffiliateProvider) -> Self {
        Self {
            original_url,
            affiliate_url,
            provider,
            commission_rate: None,
            metadata: None,
        }
    }

    /// 커미션 비율 설정
    pub fn with_commission_rate(mut self, rate: f64) -> Self {
        self.commission_rate = Some(rate);
        self
    }

    /// 메타데이터 설정
    pub fn with_metadata(mut self, metadata: serde_json::Value) -> Self {
        self.metadata = Some(metadata);
        self
    }
}

/// 제휴 서비스 에러
#[derive(Debug, thiserror::Error)]
pub enum AffiliateError {
    /// 링크 변환 에러
    #[error("Conversion error: {0}")]
    ConversionError(String),

    /// API 에러
    #[error("API error: {0}")]
    ApiError(String),

    /// 잘못된 URL
    #[error("Invalid URL: {0}")]
    InvalidUrl(String),

    /// 지원하지 않는 판매처
    #[error("Unsupported merchant: {0}")]
    UnsupportedMerchant(String),

    /// 설정 에러
    #[error("Config error: {0}")]
    ConfigError(String),
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;

    #[test]
    fn test_affiliate_provider_as_str() {
        assert_eq!(AffiliateProvider::Rakuten.as_str(), "rakuten");
        assert_eq!(AffiliateProvider::Amazon.as_str(), "amazon");
        assert_eq!(AffiliateProvider::Other.as_str(), "other");
    }

    #[test]
    fn test_affiliate_provider_display() {
        assert_eq!(format!("{}", AffiliateProvider::Rakuten), "rakuten");
        assert_eq!(format!("{}", AffiliateProvider::Amazon), "amazon");
        assert_eq!(format!("{}", AffiliateProvider::Other), "other");
    }

    #[test]
    fn test_affiliate_provider_equality() {
        assert_eq!(AffiliateProvider::Rakuten, AffiliateProvider::Rakuten);
        assert_ne!(AffiliateProvider::Rakuten, AffiliateProvider::Amazon);
    }

    #[test]
    fn test_link_conversion_result_new() {
        let result = LinkConversionResult::new(
            "https://example.com/product".to_string(),
            "https://affiliate.example.com/product".to_string(),
            AffiliateProvider::Rakuten,
        );

        assert_eq!(result.original_url, "https://example.com/product");
        assert_eq!(
            result.affiliate_url,
            "https://affiliate.example.com/product"
        );
        assert_eq!(result.provider, AffiliateProvider::Rakuten);
        assert!(result.commission_rate.is_none());
        assert!(result.metadata.is_none());
    }

    #[test]
    fn test_link_conversion_result_with_commission_rate() {
        let result = LinkConversionResult::new(
            "https://example.com/product".to_string(),
            "https://affiliate.example.com/product".to_string(),
            AffiliateProvider::Rakuten,
        )
        .with_commission_rate(5.5);

        assert_eq!(result.commission_rate, Some(5.5));
    }

    #[test]
    fn test_link_conversion_result_with_metadata() {
        let metadata = serde_json::json!({"product_id": "12345"});
        let result = LinkConversionResult::new(
            "https://example.com/product".to_string(),
            "https://affiliate.example.com/product".to_string(),
            AffiliateProvider::Rakuten,
        )
        .with_metadata(metadata.clone());

        assert_eq!(result.metadata, Some(metadata));
    }

    #[test]
    fn test_link_conversion_result_serialization() {
        let result = LinkConversionResult::new(
            "https://example.com/product".to_string(),
            "https://affiliate.example.com/product".to_string(),
            AffiliateProvider::Rakuten,
        )
        .with_commission_rate(5.5);

        let json = serde_json::to_string(&result).unwrap();
        assert!(json.contains("\"original_url\""));
        assert!(json.contains("\"affiliate_url\""));
        assert!(json.contains("\"provider\":\"rakuten\""));
        assert!(json.contains("\"commission_rate\":5.5"));
    }

    #[test]
    fn test_affiliate_error_display() {
        let err = AffiliateError::ConversionError("Failed to convert".to_string());
        assert_eq!(err.to_string(), "Conversion error: Failed to convert");

        let err = AffiliateError::ApiError("API limit exceeded".to_string());
        assert_eq!(err.to_string(), "API error: API limit exceeded");

        let err = AffiliateError::InvalidUrl("Invalid URL format".to_string());
        assert_eq!(err.to_string(), "Invalid URL: Invalid URL format");

        let err = AffiliateError::UnsupportedMerchant("example.com".to_string());
        assert_eq!(err.to_string(), "Unsupported merchant: example.com");

        let err = AffiliateError::ConfigError("Missing API key".to_string());
        assert_eq!(err.to_string(), "Config error: Missing API key");
    }

    #[test]
    fn affiliate_provider_deserializes_snake_case_json() {
        assert_eq!(
            serde_json::from_str::<AffiliateProvider>(r#""rakuten""#).unwrap(),
            AffiliateProvider::Rakuten
        );
        assert_eq!(
            serde_json::from_str::<AffiliateProvider>(r#""amazon""#).unwrap(),
            AffiliateProvider::Amazon
        );
        assert_eq!(
            serde_json::from_str::<AffiliateProvider>(r#""other""#).unwrap(),
            AffiliateProvider::Other
        );
    }

    #[test]
    fn affiliate_provider_serde_round_trip() {
        for p in [
            AffiliateProvider::Rakuten,
            AffiliateProvider::Amazon,
            AffiliateProvider::Other,
        ] {
            let json = serde_json::to_string(&p).unwrap();
            let back: AffiliateProvider = serde_json::from_str(&json).unwrap();
            assert_eq!(back, p);
        }
    }

    #[test]
    fn affiliate_provider_invalid_variant_fails_deserialize() {
        assert!(serde_json::from_str::<AffiliateProvider>(r#""Rakuten""#).is_err());
    }

    #[test]
    fn link_conversion_result_deserializes_defaults_optional_fields() {
        let json = r#"{
            "original_url": "https://a.com",
            "affiliate_url": "https://b.com",
            "provider": "rakuten"
        }"#;
        let v: LinkConversionResult = serde_json::from_str(json).unwrap();
        assert_eq!(v.original_url, "https://a.com");
        assert_eq!(v.affiliate_url, "https://b.com");
        assert_eq!(v.provider, AffiliateProvider::Rakuten);
        assert!(v.commission_rate.is_none());
        assert!(v.metadata.is_none());
    }
}
