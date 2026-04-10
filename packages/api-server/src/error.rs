use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use thiserror::Error;
use utoipa::ToSchema;

pub type AppResult<T> = Result<T, AppError>;

/// Error response structure for API documentation
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ErrorResponse {
    pub error: ErrorDetail,
}

/// Error detail information
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ErrorDetail {
    pub code: u16,
    pub message: String,
}

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Resource not found: {0}")]
    NotFound(String),

    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Unauthorized: {0}")]
    Unauthorized(String),

    #[error("Forbidden: {0}")]
    Forbidden(String),

    #[error("Validation error: {0}")]
    ValidationError(String),

    #[error("Database error: {0}")]
    DatabaseError(#[from] sea_orm::DbErr),

    #[error("Validation errors: {0}")]
    ValidationErrors(#[from] validator::ValidationErrors),

    #[error("External service error: {0}")]
    ExternalService(String),

    #[error("Configuration error: {0}")]
    Configuration(String),

    #[error("Internal server error: {0}")]
    InternalError(String),
}

impl IntoResponse for AppError {
    // `serde_json::json!` 매크로 전개에 `unwrap`이 포함됨
    #[allow(clippy::disallowed_methods)]
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
            AppError::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, msg),
            AppError::Forbidden(msg) => (StatusCode::FORBIDDEN, msg),
            AppError::ValidationError(msg) => (StatusCode::UNPROCESSABLE_ENTITY, msg),
            AppError::ValidationErrors(err) => (
                StatusCode::UNPROCESSABLE_ENTITY,
                format!("Validation errors: {}", err),
            ),
            AppError::DatabaseError(err) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Database error: {}", err),
            ),
            AppError::ExternalService(msg) => (StatusCode::BAD_GATEWAY, msg),
            AppError::Configuration(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
            AppError::InternalError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
        };

        let body = Json(json!({
            "error": {
                "code": status.as_u16(),
                "message": error_message,
            }
        }));

        (status, body).into_response()
    }
}

// Helper functions for creating errors
impl AppError {
    pub fn not_found(resource: impl Into<String>) -> Self {
        Self::NotFound(resource.into())
    }

    pub fn bad_request(msg: impl Into<String>) -> Self {
        Self::BadRequest(msg.into())
    }

    pub fn unauthorized(msg: impl Into<String>) -> Self {
        Self::Unauthorized(msg.into())
    }

    pub fn forbidden(msg: impl Into<String>) -> Self {
        Self::Forbidden(msg.into())
    }

    pub fn validation(msg: impl Into<String>) -> Self {
        Self::ValidationError(msg.into())
    }

    pub fn internal(msg: impl Into<String>) -> Self {
        Self::InternalError(msg.into())
    }

    pub fn external_service(msg: impl Into<String>) -> Self {
        Self::ExternalService(msg.into())
    }

    pub fn configuration(msg: impl Into<String>) -> Self {
        Self::Configuration(msg.into())
    }
}

#[cfg(test)]
mod tests {
    #![allow(clippy::disallowed_methods)]

    use super::*;
    use axum::body::to_bytes;
    use axum::http::StatusCode;
    use sea_orm::DbErr;
    use validator::{ValidationError, ValidationErrors};

    async fn assert_into_response(err: AppError, status: StatusCode, message: &str) {
        let res = err.into_response();
        assert_eq!(res.status(), status);
        let bytes = to_bytes(res.into_body(), usize::MAX).await.unwrap();
        let parsed: ErrorResponse = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(parsed.error.code, status.as_u16());
        assert_eq!(parsed.error.message, message);
    }

    #[test]
    fn app_error_display_contains_message() {
        let e = AppError::not_found("user");
        assert!(format!("{}", e).contains("user"));
        let e = AppError::bad_request("bad");
        assert!(format!("{}", e).contains("bad"));
        let e = AppError::internal("oops");
        assert!(format!("{}", e).contains("oops"));
    }

    #[tokio::test]
    async fn into_response_not_found() {
        assert_into_response(
            AppError::NotFound("missing".to_string()),
            StatusCode::NOT_FOUND,
            "missing",
        )
        .await;
    }

    #[tokio::test]
    async fn into_response_bad_request() {
        assert_into_response(
            AppError::BadRequest("invalid".to_string()),
            StatusCode::BAD_REQUEST,
            "invalid",
        )
        .await;
    }

    #[tokio::test]
    async fn into_response_unauthorized() {
        assert_into_response(
            AppError::Unauthorized("no token".to_string()),
            StatusCode::UNAUTHORIZED,
            "no token",
        )
        .await;
    }

    #[tokio::test]
    async fn into_response_forbidden() {
        assert_into_response(
            AppError::Forbidden("nope".to_string()),
            StatusCode::FORBIDDEN,
            "nope",
        )
        .await;
    }

    #[tokio::test]
    async fn into_response_validation_error() {
        assert_into_response(
            AppError::ValidationError("bad field".to_string()),
            StatusCode::UNPROCESSABLE_ENTITY,
            "bad field",
        )
        .await;
    }

