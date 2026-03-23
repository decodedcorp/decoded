//! Admin Curations 관리
//!
//! 관리자용 큐레이션 생성, 수정, 순서 변경, 삭제

use axum::{
    extract::{Path, State},
    routing::{patch, post, put},
    Json, Router,
};
use uuid::Uuid;

use crate::{
    config::{AppConfig, AppState},
    error::AppResult,
    middleware::auth::User,
};
use validator::Validate;

/// 큐레이션 응답
#[derive(Debug, Clone, serde::Serialize, utoipa::ToSchema)]
pub struct CurationResponse {
    /// 큐레이션 ID
    pub id: Uuid,

    /// 제목
    pub title: String,

    /// 설명
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    /// 커버 이미지 URL
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cover_image_url: Option<String>,

    /// 표시 순서
    pub display_order: i32,

    /// 활성화 여부
    pub is_active: bool,

    /// 생성일시
    pub created_at: chrono::DateTime<chrono::Utc>,

    /// 수정일시
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// 큐레이션 생성 요청
#[derive(Debug, Clone, serde::Deserialize, utoipa::ToSchema, Validate)]
pub struct CreateCurationDto {
    /// 제목
    #[validate(length(min = 1, max = 512))]
    pub title: String,

    /// 설명 (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(length(max = 4000))]
    pub description: Option<String>,

    /// 커버 이미지 URL (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(length(max = 2048))]
    pub cover_image_url: Option<String>,

    /// 표시 순서 (기본값: 마지막)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_order: Option<i32>,
}

/// 큐레이션 수정 요청
#[derive(Debug, Clone, serde::Deserialize, utoipa::ToSchema, Validate)]
pub struct UpdateCurationDto {
    /// 제목 (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(length(max = 512))]
    pub title: Option<String>,

    /// 설명 (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(length(max = 4000))]
    pub description: Option<String>,

    /// 커버 이미지 URL (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(length(max = 2048))]
    pub cover_image_url: Option<String>,

    /// 표시 순서 (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_order: Option<i32>,
}

/// 큐레이션 순서 변경 요청
#[derive(Debug, Clone, serde::Deserialize, utoipa::ToSchema)]
pub struct CurationOrderUpdate {
    /// 큐레이션 ID와 새 순서의 매핑
    pub orders: Vec<CurationOrderItem>,
}

/// 큐레이션 순서 아이템
#[derive(Debug, Clone, serde::Deserialize, utoipa::ToSchema)]
pub struct CurationOrderItem {
    /// 큐레이션 ID
    pub curation_id: Uuid,

    /// 새 표시 순서
    pub display_order: i32,
}

/// POST /api/v1/admin/curations - 큐레이션 생성
#[utoipa::path(
    post,
    path = "/api/v1/admin/curations",
    tag = "admin",
    security(
        ("bearer_auth" = [])
    ),
    request_body = CreateCurationDto,
    responses(
        (status = 201, description = "큐레이션 생성 성공", body = CurationResponse),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "Admin 권한 필요"),
        (status = 400, description = "잘못된 요청")
    )
)]
pub async fn create_curation(
    State(state): State<AppState>,
    _extension: axum::Extension<User>, // Admin 미들웨어에서 이미 검증됨
    Json(dto): Json<CreateCurationDto>,
) -> AppResult<Json<CurationResponse>> {
    let curation =
        crate::domains::admin::curations::service::admin_create_curation(&state.db, dto).await?;
    Ok(Json(curation))
}

/// PATCH /api/v1/admin/curations/{id} - 큐레이션 수정
#[utoipa::path(
    patch,
    path = "/api/v1/admin/curations/{id}",
    tag = "admin",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("id" = Uuid, Path, description = "Curation ID")
    ),
    request_body = UpdateCurationDto,
    responses(
        (status = 200, description = "큐레이션 수정 성공", body = CurationResponse),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "Admin 권한 필요"),
        (status = 404, description = "큐레이션을 찾을 수 없음")
    )
)]
pub async fn update_curation(
    State(state): State<AppState>,
    _extension: axum::Extension<User>, // Admin 미들웨어에서 이미 검증됨
    Path(curation_id): Path<Uuid>,
    Json(dto): Json<UpdateCurationDto>,
) -> AppResult<Json<CurationResponse>> {
    let curation = crate::domains::admin::curations::service::admin_update_curation(
        &state.db,
        curation_id,
        dto,
    )
    .await?;
    Ok(Json(curation))
}

