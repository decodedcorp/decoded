//! Users service
//!
//! 사용자 관련 비즈니스 로직

use sea_orm::{
    ActiveModelTrait, ColumnTrait, ConnectionTrait, DatabaseConnection, DbBackend, EntityTrait,
    QueryFilter, QueryOrder, QuerySelect, Set, Statement,
};
use uuid::Uuid;

use crate::{
    entities::users::{ActiveModel, Entity as Users, Model as UserModel},
    entities::user_social_accounts::Entity as UserSocialAccounts,
    error::{AppError, AppResult},
    utils::pagination::{PaginatedResponse, Pagination},
};

use super::dto::{
    SavedItem, SocialAccountResponse, TryItem, UpdateUserDto, UserActivityItem,
    UserActivityPostMeta, UserActivitySpotMeta, UserActivityType, UserResponse, UserSolutionItem,
    UserSpotItem, UserStatsResponse,
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

/// 사용자의 활성 포스트 수
async fn count_user_posts(db: &DatabaseConnection, user_id: Uuid) -> AppResult<i64> {
    let result = db
        .query_one(Statement::from_sql_and_values(
            DbBackend::Postgres,
            "SELECT COUNT(*)::BIGINT AS cnt FROM public.posts WHERE user_id = $1 AND status = 'active'",
            [user_id.into()],
        ))
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(result
        .map(|row| row.try_get::<i64>("", "cnt").unwrap_or(0))
        .unwrap_or(0))
}

/// 사용자의 댓글 수
async fn count_user_comments(db: &DatabaseConnection, user_id: Uuid) -> AppResult<i64> {
    let result = db
        .query_one(Statement::from_sql_and_values(
            DbBackend::Postgres,
            "SELECT COUNT(*)::BIGINT AS cnt FROM public.comments WHERE user_id = $1",
            [user_id.into()],
        ))
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(result
        .map(|row| row.try_get::<i64>("", "cnt").unwrap_or(0))
        .unwrap_or(0))
}

/// 사용자가 받은 좋아요 수
async fn count_user_likes_received(db: &DatabaseConnection, user_id: Uuid) -> AppResult<i64> {
    let result = db
        .query_one(Statement::from_sql_and_values(
            DbBackend::Postgres,
            "SELECT COUNT(*)::BIGINT AS cnt FROM public.post_likes pl JOIN public.posts p ON pl.post_id = p.id WHERE p.user_id = $1",
            [user_id.into()],
        ))
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(result
        .map(|row| row.try_get::<i64>("", "cnt").unwrap_or(0))
        .unwrap_or(0))
}

/// 내 활동 통계 조회
pub async fn get_user_stats(
    db: &DatabaseConnection,
    user_id: Uuid,
) -> AppResult<UserStatsResponse> {
    let user = get_user_by_id(db, user_id).await?;
    let total_posts = count_user_posts(db, user_id).await?;
    let total_comments = count_user_comments(db, user_id).await?;
    let total_likes_received = count_user_likes_received(db, user_id).await?;

    let count_query = |table: &str| {
        format!(
            "SELECT COUNT(*)::BIGINT AS cnt FROM public.{} WHERE user_id = $1",
            table
        )
    };

    let query_count = |sql: String| async move {
        db.query_one(Statement::from_sql_and_values(
            DbBackend::Postgres,
            &sql,
            [user_id.into()],
        ))
        .await
        .map_err(AppError::DatabaseError)
        .map(|r| r.map(|row| row.try_get::<i64>("", "cnt").unwrap_or(0)).unwrap_or(0))
    };

    let total_posts = query_count(count_query("posts")).await?;
    let total_comments = query_count(count_query("comments")).await?;

    let likes_sql = "SELECT COUNT(*)::BIGINT AS cnt FROM public.post_likes pl JOIN public.posts p ON pl.post_id = p.id WHERE p.user_id = $1";
    let total_likes_received = db
        .query_one(Statement::from_sql_and_values(
            DbBackend::Postgres,
            likes_sql,
            [user_id.into()],
        ))
        .await
        .map_err(AppError::DatabaseError)?
        .map(|row| row.try_get::<i64>("", "cnt").unwrap_or(0))
        .unwrap_or(0);

    Ok(UserStatsResponse {
        user_id,
        total_posts,
        total_comments,
        total_likes_received,
        total_points: user.total_points,
        rank: user.rank,
    })
}

/// 활동 내역 조회 (posts, spots, solutions UNION)
pub async fn list_user_activities(
    db: &DatabaseConnection,
    user_id: Uuid,
    activity_type: Option<UserActivityType>,
    pagination: Pagination,
) -> AppResult<PaginatedResponse<UserActivityItem>> {
    let per_page = pagination.per_page.min(100);
    let offset = (pagination.page.max(1) - 1) * per_page;

    // Build type filter
    let type_filter = match &activity_type {
        Some(UserActivityType::Post) => "WHERE a.activity_type = 'post'",
        Some(UserActivityType::Spot) => "WHERE a.activity_type = 'spot'",
        Some(UserActivityType::Solution) => "WHERE a.activity_type = 'solution'",
        None => "",
    };

    let count_sql = format!(
        r#"SELECT COUNT(*)::BIGINT AS cnt FROM (
            SELECT id, 'post' AS activity_type FROM public.posts WHERE user_id = $1 AND status = 'active'
            UNION ALL
            SELECT id, 'spot' AS activity_type FROM public.spots WHERE user_id = $1
            UNION ALL
            SELECT id, 'solution' AS activity_type FROM public.solutions WHERE user_id = $1 AND status = 'active'
        ) a {type_filter}"#
    );

    let total_row = db
        .query_one(Statement::from_sql_and_values(
            DbBackend::Postgres,
            &count_sql,
            [user_id.into()],
        ))
        .await
        .map_err(AppError::DatabaseError)?;

    let total_items = total_row
        .map(|r| r.try_get::<i64>("", "cnt").unwrap_or(0))
        .unwrap_or(0) as u64;

    let data_sql = format!(
        r#"SELECT * FROM (
            SELECT p.id, 'post' AS activity_type, p.title, NULL::text AS product_name,
                   NULL::boolean AS is_adopted, NULL::boolean AS is_verified,
                   NULL::uuid AS spot_id, NULL::uuid AS spot_post_id,
                   p.image_url AS spot_post_image_url,
                   p.artist_name AS spot_post_artist_name, p.group_name AS spot_post_group_name,
                   p.created_at
            FROM public.posts p WHERE p.user_id = $1 AND p.status = 'active'
            UNION ALL
            SELECT s.id, 'spot' AS activity_type, NULL AS title, NULL AS product_name,
                   NULL AS is_adopted, NULL AS is_verified,
                   s.id AS spot_id, s.post_id AS spot_post_id,
                   sp.image_url AS spot_post_image_url,
                   sp.artist_name AS spot_post_artist_name, sp.group_name AS spot_post_group_name,
                   s.created_at
            FROM public.spots s
            LEFT JOIN public.posts sp ON s.post_id = sp.id
            WHERE s.user_id = $1
            UNION ALL
            SELECT sol.id, 'solution' AS activity_type, sol.title, sol.product_name,
                   sol.is_adopted, sol.is_verified,
                   sol.spot_id AS spot_id, sp2.post_id AS spot_post_id,
                   sp3.image_url AS spot_post_image_url,
                   sp3.artist_name AS spot_post_artist_name, sp3.group_name AS spot_post_group_name,
                   sol.created_at
            FROM public.solutions sol
            LEFT JOIN public.spots sp2 ON sol.spot_id = sp2.id
            LEFT JOIN public.posts sp3 ON sp2.post_id = sp3.id
            WHERE sol.user_id = $1 AND sol.status = 'active'
        ) a {type_filter}
        ORDER BY a.created_at DESC
        LIMIT $2 OFFSET $3"#
    );

    let rows = db
        .query_all(Statement::from_sql_and_values(
            DbBackend::Postgres,
            &data_sql,
            [
                user_id.into(),
                (per_page as i64).into(),
                (offset as i64).into(),
            ],
        ))
        .await
        .map_err(AppError::DatabaseError)?;

    let items: Vec<UserActivityItem> = rows
        .iter()
        .map(|row| {
            let activity_type_str: String = row.try_get("", "activity_type").unwrap_or_default();
            let activity_type = match activity_type_str.as_str() {
                "spot" => UserActivityType::Spot,
                "solution" => UserActivityType::Solution,
                _ => UserActivityType::Post,
            };

            let spot = row
                .try_get::<Uuid>("", "spot_id")
                .ok()
                .map(|spot_id| UserActivitySpotMeta {
                    id: spot_id,
                    post: row.try_get::<Uuid>("", "spot_post_id").ok().map(|pid| {
                        UserActivityPostMeta {
                            id: pid,
                            image_url: row.try_get("", "spot_post_image_url").ok(),
                            artist_name: row.try_get("", "spot_post_artist_name").ok(),
                            group_name: row.try_get("", "spot_post_group_name").ok(),
                        }
                    }),
                });

            UserActivityItem {
                id: row.try_get("", "id").unwrap_or_default(),
                activity_type,
                spot,
                product_name: row.try_get("", "product_name").ok(),
                title: row.try_get("", "title").ok(),
                is_adopted: row.try_get("", "is_adopted").ok(),
                is_verified: row.try_get("", "is_verified").ok(),
                created_at: row
                    .try_get::<chrono::DateTime<chrono::Utc>>("", "created_at")
                    .unwrap_or_default(),
            }
        })
        .collect();

    Ok(PaginatedResponse::new(
        items,
        Pagination::new(pagination.page, per_page),
        total_items,
    ))
}

