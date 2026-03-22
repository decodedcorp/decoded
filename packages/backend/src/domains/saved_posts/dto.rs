use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Serialize, utoipa::ToSchema)]
pub struct SavedPostResponse {
    pub id: Uuid,
    pub post_id: Uuid,
    pub user_id: Uuid,
    #[serde(with = "chrono::serde::ts_seconds")]
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize, utoipa::ToSchema)]
pub struct SavedPostStatsResponse {
    pub user_has_saved: bool,
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;

    #[test]
    fn saved_post_response_serializes_created_at_as_unix_seconds() {
        let dt = chrono::DateTime::from_timestamp(1_700_000_000, 0).expect("valid ts");
        let row = SavedPostResponse {
            id: Uuid::nil(),
            post_id: Uuid::nil(),
            user_id: Uuid::nil(),
            created_at: dt,
        };
        let v: serde_json::Value = serde_json::to_value(&row).unwrap();
        assert_eq!(v["created_at"], 1_700_000_000);
    }

    #[test]
    fn saved_post_stats_response_serializes_bool() {
        let on = serde_json::to_value(SavedPostStatsResponse {
            user_has_saved: true,
        })
        .unwrap();
        let off = serde_json::to_value(SavedPostStatsResponse {
            user_has_saved: false,
        })
        .unwrap();
        assert_eq!(on["user_has_saved"], true);
        assert_eq!(off["user_has_saved"], false);
    }
}
