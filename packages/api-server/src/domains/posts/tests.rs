//! Posts 도메인 테스트 (최소 스모크 — DTO 계약)

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use crate::domains::posts::dto::MediaSourceDto;
    use serde_json::json;

    #[test]
    fn media_source_dto_serializes_type_alias() {
        let m = MediaSourceDto {
            media_type: "drama".to_string(),
            description: Some("설명".to_string()),
        };
        let v = serde_json::to_value(&m).unwrap();
        assert_eq!(v["type"], "drama");
    }

    #[test]
    fn media_source_dto_roundtrips() {
        let v = json!({
            "type": "movie",
            "description": null
        });
        let m: MediaSourceDto = serde_json::from_value(v).unwrap();
        assert_eq!(m.media_type, "movie");
        assert!(m.description.is_none());
    }
}
