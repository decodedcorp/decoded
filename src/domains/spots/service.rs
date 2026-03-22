//! Spots service
//!
//! Spot 관련 비즈니스 로직

use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder,
    QuerySelect, Set,
};
use uuid::Uuid;

use crate::{
    domains::categories::{dto::CategoryResponse, service::get_category_by_id},
    entities::{
        posts::{Column as PostColumn, Entity as Posts},
        spots::{ActiveModel, Column, Entity as Spots, Model as SpotModel},
        subcategories::Entity as Subcategories,
    },
    error::{AppError, AppResult},
    utils::pagination::{PaginatedResponse, Pagination},
};
use sea_orm::PaginatorTrait;

use super::dto::{
    AdminSpotListItem, AdminSpotSubcategoryUpdate, CreateSpotDto, SpotListItem, SpotResponse,
    UpdateSpotDto,
};

/// Spot의 subcategory를 통해 category 정보 조회
pub async fn get_category_from_spot(
    db: &DatabaseConnection,
    subcategory_id: Uuid,
) -> AppResult<CategoryResponse> {
    // subcategory 조회
    let subcategory = Subcategories::find_by_id(subcategory_id)
        .one(db)
        .await
        .map_err(AppError::DatabaseError)?
        .ok_or_else(|| AppError::not_found("Subcategory를 찾을 수 없습니다"))?;

    // category 조회
    let category = get_category_by_id(db, subcategory.category_id).await?;
    Ok(category)
}

/// Spot 생성
pub async fn create_spot(
    db: &DatabaseConnection,
    post_id: Uuid,
    user_id: Uuid,
    dto: CreateSpotDto,
) -> AppResult<SpotResponse> {
    // subcategory 존재 확인 및 category 조회
    let category = get_category_from_spot(db, dto.category_id).await?;

    // ActiveModel 생성
    let spot = ActiveModel {
        id: Set(Uuid::new_v4()),
        post_id: Set(post_id),
        user_id: Set(user_id),
        position_left: Set(dto.position_left),
        position_top: Set(dto.position_top),
        subcategory_id: Set(Some(dto.category_id)), // Spots 개별 생성은 category_id 필수
        status: Set("open".to_string()),
        ..Default::default()
    };

    // DB에 저장
    let created_spot = spot.insert(db).await.map_err(AppError::DatabaseError)?;

    // SpotResponse로 변환
    Ok(SpotResponse {
        id: created_spot.id,
        post_id: created_spot.post_id,
        user_id: created_spot.user_id,
        position_left: created_spot.position_left,
        position_top: created_spot.position_top,
        category: Some(category), // Spots 개별 생성은 항상 category 있음
        status: created_spot.status,
        created_at: created_spot.created_at.with_timezone(&chrono::Utc),
    })
}

/// Post ID로 Spot 목록 조회
pub async fn list_spots_by_post_id(
    db: &DatabaseConnection,
    post_id: Uuid,
) -> AppResult<Vec<SpotListItem>> {
    let spots = Spots::find()
        .filter(Column::PostId.eq(post_id))
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;

    // SpotListItem으로 변환 (카테고리 정보 포함)
    let mut items = Vec::new();
    for spot in spots {
        let category = if let Some(subcategory_id) = spot.subcategory_id {
            Some(get_category_from_spot(db, subcategory_id).await?)
        } else {
            None
        };
        items.push(SpotListItem {
            id: spot.id,
            position_left: spot.position_left,
            position_top: spot.position_top,
            category,
            status: spot.status,
            created_at: spot.created_at.with_timezone(&chrono::Utc),
        });
    }

    Ok(items)
}

/// Spot ID로 조회
pub async fn get_spot_by_id(db: &DatabaseConnection, spot_id: Uuid) -> AppResult<SpotModel> {
    Spots::find_by_id(spot_id)
        .one(db)
        .await
        .map_err(AppError::DatabaseError)?
        .ok_or_else(|| AppError::NotFound(format!("Spot not found: {}", spot_id)))
}

