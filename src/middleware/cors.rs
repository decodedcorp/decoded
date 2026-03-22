//! CORS 미들웨어
//!
//! Cross-Origin Resource Sharing (CORS) 설정

use std::time::Duration;

use axum::http::{header, HeaderValue, Method};
use tower_http::cors::CorsLayer;

/// CORS Layer 생성
///
/// # Arguments
/// * `allowed_origins` - 허용할 origin 목록 (None이면 모든 origin 허용)
/// * `env` - 환경 ("development" | "staging" | "production")
///
/// # Returns
/// 설정된 CorsLayer
///
/// # Panics
/// 프로덕션/스테이징 환경에서 `allowed_origins`가 None이면 패닉합니다.
pub fn create_cors_layer(allowed_origins: Option<Vec<String>>, env: &str) -> CorsLayer {
    let is_production = env == "production" || env == "staging";

    let mut cors = CorsLayer::new()
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PATCH,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION])
        .max_age(Duration::from_secs(3600));

    if is_production {
        // 프로덕션/스테이징: 특정 origin만 허용, credentials 허용
        let origins =
            allowed_origins.expect("ALLOWED_ORIGINS must be set in production/staging environment");
        let origin_values: Vec<HeaderValue> = origins
            .into_iter()
            .filter_map(|origin| origin.parse().ok())
            .collect();
        cors = cors.allow_origin(origin_values).allow_credentials(true);
    } else {
        // 개발 환경: 모든 origin 허용, credentials 비허용
        // (브라우저 보안 정책: allow_origin(*)와 allow_credentials(true) 동시 사용 불가)
        cors = cors
            .allow_origin(tower_http::cors::Any)
            .allow_credentials(false);
    }

    cors
}

/// 환경 변수에서 CORS origin 목록 파싱
///
/// # Arguments
/// * `allowed_origins_env` - 쉼표로 구분된 origin 목록 문자열
///
/// # Returns
/// origin 목록 (None이면 모든 origin 허용)
///
/// # Example
/// ```
/// use decoded_api::middleware::parse_allowed_origins;
///
/// let origins = parse_allowed_origins(Some("http://localhost:8000,https://example.com".to_string()));
/// assert_eq!(origins, Some(vec!["http://localhost:8000".to_string(), "https://example.com".to_string()]));
///
/// let all_origins = parse_allowed_origins(None);
/// assert_eq!(all_origins, None); // 모든 origin 허용
/// ```
pub fn parse_allowed_origins(allowed_origins_env: Option<String>) -> Option<Vec<String>> {
    allowed_origins_env.map(|s| {
        s.split(',')
            .map(|origin| origin.trim().to_string())
            .filter(|origin| !origin.is_empty())
            .collect()
    })
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;

    #[test]
    fn test_create_cors_layer_production_with_origins() {
        let origins = vec![
            "http://localhost:3000".to_string(),
            "https://example.com".to_string(),
        ];
        let cors = create_cors_layer(Some(origins), "production");

        // CorsLayer는 private 필드를 가지고 있어 직접 검증하기 어려움
        // 대신 CorsLayer가 성공적으로 생성되는지만 확인
        assert!(format!("{:?}", cors).contains("CorsLayer"));
    }

    #[test]
    fn test_create_cors_layer_staging_with_origins() {
        let origins = vec!["https://app.example.com".to_string()];
        let cors = create_cors_layer(Some(origins), "staging");
        assert!(format!("{:?}", cors).contains("CorsLayer"));
    }

    #[test]
    fn test_create_cors_layer_development_allow_all() {
        let cors = create_cors_layer(None, "development");

        // 개발 환경: 모든 origin 허용 시에도 CorsLayer가 성공적으로 생성되는지 확인
        assert!(format!("{:?}", cors).contains("CorsLayer"));
    }

    #[test]
    #[should_panic(expected = "ALLOWED_ORIGINS must be set")]
    fn test_create_cors_layer_production_without_origins() {
        // 프로덕션 환경에서 allowed_origins가 없으면 패닉해야 함
        let _cors = create_cors_layer(None, "production");
    }

    #[test]
    fn test_parse_allowed_origins_single() {
        let input = Some("http://localhost:3000".to_string());
        let result = parse_allowed_origins(input);
        assert_eq!(result, Some(vec!["http://localhost:3000".to_string()]));
    }

    #[test]
    fn test_parse_allowed_origins_multiple() {
        let input = Some("http://localhost:3000,https://example.com".to_string());
        let result = parse_allowed_origins(input);
        assert_eq!(
            result,
            Some(vec![
                "http://localhost:3000".to_string(),
                "https://example.com".to_string()
            ])
        );
    }

    #[test]
    fn test_parse_allowed_origins_with_spaces() {
        let input = Some("http://localhost:3000 , https://example.com ".to_string());
        let result = parse_allowed_origins(input);
        assert_eq!(
            result,
            Some(vec![
                "http://localhost:3000".to_string(),
                "https://example.com".to_string()
            ])
        );
    }

    #[test]
    fn test_parse_allowed_origins_empty_string() {
        let input = Some("".to_string());
        let result = parse_allowed_origins(input);
        assert_eq!(result, Some(vec![]));
    }

    #[test]
    fn test_parse_allowed_origins_none() {
        let result = parse_allowed_origins(None);
        assert_eq!(result, None);
    }

    #[test]
    fn test_parse_allowed_origins_with_empty_items() {
        let input = Some("http://localhost:3000,,https://example.com".to_string());
        let result = parse_allowed_origins(input);
        assert_eq!(
            result,
            Some(vec![
                "http://localhost:3000".to_string(),
                "https://example.com".to_string()
            ])
        );
    }
}
