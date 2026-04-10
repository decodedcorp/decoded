//! Rankings 서비스
//!
//! 랭킹 및 포인트 비즈니스 로직

use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait, QueryFilter,
    QueryOrder, QuerySelect, Set,
};
use std::collections::HashMap;
use uuid::Uuid;

use sea_orm::{ConnectionTrait, DbBackend, Statement};

use crate::{
    config::AppState,
    entities,
    error::{AppError, AppResult},
    utils::pagination::{Pagination, PaginationMeta},
};

use super::dto::{
    CategoryRankingItem, CategoryRankingResponse, MyRanking, MyRankingDetailResponse, RankingItem,
    RankingListResponse, RankingUser,
};

/// 활동별 포인트
pub enum ActivityPoints {
    PostCreated = 5,
    SpotCreated = 3,
    SolutionRegistered = 10,
    SolutionAdopted = 30,
    SolutionVerified = 20,
    VoteAccurate = 2,
    VoteParticipation = 1,
    PurchaseConversion = 50,
}

/// 내부 Solution 통계 구조체 (N+1 방지용)
#[derive(Debug, Default, Clone)]
struct UserSolutionStats {
    solution_count: i32,
    adopted_count: i32,
    verified_count: i32,
}

pub struct RankingsService;

impl RankingsService {
    /// 여러 사용자의 Solution 통계를 한 번에 조회 (N+1 방지)
    async fn get_users_solution_stats(
        db: &DatabaseConnection,
        user_ids: &[Uuid],
    ) -> AppResult<HashMap<Uuid, UserSolutionStats>> {
        let solutions = entities::Solutions::find()
            .filter(entities::solutions::Column::UserId.is_in(user_ids.iter().copied()))
            .all(db)
            .await?;

        let mut stats_map: HashMap<Uuid, UserSolutionStats> = HashMap::new();

        for solution in solutions {
            let stats = stats_map.entry(solution.user_id).or_default();
            stats.solution_count += 1;
            if solution.is_adopted {
                stats.adopted_count += 1;
            }
            if solution.is_verified {
                stats.verified_count += 1;
            }
        }

        Ok(stats_map)
    }

    /// 여러 사용자의 기간별 포인트를 한 번에 조회 (N+1 방지)
    async fn get_users_period_points(
        db: &DatabaseConnection,
        user_ids: &[Uuid],
        period_start: chrono::DateTime<chrono::Utc>,
    ) -> AppResult<HashMap<Uuid, i32>> {
        let point_logs = entities::PointLogs::find()
            .filter(entities::point_logs::Column::UserId.is_in(user_ids.iter().copied()))
            .filter(entities::point_logs::Column::CreatedAt.gte(period_start))
            .all(db)
            .await?;

        let mut points_map: HashMap<Uuid, i32> = HashMap::new();

        for log in point_logs {
            *points_map.entry(log.user_id).or_insert(0) += log.points;
        }

        Ok(points_map)
    }

    /// 특정 사용자의 카테고리별 순위 조회 (TOP 5)
    ///
    /// REQUIREMENT.md 4.8.1.1에 따라 사용자가 활동한 카테고리 목록 + 각 카테고리별 순위 계산
    async fn get_user_category_rankings(
        state: &AppState,
        user_id: Uuid,
    ) -> AppResult<Vec<super::dto::CategoryRank>> {
        // 1. 모든 카테고리 조회
        let all_categories = entities::Categories::find().all(state.db.as_ref()).await?;

        // 2. 각 카테고리별 사용자 포인트 계산
        let mut category_points: Vec<(entities::CategoriesModel, i32)> = Vec::new();

        for category in all_categories {
            let points_map =
                Self::get_users_category_points(state.db.as_ref(), &[user_id], category.id).await?;

            if let Some(&points) = points_map.get(&user_id) {
                if points > 0 {
                    category_points.push((category, points));
                }
            }
        }

        // 3. 포인트 기준으로 정렬 (DESC)
        category_points.sort_by(|a, b| b.1.cmp(&a.1));

        // 4. TOP 5만 선택
        category_points.truncate(5);

        // 5. 각 카테고리별 순위 계산
        let mut result = Vec::new();

        for (category, points) in category_points {
            // 해당 카테고리에서 나보다 높은 포인트를 가진 사용자 수 + 1
            let all_user_ids: Vec<Uuid> = entities::Users::find()
                .all(state.db.as_ref())
                .await?
                .iter()
                .map(|u| u.id)
                .collect();

            let all_category_points =
                Self::get_users_category_points(state.db.as_ref(), &all_user_ids, category.id)
                    .await?;

            let higher_count = all_category_points
                .values()
                .filter(|&&p| p > points)
                .count() as i32;

            let rank = higher_count + 1;

            // category.name은 JSON {"ko": "...", "en": "..."}
            let category_name = category
                .name
                .get("ko")
                .and_then(|v| v.as_str())
                .unwrap_or(&category.code)
                .to_string();

            result.push(super::dto::CategoryRank {
                category_code: category.code.clone(),
                category_name,
                rank,
                points,
            });
        }

        Ok(result)
    }

