use std::str::FromStr;

use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;
use validator::Validate;

/// 투표 타입
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum VoteType {
    /// 정확해요
    Accurate,
    /// 달라요
    Different,
}

impl VoteType {
    pub fn as_str(&self) -> &'static str {
        match self {
            VoteType::Accurate => "accurate",
            VoteType::Different => "different",
        }
    }
}

impl FromStr for VoteType {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "accurate" => Ok(VoteType::Accurate),
            "different" => Ok(VoteType::Different),
            _ => Err(()),
        }
    }
}

/// 투표 생성 요청
#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct CreateVoteDto {
    /// 투표 타입 (accurate | different)
    pub vote_type: VoteType,
}

/// 투표 응답
#[derive(Debug, Serialize, ToSchema)]
pub struct VoteResponse {
    pub id: Uuid,
    pub solution_id: Uuid,
    pub user_id: Uuid,
    pub vote_type: VoteType,
    #[serde(with = "chrono::serde::ts_seconds")]
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// 투표 현황 응답
#[derive(Debug, Serialize, ToSchema)]
pub struct VoteStatsResponse {
    pub solution_id: Uuid,
    pub accurate_count: i32,
    pub different_count: i32,
    pub total_count: i32,
    /// 정확도 (0.0 ~ 1.0)
    pub accuracy_rate: f64,
    /// 사용자의 투표 여부 (로그인한 경우)
    pub user_vote: Option<VoteType>,
}

/// 채택 요청
#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct AdoptSolutionDto {
    /// Match 타입 (perfect | close)
    #[validate(custom(function = "validate_match_type"))]
    pub match_type: String,
}

fn validate_match_type(match_type: &str) -> Result<(), validator::ValidationError> {
    if match_type == "perfect" || match_type == "close" {
        Ok(())
    } else {
        Err(validator::ValidationError::new("invalid_match_type"))
    }
}

/// 채택 응답
#[derive(Debug, Serialize, ToSchema)]
pub struct AdoptResponse {
    pub solution_id: Uuid,
    pub is_adopted: bool,
    pub match_type: String,
    #[serde(with = "chrono::serde::ts_seconds")]
    pub adopted_at: chrono::DateTime<chrono::Utc>,
    /// Perfect Match인 경우 업데이트된 Spot 정보
    pub updated_spot: Option<UpdatedSpotInfo>,
}

/// Perfect Match 시 업데이트된 Spot 정보
#[derive(Debug, Serialize, ToSchema)]
pub struct UpdatedSpotInfo {
    pub spot_id: Uuid,
    pub title: String,
    pub metadata: Option<serde_json::Value>,
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;
    use chrono::{TimeZone, Utc};
    use validator::Validate;

    #[test]
    fn vote_type_serializes_lowercase_and_roundtrips() {
        let v = VoteType::Different;
        let json = serde_json::to_string(&v).unwrap();
        assert_eq!(json, "\"different\"");
        let back: VoteType = serde_json::from_str(&json).unwrap();
        assert_eq!(back, v);
    }

    #[test]
    fn vote_type_as_str_matches_from_str() {
        assert_eq!(VoteType::Accurate.as_str(), "accurate");
        assert_eq!(VoteType::from_str("accurate").unwrap(), VoteType::Accurate);
        assert_eq!(VoteType::Different.as_str(), "different");
        assert_eq!(
            VoteType::from_str("different").unwrap(),
            VoteType::Different
        );
        assert!(VoteType::from_str("invalid").is_err());
    }

    #[test]
    fn create_vote_dto_deserializes_vote_type() {
        let dto: CreateVoteDto = serde_json::from_str(r#"{"vote_type":"accurate"}"#).unwrap();
        assert_eq!(dto.vote_type, VoteType::Accurate);
    }

    #[test]
    fn adopt_solution_dto_validates_match_type() {
        assert!(AdoptSolutionDto {
            match_type: "perfect".to_string(),
        }
        .validate()
        .is_ok());
        assert!(AdoptSolutionDto {
            match_type: "close".to_string(),
        }
        .validate()
        .is_ok());
        assert!(AdoptSolutionDto {
            match_type: "invalid".to_string(),
        }
        .validate()
        .is_err());
    }

    #[test]
    fn vote_response_serializes_created_at_as_unix_seconds() {
        let created_at = Utc.with_ymd_and_hms(2025, 3, 1, 8, 30, 0).unwrap();
        let response = VoteResponse {
            id: Uuid::nil(),
            solution_id: Uuid::nil(),
            user_id: Uuid::nil(),
            vote_type: VoteType::Accurate,
            created_at,
        };
        let v: serde_json::Value = serde_json::to_value(&response).unwrap();
        assert_eq!(
            v["created_at"],
            serde_json::Value::from(created_at.timestamp())
        );
    }

    #[test]
    fn vote_stats_response_serializes_user_vote_and_counts() {
        let response = VoteStatsResponse {
            solution_id: Uuid::nil(),
            accurate_count: 3,
            different_count: 1,
            total_count: 4,
            accuracy_rate: 0.75,
            user_vote: Some(VoteType::Different),
        };
        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("\"user_vote\":\"different\""));
        let v: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(v["accurate_count"], 3);
        assert_eq!(v["accuracy_rate"], 0.75);
    }

    #[test]
    fn adopt_response_and_updated_spot_serialize() {
        let adopted_at = Utc.with_ymd_and_hms(2025, 3, 10, 0, 0, 0).unwrap();
        let response = AdoptResponse {
            solution_id: Uuid::nil(),
            is_adopted: true,
            match_type: "perfect".to_string(),
            adopted_at,
            updated_spot: Some(UpdatedSpotInfo {
                spot_id: Uuid::nil(),
                title: "Spot".to_string(),
                metadata: Some(serde_json::json!({ "k": "v" })),
            }),
        };
        let v: serde_json::Value = serde_json::to_value(&response).unwrap();
        assert_eq!(
            v["adopted_at"],
            serde_json::Value::from(adopted_at.timestamp())
        );
        assert_eq!(v["match_type"], "perfect");
        assert!(v["updated_spot"].is_object());
    }
}
