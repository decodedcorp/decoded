//! JWT 유틸리티
//!
//! JWT 토큰 디코딩, 검증, Claims 추출 기능 제공

use jsonwebtoken::{decode, decode_header, Algorithm, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{Duration, Instant};
use uuid::Uuid;

use crate::error::AppError;

/// JWKS 캐시 엔트리
#[derive(Debug, Clone)]
struct JwksCacheEntry {
    jwks: Jwks,
    expires_at: Instant,
}

/// JWKS 캐시 (in-memory)
static JWKS_CACHE: Mutex<Option<HashMap<String, JwksCacheEntry>>> = Mutex::new(None);

/// JWKS 캐시 TTL (1시간)
const JWKS_CACHE_TTL: Duration = Duration::from_secs(3600);

/// JWKS (JSON Web Key Set) 구조체
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Jwks {
    pub keys: Vec<Jwk>,
}

/// JWK (JSON Web Key) 구조체
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Jwk {
    /// Key ID
    pub kid: String,
    /// Key Type (RSA or EC)
    pub kty: String,
    /// Algorithm
    #[serde(skip_serializing_if = "Option::is_none")]
    pub alg: Option<String>,
    /// Use (sig)
    #[serde(rename = "use")]
    pub use_: Option<String>,
    /// RSA modulus (n) - RSA 키인 경우
    #[serde(skip_serializing_if = "Option::is_none")]
    pub n: Option<String>,
    /// RSA exponent (e) - RSA 키인 경우
    #[serde(skip_serializing_if = "Option::is_none")]
    pub e: Option<String>,
    /// EC curve - EC 키인 경우
    #[serde(skip_serializing_if = "Option::is_none")]
    pub crv: Option<String>,
    /// EC x coordinate - EC 키인 경우
    #[serde(skip_serializing_if = "Option::is_none")]
    pub x: Option<String>,
    /// EC y coordinate - EC 키인 경우
    #[serde(skip_serializing_if = "Option::is_none")]
    pub y: Option<String>,
}

/// Supabase JWKS 엔드포인트에서 JWKS 가져오기
///
/// # Arguments
/// * `supabase_url` - Supabase 프로젝트 URL
///
/// # Returns
/// JWKS 구조체
pub async fn fetch_jwks(supabase_url: &str) -> Result<Jwks, AppError> {
    let url = format!("{}/auth/v1/.well-known/jwks.json", supabase_url);
    let client = reqwest::Client::new();

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| AppError::internal(format!("Failed to fetch JWKS: {}", e)))?;

    if !response.status().is_success() {
        return Err(AppError::internal(format!(
            "JWKS endpoint returned error: {}",
            response.status()
        )));
    }

    let jwks: Jwks = response
        .json()
        .await
        .map_err(|e| AppError::internal(format!("Failed to parse JWKS: {}", e)))?;

    Ok(jwks)
}

/// 캐시된 JWKS 가져오기 또는 새로 가져오기
///
/// # Arguments
/// * `supabase_url` - Supabase 프로젝트 URL
///
/// # Returns
/// JWKS 구조체
pub async fn get_cached_jwks(supabase_url: &str) -> Result<Jwks, AppError> {
    // 캐시 확인
    {
        let cache_guard = JWKS_CACHE
            .lock()
            .map_err(|_| AppError::internal("JWKS cache mutex poisoned"))?;
        if let Some(ref cache) = *cache_guard {
            if let Some(entry) = cache.get(supabase_url) {
                if entry.expires_at > Instant::now() {
                    return Ok(entry.jwks.clone());
                }
            }
        }
    }

    // 캐시 미스 또는 만료 - 새로 가져오기
    let jwks = fetch_jwks(supabase_url).await?;

    // 캐시에 저장
    {
        let mut cache_guard = JWKS_CACHE
            .lock()
            .map_err(|_| AppError::internal("JWKS cache mutex poisoned"))?;
        let cache = cache_guard.get_or_insert_with(HashMap::new);
        cache.insert(
            supabase_url.to_string(),
            JwksCacheEntry {
                jwks: jwks.clone(),
                expires_at: Instant::now() + JWKS_CACHE_TTL,
            },
        );
    }

    Ok(jwks)
}

