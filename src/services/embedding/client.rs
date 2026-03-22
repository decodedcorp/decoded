//! Embedding Client Trait and Implementations

use async_trait::async_trait;
use reqwest::Client as HttpClient;
use serde::{Deserialize, Serialize};

use crate::config::EmbeddingConfig;
use crate::error::AppError;

/// Embedding Client Trait
///
/// 텍스트를 벡터로 변환하는 임베딩 API 추상화
#[async_trait]
pub trait EmbeddingClient: Send + Sync {
    /// 단일 텍스트 임베딩
    async fn embed_text(&self, text: &str) -> Result<Vec<f32>, AppError>;

    /// 배치 텍스트 임베딩 (최대 100개 권장)
    async fn embed_batch(&self, texts: &[String]) -> Result<Vec<Vec<f32>>, AppError>;
}

/// OpenAI Embeddings API Client
pub struct OpenAIEmbeddingClient {
    http: HttpClient,
    api_key: String,
    model: String,
    dimensions: u16,
}

impl OpenAIEmbeddingClient {
    pub fn new(config: &EmbeddingConfig) -> Result<Self, AppError> {
        if config.openai_api_key.is_empty() {
            return Err(AppError::Configuration(
                "OPENAI_API_KEY is required for embedding service".to_string(),
            ));
        }

        Ok(Self {
            http: HttpClient::new(),
            api_key: config.openai_api_key.clone(),
            model: config.model.clone(),
            dimensions: config.dimensions,
        })
    }
}

#[derive(Serialize)]
struct EmbeddingRequest {
    model: String,
    input: Vec<String>,
    dimensions: u16,
}

#[derive(Deserialize)]
struct EmbeddingResponse {
    data: Vec<EmbeddingData>,
}

#[derive(Deserialize)]
struct EmbeddingData {
    embedding: Vec<f32>,
    index: usize,
}

#[async_trait]
impl EmbeddingClient for OpenAIEmbeddingClient {
    async fn embed_text(&self, text: &str) -> Result<Vec<f32>, AppError> {
        let results = self.embed_batch(&[text.to_string()]).await?;
        results
            .into_iter()
            .next()
            .ok_or_else(|| AppError::ExternalService("OpenAI returned empty embedding".to_string()))
    }

    async fn embed_batch(&self, texts: &[String]) -> Result<Vec<Vec<f32>>, AppError> {
        if texts.is_empty() {
            return Ok(vec![]);
        }

        let req = EmbeddingRequest {
            model: self.model.clone(),
            input: texts.to_vec(),
            dimensions: self.dimensions,
        };

        let resp = self
            .http
            .post("https://api.openai.com/v1/embeddings")
            .bearer_auth(&self.api_key)
            .json(&req)
            .send()
            .await
            .map_err(|e| AppError::ExternalService(format!("OpenAI API request failed: {}", e)))?;

        if !resp.status().is_success() {
            let status = resp.status();
            let body = resp.text().await.unwrap_or_default();
            return Err(AppError::ExternalService(format!(
                "OpenAI API error {}: {}",
                status, body
            )));
        }

        let body: EmbeddingResponse = resp.json().await.map_err(|e| {
            AppError::ExternalService(format!("Failed to parse OpenAI response: {}", e))
        })?;

        // OpenAI returns data sorted by index; preserve order
        let mut sorted: Vec<_> = body.data.into_iter().collect();
        sorted.sort_by_key(|d| d.index);
        Ok(sorted.into_iter().map(|d| d.embedding).collect())
    }
}

/// Dummy Embedding Client (테스트용)
///
/// 항상 256차원 영벡터를 반환
pub struct DummyEmbeddingClient;

impl Default for DummyEmbeddingClient {
    fn default() -> Self {
        Self
    }
}

#[async_trait]
impl EmbeddingClient for DummyEmbeddingClient {
    async fn embed_text(&self, _text: &str) -> Result<Vec<f32>, AppError> {
        Ok(vec![0.0; 256])
    }

    async fn embed_batch(&self, texts: &[String]) -> Result<Vec<Vec<f32>>, AppError> {
        Ok(texts.iter().map(|_| vec![0.0; 256]).collect())
    }
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;
    use crate::config::EmbeddingConfig;

    #[test]
    fn openai_embedding_client_new_requires_api_key() {
        let cfg = EmbeddingConfig {
            openai_api_key: String::new(),
            model: "text-embedding-3-small".into(),
            dimensions: 256,
        };
        let err = OpenAIEmbeddingClient::new(&cfg);
        assert!(
            matches!(err, Err(AppError::Configuration(ref msg)) if msg.contains("OPENAI_API_KEY"))
        );
    }

    #[tokio::test]
    async fn dummy_client_embed_text_dimension() {
        let c = DummyEmbeddingClient;
        let v = c.embed_text("hello").await.unwrap();
        assert_eq!(v.len(), 256);
        assert!(v.iter().all(|x| *x == 0.0));
    }

    #[tokio::test]
    async fn dummy_client_embed_batch_len_matches_inputs() {
        let c = DummyEmbeddingClient;
        let texts = vec!["a".into(), "b".into(), "c".into()];
        let batch = c.embed_batch(&texts).await.unwrap();
        assert_eq!(batch.len(), 3);
        assert!(batch.iter().all(|row| row.len() == 256));
    }

    #[tokio::test]
    async fn dummy_client_embed_batch_empty_ok() {
        let c = DummyEmbeddingClient;
        let batch = c.embed_batch(&[]).await.unwrap();
        assert!(batch.is_empty());
    }
}
