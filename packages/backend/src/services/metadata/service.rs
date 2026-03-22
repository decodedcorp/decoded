use crate::domains::solutions::dto::MetadataResponse;
use crate::grpc::inbound::ExtractOgDataResponse;
use crate::services::decoded_ai_grpc::DecodedAIGrpcClient;

/// gRPC ExtractOgDataResponse를 MetadataResponse로 변환합니다.
pub fn map_grpc_response_to_metadata(grpc_response: ExtractOgDataResponse) -> MetadataResponse {
    MetadataResponse {
        url: grpc_response.url,
        title: grpc_response.title,
        description: if grpc_response.description.is_empty() {
            None
        } else {
            Some(grpc_response.description)
        },
        thumbnail_url: if grpc_response.image.is_empty() {
            None
        } else {
            Some(grpc_response.image.clone())
        },
        site_name: if grpc_response.site_name.is_empty() {
            None
        } else {
            Some(grpc_response.site_name)
        },
        image: if grpc_response.image.is_empty() {
            None
        } else {
            Some(grpc_response.image)
        },
        extra_metadata: None, // extra_metadata removed from ExtractOGDataResponse
        is_affiliate_supported: false,
    }
}

/// gRPC 클라이언트를 사용하여 OG 메타데이터를 추출하는 helper 함수
pub async fn extract_og_and_metadata(
    client: &DecodedAIGrpcClient,
    url: String,
) -> Result<MetadataResponse, Box<dyn std::error::Error + Send + Sync + 'static>> {
    let grpc_response = client
        .extract_og_data(url)
        .await
        .map_err(|e| e.to_string())?;
    Ok(map_grpc_response_to_metadata(grpc_response))
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;

    fn og(
        url: &str,
        title: &str,
        description: &str,
        image: &str,
        site_name: &str,
    ) -> ExtractOgDataResponse {
        ExtractOgDataResponse {
            success: true,
            url: url.to_string(),
            title: title.to_string(),
            description: description.to_string(),
            image: image.to_string(),
            site_name: site_name.to_string(),
            error_message: String::new(),
        }
    }

    #[test]
    fn map_omits_empty_optional_fields() {
        let m = map_grpc_response_to_metadata(og("https://example.com/p", "Title", "", "", ""));
        assert_eq!(m.url, "https://example.com/p");
        assert_eq!(m.title, "Title");
        assert!(m.description.is_none());
        assert!(m.thumbnail_url.is_none());
        assert!(m.site_name.is_none());
        assert!(m.image.is_none());
        assert!(!m.is_affiliate_supported);
        assert!(m.extra_metadata.is_none());
    }

    #[test]
    fn map_sets_description_and_duplicates_image_to_thumb_and_image() {
        let m = map_grpc_response_to_metadata(og(
            "https://x",
            "T",
            "desc text",
            "https://img.example/i.png",
            "Example Site",
        ));
        assert_eq!(m.description.as_deref(), Some("desc text"));
        assert_eq!(m.site_name.as_deref(), Some("Example Site"));
        assert_eq!(
            m.thumbnail_url.as_deref(),
            Some("https://img.example/i.png")
        );
        assert_eq!(m.image.as_deref(), Some("https://img.example/i.png"));
    }
}