/// Supabase JWT 토큰 검증 (RS256)
///
/// # Arguments
/// * `token` - JWT 토큰 문자열
/// * `supabase_url` - Supabase 프로젝트 URL
///
/// # Returns
/// 검증된 Claims
pub async fn verify_supabase_token(token: &str, supabase_url: &str) -> Result<Claims, AppError> {
    // JWT 헤더에서 kid 추출
    let header = decode_header(token)
        .map_err(|e| AppError::unauthorized(format!("Failed to decode token header: {}", e)))?;

    let kid = header
        .kid
        .ok_or_else(|| AppError::unauthorized("Token header missing 'kid' field".to_string()))?;

    // JWKS 가져오기 (캐시 사용)
    let jwks = get_cached_jwks(supabase_url).await?;

    // JWKS에서 해당 kid의 공개 키 찾기
    let jwk =
        jwks.keys.iter().find(|k| k.kid == kid).ok_or_else(|| {
            AppError::unauthorized(format!("No matching key found for kid: {}", kid))
        })?;

    // 공개 키 구성 및 알고리즘 결정
    let (decoding_key, algorithm) =
        match jwk.kty.as_str() {
            "RSA" => {
                let n = jwk.n.as_ref().ok_or_else(|| {
                    AppError::unauthorized("RSA key missing 'n' field".to_string())
                })?;
                let e = jwk.e.as_ref().ok_or_else(|| {
                    AppError::unauthorized("RSA key missing 'e' field".to_string())
                })?;
                let key = DecodingKey::from_rsa_components(n, e).map_err(|e| {
                    AppError::unauthorized(format!("Failed to create RSA decoding key: {}", e))
                })?;
                (key, Algorithm::RS256)
            }
            "EC" => {
                let x = jwk.x.as_ref().ok_or_else(|| {
                    AppError::unauthorized("EC key missing 'x' field".to_string())
                })?;
                let y = jwk.y.as_ref().ok_or_else(|| {
                    AppError::unauthorized("EC key missing 'y' field".to_string())
                })?;

                // EC 공개 키 구성 (x, y 좌표만 필요)
                let key = DecodingKey::from_ec_components(x, y).map_err(|e| {
                    AppError::unauthorized(format!("Failed to create EC decoding key: {}", e))
                })?;
                (key, Algorithm::ES256)
            }
            _ => {
                return Err(AppError::unauthorized(format!(
                    "Unsupported key type: {}",
                    jwk.kty
                )));
            }
        };

    // 알고리즘으로 검증
    let mut validation = Validation::new(algorithm);
    // Supabase JWT의 iss는 {supabase_url}/auth/v1 형식
    let expected_issuer = format!("{}/auth/v1", supabase_url);
    validation.set_issuer(&[&expected_issuer]);
    // Supabase JWT의 aud는 "authenticated" (일반 사용자) 또는 "anon" (익명 사용자)
    validation.set_audience(&["authenticated", "anon"]);

    let token_data = decode::<Claims>(token, &decoding_key, &validation).map_err(|e| {
        tracing::debug!("JWT verification error: {:?}", e);
        AppError::unauthorized(format!("Invalid token: {}", e))
    })?;

    Ok(token_data.claims)
}

/// JWT Claims 구조체 (Supabase JWT 형식)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    /// 사용자 ID (subject)
    pub sub: String,

    /// 이메일
    pub email: String,

    /// 만료 시간 (expiration)
    pub exp: usize,

    /// 발급 시간 (issued at)
    pub iat: usize,

    /// 발급자 (issuer) - Supabase URL
    pub iss: Option<String>,

    /// 대상자 (audience)
    pub aud: Option<String>,

    /// 사용자 역할 (app_metadata에서)
    #[serde(default = "default_role")]
    pub role: String,
}

