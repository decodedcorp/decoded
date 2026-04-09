//! Solutions API handlers
//!
//! Solution 관련 HTTP 엔드포인트
//!
//! `serde_json::json!` 매크로 전개에 `unwrap`이 포함되어 Clippy와 충돌합니다.
#![allow(clippy::disallowed_methods)]

use axum::{
    extract::{Path, State},
    middleware::from_fn_with_state,
    routing::{get, patch, post},
    Extension, Json, Router,
};
use reqwest::StatusCode;
use uuid::Uuid;

use crate::{
    config::{AppConfig, AppState},
    error::{AppError, AppResult},
    middleware::{auth::User, auth_middleware},
    services::upsert_solution_embedding,
};

use super::{
    dto::{
        AffiliateLinkResponse, ConvertAffiliateDto, CreateSolutionDto, ExtractMetadataDto,
        MetadataResponse, SolutionListItem, SolutionResponse, UpdateSolutionDto,
    },
    service,
};

#[derive(serde::Deserialize, utoipa::ToSchema)]
pub struct TestAnalyzeLinkDto {
    pub solution_id: Uuid,
}

#[derive(serde::Deserialize, utoipa::ToSchema)]
pub struct FullIntegrationTestDto {
    pub url: String,
}

/// POST /api/v1/spots/{spot_id}/solutions - Solution 등록
#[utoipa::path(
    post,
    path = "/api/v1/spots/{spot_id}/solutions",
    tag = "solutions",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("spot_id" = Uuid, Path, description = "Spot ID")
    ),
    request_body = CreateSolutionDto,
    responses(
        (status = 201, description = "Solution 생성 성공"),
        (status = 401, description = "인증 필요"),
        (status = 404, description = "Spot을 찾을 수 없음")
    )
)]
pub async fn create_solution(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Path(spot_id): Path<Uuid>,
    Json(dto): Json<CreateSolutionDto>,
) -> AppResult<(StatusCode, Json<serde_json::Value>)> {
    // Create solution
    let solution_id = service::create_solution(&state.db, spot_id, user.id, dto.clone()).await?;

    // Trigger AI analysis asynchronously (fire and forget)
    let url = dto.original_url.clone();
    let title = dto.title.clone().unwrap_or_default();
    let description = dto.description.clone().unwrap_or_default();
    let site_name = extract_site_name_from_url(&url);

    let ai_client = state.decoded_ai_client.clone();
    tokio::spawn(async move {
        if let Err(e) = ai_client
            .analyze_link(url, solution_id.to_string(), title, description, site_name)
            .await
        {
            tracing::error!(
                "Failed to trigger AI analysis for solution {}: {}",
                solution_id,
                e
            );
        } else {
            tracing::info!("Triggered AI analysis for solution {}", solution_id);
        }
    });

    // Vector search용 임베딩 생성 (비동기, 실패 시 로그만)
    let db = state.db.clone();
    let embedding_client = state.embedding_client.clone();
    tokio::spawn(async move {
        upsert_solution_embedding(db, embedding_client, solution_id).await;
    });

    Ok((
        StatusCode::CREATED,
        Json(serde_json::json!({ "id": solution_id })),
    ))
}

/// Extract site name from URL (simple implementation)
fn extract_site_name_from_url(url: &str) -> String {
    if let Ok(parsed) = url::Url::parse(url) {
        if let Some(host) = parsed.host_str() {
            // Remove www. prefix and get first part
            let host = host.replace("www.", "");
            if let Some(first_part) = host.split('.').next() {
                return first_part.to_string();
            }
        }
    }
    String::new()
}

/// GET /api/v1/spots/{spot_id}/solutions - Solution 목록 조회
#[utoipa::path(
    get,
    path = "/api/v1/spots/{spot_id}/solutions",
    tag = "solutions",
    params(
        ("spot_id" = Uuid, Path, description = "Spot ID")
    ),
    responses(
        (status = 200, description = "Solution 목록 조회 성공", body = Vec<SolutionListItem>),
        (status = 404, description = "Spot을 찾을 수 없음")
    )
)]
pub async fn list_solutions(
    State(state): State<AppState>,
    Path(spot_id): Path<Uuid>,
) -> AppResult<Json<Vec<SolutionListItem>>> {
    let solutions = service::list_solutions_by_spot_id(&state.db, spot_id).await?;
    Ok(Json(solutions))
}

