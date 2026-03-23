use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Serialize, utoipa::ToSchema)]
pub struct PostLikeResponse {
    pub id: Uuid,
    pub post_id: Uuid,
    pub user_id: Uuid,
    #[serde(with = "chrono::serde::ts_seconds")]
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize, utoipa::ToSchema)]
pub struct PostLikeStatsResponse {
    pub like_count: u64,
    pub user_has_liked: bool,
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;

    #[test]
    fn post_like_response_serializes_created_at_as_unix_seconds() {
        let dt = chrono::DateTime::from_timestamp(1_688_000_000, 0).expect("valid ts");
        let row = PostLikeResponse {
            id: Uuid::nil(),
            post_id: Uuid::nil(),
            user_id: Uuid::nil(),
            created_at: dt,
        };
        let v: serde_json::Value = serde_json::to_value(&row).unwrap();
        assert_eq!(v["created_at"], 1_688_000_000);
    }

    #[test]
    fn post_like_stats_response_serializes_counts_and_flags() {
        let v = serde_json::to_value(PostLikeStatsResponse {
            like_count: u64::MAX,
            user_has_liked: false,
        })
        .unwrap();
        assert_eq!(v["like_count"], serde_json::json!(u64::MAX));
        assert_eq!(v["user_has_liked"], false);
    }
}
