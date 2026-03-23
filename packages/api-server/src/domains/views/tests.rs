//! Views 도메인 테스트 — 엔티티/스키마 계약

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use sea_orm::Iden;

    #[test]
    fn view_logs_column_reference_type_sql_name() {
        assert_eq!(
            crate::entities::view_logs::Column::ReferenceType.to_string(),
            "reference_type"
        );
    }
}
