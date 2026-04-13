use crate::entities::{posts, saved_posts};
use crate::error::{AppError, AppResult};
use sea_orm::ActiveValue::Set;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait, QueryFilter,
};
use uuid::Uuid;

pub async fn save_post(
    db: &DatabaseConnection,
    post_id: Uuid,
    user_id: Uuid,
) -> AppResult<saved_posts::Model> {
    posts::Entity::find_by_id(post_id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Post를 찾을 수 없습니다"))?;

    let existing = saved_posts::Entity::find()
        .filter(saved_posts::Column::PostId.eq(post_id))
        .filter(saved_posts::Column::UserId.eq(user_id))
        .one(db)
        .await?;

    if existing.is_some() {
        return Err(AppError::bad_request("이미 저장했습니다"));
    }

    let saved = saved_posts::ActiveModel {
        id: Set(Uuid::new_v4()),
        post_id: Set(post_id),
        user_id: Set(user_id),
        ..Default::default()
    };

    let saved = saved.insert(db).await?;
    Ok(saved)
}

pub async fn unsave_post(db: &DatabaseConnection, post_id: Uuid, user_id: Uuid) -> AppResult<()> {
    let saved = saved_posts::Entity::find()
        .filter(saved_posts::Column::PostId.eq(post_id))
        .filter(saved_posts::Column::UserId.eq(user_id))
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("저장된 포스트를 찾을 수 없습니다"))?;

    let saved_active: saved_posts::ActiveModel = saved.into();
    saved_active.delete(db).await?;

    Ok(())
}

pub async fn user_has_saved(
    db: &DatabaseConnection,
    post_id: Uuid,
    user_id: Uuid,
) -> AppResult<bool> {
    let saved = saved_posts::Entity::find()
        .filter(saved_posts::Column::PostId.eq(post_id))
        .filter(saved_posts::Column::UserId.eq(user_id))
        .one(db)
        .await?;

    Ok(saved.is_some())
}

pub async fn count_saves_by_post_id(db: &DatabaseConnection, post_id: Uuid) -> AppResult<u64> {
    let count = saved_posts::Entity::find()
        .filter(saved_posts::Column::PostId.eq(post_id))
        .count(db)
        .await?;

    Ok(count)
}
