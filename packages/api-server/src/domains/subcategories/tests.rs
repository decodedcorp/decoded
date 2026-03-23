//! Subcategories 도메인 테스트

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use crate::domains::subcategories::dto::SubcategoryName;
    use serde_json::json;

    #[test]
    fn subcategory_name_roundtrips() {
        let n = SubcategoryName {
            ko: "가방".to_string(),
            en: "bags".to_string(),
        };
        let v = serde_json::to_value(&n).unwrap();
        let back: SubcategoryName = serde_json::from_value(v).unwrap();
        assert_eq!(back.ko, "가방");
        assert_eq!(back.en, "bags");
    }

    #[test]
    fn subcategory_name_from_json() {
        let v = json!({ "ko": "k", "en": "e" });
        let n: SubcategoryName = serde_json::from_value(v).unwrap();
        assert_eq!(n.ko, "k");
    }
}