    /// 여러 사용자의 카테고리별 포인트를 한 번에 조회 (N+1 방지)
    ///
    /// REQUIREMENT.md 4.8.1.1에 따라 Solutions → Spots → Categories JOIN으로 계산
    /// ref_type='solution'인 point_logs만 집계 대상
    async fn get_users_category_points(
        db: &DatabaseConnection,
        user_ids: &[Uuid],
        category_id: Uuid,
    ) -> AppResult<HashMap<Uuid, i32>> {
        // 1. 해당 카테고리의 subcategories 조회
        let subcategories = entities::Subcategories::find()
            .filter(entities::subcategories::Column::CategoryId.eq(category_id))
            .all(db)
            .await?;

        let subcategory_ids: Vec<Uuid> = subcategories.iter().map(|s| s.id).collect();

        if subcategory_ids.is_empty() {
            return Ok(HashMap::new());
        }

        // 2. 해당 서브카테고리의 모든 Spots 조회
        let spots = entities::Spots::find()
            .filter(entities::spots::Column::SubcategoryId.is_in(subcategory_ids))
            .all(db)
            .await?;

        let spot_ids: Vec<Uuid> = spots.iter().map(|s| s.id).collect();

        if spot_ids.is_empty() {
            return Ok(HashMap::new());
        }

        // 3. 해당 Spot들의 Solutions 조회 (user_ids 필터링)
        let solutions = entities::Solutions::find()
            .filter(entities::solutions::Column::SpotId.is_in(spot_ids.iter().copied()))
            .filter(entities::solutions::Column::UserId.is_in(user_ids.iter().copied()))
            .all(db)
            .await?;

        let solution_ids: Vec<Uuid> = solutions.iter().map(|s| s.id).collect();

        if solution_ids.is_empty() {
            return Ok(HashMap::new());
        }

        // 3. 해당 Solutions에 대한 PointLogs 조회 (ref_type='solution')
        let point_logs = entities::PointLogs::find()
            .filter(entities::point_logs::Column::UserId.is_in(user_ids.iter().copied()))
            .filter(entities::point_logs::Column::RefType.eq("solution"))
            .filter(entities::point_logs::Column::RefId.is_in(solution_ids.iter().copied()))
            .all(db)
            .await?;

        // 4. 사용자별 포인트 집계
        let mut points_map: HashMap<Uuid, i32> = HashMap::new();

        for log in point_logs {
            *points_map.entry(log.user_id).or_insert(0) += log.points;
        }

        Ok(points_map)
    }

    /// 포인트 적립
    pub async fn add_points(
        db: &DatabaseConnection,
        user_id: Uuid,
        activity_type: &str,
        points: i32,
        ref_id: Option<Uuid>,
        ref_type: Option<&str>,
        description: Option<&str>,
    ) -> AppResult<()> {
        tracing::info!(
            user_id = %user_id,
            activity_type = %activity_type,
            points = points,
            ref_id = ?ref_id,
            ref_type = ?ref_type,
            "Adding points to user"
        );

        // 음수 포인트 감지
        if points < 0 {
            tracing::warn!(
                user_id = %user_id,
                activity_type = %activity_type,
                points = points,
                "Negative points detected"
            );
        }

        // Point log 생성
        entities::point_logs::ActiveModel {
            id: Set(Uuid::new_v4()),
            user_id: Set(user_id),
            activity_type: Set(activity_type.to_string()),
            points: Set(points),
            ref_id: Set(ref_id),
            ref_type: Set(ref_type.map(|s| s.to_string())),
            description: Set(description.map(|s| s.to_string())),
            ..Default::default()
        }
        .insert(db)
        .await?;

        // 사용자 총 포인트 업데이트
        let user = entities::Users::find_by_id(user_id)
            .one(db)
            .await?
            .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

        let old_total_points = user.total_points;
        let new_total_points = old_total_points + points;

        let mut user: entities::users::ActiveModel = user.into();
        user.total_points = Set(new_total_points);
        user.update(db).await?;

        tracing::info!(
            user_id = %user_id,
            activity_type = %activity_type,
            old_total = old_total_points,
            new_total = new_total_points,
            "Points updated successfully"
        );

        Ok(())
    }

