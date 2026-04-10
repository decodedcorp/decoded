//! 인증 미들웨어
//!
//! JWT 토큰 검증 및 사용자 정보 추출

use axum::{
    extract::{Request, State},
    middleware::Next,
    response::Response,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    config::AppConfig,
    error::AppError,
    utils::jwt::{verify_supabase_token, Claims},
};

/// 인증된 사용자 정보
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    /// 사용자 ID
    pub id: Uuid,

    /// 이메일
    pub email: String,

    /// 사용자명 (옵션)
    pub username: Option<String>,

    /// 사용자 등급
    pub rank: String,

    /// 관리자 여부
    pub is_admin: bool,
}

impl User {
    /// Claims로부터 User 생성 (JWKS 검증 후 사용)
    pub fn from_claims(claims: Claims) -> Result<Self, AppError> {
        let id = claims.user_id()?;
        let email = claims.email.clone();
        let is_admin = claims.is_admin();

        Ok(Self {
            id,
            email,
            username: None,           // DB에서 조회 필요
            rank: "user".to_string(), // 기본값, DB에서 조회 필요
            is_admin,
        })
    }
}

/// 인증 미들웨어
///
/// Authorization 헤더에서 JWT 토큰을 추출하고 JWKS를 사용하여 로컬에서 검증합니다.
/// 검증된 사용자 정보는 Extension으로 주입됩니다.
pub async fn auth_middleware(
    State(config): State<AppConfig>,
    mut request: Request,
    next: Next,
) -> Result<Response, AppError> {
    // Authorization 헤더 추출
    let auth_header = request
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| AppError::Unauthorized("Missing authorization header".to_string()))?;

    // "Bearer {token}" 파싱
    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or_else(|| AppError::Unauthorized("Invalid authorization format".to_string()))?;

    // JWKS를 사용하여 토큰 검증
    let claims = verify_supabase_token(token, &config.auth.supabase_url).await?;

    // User 생성 및 Extension 주입
    let user = User::from_claims(claims)?;
    request.extensions_mut().insert(user);

    Ok(next.run(request).await)
}

