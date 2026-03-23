use crate::entities::{post_likes, posts};
use crate::error::{AppError, AppResult};
use sea_orm::ActiveValue::Set;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait, QueryFilter,
};
use uuid::Uuid;

use super::dto::PostLikeStatsResponse;

pub async fn create_like(
    db: &DatabaseConnection,
    post_id: Uuid,
    user_id: Uuid,
) -> AppResult<post_likes::Model> {
    posts::Entity::find_by_id(post_id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Post를 찾을 수 없습니다"))?;

    let existing = post_likes::Entity::find()
        .filter(post_likes::Column::PostId.eq(post_id))
        .filter(post_likes::Column::UserId.eq(user_id))
        .one(db)
        .await?;

    if existing.is_some() {
        return Err(AppError::bad_request("이미 좋아요를 눌렀습니다"));
    }

    let like = post_likes::ActiveModel {
        id: Set(Uuid::new_v4()),
        post_id: Set(post_id),
        user_id: Set(user_id),
        ..Default::default()
    };

    let like = like.insert(db).await?;
    Ok(like)
}

pub async fn delete_like(db: &DatabaseConnection, post_id: Uuid, user_id: Uuid) -> AppResult<()> {
    let like = post_likes::Entity::find()
        .filter(post_likes::Column::PostId.eq(post_id))
        .filter(post_likes::Column::UserId.eq(user_id))
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("좋아요를 찾을 수 없습니다"))?;

    let like_active: post_likes::ActiveModel = like.into();
    like_active.delete(db).await?;

    Ok(())
}

pub async fn get_like_stats(
    db: &DatabaseConnection,
    post_id: Uuid,
    user_id: Option<Uuid>,
) -> AppResult<PostLikeStatsResponse> {
    posts::Entity::find_by_id(post_id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Post를 찾을 수 없습니다"))?;

    let like_count = post_likes::Entity::find()
        .filter(post_likes::Column::PostId.eq(post_id))
        .count(db)
        .await?;

    let user_has_liked = if let Some(uid) = user_id {
        post_likes::Entity::find()
            .filter(post_likes::Column::PostId.eq(post_id))
            .filter(post_likes::Column::UserId.eq(uid))
            .one(db)
            .await?
            .is_some()
    } else {
        false
    };

    Ok(PostLikeStatsResponse {
        like_count,
        user_has_liked,
    })
}

pub async fn count_likes_by_post_id(db: &DatabaseConnection, post_id: Uuid) -> AppResult<u64> {
    let count = post_likes::Entity::find()
        .filter(post_likes::Column::PostId.eq(post_id))
        .count(db)
        .await?;

    Ok(count)
}

pub async fn user_has_liked(
    db: &DatabaseConnection,
    post_id: Uuid,
    user_id: Uuid,
) -> AppResult<bool> {
    let like = post_likes::Entity::find()
        .filter(post_likes::Column::PostId.eq(post_id))
        .filter(post_likes::Column::UserId.eq(user_id))
        .one(db)
        .await?;

    Ok(like.is_some())
}
