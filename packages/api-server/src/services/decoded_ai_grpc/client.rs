use base64::{engine::general_purpose, Engine as _};
use std::collections::HashMap;
use std::time::Instant;
use tonic::transport::{Channel, Endpoint};

use crate::domains::posts::dto::{ImageAnalysisMetadata, ItemWithCoordinates};
use crate::error::AppError;
use crate::grpc::inbound::{
    queue_client::QueueClient, AnalyzeImageRequest, AnalyzeImageResponse,
    AnalyzeLinkDirectResponse, AnalyzeLinkRequest, AnalyzeLinkResponse, CategoryRule,
    ExtractOgDataRequest, ExtractOgDataResponse, ExtractPostContextRequest,
    ExtractPostContextResponse, ProcessPostEditorialRequest, ProcessPostEditorialResponse,
};
use crate::observability::grpc::record_decoded_ai_call;

#[derive(Clone, Debug)]
pub struct DecodedAIGrpcClient {
    client: QueueClient<Channel>,
}

impl DecodedAIGrpcClient {
    /// Lazy connect: 실제 연결은 첫 RPC 시점에 수행됩니다.
    /// decoded-ai 서버가 아직 준비되지 않아도 백엔드가 기동됩니다.
    pub fn new(url: String) -> Result<Self, Box<dyn std::error::Error>> {
        let channel = Endpoint::from_shared(url)?.connect_lazy();
        let client = QueueClient::new(channel);
        Ok(Self { client })
    }

    /// URL에서 OG 데이터를 추출합니다.
    pub async fn extract_og_data(
        &self,
        url: String,
    ) -> Result<ExtractOgDataResponse, Box<dyn std::error::Error>> {
        let start = Instant::now();
        let mut client = self.client.clone();
        let request = tonic::Request::new(ExtractOgDataRequest { url });
        let res = async {
            let response = client.extract_og_data(request).await?;
            Ok::<_, Box<dyn std::error::Error>>(response.into_inner())
        }
        .await;
        record_decoded_ai_call("extract_og_data", res.is_ok(), start.elapsed());
        res
    }

    /// 링크 분석을 요청합니다 (비동기 처리).
    pub async fn analyze_link(
        &self,
        url: String,
        post_id: String,
        title: String,
        description: String,
        site_name: String,
    ) -> Result<AnalyzeLinkResponse, Box<dyn std::error::Error>> {
        let start = Instant::now();
        let mut client = self.client.clone();
        let request = tonic::Request::new(AnalyzeLinkRequest {
            url,
            post_id,
            title,
            description,
            site_name,
        });
        let res = async {
            let response = client.analyze_link(request).await?;
            Ok::<_, Box<dyn std::error::Error>>(response.into_inner())
        }
        .await;
        record_decoded_ai_call("analyze_link", res.is_ok(), start.elapsed());
        res
    }

    /// 링크 분석을 즉시 요청합니다 (동기 처리).
    pub async fn analyze_link_direct(
        &self,
        url: String,
        post_id: String,
        title: String,
        description: String,
        site_name: String,
    ) -> Result<AnalyzeLinkDirectResponse, Box<dyn std::error::Error>> {
        let start = Instant::now();
        let mut client = self.client.clone();
        let request = tonic::Request::new(AnalyzeLinkRequest {
            url,
            post_id,
            title,
            description,
            site_name,
        });
        let res = async {
            let response = client.analyze_link_direct(request).await?;
            Ok::<_, Box<dyn std::error::Error>>(response.into_inner())
        }
        .await;
        record_decoded_ai_call("analyze_link_direct", res.is_ok(), start.elapsed());
        res
    }

    /// Post Editorial 파이프라인을 큐에 적재합니다 (비동기 처리).
    pub async fn process_post_editorial(
        &self,
        post_magazine_id: &str,
        post_data_json: &str,
    ) -> Result<ProcessPostEditorialResponse, Box<dyn std::error::Error>> {
        let start = Instant::now();
        let mut client = self.client.clone();
        let request = tonic::Request::new(ProcessPostEditorialRequest {
            post_magazine_id: post_magazine_id.to_string(),
            post_data_json: post_data_json.to_string(),
        });
        let res = async {
            let response = client.process_post_editorial(request).await?;
            Ok::<_, Box<dyn std::error::Error>>(response.into_inner())
        }
        .await;
        record_decoded_ai_call("process_post_editorial", res.is_ok(), start.elapsed());
        res
    }