/// GET /api/v1/solutions/{solution_id} - Solution 상세 조회
#[utoipa::path(
    get,
    path = "/api/v1/solutions/{solution_id}",
    tag = "solutions",
    params(
        ("solution_id" = Uuid, Path, description = "Solution ID")
    ),
    responses(
        (status = 200, description = "Solution 상세 조회 성공", body = SolutionResponse),
        (status = 404, description = "Solution을 찾을 수 없음")
    )
)]
pub async fn get_solution(
    State(state): State<AppState>,
    Path(solution_id): Path<Uuid>,
) -> AppResult<Json<SolutionResponse>> {
    let solution = service::get_solution_by_id(&state.db, solution_id).await?;
    Ok(Json(solution))
}

/// PATCH /api/v1/solutions/{solution_id} - Solution 수정
#[utoipa::path(
    patch,
    path = "/api/v1/solutions/{solution_id}",
    tag = "solutions",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("solution_id" = Uuid, Path, description = "Solution ID")
    ),
    request_body = UpdateSolutionDto,
    responses(
        (status = 200, description = "Solution 수정 성공"),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "권한 없음 (본인만 수정 가능)"),
        (status = 404, description = "Solution을 찾을 수 없음")
    )
)]
pub async fn update_solution(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Path(solution_id): Path<Uuid>,
    Json(dto): Json<UpdateSolutionDto>,
) -> AppResult<StatusCode> {
    service::update_solution(&state.db, solution_id, user.id, dto).await?;
    Ok(StatusCode::OK)
}

/// DELETE /api/v1/solutions/{solution_id} - Solution 삭제
#[utoipa::path(
    delete,
    path = "/api/v1/solutions/{solution_id}",
    tag = "solutions",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("solution_id" = Uuid, Path, description = "Solution ID")
    ),
    responses(
        (status = 204, description = "Solution 삭제 성공"),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "권한 없음 (본인만 삭제 가능)"),
        (status = 404, description = "Solution을 찾을 수 없음")
    )
)]
pub async fn delete_solution(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Path(solution_id): Path<Uuid>,
) -> AppResult<axum::http::StatusCode> {
    service::delete_solution(&state.db, solution_id, user.id).await?;
    Ok(axum::http::StatusCode::NO_CONTENT)
}

/// POST /api/v1/solutions/extract-metadata - 링크 메타데이터 추출
#[utoipa::path(
    post,
    path = "/api/v1/solutions/extract-metadata",
    tag = "solutions",
    request_body = ExtractMetadataDto,
    responses(
        (status = 200, description = "메타데이터 추출 성공", body = MetadataResponse),
        (status = 400, description = "잘못된 요청")
    )
)]
pub async fn extract_metadata(
    State(state): State<AppState>,
    Json(dto): Json<ExtractMetadataDto>,
) -> AppResult<Json<MetadataResponse>> {
    let url = dto.url.clone();
    match crate::services::metadata::service::extract_og_and_metadata(&state.decoded_ai_client, url)
        .await
    {
        Ok(response) => Ok(Json(response)),
        Err(e) => Err(AppError::InternalError(format!(
            "Metadata extraction failed: {}",
            e
        ))),
    }
}

