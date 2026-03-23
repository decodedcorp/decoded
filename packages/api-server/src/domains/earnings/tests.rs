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
}
