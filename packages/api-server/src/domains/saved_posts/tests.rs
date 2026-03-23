//! Saved posts 도메인 테스트

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use crate::domains::saved_posts::dto::SavedPostStatsResponse;

    #[test]
    fn saved_post_stats_serializes_flag() {
        let s = SavedPostStatsResponse {
            user_has_saved: false,
        };
        let v = serde_json::to_value(&s).unwrap();
        assert_eq!(v["user_has_saved"], false);
        assert!(v.get("user_has_saved").is_some());
    }
}
