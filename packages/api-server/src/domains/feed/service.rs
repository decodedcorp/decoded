//! Feed 서비스
//!
//! 피드 비즈니스 로직

use sea_orm::{
    ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait, QueryFilter, QueryOrder,
    QuerySelect,
};
use uuid::Uuid;

use crate::{
    config::AppState,
    entities,
    error::AppResult,
    utils::pagination::{Pagination, PaginationMeta},
};

use super::dto::{
    CurationDetailResponse, CurationListItem, CurationListResponse, EditorPicksResponse, FeedItem,
    FeedResponse, FeedUser, MediaSource, TrendingResponse,
};

pub struct FeedService;

impl FeedService {
    /// 홈 피드 조회 (개인화)
    pub async fn home_feed(
        state: &AppState,
        _user_id: Option<Uuid>,
        pagination: Pagination,
    ) -> AppResult<FeedResponse> {
        // TODO: 개인화 로직 (사용자 선호 카테고리, 팔로우한 사용자 등)
        // 현재는 최신순 정렬로 구현
        let posts = entities::Posts::find()
            .filter(entities::posts::Column::Status.eq("published"))
            .order_by_desc(entities::posts::Column::CreatedAt)
            .offset(pagination.offset())
            .limit(pagination.limit())
            .all(state.db.as_ref())
            .await?;

        let total_items = entities::Posts::find()
            .filter(entities::posts::Column::Status.eq("published"))
            .count(state.db.as_ref())
            .await?;

        let data = Self::posts_to_feed_items(state.db.as_ref(), posts).await?;

        let pagination_meta = PaginationMeta {
            current_page: pagination.page,
            per_page: pagination.per_page,
            total_items,
            total_pages: total_items.div_ceil(pagination.per_page),
        };

        Ok(FeedResponse {
            data,
            pagination: pagination_meta,
        })
    }

    /// 트렌딩 조회 (24시간 기준, 실시간 점수 계산)
    ///
    /// **알고리즘**: 점수 = (조회수 × 1) + (Solution 수 × 5) + (투표 수 × 3) + 시간 가중치
    /// - 시간 가중치: 최신 게시물일수록 높은 점수 (0~100점)
    ///
    /// **최적화 고려사항** (트래픽 증가 시):
    /// - 현재: 실시간 계산 (정확도 우선)
    /// - 배치 작업으로 trending_score 컬럼에 점수 저장 완료 (Phase 17.4)
    /// - 향후 개선: 저장된 trending_score 우선 사용, NULL인 경우에만 실시간 계산
    /// - 옵션 1: Redis 캐싱 (5~10분 TTL)
    /// - 옵션 2: Materialized View 활용
    pub async fn trending(state: &AppState, pagination: Pagination) -> AppResult<TrendingResponse> {
        let twenty_four_hours_ago = chrono::Utc::now() - chrono::Duration::hours(24);

        // 1. 최근 24시간 내 게시된 Post 조회
        let posts = entities::Posts::find()
            .filter(entities::posts::Column::Status.eq("published"))
            .filter(entities::posts::Column::CreatedAt.gte(twenty_four_hours_ago))
            .all(state.db.as_ref())
            .await?;

        // 2. 각 Post의 트렌딩 점수 계산
        let mut scored_posts = Vec::new();
        for post in posts {
            // 2-1. 해당 Post의 Spot IDs 조회
            let spot_ids: Vec<Uuid> = entities::Spots::find()
                .filter(entities::spots::Column::PostId.eq(post.id))
                .all(state.db.as_ref())
                .await?
                .into_iter()
                .map(|s| s.id)
                .collect();

            // 2-2. 최근 24시간 Solution 수 집계
            let solutions = if spot_ids.is_empty() {
                vec![]
            } else {
                entities::Solutions::find()
                    .filter(entities::solutions::Column::SpotId.is_in(spot_ids))
                    .filter(entities::solutions::Column::CreatedAt.gte(twenty_four_hours_ago))
                    .all(state.db.as_ref())
                    .await?
            };

            let solution_count = solutions.len() as i32;
            let solution_ids: Vec<Uuid> = solutions.iter().map(|s| s.id).collect();

            // 2-3. 최근 24시간 Vote 수 집계
            let vote_count = if solution_ids.is_empty() {
                0
            } else {
                entities::Votes::find()
                    .filter(entities::votes::Column::SolutionId.is_in(solution_ids))
                    .filter(entities::votes::Column::CreatedAt.gte(twenty_four_hours_ago))
                    .count(state.db.as_ref())
                    .await? as i32
            };

            // 2-4. 트렌딩 점수 계산
            let score = Self::calculate_trending_score(
                post.view_count,
                solution_count,
                vote_count,
                post.created_at.with_timezone(&chrono::Utc),
            );

            scored_posts.push((post, score));
        }

        // 3. 점수 내림차순 정렬
        scored_posts.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

        // 4. 페이지네이션 적용
        let total_items = scored_posts.len() as u64;
        let start = pagination.offset() as usize;
        let end = (start + pagination.limit() as usize).min(scored_posts.len());
        let paginated_posts: Vec<entities::PostsModel> = scored_posts[start..end]
            .iter()
            .map(|(post, _score)| post.clone())
            .collect();

        let data = Self::posts_to_feed_items(state.db.as_ref(), paginated_posts).await?;

        let pagination_meta = PaginationMeta {
            current_page: pagination.page,
            per_page: pagination.per_page,
            total_items,
            total_pages: total_items.div_ceil(pagination.per_page),
        };

        Ok(TrendingResponse {
            data,
            pagination: pagination_meta,
        })
    }

