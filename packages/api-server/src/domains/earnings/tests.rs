//! Earnings 도메인 단위 테스트 (DTO 등, DB 없음)

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use crate::domains::earnings::dto::{
        ClickStatsResponse, CreateClickDto, EarningsResponse, MonthlyClickStats, MonthlyEarnings,
        SettlementsResponse, WithdrawRequest,
    };
    use uuid::Uuid;

    /// CreateClickDto 직렬화/역직렬화 테스트
    #[test]
    fn test_create_click_dto_serialization() {
        let dto = CreateClickDto {
            solution_id: Uuid::new_v4(),
            referrer: Some("https://example.com".to_string()),
        };

        let serialized = serde_json::to_string(&dto).unwrap();
        let deserialized: CreateClickDto = serde_json::from_str(&serialized).unwrap();

        assert_eq!(dto.solution_id, deserialized.solution_id);
        assert_eq!(dto.referrer, deserialized.referrer);
    }

    /// CreateClickDto 최소 필드 테스트
    #[test]
    fn test_create_click_dto_minimal() {
        let dto = CreateClickDto {
            solution_id: Uuid::new_v4(),
            referrer: None,
        };

        assert!(dto.referrer.is_none());
    }

    /// ClickStatsResponse 구조 테스트
    #[test]
    fn test_click_stats_response() {
        let response = ClickStatsResponse {
            total_clicks: 100,
            unique_clicks: 50,
            monthly_stats: vec![MonthlyClickStats {
                month: "2026-01".to_string(),
                clicks: 50,
                unique_clicks: 25,
            }],
        };

        assert_eq!(response.total_clicks, 100);
        assert_eq!(response.unique_clicks, 50);
        assert_eq!(response.monthly_stats.len(), 1);
        assert_eq!(response.monthly_stats[0].month, "2026-01");
    }

    /// EarningsResponse 임시 구현 테스트 (빈 데이터)
    #[test]
    fn test_earnings_response_stub() {
        let response = EarningsResponse {
            total_earnings: 0,
            available_balance: 0,
            pending_settlement: 0,
            monthly_earnings: vec![],
        };

        assert_eq!(response.total_earnings, 0);
        assert_eq!(response.available_balance, 0);
        assert_eq!(response.pending_settlement, 0);
        assert!(response.monthly_earnings.is_empty());
    }

    /// SettlementsResponse 임시 구현 테스트 (빈 배열)
    #[test]
    fn test_settlements_response_stub() {
        let response = SettlementsResponse { data: vec![] };

        assert!(response.data.is_empty());
    }

    /// WithdrawRequest 직렬화 테스트
    #[test]
    fn test_withdraw_request_serialization() {
        let request = WithdrawRequest {
            amount: 50000,
            bank_code: "088".to_string(),
            account_number: "123456789012".to_string(),
            account_holder: "홍길동".to_string(),
        };

        let serialized = serde_json::to_string(&request).unwrap();
        let deserialized: WithdrawRequest = serde_json::from_str(&serialized).unwrap();

        assert_eq!(request.amount, deserialized.amount);
        assert_eq!(request.bank_code, deserialized.bank_code);
        assert_eq!(request.account_number, deserialized.account_number);
        assert_eq!(request.account_holder, deserialized.account_holder);
    }

    /// MonthlyClickStats 구조 테스트
    #[test]
    fn test_monthly_click_stats() {
        let stats = MonthlyClickStats {
            month: "2026-01".to_string(),
            clicks: 100,
            unique_clicks: 50,
        };

        assert_eq!(stats.month, "2026-01");
        assert_eq!(stats.clicks, 100);
        assert_eq!(stats.unique_clicks, 50);
    }

    /// MonthlyEarnings 구조 테스트
    #[test]
    fn test_monthly_earnings() {
        let earnings = MonthlyEarnings {
            month: "2026-01".to_string(),
            gross_earnings: 60000,
            platform_fee: 24000,
            net_earnings: 36000,
            status: "settled".to_string(),
        };

        assert_eq!(earnings.month, "2026-01");
        assert_eq!(earnings.gross_earnings, 60000);
        assert_eq!(earnings.platform_fee, 24000);
        assert_eq!(earnings.net_earnings, 36000);
        assert_eq!(earnings.status, "settled");
    }

    // ── validate_user_agent ──

    #[test]
    fn validate_user_agent_accepts_chrome() {
        use crate::domains::earnings::service::validate_user_agent;
        let ua =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120".to_string();
        assert!(validate_user_agent(Some(&ua)));
    }

    #[test]
    fn validate_user_agent_accepts_safari() {
        use crate::domains::earnings::service::validate_user_agent;
        let ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari/605.1.15".to_string();
        assert!(validate_user_agent(Some(&ua)));
    }

    #[test]
    fn validate_user_agent_accepts_firefox() {
        use crate::domains::earnings::service::validate_user_agent;
        let ua =
            "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/120.0".to_string();
        assert!(validate_user_agent(Some(&ua)));
    }

    #[test]
    fn validate_user_agent_rejects_none() {
        use crate::domains::earnings::service::validate_user_agent;
        assert!(!validate_user_agent(None));
    }

    #[test]
    fn validate_user_agent_rejects_bot() {
        use crate::domains::earnings::service::validate_user_agent;
        let ua = "Googlebot/2.1 (+http://www.google.com/bot.html)".to_string();
        assert!(!validate_user_agent(Some(&ua)));
    }

    #[test]
    fn validate_user_agent_rejects_curl() {
        use crate::domains::earnings::service::validate_user_agent;
        let ua = "curl/7.81.0".to_string();
        assert!(!validate_user_agent(Some(&ua)));
    }

    #[test]
    fn validate_user_agent_case_insensitive() {
        use crate::domains::earnings::service::validate_user_agent;
        let ua = "MOZILLA/5.0 CHROME/120".to_string();
        assert!(validate_user_agent(Some(&ua)));
    }
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod mock_db_tests {
    use crate::domains::earnings::service;
    use crate::tests::fixtures;
    use sea_orm::{DatabaseBackend, MockDatabase};

    #[tokio::test]
    async fn create_click_log_solution_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::solutions::Model>::new()])
            .into_connection();
        let result = service::create_click_log(
            &db,
            Some(fixtures::test_uuid(10)),
            fixtures::test_uuid(3),
            "127.0.0.1".to_string(),
            Some("Mozilla/5.0 Chrome/120".to_string()),
            None,
        )
        .await;
        assert!(matches!(result, Err(crate::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn create_click_log_duplicate_silently_ignored() {
        // get_solution_by_id (solution + user) → duplicate count > 0 → Ok(())
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .append_query_results([[fixtures::user_model()]])
            .append_query_results([[fixtures::count_row(1)]])
            .into_connection();
        let result = service::create_click_log(
            &db,
            Some(fixtures::test_uuid(10)),
            fixtures::test_uuid(3),
            "127.0.0.1".to_string(),
            Some("Mozilla/5.0 Chrome/120".to_string()),
            None,
        )
        .await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
    }

    #[tokio::test]
    async fn create_click_log_ip_rate_limited() {
        // get_solution_by_id + duplicate=0 + ip count >=10 → BadRequest
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .append_query_results([[fixtures::user_model()]])
            .append_query_results([[fixtures::count_row(0)]])
            .append_query_results([[fixtures::count_row(10)]])
            .into_connection();
        let result = service::create_click_log(
            &db,
            Some(fixtures::test_uuid(10)),
            fixtures::test_uuid(3),
            "127.0.0.1".to_string(),
            Some("Mozilla/5.0 Chrome/120".to_string()),
            None,
        )
        .await;
        assert!(matches!(result, Err(crate::AppError::BadRequest(_))));
    }

    #[tokio::test]
    async fn create_click_log_invalid_user_agent() {
        // get_solution_by_id + duplicate=0 + ip=0 → UA validation fails → BadRequest
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .append_query_results([[fixtures::user_model()]])
            .append_query_results([[fixtures::count_row(0)]])
            .append_query_results([[fixtures::count_row(0)]])
            .into_connection();
        let result = service::create_click_log(
            &db,
            Some(fixtures::test_uuid(10)),
            fixtures::test_uuid(3),
            "127.0.0.1".to_string(),
            Some("curl/7.81.0".to_string()),
            None,
        )
        .await;
        assert!(matches!(result, Err(crate::AppError::BadRequest(_))));
    }

    #[tokio::test]
    async fn get_click_stats_by_user_empty() {
        // No solutions for this user → returns zero stats early.
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([
                Vec::<std::collections::BTreeMap<String, sea_orm::Value>>::new(),
            ])
            .into_connection();
        let result = service::get_click_stats_by_user(&db, fixtures::test_uuid(99)).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let stats = result.unwrap();
        assert_eq!(stats.total_clicks, 0);
        assert_eq!(stats.unique_clicks, 0);
        assert!(stats.monthly_stats.is_empty());
    }
}
