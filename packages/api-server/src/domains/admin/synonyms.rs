//! Admin Synonyms 관리
//!
//! 관리자용 동의어 생성, 수정, 삭제, Meilisearch 동기화

use axum::{
    extract::{Path, Query, State},
    routing::{get, patch, post},
    Json, Router,
};
use uuid::Uuid;

use crate::{
    config::{AppConfig, AppState},
    error::AppResult,
    middleware::auth::User,
};
use validator::Validate;

/// 동의어 응답
#[derive(Debug, Clone, serde::Serialize, utoipa::ToSchema)]
pub struct SynonymResponse {
    /// 동의어 ID
    pub id: Uuid,

    /// 타입 ('artist' | 'group' | 'location' | 'brand' | 'other')
    #[serde(rename = "type")]
    pub type_: String,

    /// 정규 표현 (대표 명칭)
    pub canonical: String,

    /// 동의어 배열
    pub synonyms: Vec<String>,

    /// 활성화 여부
    pub is_active: bool,

    /// 생성일시
    pub created_at: chrono::DateTime<chrono::Utc>,

    /// 수정일시
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// 동의어 목록 조회 쿼리
#[derive(Debug, Clone, serde::Deserialize, utoipa::ToSchema)]
pub struct SynonymListQuery {
    /// 타입 필터
    #[serde(skip_serializing_if = "Option::is_none")]
    pub type_: Option<String>,

    /// 활성화 여부 필터
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_active: Option<bool>,

    /// 검색어 (canonical 또는 synonyms에 포함)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub search: Option<String>,
}

/// 동의어 생성 요청
#[derive(Debug, Clone, serde::Deserialize, utoipa::ToSchema, Validate)]
pub struct CreateSynonymDto {
    /// 타입 ('artist' | 'group' | 'location' | 'brand' | 'other')
    #[serde(rename = "type")]
    #[validate(length(min = 1, max = 64))]
    pub type_: String,

    /// 정규 표현 (대표 명칭)
    #[validate(length(min = 1, max = 512))]
    pub canonical: String,

    /// 동의어 배열 (최소 1개 이상)
    #[validate(length(min = 1))]
    pub synonyms: Vec<String>,

    /// 활성화 여부 (기본값: true)
    #[serde(default = "default_true")]
    pub is_active: bool,
}

fn default_true() -> bool {
    true
}

/// 동의어 수정 요청
#[derive(Debug, Clone, serde::Deserialize, utoipa::ToSchema, Validate)]
pub struct UpdateSynonymDto {
    /// 타입 (옵션)
    #[serde(rename = "type", skip_serializing_if = "Option::is_none")]
    #[validate(length(max = 64))]
    pub type_: Option<String>,

    /// 정규 표현 (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(length(max = 512))]
    pub canonical: Option<String>,

    /// 동의어 배열 (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub synonyms: Option<Vec<String>>,

    /// 활성화 여부 (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_active: Option<bool>,
}

/// GET /api/v1/admin/synonyms - 동의어 목록 조회
#[utoipa::path(
    get,
    path = "/api/v1/admin/synonyms",
    tag = "admin",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("type" = Option<String>, Query, description = "타입 필터"),
        ("is_active" = Option<bool>, Query, description = "활성화 여부 필터"),
        ("search" = Option<String>, Query, description = "검색어")
    ),
    responses(
        (status = 200, description = "동의어 목록 조회 성공", body = Vec<SynonymResponse>),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "Admin 권한 필요")
    )
)]
pub async fn list_synonyms(
    State(state): State<AppState>,
    _extension: axum::Extension<User>, // Admin 미들웨어에서 이미 검증됨
    Query(query): Query<SynonymListQuery>,
) -> AppResult<Json<Vec<SynonymResponse>>> {
    let synonyms =
        crate::domains::admin::synonyms::service::admin_list_synonyms(state.db.as_ref(), query)
            .await?;
    Ok(Json(synonyms))
}