    /// 트렌딩 점수 계산
    ///
    /// 점수 = (조회수 × 1) + (Solution 수 × 5) + (투표 수 × 3) + 시간 가중치
    /// 시간 가중치: 0~24시간 전 → 100~0점 (선형 감소)
    pub(crate) fn calculate_trending_score(
        view_count: i32,
        solution_count: i32,
        vote_count: i32,
        created_at: chrono::DateTime<chrono::Utc>,
    ) -> f64 {
        let base_score =
            (view_count as f64) + (solution_count as f64 * 5.0) + (vote_count as f64 * 3.0);

        // 시간 가중치: 최신일수록 높은 점수
        let hours_ago = (chrono::Utc::now() - created_at).num_hours() as f64;
        let time_weight = ((24.0 - hours_ago) / 24.0 * 100.0).max(0.0);

        base_score + time_weight
    }

    /// 큐레이션 목록 조회
    pub async fn list_curations(state: &AppState) -> AppResult<CurationListResponse> {
        let curations = entities::Curations::find()
            .filter(entities::curations::Column::IsActive.eq(true))
            .order_by_asc(entities::curations::Column::DisplayOrder)
            .all(state.db.as_ref())
            .await?;

        let mut data = Vec::new();

        for curation in curations {
            // 각 큐레이션의 Post 개수 계산
            let post_count = entities::CurationPosts::find()
                .filter(entities::curation_posts::Column::CurationId.eq(curation.id))
                .count(state.db.as_ref())
                .await? as i32;

            data.push(CurationListItem {
                id: curation.id,
                title: curation.title,
                description: curation.description,
                cover_image_url: curation.cover_image_url,
                post_count,
            });
        }

        Ok(CurationListResponse { data })
    }

    /// 큐레이션 상세 조회
    pub async fn curation_detail(
        state: &AppState,
        curation_id: Uuid,
    ) -> AppResult<CurationDetailResponse> {
        // 큐레이션 조회
        let curation = entities::Curations::find_by_id(curation_id)
            .one(state.db.as_ref())
            .await?
            .ok_or_else(|| crate::error::AppError::NotFound("Curation not found".to_string()))?;

        // 큐레이션에 속한 Post들 조회 (display_order 순)
        let curation_posts = entities::CurationPosts::find()
            .filter(entities::curation_posts::Column::CurationId.eq(curation_id))
            .order_by_asc(entities::curation_posts::Column::DisplayOrder)
            .all(state.db.as_ref())
            .await?;

        let post_ids: Vec<Uuid> = curation_posts.iter().map(|cp| cp.post_id).collect();

        let posts = entities::Posts::find()
            .filter(entities::posts::Column::Id.is_in(post_ids.clone()))
            .all(state.db.as_ref())
            .await?;

        // display_order 순서대로 정렬
        let mut sorted_posts = Vec::new();
        for cp in curation_posts {
            if let Some(post) = posts.iter().find(|p| p.id == cp.post_id) {
                sorted_posts.push(post.clone());
            }
        }

        let feed_items = Self::posts_to_feed_items(state.db.as_ref(), sorted_posts).await?;

        Ok(CurationDetailResponse {
            id: curation.id,
            title: curation.title,
            description: curation.description,
            cover_image_url: curation.cover_image_url,
            posts: feed_items,
        })
    }

