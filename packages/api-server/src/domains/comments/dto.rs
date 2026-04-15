use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;
use validator::Validate;

/// 댓글 생성 요청
#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct CreateCommentDto {
    /// 댓글 내용
    #[validate(length(min = 1, max = 1000, message = "댓글은 1-1000자 사이여야 합니다"))]
    pub content: String,
    /// 부모 댓글 ID (대댓글인 경우)
    pub parent_id: Option<Uuid>,
}

/// 댓글 수정 요청
#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct UpdateCommentDto {
    /// 댓글 내용
    #[validate(length(min = 1, max = 1000, message = "댓글은 1-1000자 사이여야 합니다"))]
    pub content: String,
}

/// 댓글 응답 (단일)
#[derive(Debug, Serialize, ToSchema)]
pub struct CommentResponse {
    pub id: Uuid,
    pub post_id: Uuid,
    pub user_id: Uuid,
    pub parent_id: Option<Uuid>,
    pub content: String,
    pub user: CommentUser,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    /// 대댓글 목록 (계층 구조)
    #[schema(no_recursion)]
    pub replies: Vec<CommentResponse>,
}

/// 댓글 목록 아이템 (간소화)
#[derive(Debug, Serialize, ToSchema)]
pub struct CommentListItem {
    pub id: Uuid,
    pub post_id: Uuid,
    pub user_id: Uuid,
    pub parent_id: Option<Uuid>,
    pub content: String,
    pub user: CommentUser,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    /// 대댓글 개수
    pub reply_count: usize,
}

/// 댓글 작성자 정보
#[derive(Debug, Serialize, ToSchema, Clone)]
pub struct CommentUser {
    pub id: Uuid,
    pub username: String,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
    pub rank: String,
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;
    use chrono::{TimeZone, Utc};
    use validator::Validate;

    #[test]
    fn create_comment_dto_validates_content_length() {
        assert!(CreateCommentDto {
            content: String::new(),
            parent_id: None,
        }
        .validate()
        .is_err());
        assert!(CreateCommentDto {
            content: "x".repeat(1001),
            parent_id: None,
        }
        .validate()
        .is_err());
        assert!(CreateCommentDto {
            content: "안녕".to_string(),
            parent_id: None,
        }
        .validate()
        .is_ok());
    }

    #[test]
    fn create_comment_dto_deserializes_parent_id() {
        let dto: CreateCommentDto =
            serde_json::from_str(r#"{"content":"hello","parent_id":null}"#).unwrap();
        assert_eq!(dto.content, "hello");
        assert!(dto.parent_id.is_none());

        let pid = Uuid::new_v4();
        let json = format!(r#"{{"content":"reply","parent_id":"{}"}}"#, pid);
        let dto: CreateCommentDto = serde_json::from_str(&json).unwrap();
        assert_eq!(dto.parent_id, Some(pid));
    }

    #[test]
    fn update_comment_dto_validates_content_length() {
        assert!(UpdateCommentDto {
            content: "".to_string(),
        }
        .validate()
        .is_err());
        assert!(UpdateCommentDto {
            content: "ok".to_string(),
        }
        .validate()
        .is_ok());
    }

    #[test]
    fn comment_user_and_list_item_serialize_timestamps() {
        let user = CommentUser {
            id: Uuid::nil(),
            username: "u1".to_string(),
            display_name: Some("Name".to_string()),
            avatar_url: None,
            rank: "gold".to_string(),
        };
        let t = Utc.with_ymd_and_hms(2025, 3, 20, 10, 0, 0).unwrap();
        let item = CommentListItem {
            id: Uuid::nil(),
            post_id: Uuid::nil(),
            user_id: Uuid::nil(),
            parent_id: None,
            content: "body".to_string(),
            user: user.clone(),
            created_at: t,
            updated_at: t,
            reply_count: 2,
        };
        let v: serde_json::Value = serde_json::to_value(&item).unwrap();
        assert_eq!(v["created_at"], serde_json::to_value(t).unwrap());
        assert_eq!(v["reply_count"], 2);
        assert_eq!(v["user"]["username"], "u1");
    }

    #[test]
    fn comment_response_serializes_nested_replies() {
        let user = CommentUser {
            id: Uuid::nil(),
            username: "u2".to_string(),
            display_name: None,
            avatar_url: None,
            rank: "silver".to_string(),
        };
        let t = Utc.with_ymd_and_hms(2025, 3, 21, 15, 0, 0).unwrap();
        let child = CommentResponse {
            id: Uuid::nil(),
            post_id: Uuid::nil(),
            user_id: Uuid::nil(),
            parent_id: Some(Uuid::nil()),
            content: "reply".to_string(),
            user: user.clone(),
            created_at: t,
            updated_at: t,
            replies: vec![],
        };
        let root = CommentResponse {
            id: Uuid::nil(),
            post_id: Uuid::nil(),
            user_id: Uuid::nil(),
            parent_id: None,
            content: "root".to_string(),
            user,
            created_at: t,
            updated_at: t,
            replies: vec![child],
        };
        let v: serde_json::Value = serde_json::to_value(&root).unwrap();
        assert_eq!(v["replies"].as_array().unwrap().len(), 1);
        assert_eq!(v["replies"][0]["content"], "reply");
    }
}
