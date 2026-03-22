//! Badges 도메인 DTO
//!
//! 뱃지 요청/응답 데이터 전송 객체

use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

/// 뱃지 타입
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "lowercase")]
pub enum BadgeType {
    /// 특정 셀럽 관련 전문가
    Specialist,
    /// 카테고리 마스터
    Category,
    /// 업적
    Achievement,
    /// 마일스톤
    Milestone,
    /// 탐험가 (Post/Spot 조회 활동)
    Explorer,
    /// 쇼퍼 (Solution 클릭 활동)
    Shopper,
}

/// 뱃지 희귀도
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "lowercase")]
pub enum BadgeRarity {
    /// 일반
    Common,
    /// 희귀
    Rare,
    /// 에픽
    Epic,
    /// 전설
    Legendary,
}

/// 뱃지 획득 조건 (criteria JSONB)
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct BadgeCriteria {
    /// 조건 타입: count, verified, adopted, artist, group, category, explorer_post, explorer_spot, shopper_solution
    #[serde(rename = "type")]
    pub criteria_type: String,
    /// 대상 (아티스트명, 그룹명, 카테고리 코드 등)
    pub target: Option<String>,
    /// 임계값 (예: 30개 이상)
    pub threshold: i32,
}

/// 뱃지 응답
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct BadgeResponse {
    pub id: Uuid,
    #[serde(rename = "type")]
    pub badge_type: BadgeType,
    pub name: String,
    pub description: Option<String>,
    pub icon_url: Option<String>,
    pub criteria: BadgeCriteria,
    pub rarity: BadgeRarity,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// 내 뱃지 항목 (획득한 뱃지)
#[derive(Debug, Serialize, ToSchema)]
pub struct EarnedBadgeItem {
    #[serde(flatten)]
    pub badge: BadgeResponse,
    /// 획득 시각
    pub earned_at: chrono::DateTime<chrono::Utc>,
    /// 진행도 (항상 완료됨)
    pub progress: BadgeProgress,
}

/// 진행 중인 뱃지 항목
#[derive(Debug, Serialize, ToSchema)]
pub struct AvailableBadgeItem {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub icon_url: Option<String>,
    pub rarity: BadgeRarity,
    /// 진행도
    pub progress: BadgeProgress,
}

/// 뱃지 진행도
#[derive(Debug, Serialize, ToSchema)]
pub struct BadgeProgress {
    /// 현재 값
    pub current: i32,
    /// 목표 값
    pub threshold: i32,
    /// 완료 여부
    pub completed: bool,
}

/// 내 뱃지 응답
#[derive(Debug, Serialize, ToSchema)]
pub struct MyBadgesResponse {
    /// 획득한 뱃지 목록
    pub data: Vec<EarnedBadgeItem>,
    /// 진행 중인 뱃지 목록
    pub available_badges: Vec<AvailableBadgeItem>,
}

/// 뱃지 목록 응답
#[derive(Debug, Serialize, ToSchema)]
pub struct BadgeListResponse {
    pub data: Vec<BadgeResponse>,
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;
    use chrono::{TimeZone, Utc};

    #[test]
    fn badge_type_and_rarity_json_roundtrip() {
        let t = BadgeType::Explorer;
        let json = serde_json::to_string(&t).unwrap();
        assert_eq!(json, "\"explorer\"");
        assert_eq!(serde_json::from_str::<BadgeType>(&json).unwrap(), t);

        let r = BadgeRarity::Legendary;
        let json_r = serde_json::to_string(&r).unwrap();
        assert_eq!(json_r, "\"legendary\"");
        assert_eq!(serde_json::from_str::<BadgeRarity>(&json_r).unwrap(), r);
    }

    #[test]
    fn badge_criteria_serializes_type_rename_and_roundtrips() {
        let c = BadgeCriteria {
            criteria_type: "category".to_string(),
            target: Some("tech".to_string()),
            threshold: 42,
        };
        let json = serde_json::to_string(&c).unwrap();
        assert!(json.contains("\"type\":\"category\""));
        assert!(json.contains("\"target\":\"tech\""));
        let back: BadgeCriteria = serde_json::from_str(&json).unwrap();
        assert_eq!(back.criteria_type, "category");
        assert_eq!(back.threshold, 42);
    }

    #[test]
    fn badge_response_and_list_serialize() {
        let created_at = Utc.with_ymd_and_hms(2024, 6, 1, 12, 0, 0).unwrap();
        let badge = BadgeResponse {
            id: Uuid::nil(),
            badge_type: BadgeType::Specialist,
            name: "Pro".to_string(),
            description: Some("desc".to_string()),
            icon_url: None,
            criteria: BadgeCriteria {
                criteria_type: "count".to_string(),
                target: None,
                threshold: 1,
            },
            rarity: BadgeRarity::Rare,
            created_at,
        };
        let list = BadgeListResponse { data: vec![badge] };
        let v: serde_json::Value = serde_json::to_value(&list).unwrap();
        assert_eq!(v["data"][0]["type"], "specialist");
        assert_eq!(v["data"][0]["name"], "Pro");
    }

    #[test]
    fn earned_and_available_badge_items_serialize() {
        let created_at = Utc.with_ymd_and_hms(2024, 1, 1, 0, 0, 0).unwrap();
        let earned_at = Utc.with_ymd_and_hms(2024, 2, 1, 0, 0, 0).unwrap();
        let badge = BadgeResponse {
            id: Uuid::nil(),
            badge_type: BadgeType::Shopper,
            name: "Shopper".to_string(),
            description: None,
            icon_url: None,
            criteria: BadgeCriteria {
                criteria_type: "shopper_solution".to_string(),
                target: None,
                threshold: 10,
            },
            rarity: BadgeRarity::Common,
            created_at,
        };
        let earned = EarnedBadgeItem {
            badge,
            earned_at,
            progress: BadgeProgress {
                current: 10,
                threshold: 10,
                completed: true,
            },
        };
        let available = AvailableBadgeItem {
            id: Uuid::nil(),
            name: "Next".to_string(),
            description: None,
            icon_url: None,
            rarity: BadgeRarity::Epic,
            progress: BadgeProgress {
                current: 3,
                threshold: 5,
                completed: false,
            },
        };
        let my = MyBadgesResponse {
            data: vec![earned],
            available_badges: vec![available],
        };
        let v: serde_json::Value = serde_json::to_value(&my).unwrap();
        assert!(v["data"][0]["earned_at"].is_string());
        assert_eq!(v["data"][0]["progress"]["completed"], true);
        assert_eq!(v["available_badges"][0]["rarity"], "epic");
    }
}
