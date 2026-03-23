//! Users service
//!
//! 사용자 관련 비즈니스 로직

use sea_orm::{ActiveModelTrait, DatabaseConnection, EntityTrait, Set};
use uuid::Uuid;

use crate::{
    entities::users::{ActiveModel, Entity as Users, Model as UserModel},
    error::{AppError, AppResult},
    utils::pagination::{PaginatedResponse, Pagination},
};

use super::dto::{UpdateUserDto, UserActivityItem, UserActivityType, UserStatsResponse};

/// 사용자 ID로 프로필 조회
pub async fn get_user_by_id(db: &DatabaseConnection, user_id: Uuid) -> AppResult<UserModel> {
    Users::find_by_id(user_id)
        .one(db)
        .await
        .map_err(AppError::DatabaseError)?
        .ok_or_else(|| AppError::NotFound(format!("User not found: {}", user_id)))
}

/// 사용자 프로필 수정
pub async fn update_user_profile(
    db: &DatabaseConnection,
    user_id: Uuid,
    dto: UpdateUserDto,
) -> AppResult<UserModel> {
    // 사용자 존재 확인
    let user = get_user_by_id(db, user_id).await?;

    // ActiveModel로 변환하여 업데이트
    let mut active_user: ActiveModel = user.into();

    if let Some(display_name) = dto.display_name {
        active_user.display_name = Set(Some(display_name));
    }

    if let Some(avatar_url) = dto.avatar_url {
        active_user.avatar_url = Set(Some(avatar_url));
    }

    if let Some(bio) = dto.bio {
        active_user.bio = Set(Some(bio));
    }

    // DB 업데이트
    active_user
        .update(db)
        .await
        .map_err(AppError::DatabaseError)
}

/// 내 활동 통계 조회
pub async fn get_user_stats(
    db: &DatabaseConnection,
    user_id: Uuid,
) -> AppResult<UserStatsResponse> {
    let user = get_user_by_id(db, user_id).await?;

    Ok(UserStatsResponse {
        user_id,
        total_posts: 0,
        total_comments: 0,
        total_likes_received: 0,
        total_points: user.total_points,
        rank: user.rank,
    })
}

/// 활동 내역 조회 (향후 Post/Spot/Solution 데이터 연동 예정)
pub async fn list_user_activities(
    _db: &DatabaseConnection,
    _user_id: Uuid,
    _activity_type: Option<UserActivityType>,
    pagination: Pagination,
) -> AppResult<PaginatedResponse<UserActivityItem>> {
    // TODO(Phase 6+): 실제 Post/Spot/Solution 데이터와 조인
    Ok(PaginatedResponse::new(Vec::new(), pagination, 0))
}
