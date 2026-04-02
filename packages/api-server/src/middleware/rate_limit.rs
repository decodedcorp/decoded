//! Rate limiting middleware
//!
//! GCRA 알고리즘 기반 요청 속도 제한 미들웨어.
//! JWT sub 클레임으로 인증된 사용자를 식별하고, 미인증 요청은 IP로 폴백합니다.

use serde::Deserialize;
use tower_governor::{
    errors::GovernorError, governor::GovernorConfigBuilder, key_extractor::KeyExtractor,
    GovernorLayer,
};

/// JWT payload에서 sub 클레임만 추출하는 구조체
#[derive(Deserialize)]
struct SubClaim {
    sub: String,
}

/// JWT 토큰에서 sub 클레임을 추출합니다.
///
/// 서명 검증 없이 페이로드만 디코딩합니다.
/// auth_middleware가 이미 서명을 검증했으므로 여기서는 불필요합니다.
fn extract_sub(token: &str) -> Option<String> {
    use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};

    let mut validation = Validation::new(Algorithm::HS256);
    validation.insecure_disable_signature_validation();
    validation.required_spec_claims.clear();
    validation.validate_exp = false;

    let dummy_key = DecodingKey::from_secret(b"");
    decode::<SubClaim>(token, &dummy_key, &validation)
        .ok()
        .map(|data| data.claims.sub)
}

/// JWT sub 클레임 또는 IP 기반 키 추출기
///
/// 인증된 요청은 사용자 ID(sub)로, 익명 요청은 IP 주소로 rate limit을 적용합니다.
#[derive(Clone)]
pub struct JwtUserKeyExtractor;

impl KeyExtractor for JwtUserKeyExtractor {
    type Key = String;

    fn extract<T>(&self, req: &axum::http::Request<T>) -> Result<Self::Key, GovernorError> {
        // Authorization 헤더에서 Bearer 토큰 추출 시도
        if let Some(auth_header) = req.headers().get("Authorization") {
            if let Ok(auth_str) = auth_header.to_str() {
                if let Some(token) = auth_str.strip_prefix("Bearer ") {
                    if let Some(sub) = extract_sub(token) {
                        return Ok(sub);
                    }
                }
            }
        }

        // JWT 없으면 IP 주소로 폴백
        req.extensions()
            .get::<axum::extract::ConnectInfo<std::net::SocketAddr>>()
            .map(|addr| addr.ip().to_string())
            .ok_or(GovernorError::UnableToExtractKey)
    }
}

/// AI 분석 엔드포인트용 rate limit 레이어를 생성합니다.
///
/// GCRA 알고리즘으로 사용자당 1 req/s 보충, 최대 버스트 3을 허용합니다.
/// X-RateLimit-* 및 Retry-After 헤더를 응답에 포함합니다 (RATE-04).
pub fn ai_rate_limit_layer() -> GovernorLayer<
    JwtUserKeyExtractor,
    governor::middleware::StateInformationMiddleware,
    axum::body::Body,
> {
    let config = GovernorConfigBuilder::default()
        .key_extractor(JwtUserKeyExtractor)
        .per_second(1)
        .burst_size(3)
        .use_headers()
        .finish()
        .expect("rate limit config must be valid");

    GovernorLayer::new(config)
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_sub_from_valid_jwt() {
        use jsonwebtoken::{encode, Algorithm, EncodingKey, Header};
        use serde::Serialize;

        #[derive(Serialize)]
        struct Claims {
            sub: String,
            exp: u64,
        }

        let claims = Claims {
            sub: "test-user-id".to_string(),
            exp: 9999999999,
        };

        let token = encode(
            &Header::new(Algorithm::HS256),
            &claims,
            &EncodingKey::from_secret(b"secret"),
        )
        .unwrap();

        let result = extract_sub(&token);
        assert_eq!(result, Some("test-user-id".to_string()));
    }

    #[test]
    fn test_extract_sub_from_invalid_token() {
        let result = extract_sub("not-a-jwt");
        assert!(result.is_none());
    }
}
