//! Rakuten Affiliate Client Implementation

use async_trait::async_trait;

use crate::config::AffiliateConfig;
use crate::error::AppError;

use super::client::AffiliateClient;

/// Rakuten Affiliate Client
pub struct RakutenAffiliateClient {
    #[allow(dead_code)]
    config: AffiliateConfig,
}

impl RakutenAffiliateClient {
    pub fn new(config: &AffiliateConfig) -> Result<Self, AppError> {
        // API 키가 설정되지 않은 경우 경고만 출력 (필수는 아님)
        if config.api_key.is_empty() {
            tracing::warn!("Rakuten API key is not configured");
        }

        Ok(Self {
            config: config.clone(),
        })
    }
}

#[async_trait]
impl AffiliateClient for RakutenAffiliateClient {
    async fn convert_to_affiliate_link(&self, url: &str) -> Result<String, AppError> {
        // TODO: Phase 2.4에서 Rakuten API 연동 구현
        // 현재는 원본 URL 반환
        tracing::debug!(
            "Rakuten affiliate conversion not yet implemented for: {}",
            url
        );
        Ok(url.to_string())
    }

    fn is_supported(&self, _url: &str) -> bool {
        // TODO: Phase 2.4에서 Rakuten 파트너 도메인 체크 구현
        false
    }
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_rakuten_client_creation() {
        let config = AffiliateConfig {
            api_key: "test-key".to_string(),
            publisher_id: "test-id".to_string(),
        };

        let client = RakutenAffiliateClient::new(&config);
        assert!(client.is_ok());
    }
}
