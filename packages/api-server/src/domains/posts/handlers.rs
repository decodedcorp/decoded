//! Posts API handlers
//!
//! 게시물 관련 HTTP 엔드포인트

use axum::{
    extract::{Path, Query, State},
    middleware::from_fn_with_state,
    routing::{get, patch, post},
    Extension, Json, Router,
};
use axum_extra::extract::Multipart;
use uuid::Uuid;

use crate::{
    config::{AppConfig, AppState},
    error::AppResult,
    middleware::{ai_rate_limit_layer, auth::User, auth_middleware, optional_auth_middleware},
    utils::pagination::PaginatedResponse,
};

use super::{
    dto::{
        CreatePostDto, CreatePostWithSolutionsResponse, CreateTryPostDto, ImageAnalyzeResponse,
        ImageUploadResponse, PostDetailResponse, PostListQuery, PostResponse, TryCountResponse,
        TryListQuery, TryListResponse, UpdatePostDto,
    },
    service,
};

/// POST /api/v1/posts - Post 생성 (Solution 없이)
#[utoipa::path(
    post,
    path = "/api/v1/posts",
    tag = "posts",
    security(
        ("bearer_auth" = [])
    ),
    request_body(content = String, content_type = "multipart/form-data"),
    responses(
        (status = 201, description = "Post 생성 성공", body = PostResponse),
        (status = 401, description = "인증 필요"),
        (status = 400, description = "잘못된 요청")
    )
)]
pub async fn create_post_without_solutions(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    mut multipart: Multipart,
) -> AppResult<Json<PostResponse>> {
    let mut image_file: Option<Vec<u8>> = None;
    let mut image_content_type: Option<String> = None;
    let mut post_data_str: Option<String> = None;

    // Multipart 필드 파싱
    while let Some(field) = multipart.next_field().await.map_err(|e| {
        crate::error::AppError::BadRequest(format!("Failed to parse multipart: {}", e))
    })? {
        let name = field.name().unwrap_or("");

        if name == "image" {
            let content_type = field.content_type().unwrap_or("image/jpeg").to_string();
            let data = field.bytes().await.map_err(|e| {
                crate::error::AppError::BadRequest(format!("Failed to read image data: {}", e))
            })?;
            image_file = Some(data.to_vec());
            image_content_type = Some(content_type);
        } else if name == "data" {
            let data = field.text().await.map_err(|e| {
                crate::error::AppError::BadRequest(format!("Failed to read data field: {}", e))
            })?;
            post_data_str = Some(data);
        }
    }

    let image_file = image_file.ok_or_else(|| {
        crate::error::AppError::BadRequest("No image file found in multipart form".to_string())
    })?;

    let image_content_type = image_content_type.unwrap_or_else(|| "image/jpeg".to_string());

    let post_data_str = post_data_str.ok_or_else(|| {
        crate::error::AppError::BadRequest("No data field found in multipart form".to_string())
    })?;

    // JSON 파싱
    let dto: CreatePostDto = serde_json::from_str(&post_data_str).map_err(|e| {
        crate::error::AppError::BadRequest(format!("Failed to parse JSON data: {}", e))
    })?;

    // 최소 1개 이상의 Spot 필요
    if dto.spots.is_empty() {
        return Err(crate::error::AppError::BadRequest(
            "At least one spot is required".to_string(),
        ));
    }

    // DTO 검증: 모든 Spot의 solutions가 비어있는지 확인
    if dto.spots.iter().any(|spot| !spot.solutions.is_empty()) {
        return Err(crate::error::AppError::BadRequest(
            "Use /api/v1/posts/with-solutions endpoint for posts with solutions".to_string(),
        ));
    }

    // 이미지 업로드 및 Post 생성
    let post = service::create_post_without_solutions(
        &state,
        user.id,
        image_file,
        &image_content_type,
        dto,
    )
    .await?;
    Ok(Json(post))
}

