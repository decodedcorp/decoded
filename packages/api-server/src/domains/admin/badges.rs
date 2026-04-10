//! Admin Badges 관리
//!
//! 관리자용 뱃지 생성, 수정, 삭제

use axum::{
    extract::{Path, Query, State},
    routing::{patch, post},
    Json, Router,
};
use uuid::Uuid;

use crate::{
    config::{AppConfig, AppState},
    domains::badges::dto::{BadgeCriteria, BadgeRarity, BadgeResponse, BadgeType},
    error::{AppError, AppResult},
    middleware::auth::User,
    utils::pagination::{PaginatedResponse, Pagination},
};
use validator::Validate;

/// 뱃지 생성 요청
#[derive(Debug, Clone, serde::Deserialize, utoipa::ToSchema, Validate)]
pub struct CreateBadgeDto {
    /// 뱃지 타입
    #[serde(rename = "type")]
    pub badge_type: BadgeType,

    /// 뱃지 이름
    #[validate(length(min = 1, max = 256))]
    pub name: String,

    /// 뱃지 설명
    pub description: Option<String>,

    /// 아이콘 URL
    #[serde(skip_serializing_if = "Option::is_none")]
    pub icon_url: Option<String>,

    /// 획득 조건
    pub criteria: BadgeCriteria,

    /// 희귀도
    pub rarity: BadgeRarity,
}

/// 뱃지 수정 요청
#[derive(Debug, Clone, serde::Deserialize, utoipa::ToSchema, Validate)]
pub struct UpdateBadgeDto {
    /// 뱃지 이름 (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(length(max = 256))]
    pub name: Option<String>,

    /// 뱃지 설명 (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(length(max = 2000))]
    pub description: Option<String>,

    /// 아이콘 URL (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(length(max = 2048))]
    pub icon_url: Option<String>,

    /// 획득 조건 (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub criteria: Option<BadgeCriteria>,

    /// 희귀도 (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rarity: Option<BadgeRarity>,
}

/// POST /api/v1/admin/badges - 뱃지 생성
#[utoipa::path(
    post,
    path = "/api/v1/admin/badges",
    tag = "admin",
    security(
        ("bearer_auth" = [])
    ),
    request_body = CreateBadgeDto,
    responses(
        (status = 201, description = "뱃지 생성 성공", body = BadgeResponse),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "Admin 권한 필요"),
        (status = 400, description = "잘못된 요청")
    )
)]
pub async fn create_badge(
    State(state): State<AppState>,
    _extension: axum::Extension<User>, // Admin 미들웨어에서 이미 검증됨
    Json(dto): Json<CreateBadgeDto>,
) -> AppResult<Json<BadgeResponse>> {
    let badge = service::admin_create_badge(state.db.as_ref(), dto).await?;
    Ok(Json(badge))
}

/// PATCH /api/v1/admin/badges/{id} - 뱃지 수정
#[utoipa::path(
    patch,
    path = "/api/v1/admin/badges/{id}",
    tag = "admin",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("id" = Uuid, Path, description = "Badge ID")
    ),
    request_body = UpdateBadgeDto,
    responses(
        (status = 200, description = "뱃지 수정 성공", body = BadgeResponse),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "Admin 권한 필요"),
        (status = 404, description = "뱃지를 찾을 수 없음")
    )
)]
pub async fn update_badge(
    State(state): State<AppState>,
    _extension: axum::Extension<User>, // Admin 미들웨어에서 이미 검증됨
    Path(badge_id): Path<Uuid>,
    Json(dto): Json<UpdateBadgeDto>,
) -> AppResult<Json<BadgeResponse>> {
    let badge = service::admin_update_badge(state.db.as_ref(), badge_id, dto).await?;
    Ok(Json(badge))
}

/// DELETE /api/v1/admin/badges/{id} - 뱃지 삭제
#[utoipa::path(
    delete,
    path = "/api/v1/admin/badges/{id}",
    tag = "admin",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("id" = Uuid, Path, description = "Badge ID")
    ),
    responses(
        (status = 204, description = "뱃지 삭제 성공"),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "Admin 권한 필요"),
        (status = 404, description = "뱃지를 찾을 수 없음"),
        (status = 400, description = "이미 사용자가 획득한 뱃지는 삭제할 수 없습니다")
    )
)]
pub async fn delete_badge(
    State(state): State<AppState>,
    _extension: axum::Extension<User>, // Admin 미들웨어에서 이미 검증됨
    Path(badge_id): Path<Uuid>,
) -> AppResult<axum::http::StatusCode> {
    service::admin_delete_badge(state.db.as_ref(), badge_id).await?;
    Ok(axum::http::StatusCode::NO_CONTENT)
}

