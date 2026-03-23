//! Post likes 도메인 테스트

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use crate::domains::post_likes::dto::PostLikeStatsResponse;

    #[test]
    fn post_like_stats_serializes_expected_shape() {
        let s = PostLikeStatsResponse {
            like_count: 3,
            user_has_liked: true,
        };
        let v = serde_json::to_value(&s).unwrap();
        assert_eq!(v["like_count"], 3);
        assert_eq!(v["user_has_liked"], true);
        assert!(v.get("like_count").is_some());
    }
}