    #[tokio::test]
    async fn into_response_validation_errors() {
        let mut ve = ValidationErrors::new();
        ve.add("email", ValidationError::new("email"));
        let expected_msg = format!("Validation errors: {ve}");
        assert_into_response(
            AppError::ValidationErrors(ve),
            StatusCode::UNPROCESSABLE_ENTITY,
            &expected_msg,
        )
        .await;
    }

    #[tokio::test]
    async fn into_response_database_error() {
        let db_err = DbErr::Custom("connection refused".to_string());
        let expected_msg = format!("Database error: {db_err}");
        assert_into_response(
            AppError::DatabaseError(db_err),
            StatusCode::INTERNAL_SERVER_ERROR,
            &expected_msg,
        )
        .await;
    }

    #[tokio::test]
    async fn into_response_external_service() {
        assert_into_response(
            AppError::ExternalService("upstream down".to_string()),
            StatusCode::BAD_GATEWAY,
            "upstream down",
        )
        .await;
    }

    #[tokio::test]
    async fn into_response_configuration() {
        assert_into_response(
            AppError::Configuration("missing env".to_string()),
            StatusCode::INTERNAL_SERVER_ERROR,
            "missing env",
        )
        .await;
    }

    #[tokio::test]
    async fn into_response_internal_error() {
        assert_into_response(
            AppError::InternalError("panic later".to_string()),
            StatusCode::INTERNAL_SERVER_ERROR,
            "panic later",
        )
        .await;
    }

    // ── Helper method tests ──

    #[test]
    fn helper_not_found_creates_correct_variant() {
        let err = AppError::not_found("user");
        assert!(matches!(err, AppError::NotFound(ref m) if m == "user"));
    }

    #[test]
    fn helper_bad_request_creates_correct_variant() {
        let err = AppError::bad_request("missing field");
        assert!(matches!(err, AppError::BadRequest(ref m) if m == "missing field"));
    }

    #[test]
    fn helper_unauthorized_creates_correct_variant() {
        let err = AppError::unauthorized("expired token");
        assert!(matches!(err, AppError::Unauthorized(ref m) if m == "expired token"));
    }

    #[test]
    fn helper_forbidden_creates_correct_variant() {
        let err = AppError::forbidden("admin only");
        assert!(matches!(err, AppError::Forbidden(ref m) if m == "admin only"));
    }

    #[test]
    fn helper_validation_creates_correct_variant() {
        let err = AppError::validation("invalid email");
        assert!(matches!(err, AppError::ValidationError(ref m) if m == "invalid email"));
    }

    #[test]
    fn helper_internal_creates_correct_variant() {
        let err = AppError::internal("disk full");
        assert!(matches!(err, AppError::InternalError(ref m) if m == "disk full"));
    }

    #[test]
    fn helper_external_service_creates_correct_variant() {
        let err = AppError::external_service("timeout");
        assert!(matches!(err, AppError::ExternalService(ref m) if m == "timeout"));
    }

    #[test]
    fn helper_configuration_creates_correct_variant() {
        let err = AppError::configuration("missing key");
        assert!(matches!(err, AppError::Configuration(ref m) if m == "missing key"));
    }

    // ── From trait conversion tests ──

    #[test]
    fn from_db_err_converts_to_database_error() {
        let db_err = DbErr::Custom("test".to_string());
        let app_err: AppError = db_err.into();
        assert!(matches!(app_err, AppError::DatabaseError(_)));
    }

    #[test]
    fn from_validation_errors_converts() {
        let mut ve = ValidationErrors::new();
        ve.add("name", ValidationError::new("required"));
        let app_err: AppError = ve.into();
        assert!(matches!(app_err, AppError::ValidationErrors(_)));
    }

    // ── Display for all variants ──

    #[test]
    fn display_messages_for_all_variants() {
        let cases: Vec<(AppError, &str)> = vec![
            (AppError::not_found("x"), "Resource not found: x"),
            (AppError::bad_request("x"), "Bad request: x"),
            (AppError::unauthorized("x"), "Unauthorized: x"),
            (AppError::forbidden("x"), "Forbidden: x"),
            (AppError::validation("x"), "Validation error: x"),
            (AppError::internal("x"), "Internal server error: x"),
            (AppError::external_service("x"), "External service error: x"),
            (AppError::configuration("x"), "Configuration error: x"),
        ];
        for (err, expected) in cases {
            assert_eq!(format!("{err}"), expected);
        }
    }

    #[test]
    fn display_database_error() {
        let err = AppError::DatabaseError(DbErr::Custom("conn lost".to_string()));
        let msg = format!("{err}");
        assert!(msg.contains("conn lost"));
    }

    // ── ErrorResponse serde roundtrip ──

    #[test]
    fn error_response_serde_roundtrip() {
        let resp = ErrorResponse {
            error: ErrorDetail {
                code: 404,
                message: "not found".to_string(),
            },
        };
        let json = serde_json::to_string(&resp).unwrap();
        let parsed: ErrorResponse = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.error.code, 404);
        assert_eq!(parsed.error.message, "not found");
    }
}