/// POST /api/v1/posts/with-solutions - Post 생성 (Solution과 함께)
#[utoipa::path(
    post,
    path = "/api/v1/posts/with-solutions",
    tag = "posts",
    security(
        ("bearer_auth" = [])
    ),
    request_body(content = String, content_type = "multipart/form-data"),
    responses(
        (status = 201, description = "Post 생성 성공", body = CreatePostWithSolutionsResponse),
        (status = 401, description = "인증 필요"),
        (status = 400, description = "잘못된 요청")
    )
)]
pub async fn create_post_with_solutions(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    mut multipart: Multipart,
) -> AppResult<Json<CreatePostWithSolutionsResponse>> {
    let mut image_file: Option<Vec<u8>> = None;
    let mut image_content_type: Option<String> = None;
    let mut post_data_str: Option<String> = None;

    // Multipart 필드 파싱
    while let Some(field) = multipart.next_field().await.map_err(|e| {
        crate::error::AppError::BadRequest(format!("Failed to parse multipart: {}", e))
    })? {
        let name = field.name().unwrap_or("");

        if name == "image" {
            let content_type = field.content_type().unwrap_or("image/jpeg").to_string();
            let data = field.bytes().await.map_err(|e| {
                crate::error::AppError::BadRequest(format!("Failed to read image data: {}", e))
            })?;
            image_file = Some(data.to_vec());
            image_content_type = Some(content_type);
        } else if name == "data" {
            let data = field.text().await.map_err(|e| {
                crate::error::AppError::BadRequest(format!("Failed to read data field: {}", e))
            })?;
            post_data_str = Some(data);
        }
    }

    let image_file = image_file.ok_or_else(|| {
        crate::error::AppError::BadRequest("No image file found in multipart form".to_string())
    })?;

    let image_content_type = image_content_type.unwrap_or_else(|| "image/jpeg".to_string());

    let post_data_str = post_data_str.ok_or_else(|| {
        crate::error::AppError::BadRequest("No data field found in multipart form".to_string())
    })?;

    // JSON 파싱
    let dto: CreatePostDto = serde_json::from_str(&post_data_str).map_err(|e| {
        crate::error::AppError::BadRequest(format!("Failed to parse JSON data: {}", e))
    })?;

    // 최소 1개 이상의 Spot 필요
    if dto.spots.is_empty() {
        return Err(crate::error::AppError::BadRequest(
            "At least one spot is required".to_string(),
        ));
    }

    // DTO 검증: 하나 이상의 Spot에 solutions가 있는지 확인
    if !dto.spots.iter().any(|spot| !spot.solutions.is_empty()) {
        return Err(crate::error::AppError::BadRequest(
            "Use /api/v1/posts endpoint for posts without solutions".to_string(),
        ));
    }

    // 이미지 업로드 및 Post 생성
    let result =
        service::create_post_with_solutions(&state, user.id, image_file, &image_content_type, dto)
            .await?;
    Ok(Json(result))
}

/// GET /api/v1/posts - Post 목록 조회
#[utoipa::path(
    get,
    path = "/api/v1/posts",
    tag = "posts",
    params(
        ("artist_name" = Option<String>, Query, description = "아티스트명 필터"),
        ("group_name" = Option<String>, Query, description = "그룹명 필터"),
        ("context" = Option<String>, Query, description = "상황 필터"),
        ("category" = Option<String>, Query, description = "카테고리 필터 (Phase 7)"),
        ("user_id" = Option<Uuid>, Query, description = "사용자 ID 필터"),
        ("artist_id" = Option<Uuid>, Query, description = "아티스트 ID 필터 (warehouse FK)"),
        ("group_id" = Option<Uuid>, Query, description = "그룹 ID 필터 (warehouse FK)"),
        ("sort" = Option<String>, Query, description = "정렬: recent | popular | trending"),
        ("page" = Option<u64>, Query, description = "페이지 번호"),
        ("per_page" = Option<u64>, Query, description = "페이지당 개수"),
        ("has_magazine" = Option<bool>, Query, description = "매거진(editorial) 보유 여부. true = post_magazine_id가 있는 post만"),
    ),
    responses(
        (status = 200, description = "Post 목록 조회 성공", body = PaginatedResponse<crate::domains::posts::dto::PostListItem>),
        (status = 400, description = "잘못된 요청")
    )
)]
pub async fn list_posts(
    State(state): State<AppState>,
    Query(query): Query<PostListQuery>,
) -> AppResult<Json<PaginatedResponse<crate::domains::posts::dto::PostListItem>>> {
    let posts = service::list_posts(state.db.as_ref(), query).await?;
    Ok(Json(posts))
}

