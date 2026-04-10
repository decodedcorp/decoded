//! Admin 권한 체크 미들웨어
//!
//! 인증된 사용자가 관리자 권한을 가지고 있는지 확인합니다.
//! auth_middleware 이후에 사용해야 합니다.

use axum::{
    extract::{Request, State},
    middleware::Next,
    response::Response,
};
use sea_orm::EntityTrait;

use crate::{config::AppState, entities::users, error::AppError, middleware::auth::User};

/// 관리자 권한 확인 미들웨어 (JWT role 기반)
///
/// Extension에서 User를 추출하고 `is_admin` 필드를 확인합니다.
/// Admin이 아닌 경우 403 Forbidden을 반환합니다.
pub async fn admin_middleware(request: Request, next: Next) -> Result<Response, AppError> {
    // Extension에서 User 추출
    let user = request
        .extensions()
        .get::<User>()
        .ok_or_else(|| AppError::Unauthorized("Authentication required".to_string()))?;

    // 관리자 권한 확인
    if !user.is_admin {
        return Err(AppError::Forbidden("Admin privileges required".to_string()));
    }

    Ok(next.run(request).await)
}

/// 관리자 권한 확인 미들웨어 (DB users.is_admin 기반)
///
/// auth_middleware 이후에 사용. JWT role 대신 DB의 users.is_admin을 조회하여
/// Next.js checkIsAdmin과 동일한 방식으로 검증합니다.
pub async fn admin_db_middleware(
    State(state): State<AppState>,
    request: Request,
    next: Next,
) -> Result<Response, AppError> {
    let user = request
        .extensions()
        .get::<User>()
        .ok_or_else(|| AppError::Unauthorized("Authentication required".to_string()))?;

    let db_user = users::Entity::find_by_id(user.id)
        .one(state.db.as_ref())
        .await
        .map_err(|e| AppError::InternalError(format!("Database error: {}", e)))?;

    let is_admin = db_user.map(|u| u.is_admin).unwrap_or(false);
    if !is_admin {
        return Err(AppError::Forbidden("Admin privileges required".to_string()));
    }

    Ok(next.run(request).await)
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use crate::middleware::auth::User;
    use uuid::Uuid;

    /// User 구조체의 is_admin 필드 검증 테스트
    #[test]
    fn test_user_is_admin_field() {
        let admin_user = User {
            id: Uuid::new_v4(),
            email: "admin@example.com".to_string(),
            username: Some("admin".to_string()),
            rank: "admin".to_string(),
            is_admin: true,
        };
        assert!(admin_user.is_admin);

        let regular_user = User {
            id: Uuid::new_v4(),
            email: "user@example.com".to_string(),
            username: Some("user".to_string()),
            rank: "member".to_string(),
            is_admin: false,
        };
        assert!(!regular_user.is_admin);
    }
}
