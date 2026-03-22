//! Admin 도메인 — DTO 검증 등 최소 단위 테스트

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use crate::domains::admin::synonyms::CreateSynonymDto;
    use validator::Validate;

    #[test]
    fn create_synonym_rejects_empty_canonical() {
        let dto = CreateSynonymDto {
            type_: "artist".to_string(),
            canonical: String::new(),
            synonyms: vec!["alias".to_string()],
            is_active: true,
        };
        assert!(dto.validate().is_err());
    }
}