    /// 이미지 분석을 즉시 요청합니다 (동기 처리).
    pub async fn analyze_image(
        &self,
        image_data: Vec<u8>,
        category_rules_str: String,
    ) -> Result<ImageAnalysisMetadata, AppError> {
        let start = Instant::now();
        let result = self
            .analyze_image_inner(image_data, category_rules_str)
            .await;
        record_decoded_ai_call("analyze_image", result.is_ok(), start.elapsed());
        result
    }

    async fn analyze_image_inner(
        &self,
        image_data: Vec<u8>,
        category_rules_str: String,
    ) -> Result<ImageAnalysisMetadata, AppError> {
        // base64 인코딩
        let base64_data = general_purpose::STANDARD.encode(&image_data);

        // 카테고리 규칙 파싱 (간단한 형태: "Category: SubCat1, SubCat2\n...")
        let category_rules = self.parse_category_rules(&category_rules_str);

        let mut client = self.client.clone();
        let request = tonic::Request::new(AnalyzeImageRequest {
            image_data: base64_data,
            item_id: String::new(),
            category_rules,
        });

        let response = client
            .analyze_image(request)
            .await
            .map_err(|e| AppError::ExternalService(format!("gRPC analyze_image failed: {}", e)))?;

        let response_inner = response.into_inner();

        if !response_inner.success {
            return Err(AppError::ExternalService(format!(
                "Image analysis failed: {}",
                response_inner.error_message
            )));
        }

        // AnalyzeImageResponse를 ImageAnalysisMetadata로 변환
        self.convert_to_metadata(response_inner)
    }

    fn parse_category_rules(&self, rules_str: &str) -> Vec<CategoryRule> {
        let mut rules = Vec::new();
        for line in rules_str.lines() {
            let line = line.trim();
            if line.is_empty() {
                continue;
            }
            // "Category: SubCat1, SubCat2" 형태 파싱
            if let Some((category, sub_cats)) = line.split_once(':') {
                let category = category.trim().to_string();
                let sub_categories = sub_cats
                    .split(',')
                    .map(|s| s.trim().to_string())
                    .collect::<Vec<_>>();
                rules.push(CategoryRule {
                    category,
                    sub_categories,
                });
            }
        }
        rules
    }

    fn convert_to_metadata(
        &self,
        response: AnalyzeImageResponse,
    ) -> Result<ImageAnalysisMetadata, AppError> {
        // items map 변환
        let mut items: HashMap<String, Vec<ItemWithCoordinates>> = HashMap::new();
        for (category, item_list) in response.items {
            let items_vec: Vec<ItemWithCoordinates> = item_list
                .items
                .into_iter()
                .map(|item| ItemWithCoordinates {
                    sub_category: item.sub_category,
                    r#type: item.r#type,
                    top: item.top.map(|v| v.to_string()),
                    left: item.left.map(|v| v.to_string()),
                })
                .collect();
            items.insert(category, items_vec);
        }

        Ok(ImageAnalysisMetadata {
            subject: response.subject,
            title: response.title,
            artist_name: response.artist_name,
            group_name: response.group_name,
            context: response.context,
            items,
        })
    }

    #[cfg(test)]
    pub(crate) fn test_parse_category_rules(&self, s: &str) -> Vec<CategoryRule> {
        self.parse_category_rules(s)
    }

    /// 포스트 이미지에서 context/style_tags를 추출합니다 (Ollama local inference).
    pub async fn extract_post_context(
        &self,
        post_id: String,
        image_url: String,
    ) -> Result<ExtractPostContextResponse, Box<dyn std::error::Error>> {
        let start = Instant::now();
        let mut client = self.client.clone();
        let request = tonic::Request::new(ExtractPostContextRequest { post_id, image_url });
        let res = async {
            let response = client.extract_post_context(request).await?;
            Ok::<_, Box<dyn std::error::Error>>(response.into_inner())
        }
        .await;
        record_decoded_ai_call("extract_post_context", res.is_ok(), start.elapsed());
        res
    }
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;