/// GET /api/v1/admin/badges - 뱃지 목록 조회 (Admin)
#[utoipa::path(
    get,
    path = "/api/v1/admin/badges",
    operation_id = "admin_list_badges",
    tag = "admin",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("page" = Option<u64>, Query, description = "페이지 번호 (default: 1)"),
        ("per_page" = Option<u64>, Query, description = "페이지당 개수 (default: 50, max: 100)")
    ),
    responses(
        (status = 200, description = "뱃지 목록 조회 성공", body = PaginatedResponse<BadgeResponse>),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "Admin 권한 필요")
    )
)]
pub async fn list_badges(
    State(state): State<AppState>,
    _extension: axum::Extension<User>, // Admin 미들웨어에서 이미 검증됨
    Query(pagination): Query<Pagination>,
) -> AppResult<Json<PaginatedResponse<BadgeResponse>>> {
    let badges = service::admin_list_badges(state.db.as_ref(), pagination).await?;
    Ok(Json(badges))
}

/// Admin badges 라우터
pub fn router(_app_config: AppConfig) -> Router<AppState> {
    Router::new()
        .route("/", post(create_badge).get(list_badges))
        .route("/{id}", patch(update_badge).delete(delete_badge))
}

mod service {
    use super::*;
    use crate::entities;
    use sea_orm::{
        entity::*, ActiveValue::Set, ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait,
        QueryFilter, QueryOrder,
    };

    /// Admin: 뱃지 생성
    pub async fn admin_create_badge(
        db: &DatabaseConnection,
        dto: CreateBadgeDto,
    ) -> AppResult<BadgeResponse> {
        let badge = entities::badges::ActiveModel {
            id: Set(Uuid::new_v4()),
            r#type: Set(format!("{:?}", dto.badge_type).to_lowercase()),
            name: Set(dto.name.clone()),
            description: Set(dto.description.clone()),
            icon_url: Set(dto.icon_url.clone()),
            criteria: Set(serde_json::to_value(&dto.criteria).map_err(|e| {
                AppError::InternalError(format!("Failed to serialize criteria: {}", e))
            })?),
            rarity: Set(format!("{:?}", dto.rarity).to_lowercase()),
            created_at: Set(chrono::Utc::now().into()),
            updated_at: Set(chrono::Utc::now().into()),
        };

        let badge = badge.insert(db).await?;

        Ok(BadgeResponse {
            id: badge.id,
            badge_type: dto.badge_type,
            name: badge.name,
            description: badge.description,
            icon_url: badge.icon_url,
            criteria: dto.criteria,
            rarity: dto.rarity,
            created_at: badge.created_at.with_timezone(&chrono::Utc),
        })
    }