/// POST /api/v1/admin/synonyms - 동의어 추가
#[utoipa::path(
    post,
    path = "/api/v1/admin/synonyms",
    tag = "admin",
    security(
        ("bearer_auth" = [])
    ),
    request_body = CreateSynonymDto,
    responses(
        (status = 201, description = "동의어 생성 성공", body = SynonymResponse),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "Admin 권한 필요"),
        (status = 400, description = "잘못된 요청")
    )
)]
pub async fn create_synonym(
    State(state): State<AppState>,
    _extension: axum::Extension<User>, // Admin 미들웨어에서 이미 검증됨
    Json(dto): Json<CreateSynonymDto>,
) -> AppResult<Json<SynonymResponse>> {
    let synonym =
        crate::domains::admin::synonyms::service::admin_create_synonym(state.db.as_ref(), dto)
            .await?;
    Ok(Json(synonym))
}

/// PATCH /api/v1/admin/synonyms/{id} - 동의어 수정
#[utoipa::path(
    patch,
    path = "/api/v1/admin/synonyms/{id}",
    tag = "admin",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("id" = Uuid, Path, description = "Synonym ID")
    ),
    request_body = UpdateSynonymDto,
    responses(
        (status = 200, description = "동의어 수정 성공", body = SynonymResponse),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "Admin 권한 필요"),
        (status = 404, description = "동의어를 찾을 수 없음")
    )
)]
pub async fn update_synonym(
    State(state): State<AppState>,
    _extension: axum::Extension<User>, // Admin 미들웨어에서 이미 검증됨
    Path(synonym_id): Path<Uuid>,
    Json(dto): Json<UpdateSynonymDto>,
) -> AppResult<Json<SynonymResponse>> {
    let synonym = crate::domains::admin::synonyms::service::admin_update_synonym(
        state.db.as_ref(),
        synonym_id,
        dto,
    )
    .await?;
    Ok(Json(synonym))
}

/// DELETE /api/v1/admin/synonyms/{id} - 동의어 삭제
#[utoipa::path(
    delete,
    path = "/api/v1/admin/synonyms/{id}",
    tag = "admin",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("id" = Uuid, Path, description = "Synonym ID")
    ),
    responses(
        (status = 204, description = "동의어 삭제 성공"),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "Admin 권한 필요"),
        (status = 404, description = "동의어를 찾을 수 없음")
    )
)]
pub async fn delete_synonym(
    State(state): State<AppState>,
    _extension: axum::Extension<User>, // Admin 미들웨어에서 이미 검증됨
    Path(synonym_id): Path<Uuid>,
) -> AppResult<axum::http::StatusCode> {
    crate::domains::admin::synonyms::service::admin_delete_synonym(state.db.as_ref(), synonym_id)
        .await?;
    Ok(axum::http::StatusCode::NO_CONTENT)
}

/// POST /api/v1/admin/synonyms/sync - Meilisearch 동기화
#[utoipa::path(
    post,
    path = "/api/v1/admin/synonyms/sync",
    tag = "admin",
    security(
        ("bearer_auth" = [])
    ),
    responses(
        (status = 200, description = "동기화 성공"),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "Admin 권한 필요"),
        (status = 500, description = "동기화 실패")
    )
)]
#[allow(clippy::disallowed_methods)] // serde_json::json! 매크로 전개
pub async fn sync_synonyms(
    State(state): State<AppState>,
    _extension: axum::Extension<User>, // Admin 미들웨어에서 이미 검증됨
) -> AppResult<Json<serde_json::Value>> {
    crate::domains::admin::synonyms::service::admin_sync_synonyms(&state).await?;
    Ok(Json(
        serde_json::json!({"message": "Synonyms synchronized successfully"}),
    ))
}

