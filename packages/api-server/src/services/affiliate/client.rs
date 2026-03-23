//! Affiliate Client Trait
//!
//! URL을 제휴 링크로 변환하는 추상화 계층

use async_trait::async_trait;

use crate::error::AppError;

/// Affiliate Client Trait
///
/// URL을 제휴 링크로 변환합니다.
#[async_trait]
pub trait AffiliateClient: Send + Sync {
    /// URL을 제휴 링크로 변환
    async fn convert_to_affiliate_link(&self, url: &str) -> Result<String, AppError>;

    /// 지원하는 URL인지 확인
    fn is_supported(&self, url: &str) -> bool;

    /// 제휴 링크 유효성 검증
    fn validate_link(&self, url: &str) -> bool {
        url.starts_with("http://") || url.starts_with("https://")
    }
}

/// Dummy Affiliate Client (테스트 및 개발용)
pub struct DummyAffiliateClient;

impl Default for DummyAffiliateClient {
    fn default() -> Self {
        Self
    }
}

#[async_trait]
impl AffiliateClient for DummyAffiliateClient {
    async fn convert_to_affiliate_link(&self, url: &str) -> Result<String, AppError> {
        // Dummy: 원본 URL 그대로 반환
        Ok(url.to_string())
    }

    fn is_supported(&self, _url: &str) -> bool {
        false
    }
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_dummy_affiliate_client_convert() {
        let client = DummyAffiliateClient;
        let result = client
            .convert_to_affiliate_link("https://example.com/product/123")
            .await
            .unwrap();
        assert_eq!(result, "https://example.com/product/123");
    }

    #[tokio::test]
    async fn test_dummy_affiliate_client_is_supported() {
        let client = DummyAffiliateClient;
        assert!(!client.is_supported("https://example.com"));
    }

    #[test]
    fn test_dummy_affiliate_client_validate_link() {
        let client = DummyAffiliateClient;
        assert!(client.validate_link("https://example.com"));
        assert!(client.validate_link("http://example.com"));
        assert!(!client.validate_link("ftp://example.com"));
        assert!(!client.validate_link("invalid-url"));
    }

    #[test]
    fn test_dummy_affiliate_client_default() {
        let client = DummyAffiliateClient;
        assert!(!client.is_supported("https://example.com"));
    }
}