/// 선택적 인증 미들웨어
///
/// 토큰이 있으면 검증하지만, 없어도 통과시킵니다.
/// 로그인 여부에 따라 다른 동작을 하는 엔드포인트에 사용합니다.
pub async fn optional_auth_middleware(
    State(config): State<AppConfig>,
    mut request: Request,
    next: Next,
) -> Response {
    // Authorization 헤더 추출 시도
    if let Some(auth_header) = request.headers().get("Authorization") {
        if let Ok(auth_str) = auth_header.to_str() {
            if let Some(token) = auth_str.strip_prefix("Bearer ") {
                // JWKS를 사용하여 토큰 검증 시도
                if let Ok(claims) = verify_supabase_token(token, &config.auth.supabase_url).await {
                    if let Ok(user) = User::from_claims(claims) {
                        request.extensions_mut().insert(user);
                    }
                }
            }
        }
    }

    // 토큰이 없거나 검증 실패해도 다음으로 진행
    next.run(request).await
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;
    use crate::utils::jwt::Claims;

    #[test]
    fn test_user_from_claims_success() {
        let claims = Claims {
            sub: "550e8400-e29b-41d4-a716-446655440000".to_string(),
            email: "test@example.com".to_string(),
            exp: 9999999999,
            iat: 1000000000,
            iss: Some("https://test.supabase.co".to_string()),
            aud: Some("authenticated".to_string()),
            role: "user".to_string(),
        };

        let user = User::from_claims(claims).unwrap();
        assert_eq!(user.email, "test@example.com");
        assert_eq!(user.rank, "user");
        assert!(!user.is_admin);
    }

    #[test]
    fn test_user_from_claims_admin() {
        let claims = Claims {
            sub: "550e8400-e29b-41d4-a716-446655440000".to_string(),
            email: "admin@example.com".to_string(),
            exp: 9999999999,
            iat: 1000000000,
            iss: Some("https://test.supabase.co".to_string()),
            aud: Some("authenticated".to_string()),
            role: "admin".to_string(),
        };

        let user = User::from_claims(claims).unwrap();
        assert_eq!(user.email, "admin@example.com");
        assert!(user.is_admin);
    }

    #[test]
    fn test_user_from_claims_invalid_uuid() {
        let claims = Claims {
            sub: "invalid-uuid".to_string(),
            email: "test@example.com".to_string(),
            exp: 9999999999,
            iat: 1000000000,
            iss: Some("https://test.supabase.co".to_string()),
            aud: Some("authenticated".to_string()),
            role: "user".to_string(),
        };

        let result = User::from_claims(claims);
        assert!(result.is_err());
    }

    #[test]
    fn test_user_from_claims_invalid_uuid_includes_context_in_error() {
        let claims = Claims {
            sub: "not-a-uuid".to_string(),
            email: "test@example.com".to_string(),
            exp: 9999999999,
            iat: 1000000000,
            iss: Some("https://test.supabase.co".to_string()),
            aud: Some("authenticated".to_string()),
            role: "user".to_string(),
        };

        let err = User::from_claims(claims).unwrap_err();
        let msg = err.to_string();
        assert!(
            msg.contains("Invalid user ID"),
            "unexpected error message: {msg}"
        );
    }

    #[test]
    fn test_user_from_claims_empty_sub_rejected() {
        let claims = Claims {
            sub: String::new(),
            email: "test@example.com".to_string(),
            exp: 9999999999,
            iat: 1000000000,
            iss: Some("https://test.supabase.co".to_string()),
            aud: Some("authenticated".to_string()),
            role: "user".to_string(),
        };

        assert!(User::from_claims(claims).is_err());
    }

    #[test]
    fn test_user_from_claims_service_role_is_admin() {
        let claims = Claims {
            sub: "550e8400-e29b-41d4-a716-446655440000".to_string(),
            email: "svc@example.com".to_string(),
            exp: 9999999999,
            iat: 1000000000,
            iss: Some("https://test.supabase.co".to_string()),
            aud: Some("authenticated".to_string()),
            role: "service_role".to_string(),
        };

        let user = User::from_claims(claims).unwrap();
        assert!(user.is_admin);
        assert_eq!(user.email, "svc@example.com");
    }

    #[test]
    fn test_user_from_claims_passes_through_email_without_validation() {
        // JWT `email` is not validated here; ensure contract is explicit for empty / non-RFC strings.
        let claims = Claims {
            sub: "550e8400-e29b-41d4-a716-446655440000".to_string(),
            email: String::new(),
            exp: 9999999999,
            iat: 1000000000,
            iss: Some("https://test.supabase.co".to_string()),
            aud: Some("authenticated".to_string()),
            role: "user".to_string(),
        };

        let user = User::from_claims(claims).unwrap();
        assert_eq!(user.email, "");
        assert_eq!(
            user.id,
            Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap()
        );
    }

    #[test]
    fn test_user_serde_roundtrip() {
        let user = User {
            id: Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap(),
            email: "test@example.com".to_string(),
            username: Some("testuser".to_string()),
            rank: "user".to_string(),
            is_admin: false,
        };

        let json = serde_json::to_string(&user).unwrap();
        let parsed: User = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.id, user.id);
        assert_eq!(parsed.email, user.email);
        assert_eq!(parsed.username, Some("testuser".to_string()));
        assert_eq!(parsed.rank, "user");
        assert!(!parsed.is_admin);
    }

    #[test]
    fn test_user_serde_with_none_username() {
        let user = User {
            id: Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap(),
            email: "test@example.com".to_string(),
            username: None,
            rank: "user".to_string(),
            is_admin: false,
        };

        let json = serde_json::to_string(&user).unwrap();
        let parsed: User = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.username, None);
    }

    #[test]
    fn test_user_clone() {
        let user = User {
            id: Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap(),
            email: "admin@test.com".to_string(),
            username: None,
            rank: "admin".to_string(),
            is_admin: true,
        };

        let cloned = user.clone();
        assert_eq!(cloned.id, user.id);
        assert_eq!(cloned.email, user.email);
        assert_eq!(cloned.is_admin, user.is_admin);
    }

    #[test]
    fn test_user_debug_format() {
        let user = User {
            id: Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap(),
            email: "test@example.com".to_string(),
            username: None,
            rank: "user".to_string(),
            is_admin: false,
        };

        let debug = format!("{:?}", user);
        assert!(debug.contains("test@example.com"));
        assert!(debug.contains("User"));
    }
}