/// Admin Synonyms 라우터
pub fn router(app_config: AppConfig) -> Router<AppState> {
    Router::new()
        .route("/", get(list_synonyms).post(create_synonym))
        .route("/{id}", patch(update_synonym).delete(delete_synonym))
        .route("/sync", post(sync_synonyms))
        // Layer order: admin INNER, auth OUTER — see #257.
        .layer(axum::middleware::from_fn(
            crate::middleware::admin_middleware,
        ))
        .layer(axum::middleware::from_fn_with_state(
            app_config.clone(),
            crate::middleware::auth_middleware,
        ))
}

/// Service 모듈
pub mod service {
    use super::*;
    use crate::{
        entities::synonyms::{ActiveModel, Column, Entity as Synonyms},
        error::{AppError, AppResult},
    };
    use sea_orm::{
        ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set,
    };

    /// Admin용 동의어 목록 조회
    pub async fn admin_list_synonyms(
        db: &DatabaseConnection,
        query: SynonymListQuery,
    ) -> AppResult<Vec<SynonymResponse>> {
        let mut select = Synonyms::find();

        // 필터 적용
        if let Some(ref type_) = query.type_ {
            select = select.filter(Column::Type.eq(type_));
        }

        if let Some(is_active) = query.is_active {
            select = select.filter(Column::IsActive.eq(is_active));
        }

        // 검색어 필터 (canonical에 포함, synonyms 배열 검색은 PostgreSQL의 @> 연산자 사용)
        if let Some(ref search) = query.search {
            use sea_orm::sea_query::Expr;
            // canonical에 포함되거나 synonyms 배열에 포함되는 경우
            // PostgreSQL의 배열 연산자 사용: synonyms @> ARRAY[search]
            select = select.filter(
                Column::Canonical
                    .contains(search)
                    .or(Expr::cust_with_values(
                        "synonyms @> ARRAY[$1]",
                        vec![search.clone()],
                    )),
            );
        }

        use sea_orm::{Order, QueryOrder};
        let synonyms = select
            .order_by(Column::CreatedAt, Order::Desc)
            .all(db)
            .await
            .map_err(AppError::DatabaseError)?;

        Ok(synonyms
            .into_iter()
            .map(|s| SynonymResponse {
                id: s.id,
                type_: s.type_,
                canonical: s.canonical,
                synonyms: s.synonyms,
                is_active: s.is_active,
                created_at: s.created_at.with_timezone(&chrono::Utc),
                updated_at: s.updated_at.with_timezone(&chrono::Utc),
            })
            .collect())
    }

    /// Admin용 동의어 생성
    pub async fn admin_create_synonym(
        db: &DatabaseConnection,
        dto: CreateSynonymDto,
    ) -> AppResult<SynonymResponse> {
        // 유효성 검증
        let valid_types = ["artist", "group", "location", "brand", "other"];
        if !valid_types.contains(&dto.type_.as_str()) {
            return Err(AppError::BadRequest(format!(
                "Invalid type. Must be one of: {}",
                valid_types.join(", ")
            )));
        }

        if dto.synonyms.is_empty() {
            return Err(AppError::BadRequest(
                "At least one synonym is required".to_string(),
            ));
        }

        // canonical 중복 확인 (같은 타입 내에서)
        let existing = Synonyms::find()
            .filter(Column::Type.eq(&dto.type_))
            .filter(Column::Canonical.eq(&dto.canonical))
            .one(db)
            .await
            .map_err(AppError::DatabaseError)?;

        if existing.is_some() {
            return Err(AppError::BadRequest(format!(
                "Synonym with type '{}' and canonical '{}' already exists",
                dto.type_, dto.canonical
            )));
        }

        // ActiveModel 생성
        let synonym = ActiveModel {
            type_: Set(dto.type_),
            canonical: Set(dto.canonical),
            synonyms: Set(dto.synonyms),
            is_active: Set(dto.is_active),
            ..Default::default()
        };

        // DB 저장
        let saved_synonym = synonym.insert(db).await.map_err(AppError::DatabaseError)?;

        Ok(SynonymResponse {
            id: saved_synonym.id,
            type_: saved_synonym.type_,
            canonical: saved_synonym.canonical,
            synonyms: saved_synonym.synonyms,
            is_active: saved_synonym.is_active,
            created_at: saved_synonym.created_at.with_timezone(&chrono::Utc),
            updated_at: saved_synonym.updated_at.with_timezone(&chrono::Utc),
        })
    }