    /// Admin: 뱃지 수정
    pub async fn admin_update_badge(
        db: &DatabaseConnection,
        badge_id: Uuid,
        dto: UpdateBadgeDto,
    ) -> AppResult<BadgeResponse> {
        let badge = entities::Badges::find_by_id(badge_id)
            .one(db)
            .await?
            .ok_or_else(|| AppError::not_found("뱃지를 찾을 수 없습니다"))?;

        let mut badge: entities::badges::ActiveModel = badge.into();

        if let Some(name) = dto.name {
            badge.name = Set(name);
        }

        if let Some(description) = dto.description {
            badge.description = Set(Some(description));
        }

        if let Some(icon_url) = dto.icon_url {
            badge.icon_url = Set(Some(icon_url));
        }

        if let Some(criteria) = dto.criteria {
            badge.criteria = Set(serde_json::to_value(&criteria).map_err(|e| {
                AppError::InternalError(format!("Failed to serialize criteria: {}", e))
            })?);
        }

        if let Some(rarity) = dto.rarity {
            badge.rarity = Set(format!("{:?}", rarity).to_lowercase());
        }

        badge.updated_at = Set(chrono::Utc::now().into());

        let badge = badge.update(db).await?;

        // 응답 생성
        let badge_type = serde_json::from_str(&format!("\"{}\"", badge.r#type))
            .map_err(|e| AppError::InternalError(format!("Failed to parse badge type: {}", e)))?;
        let rarity = serde_json::from_str(&format!("\"{}\"", badge.rarity))
            .map_err(|e| AppError::InternalError(format!("Failed to parse rarity: {}", e)))?;
        let criteria: BadgeCriteria = serde_json::from_value(badge.criteria.clone())
            .map_err(|e| AppError::InternalError(format!("Failed to parse criteria: {}", e)))?;

        Ok(BadgeResponse {
            id: badge.id,
            badge_type,
            name: badge.name,
            description: badge.description,
            icon_url: badge.icon_url,
            criteria,
            rarity,
            created_at: badge.created_at.with_timezone(&chrono::Utc),
        })
    }

    /// Admin: 뱃지 삭제
    pub async fn admin_delete_badge(db: &DatabaseConnection, badge_id: Uuid) -> AppResult<()> {
        // 뱃지 존재 확인
        let badge = entities::Badges::find_by_id(badge_id)
            .one(db)
            .await?
            .ok_or_else(|| AppError::not_found("뱃지를 찾을 수 없습니다"))?;

        // 사용자가 획득한 뱃지인지 확인
        let user_badge_count = entities::UserBadges::find()
            .filter(entities::user_badges::Column::BadgeId.eq(badge_id))
            .count(db)
            .await?;

        if user_badge_count > 0 {
            return Err(AppError::BadRequest(
                "이미 사용자가 획득한 뱃지는 삭제할 수 없습니다".to_string(),
            ));
        }

        // 뱃지 삭제
        entities::Badges::delete_by_id(badge.id).exec(db).await?;

        Ok(())
    }

    /// Admin: 뱃지 목록 조회
    pub async fn admin_list_badges(
        db: &DatabaseConnection,
        pagination: Pagination,
    ) -> AppResult<PaginatedResponse<BadgeResponse>> {
        let page = pagination.page.max(1);
        let per_page = pagination.per_page.clamp(1, 100);

        let paginator = entities::Badges::find()
            .order_by_asc(entities::badges::Column::CreatedAt)
            .paginate(db, per_page);

        let total_items = paginator.num_items().await?;
        let total_pages = paginator.num_pages().await?;

        let badges = paginator.fetch_page(page - 1).await?;

        let data = badges
            .into_iter()
            .map(|badge| {
                let badge_type = serde_json::from_str(&format!("\"{}\"", badge.r#type))
                    .unwrap_or(BadgeType::Achievement);
                let rarity = serde_json::from_str(&format!("\"{}\"", badge.rarity))
                    .unwrap_or(BadgeRarity::Common);
                let criteria: BadgeCriteria = serde_json::from_value(badge.criteria.clone())
                    .unwrap_or(BadgeCriteria {
                        criteria_type: "count".to_string(),
                        target: None,
                        threshold: 0,
                    });

                BadgeResponse {
                    id: badge.id,
                    badge_type,
                    name: badge.name,
                    description: badge.description,
                    icon_url: badge.icon_url,
                    criteria,
                    rarity,
                    created_at: chrono::DateTime::from_naive_utc_and_offset(
                        badge.created_at.naive_utc(),
                        chrono::Utc,
                    ),
                }
            })
            .collect();

        Ok(PaginatedResponse {
            data,
            pagination: crate::utils::pagination::PaginationMeta {
                current_page: page,
                per_page,
                total_items,
                total_pages,
            },
        })
    }

    #[cfg(test)]
    #[allow(clippy::disallowed_methods)]
    mod tests {
        use super::*;
        use crate::tests::fixtures::{badge_model, test_uuid};
        use sea_orm::{DatabaseBackend, MockDatabase};

        #[tokio::test]
        async fn create_badge_success() {
            let badge = badge_model();
            let db = MockDatabase::new(DatabaseBackend::Postgres)
                .append_query_results([vec![badge.clone()]])
                .into_connection();

            let dto = CreateBadgeDto {
                badge_type: BadgeType::Achievement,
                name: "Test Badge".to_string(),
                description: Some("desc".to_string()),
                icon_url: None,
                criteria: BadgeCriteria {
                    criteria_type: "count".to_string(),
                    target: None,
                    threshold: 1,
                },
                rarity: BadgeRarity::Common,
            };

            let result = admin_create_badge(&db, dto).await;
            assert!(result.is_ok());
            let resp = result.unwrap();
            assert_eq!(resp.name, "First Post");
        }

        #[tokio::test]
        async fn update_badge_not_found() {
            let db = MockDatabase::new(DatabaseBackend::Postgres)
                .append_query_results([Vec::<entities::badges::Model>::new()])
                .into_connection();

            let dto = UpdateBadgeDto {
                name: Some("New".to_string()),
                description: None,
                icon_url: None,
                criteria: None,
                rarity: None,
            };

            let result = admin_update_badge(&db, test_uuid(99), dto).await;
            assert!(result.is_err());
        }

        #[tokio::test]
        async fn update_badge_success() {
            let badge = badge_model();
            let mut updated = badge.clone();
            updated.name = "Updated Name".to_string();

            let db = MockDatabase::new(DatabaseBackend::Postgres)
                .append_query_results([vec![badge]])
                .append_query_results([vec![updated]])
                .into_connection();

            let dto = UpdateBadgeDto {
                name: Some("Updated Name".to_string()),
                description: None,
                icon_url: None,
                criteria: None,
                rarity: Some(BadgeRarity::Rare),
            };

            let result = admin_update_badge(&db, test_uuid(60), dto).await;
            assert!(result.is_ok());
            assert_eq!(result.unwrap().name, "Updated Name");
        }

        #[tokio::test]
        async fn delete_badge_not_found() {
            let db = MockDatabase::new(DatabaseBackend::Postgres)
                .append_query_results([Vec::<entities::badges::Model>::new()])
                .into_connection();

            let result = admin_delete_badge(&db, test_uuid(99)).await;
            assert!(result.is_err());
        }

        #[tokio::test]
        async fn update_badge_with_all_fields() {
            let badge = badge_model();
            let updated = badge.clone();

            let db = MockDatabase::new(DatabaseBackend::Postgres)
                .append_query_results([vec![badge]])
                .append_query_results([vec![updated]])
                .into_connection();

            let dto = UpdateBadgeDto {
                name: Some("X".to_string()),
                description: Some("Y".to_string()),
                icon_url: Some("https://example.com/icon.png".to_string()),
                criteria: Some(BadgeCriteria {
                    criteria_type: "count".to_string(),
                    target: Some("fashion".to_string()),
                    threshold: 10,
                }),
                rarity: Some(BadgeRarity::Epic),
            };

            let result = admin_update_badge(&db, test_uuid(60), dto).await;
            assert!(result.is_ok());
        }

        #[tokio::test]
        async fn delete_badge_success_no_users() {
            let badge = badge_model();
            let db = MockDatabase::new(DatabaseBackend::Postgres)
                .append_query_results([vec![badge]]) // find_by_id
                .append_query_results([[crate::tests::fixtures::count_row(0)]]) // user_badge_count
                .append_exec_results([sea_orm::MockExecResult {
                    last_insert_id: 0,
                    rows_affected: 1,
                }])
                .into_connection();

            let result = admin_delete_badge(&db, test_uuid(60)).await;
            assert!(result.is_ok());
        }

        #[tokio::test]
        async fn delete_badge_rejected_when_user_earned() {
            let badge = badge_model();
            let db = MockDatabase::new(DatabaseBackend::Postgres)
                .append_query_results([vec![badge]]) // find_by_id
                .append_query_results([[crate::tests::fixtures::count_row(3)]]) // user_badge_count > 0
                .into_connection();

            let result = admin_delete_badge(&db, test_uuid(60)).await;
            assert!(matches!(result, Err(AppError::BadRequest(_))));
        }

        #[tokio::test]
        async fn list_badges_empty() {
            use crate::utils::pagination::Pagination;
            let db = MockDatabase::new(DatabaseBackend::Postgres)
                .append_query_results([[crate::tests::fixtures::count_row(0)]]) // num_items
                .append_query_results([[crate::tests::fixtures::count_row(0)]]) // num_pages
                .append_query_results([Vec::<entities::badges::Model>::new()]) // fetch_page
                .into_connection();

            let result = admin_list_badges(&db, Pagination::new(1, 20)).await;
            assert!(result.is_ok());
            let resp = result.unwrap();
            assert!(resp.data.is_empty());
            assert_eq!(resp.pagination.total_items, 0);
        }

        #[tokio::test]
        async fn list_badges_with_one_badge() {
            use crate::utils::pagination::Pagination;
            let badge = badge_model();
            let db = MockDatabase::new(DatabaseBackend::Postgres)
                .append_query_results([[crate::tests::fixtures::count_row(1)]])
                .append_query_results([[crate::tests::fixtures::count_row(1)]])
                .append_query_results([vec![badge]])
                .into_connection();

            let result = admin_list_badges(&db, Pagination::new(1, 20)).await;
            assert!(result.is_ok());
            let resp = result.unwrap();
            assert_eq!(resp.data.len(), 1);
            assert_eq!(resp.data[0].name, "First Post");
        }

        #[tokio::test]
        async fn create_badge_db_error() {
            let db = MockDatabase::new(DatabaseBackend::Postgres)
                .append_query_errors(vec![sea_orm::DbErr::Custom("down".into())])
                .into_connection();

            let dto = CreateBadgeDto {
                badge_type: BadgeType::Achievement,
                name: "X".to_string(),
                description: None,
                icon_url: None,
                criteria: BadgeCriteria {
                    criteria_type: "count".to_string(),
                    target: None,
                    threshold: 1,
                },
                rarity: BadgeRarity::Common,
            };
            let result = admin_create_badge(&db, dto).await;
            assert!(result.is_err());
        }

        #[test]
        fn create_badge_dto_roundtrip() {
            let dto = CreateBadgeDto {
                badge_type: BadgeType::Milestone,
                name: "Milestone".to_string(),
                description: None,
                icon_url: None,
                criteria: BadgeCriteria {
                    criteria_type: "count".to_string(),
                    target: None,
                    threshold: 100,
                },
                rarity: BadgeRarity::Legendary,
            };
            let json = serde_json::to_string(&dto.criteria).unwrap();
            assert!(json.contains("\"threshold\":100"));
        }
    }
}
