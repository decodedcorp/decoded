use crate::entities::{comments, posts, users};
use crate::error::{AppError, AppResult};
use sea_orm::ActiveValue::Set;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait, QueryFilter,
};
use std::collections::HashMap;
use uuid::Uuid;

use super::dto::{CommentResponse, CommentUser};

/// 댓글 생성
pub async fn create_comment(
    db: &DatabaseConnection,
    post_id: Uuid,
    user_id: Uuid,
    content: String,
    parent_id: Option<Uuid>,
) -> AppResult<comments::Model> {
    // Post 존재 확인
    posts::Entity::find_by_id(post_id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Post를 찾을 수 없습니다"))?;

    // parent_id가 있는 경우 부모 댓글 존재 확인
    if let Some(pid) = parent_id {
        let parent = comments::Entity::find_by_id(pid)
            .one(db)
            .await?
            .ok_or_else(|| AppError::not_found("부모 댓글을 찾을 수 없습니다"))?;

        // 부모 댓글이 같은 Post에 속하는지 확인
        if parent.post_id != post_id {
            return Err(AppError::bad_request(
                "부모 댓글이 같은 Post에 속하지 않습니다",
            ));
        }

        // 대댓글의 대댓글은 허용하지 않음 (2단계까지만)
        if parent.parent_id.is_some() {
            return Err(AppError::bad_request("대댓글에는 답글을 달 수 없습니다"));
        }
    }

    // 댓글 생성
    let comment = comments::ActiveModel {
        id: Set(Uuid::new_v4()),
        post_id: Set(post_id),
        user_id: Set(user_id),
        parent_id: Set(parent_id),
        content: Set(content),
        ..Default::default()
    };

    let comment = comment.insert(db).await?;

    Ok(comment)
}

/// 댓글 목록 조회 (대댓글 포함, 계층 구조)
pub async fn list_comments(
    db: &DatabaseConnection,
    post_id: Uuid,
) -> AppResult<Vec<CommentResponse>> {
    // Post 존재 확인
    posts::Entity::find_by_id(post_id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Post를 찾을 수 없습니다"))?;

    // 모든 댓글 조회 (최상위 + 대댓글)
    let comments_list = comments::Entity::find()
        .filter(comments::Column::PostId.eq(post_id))
        .all(db)
        .await?;

    // 사용자 정보 조회 (배치)
    let user_ids: Vec<Uuid> = comments_list.iter().map(|c| c.user_id).collect();
    let users_list = users::Entity::find()
        .filter(users::Column::Id.is_in(user_ids))
        .all(db)
        .await?;

    let users_map: HashMap<Uuid, users::Model> =
        users_list.into_iter().map(|u| (u.id, u)).collect();

    // 댓글을 parent_id로 그룹화
    let mut comments_by_parent: HashMap<Option<Uuid>, Vec<comments::Model>> = HashMap::new();
    for comment in comments_list {
        comments_by_parent
            .entry(comment.parent_id)
            .or_default()
            .push(comment);
    }

    // 최상위 댓글만 추출 (parent_id가 None인 것들)
    let root_comments = comments_by_parent.remove(&None).unwrap_or_default();

    // 계층 구조로 변환
    let result: Vec<CommentResponse> = root_comments
        .into_iter()
        .map(|comment| build_comment_tree(comment, &comments_by_parent, &users_map))
        .collect();

    Ok(result)
}

/// 댓글 상세 조회
pub async fn get_comment_by_id(
    db: &DatabaseConnection,
    comment_id: Uuid,
) -> AppResult<comments::Model> {
    comments::Entity::find_by_id(comment_id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("댓글을 찾을 수 없습니다"))
}

/// 댓글 수정
pub async fn update_comment(
    db: &DatabaseConnection,
    comment_id: Uuid,
    user_id: Uuid,
    content: String,
) -> AppResult<comments::Model> {
    let comment = get_comment_by_id(db, comment_id).await?;

    // 작성자 확인
    if comment.user_id != user_id {
        return Err(AppError::forbidden("본인의 댓글만 수정할 수 있습니다"));
    }

    let mut comment_active: comments::ActiveModel = comment.into();
    comment_active.content = Set(content);

    let updated_comment = comment_active.update(db).await?;

    Ok(updated_comment)
}

/// 댓글 삭제
pub async fn delete_comment(
    db: &DatabaseConnection,
    comment_id: Uuid,
    user_id: Uuid,
) -> AppResult<()> {
    let comment = get_comment_by_id(db, comment_id).await?;

    // 작성자 확인
    if comment.user_id != user_id {
        return Err(AppError::forbidden("본인의 댓글만 삭제할 수 있습니다"));
    }

    let comment_active: comments::ActiveModel = comment.into();
    comment_active.delete(db).await?;

    Ok(())
}

/// 댓글 계층 구조 생성 (재귀)
fn build_comment_tree(
    comment: comments::Model,
    comments_by_parent: &HashMap<Option<Uuid>, Vec<comments::Model>>,
    users_map: &HashMap<Uuid, users::Model>,
) -> CommentResponse {
    let user = users_map.get(&comment.user_id).cloned();
    let comment_user = user
        .map(|u| CommentUser {
            id: u.id,
            username: u.username,
            display_name: u.display_name,
            avatar_url: u.avatar_url,
            rank: u.rank,
        })
        .unwrap_or_else(|| CommentUser {
            id: comment.user_id,
            username: "unknown".to_string(),
            display_name: Some("Unknown User".to_string()),
            avatar_url: None,
            rank: "member".to_string(),
        });

    // 대댓글 조회
    let replies = comments_by_parent
        .get(&Some(comment.id))
        .map(|children| {
            children
                .iter()
                .map(|child| build_comment_tree(child.clone(), comments_by_parent, users_map))
                .collect()
        })
        .unwrap_or_default();

    CommentResponse {
        id: comment.id,
        post_id: comment.post_id,
        user_id: comment.user_id,
        parent_id: comment.parent_id,
        content: comment.content,
        user: comment_user,
        created_at: comment.created_at.with_timezone(&chrono::Utc),
        updated_at: comment.updated_at.with_timezone(&chrono::Utc),
        replies,
    }
}

/// 댓글 개수 조회
pub async fn count_comments_by_post_id(db: &DatabaseConnection, post_id: Uuid) -> AppResult<usize> {
    let count = comments::Entity::find()
        .filter(comments::Column::PostId.eq(post_id))
        .count(db)
        .await? as usize;

    Ok(count)
}
