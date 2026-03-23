//! Rankings 도메인 단위 테스트 (DB 없음)

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use crate::domains::rankings::dto::RankingPeriodQuery;
    use crate::domains::rankings::service::ActivityPoints;
    use crate::utils::pagination::Pagination;

    #[test]
    fn activity_points_enum_values() {
        assert_eq!(ActivityPoints::PostCreated as i32, 5);
        assert_eq!(ActivityPoints::SpotCreated as i32, 3);
        assert_eq!(ActivityPoints::SolutionRegistered as i32, 10);
        assert_eq!(ActivityPoints::SolutionAdopted as i32, 30);
        assert_eq!(ActivityPoints::SolutionVerified as i32, 20);
        assert_eq!(ActivityPoints::VoteAccurate as i32, 2);
        assert_eq!(ActivityPoints::VoteParticipation as i32, 1);
        assert_eq!(ActivityPoints::PurchaseConversion as i32, 50);
    }

    #[test]
    fn ranking_period_query_defaults() {
        let q: RankingPeriodQuery = serde_json::from_str("{}").unwrap();
        assert_eq!(q.period, "weekly");
        assert_eq!(q.page, 1);
        assert_eq!(q.per_page, 50);
    }

    #[test]
    fn pagination_new_for_rankings() {
        let p = Pagination::new(3, 50);
        assert_eq!(p.page, 3);
        assert_eq!(p.per_page, 50);
    }
}
