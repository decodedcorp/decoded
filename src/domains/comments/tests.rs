use super::dto::*;
use serde_json;
use uuid::Uuid;
use validator::Validate;

#[test]
fn test_create_comment_dto_validation() {
    let dto = CreateCommentDto {
        content: "This is a test comment".to_string(),
        parent_id: None,
    };
    assert!(dto.validate().is_ok());

    let dto = CreateCommentDto {
        content: "".to_string(),
        parent_id: None,
    };
    assert!(dto.validate().is_err());

    let dto = CreateCommentDto {
        content: "a".repeat(1001),
        parent_id: None,
    };
    assert!(dto.validate().is_err());
}

#[test]
fn test_create_comment_dto_with_parent() {
    let dto = CreateCommentDto {
        content: "This is a reply".to_string(),
        parent_id: Some(Uuid::new_v4()),
    };
    assert!(dto.validate().is_ok());
}

#[test]
fn test_update_comment_dto_validation() {
    let dto = UpdateCommentDto {
        content: "Updated comment".to_string(),
    };
    assert!(dto.validate().is_ok());

    let dto = UpdateCommentDto {
        content: "".to_string(),
    };
    assert!(dto.validate().is_err());

    let dto = UpdateCommentDto {
        content: "a".repeat(1001),
    };
    assert!(dto.validate().is_err());
}

#[test]
fn test_comment_user_serialization() {
    let user = CommentUser {
        id: Uuid::new_v4(),
        username: "testuser".to_string(),
        display_name: Some("Test User".to_string()),
        avatar_url: Some("https://example.com/avatar.jpg".to_string()),
        rank: "member".to_string(),
    };

    let json = serde_json::to_string(&user).unwrap();
    assert!(json.contains("testuser"));
    assert!(json.contains("Test User"));
    assert!(json.contains("member"));
}

#[test]
fn test_comment_response_structure() {
    use chrono::Utc;

    let response = CommentResponse {
        id: Uuid::new_v4(),
        post_id: Uuid::new_v4(),
        user_id: Uuid::new_v4(),
        parent_id: None,
        content: "Test comment".to_string(),
        user: CommentUser {
            id: Uuid::new_v4(),
            username: "testuser".to_string(),
            display_name: Some("Test User".to_string()),
            avatar_url: None,
            rank: "member".to_string(),
        },
        created_at: Utc::now(),
        updated_at: Utc::now(),
        replies: vec![],
    };

    let json = serde_json::to_string(&response).unwrap();
    assert!(json.contains("Test comment"));
    assert!(json.contains("testuser"));
}

#[test]
fn test_comment_response_with_replies() {
    use chrono::Utc;

    let parent_id = Uuid::new_v4();
    let reply = CommentResponse {
        id: Uuid::new_v4(),
        post_id: Uuid::new_v4(),
        user_id: Uuid::new_v4(),
        parent_id: Some(parent_id),
        content: "This is a reply".to_string(),
        user: CommentUser {
            id: Uuid::new_v4(),
            username: "replyuser".to_string(),
            display_name: Some("Reply User".to_string()),
            avatar_url: None,
            rank: "member".to_string(),
        },
        created_at: Utc::now(),
        updated_at: Utc::now(),
        replies: vec![],
    };

    let response = CommentResponse {
        id: parent_id,
        post_id: Uuid::new_v4(),
        user_id: Uuid::new_v4(),
        parent_id: None,
        content: "Parent comment".to_string(),
        user: CommentUser {
            id: Uuid::new_v4(),
            username: "parentuser".to_string(),
            display_name: Some("Parent User".to_string()),
            avatar_url: None,
            rank: "member".to_string(),
        },
        created_at: Utc::now(),
        updated_at: Utc::now(),
        replies: vec![reply],
    };

    assert_eq!(response.replies.len(), 1);
    assert_eq!(response.replies[0].content, "This is a reply");
}

#[test]
fn test_comment_list_item_structure() {
    use chrono::Utc;

    let item = CommentListItem {
        id: Uuid::new_v4(),
        post_id: Uuid::new_v4(),
        user_id: Uuid::new_v4(),
        parent_id: None,
        content: "Test comment".to_string(),
        user: CommentUser {
            id: Uuid::new_v4(),
            username: "testuser".to_string(),
            display_name: Some("Test User".to_string()),
            avatar_url: None,
            rank: "member".to_string(),
        },
        created_at: Utc::now(),
        updated_at: Utc::now(),
        reply_count: 3,
    };

    let json = serde_json::to_string(&item).unwrap();
    assert!(json.contains("Test comment"));
    assert!(json.contains("reply_count"));
}

// 통합 테스트는 실제 DB 필요
#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod integration_tests {
    // TODO: 실제 DB 연결 후 통합 테스트 작성
    // - create_comment 테스트
    // - list_comments 테스트 (계층 구조)
    // - update_comment 테스트
    // - delete_comment 테스트
    // - 대댓글 제한 테스트 (2단계까지만)
}