/// GET /api/v1/posts/{post_id} - Post 상세 조회
#[utoipa::path(
    get,
    path = "/api/v1/posts/{post_id}",
    tag = "posts",
    params(
        ("post_id" = Uuid, Path, description = "Post ID")
    ),
    responses(
        (status = 200, description = "Post 상세 조회 성공", body = PostDetailResponse),
        (status = 404, description = "Post를 찾을 수 없음")
    )
)]
pub async fn get_post(
    State(state): State<AppState>,
    Path(post_id): Path<Uuid>,
    user: Option<Extension<User>>,
) -> AppResult<Json<PostDetailResponse>> {
    let user_id = user.as_ref().map(|Extension(u)| u.id);

    // 조회수 증가 + view_log를 백그라운드 태스크로 분리하여 응답 지연 제거
    let db_bg = state.db.clone();
    tokio::spawn(async move {
        let _ = service::increment_view_count(db_bg.as_ref(), post_id).await;
        if let Some(uid) = user_id {
            let _ = crate::domains::views::service::create_view_log(
                db_bg.as_ref(),
                uid,
                "post",
                post_id,
            )
            .await;
        }
    });

    let post_detail = service::get_post_detail(state.db.as_ref(), post_id, user_id).await?;
    Ok(Json(post_detail))
}

/// PATCH /api/v1/posts/{post_id} - Post 수정
#[utoipa::path(
    patch,
    path = "/api/v1/posts/{post_id}",
    tag = "posts",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("post_id" = Uuid, Path, description = "Post ID")
    ),
    request_body = UpdatePostDto,
    responses(
        (status = 200, description = "Post 수정 성공", body = PostResponse),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "권한 없음"),
        (status = 404, description = "Post를 찾을 수 없음")
    )
)]
pub async fn update_post(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Path(post_id): Path<Uuid>,
    Json(dto): Json<UpdatePostDto>,
) -> AppResult<Json<PostResponse>> {
    let updated_post = service::update_post(&state, post_id, user.id, dto).await?;
    Ok(Json(updated_post))
}

/// DELETE /api/v1/posts/{post_id} - Post 삭제
#[utoipa::path(
    delete,
    path = "/api/v1/posts/{post_id}",
    tag = "posts",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("post_id" = Uuid, Path, description = "Post ID")
    ),
    responses(
        (status = 204, description = "Post 삭제 성공"),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "권한 없음"),
        (status = 404, description = "Post를 찾을 수 없음")
    )
)]
pub async fn delete_post(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Path(post_id): Path<Uuid>,
) -> AppResult<axum::http::StatusCode> {
    service::delete_post(&state.search_client, state.db.as_ref(), post_id, user.id).await?;
    Ok(axum::http::StatusCode::NO_CONTENT)
}