    /// 전체 랭킹 조회 (주간/월간/전체)
    pub async fn get_rankings(
        state: &AppState,
        period: &str,
        pagination: Pagination,
        user_id: Option<Uuid>,
    ) -> AppResult<RankingListResponse> {
        let now = chrono::Utc::now();
        let period_start = match period {
            "weekly" => now - chrono::Duration::weeks(1),
            "monthly" => now - chrono::Duration::days(30),
            _ => chrono::DateTime::<chrono::Utc>::MIN_UTC, // all_time
        };

        // 사용자별 포인트 집계 (기간 내)
        let users = entities::Users::find()
            .order_by_desc(entities::users::Column::TotalPoints)
            .offset(pagination.offset())
            .limit(pagination.limit())
            .all(state.db.as_ref())
            .await?;

        let total_items = entities::Users::find().count(state.db.as_ref()).await?;

        // N+1 쿼리 방지: 모든 사용자의 통계를 한 번에 조회
        let user_ids: Vec<Uuid> = users.iter().map(|u| u.id).collect();
        let solution_stats_map =
            Self::get_users_solution_stats(state.db.as_ref(), &user_ids).await?;
        let period_points_map =
            Self::get_users_period_points(state.db.as_ref(), &user_ids, period_start).await?;

        let mut data = Vec::new();
        for (idx, user) in users.iter().enumerate() {
            let stats = solution_stats_map
                .get(&user.id)
                .cloned()
                .unwrap_or_default();
            let weekly_points = *period_points_map.get(&user.id).unwrap_or(&0);

            data.push(RankingItem {
                rank: (pagination.offset() + idx as u64 + 1) as i32,
                user: RankingUser {
                    id: user.id,
                    username: user.username.clone(),
                    avatar_url: user.avatar_url.clone(),
                    rank: user.rank.clone(),
                },
                total_points: user.total_points,
                weekly_points,
                solution_count: stats.solution_count,
                adopted_count: stats.adopted_count,
                verified_count: stats.verified_count,
            });
        }

        // 내 랭킹 (로그인한 경우)
        let my_ranking = if let Some(uid) = user_id {
            let my_user = entities::Users::find_by_id(uid)
                .one(state.db.as_ref())
                .await?;

            if let Some(my_user) = my_user {
                // 내 순위 계산 (total_points가 더 높은 사용자 수 + 1)
                let rank = entities::Users::find()
                    .filter(entities::users::Column::TotalPoints.gt(my_user.total_points))
                    .count(state.db.as_ref())
                    .await? as i32
                    + 1;

                // 기간별 포인트 조회 (단일 쿼리)
                let weekly_points =
                    *Self::get_users_period_points(state.db.as_ref(), &[uid], period_start)
                        .await?
                        .get(&uid)
                        .unwrap_or(&0);

                Some(MyRanking {
                    rank,
                    total_points: my_user.total_points,
                    weekly_points,
                })
            } else {
                None
            }
        } else {
            None
        };

        let pagination_meta = PaginationMeta {
            current_page: pagination.page,
            per_page: pagination.per_page,
            total_items,
            total_pages: total_items.div_ceil(pagination.per_page),
        };

        Ok(RankingListResponse {
            data,
            my_ranking,
            pagination: pagination_meta,
        })
    }

