//! Feed 도메인 단위 테스트 (DB 없음 — DTO·페이지네이션 등)

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use crate::domains::feed::dto::{FeedUser, MediaSource};
    use crate::utils::pagination::Pagination;
    use uuid::Uuid;

    #[test]
    fn pagination_clamps_per_page() {
        let p = Pagination::new(1, 10_000);
        assert_eq!(p.per_page, 100);
        assert_eq!(p.page, 1);
    }

    #[test]
    fn pagination_offset_limit() {
        let p = Pagination::new(2, 20);
        assert_eq!(p.offset(), 20);
        assert_eq!(p.limit(), 20);
    }

    #[test]
    fn feed_user_serializes() {
        let u = FeedUser {
            id: Uuid::nil(),
            username: "alice".to_string(),
            avatar_url: None,
        };
        let j = serde_json::to_string(&u).unwrap();
        assert!(j.contains("alice"));
    }

    #[test]
    fn media_source_roundtrip() {
        let m = MediaSource {
            type_: "mv".to_string(),
            title: Some("APT.".to_string()),
        };
        let j = serde_json::to_string(&m).unwrap();
        assert!(j.contains("mv"));
    }
}