/// PUT /api/v1/admin/curations/order - 큐레이션 순서 변경
#[utoipa::path(
    put,
    path = "/api/v1/admin/curations/order",
    tag = "admin",
    security(
        ("bearer_auth" = [])
    ),
    request_body = CurationOrderUpdate,
    responses(
        (status = 200, description = "순서 변경 성공", body = Vec<CurationResponse>),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "Admin 권한 필요"),
        (status = 400, description = "잘못된 요청")
    )
)]
pub async fn update_curation_order(
    State(state): State<AppState>,
    _extension: axum::Extension<User>, // Admin 미들웨어에서 이미 검증됨
    Json(dto): Json<CurationOrderUpdate>,
) -> AppResult<Json<Vec<CurationResponse>>> {
    let curations = crate::domains::admin::curations::service::admin_update_curation_order(
        &state.db, dto.orders,
    )
    .await?;
    Ok(Json(curations))
}

/// DELETE /api/v1/admin/curations/{id} - 큐레이션 삭제
#[utoipa::path(
    delete,
    path = "/api/v1/admin/curations/{id}",
    tag = "admin",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("id" = Uuid, Path, description = "Curation ID")
    ),
    responses(
        (status = 204, description = "큐레이션 삭제 성공"),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "Admin 권한 필요"),
        (status = 404, description = "큐레이션을 찾을 수 없음")
    )
)]
pub async fn delete_curation(
    State(state): State<AppState>,
    _extension: axum::Extension<User>, // Admin 미들웨어에서 이미 검증됨
    Path(curation_id): Path<Uuid>,
) -> AppResult<axum::http::StatusCode> {
    crate::domains::admin::curations::service::admin_delete_curation(&state.db, curation_id)
        .await?;
    Ok(axum::http::StatusCode::NO_CONTENT)
}

/// Admin Curations 라우터
pub fn router(app_config: AppConfig) -> Router<AppState> {
    Router::new()
        .route("/", post(create_curation))
        .route("/{id}", patch(update_curation).delete(delete_curation))
        .route("/order", put(update_curation_order))
        .layer(axum::middleware::from_fn_with_state(
            app_config.clone(),
            crate::middleware::auth_middleware,
        ))
        .layer(axum::middleware::from_fn(
            crate::middleware::admin_middleware,
        ))
}

/// Service 모듈
pub mod service {
    use super::*;
    use crate::{
        entities::curations::{ActiveModel, Column, Entity as Curations},
        error::{AppError, AppResult},
    };
    use sea_orm::{
        ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, Order, QueryFilter,
        QueryOrder, Set, TransactionTrait,
    };

    /// Admin용 큐레이션 생성
    pub async fn admin_create_curation(
        db: &DatabaseConnection,
        dto: CreateCurationDto,
    ) -> AppResult<CurationResponse> {
        // display_order 결정 (없으면 마지막 순서 + 1)
        let display_order = if let Some(order) = dto.display_order {
            order
        } else {
            let max_order = Curations::find()
                .order_by(Column::DisplayOrder, Order::Desc)
                .one(db)
                .await
                .map_err(AppError::DatabaseError)?
                .map(|cur| cur.display_order)
                .unwrap_or(0);
            max_order + 1
        };

        // ActiveModel 생성
        let curation = ActiveModel {
            title: Set(dto.title),
            description: Set(dto.description),
            cover_image_url: Set(dto.cover_image_url),
            display_order: Set(display_order),
            is_active: Set(true), // 기본값: 활성화
            ..Default::default()
        };

        // DB 저장
        let saved_curation = curation.insert(db).await.map_err(AppError::DatabaseError)?;

        Ok(CurationResponse {
            id: saved_curation.id,
            title: saved_curation.title,
            description: saved_curation.description,
            cover_image_url: saved_curation.cover_image_url,
            display_order: saved_curation.display_order,
            is_active: saved_curation.is_active,
            created_at: saved_curation.created_at.with_timezone(&chrono::Utc),
            updated_at: saved_curation.updated_at.with_timezone(&chrono::Utc),
        })
    }

