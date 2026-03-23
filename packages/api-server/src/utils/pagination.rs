use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Debug, Clone, Deserialize, ToSchema)]
pub struct Pagination {
    #[serde(default = "default_page")]
    pub page: u64,
    #[serde(default = "default_per_page")]
    pub per_page: u64,
}

fn default_page() -> u64 {
    1
}

fn default_per_page() -> u64 {
    20
}

impl Pagination {
    pub fn new(page: u64, per_page: u64) -> Self {
        Self {
            page: page.max(1),
            per_page: per_page.clamp(1, 100), // 최대 100개
        }
    }

    pub fn offset(&self) -> u64 {
        (self.page - 1) * self.per_page
    }

    pub fn limit(&self) -> u64 {
        self.per_page
    }
}

impl Default for Pagination {
    fn default() -> Self {
        Self {
            page: 1,
            per_page: 20,
        }
    }
}

#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub pagination: PaginationMeta,
}

#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct PaginationMeta {
    pub current_page: u64,
    pub per_page: u64,
    pub total_items: u64,
    pub total_pages: u64,
}

impl<T> PaginatedResponse<T> {
    pub fn new(data: Vec<T>, pagination: Pagination, total_items: u64) -> Self {
        let total_pages = total_items.div_ceil(pagination.per_page);

        Self {
            data,
            pagination: PaginationMeta {
                current_page: pagination.page,
                per_page: pagination.per_page,
                total_items,
                total_pages,
            },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pagination_new_clamps_page_and_per_page() {
        let p = Pagination::new(0, 500);
        assert_eq!(p.page, 1);
        assert_eq!(p.per_page, 100);
        assert_eq!(p.offset(), 0);
        assert_eq!(p.limit(), 100);
    }

    #[test]
    fn pagination_offset_second_page() {
        let p = Pagination::new(2, 10);
        assert_eq!(p.offset(), 10);
        assert_eq!(p.limit(), 10);
    }

    #[test]
    fn pagination_default() {
        let p = Pagination::default();
        assert_eq!(p.page, 1);
        assert_eq!(p.per_page, 20);
    }

    #[test]
    fn paginated_response_totals() {
        let pg = Pagination::new(1, 10);
        let r: PaginatedResponse<i32> = PaginatedResponse::new(vec![1, 2, 3], pg, 25);
        assert_eq!(r.data.len(), 3);
        assert_eq!(r.pagination.total_items, 25);
        assert_eq!(r.pagination.total_pages, 3);
        assert_eq!(r.pagination.current_page, 1);
        assert_eq!(r.pagination.per_page, 10);
    }

    #[test]
    fn paginated_response_zero_items() {
        let pg = Pagination::new(1, 20);
        let r: PaginatedResponse<()> = PaginatedResponse::new(vec![], pg, 0);
        assert_eq!(r.pagination.total_pages, 0);
    }
}