/// Spot 수정
pub async fn update_spot(
    db: &DatabaseConnection,
    spot_id: Uuid,
    user_id: Uuid,
    dto: UpdateSpotDto,
) -> AppResult<SpotResponse> {
    // Spot 존재 확인 및 소유권 확인
    let spot = get_spot_by_id(db, spot_id).await?;
    if spot.user_id != user_id {
        return Err(AppError::Forbidden(
            "You can only update your own spots".to_string(),
        ));
    }

    // ActiveModel로 변환하여 업데이트
    let mut active_spot: ActiveModel = spot.into();

    if let Some(position_left) = dto.position_left {
        active_spot.position_left = Set(position_left);
    }

    if let Some(position_top) = dto.position_top {
        active_spot.position_top = Set(position_top);
    }

    if let Some(category_id) = dto.category_id {
        // subcategory 존재 확인
        let _ = get_category_from_spot(db, category_id).await?;
        active_spot.subcategory_id = Set(Some(category_id));
    }

    if let Some(status) = dto.status {
        active_spot.status = Set(status);
    }

    // DB 업데이트
    let updated_spot = active_spot
        .update(db)
        .await
        .map_err(AppError::DatabaseError)?;

    // 카테고리 정보 조회
    let category = if let Some(subcategory_id) = updated_spot.subcategory_id {
        Some(get_category_from_spot(db, subcategory_id).await?)
    } else {
        None
    };

    // SpotResponse로 변환
    Ok(SpotResponse {
        id: updated_spot.id,
        post_id: updated_spot.post_id,
        user_id: updated_spot.user_id,
        position_left: updated_spot.position_left,
        position_top: updated_spot.position_top,
        category,
        status: updated_spot.status,
        created_at: updated_spot.created_at.with_timezone(&chrono::Utc),
    })
}

/// Spot 삭제
pub async fn delete_spot(db: &DatabaseConnection, spot_id: Uuid, user_id: Uuid) -> AppResult<()> {
    // Spot 존재 확인 및 소유권 확인
    let spot = get_spot_by_id(db, spot_id).await?;
    if spot.user_id != user_id {
        return Err(AppError::Forbidden(
            "You can only delete your own spots".to_string(),
        ));
    }

    // 삭제
    let active_spot: ActiveModel = spot.into();
    active_spot
        .delete(db)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(())
}

/// Post ID로 Spot 개수 조회
pub async fn count_spots_by_post_id(db: &DatabaseConnection, post_id: Uuid) -> AppResult<i64> {
    let count = Spots::find()
        .filter(Column::PostId.eq(post_id))
        .count(db)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(count as i64)
}

/// Admin: 서브카테고리 필터 spot 목록 (페이지네이션)
pub async fn admin_list_spots(
    db: &DatabaseConnection,
    subcategory_id: Option<Uuid>,
    pagination: Pagination,
) -> AppResult<PaginatedResponse<AdminSpotListItem>> {
    let mut q = Spots::find();
    if let Some(sid) = subcategory_id {
        q = q.filter(Column::SubcategoryId.eq(sid));
    }

    let total_items = q.clone().count(db).await.map_err(AppError::DatabaseError)?;

    let spots = q
        .order_by_desc(Column::CreatedAt)
        .offset(pagination.offset())
        .limit(pagination.limit())
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;

    let post_ids: Vec<Uuid> = spots.iter().map(|s| s.post_id).collect();
    let posts: std::collections::HashMap<Uuid, String> = if post_ids.is_empty() {
        std::collections::HashMap::new()
    } else {
        Posts::find()
            .filter(PostColumn::Id.is_in(post_ids))
            .all(db)
            .await
            .map_err(AppError::DatabaseError)?
            .into_iter()
            .map(|p| (p.id, p.image_url))
            .collect()
    };

    let data = spots
        .into_iter()
        .map(|s| AdminSpotListItem {
            id: s.id,
            post_id: s.post_id,
            user_id: s.user_id,
            position_left: s.position_left,
            position_top: s.position_top,
            subcategory_id: s.subcategory_id,
            post_image_url: posts.get(&s.post_id).cloned().unwrap_or_default(),
            created_at: s.created_at.with_timezone(&chrono::Utc),
        })
        .collect();

    Ok(PaginatedResponse::new(data, pagination, total_items))
}

/// Admin: spot 서브카테고리만 변경 (소유권 검사 없음)
pub async fn admin_update_spot_subcategory(
    db: &DatabaseConnection,
    spot_id: Uuid,
    dto: AdminSpotSubcategoryUpdate,
) -> AppResult<SpotResponse> {
    crate::domains::subcategories::service::ensure_subcategory_exists(db, dto.subcategory_id)
        .await?;

    let spot = get_spot_by_id(db, spot_id).await?;
    let mut active: ActiveModel = spot.into();
    active.subcategory_id = Set(Some(dto.subcategory_id));
    let updated_spot = active.update(db).await.map_err(AppError::DatabaseError)?;

    let category = if let Some(subcategory_id) = updated_spot.subcategory_id {
        Some(get_category_from_spot(db, subcategory_id).await?)
    } else {
        None
    };

    Ok(SpotResponse {
        id: updated_spot.id,
        post_id: updated_spot.post_id,
        user_id: updated_spot.user_id,
        position_left: updated_spot.position_left,
        position_top: updated_spot.position_top,
        category,
        status: updated_spot.status,
        created_at: updated_spot.created_at.with_timezone(&chrono::Utc),
    })
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    // Note: 실제 DB 테스트는 통합 테스트에서 수행
}
