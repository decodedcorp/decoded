//! Earnings DTO (Data Transfer Objects)
//!
//! API 요청/응답에 사용되는 데이터 구조

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;
use validator::Validate;

/// 클릭 기록 요청
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, Validate)]
pub struct CreateClickDto {
    /// Solution ID
    pub solution_id: Uuid,

    /// HTTP Referrer (선택사항)
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(length(max = 2048))]
    pub referrer: Option<String>,
}

/// 월별 클릭 통계
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct MonthlyClickStats {
    /// 월 (YYYY-MM 형식)
    pub month: String,

    /// 클릭 수
    pub clicks: i64,

    /// 고유 클릭 수
    pub unique_clicks: i64,
}

/// 클릭 통계 응답
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct ClickStatsResponse {
    /// 총 클릭 수
    pub total_clicks: i64,

    /// 고유 클릭 수 (중복 제거)
    pub unique_clicks: i64,

    /// 월별 통계
    pub monthly_stats: Vec<MonthlyClickStats>,
}

/// 월별 수익 통계 (임시 구현용)
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct MonthlyEarnings {
    /// 월 (YYYY-MM 형식)
    pub month: String,

    /// 총 수익
    pub gross_earnings: i64,

    /// 플랫폼 수수료
    pub platform_fee: i64,

    /// 순 수익
    pub net_earnings: i64,

    /// 상태
    pub status: String,
}

/// 수익 현황 응답 (임시 구현)
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct EarningsResponse {
    /// 총 수익
    pub total_earnings: i64,

    /// 사용 가능 잔액
    pub available_balance: i64,

    /// 정산 대기 중인 금액
    pub pending_settlement: i64,

    /// 월별 수익 내역
    pub monthly_earnings: Vec<MonthlyEarnings>,
}

/// 정산 내역 응답 (임시 구현)
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct SettlementItem {
    /// 정산 ID
    pub id: Uuid,

    /// 정산 금액
    pub amount: String,

    /// 통화
    pub currency: String,

    /// 상태
    pub status: String,

    /// 생성일시
    pub created_at: DateTime<Utc>,
}

/// 정산 목록 응답 (임시 구현)
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct SettlementsResponse {
    /// 정산 내역 목록
    pub data: Vec<SettlementItem>,
}

/// 출금 신청 요청 (임시 구현용)
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct WithdrawRequest {
    /// 출금 금액
    pub amount: i64,

    /// 은행 코드
    pub bank_code: String,

    /// 계좌번호
    pub account_number: String,

    /// 예금주명
    pub account_holder: String,
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;
    use validator::Validate;

    #[test]
    fn create_click_dto_json_roundtrip_with_referrer() {
        let solution_id = Uuid::new_v4();
        let dto = CreateClickDto {
            solution_id,
            referrer: Some("https://example.com/path".to_string()),
        };
        let json = serde_json::to_string(&dto).unwrap();
        let parsed: CreateClickDto = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.solution_id, solution_id);
        assert_eq!(parsed.referrer.as_deref(), Some("https://example.com/path"));
    }

    #[test]
    fn create_click_dto_skips_referrer_when_none() {
        let dto = CreateClickDto {
            solution_id: Uuid::new_v4(),
            referrer: None,
        };
        let json = serde_json::to_string(&dto).unwrap();
        assert!(!json.contains("referrer"));
    }

    #[test]
    fn create_click_dto_rejects_referrer_over_max_length() {
        let dto = CreateClickDto {
            solution_id: Uuid::new_v4(),
            referrer: Some("x".repeat(2049)),
        };
        assert!(dto.validate().is_err());
    }

    #[test]
    fn create_click_dto_accepts_referrer_at_max_length() {
        let dto = CreateClickDto {
            solution_id: Uuid::new_v4(),
            referrer: Some("x".repeat(2048)),
        };
        assert!(dto.validate().is_ok());
    }

    #[test]
    fn click_stats_and_monthly_roundtrip() {
        let original = ClickStatsResponse {
            total_clicks: 100,
            unique_clicks: 40,
            monthly_stats: vec![MonthlyClickStats {
                month: "2025-03".to_string(),
                clicks: 10,
                unique_clicks: 7,
            }],
        };
        let json = serde_json::to_string(&original).unwrap();
        let parsed: ClickStatsResponse = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.total_clicks, original.total_clicks);
        assert_eq!(parsed.unique_clicks, original.unique_clicks);
        assert_eq!(parsed.monthly_stats.len(), 1);
        assert_eq!(parsed.monthly_stats[0].month, "2025-03");
    }

    #[test]
    fn earnings_response_roundtrip() {
        let original = EarningsResponse {
            total_earnings: 5000,
            available_balance: 3000,
            pending_settlement: 2000,
            monthly_earnings: vec![MonthlyEarnings {
                month: "2025-02".to_string(),
                gross_earnings: 1000,
                platform_fee: 100,
                net_earnings: 900,
                status: "pending".to_string(),
            }],
        };
        let json = serde_json::to_string(&original).unwrap();
        let parsed: EarningsResponse = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.total_earnings, original.total_earnings);
        assert_eq!(parsed.monthly_earnings[0].net_earnings, 900);
    }

    #[test]
    fn settlement_item_and_list_roundtrip() {
        let created_at = DateTime::parse_from_rfc3339("2025-03-01T12:00:00Z")
            .unwrap()
            .with_timezone(&Utc);
        let item = SettlementItem {
            id: Uuid::nil(),
            amount: "12000".to_string(),
            currency: "KRW".to_string(),
            status: "completed".to_string(),
            created_at,
        };
        let response = SettlementsResponse {
            data: vec![item.clone()],
        };
        let json = serde_json::to_string(&response).unwrap();
        let parsed: SettlementsResponse = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.data.len(), 1);
        assert_eq!(parsed.data[0].amount, item.amount);
        assert_eq!(parsed.data[0].created_at, item.created_at);
    }

    #[test]
    fn withdraw_request_roundtrip() {
        let original = WithdrawRequest {
            amount: 50_000,
            bank_code: "004".to_string(),
            account_number: "1234567890".to_string(),
            account_holder: "홍길동".to_string(),
        };
        let json = serde_json::to_string(&original).unwrap();
        let parsed: WithdrawRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.amount, original.amount);
        assert_eq!(parsed.bank_code, "004");
    }
}
