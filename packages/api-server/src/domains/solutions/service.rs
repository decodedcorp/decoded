//! Solutions service
//!
//! Solution 관련 비즈니스 로직

use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, Order, PaginatorTrait,
    QueryFilter, QueryOrder, QuerySelect, Set,
};
use uuid::Uuid;

use crate::entities::users;
use crate::{
    domains::users::service::get_user_by_id,
    entities::solutions::{ActiveModel, Column, Entity as Solutions},
    error::{AppError, AppResult},
};

use super::dto::{
    CreateSolutionDto, SolutionListItem, SolutionResponse, UpdateSolutionDto, VoteStatsDto,
};

/// Solution 생성
pub async fn create_solution(
    db: &DatabaseConnection,
    spot_id: Uuid,
    user_id: Uuid,
    dto: CreateSolutionDto,
) -> AppResult<Uuid> {
    // ActiveModel 생성
    let solution = dto.into_active_model(spot_id, user_id);
    let solution_id = *solution.id.as_ref();

    // DB에 저장
    solution.insert(db).await.map_err(AppError::DatabaseError)?;

    // Solution ID 반환
    Ok(solution_id)
}

/// Spot ID로 Solution 목록 조회 (채택 > 검증 > 정확도 순)
pub async fn list_solutions_by_spot_id(
    db: &DatabaseConnection,
    spot_id: Uuid,
) -> AppResult<Vec<SolutionListItem>> {
    let solutions = Solutions::find()
        .filter(Column::SpotId.eq(spot_id))
        .filter(Column::Status.eq("active"))
        .order_by(Column::IsAdopted, Order::Desc) // 채택된 것 먼저
        .order_by(Column::IsVerified, Order::Desc) // 검증된 것 먼저
        .order_by(Column::AccurateCount, Order::Desc) // 정확도 높은 것 먼저
        .find_also_related(users::Entity)
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;

    let mut items = Vec::new();
    for (solution, user) in solutions {
        // User 정보가 없으면 이 항목은 건너뜀 (Skip orphan solutions)
        let Some(user) = user else {
            tracing::warn!("Solution {} has no associated user", solution.id);
            continue;
        };

        items.push(SolutionListItem {
            id: solution.id,
            brand_id: solution.brand_id,
            user: user.into(),
            match_type: solution.match_type,
            link_type: solution.link_type,
            title: solution.title,
            metadata: solution.metadata,
            thumbnail_url: solution.thumbnail_url,
            original_url: solution.original_url,
            affiliate_url: solution.affiliate_url,
            vote_stats: VoteStatsDto {
                accurate: solution.accurate_count,
                different: solution.different_count,
            },
            is_verified: solution.is_verified,
            is_adopted: solution.is_adopted,
            created_at: solution.created_at.with_timezone(&chrono::Utc),
        });
    }

    Ok(items)
}

/// Solution ID로 조회
pub async fn get_solution_by_id(
    db: &DatabaseConnection,
    solution_id: Uuid,
) -> AppResult<SolutionResponse> {
    let solution = Solutions::find_by_id(solution_id)
        .one(db)
        .await
        .map_err(AppError::DatabaseError)?
        .ok_or_else(|| AppError::NotFound(format!("Solution not found: {}", solution_id)))?;

    let user = get_user_by_id(db, solution.user_id).await?;

    Ok(SolutionResponse {
        id: solution.id,
        spot_id: solution.spot_id,
        brand_id: solution.brand_id,
        user: user.into(),
        match_type: solution.match_type,
        link_type: solution.link_type,
        title: solution.title,
        metadata: solution.metadata,
        original_url: solution.original_url,
        affiliate_url: solution.affiliate_url,
        thumbnail_url: solution.thumbnail_url,
        description: solution.description,
        comment: solution.comment,
        vote_stats: VoteStatsDto {
            accurate: solution.accurate_count,
            different: solution.different_count,
        },
        is_verified: solution.is_verified,
        is_adopted: solution.is_adopted,
        adopted_at: solution.adopted_at.map(|dt| dt.with_timezone(&chrono::Utc)),
        click_count: solution.click_count,
        purchase_count: solution.purchase_count,
        created_at: solution.created_at.with_timezone(&chrono::Utc),
    })
}

/// Solution 수정
pub async fn update_solution(
    db: &DatabaseConnection,
    solution_id: Uuid,
    user_id: Uuid,
    dto: UpdateSolutionDto,
) -> AppResult<()> {
    // Solution 존재 확인 및 소유권 확인
    let solution = Solutions::find_by_id(solution_id)
        .one(db)
        .await
        .map_err(AppError::DatabaseError)?
        .ok_or_else(|| AppError::NotFound(format!("Solution not found: {}", solution_id)))?;

    if solution.user_id != user_id {
        return Err(AppError::Forbidden(
            "You can only update your own solutions".to_string(),
        ));
    }

    // ActiveModel로 변환하여 업데이트
    let mut active_solution: ActiveModel = solution.into();

    if let Some(title) = dto.title {
        active_solution.title = Set(title);
    }

    if let Some(metadata) = dto.metadata {
        active_solution.metadata = Set(Some(metadata));
    }

    if let Some(description) = dto.description {
        active_solution.description = Set(Some(description));
    }

    // DB 업데이트
    active_solution
        .update(db)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(())
}