    fn test_client() -> DecodedAIGrpcClient {
        DecodedAIGrpcClient::new("http://localhost:50051".to_string()).unwrap()
    }

    #[tokio::test]
    async fn new_with_valid_url_succeeds() {
        let c = DecodedAIGrpcClient::new("http://127.0.0.1:50051".to_string());
        assert!(c.is_ok());
    }

    #[tokio::test]
    async fn new_with_https_url_succeeds() {
        let c = DecodedAIGrpcClient::new("https://ai.example.com:443".to_string());
        assert!(c.is_ok());
    }

    #[tokio::test]
    async fn parse_category_rules_simple_line() {
        let c = test_client();
        let rules = c.test_parse_category_rules("Tops: T-Shirts, Hoodies\nBottoms: Pants, Jeans");
        assert_eq!(rules.len(), 2);
        assert_eq!(rules[0].category, "Tops");
        assert_eq!(rules[0].sub_categories, vec!["T-Shirts", "Hoodies"]);
        assert_eq!(rules[1].category, "Bottoms");
        assert_eq!(rules[1].sub_categories, vec!["Pants", "Jeans"]);
    }

    #[tokio::test]
    async fn parse_category_rules_skips_blank_lines() {
        let c = test_client();
        let rules = c.test_parse_category_rules("\n\nTops: A\n\n");
        assert_eq!(rules.len(), 1);
        assert_eq!(rules[0].category, "Tops");
    }

    #[tokio::test]
    async fn parse_category_rules_skips_lines_without_colon() {
        let c = test_client();
        let rules = c.test_parse_category_rules("no colon here\nTops: A, B");
        assert_eq!(rules.len(), 1);
    }

    #[tokio::test]
    async fn parse_category_rules_empty_string() {
        let c = test_client();
        let rules = c.test_parse_category_rules("");
        assert!(rules.is_empty());
    }

    #[tokio::test]
    async fn convert_to_metadata_empty_response() {
        let c = test_client();
        let response = AnalyzeImageResponse {
            success: true,
            error_message: String::new(),
            subject: "person".to_string(),
            title: "t".to_string(),
            artist_name: Some("a".to_string()),
            group_name: Some("g".to_string()),
            context: Some("ctx".to_string()),
            items: std::collections::HashMap::new(),
        };
        let meta = c.convert_to_metadata(response).unwrap();
        assert_eq!(meta.subject, "person");
        assert_eq!(meta.title, "t");
        assert!(meta.items.is_empty());
    }

    #[tokio::test]
    async fn client_is_clone_and_debug() {
        let c = test_client();
        let _cloned = c.clone();
        let _s = format!("{:?}", c);
    }

    #[tokio::test]
    async fn extract_og_data_fails_without_server() {
        let c = test_client();
        let r = c.extract_og_data("https://x.test/".to_string()).await;
        assert!(r.is_err());
    }

    #[tokio::test]
    async fn analyze_link_fails_without_server() {
        let c = test_client();
        let r = c
            .analyze_link(
                "https://x.test/".to_string(),
                "post-1".to_string(),
                "t".to_string(),
                "d".to_string(),
                "site".to_string(),
            )
            .await;
        assert!(r.is_err());
    }

    #[tokio::test]
    async fn analyze_link_direct_fails_without_server() {
        let c = test_client();
        let r = c
            .analyze_link_direct(
                "https://x.test/".to_string(),
                "post-1".to_string(),
                "t".to_string(),
                "d".to_string(),
                "site".to_string(),
            )
            .await;
        assert!(r.is_err());
    }

    #[tokio::test]
    async fn process_post_editorial_fails_without_server() {
        let c = test_client();
        let r = c.process_post_editorial("mag-1", "{}").await;
        assert!(r.is_err());
    }

    #[tokio::test]
    async fn analyze_image_fails_without_server() {
        let c = test_client();
        let r = c
            .analyze_image(vec![1u8, 2, 3], "Tops: A".to_string())
            .await;
        assert!(r.is_err());
        assert!(matches!(r, Err(AppError::ExternalService(_))));
    }

    #[tokio::test]
    async fn extract_post_context_fails_without_server() {
        let c = test_client();
        let r = c
            .extract_post_context("post-1".to_string(), "https://img.test/a.webp".to_string())
            .await;
        assert!(r.is_err());
    }
}
