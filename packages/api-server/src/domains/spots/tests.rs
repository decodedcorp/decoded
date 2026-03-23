//! Spots 도메인 테스트

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use crate::domains::spots::dto::CreateSpotDto;
    use uuid::Uuid;
    use validator::Validate;

    #[test]
    fn create_spot_rejects_empty_position_left() {
        let dto = CreateSpotDto {
            position_left: String::new(),
            position_top: "12%".to_string(),
            category_id: Uuid::nil(),
        };
        assert!(dto.validate().is_err());
    }
}