    /// Admin용 동의어 수정
    pub async fn admin_update_synonym(
        db: &DatabaseConnection,
        synonym_id: Uuid,
        dto: UpdateSynonymDto,
    ) -> AppResult<SynonymResponse> {
        // 동의어 존재 확인
        let synonym = Synonyms::find_by_id(synonym_id)
            .one(db)
            .await
            .map_err(AppError::DatabaseError)?
            .ok_or_else(|| AppError::NotFound(format!("Synonym not found: {}", synonym_id)))?;

        // 타입 결정 (변경되면 새 값, 아니면 기존 값)
        let final_type = dto.type_.as_ref().unwrap_or(&synonym.type_);

        // canonical 중복 확인 (변경되는 경우)
        if let Some(ref canonical) = dto.canonical {
            if canonical != &synonym.canonical {
                let existing = Synonyms::find()
                    .filter(Column::Type.eq(final_type))
                    .filter(Column::Canonical.eq(canonical))
                    .filter(Column::Id.ne(synonym_id))
                    .one(db)
                    .await
                    .map_err(AppError::DatabaseError)?;

                if existing.is_some() {
                    return Err(AppError::BadRequest(format!(
                        "Synonym with type '{}' and canonical '{}' already exists",
                        final_type, canonical
                    )));
                }
            }
        }

        // ActiveModel로 변환하여 업데이트
        let mut active_synonym: ActiveModel = synonym.into();

        if let Some(type_) = dto.type_ {
            let valid_types = ["artist", "group", "location", "brand", "other"];
            if !valid_types.contains(&type_.as_str()) {
                return Err(AppError::BadRequest(format!(
                    "Invalid type. Must be one of: {}",
                    valid_types.join(", ")
                )));
            }
            active_synonym.type_ = Set(type_);
        }

        if let Some(canonical) = dto.canonical {
            active_synonym.canonical = Set(canonical);
        }

        if let Some(synonyms) = dto.synonyms {
            if synonyms.is_empty() {
                return Err(AppError::BadRequest(
                    "At least one synonym is required".to_string(),
                ));
            }
            active_synonym.synonyms = Set(synonyms);
        }

        if let Some(is_active) = dto.is_active {
            active_synonym.is_active = Set(is_active);
        }

        // DB 업데이트
        let updated_synonym = active_synonym
            .update(db)
            .await
            .map_err(AppError::DatabaseError)?;

        Ok(SynonymResponse {
            id: updated_synonym.id,
            type_: updated_synonym.type_,
            canonical: updated_synonym.canonical,
            synonyms: updated_synonym.synonyms,
            is_active: updated_synonym.is_active,
            created_at: updated_synonym.created_at.with_timezone(&chrono::Utc),
            updated_at: updated_synonym.updated_at.with_timezone(&chrono::Utc),
        })
    }

    /// Admin용 동의어 삭제
    pub async fn admin_delete_synonym(db: &DatabaseConnection, synonym_id: Uuid) -> AppResult<()> {
        // 동의어 존재 확인
        let synonym = Synonyms::find_by_id(synonym_id)
            .one(db)
            .await
            .map_err(AppError::DatabaseError)?
            .ok_or_else(|| AppError::NotFound(format!("Synonym not found: {}", synonym_id)))?;

        // 삭제
        let active_synonym: ActiveModel = synonym.into();
        active_synonym
            .delete(db)
            .await
            .map_err(AppError::DatabaseError)?;

        Ok(())
    }

