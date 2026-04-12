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
    SpotsByPostItem, SpotsByPostSolution, SpotsByPostsResponse, UpdateSpotDto,
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

/// 여러 post_id 의 spots + 대표 solution 메타를 배치로 조회
///
/// 홈 페이지가 hero/editorial 카드에 아이템 오버레이를 쌓을 때 사용한다.
/// 하나의 query 로 spots 를 모두 가져온 뒤, 다시 하나의 query 로 solutions
/// 를 가져와 N+1 을 피한다. Solution 은 thumbnail_url 이 있는 것만 노출하고
/// 각 spot 당 상위 `solutions_per_spot` 개만 남긴다.
pub async fn list_spots_by_posts(
    db: &DatabaseConnection,
    post_ids: &[Uuid],
    solutions_per_spot: usize,
) -> AppResult<SpotsByPostsResponse> {
    use crate::entities::solutions::{Column as SolutionColumn, Entity as Solutions};
    use std::collections::HashMap;

    let mut spots_by_post: HashMap<Uuid, Vec<SpotsByPostItem>> = HashMap::new();
    for id in post_ids {
        spots_by_post.insert(*id, Vec::new());
    }
    if post_ids.is_empty() {
        return Ok(SpotsByPostsResponse { spots_by_post });
    }

    let spots = Spots::find()
        .filter(Column::PostId.is_in(post_ids.to_vec()))
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;

    if spots.is_empty() {
        return Ok(SpotsByPostsResponse { spots_by_post });
    }

    let spot_ids: Vec<Uuid> = spots.iter().map(|s| s.id).collect();
    let solutions = Solutions::find()
        .filter(SolutionColumn::SpotId.is_in(spot_ids))
        .filter(SolutionColumn::Status.eq(crate::constants::solution_status::ACTIVE))
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;

    // spot_id -> Vec<SpotsByPostSolution>
    let mut by_spot: HashMap<Uuid, Vec<SpotsByPostSolution>> = HashMap::new();
    for sol in solutions {
        if sol.thumbnail_url.as_deref().unwrap_or("").is_empty() {
            continue;
        }
        let brand = sol
            .metadata
            .as_ref()
            .and_then(|m| m.get("brand"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        let bucket = by_spot.entry(sol.spot_id).or_default();
        if bucket.len() >= solutions_per_spot {
            continue;
        }
        bucket.push(SpotsByPostSolution {
            id: sol.id,
            title: sol.title,
            thumbnail_url: sol.thumbnail_url,
            brand,
        });
    }

    for spot in spots {
        let solutions_for_spot = by_spot.remove(&spot.id).unwrap_or_default();
        let entry = spots_by_post.entry(spot.post_id).or_default();
        entry.push(SpotsByPostItem {
            id: spot.id,
            post_id: spot.post_id,
            position_left: spot.position_left,
            position_top: spot.position_top,
            solutions: solutions_for_spot,
        });
    }

    Ok(SpotsByPostsResponse { spots_by_post })
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