    /// 카테고리별 랭킹 조회
    pub async fn get_category_rankings(
        state: &AppState,
        category_code: &str,
        pagination: Pagination,
    ) -> AppResult<CategoryRankingResponse> {
        // 카테고리 검증
        let category = entities::Categories::find()
            .filter(entities::categories::Column::Code.eq(category_code))
            .one(state.db.as_ref())
            .await?
            .ok_or_else(|| AppError::NotFound("Category not found".to_string()))?;

        // 전체 활동 사용자 조회 (카테고리별 포인트로 정렬하기 위해 모든 사용자 대상)
        let all_users = entities::Users::find().all(state.db.as_ref()).await?;

        let all_user_ids: Vec<Uuid> = all_users.iter().map(|u| u.id).collect();

        // 카테고리별 포인트를 한 번에 조회 (N+1 방지)
        let category_points_map =
            Self::get_users_category_points(state.db.as_ref(), &all_user_ids, category.id).await?;

        // 카테고리 포인트 기준으로 정렬
        let mut users_with_points: Vec<_> = all_users
            .into_iter()
            .map(|user| {
                let category_points = *category_points_map.get(&user.id).unwrap_or(&0);
                (user, category_points)
            })
            .filter(|(_, points)| *points > 0) // 해당 카테고리에 활동이 있는 사용자만
            .collect();

        users_with_points.sort_by(|a, b| b.1.cmp(&a.1)); // category_points DESC

        let total_items = users_with_points.len() as u64;

        // 페이지네이션 적용
        let start = pagination.offset() as usize;
        let end = (start + pagination.per_page as usize).min(users_with_points.len());
        let paginated_users = &users_with_points[start..end];

        // Solution 통계를 한 번에 조회 (N+1 방지)
        let user_ids: Vec<Uuid> = paginated_users.iter().map(|(u, _)| u.id).collect();

        // 해당 카테고리의 subcategories 조회
        let subcategories = entities::Subcategories::find()
            .filter(entities::subcategories::Column::CategoryId.eq(category.id))
            .all(state.db.as_ref())
            .await?;

        let subcategory_ids: Vec<Uuid> = subcategories.iter().map(|s| s.id).collect();

        // 해당 서브카테고리의 Spots 조회
        let spots = if !subcategory_ids.is_empty() {
            entities::Spots::find()
                .filter(entities::spots::Column::SubcategoryId.is_in(subcategory_ids))
                .all(state.db.as_ref())
                .await?
        } else {
            Vec::new()
        };

        let spot_ids: Vec<Uuid> = spots.iter().map(|s| s.id).collect();

        // 해당 카테고리 Spots의 Solutions 조회
        let solutions = if !spot_ids.is_empty() {
            entities::Solutions::find()
                .filter(entities::solutions::Column::SpotId.is_in(spot_ids.iter().copied()))
                .filter(entities::solutions::Column::UserId.is_in(user_ids.iter().copied()))
                .all(state.db.as_ref())
                .await?
        } else {
            vec![]
        };

        // 사용자별 Solution 통계 집계
        let mut user_solution_stats: HashMap<Uuid, (i32, i32)> = HashMap::new();
        for solution in solutions {
            let (count, adopted) = user_solution_stats
                .entry(solution.user_id)
                .or_insert((0, 0));
            *count += 1;
            if solution.is_adopted {
                *adopted += 1;
            }
        }

        // 응답 데이터 생성
        let mut data = Vec::new();
        for (idx, (user, category_points)) in paginated_users.iter().enumerate() {
            let (solution_count, adopted_count) =
                *user_solution_stats.get(&user.id).unwrap_or(&(0, 0));

            data.push(CategoryRankingItem {
                rank: (start + idx + 1) as i32,
                user: RankingUser {
                    id: user.id,
                    username: user.username.clone(),
                    avatar_url: user.avatar_url.clone(),
                    rank: user.rank.clone(),
                },
                category_points: *category_points,
                solution_count,
                adopted_count,
            });
        }

        let pagination_meta = PaginationMeta {
            current_page: pagination.page,
            per_page: pagination.per_page,
            total_items,
            total_pages: total_items.div_ceil(pagination.per_page),
        };

        Ok(CategoryRankingResponse {
            category_code: category.code,
            data,
            pagination: pagination_meta,
        })
    }