    /// Admin용 Meilisearch 동의어 동기화
    pub async fn admin_sync_synonyms(state: &AppState) -> AppResult<()> {
        use crate::services::search::meilisearch::MeilisearchClient;
        use crate::services::search::synonym_manager::SynonymManager;

        // MeilisearchClient에서 Client 추출
        let meilisearch_client = state
            .search_client
            .as_any()
            .downcast_ref::<MeilisearchClient>()
            .ok_or_else(|| {
                AppError::InternalError("Search client is not a MeilisearchClient".to_string())
            })?;

        let synonym_manager =
            SynonymManager::new(meilisearch_client.get_client().clone(), state.db.clone());

        synonym_manager
            .sync_all_synonyms()
            .await
            .map_err(|e| AppError::ExternalService(format!("Failed to sync synonyms: {}", e)))?;

        Ok(())
    }

    #[cfg(test)]
    #[allow(clippy::disallowed_methods)]
    mod tests {
        use super::*;
        use crate::entities::synonyms::Model as SynonymModel;
        use crate::tests::fixtures;
        use sea_orm::{DatabaseBackend, MockDatabase};

        fn synonym_model() -> SynonymModel {
            SynonymModel {
                id: fixtures::test_uuid(120),
                type_: "artist".to_string(),
                canonical: "Jennie".to_string(),
                synonyms: vec!["jennie kim".to_string(), "ジェニー".to_string()],
                is_active: true,
                created_at: fixtures::test_timestamp(),
                updated_at: fixtures::test_timestamp(),
            }
        }

        #[tokio::test]
        async fn admin_list_synonyms_empty() {
            let db = MockDatabase::new(DatabaseBackend::Postgres)
                .append_query_results([Vec::<SynonymModel>::new()])
                .into_connection();
            let result = admin_list_synonyms(
                &db,
                SynonymListQuery {
                    type_: None,
                    is_active: None,
                    search: None,
                },
            )
            .await
            .expect("ok");
            assert!(result.is_empty());
        }

        #[tokio::test]
        async fn admin_list_synonyms_returns_mapped_rows() {
            let db = MockDatabase::new(DatabaseBackend::Postgres)
                .append_query_results([vec![synonym_model()]])
                .into_connection();
            let result = admin_list_synonyms(
                &db,
                SynonymListQuery {
                    type_: Some("artist".to_string()),
                    is_active: Some(true),
                    search: Some("jennie".to_string()),
                },
            )
            .await
            .expect("ok");
            assert_eq!(result.len(), 1);
            assert_eq!(result[0].canonical, "Jennie");
            assert_eq!(result[0].type_, "artist");
            assert_eq!(result[0].synonyms.len(), 2);
            assert!(result[0].is_active);
        }

        #[tokio::test]
        async fn admin_create_synonym_rejects_invalid_type() {
            let db = MockDatabase::new(DatabaseBackend::Postgres).into_connection();
            let dto = CreateSynonymDto {
                type_: "invalid_type".to_string(),
                canonical: "test".to_string(),
                synonyms: vec!["alias".to_string()],
                is_active: true,
            };
            let result = admin_create_synonym(&db, dto).await;
            assert!(matches!(result, Err(AppError::BadRequest(_))));
        }

        #[tokio::test]
        async fn admin_create_synonym_rejects_empty_synonyms() {
            let db = MockDatabase::new(DatabaseBackend::Postgres).into_connection();
            let dto = CreateSynonymDto {
                type_: "artist".to_string(),
                canonical: "Jennie".to_string(),
                synonyms: vec![],
                is_active: true,
            };
            let result = admin_create_synonym(&db, dto).await;
            assert!(matches!(result, Err(AppError::BadRequest(_))));
        }

        #[tokio::test]
        async fn admin_create_synonym_rejects_duplicate_canonical() {
            let db = MockDatabase::new(DatabaseBackend::Postgres)
                .append_query_results([vec![synonym_model()]])
                .into_connection();
            let dto = CreateSynonymDto {
                type_: "artist".to_string(),
                canonical: "Jennie".to_string(),
                synonyms: vec!["alias".to_string()],
                is_active: true,
            };
            let result = admin_create_synonym(&db, dto).await;
            assert!(matches!(result, Err(AppError::BadRequest(_))));
        }

