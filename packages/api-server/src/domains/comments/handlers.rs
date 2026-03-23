use crate::config::AppState;
use crate::error::AppResult;
use crate::middleware::auth::User;
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::post,
    Extension, Json, Router,
};
use sea_orm::EntityTrait;
use uuid::Uuid;
use validator::Validate;

use super::dto::{CommentResponse, CreateCommentDto, UpdateCommentDto};
use super::service;

/// 댓글 작성
#[utoipa::path(
    post,
    path = "/api/v1/posts/{post_id}/comments",
    tag = "comments",
    params(
        ("post_id" = Uuid, Path, description = "Post ID")
    ),
    request_body = CreateCommentDto,
    responses(
        (status = 201, description = "댓글 작성 성공", body = CommentResponse),
        (status = 400, description = "잘못된 요청"),
        (status = 401, description = "인증 필요"),
        (status = 404, description = "Post를 찾을 수 없음")
    ),
    security(
        ("bearer" = [])
    )
)]
pub async fn create_comment(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Path(post_id): Path<Uuid>,
    Json(dto): Json<CreateCommentDto>,
) -> AppResult<impl IntoResponse> {
    dto.validate()?;

    let comment =
        service::create_comment(&state.db, post_id, user.id, dto.content, dto.parent_id).await?;

    // 사용자 정보 포함한 응답 생성
    let user_info = crate::entities::users::Entity::find_by_id(user.id)
        .one(&state.db)
        .await?
        .ok_or_else(|| crate::error::AppError::not_found("사용자를 찾을 수 없습니다"))?;

    let response = CommentResponse {
        id: comment.id,
        post_id: comment.post_id,
        user_id: comment.user_id,
        parent_id: comment.parent_id,
        content: comment.content,
        user: super::dto::CommentUser {
            id: user_info.id,
            username: user_info.username,
            display_name: user_info.display_name,
            avatar_url: user_info.avatar_url,
            rank: user_info.rank,
        },
        created_at: comment.created_at.with_timezone(&chrono::Utc),
        updated_at: comment.updated_at.with_timezone(&chrono::Utc),
        replies: vec![],
    };

    Ok((StatusCode::CREATED, Json(response)))
}

/// 댓글 목록 조회 (대댓글 포함)
#[utoipa::path(
    get,
    path = "/api/v1/posts/{post_id}/comments",
    tag = "comments",
    params(
        ("post_id" = Uuid, Path, description = "Post ID")
    ),
    responses(
        (status = 200, description = "댓글 목록 조회 성공", body = Vec<CommentResponse>),
        (status = 404, description = "Post를 찾을 수 없음")
    )
)]
pub async fn list_comments(
    State(state): State<AppState>,
    Path(post_id): Path<Uuid>,
) -> AppResult<impl IntoResponse> {
    let comments = service::list_comments(&state.db, post_id).await?;

    Ok(Json(comments))
}

/// 댓글 수정
#[utoipa::path(
    patch,
    path = "/api/v1/comments/{comment_id}",
    tag = "comments",
    params(
        ("comment_id" = Uuid, Path, description = "Comment ID")
    ),
    request_body = UpdateCommentDto,
    responses(
        (status = 200, description = "댓글 수정 성공", body = CommentResponse),
        (status = 400, description = "잘못된 요청"),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "본인의 댓글만 수정 가능"),
        (status = 404, description = "댓글을 찾을 수 없음")
    ),
    security(
        ("bearer" = [])
    )
)]
pub async fn update_comment(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Path(comment_id): Path<Uuid>,
    Json(dto): Json<UpdateCommentDto>,
) -> AppResult<impl IntoResponse> {
    dto.validate()?;

    let comment = service::update_comment(&state.db, comment_id, user.id, dto.content).await?;

    // 사용자 정보 포함한 응답 생성
    let user_info = crate::entities::users::Entity::find_by_id(user.id)
        .one(&state.db)
        .await?
        .ok_or_else(|| crate::error::AppError::not_found("사용자를 찾을 수 없습니다"))?;

    let response = CommentResponse {
        id: comment.id,
        post_id: comment.post_id,
        user_id: comment.user_id,
        parent_id: comment.parent_id,
        content: comment.content,
        user: super::dto::CommentUser {
            id: user_info.id,
            username: user_info.username,
            display_name: user_info.display_name,
            avatar_url: user_info.avatar_url,
            rank: user_info.rank,
        },
        created_at: comment.created_at.with_timezone(&chrono::Utc),
        updated_at: comment.updated_at.with_timezone(&chrono::Utc),
        replies: vec![],
    };

    Ok(Json(response))
}

/// 댓글 삭제
#[utoipa::path(
    delete,
    path = "/api/v1/comments/{comment_id}",
    tag = "comments",
    params(
        ("comment_id" = Uuid, Path, description = "Comment ID")
    ),
    responses(
        (status = 204, description = "댓글 삭제 성공"),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "본인의 댓글만 삭제 가능"),
        (status = 404, description = "댓글을 찾을 수 없음")
    ),
    security(
        ("bearer" = [])
    )
)]
pub async fn delete_comment(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Path(comment_id): Path<Uuid>,
) -> AppResult<impl IntoResponse> {
    service::delete_comment(&state.db, comment_id, user.id).await?;

    Ok(StatusCode::NO_CONTENT)
}

/// Comments 라우터
pub fn router() -> Router<AppState> {
    Router::new()
        .route(
            "/api/v1/posts/{post_id}/comments",
            post(create_comment).get(list_comments),
        )
        .route(
            "/api/v1/comments/{comment_id}",
            axum::routing::patch(update_comment).delete(delete_comment),
        )
}