/// Solution 삭제
pub async fn delete_solution(
    db: &DatabaseConnection,
    solution_id: Uuid,
    user_id: Uuid,
) -> AppResult<()> {
    // Solution 존재 확인 및 소유권 확인
    let solution = Solutions::find_by_id(solution_id)
        .one(db)
        .await
        .map_err(AppError::DatabaseError)?
        .ok_or_else(|| AppError::NotFound(format!("Solution not found: {}", solution_id)))?;

    if solution.user_id != user_id {
        return Err(AppError::Forbidden(
            "You can only delete your own solutions".to_string(),
        ));
    }

    // 삭제 (실제로는 status를 'hidden'으로 변경하는 것이 좋을 수 있음)
    Solutions::delete_by_id(solution_id)
        .exec(db)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(())
}

/// Admin용 Solution 목록 조회 (모든 상태 조회 가능)
pub async fn admin_list_solutions(
    db: &DatabaseConnection,
    query: crate::domains::admin::solutions::AdminSolutionListQuery,
) -> AppResult<crate::utils::pagination::PaginatedResponse<SolutionListItem>> {
    use crate::utils::pagination::PaginatedResponse;

    let mut select = Solutions::find();

    // status 필터 적용 (있으면 적용, 없으면 모든 상태 조회)
    if let Some(ref status) = query.status {
        select = select.filter(Column::Status.eq(status));
    }

    // 필터 적용
    if let Some(spot_id) = query.spot_id {
        select = select.filter(Column::SpotId.eq(spot_id));
    }

    if let Some(user_id) = query.user_id {
        select = select.filter(Column::UserId.eq(user_id));
    }

    // 정렬 적용
    match query.sort.as_str() {
        "recent" => {
            select = select.order_by_desc(Column::CreatedAt);
        }
        "popular" => {
            // accurate_count + different_count 합계로 정렬
            select = select.order_by_desc(Column::AccurateCount);
        }
        "verified" => {
            select = select
                .order_by(Column::IsVerified, Order::Desc)
                .order_by_desc(Column::CreatedAt);
        }
        "adopted" => {
            select = select
                .order_by(Column::IsAdopted, Order::Desc)
                .order_by_desc(Column::CreatedAt);
        }
        _ => {
            select = select.order_by_desc(Column::CreatedAt);
        }
    }

    // 전체 개수 조회
    let total = select
        .clone()
        .count(db)
        .await
        .map_err(AppError::DatabaseError)?;

    // 페이지네이션 적용
    let solutions = select
        .offset(query.pagination.offset())
        .limit(query.pagination.limit())
        .find_also_related(users::Entity)
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;

    // SolutionListItem으로 변환
    let mut items = Vec::new();
    for (solution, user) in solutions {
        // User가 없는 경우 스킵 (데이터 무결성 문제 로그)
        let Some(user) = user else {
            tracing::warn!("Solution {} has no associated user", solution.id);
            continue;
        };
        items.push(SolutionListItem {
            id: solution.id,
            brand_id: solution.brand_id,
            user: user.into(),
            match_type: solution.match_type,
            link_type: solution.link_type,
            title: solution.title,
            metadata: solution.metadata,
            thumbnail_url: solution.thumbnail_url,
            original_url: solution.original_url,
            affiliate_url: solution.affiliate_url,
            vote_stats: VoteStatsDto {
                accurate: solution.accurate_count,
                different: solution.different_count,
            },
            is_verified: solution.is_verified,
            is_adopted: solution.is_adopted,
            created_at: solution.created_at.with_timezone(&chrono::Utc),
        });
    }

    Ok(PaginatedResponse::new(items, query.pagination, total))
}

/// Admin용 Solution 상태 변경
pub async fn admin_update_solution_status(
    db: &DatabaseConnection,
    solution_id: Uuid,
    status: &str,
) -> AppResult<SolutionResponse> {
    // Solution 존재 확인
    let solution = Solutions::find_by_id(solution_id)
        .one(db)
        .await
        .map_err(AppError::DatabaseError)?
        .ok_or_else(|| AppError::NotFound(format!("Solution not found: {}", solution_id)))?;

    // ActiveModel로 변환하여 상태만 업데이트
    let mut active_solution: ActiveModel = solution.into();
    active_solution.status = Set(status.to_string());

    // DB 업데이트
    active_solution
        .update(db)
        .await
        .map_err(AppError::DatabaseError)?;

    // SolutionResponse로 변환
    get_solution_by_id(db, solution_id).await
}