/// POST /api/v1/posts/upload - 이미지 업로드
#[utoipa::path(
    post,
    path = "/api/v1/posts/upload",
    tag = "posts",
    security(
        ("bearer_auth" = [])
    ),
    request_body(content = String, content_type = "multipart/form-data", description = "이미지 파일 (multipart/form-data)"),
    responses(
        (status = 200, description = "이미지 업로드 성공", body = ImageUploadResponse),
        (status = 401, description = "인증 필요"),
        (status = 400, description = "잘못된 요청")
    )
)]
pub async fn upload_image(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    mut multipart: Multipart,
) -> AppResult<Json<ImageUploadResponse>> {
    let mut image_data: Option<Vec<u8>> = None;
    let mut content_type: Option<String> = None;

    // Multipart 필드 파싱
    while let Some(field) = multipart.next_field().await.map_err(|e| {
        crate::error::AppError::BadRequest(format!("Failed to parse multipart: {}", e))
    })? {
        let name = field.name().unwrap_or("");

        if name == "image" || name == "file" {
            let field_content_type = field
                .content_type()
                .unwrap_or("application/octet-stream")
                .to_string();

            // 이미지 타입 검증
            if !field_content_type.starts_with("image/") {
                return Err(crate::error::AppError::BadRequest(format!(
                    "Invalid content type: {}. Expected image/*",
                    field_content_type
                )));
            }

            let data = field.bytes().await.map_err(|e| {
                crate::error::AppError::BadRequest(format!("Failed to read field data: {}", e))
            })?;

            image_data = Some(data.to_vec());
            content_type = Some(field_content_type);
            break;
        }
    }

    let image_data = image_data.ok_or_else(|| {
        crate::error::AppError::BadRequest("No image file found in multipart form".to_string())
    })?;

    let content_type = content_type
        .ok_or_else(|| crate::error::AppError::BadRequest("Content type not found".to_string()))?;

    // Service 호출
    let response = service::upload_image(&state, image_data, &content_type, user.id).await?;
    Ok(Json(response))
}

/// POST /api/v1/posts/analyze - AI 이미지 분석
#[utoipa::path(
    post,
    path = "/api/v1/posts/analyze",
    tag = "posts",
    request_body(content = String, content_type = "multipart/form-data"),
    responses(
        (status = 200, description = "AI 분석 성공", body = ImageAnalyzeResponse),
        (status = 400, description = "잘못된 요청")
    )
)]
pub async fn analyze_image(
    State(state): State<AppState>,
    multipart: Multipart,
) -> AppResult<Json<ImageAnalyzeResponse>> {
    let response = service::analyze_image(&state, multipart).await?;
    Ok(Json(response))
}

/// POST /api/v1/posts/try - Try Post 생성
#[utoipa::path(
    post,
    path = "/api/v1/posts/try",
    tag = "posts",
    security(
        ("bearer_auth" = [])
    ),
    request_body(content = String, content_type = "multipart/form-data"),
    responses(
        (status = 201, description = "Try Post 생성 성공", body = PostResponse),
        (status = 401, description = "인증 필요"),
        (status = 400, description = "잘못된 요청")
    )
)]
pub async fn create_try_post(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    mut multipart: Multipart,
) -> AppResult<Json<PostResponse>> {
    let mut image_file: Option<Vec<u8>> = None;
    let mut image_content_type: Option<String> = None;
    let mut post_data_str: Option<String> = None;

    while let Some(field) = multipart.next_field().await.map_err(|e| {
        crate::error::AppError::BadRequest(format!("Failed to parse multipart: {}", e))
    })? {
        let name = field.name().unwrap_or("");

        if name == "image" {
            let content_type = field.content_type().unwrap_or("image/jpeg").to_string();
            let data = field.bytes().await.map_err(|e| {
                crate::error::AppError::BadRequest(format!("Failed to read image data: {}", e))
            })?;
            image_file = Some(data.to_vec());
            image_content_type = Some(content_type);
        } else if name == "data" {
            let data = field.text().await.map_err(|e| {
                crate::error::AppError::BadRequest(format!("Failed to read data field: {}", e))
            })?;
            post_data_str = Some(data);
        }
    }

    let image_file = image_file.ok_or_else(|| {
        crate::error::AppError::BadRequest("No image file found in multipart form".to_string())
    })?;

    let image_content_type = image_content_type.unwrap_or_else(|| "image/jpeg".to_string());

    let post_data_str = post_data_str.ok_or_else(|| {
        crate::error::AppError::BadRequest("No data field found in multipart form".to_string())
    })?;

    let dto: CreateTryPostDto = serde_json::from_str(&post_data_str).map_err(|e| {
        crate::error::AppError::BadRequest(format!("Failed to parse JSON data: {}", e))
    })?;

    let post =
        service::create_try_post(&state, user.id, image_file, &image_content_type, dto).await?;
    Ok(Json(post))
}