        #[tokio::test]
        async fn admin_update_synonym_not_found() {
            let db = MockDatabase::new(DatabaseBackend::Postgres)
                .append_query_results([Vec::<SynonymModel>::new()])
                .into_connection();
            let dto = UpdateSynonymDto {
                type_: None,
                canonical: None,
                synonyms: None,
                is_active: Some(false),
            };
            let result = admin_update_synonym(&db, fixtures::test_uuid(99), dto).await;
            assert!(matches!(result, Err(AppError::NotFound(_))));
        }

        #[tokio::test]
        async fn admin_update_synonym_rejects_invalid_type() {
            let db = MockDatabase::new(DatabaseBackend::Postgres)
                .append_query_results([vec![synonym_model()]])
                .into_connection();
            let dto = UpdateSynonymDto {
                type_: Some("not_a_type".to_string()),
                canonical: None,
                synonyms: None,
                is_active: None,
            };
            let result = admin_update_synonym(&db, synonym_model().id, dto).await;
            assert!(matches!(result, Err(AppError::BadRequest(_))));
        }

        #[tokio::test]
        async fn admin_update_synonym_rejects_empty_synonyms() {
            let db = MockDatabase::new(DatabaseBackend::Postgres)
                .append_query_results([vec![synonym_model()]])
                .into_connection();
            let dto = UpdateSynonymDto {
                type_: None,
                canonical: None,
                synonyms: Some(vec![]),
                is_active: None,
            };
            let result = admin_update_synonym(&db, synonym_model().id, dto).await;
            assert!(matches!(result, Err(AppError::BadRequest(_))));
        }

        #[tokio::test]
        async fn admin_update_synonym_rejects_duplicate_canonical() {
            let mut existing = synonym_model();
            existing.canonical = "Old Name".to_string();
            // 1st query: load by id; 2nd: lookup duplicate canonical
            let db = MockDatabase::new(DatabaseBackend::Postgres)
                .append_query_results([vec![existing.clone()]])
                .append_query_results([vec![synonym_model()]])
                .into_connection();
            let dto = UpdateSynonymDto {
                type_: None,
                canonical: Some("Jennie".to_string()),
                synonyms: None,
                is_active: None,
            };
            let result = admin_update_synonym(&db, existing.id, dto).await;
            assert!(matches!(result, Err(AppError::BadRequest(_))));
        }

        #[tokio::test]
        async fn admin_delete_synonym_not_found() {
            let db = MockDatabase::new(DatabaseBackend::Postgres)
                .append_query_results([Vec::<SynonymModel>::new()])
                .into_connection();
            let result = admin_delete_synonym(&db, fixtures::test_uuid(99)).await;
            assert!(matches!(result, Err(AppError::NotFound(_))));
        }

        #[tokio::test]
        async fn admin_sync_synonyms_rejects_dummy_search_client() {
            // The DummySearchClient is not a MeilisearchClient, so downcast fails -> InternalError
            let db = MockDatabase::new(DatabaseBackend::Postgres).into_connection();
            let state = crate::tests::helpers::test_app_state(db);
            let result = admin_sync_synonyms(&state).await;
            assert!(matches!(result, Err(AppError::InternalError(_))));
        }

        #[test]
        fn create_synonym_dto_validation_passes() {
            use validator::Validate;
            let dto = CreateSynonymDto {
                type_: "artist".to_string(),
                canonical: "Jennie".to_string(),
                synonyms: vec!["alias".to_string()],
                is_active: true,
            };
            assert!(dto.validate().is_ok());
        }

        #[test]
        fn create_synonym_dto_default_is_active_true() {
            let json = serde_json::json!({
                "type": "artist",
                "canonical": "Jennie",
                "synonyms": ["alias"]
            });
            let dto: CreateSynonymDto = serde_json::from_value(json).unwrap();
            assert!(dto.is_active);
        }
    }
}
