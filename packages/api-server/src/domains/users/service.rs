//! Users service
//!
//! 사용자 관련 비즈니스 로직

use sea_orm::{
    ActiveModelTrait, ConnectionTrait, DatabaseConnection, DbBackend, EntityTrait, Set, Statement,
};
use uuid::Uuid;

use crate::{
    entities::users::{ActiveModel, Entity as Users, Model as UserModel},
    entities::user_social_accounts::Entity as UserSocialAccounts,
    error::{AppError, AppResult},
    utils::pagination::{PaginatedResponse, Pagination},
};

use super::dto::{
    SavedItem, SocialAccountResponse, TryItem, UpdateUserDto, UserActivityItem, UserActivityType,
    UserResponse, UserStatsResponse,
};

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

/// 소셜 계정 목록 조회
pub async fn list_social_accounts(
    db: &DatabaseConnection,
    user_id: Uuid,
) -> AppResult<Vec<SocialAccountResponse>> {
    use sea_orm::ColumnTrait;
    use sea_orm::QueryFilter;

    let accounts = UserSocialAccounts::find()
        .filter(crate::entities::user_social_accounts::Column::UserId.eq(user_id))
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(accounts
        .into_iter()
        .map(|a| SocialAccountResponse {
            provider: a.provider,
            provider_user_id: a.provider_user_id,
            last_synced_at: a.last_synced_at.map(|dt| dt.with_timezone(&chrono::Utc)),
        })
        .collect())
}

async fn count_followers(db: &DatabaseConnection, user_id: Uuid) -> AppResult<i64> {
    let result = db
        .query_one(Statement::from_sql_and_values(
            DbBackend::Postgres,
            "SELECT COUNT(*)::BIGINT AS cnt FROM public.user_follows WHERE following_id = $1",
            [user_id.into()],
        ))
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(result
        .map(|row| row.try_get::<i64>("", "cnt").unwrap_or(0))
        .unwrap_or(0))
}

async fn count_following(db: &DatabaseConnection, user_id: Uuid) -> AppResult<i64> {
    let result = db
        .query_one(Statement::from_sql_and_values(
            DbBackend::Postgres,
            "SELECT COUNT(*)::BIGINT AS cnt FROM public.user_follows WHERE follower_id = $1",
            [user_id.into()],
        ))
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(result
        .map(|row| row.try_get::<i64>("", "cnt").unwrap_or(0))
        .unwrap_or(0))
}

/// VTON 히스토리 목록 조회
pub async fn list_my_tries(
    db: &DatabaseConnection,
    user_id: Uuid,
    pagination: Pagination,
) -> AppResult<PaginatedResponse<TryItem>> {
    use crate::entities::user_tryon_history::Entity as UserTryonHistory;
    use sea_orm::{ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, QueryOrder, QuerySelect};

    let per_page = pagination.per_page.min(50);
    let offset = (pagination.page.max(1) - 1) * per_page;

    let total_items = UserTryonHistory::find()
        .filter(crate::entities::user_tryon_history::Column::UserId.eq(user_id))
        .count(db)
        .await
        .map_err(AppError::DatabaseError)?;

    let rows = UserTryonHistory::find()
        .filter(crate::entities::user_tryon_history::Column::UserId.eq(user_id))
        .order_by_desc(crate::entities::user_tryon_history::Column::CreatedAt)
        .offset(offset)
        .limit(per_page)
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;

    let items: Vec<TryItem> = rows
        .into_iter()
        .map(|r| TryItem {
            id: r.id,
            image_url: r.image_url,
            created_at: r.created_at.into(),
        })
        .collect();

    Ok(PaginatedResponse::new(
        items,
        Pagination::new(pagination.page, per_page),
        total_items,
    ))
}

/// 저장된 포스트 목록 조회
pub async fn list_my_saved(
    db: &DatabaseConnection,
    user_id: Uuid,
    pagination: Pagination,
) -> AppResult<PaginatedResponse<SavedItem>> {
    let per_page = pagination.per_page.min(50);
    let offset = (pagination.page.max(1) - 1) * per_page;

    let total_row = db
        .query_one(Statement::from_sql_and_values(
            DbBackend::Postgres,
            "SELECT COUNT(*)::BIGINT AS cnt FROM public.saved_posts WHERE user_id = $1",
            [user_id.into()],
        ))
        .await
        .map_err(AppError::DatabaseError)?;

    let total_items = total_row
        .map(|r| r.try_get::<i64>("", "cnt").unwrap_or(0))
        .unwrap_or(0) as u64;

    let rows = db
        .query_all(Statement::from_sql_and_values(
            DbBackend::Postgres,
            r#"SELECT sp.id, sp.post_id, p.title AS post_title, p.image_url AS post_thumbnail_url, sp.created_at AS saved_at
               FROM public.saved_posts sp
               JOIN public.posts p ON sp.post_id = p.id
               WHERE sp.user_id = $1
               ORDER BY sp.created_at DESC
               LIMIT $2 OFFSET $3"#,
            [
                user_id.into(),
                (per_page as i64).into(),
                (offset as i64).into(),
            ],
        ))
        .await
        .map_err(AppError::DatabaseError)?;

    let items: Vec<SavedItem> = rows
        .iter()
        .map(|row| SavedItem {
            id: row.try_get("", "id").unwrap_or_default(),
            post_id: row.try_get("", "post_id").unwrap_or_default(),
            post_title: row.try_get("", "post_title").ok(),
            post_thumbnail_url: row.try_get("", "post_thumbnail_url").ok(),
            saved_at: row
                .try_get::<chrono::DateTime<chrono::Utc>>("", "saved_at")
                .unwrap_or_default(),
        })
        .collect();

    Ok(PaginatedResponse::new(
        items,
        Pagination::new(pagination.page, per_page),
        total_items,
    ))
}

/// 사용자 프로필 + 팔로워/팔로잉 수 조회
pub async fn get_user_with_follow_counts(
    db: &DatabaseConnection,
    user_id: Uuid,
) -> AppResult<UserResponse> {
    let user = get_user_by_id(db, user_id).await?;
    let followers_count = count_followers(db, user_id).await?;
    let following_count = count_following(db, user_id).await?;

    Ok(UserResponse {
        followers_count,
        following_count,
        ..UserResponse::from(user)
    })
}