    /// 에디터 픽 조회: 활성 curation 전체에서 curation_posts 를 display_order
    /// 오름차순으로 정렬한 뒤 상위 `limit` 개의 post 를 반환한다.
    pub async fn editor_picks(state: &AppState, limit: u64) -> AppResult<EditorPicksResponse> {
        let active_curation_ids: Vec<Uuid> = entities::Curations::find()
            .filter(entities::curations::Column::IsActive.eq(true))
            .select_only()
            .column(entities::curations::Column::Id)
            .into_tuple::<Uuid>()
            .all(state.db.as_ref())
            .await?;

        if active_curation_ids.is_empty() {
            return Ok(EditorPicksResponse { data: vec![] });
        }

        let curation_posts = entities::CurationPosts::find()
            .filter(entities::curation_posts::Column::CurationId.is_in(active_curation_ids))
            .order_by_asc(entities::curation_posts::Column::DisplayOrder)
            .limit(limit)
            .all(state.db.as_ref())
            .await?;

        if curation_posts.is_empty() {
            return Ok(EditorPicksResponse { data: vec![] });
        }

        let post_ids: Vec<Uuid> = curation_posts.iter().map(|cp| cp.post_id).collect();
        let posts = entities::Posts::find()
            .filter(entities::posts::Column::Id.is_in(post_ids))
            .all(state.db.as_ref())
            .await?;

        // display_order 순 유지
        let mut ordered = Vec::with_capacity(curation_posts.len());
        for cp in curation_posts {
            if let Some(p) = posts.iter().find(|p| p.id == cp.post_id) {
                ordered.push(p.clone());
            }
        }

        let data = Self::posts_to_feed_items(state.db.as_ref(), ordered).await?;
        Ok(EditorPicksResponse { data })
    }

    /// Post 엔티티들을 FeedItem으로 변환
    async fn posts_to_feed_items(
        db: &DatabaseConnection,
        posts: Vec<entities::PostsModel>,
    ) -> AppResult<Vec<FeedItem>> {
        let mut items = Vec::new();

        for post in posts {
            // 작성자 정보 조회
            let user = entities::Users::find_by_id(post.user_id)
                .one(db)
                .await?
                .ok_or_else(|| crate::error::AppError::NotFound("User not found".to_string()))?;

            // Spot 개수 조회
            let spot_count = entities::Spots::find()
                .filter(entities::spots::Column::PostId.eq(post.id))
                .count(db)
                .await? as i32;

            // 댓글 개수 조회
            let comment_count = entities::Comments::find()
                .filter(entities::comments::Column::PostId.eq(post.id))
                .count(db)
                .await? as i32;

            items.push(FeedItem {
                id: post.id,
                user: FeedUser {
                    id: user.id,
                    username: user.username.clone(),
                    avatar_url: user.avatar_url.clone(),
                },
                image_url: post.image_url,
                media_source: Some(MediaSource {
                    type_: post.media_type.clone(),
                    title: post.title.clone(),
                }),
                artist_name: post.artist_name,
                group_name: post.group_name,
                context: post.context,
                spot_count,
                view_count: post.view_count,
                comment_count,
                created_at: post.created_at.with_timezone(&chrono::Utc),
            });
        }

        Ok(items)
    }
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;

    #[test]
    fn test_pagination_calculation() {
        let pagination = Pagination::new(2, 20);
        assert_eq!(pagination.offset(), 20);
        assert_eq!(pagination.limit(), 20);
    }

    #[test]
    fn test_trending_time_threshold() {
        let twenty_four_hours_ago = chrono::Utc::now() - chrono::Duration::hours(24);
        let now = chrono::Utc::now();

        assert!(now > twenty_four_hours_ago);
        assert_eq!((now - twenty_four_hours_ago).num_hours(), 24);
    }

    #[test]
    fn test_calculate_trending_score_basic() {
        let now = chrono::Utc::now();

        // 조회수 100, Solution 10개, Vote 5개, 방금 게시
        let score = FeedService::calculate_trending_score(100, 10, 5, now);

        // 기대값: 100 + (10 * 5) + (5 * 3) + 100(시간가중치) = 265
        assert!((score - 265.0).abs() < 1.0); // 부동소수점 오차 허용
    }

    #[test]
    fn test_calculate_trending_score_time_weight() {
        let now = chrono::Utc::now();
        let twelve_hours_ago = now - chrono::Duration::hours(12);
        let twenty_four_hours_ago = now - chrono::Duration::hours(24);

        // 같은 조회수/Solution/Vote, 다른 게시 시간
        let score_now = FeedService::calculate_trending_score(100, 0, 0, now);
        let score_12h = FeedService::calculate_trending_score(100, 0, 0, twelve_hours_ago);
        let score_24h = FeedService::calculate_trending_score(100, 0, 0, twenty_four_hours_ago);

        // 최신 게시물이 더 높은 점수
        assert!(score_now > score_12h);
        assert!(score_12h > score_24h);

        // 24시간 전 게시물의 시간 가중치는 0
        assert!((score_24h - 100.0).abs() < 1.0);
    }

    #[test]
    fn test_calculate_trending_score_weights() {
        let now = chrono::Utc::now();

        // Solution이 Vote보다 가중치가 높은지 확인
        let score_solution = FeedService::calculate_trending_score(0, 1, 0, now);
        let score_vote = FeedService::calculate_trending_score(0, 0, 1, now);

        // Solution(×5) > Vote(×3)
        assert!(score_solution > score_vote);
    }
}