/// POST /api/v1/solutions/convert-affiliate - 제휴 링크 변환
#[utoipa::path(
    post,
    path = "/api/v1/solutions/convert-affiliate",
    tag = "solutions",
    request_body = ConvertAffiliateDto,
    responses(
        (status = 200, description = "제휴 링크 변환 성공", body = AffiliateLinkResponse),
        (status = 400, description = "잘못된 요청")
    )
)]
pub async fn convert_affiliate(
    State(_state): State<AppState>,
    Json(dto): Json<ConvertAffiliateDto>,
) -> AppResult<Json<AffiliateLinkResponse>> {
    // TODO: 제휴 링크 변환 로직 구현 (AffiliateClient 사용)
    // 현재는 임시 응답 반환
    let url = dto.url.clone();
    Ok(Json(AffiliateLinkResponse {
        original_url: dto.url,
        affiliate_url: format!("https://affiliate.example.com/{}", url),
    }))
}

/// 라우터 생성
/// POST /api/v1/test/extract-metadata - 테스트용 메타데이터 추출 (인증 불필요)
#[utoipa::path(
    post,
    path = "/api/v1/test/extract-metadata",
    tag = "test",
    request_body = ExtractMetadataDto,
    responses(
        (status = 200, description = "메타데이터 추출 성공", body = MetadataResponse),
        (status = 400, description = "잘못된 요청")
    )
)]
pub async fn test_extract_metadata(
    State(state): State<AppState>,
    Json(dto): Json<ExtractMetadataDto>,
) -> AppResult<Json<MetadataResponse>> {
    extract_metadata(State(state), Json(dto)).await
}

/// POST /api/v1/test/analyze-link - 테스트용 AI 링크 분석 (기존 Solution ID 사용)
#[utoipa::path(
    post,
    path = "/api/v1/test/analyze-link",
    tag = "test",
    request_body = TestAnalyzeLinkDto,
    responses(
        (status = 200, description = "AI 분석 요청 성공"),
        (status = 400, description = "잘못된 요청"),
        (status = 404, description = "Solution을 찾을 수 없음")
    )
)]
pub async fn test_analyze_link(
    State(state): State<AppState>,
    Json(dto): Json<TestAnalyzeLinkDto>,
) -> AppResult<Json<serde_json::Value>> {
    // 1. Get Solution from DB
    let solution = service::get_solution_by_id(&state.db, dto.solution_id).await?;

    // Check if URL exists
    let url = match solution.original_url.clone() {
        Some(u) if !u.is_empty() => u,
        _ => return Err(AppError::BadRequest("Solution has no URL".to_string())),
    };

    let title = solution.title.clone();
    let description = solution.description.clone().unwrap_or_default();
    let site_name = extract_site_name_from_url(&url);

    // 2. Trigger AI Analysis with ACTUAL solution_id
    let ai_client = state.decoded_ai_client.clone();

    match ai_client
        .analyze_link(
            url.clone(),
            dto.solution_id.to_string(),
            title,
            description,
            site_name,
        )
        .await
    {
        Ok(response) => Ok(Json(serde_json::json!({
            "success": response.success,
            "message": response.message,
            "batch_id": response.batch_id,
            "solution_id": dto.solution_id.to_string(),
            "url": url,
            "note": "Check DB updates asynchronously."
        }))),
        Err(e) => Err(AppError::InternalError(format!(
            "Failed to trigger AI analysis: {}",
            e
        ))),
    }
}

use crate::entities::solutions;
use sea_orm::{EntityTrait, Set};