/// GET /api/v1/posts/{post_id}/tries - Try 목록 조회
#[utoipa::path(
    get,
    path = "/api/v1/posts/{post_id}/tries",
    tag = "posts",
    params(
        ("post_id" = Uuid, Path, description = "원본 Post ID"),
        ("page" = Option<u64>, Query, description = "페이지 번호"),
        ("per_page" = Option<u64>, Query, description = "페이지당 개수"),
    ),
    responses(
        (status = 200, description = "Try 목록 조회 성공", body = TryListResponse),
        (status = 404, description = "Post를 찾을 수 없음")
    )
)]
pub async fn list_tries(
    State(state): State<AppState>,
    Path(post_id): Path<Uuid>,
    Query(query): Query<TryListQuery>,
) -> AppResult<Json<TryListResponse>> {
    let response = service::list_tries(state.db.as_ref(), post_id, query).await?;
    Ok(Json(response))
}

/// GET /api/v1/posts/{post_id}/tries/count - Try 개수 조회
#[utoipa::path(
    get,
    path = "/api/v1/posts/{post_id}/tries/count",
    tag = "posts",
    params(
        ("post_id" = Uuid, Path, description = "원본 Post ID"),
    ),
    responses(
        (status = 200, description = "Try 개수 조회 성공", body = TryCountResponse),
    )
)]
pub async fn count_tries(
    State(state): State<AppState>,
    Path(post_id): Path<Uuid>,
) -> AppResult<Json<TryCountResponse>> {
    let response = service::count_tries(state.db.as_ref(), post_id).await?;
    Ok(Json(response))
}

/// GET /api/v1/spots/{spot_id}/tries - 스팟별 Try 목록 조회
#[utoipa::path(
    get,
    path = "/api/v1/spots/{spot_id}/tries",
    tag = "spots",
    params(
        ("spot_id" = Uuid, Path, description = "Spot ID"),
        ("page" = Option<u64>, Query, description = "페이지 번호"),
        ("per_page" = Option<u64>, Query, description = "페이지당 개수"),
    ),
    responses(
        (status = 200, description = "스팟별 Try 목록 조회 성공", body = TryListResponse),
    )
)]
pub async fn list_tries_by_spot(
    State(state): State<AppState>,
    Path(spot_id): Path<Uuid>,
    Query(query): Query<TryListQuery>,
) -> AppResult<Json<TryListResponse>> {
    let response = service::list_tries_by_spot(state.db.as_ref(), spot_id, query).await?;
    Ok(Json(response))
}

/// Posts 도메인 라우터
pub fn router(app_config: AppConfig) -> Router<AppState> {
    let protected_routes = Router::new()
        .route("/", post(create_post_without_solutions))
        .route("/with-solutions", post(create_post_with_solutions))
        .route("/try", post(create_try_post))
        .route("/upload", post(upload_image))
        .route("/{post_id}", patch(update_post).delete(delete_post))
        .route_layer(from_fn_with_state(app_config.clone(), auth_middleware));

    // optional auth가 필요한 라우트 (조회 로그 기록용)
    let optional_auth_routes = Router::new()
        .route("/{post_id}", get(get_post))
        .route_layer(from_fn_with_state(
            app_config.clone(),
            optional_auth_middleware,
        ));

    // Spots 라우터 통합
    let spots_router = crate::domains::spots::router(app_config);

    // /analyze 라우트에만 rate limit 적용
    let rate_limited_routes = Router::new()
        .route("/analyze", post(analyze_image))
        .layer(ai_rate_limit_layer());

    Router::new()
        .route("/", get(list_posts))
        .route("/{post_id}/tries", get(list_tries))
        .route("/{post_id}/tries/count", get(count_tries))
        .merge(rate_limited_routes)
        .nest("/{post_id}/spots", spots_router)
        .merge(optional_auth_routes)
        .merge(protected_routes)
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    // Note: API 핸들러 테스트는 통합 테스트에서 수행
}
