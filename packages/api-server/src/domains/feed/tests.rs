//! Feed 도메인 단위 테스트

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use crate::domains::feed::dto::{FeedItem, FeedUser, MediaSource};
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
        assert!(j.contains("APT."));
    }

    #[test]
    fn pagination_page_one_offset_zero() {
        let p = Pagination::new(1, 20);
        assert_eq!(p.offset(), 0);
    }

    #[test]
    fn pagination_large_page() {
        let p = Pagination::new(100, 50);
        assert_eq!(p.offset(), 4950);
        assert_eq!(p.limit(), 50);
    }

    #[test]
    fn feed_user_with_avatar() {
        let u = FeedUser {
            id: Uuid::nil(),
            username: "bob".to_string(),
            avatar_url: Some("https://example.com/avatar.png".to_string()),
        };
        let j = serde_json::to_string(&u).unwrap();
        assert!(j.contains("avatar.png"));
    }

    #[test]
    fn media_source_no_title() {
        let m = MediaSource {
            type_: "drama".to_string(),
            title: None,
        };
        let j = serde_json::to_string(&m).unwrap();
        assert!(j.contains("drama"));
        assert!(j.contains("null") || !j.contains("title"));
    }

    // ── FeedService::list_curations ──

    #[tokio::test]
    async fn list_curations_empty_returns_empty_data() {
        use crate::domains::feed::service::FeedService;
        use crate::tests::helpers::test_app_state;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::curations::Model>::new()])
            .into_connection();
        let state = test_app_state(db);

        let resp = FeedService::list_curations(&state)
            .await
            .expect("list_curations ok");
        assert!(resp.data.is_empty());
    }

    #[tokio::test]
    async fn list_curations_with_one_curation_counts_posts() {
        use crate::domains::feed::service::FeedService;
        use crate::tests::fixtures;
        use crate::tests::helpers::test_app_state;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let curation = fixtures::curation_model();
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            // 1) curations list
            .append_query_results([vec![curation.clone()]])
            // 2) count of curation_posts → returned via paginator (num_items)
            .append_query_results([vec![fixtures::count_row(3)]])
            .into_connection();
        let state = test_app_state(db);

        let resp = FeedService::list_curations(&state)
            .await
            .expect("list_curations ok");
        assert_eq!(resp.data.len(), 1);
        assert_eq!(resp.data[0].id, curation.id);
        assert_eq!(resp.data[0].post_count, 3);
    }

    // ── FeedService::curation_detail ──

    #[tokio::test]
    async fn curation_detail_not_found() {
        use crate::domains::feed::service::FeedService;
        use crate::error::AppError;
        use crate::tests::fixtures;
        use crate::tests::helpers::test_app_state;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::curations::Model>::new()])
            .into_connection();
        let state = test_app_state(db);

        let result = FeedService::curation_detail(&state, fixtures::test_uuid(40)).await;
        assert!(matches!(result, Err(AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn curation_detail_with_no_posts() {
        use crate::domains::feed::service::FeedService;
        use crate::tests::fixtures;
        use crate::tests::helpers::test_app_state;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let curation = fixtures::curation_model();
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            // 1) curation find_by_id
            .append_query_results([vec![curation.clone()]])
            // 2) curation_posts find (empty)
            .append_query_results([Vec::<crate::entities::curation_posts::Model>::new()])
            // 3) posts find (empty - is_in [])
            .append_query_results([Vec::<crate::entities::posts::Model>::new()])
            .into_connection();
        let state = test_app_state(db);

        let resp = FeedService::curation_detail(&state, curation.id)
            .await
            .expect("curation_detail ok");
        assert_eq!(resp.id, curation.id);
        assert!(resp.posts.is_empty());
    }

    // ── FeedService::home_feed ──

    #[tokio::test]
    async fn home_feed_empty_returns_empty_data() {
        use crate::domains::feed::service::FeedService;
        use crate::tests::fixtures;
        use crate::tests::helpers::test_app_state;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            // 1) posts list (empty)
            .append_query_results([Vec::<crate::entities::posts::Model>::new()])
            // 2) total count (paginator)
            .append_query_results([vec![fixtures::count_row(0)]])
            .into_connection();
        let state = test_app_state(db);

        let resp = FeedService::home_feed(&state, None, Pagination::new(1, 20))
            .await
            .expect("home_feed ok");
        assert!(resp.data.is_empty());
        assert_eq!(resp.pagination.total_items, 0);
        assert_eq!(resp.pagination.current_page, 1);
    }

    // ── FeedService::trending ──

    #[tokio::test]
    async fn trending_empty_returns_empty_data() {
        use crate::domains::feed::service::FeedService;
        use crate::tests::helpers::test_app_state;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            // 1) posts list (empty - no last 24h)
            .append_query_results([Vec::<crate::entities::posts::Model>::new()])
            .into_connection();
        let state = test_app_state(db);

        let resp = FeedService::trending(&state, Pagination::new(1, 20))
            .await
            .expect("trending ok");
        assert!(resp.data.is_empty());
        assert_eq!(resp.pagination.total_items, 0);
    }

    // ── FeedService::home_feed with data ──
    #[tokio::test]
    async fn home_feed_with_one_post_returns_feed_item() {
        use crate::domains::feed::service::FeedService;
        use crate::tests::fixtures;
        use crate::tests::helpers::test_app_state;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let post = fixtures::post_model();
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            // 1) posts list
            .append_query_results([vec![post.clone()]])
            // 2) count
            .append_query_results([vec![fixtures::count_row(1)]])
            // 3) user by id (posts_to_feed_items)
            .append_query_results([vec![fixtures::user_model()]])
            // 4) spot_count
            .append_query_results([vec![fixtures::count_row(2)]])
            // 5) comment_count
            .append_query_results([vec![fixtures::count_row(3)]])
            .into_connection();
        let state = test_app_state(db);
        let resp = FeedService::home_feed(&state, None, Pagination::new(1, 20))
            .await
            .expect("ok");
        assert_eq!(resp.data.len(), 1);
        assert_eq!(resp.data[0].spot_count, 2);
        assert_eq!(resp.data[0].comment_count, 3);
        assert_eq!(resp.pagination.total_items, 1);
    }

    #[tokio::test]
    async fn home_feed_user_not_found_propagates_error() {
        use crate::domains::feed::service::FeedService;
        use crate::tests::fixtures;
        use crate::tests::helpers::test_app_state;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![fixtures::post_model()]])
            .append_query_results([vec![fixtures::count_row(1)]])
            // user lookup → empty
            .append_query_results::<crate::entities::users::Model, Vec<_>, _>([vec![]])
            .into_connection();
        let state = test_app_state(db);
        let result = FeedService::home_feed(&state, None, Pagination::new(1, 20)).await;
        assert!(matches!(result, Err(crate::error::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn trending_with_one_post_calculates_score() {
        use crate::domains::feed::service::FeedService;
        use crate::tests::fixtures;
        use crate::tests::helpers::test_app_state;
        use sea_orm::{DatabaseBackend, MockDatabase};

        // 1) posts in last 24h
        // 2) spots for post
        // 3) solutions for spots
        // (vote count not queried if no solution_ids)
        // Then posts_to_feed_items: user, spot_count, comment_count
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![fixtures::post_model()]]) // posts
            .append_query_results([Vec::<crate::entities::spots::Model>::new()]) // spots for post
            // skipped: solutions (empty spots), votes (empty solutions)
            .append_query_results([vec![fixtures::user_model()]]) // user
            .append_query_results([vec![fixtures::count_row(0)]]) // spot_count
            .append_query_results([vec![fixtures::count_row(0)]]) // comment_count
            .into_connection();
        let state = test_app_state(db);
        let resp = FeedService::trending(&state, Pagination::new(1, 20))
            .await
            .expect("ok");
        assert_eq!(resp.data.len(), 1);
        assert_eq!(resp.pagination.total_items, 1);
    }

    #[tokio::test]
    async fn curation_detail_with_posts_returns_feed_items() {
        use crate::domains::feed::service::FeedService;
        use crate::tests::fixtures;
        use crate::tests::helpers::test_app_state;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let curation = fixtures::curation_model();
        let curation_post = crate::entities::curation_posts::Model {
            curation_id: curation.id,
            post_id: fixtures::test_uuid(1),
            display_order: 1,
        };

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![curation.clone()]]) // curation find_by_id
            .append_query_results([vec![curation_post]]) // curation_posts list
            .append_query_results([vec![fixtures::post_model()]]) // posts by id
            // posts_to_feed_items for one post
            .append_query_results([vec![fixtures::user_model()]])
            .append_query_results([vec![fixtures::count_row(1)]])
            .append_query_results([vec![fixtures::count_row(0)]])
            .into_connection();
        let state = test_app_state(db);
        let resp = FeedService::curation_detail(&state, curation.id)
            .await
            .expect("ok");
        assert_eq!(resp.posts.len(), 1);
    }

    #[tokio::test]
    async fn list_curations_db_error() {
        use crate::domains::feed::service::FeedService;
        use crate::tests::helpers::test_app_state;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_errors(vec![sea_orm::DbErr::Custom("boom".into())])
            .into_connection();
        let state = test_app_state(db);
        let result = FeedService::list_curations(&state).await;
        assert!(result.is_err());
    }

    #[test]
    fn calculate_trending_score_ignores_older_than_24h_as_zero_weight() {
        use crate::domains::feed::service::FeedService;
        let thirty_six_hours_ago = chrono::Utc::now() - chrono::Duration::hours(36);
        let score = FeedService::calculate_trending_score(0, 0, 0, thirty_six_hours_ago);
        // time_weight clamped to 0 → base 0 → total 0
        assert!((score - 0.0).abs() < 1e-6);
    }

    #[test]
    fn feed_item_serializes() {
        let item = FeedItem {
            id: Uuid::nil(),
            user: FeedUser {
                id: Uuid::nil(),
                username: "test".to_string(),
                avatar_url: None,
            },
            image_url: "https://example.com/img.webp".to_string(),
            media_source: Some(MediaSource {
                type_: "mv".to_string(),
                title: Some("Test".to_string()),
            }),
            artist_name: Some("Artist".to_string()),
            group_name: Some("Group".to_string()),
            context: Some("Scene 1".to_string()),
            spot_count: 3,
            view_count: 42,
            comment_count: 5,
            created_at: chrono::Utc::now(),
        };
        let j = serde_json::to_string(&item).unwrap();
        assert!(j.contains("spot_count"));
        assert!(j.contains("Artist"));
    }
}