/// POST /api/v1/test/full-integration - 전체 통합 테스트 (Metadata -> Create -> AI Direct -> Update)
#[utoipa::path(
    post,
    path = "/api/v1/test/full-integration",
    tag = "test",
    request_body = FullIntegrationTestDto,
    responses(
        (status = 200, description = "통합 테스트 성공"),
        (status = 400, description = "잘못된 요청")
    )
)]
pub async fn test_full_integration_flow(
    State(state): State<AppState>,
    Json(dto): Json<FullIntegrationTestDto>,
) -> AppResult<Json<serde_json::Value>> {
    let url = dto.url;

    // 1. Extract Metadata (OG)
    let og_data = match crate::services::metadata::service::extract_og_and_metadata(
        &state.decoded_ai_client,
        url.clone(),
    )
    .await
    {
        Ok(res) => res,
        Err(e) => {
            return Err(AppError::InternalError(format!(
                "OG Extraction failed: {}",
                e
            )))
        }
    };

    // 2. Create Solution (Dummy Spot/User for test)
    // For simplicity, we'll try to find an existing spot and user, or fail if none exists.
    // In a real test environment, we should probably create dummy ones or use hardcoded IDs if safe.
    // Let's assume there's at least one user and spot in the DB for this test to run.

    use sea_orm::QuerySelect;
    let user = crate::entities::users::Entity::find()
        .limit(1)
        .one(&state.db)
        .await
        .map_err(|e| AppError::InternalError(format!("DB Error finding user: {}", e)))?
        .ok_or_else(|| AppError::BadRequest("No users found in DB to run test".to_string()))?;

    let spot = crate::entities::spots::Entity::find()
        .limit(1)
        .one(&state.db)
        .await
        .map_err(|e| AppError::InternalError(format!("DB Error finding spot: {}", e)))?
        .ok_or_else(|| AppError::BadRequest("No spots found in DB to run test".to_string()))?;

    let create_dto = CreateSolutionDto {
        original_url: url.clone(),
        title: Some(og_data.title.clone()),
        description: og_data.description.clone(),
        metadata: None,
        affiliate_url: None,
        thumbnail_url: og_data.image.clone(),
        comment: None,
        brand_id: None,
    };

    let solution_id = service::create_solution(&state.db, spot.id, user.id, create_dto).await?;

    // 3. AI Analyze Direct
    let ai_client = state.decoded_ai_client.clone();
    let site_name = og_data.site_name.clone().unwrap_or_default();

    let ai_response = match ai_client
        .analyze_link_direct(
            url.clone(),
            solution_id.to_string(),
            og_data.title.clone(),
            og_data.description.clone().unwrap_or_default(),
            site_name,
        )
        .await
    {
        Ok(res) => res,
        Err(e) => {
            return Err(AppError::InternalError(format!(
                "AI Direct Analysis failed: {}",
                e
            )))
        }
    };

    if !ai_response.success {
        return Err(AppError::InternalError(format!(
            "AI Analysis returned failure: {}",
            ai_response.error_message
        )));
    }

    // 4. Update Solution with AI Result
    let mut solution: solutions::ActiveModel = solutions::Entity::find_by_id(solution_id)
        .one(&state.db)
        .await
        .map_err(|e| AppError::InternalError(e.to_string()))?
        .ok_or_else(|| AppError::InternalError("Created solution not found".to_string()))?
        .into();

    // Update fields
    if !ai_response.summary.is_empty() {
        solution.description = Set(Some(ai_response.summary.clone()));
    }

    // Update Keywords
    let keywords: Vec<String> = ai_response.keywords.to_vec();
    if !keywords.is_empty() {
        solution.keywords = Set(Some(serde_json::json!(keywords)));
    }

    // Update QnA
    let qna_json = serde_json::json!(ai_response
        .qna
        .iter()
        .map(|qa| {
            serde_json::json!({
                "question": qa.question,
                "answer": qa.answer
            })
        })
        .collect::<Vec<_>>());
    solution.qna = Set(Some(qna_json));

    // Update link_type and metadata based on oneof
    let mut metadata = serde_json::json!({});
    let link_type: String;

    use crate::grpc::inbound::analyze_link_direct_response::Metadata;
    match ai_response.metadata {
        Some(Metadata::ProductMetadata(product)) => {
            link_type = "product".to_string();
            solution.link_type = Set(Some(link_type.clone()));
            if !product.category.is_empty() {
                metadata["category"] = serde_json::json!(product.category);
            }
            if !product.sub_category.is_empty() {
                metadata["sub_category"] = serde_json::json!(product.sub_category);
            }
            if !product.brand.is_empty() {
                metadata["brand"] = serde_json::json!(product.brand);
            }
            if !product.price.is_empty() {
                metadata["price"] = serde_json::json!(product.price);
            }
            if !product.currency.is_empty() {
                metadata["currency"] = serde_json::json!(product.currency);
            }
            if !product.materials.is_empty() {
                metadata["materials"] = serde_json::json!(product.materials);
            }
            if !product.origin.is_empty() {
                metadata["origin"] = serde_json::json!(product.origin);
            }
        }
        Some(Metadata::ArticleMetadata(article)) => {
            link_type = "article".to_string();
            solution.link_type = Set(Some(link_type.clone()));
            if !article.category.is_empty() {
                metadata["category"] = serde_json::json!(article.category);
            }
            if !article.sub_category.is_empty() {
                metadata["sub_category"] = serde_json::json!(article.sub_category);
            }
            if !article.author.is_empty() {
                metadata["author"] = serde_json::json!(article.author);
            }
            if !article.published_date.is_empty() {
                metadata["published_date"] = serde_json::json!(article.published_date);
            }
            if !article.reading_time.is_empty() {
                metadata["reading_time"] = serde_json::json!(article.reading_time);
            }
            if !article.topics.is_empty() {
                metadata["topics"] = serde_json::json!(article.topics);
            }
        }
        Some(Metadata::VideoMetadata(video)) => {
            link_type = "video".to_string();
            solution.link_type = Set(Some(link_type.clone()));
            if !video.category.is_empty() {
                metadata["category"] = serde_json::json!(video.category);
            }
            if !video.sub_category.is_empty() {
                metadata["sub_category"] = serde_json::json!(video.sub_category);
            }
            if !video.channel.is_empty() {
                metadata["channel"] = serde_json::json!(video.channel);
            }
            if !video.duration.is_empty() {
                metadata["duration"] = serde_json::json!(video.duration);
            }
            if !video.view_count.is_empty() {
                metadata["view_count"] = serde_json::json!(video.view_count);
            }
            if !video.upload_date.is_empty() {
                metadata["upload_date"] = serde_json::json!(video.upload_date);
            }
        }
        Some(Metadata::OtherMetadata(other)) => {
            link_type = "other".to_string();
            solution.link_type = Set(Some(link_type.clone()));
            if !other.category.is_empty() {
                metadata["category"] = serde_json::json!(other.category);
            }
            if !other.sub_category.is_empty() {
                metadata["sub_category"] = serde_json::json!(other.sub_category);
            }
            if !other.content_type.is_empty() {
                metadata["content_type"] = serde_json::json!(other.content_type);
            }
        }
        None => {
            // No metadata provided, set link_type to other
            link_type = "other".to_string();
            solution.link_type = Set(Some(link_type.clone()));
        }
    }

    if !metadata.as_object().unwrap().is_empty() {
        solution.metadata = Set(Some(metadata));
    }

    use sea_orm::ActiveModelTrait;
    solution
        .update(&state.db)
        .await
        .map_err(|e| AppError::InternalError(e.to_string()))?;

    Ok(Json(serde_json::json!({
        "success": true,
        "solution_id": solution_id,
        "url": url,
        "ai_result": {
            "link_type": link_type,
            "summary": ai_response.summary,
            "keywords": ai_response.keywords,
            "qna_count": ai_response.qna.len()
        }
    })))
}

pub fn router(app_config: AppConfig) -> Router<AppState> {
    let protected_routes = Router::new()
        .route("/spots/{spot_id}/solutions", post(create_solution))
        .route(
            "/solutions/{solution_id}",
            patch(update_solution).delete(delete_solution),
        )
        .route_layer(from_fn_with_state(app_config, auth_middleware));

    Router::new()
        .route("/spots/{spot_id}/solutions", get(list_solutions))
        .route("/solutions/{solution_id}", get(get_solution))
        .route("/solutions/extract-metadata", post(extract_metadata))
        .route("/solutions/convert-affiliate", post(convert_affiliate))
        .route("/test/extract-metadata", post(test_extract_metadata))
        .route("/test/analyze-link", post(test_analyze_link))
        .route("/test/full-integration", post(test_full_integration_flow))
        .merge(protected_routes)
}