    /// Admin용 큐레이션 수정
    pub async fn admin_update_curation(
        db: &DatabaseConnection,
        curation_id: Uuid,
        dto: UpdateCurationDto,
    ) -> AppResult<CurationResponse> {
        // 큐레이션 존재 확인
        let curation = Curations::find_by_id(curation_id)
            .one(db)
            .await
            .map_err(AppError::DatabaseError)?
            .ok_or_else(|| AppError::NotFound(format!("Curation not found: {}", curation_id)))?;

        // ActiveModel로 변환하여 업데이트
        let mut active_curation: ActiveModel = curation.into();

        if let Some(title) = dto.title {
            active_curation.title = Set(title);
        }

        if let Some(description) = dto.description {
            active_curation.description = Set(Some(description));
        }

        if let Some(cover_image_url) = dto.cover_image_url {
            active_curation.cover_image_url = Set(Some(cover_image_url));
        }

        if let Some(display_order) = dto.display_order {
            active_curation.display_order = Set(display_order);
        }

        // DB 업데이트
        let updated_curation = active_curation
            .update(db)
            .await
            .map_err(AppError::DatabaseError)?;

        Ok(CurationResponse {
            id: updated_curation.id,
            title: updated_curation.title,
            description: updated_curation.description,
            cover_image_url: updated_curation.cover_image_url,
            display_order: updated_curation.display_order,
            is_active: updated_curation.is_active,
            created_at: updated_curation.created_at.with_timezone(&chrono::Utc),
            updated_at: updated_curation.updated_at.with_timezone(&chrono::Utc),
        })
    }

    /// Admin용 큐레이션 순서 변경
    pub async fn admin_update_curation_order(
        db: &DatabaseConnection,
        orders: Vec<CurationOrderItem>,
    ) -> AppResult<Vec<CurationResponse>> {
        // 트랜잭션 시작
        let txn = db.begin().await.map_err(AppError::DatabaseError)?;

        // 각 큐레이션의 순서 업데이트
        for order_item in &orders {
            let curation = Curations::find_by_id(order_item.curation_id)
                .one(&txn)
                .await
                .map_err(AppError::DatabaseError)?
                .ok_or_else(|| {
                    AppError::NotFound(format!("Curation not found: {}", order_item.curation_id))
                })?;

            let mut active_curation: ActiveModel = curation.into();
            active_curation.display_order = Set(order_item.display_order);
            active_curation
                .update(&txn)
                .await
                .map_err(AppError::DatabaseError)?;
        }

        // 트랜잭션 커밋
        txn.commit().await.map_err(AppError::DatabaseError)?;

        // 업데이트된 큐레이션 목록 반환 (display_order 순서대로)
        let curations = Curations::find()
            .filter(Column::Id.is_in(orders.iter().map(|o| o.curation_id).collect::<Vec<_>>()))
            .order_by(Column::DisplayOrder, Order::Asc)
            .all(db)
            .await
            .map_err(AppError::DatabaseError)?;

        Ok(curations
            .into_iter()
            .map(|cur| CurationResponse {
                id: cur.id,
                title: cur.title,
                description: cur.description,
                cover_image_url: cur.cover_image_url,
                display_order: cur.display_order,
                is_active: cur.is_active,
                created_at: cur.created_at.with_timezone(&chrono::Utc),
                updated_at: cur.updated_at.with_timezone(&chrono::Utc),
            })
            .collect())
    }

    /// Admin용 큐레이션 삭제
    pub async fn admin_delete_curation(
        db: &DatabaseConnection,
        curation_id: Uuid,
    ) -> AppResult<()> {
        // 큐레이션 존재 확인
        let curation = Curations::find_by_id(curation_id)
            .one(db)
            .await
            .map_err(AppError::DatabaseError)?
            .ok_or_else(|| AppError::NotFound(format!("Curation not found: {}", curation_id)))?;

        // 삭제 (CASCADE로 curation_posts도 자동 삭제됨)
        let active_curation: ActiveModel = curation.into();
        active_curation
            .delete(db)
            .await
            .map_err(AppError::DatabaseError)?;

        Ok(())
    }
}
