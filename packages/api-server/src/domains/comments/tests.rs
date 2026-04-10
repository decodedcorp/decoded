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

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod mock_db_tests {
    use crate::domains::comments::service;
    use crate::tests::fixtures;
    use sea_orm::{DatabaseBackend, MockDatabase};

    #[tokio::test]
    async fn get_comment_by_id_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::comment_model()]])
            .into_connection();
        let result = service::get_comment_by_id(&db, fixtures::test_uuid(4)).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().content, "Test comment");
    }

    #[tokio::test]
    async fn get_comment_by_id_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::comments::Model>::new()])
            .into_connection();
        let result = service::get_comment_by_id(&db, fixtures::test_uuid(99)).await;
        assert!(matches!(result, Err(crate::AppError::NotFound(_))));
    }

    // count queries use SeaORM paginator which requires special mock setup;
    // covered via integration tests instead.

    #[tokio::test]
    async fn create_comment_post_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::posts::Model>::new()])
            .into_connection();
        let result = service::create_comment(
            &db,
            fixtures::test_uuid(1),
            fixtures::test_uuid(10),
            "hello".to_string(),
            None,
        )
        .await;
        assert!(matches!(result, Err(crate::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn create_comment_success_root() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::post_model()]])
            .append_query_results([[fixtures::comment_model()]])
            .into_connection();
        let result = service::create_comment(
            &db,
            fixtures::test_uuid(1),
            fixtures::test_uuid(10),
            "hello".to_string(),
            None,
        )
        .await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        assert_eq!(result.unwrap().content, "Test comment");
    }

    #[tokio::test]
    async fn create_comment_parent_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::post_model()]])
            .append_query_results([Vec::<crate::entities::comments::Model>::new()])
            .into_connection();
        let result = service::create_comment(
            &db,
            fixtures::test_uuid(1),
            fixtures::test_uuid(10),
            "reply".to_string(),
            Some(fixtures::test_uuid(99)),
        )
        .await;
        assert!(matches!(result, Err(crate::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn create_comment_parent_wrong_post() {
        let mut parent = fixtures::comment_model();
        parent.post_id = fixtures::test_uuid(77);
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::post_model()]])
            .append_query_results([[parent]])
            .into_connection();
        let result = service::create_comment(
            &db,
            fixtures::test_uuid(1),
            fixtures::test_uuid(10),
            "reply".to_string(),
            Some(fixtures::test_uuid(4)),
        )
        .await;
        assert!(matches!(result, Err(crate::AppError::BadRequest(_))));
    }

    #[tokio::test]
    async fn create_comment_grandchild_rejected() {
        let mut parent = fixtures::comment_model();
        parent.parent_id = Some(fixtures::test_uuid(55));
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::post_model()]])
            .append_query_results([[parent]])
            .into_connection();
        let result = service::create_comment(
            &db,
            fixtures::test_uuid(1),
            fixtures::test_uuid(10),
            "reply".to_string(),
            Some(fixtures::test_uuid(4)),
        )
        .await;
        assert!(matches!(result, Err(crate::AppError::BadRequest(_))));
    }

    #[tokio::test]
    async fn list_comments_post_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::posts::Model>::new()])
            .into_connection();
        let result = service::list_comments(&db, fixtures::test_uuid(99)).await;
        assert!(matches!(result, Err(crate::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn list_comments_empty() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::post_model()]])
            .append_query_results([Vec::<crate::entities::comments::Model>::new()])
            .append_query_results([Vec::<crate::entities::users::Model>::new()])
            .into_connection();
        let result = service::list_comments(&db, fixtures::test_uuid(1)).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        assert!(result.unwrap().is_empty());
    }

    #[tokio::test]
    async fn update_comment_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::comments::Model>::new()])
            .into_connection();
        let result = service::update_comment(
            &db,
            fixtures::test_uuid(99),
            fixtures::test_uuid(10),
            "x".to_string(),
        )
        .await;
        assert!(matches!(result, Err(crate::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn update_comment_forbidden() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::comment_model()]])
            .into_connection();
        let result = service::update_comment(
            &db,
            fixtures::test_uuid(4),
            fixtures::test_uuid(11),
            "x".to_string(),
        )
        .await;
        assert!(matches!(result, Err(crate::AppError::Forbidden(_))));
    }

    #[tokio::test]
    async fn delete_comment_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::comments::Model>::new()])
            .into_connection();
        let result =
            service::delete_comment(&db, fixtures::test_uuid(99), fixtures::test_uuid(10)).await;
        assert!(matches!(result, Err(crate::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn delete_comment_forbidden() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::comment_model()]])
            .into_connection();
        let result =
            service::delete_comment(&db, fixtures::test_uuid(4), fixtures::test_uuid(11)).await;
        assert!(matches!(result, Err(crate::AppError::Forbidden(_))));
    }
}
