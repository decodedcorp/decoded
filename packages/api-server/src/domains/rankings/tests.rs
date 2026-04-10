//! Rankings 도메인 단위 테스트

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use crate::domains::rankings::dto::RankingPeriodQuery;
    use crate::domains::rankings::service::{ActivityPoints, RankingsService};
    use crate::tests::fixtures;
    use crate::utils::pagination::Pagination;
    use sea_orm::{DatabaseBackend, MockDatabase};

    #[test]
    fn activity_points_enum_values() {
        assert_eq!(ActivityPoints::PostCreated as i32, 5);
        assert_eq!(ActivityPoints::SpotCreated as i32, 3);
        assert_eq!(ActivityPoints::SolutionRegistered as i32, 10);
        assert_eq!(ActivityPoints::SolutionAdopted as i32, 30);
        assert_eq!(ActivityPoints::SolutionVerified as i32, 20);
        assert_eq!(ActivityPoints::VoteAccurate as i32, 2);
        assert_eq!(ActivityPoints::VoteParticipation as i32, 1);
        assert_eq!(ActivityPoints::PurchaseConversion as i32, 50);
    }

    #[test]
    fn ranking_period_query_defaults() {
        let q: RankingPeriodQuery = serde_json::from_str("{}").unwrap();
        assert_eq!(q.period, "weekly");
        assert_eq!(q.page, 1);
        assert_eq!(q.per_page, 50);
    }

    #[test]
    fn pagination_new_for_rankings() {
        let p = Pagination::new(3, 50);
        assert_eq!(p.page, 3);
        assert_eq!(p.per_page, 50);
    }

    #[tokio::test]
    async fn add_points_success() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            // insert point_log returns the inserted model
            .append_query_results([vec![fixtures::point_log_model()]])
            // find user by id
            .append_query_results([vec![fixtures::user_model()]])
            // update user returns updated model
            .append_query_results([vec![fixtures::user_model()]])
            .into_connection();

        let result = RankingsService::add_points(
            &db,
            fixtures::test_uuid(10),
            "solution_registered",
            10,
            Some(fixtures::test_uuid(3)),
            Some("solution"),
            Some("Solution registered"),
        )
        .await;

        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn add_points_user_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            // insert point_log
            .append_query_results([vec![fixtures::point_log_model()]])
            // find user returns empty
            .append_query_results::<crate::entities::users::Model, Vec<_>, _>([vec![]])
            .into_connection();

        let result = RankingsService::add_points(
            &db,
            fixtures::test_uuid(99),
            "post_created",
            5,
            None,
            None,
            None,
        )
        .await;

        assert!(result.is_err());
        let err_str = format!("{:?}", result.unwrap_err());
        assert!(err_str.contains("not found") || err_str.contains("NotFound"));
    }

    #[tokio::test]
    async fn add_points_negative_still_succeeds() {
        let mut user = fixtures::user_model();
        user.total_points = 200;

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![fixtures::point_log_model()]])
            .append_query_results([vec![user.clone()]])
            .append_query_results([vec![user]])
            .into_connection();

        let result = RankingsService::add_points(
            &db,
            fixtures::test_uuid(10),
            "penalty",
            -10,
            None,
            None,
            Some("Penalty applied"),
        )
        .await;

        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn add_points_zero_points() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![fixtures::point_log_model()]])
            .append_query_results([vec![fixtures::user_model()]])
            .append_query_results([vec![fixtures::user_model()]])
            .into_connection();

        let result =
            RankingsService::add_points(&db, fixtures::test_uuid(10), "no_op", 0, None, None, None)
                .await;

        assert!(result.is_ok());
    }

    #[test]
    fn ranking_period_query_custom_values() {
        let q: RankingPeriodQuery =
            serde_json::from_str(r#"{"period":"monthly","page":2,"per_page":10}"#).unwrap();
        assert_eq!(q.period, "monthly");
        assert_eq!(q.page, 2);
        assert_eq!(q.per_page, 10);
    }

    #[tokio::test]
    async fn add_points_db_error_on_insert() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_errors(vec![sea_orm::DbErr::Custom("insert failed".into())])
            .into_connection();

        let result = RankingsService::add_points(
            &db,
            fixtures::test_uuid(10),
            "post_created",
            5,
            None,
            None,
            None,
        )
        .await;
        assert!(result.is_err());
    }

    // ── get_rankings tests ──

    #[tokio::test]
    async fn get_rankings_all_time_empty_no_user() {
        use crate::tests::helpers::test_app_state;

        // Query sequence for get_rankings (no user_id):
        // 1. Users::find().order.offset.limit.all → posts users
        // 2. Users::find().count → total_items
        // 3. Solutions::find().all (get_users_solution_stats)  [skipped if user_ids empty? no — filter with empty is_in still queries]
        // 4. PointLogs::find().all (get_users_period_points)
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::users::Model>::new()]) // users
            .append_query_results([Vec::<crate::entities::users::Model>::new()]) // count
            .append_query_results([Vec::<crate::entities::solutions::Model>::new()]) // solution_stats
            .append_query_results([Vec::<crate::entities::point_logs::Model>::new()]) // period_points
            .into_connection();
        let state = test_app_state(db);
        let result =
            RankingsService::get_rankings(&state, "all", Pagination::new(1, 20), None).await;
        assert!(result.is_ok());
        let resp = result.unwrap();
        assert!(resp.data.is_empty());
        assert!(resp.my_ranking.is_none());
    }

    #[tokio::test]
    async fn get_rankings_weekly_with_user_not_found() {
        use crate::tests::helpers::test_app_state;

        // Weekly period + user_id: after main pipeline, find_by_id for my_user → None → my_ranking = None
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::users::Model>::new()]) // users
            .append_query_results([Vec::<crate::entities::users::Model>::new()]) // count
            .append_query_results([Vec::<crate::entities::solutions::Model>::new()]) // stats
            .append_query_results([Vec::<crate::entities::point_logs::Model>::new()]) // period points
            .append_query_results([Vec::<crate::entities::users::Model>::new()]) // find_by_id → none
            .into_connection();
        let state = test_app_state(db);
        let result = RankingsService::get_rankings(
            &state,
            "weekly",
            Pagination::new(1, 20),
            Some(fixtures::test_uuid(10)),
        )
        .await;
        assert!(result.is_ok());
        assert!(result.unwrap().my_ranking.is_none());
    }

    #[tokio::test]
    async fn get_rankings_monthly_empty() {
        use crate::tests::helpers::test_app_state;

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::users::Model>::new()])
            .append_query_results([Vec::<crate::entities::users::Model>::new()])
            .append_query_results([Vec::<crate::entities::solutions::Model>::new()])
            .append_query_results([Vec::<crate::entities::point_logs::Model>::new()])
            .into_connection();
        let state = test_app_state(db);
        let result =
            RankingsService::get_rankings(&state, "monthly", Pagination::new(1, 20), None).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn get_rankings_db_error() {
        use crate::tests::helpers::test_app_state;

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_errors(vec![sea_orm::DbErr::Custom("boom".into())])
            .into_connection();
        let state = test_app_state(db);
        let result =
            RankingsService::get_rankings(&state, "all", Pagination::new(1, 20), None).await;
        assert!(result.is_err());
    }

    // ── get_category_rankings tests ──

    #[tokio::test]
    async fn get_category_rankings_category_not_found() {
        use crate::tests::helpers::test_app_state;

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::categories::Model>::new()]) // category lookup → None
            .into_connection();
        let state = test_app_state(db);
        let result =
            RankingsService::get_category_rankings(&state, "missing", Pagination::new(1, 20)).await;
        assert!(matches!(result, Err(crate::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn get_category_rankings_no_users_with_activity() {
        use crate::tests::helpers::test_app_state;

        // 1. category find → Some(category)
        // 2. Users::find().all → empty users
        // 3. get_users_category_points (subcategories query) → empty → returns early
        // 4. subcategories query → empty
        // (no spots/solutions since lists are empty)
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![fixtures::category_model()]]) // category
            .append_query_results([Vec::<crate::entities::users::Model>::new()]) // all users
            .append_query_results([Vec::<crate::entities::subcategories::Model>::new()]) // sub for get_users_category_points
            .append_query_results([Vec::<crate::entities::subcategories::Model>::new()]) // sub for spots lookup
            .into_connection();
        let state = test_app_state(db);
        let result =
            RankingsService::get_category_rankings(&state, "fashion", Pagination::new(1, 20)).await;
        assert!(result.is_ok());
        let resp = result.unwrap();
        assert!(resp.data.is_empty());
    }

    // ── get_my_ranking_detail tests ──

    #[tokio::test]
    async fn get_my_ranking_detail_user_not_found() {
        use crate::tests::helpers::test_app_state;

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::users::Model>::new()]) // find_by_id → None
            .into_connection();
        let state = test_app_state(db);
        let result = RankingsService::get_my_ranking_detail(&state, fixtures::test_uuid(99)).await;
        assert!(matches!(result, Err(crate::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn get_rankings_with_one_user_and_my_ranking() {
        use crate::tests::helpers::test_app_state;

        // Flow (all_time, user_id Some):
        // 1. users list (1 user)
        // 2. users count
        // 3. solution stats (solutions with is_in user_ids) → empty
        // 4. period point_logs → empty
        // 5. find_by_id(my_user) → Some(user)
        // 6. count users with total_points > my total_points → 0
        // 7. get_users_period_points([my_id], period_start) → point_logs empty
        let user = fixtures::user_model();
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![user.clone()]]) // users
            .append_query_results([[fixtures::count_row(1)]]) // users count
            .append_query_results([Vec::<crate::entities::solutions::Model>::new()]) // solution stats
            .append_query_results([Vec::<crate::entities::point_logs::Model>::new()]) // period points
            .append_query_results([vec![user.clone()]]) // find_by_id my_user
            .append_query_results([[fixtures::count_row(0)]]) // higher-points count
            .append_query_results([Vec::<crate::entities::point_logs::Model>::new()]) // my period points
            .into_connection();
        let state = test_app_state(db);
        let result = RankingsService::get_rankings(
            &state,
            "all",
            Pagination::new(1, 20),
            Some(fixtures::test_uuid(10)),
        )
        .await;
        assert!(result.is_ok());
        let resp = result.unwrap();
        assert_eq!(resp.data.len(), 1);
        assert_eq!(resp.data[0].rank, 1);
        assert!(resp.my_ranking.is_some());
        let me = resp.my_ranking.unwrap();
        assert_eq!(me.rank, 1);
        assert_eq!(me.total_points, 100);
    }

    #[tokio::test]
    async fn get_category_rankings_with_category_but_empty_users() {
        use crate::tests::helpers::test_app_state;

        // 1. categories find (by code) → Some
        // 2. Users::find().all → empty
        // 3. get_users_category_points: subcategories query → empty → return HashMap::new
        // 4. subcategories query (second one for spots) → empty
        // (with empty spots/solutions, no further queries from category branch)
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![fixtures::category_model()]])
            .append_query_results([Vec::<crate::entities::users::Model>::new()])
            .append_query_results([Vec::<crate::entities::subcategories::Model>::new()])
            .append_query_results([Vec::<crate::entities::subcategories::Model>::new()])
            .into_connection();
        let state = test_app_state(db);
        let result =
            RankingsService::get_category_rankings(&state, "fashion", Pagination::new(1, 20))
                .await
                .expect("ok");
        assert_eq!(result.category_code, "fashion");
        assert!(result.data.is_empty());
        assert_eq!(result.pagination.total_items, 0);
    }

    #[tokio::test]
    async fn get_my_ranking_detail_success_no_activity() {
        use crate::tests::helpers::test_app_state;

        // Flow:
        // 1. find_by_id → Some(user)
        // 2. count higher-points users → 0
        // 3. period_points(weekly) → empty
        // 4. period_points(monthly) → empty
        // 5. solution_stats (solutions) → empty
        // 6. solutions filter by user → empty (accurate_votes)
        // 7. get_user_category_rankings → all_categories (empty) → Vec::new
        let user = fixtures::user_model();
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![user]]) // find_by_id
            .append_query_results([[fixtures::count_row(0)]]) // higher-points count
            .append_query_results([Vec::<crate::entities::point_logs::Model>::new()]) // weekly
            .append_query_results([Vec::<crate::entities::point_logs::Model>::new()]) // monthly
            .append_query_results([Vec::<crate::entities::solutions::Model>::new()]) // stats
            .append_query_results([Vec::<crate::entities::solutions::Model>::new()]) // accurate_votes solutions
            .append_query_results([Vec::<crate::entities::categories::Model>::new()]) // all_categories
            .into_connection();
        let state = test_app_state(db);
        let result = RankingsService::get_my_ranking_detail(&state, fixtures::test_uuid(10)).await;
        assert!(result.is_ok());
        let resp = result.unwrap();
        assert_eq!(resp.overall_rank, 1);
        assert_eq!(resp.total_points, 100);
        assert_eq!(resp.weekly_points, 0);
        assert_eq!(resp.monthly_points, 0);
        assert!(resp.category_rankings.is_empty());
    }

    #[tokio::test]
    async fn get_rankings_populates_solution_stats_and_period_points() {
        use crate::tests::helpers::test_app_state;

        // User: 1
        // solution_stats: 2 solutions for user → 1 adopted, 1 verified
        // period points: 2 logs summing to 15
        let user = fixtures::user_model();
        let mut sol1 = fixtures::solution_model();
        sol1.is_adopted = true;
        let mut sol2 = fixtures::solution_model();
        sol2.id = fixtures::test_uuid(32);
        sol2.is_verified = true;

        let mut log1 = fixtures::point_log_model();
        log1.points = 10;
        let mut log2 = fixtures::point_log_model();
        log2.id = fixtures::test_uuid(31);
        log2.points = 5;

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![user]]) // users
            .append_query_results([[fixtures::count_row(1)]]) // count
            .append_query_results([vec![sol1, sol2]]) // solutions stats
            .append_query_results([vec![log1, log2]]) // point logs
            .into_connection();
        let state = test_app_state(db);
        let resp = RankingsService::get_rankings(&state, "weekly", Pagination::new(1, 20), None)
            .await
            .expect("ok");
        assert_eq!(resp.data.len(), 1);
        let item = &resp.data[0];
        assert_eq!(item.solution_count, 2);
        assert_eq!(item.adopted_count, 1);
        assert_eq!(item.verified_count, 1);
        assert_eq!(item.weekly_points, 15);
    }

    #[tokio::test]
    async fn get_category_rankings_with_one_user_and_points() {
        use crate::tests::helpers::test_app_state;

        // 1. categories find → Some(category)
        // 2. Users::find().all → [user]
        // 3. get_users_category_points for all users:
        //    a. subcategories for category → [sub]
        //    b. spots for subcategories → [spot]
        //    c. solutions filtered → [solution]
        //    d. point_logs for solutions → [log w/ 20 points]
        // 4. subcategories for spots lookup → [sub]
        // 5. spots for those subs → [spot]
        // 6. solutions for spots filtered by paginated user_ids → [solution]
        let user = fixtures::user_model();
        let category = fixtures::category_model();
        let sub = fixtures::subcategory_model();
        let spot = fixtures::spot_model();
        let solution = fixtures::solution_model();
        let mut log = fixtures::point_log_model();
        log.points = 20;
        log.ref_type = Some("solution".to_string());
        log.ref_id = Some(solution.id);

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![category.clone()]]) // category find
            .append_query_results([vec![user]]) // all users
            // get_users_category_points: subs, spots, solutions, point_logs
            .append_query_results([vec![sub.clone()]])
            .append_query_results([vec![spot.clone()]])
            .append_query_results([vec![solution.clone()]])
            .append_query_results([vec![log]])
            // subcategories (2nd, for outer fn after filter)
            .append_query_results([vec![sub]])
            // spots for subs
            .append_query_results([vec![spot]])
            // solutions for spots+users
            .append_query_results([vec![solution]])
            .into_connection();
        let state = test_app_state(db);
        let resp =
            RankingsService::get_category_rankings(&state, "fashion", Pagination::new(1, 20))
                .await
                .expect("ok");
        assert_eq!(resp.category_code, "fashion");
        assert_eq!(resp.data.len(), 1);
        assert_eq!(resp.data[0].category_points, 20);
        assert_eq!(resp.data[0].rank, 1);
    }

    #[tokio::test]
    async fn get_my_ranking_detail_db_error() {
        use crate::tests::helpers::test_app_state;

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_errors(vec![sea_orm::DbErr::Custom("down".into())])
            .into_connection();
        let state = test_app_state(db);
        let result = RankingsService::get_my_ranking_detail(&state, fixtures::test_uuid(10)).await;
        assert!(result.is_err());
    }
}
