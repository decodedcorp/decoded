//! Cloudflare R2 Client
//!
//! S3 호환 API를 사용하는 Cloudflare R2 스토리지

use async_trait::async_trait;
use aws_sdk_s3::{
    config::{Credentials, Region},
    primitives::ByteStream,
    Client as S3Client, Config as S3Config,
};

use crate::config::StorageConfig;
use crate::error::AppError;
use crate::services::storage::StorageClient;

/// Cloudflare R2 Client
pub struct CloudflareR2Client {
    client: S3Client,
    bucket_name: String,
    public_url: String,
}

impl CloudflareR2Client {
    pub async fn new(config: &StorageConfig) -> Result<Self, AppError> {
        if config.endpoint.is_empty() {
            return Err(AppError::Configuration(
                "R2 endpoint is not configured".to_string(),
            ));
        }

        if config.access_key_id.is_empty() || config.secret_access_key.is_empty() {
            return Err(AppError::Configuration(
                "R2 credentials are not configured".to_string(),
            ));
        }

        // Cloudflare R2 Credentials
        let credentials = Credentials::new(
            &config.access_key_id,
            &config.secret_access_key,
            None,
            None,
            "r2",
        );

        // S3 Config for R2
        let s3_config = S3Config::builder()
            .region(Region::new("auto"))
            .endpoint_url(&config.endpoint)
            .credentials_provider(credentials)
            .build();

        let client = S3Client::from_conf(s3_config);

        Ok(Self {
            client,
            bucket_name: config.bucket_name.clone(),
            public_url: config.public_url.clone(),
        })
    }
}

#[async_trait]
impl StorageClient for CloudflareR2Client {
    async fn upload(
        &self,
        key: &str,
        data: Vec<u8>,
        content_type: &str,
    ) -> Result<String, AppError> {
        let body = ByteStream::from(data);

        self.client
            .put_object()
            .bucket(&self.bucket_name)
            .key(key)
            .body(body)
            .content_type(content_type)
            .send()
            .await
            .map_err(|e| AppError::ExternalService(format!("Failed to upload to R2: {}", e)))?;

        Ok(self.get_url(key))
    }

    async fn delete(&self, key: &str) -> Result<(), AppError> {
        self.client
            .delete_object()
            .bucket(&self.bucket_name)
            .key(key)
            .send()
            .await
            .map_err(|e| AppError::ExternalService(format!("Failed to delete from R2: {}", e)))?;

        Ok(())
    }

    fn get_url(&self, key: &str) -> String {
        format!("{}/{}", self.public_url, key)
    }

    async fn exists(&self, key: &str) -> Result<bool, AppError> {
        match self
            .client
            .head_object()
            .bucket(&self.bucket_name)
            .key(key)
            .send()
            .await
        {
            Ok(_) => Ok(true),
            Err(e) => {
                // NotFound 에러는 파일이 없는 것이므로 false 반환
                let error_message = e.to_string();
                if error_message.contains("NotFound") || error_message.contains("404") {
                    Ok(false)
                } else {
                    Err(AppError::ExternalService(format!(
                        "Failed to check file existence: {}",
                        e
                    )))
                }
            }
        }
    }
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;

    use crate::services::storage::StorageClient;

    fn valid_storage_config() -> StorageConfig {
        StorageConfig {
            endpoint: "https://test.r2.cloudflarestorage.com".to_string(),
            account_id: "acc".to_string(),
            access_key_id: "access".to_string(),
            secret_access_key: "secret".to_string(),
            bucket_name: "test-bucket".to_string(),
            public_url: "https://cdn.example.com/assets".to_string(),
        }
    }

    #[test]
    fn test_r2_client_configuration_error() {
        let mut config = StorageConfig {
            endpoint: String::new(),
            account_id: String::new(),
            access_key_id: String::new(),
            secret_access_key: String::new(),
            bucket_name: "test-bucket".to_string(),
            public_url: "https://example.com".to_string(),
        };

        // No endpoint
        let result = tokio_test::block_on(CloudflareR2Client::new(&config));
        let err = result.err().expect("expected configuration error");
        assert!(
            err.to_string().contains("endpoint"),
            "expected endpoint-related config error, got {err}"
        );

        // No credentials
        config.endpoint = "https://test.r2.cloudflarestorage.com".to_string();
        let result = tokio_test::block_on(CloudflareR2Client::new(&config));
        let err = result.err().expect("expected configuration error");
        assert!(
            err.to_string().contains("credentials"),
            "expected credentials-related config error, got {err}"
        );
    }

    #[test]
    fn test_r2_client_rejects_missing_access_key_only() {
        let mut config = valid_storage_config();
        config.access_key_id.clear();
        let result = tokio_test::block_on(CloudflareR2Client::new(&config));
        let err = result.err().expect("expected configuration error");
        assert!(err.to_string().contains("credentials"));
    }

    #[test]
    fn test_r2_client_rejects_missing_secret_only() {
        let mut config = valid_storage_config();
        config.secret_access_key.clear();
        let result = tokio_test::block_on(CloudflareR2Client::new(&config));
        let err = result.err().expect("expected configuration error");
        assert!(err.to_string().contains("credentials"));
    }

    #[test]
    fn test_r2_get_url_joins_public_url_and_key() {
        let config = valid_storage_config();
        let client = tokio_test::block_on(CloudflareR2Client::new(&config)).unwrap();

        assert_eq!(
            client.get_url("folder/file.png"),
            "https://cdn.example.com/assets/folder/file.png"
        );
        assert_eq!(
            client.get_url("single-segment"),
            "https://cdn.example.com/assets/single-segment"
        );
    }

    #[test]
    fn test_r2_get_url_with_trailing_slash_on_public_url() {
        let mut config = valid_storage_config();
        config.public_url = "https://cdn.example.com/assets/".to_string();
        let client = tokio_test::block_on(CloudflareR2Client::new(&config)).unwrap();

        // Current behavior: join is a single `/` between parts; trailing slash on base yields `//` before key.
        assert_eq!(
            client.get_url("file.png"),
            "https://cdn.example.com/assets//file.png"
        );
    }
}
