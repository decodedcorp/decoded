//! Categories 도메인 테스트

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use crate::domains::categories::dto::CategoryName;
    use serde_json::json;

    #[test]
    fn category_name_roundtrips_json() {
        let name = CategoryName {
            ko: "패션".to_string(),
            en: "fashion".to_string(),
            ja: None,
        };
        let v = serde_json::to_value(&name).unwrap();
        assert_eq!(v["ko"], "패션");
        let back: CategoryName = serde_json::from_value(v).unwrap();
        assert_eq!(back.en, "fashion");
    }

    #[test]
    fn category_name_deserializes_from_snake_keys() {
        let v = json!({ "ko": "a", "en": "b" });
        let n: CategoryName = serde_json::from_value(v).unwrap();
        assert_eq!(n.ko, "a");
    }
}