/// 소셜 계정 목록 조회
/// 유저의 Spot 목록 조회
pub async fn list_user_spots(
    db: &DatabaseConnection,
    user_id: Uuid,
    pagination: Pagination,
) -> AppResult<PaginatedResponse<UserSpotItem>> {
    use crate::entities::spots::{Column as SpotCol, Entity as Spots};
    use sea_orm::PaginatorTrait;

    let per_page = pagination.per_page.min(50);
    let total = Spots::find()
        .filter(SpotCol::UserId.eq(user_id))
        .count(db)
        .await
        .map_err(AppError::DatabaseError)?;

    let spots = Spots::find()
        .filter(SpotCol::UserId.eq(user_id))
        .order_by_desc(SpotCol::CreatedAt)
        .offset(pagination.offset())
        .limit(per_page)
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;

    // Fetch post image_url for each spot
    let post_ids: Vec<Uuid> = spots.iter().map(|s| s.post_id).collect();
    let posts = crate::entities::Posts::find()
        .filter(crate::entities::posts::Column::Id.is_in(post_ids))
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;
    let post_map: std::collections::HashMap<Uuid, String> = posts
        .into_iter()
        .map(|p| (p.id, p.image_url))
        .collect();

    let items = spots
        .into_iter()
        .map(|s| UserSpotItem {
            id: s.id,
            post_id: s.post_id,
            post_image_url: Some(post_map.get(&s.post_id).cloned().unwrap_or_default()),
            position_left: s.position_left,
            position_top: s.position_top,
            status: s.status,
            created_at: s.created_at.with_timezone(&chrono::Utc),
        })
        .collect();

    Ok(PaginatedResponse::new(items, Pagination::new(pagination.page, per_page), total))
}

