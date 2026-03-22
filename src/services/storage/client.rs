//! Storage Client Trait
//!
//! 파일 스토리지 추상화 인터페이스

use async_trait::async_trait;

use crate::error::AppError;

/// Storage Client Trait
///
/// 파일 업로드, 삭제, URL 생성 등을 지원합니다.
#[async_trait]
pub trait StorageClient: Send + Sync {
    /// 파일 업로드
    ///
    /// # Arguments
    /// * `key` - 저장할 파일 키 (경로)
    /// * `data` - 파일 데이터
    /// * `content_type` - MIME 타입 (image/jpeg, image/png 등)
    ///
    /// # Returns
    /// 업로드된 파일의 공개 URL
    async fn upload(
        &self,
        key: &str,
        data: Vec<u8>,
        content_type: &str,
    ) -> Result<String, AppError>;

    /// 파일 삭제
    ///
    /// # Arguments
    /// * `key` - 삭제할 파일 키
    async fn delete(&self, key: &str) -> Result<(), AppError>;

    /// 공개 URL 생성
    ///
    /// # Arguments
    /// * `key` - 파일 키
    ///
    /// # Returns
    /// 파일의 공개 URL
    fn get_url(&self, key: &str) -> String;

    /// 파일 존재 여부 확인 (선택적)
    async fn exists(&self, key: &str) -> Result<bool, AppError> {
        // 기본 구현: 항상 false 반환
        let _ = key;
        Ok(false)
    }
}

/// Dummy Storage Client (개발 및 테스트용)
pub struct DummyStorageClient {
    pub base_url: String,
}

impl Default for DummyStorageClient {
    fn default() -> Self {
        Self {
            base_url: "https://dummy.storage.example.com".to_string(),
        }
    }
}

#[async_trait]
impl StorageClient for DummyStorageClient {
    async fn upload(
        &self,
        key: &str,
        _data: Vec<u8>,
        _content_type: &str,
    ) -> Result<String, AppError> {
        Ok(self.get_url(key))
    }

    async fn delete(&self, _key: &str) -> Result<(), AppError> {
        Ok(())
    }

    fn get_url(&self, key: &str) -> String {
        format!("{}/{}", self.base_url, key)
    }

    async fn exists(&self, _key: &str) -> Result<bool, AppError> {
        Ok(true)
    }
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_dummy_storage_client() {
        let client = DummyStorageClient::default();

        // Upload
        let url = client
            .upload("test/image.jpg", vec![1, 2, 3], "image/jpeg")
            .await
            .unwrap();
        assert!(url.contains("test/image.jpg"));

        // Delete
        let result = client.delete("test/image.jpg").await;
        assert!(result.is_ok());

        // Get URL
        let url = client.get_url("test/image.jpg");
        assert_eq!(url, "https://dummy.storage.example.com/test/image.jpg");

        // Exists
        let exists = client.exists("test/image.jpg").await.unwrap();
        assert!(exists);
    }
}