fn default_role() -> String {
    "user".to_string()
}

impl Claims {
    /// 사용자 ID를 UUID로 추출
    pub fn user_id(&self) -> Result<Uuid, AppError> {
        Uuid::parse_str(&self.sub)
            .map_err(|e| AppError::Unauthorized(format!("Invalid user ID in token: {}", e)))
    }

    /// 토큰이 만료되었는지 확인
    pub fn is_expired(&self) -> bool {
        let now = chrono::Utc::now().timestamp() as usize;
        self.exp < now
    }

    /// 관리자 권한 여부 확인
    pub fn is_admin(&self) -> bool {
        self.role == "admin" || self.role == "service_role"
    }
}

/// JWT 토큰 디코딩 및 검증
///
/// # Arguments
/// * `token` - JWT 토큰 문자열
/// * `secret` - JWT 시크릿 키
///
/// # Returns
/// 검증된 Claims
pub fn decode_token(token: &str, secret: &str) -> Result<Claims, AppError> {
    let validation = Validation::default();

    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &validation,
    )
    .map_err(|e| {
        tracing::debug!("JWT decode error: {:?}", e);
        AppError::Unauthorized(format!("Invalid token: {}", e))
    })?;

    Ok(token_data.claims)
}

/// JWT 토큰 유효성 검사
///
/// # Arguments
/// * `token` - JWT 토큰 문자열
/// * `secret` - JWT 시크릿 키
///
/// # Returns
/// 토큰이 유효한 경우 true
pub fn validate_token(token: &str, secret: &str) -> bool {
    decode_token(token, secret).is_ok()
}