    /// 트렌딩 아티스트 조회
    pub async fn get_trending_artists(
        db: &DatabaseConnection,
        period: &str,
        limit: u64,
    ) -> AppResult<Vec<super::dto::TrendingArtistItem>> {
        let limit = limit.min(50);
        let now = chrono::Utc::now();
        let period_start = match period {
            "monthly" => now - chrono::Duration::days(30),
            "all_time" => chrono::DateTime::<chrono::Utc>::MIN_UTC,
            _ => now - chrono::Duration::weeks(1), // weekly default
        };

        let sql = r#"
            SELECT
                artist_name,
                COUNT(*)::BIGINT AS post_count,
                (ARRAY_AGG(image_url ORDER BY view_count DESC))[1] AS top_image_url
            FROM public.posts
            WHERE status = 'active'
              AND artist_name IS NOT NULL
              AND image_url IS NOT NULL
              AND created_at >= $1
            GROUP BY artist_name
            ORDER BY post_count DESC
            LIMIT $2
        "#;

        let rows = db
            .query_all(Statement::from_sql_and_values(
                DbBackend::Postgres,
                sql,
                [period_start.into(), (limit as i64).into()],
            ))
            .await
            .map_err(AppError::DatabaseError)?;

        let items = rows
            .into_iter()
            .map(|row| super::dto::TrendingArtistItem {
                artist_name: row.try_get::<String>("", "artist_name").unwrap_or_default(),
                post_count: row.try_get::<i64>("", "post_count").unwrap_or(0),
                image_url: row
                    .try_get::<Option<String>>("", "top_image_url")
                    .ok()
                    .flatten(),
            })
            .collect();

        Ok(items)
    }

    /// 내 랭킹 상세 조회
    pub async fn get_my_ranking_detail(
        state: &AppState,
        user_id: Uuid,
    ) -> AppResult<MyRankingDetailResponse> {
        let user = entities::Users::find_by_id(user_id)
            .one(state.db.as_ref())
            .await?
            .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

        // 전체 순위 계산
        let overall_rank = entities::Users::find()
            .filter(entities::users::Column::TotalPoints.gt(user.total_points))
            .count(state.db.as_ref())
            .await? as i32
            + 1;

        // 기간별 포인트 계산
        let now = chrono::Utc::now();
        let week_ago = now - chrono::Duration::weeks(1);
        let month_ago = now - chrono::Duration::days(30);

        // 주간/월간 포인트를 한 번에 조회
        let weekly_points = *Self::get_users_period_points(state.db.as_ref(), &[user_id], week_ago)
            .await?
            .get(&user_id)
            .unwrap_or(&0);

        let monthly_points =
            *Self::get_users_period_points(state.db.as_ref(), &[user_id], month_ago)
                .await?
                .get(&user_id)
                .unwrap_or(&0);

        // Solution 통계 (한 번에 조회)
        let solution_stats_map =
            Self::get_users_solution_stats(state.db.as_ref(), &[user_id]).await?;
        let stats = solution_stats_map
            .get(&user_id)
            .cloned()
            .unwrap_or_default();

        // accurate_votes는 별도 계산 필요
        let solutions = entities::Solutions::find()
            .filter(entities::solutions::Column::UserId.eq(user_id))
            .all(state.db.as_ref())
            .await?;
        let accurate_votes = solutions.iter().map(|s| s.accurate_count).sum::<i32>();

        // 카테고리별 순위 계산 (TOP 5 카테고리)
        let category_rankings = Self::get_user_category_rankings(state, user_id).await?;

        Ok(MyRankingDetailResponse {
            overall_rank,
            total_points: user.total_points,
            weekly_points,
            monthly_points,
            solution_stats: super::dto::SolutionStats {
                total_count: stats.solution_count,
                adopted_count: stats.adopted_count,
                verified_count: stats.verified_count,
                accurate_votes,
            },
            category_rankings,
        })
    }
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;

    #[test]
    fn test_activity_points() {
        assert_eq!(ActivityPoints::PostCreated as i32, 5);
        assert_eq!(ActivityPoints::SpotCreated as i32, 3);
        assert_eq!(ActivityPoints::SolutionRegistered as i32, 10);
        assert_eq!(ActivityPoints::SolutionAdopted as i32, 30);
        assert_eq!(ActivityPoints::SolutionVerified as i32, 20);
        assert_eq!(ActivityPoints::VoteAccurate as i32, 2);
        assert_eq!(ActivityPoints::VoteParticipation as i32, 1);
        assert_eq!(ActivityPoints::PurchaseConversion as i32, 50);
    }
}
