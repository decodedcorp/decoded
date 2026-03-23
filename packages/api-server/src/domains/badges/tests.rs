//! Badges 도메인 테스트
//!
//! 뱃지 시스템 단위 테스트

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use crate::domains::badges::dto::{BadgeCriteria, BadgeProgress, BadgeRarity, BadgeType};
    use serde_json::json;

    /// BadgeType 직렬화/역직렬화 테스트
    #[test]
    fn test_badge_type_serialization() {
        let badge_type = BadgeType::Specialist;
        let serialized = serde_json::to_string(&badge_type).unwrap();
        assert_eq!(serialized, "\"specialist\"");

        let deserialized: BadgeType = serde_json::from_str(&serialized).unwrap();
        assert_eq!(deserialized, BadgeType::Specialist);
    }

    /// BadgeRarity 직렬화/역직렬화 테스트
    #[test]
    fn test_badge_rarity_serialization() {
        let rarity = BadgeRarity::Epic;
        let serialized = serde_json::to_string(&rarity).unwrap();
        assert_eq!(serialized, "\"epic\"");

        let deserialized: BadgeRarity = serde_json::from_str(&serialized).unwrap();
        assert_eq!(deserialized, BadgeRarity::Epic);
    }

    /// BadgeCriteria 직렬화/역직렬화 테스트
    #[test]
    fn test_badge_criteria_serialization() {
        let criteria = BadgeCriteria {
            criteria_type: "count".to_string(),
            target: None,
            threshold: 30,
        };

        let serialized = serde_json::to_string(&criteria).unwrap();
        let deserialized: BadgeCriteria = serde_json::from_str(&serialized).unwrap();

        assert_eq!(deserialized.criteria_type, "count");
        assert_eq!(deserialized.threshold, 30);
    }

    /// BadgeCriteria with target 테스트
    #[test]
    fn test_badge_criteria_with_target() {
        let json = json!({
            "type": "artist",
            "target": "Jennie",
            "threshold": 30
        });

        let deserialized: BadgeCriteria = serde_json::from_value(json).unwrap();
        assert_eq!(deserialized.criteria_type, "artist");
        assert_eq!(deserialized.target, Some("Jennie".to_string()));
        assert_eq!(deserialized.threshold, 30);
    }

    /// BadgeProgress 완료 여부 테스트
    #[test]
    fn test_badge_progress_completion() {
        let progress_completed = BadgeProgress {
            current: 35,
            threshold: 30,
            completed: true,
        };
        assert!(progress_completed.completed);

        let progress_incomplete = BadgeProgress {
            current: 25,
            threshold: 30,
            completed: false,
        };
        assert!(!progress_incomplete.completed);
    }

    /// BadgeType variants 테스트
    #[test]
    fn test_badge_type_variants() {
        assert_eq!(BadgeType::Specialist, BadgeType::Specialist);
        assert_eq!(BadgeType::Category, BadgeType::Category);
        assert_eq!(BadgeType::Achievement, BadgeType::Achievement);
        assert_eq!(BadgeType::Milestone, BadgeType::Milestone);
    }

    /// BadgeRarity variants 테스트
    #[test]
    fn test_badge_rarity_variants() {
        assert_eq!(BadgeRarity::Common, BadgeRarity::Common);
        assert_eq!(BadgeRarity::Rare, BadgeRarity::Rare);
        assert_eq!(BadgeRarity::Epic, BadgeRarity::Epic);
        assert_eq!(BadgeRarity::Legendary, BadgeRarity::Legendary);
    }
}
