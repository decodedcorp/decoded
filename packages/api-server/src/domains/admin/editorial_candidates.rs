//! Admin Editorial Candidates
//!
//! 적격 Post 목록 조회 (spot ≥ 4, 각 spot에 solution ≥ 1, magazine 없음)

use axum::{
    extract::{Query, State},
    routing::get,
    Json, Router,
};
use sea_orm::{ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, QueryOrder};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    config::{AppConfig, AppState},
    constants::post_status,
    entities::{
        posts::{self, Entity as Posts},
        solutions::{self, Entity as Solutions},
        spots::{self, Entity as Spots},
    },
    error::AppResult,
    middleware::auth::User,
};

const MIN_SPOTS: usize = 4;
const MIN_SOLUTIONS_PER_SPOT: u64 = 1;

#[derive(Debug, Deserialize)]
pub struct EditorialCandidateQuery {
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

#[derive(Debug, Serialize)]
pub struct EditorialCandidateItem {
    pub id: Uuid,
    pub image_url: String,
    pub title: Option<String>,
    pub artist_name: Option<String>,
    pub group_name: Option<String>,
    pub context: Option<String>,
    pub spot_count: u64,
    pub min_solutions_per_spot: u64,
    pub total_solution_count: u64,
    pub view_count: i32,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
pub struct EditorialCandidateListResponse {
    pub data: Vec<EditorialCandidateItem>,
    pub total: u64,
    pub page: u64,
    pub per_page: u64,
}

/// GET /api/v1/admin/editorial-candidates
///
/// spot ≥ 4이고 모든 spot에 solution ≥ 1인 active post 중
/// post_magazine_id가 없는 것만 반환
pub async fn list_candidates(
    State(state): State<AppState>,
    _extension: axum::Extension<User>,
    Query(query): Query<EditorialCandidateQuery>,
) -> AppResult<Json<EditorialCandidateListResponse>> {
    let db = &state.db;
    let page = query.page.max(1);
    let per_page = query.per_page.clamp(1, 50);

    // Step 1: active posts without magazine
    let candidate_posts = Posts::find()
        .filter(posts::Column::Status.eq(post_status::ACTIVE))
        .filter(posts::Column::PostMagazineId.is_null())
        .filter(posts::Column::ImageUrl.is_not_null())
        .order_by_desc(posts::Column::CreatedAt)
        .all(db)
        .await?;

    // Step 2: Filter by spot/solution criteria
    let mut eligible: Vec<EditorialCandidateItem> = Vec::new();

    for post in &candidate_posts {
        let post_spots = Spots::find()
            .filter(spots::Column::PostId.eq(post.id))
            .all(db)
            .await?;

        if post_spots.len() < MIN_SPOTS {
            continue;
        }

        let mut all_spots_have_solutions = true;
        let mut min_solutions: u64 = u64::MAX;
        let mut total_solutions: u64 = 0;

        for spot in &post_spots {
            let count = Solutions::find()
                .filter(solutions::Column::SpotId.eq(spot.id))
                .count(db)
                .await?;

            if count < MIN_SOLUTIONS_PER_SPOT {
                all_spots_have_solutions = false;
                break;
            }
            min_solutions = min_solutions.min(count);
            total_solutions += count;
        }

        if !all_spots_have_solutions {
            continue;
        }

        eligible.push(EditorialCandidateItem {
            id: post.id,
            image_url: post.image_url.clone(),
            title: post.title.clone(),
            artist_name: post.artist_name.clone(),
            group_name: post.group_name.clone(),
            context: post.context.clone(),
            spot_count: post_spots.len() as u64,
            min_solutions_per_spot: min_solutions,
            total_solution_count: total_solutions,
            view_count: post.view_count,
            created_at: post.created_at.to_string(),
        });
    }

    // Step 3: Paginate in-memory
    let total = eligible.len() as u64;
    let offset = ((page - 1) * per_page) as usize;
    let data: Vec<EditorialCandidateItem> = eligible
        .into_iter()
        .skip(offset)
        .take(per_page as usize)
        .collect();

    Ok(Json(EditorialCandidateListResponse {
        data,
        total,
        page,
        per_page,
    }))
}

pub fn router(state: AppState, app_config: AppConfig) -> Router<AppState> {
    Router::new()
        .route("/", get(list_candidates))
        .layer(axum::middleware::from_fn_with_state(
            state,
            crate::middleware::admin_db_middleware,
        ))
        .layer(axum::middleware::from_fn_with_state(
            app_config,
            crate::middleware::auth_middleware,
        ))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn meets_editorial_criteria(spot_count: usize, solutions_per_spot: &[u64]) -> bool {
        spot_count >= MIN_SPOTS
            && solutions_per_spot
                .iter()
                .all(|&c| c >= MIN_SOLUTIONS_PER_SPOT)
    }

    #[test]
    fn happy_path_4_spots_with_solutions() {
        assert!(meets_editorial_criteria(4, &[1, 2, 3, 1]));
    }

    #[test]
    fn insufficient_spots() {
        assert!(!meets_editorial_criteria(3, &[1, 2, 3]));
    }

    #[test]
    fn spot_without_solution() {
        assert!(!meets_editorial_criteria(4, &[1, 0, 3, 1]));
    }

    #[test]
    fn exact_threshold() {
        assert!(meets_editorial_criteria(4, &[1, 1, 1, 1]));
    }

    #[test]
    fn many_spots_and_solutions() {
        assert!(meets_editorial_criteria(6, &[5, 3, 2, 1, 4, 7]));
    }
}
