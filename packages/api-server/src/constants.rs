//! 프로젝트 전역 상수 정의

/// Post 상태 상수
pub mod post_status {
    /// 활성 상태
    pub const ACTIVE: &str = "active";
    /// 숨김 상태
    pub const HIDDEN: &str = "hidden";
}

/// Spot 상태 상수
pub mod spot_status {
    /// 답변 대기 중
    pub const OPEN: &str = "open";
    /// 답변 완료/해결됨
    pub const SOLVED: &str = "solved";
}

/// Solution 상태 상수
pub mod solution_status {
    /// 활성 상태
    pub const ACTIVE: &str = "active";
    /// 삭제됨
    pub const DELETED: &str = "deleted";
}

/// Comment 상태 상수
pub mod comment_status {
    /// 활성 상태
    pub const ACTIVE: &str = "active";
    /// 삭제됨
    pub const DELETED: &str = "deleted";
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn status_constants_match_contract() {
        assert_eq!(post_status::ACTIVE, "active");
        assert_eq!(post_status::HIDDEN, "hidden");
        assert_eq!(spot_status::OPEN, "open");
        assert_eq!(spot_status::SOLVED, "solved");
        assert_eq!(solution_status::ACTIVE, "active");
        assert_eq!(solution_status::DELETED, "deleted");
        assert_eq!(comment_status::ACTIVE, "active");
        assert_eq!(comment_status::DELETED, "deleted");
    }
}
