//! Badges 서비스
//!
//! 뱃지 비즈니스 로직

use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait, QueryFilter};
use serde_json::Value;
use uuid::Uuid;

use crate::{
    config::AppState,
    entities,
    error::{AppError, AppResult},
};

use super::dto::{
    AvailableBadgeItem, BadgeCriteria, BadgeProgress, BadgeRarity, BadgeResponse, BadgeType,
    EarnedBadgeItem, MyBadgesResponse,
};

pub struct BadgesService;

impl BadgesService {
    /// 전체 뱃지 목록 조회
    pub async fn list_badges(state: &AppState) -> AppResult<Vec<BadgeResponse>> {
        let badges = entities::Badges::find().all(&state.db).await?;

        let mut result = Vec::new();
        for badge in badges {
            result.push(BadgeResponse {
                id: badge.id,
                badge_type: Self::parse_badge_type(&badge.r#type)?,
                name: badge.name,
                description: badge.description,
                icon_url: badge.icon_url,
                criteria: Self::parse_criteria(&badge.criteria)?,
                rarity: Self::parse_rarity(&badge.rarity)?,
                created_at: badge.created_at.with_timezone(&chrono::Utc),
            });
        }

        Ok(result)
    }

    /// 내 뱃지 조회 (획득한 뱃지 + 진행 중인 뱃지)
    pub async fn get_my_badges(state: &AppState, user_id: Uuid) -> AppResult<MyBadgesResponse> {
        // 1. 획득한 뱃지 조회
        let earned_user_badges = entities::UserBadges::find()
            .filter(entities::user_badges::Column::UserId.eq(user_id))
            .find_also_related(entities::Badges)
            .all(&state.db)
            .await?;

        let mut earned_badges = Vec::new();
        for (user_badge, badge) in earned_user_badges {
            if let Some(badge) = badge {
                let criteria = Self::parse_criteria(&badge.criteria)?;
                let progress = BadgeProgress {
                    current: criteria.threshold,
                    threshold: criteria.threshold,
                    completed: true,
                };

                earned_badges.push(EarnedBadgeItem {
                    badge: BadgeResponse {
                        id: badge.id,
                        badge_type: Self::parse_badge_type(&badge.r#type)?,
                        name: badge.name,
                        description: badge.description,
                        icon_url: badge.icon_url,
                        criteria,
                        rarity: Self::parse_rarity(&badge.rarity)?,
                        created_at: badge.created_at.with_timezone(&chrono::Utc),
                    },
                    earned_at: user_badge.earned_at.with_timezone(&chrono::Utc),
                    progress,
                });
            }
        }

        // 2. 모든 뱃지 조회
        let all_badges = entities::Badges::find().all(&state.db).await?;

        // 3. 획득한 뱃지 ID 집합
        let earned_badge_ids: std::collections::HashSet<Uuid> =
            earned_badges.iter().map(|b| b.badge.id).collect();

        // 4. 진행 중인 뱃지 계산
        let mut available_badges = Vec::new();
        for badge in all_badges {
            if !earned_badge_ids.contains(&badge.id) {
                let criteria = Self::parse_criteria(&badge.criteria)?;
                let progress = Self::check_badge_progress(&state.db, user_id, &criteria).await?;

                available_badges.push(AvailableBadgeItem {
                    id: badge.id,
                    name: badge.name,
                    description: badge.description,
                    icon_url: badge.icon_url,
                    rarity: Self::parse_rarity(&badge.rarity)?,
                    progress,
                });
            }
        }

        Ok(MyBadgesResponse {
            data: earned_badges,
            available_badges,
        })
    }

    /// 뱃지 상세 조회
    pub async fn get_badge_by_id(state: &AppState, badge_id: Uuid) -> AppResult<BadgeResponse> {
        let badge = entities::Badges::find_by_id(badge_id)
            .one(&state.db)
            .await?
            .ok_or_else(|| AppError::not_found("뱃지를 찾을 수 없습니다"))?;

        Ok(BadgeResponse {
            id: badge.id,
            badge_type: Self::parse_badge_type(&badge.r#type)?,
            name: badge.name,
            description: badge.description,
            icon_url: badge.icon_url,
            criteria: Self::parse_criteria(&badge.criteria)?,
            rarity: Self::parse_rarity(&badge.rarity)?,
            created_at: badge.created_at.with_timezone(&chrono::Utc),
        })
    }

    /// 뱃지 획득 조건 체크 및 진행도 계산
    async fn check_badge_progress(
        db: &DatabaseConnection,
        user_id: Uuid,
        criteria: &BadgeCriteria,
    ) -> AppResult<BadgeProgress> {
        let current = match criteria.criteria_type.as_str() {
            "count" => {
                // 총 Solution 수
                let count = entities::Solutions::find()
                    .filter(entities::solutions::Column::UserId.eq(user_id))
                    .filter(entities::solutions::Column::Status.eq("active"))
                    .count(db)
                    .await?;
                count as i32
            }
            "verified" => {
                // Verified Solution 수
                let count = entities::Solutions::find()
                    .filter(entities::solutions::Column::UserId.eq(user_id))
                    .filter(entities::solutions::Column::IsVerified.eq(true))
                    .filter(entities::solutions::Column::Status.eq("active"))
                    .count(db)
                    .await?;
                count as i32
            }
            "adopted" => {
                // 채택된 Solution 수
                let count = entities::Solutions::find()
                    .filter(entities::solutions::Column::UserId.eq(user_id))
                    .filter(entities::solutions::Column::IsAdopted.eq(true))
                    .filter(entities::solutions::Column::Status.eq("active"))
                    .count(db)
                    .await?;
                count as i32
            }
            "artist" => {
                // 특정 아티스트 관련 Solution 수
                if let Some(artist_name) = &criteria.target {
                    let count = Self::count_solutions_by_artist(db, user_id, artist_name).await?;
                    count as i32
                } else {
                    0
                }
            }
            "group" => {
                // 특정 그룹 관련 Solution 수
                if let Some(group_name) = &criteria.target {
                    let count = Self::count_solutions_by_group(db, user_id, group_name).await?;
                    count as i32
                } else {
                    0
                }
            }
            "category" => {
                // 특정 카테고리 Solution 수
                if let Some(category_code) = &criteria.target {
                    let count =
                        Self::count_solutions_by_category(db, user_id, category_code).await?;
                    count as i32
                } else {
                    0
                }
            }
            _ => 0,
        };

        Ok(BadgeProgress {
            current,
            threshold: criteria.threshold,
            completed: current >= criteria.threshold,
        })
    }

    /// 특정 아티스트 관련 Solution 수 계산
    async fn count_solutions_by_artist(
        db: &DatabaseConnection,
        user_id: Uuid,
        artist_name: &str,
    ) -> AppResult<u64> {
        // 1. 사용자의 모든 Solution 조회
        let solutions = entities::Solutions::find()
            .filter(entities::solutions::Column::UserId.eq(user_id))
            .filter(entities::solutions::Column::Status.eq("active"))
            .all(db)
            .await?;

        // 2. 각 Solution의 Spot -> Post 조회하여 아티스트명 필터링
        let mut count = 0;
        for solution in solutions {
            let spot = entities::Spots::find_by_id(solution.spot_id)
                .one(db)
                .await?
                .ok_or_else(|| AppError::not_found("Spot을 찾을 수 없습니다"))?;

            let post = entities::Posts::find_by_id(spot.post_id)
                .one(db)
                .await?
                .ok_or_else(|| AppError::not_found("Post를 찾을 수 없습니다"))?;

            if post.artist_name.as_deref() == Some(artist_name) {
                count += 1;
            }
        }

        Ok(count)
    }

    /// 특정 그룹 관련 Solution 수 계산
    async fn count_solutions_by_group(
        db: &DatabaseConnection,
        user_id: Uuid,
        group_name: &str,
    ) -> AppResult<u64> {
        // 1. 사용자의 모든 Solution 조회
        let solutions = entities::Solutions::find()
            .filter(entities::solutions::Column::UserId.eq(user_id))
            .filter(entities::solutions::Column::Status.eq("active"))
            .all(db)
            .await?;

        // 2. 각 Solution의 Spot -> Post 조회하여 그룹명 필터링
        let mut count = 0;
        for solution in solutions {
            let spot = entities::Spots::find_by_id(solution.spot_id)
                .one(db)
                .await?
                .ok_or_else(|| AppError::not_found("Spot을 찾을 수 없습니다"))?;

            let post = entities::Posts::find_by_id(spot.post_id)
                .one(db)
                .await?
                .ok_or_else(|| AppError::not_found("Post를 찾을 수 없습니다"))?;

            if post.group_name.as_deref() == Some(group_name) {
                count += 1;
            }
        }

        Ok(count)
    }

    /// 특정 카테고리 Solution 수 계산
    async fn count_solutions_by_category(
        db: &DatabaseConnection,
        user_id: Uuid,
        category_code: &str,
    ) -> AppResult<u64> {
        // 카테고리 조회
        let category = entities::Categories::find()
            .filter(entities::categories::Column::Code.eq(category_code))
            .one(db)
            .await?
            .ok_or_else(|| AppError::not_found("카테고리를 찾을 수 없습니다"))?;

        // 해당 카테고리의 subcategories 조회
        let subcategories = entities::Subcategories::find()
            .filter(entities::subcategories::Column::CategoryId.eq(category.id))
            .all(db)
            .await?;

        let subcategory_ids: Vec<Uuid> = subcategories.iter().map(|s| s.id).collect();

        if subcategory_ids.is_empty() {
            return Ok(0);
        }

        // 해당 서브카테고리의 Spots 조회
        let spots = entities::Spots::find()
            .filter(entities::spots::Column::SubcategoryId.is_in(subcategory_ids))
            .all(db)
            .await?;

        let spot_ids: Vec<Uuid> = spots.iter().map(|s| s.id).collect();

        // 해당 카테고리 Spots의 Solutions 조회
        let count = if !spot_ids.is_empty() {
            entities::Solutions::find()
                .filter(entities::solutions::Column::SpotId.is_in(spot_ids))
                .filter(entities::solutions::Column::UserId.eq(user_id))
                .filter(entities::solutions::Column::Status.eq("active"))
                .count(db)
                .await?
        } else {
            0
        };

        Ok(count)
    }

    /// BadgeType 파싱
    fn parse_badge_type(s: &str) -> AppResult<BadgeType> {
        match s.to_lowercase().as_str() {
            "specialist" => Ok(BadgeType::Specialist),
            "category" => Ok(BadgeType::Category),
            "achievement" => Ok(BadgeType::Achievement),
            "milestone" => Ok(BadgeType::Milestone),
            _ => Err(AppError::InternalError(format!(
                "Invalid badge type: {}",
                s
            ))),
        }
    }

    /// BadgeRarity 파싱
    fn parse_rarity(s: &str) -> AppResult<BadgeRarity> {
        match s.to_lowercase().as_str() {
            "common" => Ok(BadgeRarity::Common),
            "rare" => Ok(BadgeRarity::Rare),
            "epic" => Ok(BadgeRarity::Epic),
            "legendary" => Ok(BadgeRarity::Legendary),
            _ => Err(AppError::InternalError(format!(
                "Invalid badge rarity: {}",
                s
            ))),
        }
    }

    /// Criteria JSONB 파싱
    fn parse_criteria(value: &Value) -> AppResult<BadgeCriteria> {
        serde_json::from_value(value.clone())
            .map_err(|e| AppError::InternalError(format!("Failed to parse criteria: {}", e)))
    }
}