/// 유저의 Solution 목록 조회
pub async fn list_user_solutions(
    db: &DatabaseConnection,
    user_id: Uuid,
    pagination: Pagination,
) -> AppResult<PaginatedResponse<UserSolutionItem>> {
    use crate::entities::solutions::{Column as SolCol, Entity as Solutions};
    use sea_orm::PaginatorTrait;

    let per_page = pagination.per_page.min(50);
    let total = Solutions::find()
        .filter(SolCol::UserId.eq(user_id))
        .filter(SolCol::Status.eq("active"))
        .count(db)
        .await
        .map_err(AppError::DatabaseError)?;

    let solutions = Solutions::find()
        .filter(SolCol::UserId.eq(user_id))
        .filter(SolCol::Status.eq("active"))
        .order_by_desc(SolCol::CreatedAt)
        .offset(pagination.offset())
        .limit(per_page)
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;

    let items = solutions
        .into_iter()
        .map(|s| UserSolutionItem {
            id: s.id,
            spot_id: s.spot_id,
            title: s.title,
            thumbnail_url: s.thumbnail_url,
            is_adopted: s.is_adopted,
            is_verified: s.is_verified,
            created_at: s.created_at.with_timezone(&chrono::Utc),
        })
        .collect();

    Ok(PaginatedResponse::new(items, Pagination::new(pagination.page, per_page), total))
}

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

/// 팔로우
pub async fn follow_user(
    db: &DatabaseConnection,
    follower_id: Uuid,
    following_id: Uuid,
) -> AppResult<()> {
    if follower_id == following_id {
        return Err(AppError::BadRequest("자기 자신을 팔로우할 수 없습니다".to_string()));
    }

    // 대상 유저 존재 확인
    get_user_by_id(db, following_id).await?;

    db.execute(Statement::from_sql_and_values(
        DbBackend::Postgres,
        "INSERT INTO public.user_follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [follower_id.into(), following_id.into()],
    ))
    .await
    .map_err(AppError::DatabaseError)?;

    Ok(())
}

/// 언팔로우
pub async fn unfollow_user(
    db: &DatabaseConnection,
    follower_id: Uuid,
    following_id: Uuid,
) -> AppResult<()> {
    db.execute(Statement::from_sql_and_values(
        DbBackend::Postgres,
        "DELETE FROM public.user_follows WHERE follower_id = $1 AND following_id = $2",
        [follower_id.into(), following_id.into()],
    ))
    .await
    .map_err(AppError::DatabaseError)?;

    Ok(())
}

/// 팔로우 여부 확인
pub async fn check_is_following(
    db: &DatabaseConnection,
    follower_id: Uuid,
    following_id: Uuid,
) -> AppResult<bool> {
    let result = db
        .query_one(Statement::from_sql_and_values(
            DbBackend::Postgres,
            "SELECT EXISTS(SELECT 1 FROM public.user_follows WHERE follower_id = $1 AND following_id = $2) AS is_following",
            [follower_id.into(), following_id.into()],
        ))
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(result
        .map(|row| row.try_get::<bool>("", "is_following").unwrap_or(false))
        .unwrap_or(false))
}