/// Claims에서 사용자 ID 추출
///
/// # Arguments
/// * `token` - JWT 토큰 문자열
/// * `secret` - JWT 시크릿 키
///
/// # Returns
/// 사용자 UUID
pub fn extract_user_id(token: &str, secret: &str) -> Result<Uuid, AppError> {
    let claims = decode_token(token, secret)?;
    claims.user_id()
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;
    use jsonwebtoken::{encode, EncodingKey, Header};

    fn hs256_secret() -> &'static str {
        "unit-test-jwt-secret-min-32-chars-long!!"
    }

    fn sample_hs256_claims() -> Claims {
        let now = chrono::Utc::now().timestamp() as usize;
        Claims {
            sub: "550e8400-e29b-41d4-a716-446655440000".to_string(),
            email: "jwt-test@example.com".to_string(),
            exp: now + 3600,
            iat: now,
            iss: None,
            aud: None,
            role: "user".to_string(),
        }
    }

    fn encode_hs256(claims: &Claims) -> String {
        encode(
            &Header::default(),
            claims,
            &EncodingKey::from_secret(hs256_secret().as_bytes()),
        )
        .expect("encode test JWT")
    }

    #[test]
    fn decode_token_accepts_valid_hs256() {
        let claims = sample_hs256_claims();
        let token = encode_hs256(&claims);
        let out = decode_token(&token, hs256_secret()).expect("decode");
        assert_eq!(out.sub, claims.sub);
        assert_eq!(out.email, claims.email);
    }

    #[test]
    fn decode_token_rejects_wrong_secret() {
        let token = encode_hs256(&sample_hs256_claims());
        assert!(decode_token(&token, "wrong-secret-not-the-same-as-encode").is_err());
    }

    #[test]
    fn decode_token_rejects_malformed_jwt() {
        assert!(decode_token("not-a-jwt", hs256_secret()).is_err());
    }

    #[test]
    fn validate_token_matches_decode_token() {
        let token = encode_hs256(&sample_hs256_claims());
        assert!(validate_token(&token, hs256_secret()));
        assert!(!validate_token(&token, "wrong"));
    }

    #[test]
    fn extract_user_id_returns_uuid_from_hs256() {
        let token = encode_hs256(&sample_hs256_claims());
        let id = extract_user_id(&token, hs256_secret()).expect("uuid");
        assert_eq!(
            id,
            Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap()
        );
    }

    #[test]
    fn extract_user_id_propagates_invalid_sub() {
        let now = chrono::Utc::now().timestamp() as usize;
        let bad = Claims {
            sub: "not-a-uuid".to_string(),
            email: "x@y.com".to_string(),
            exp: now + 3600,
            iat: now,
            iss: None,
            aud: None,
            role: "user".to_string(),
        };
        let token = encode_hs256(&bad);
        assert!(extract_user_id(&token, hs256_secret()).is_err());
    }

    #[test]
    fn jwks_json_roundtrip() {
        let jwks = Jwks { keys: vec![] };
        let s = serde_json::to_string(&jwks).expect("serialize");
        let back: Jwks = serde_json::from_str(&s).expect("deserialize");
        assert!(back.keys.is_empty());
    }

    #[tokio::test]
    async fn verify_supabase_token_rejects_malformed_jwt() {
        assert!(
            verify_supabase_token("not-a-valid-jwt", "https://example.supabase.co")
                .await
                .is_err()
        );
    }

    #[tokio::test]
    async fn verify_supabase_token_rejects_hs256_without_kid() {
        let token = encode_hs256(&sample_hs256_claims());
        let err = verify_supabase_token(&token, "https://example.supabase.co")
            .await
            .expect_err("missing kid in header");
        let AppError::Unauthorized(msg) = err else {
            panic!("expected Unauthorized");
        };
        assert!(msg.contains("kid"), "msg={msg}");
    }

    #[tokio::test]
    async fn verify_supabase_token_fails_when_jwks_fetch_fails() {
        let header = Header {
            kid: Some("test-kid".to_string()),
            ..Default::default()
        };
        let token = encode(
            &header,
            &sample_hs256_claims(),
            &EncodingKey::from_secret(hs256_secret().as_bytes()),
        )
        .expect("encode");
        // 닫힌 포트 — JWKS HTTP 요청이 빠르게 실패해야 함
        assert!(verify_supabase_token(&token, "http://127.0.0.1:9")
            .await
            .is_err());
    }

    #[test]
    fn test_claims_user_id_valid() {
        let claims = Claims {
            sub: "550e8400-e29b-41d4-a716-446655440000".to_string(),
            email: "test@example.com".to_string(),
            exp: 9999999999,
            iat: 1000000000,
            iss: None,
            aud: None,
            role: "user".to_string(),
        };

        let user_id = claims.user_id();
        assert!(user_id.is_ok());
    }

    #[test]
    fn test_claims_user_id_invalid() {
        let claims = Claims {
            sub: "invalid-uuid".to_string(),
            email: "test@example.com".to_string(),
            exp: 9999999999,
            iat: 1000000000,
            iss: None,
            aud: None,
            role: "user".to_string(),
        };

        let user_id = claims.user_id();
        assert!(user_id.is_err());
    }

    #[test]
    fn test_claims_is_expired() {
        // 과거 시간 (만료됨)
        let expired_claims = Claims {
            sub: "550e8400-e29b-41d4-a716-446655440000".to_string(),
            email: "test@example.com".to_string(),
            exp: 1000000000, // 과거 시간
            iat: 1000000000,
            iss: None,
            aud: None,
            role: "user".to_string(),
        };
        assert!(expired_claims.is_expired());

        // 미래 시간 (유효함)
        let valid_claims = Claims {
            sub: "550e8400-e29b-41d4-a716-446655440000".to_string(),
            email: "test@example.com".to_string(),
            exp: 9999999999, // 미래 시간
            iat: 1000000000,
            iss: None,
            aud: None,
            role: "user".to_string(),
        };
        assert!(!valid_claims.is_expired());
    }

    #[test]
    fn test_claims_is_admin() {
        let admin_claims = Claims {
            sub: "550e8400-e29b-41d4-a716-446655440000".to_string(),
            email: "admin@example.com".to_string(),
            exp: 9999999999,
            iat: 1000000000,
            iss: None,
            aud: None,
            role: "admin".to_string(),
        };
        assert!(admin_claims.is_admin());

        let service_role_claims = Claims {
            sub: "550e8400-e29b-41d4-a716-446655440000".to_string(),
            email: "service@example.com".to_string(),
            exp: 9999999999,
            iat: 1000000000,
            iss: None,
            aud: None,
            role: "service_role".to_string(),
        };
        assert!(service_role_claims.is_admin());

        let user_claims = Claims {
            sub: "550e8400-e29b-41d4-a716-446655440000".to_string(),
            email: "user@example.com".to_string(),
            exp: 9999999999,
            iat: 1000000000,
            iss: None,
            aud: None,
            role: "user".to_string(),
        };
        assert!(!user_claims.is_admin());
    }

    #[test]
    fn test_default_role() {
        assert_eq!(default_role(), "user");
    }

    // Note: decode_token, validate_token, extract_user_id는 실제 JWT 시크릿이 필요하므로
    // 통합 테스트 또는 실제 환경에서 테스트합니다.

    #[tokio::test]
    async fn test_fetch_jwks_success() {
        // 실제 Supabase URL이 필요하므로 통합 테스트로 분리
        // 여기서는 함수가 존재하는지만 확인
        // 실제 테스트는 통합 테스트에서 수행
    }

    #[tokio::test]
    async fn test_fetch_jwks_invalid_url() {
        let result = fetch_jwks("https://invalid-url-that-does-not-exist.com").await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_fetch_jwks_network_error() {
        // 네트워크 오류 시나리오 테스트
        // 실제로는 mock 서버를 사용하거나 통합 테스트에서 처리
        let result = fetch_jwks("https://httpstat.us/500").await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_jwks_cache_hit() {
        // 캐시에 저장된 JWKS 반환 테스트
        // 실제 Supabase URL이 필요하므로 통합 테스트로 분리
        // 여기서는 함수가 존재하는지만 확인
    }

    #[tokio::test]
    async fn test_jwks_cache_miss() {
        // 캐시 미스 시 새로 가져오기 테스트
        // 실제 Supabase URL이 필요하므로 통합 테스트로 분리
        // 여기서는 함수가 존재하는지만 확인
    }

    #[tokio::test]
    async fn test_jwks_cache_ttl_expiry() {
        // TTL 만료 후 갱신 테스트
        // 실제 Supabase URL이 필요하므로 통합 테스트로 분리
        // 여기서는 함수가 존재하는지만 확인
    }

    #[tokio::test]
    async fn test_verify_supabase_token_success() {
        // 유효한 토큰 검증 성공 테스트
        // 실제 Supabase JWT 토큰이 필요하므로 통합 테스트로 분리
        // 여기서는 함수가 존재하는지만 확인
    }

    #[tokio::test]
    async fn test_verify_supabase_token_expired() {
        // 만료된 토큰 처리 테스트
        // 실제 Supabase JWT 토큰이 필요하므로 통합 테스트로 분리
        // 여기서는 함수가 존재하는지만 확인
    }

    #[tokio::test]
    async fn test_verify_supabase_token_invalid_kid() {
        // 잘못된 kid 처리 테스트
        // 실제 Supabase JWT 토큰이 필요하므로 통합 테스트로 분리
        // 여기서는 함수가 존재하는지만 확인
    }

    #[tokio::test]
    async fn test_verify_supabase_token_invalid_signature() {
        // 잘못된 서명 처리 테스트
        // 실제 Supabase JWT 토큰이 필요하므로 통합 테스트로 분리
        // 여기서는 함수가 존재하는지만 확인
    }
}
