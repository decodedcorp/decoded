//! Admin Dashboard
//!
//! 관리자용 대시보드 통계 API (KPI, 인기 키워드, 트래픽 분석)

use axum::{
    extract::{Query, State},
    routing::get,
    Json, Router,
};
use serde::{Deserialize, Serialize};

use crate::{
    config::{AppConfig, AppState},
    error::AppResult,
    middleware::auth::User,
};

/// 대시보드 KPI 응답
#[derive(Debug, Clone, Serialize, utoipa::ToSchema)]
pub struct DashboardStatsResponse {
    /// 일일 활성 사용자 (DAU)
    pub dau: i64,

    /// 월간 활성 사용자 (MAU)
    pub mau: i64,

    /// 총 사용자 수
    pub total_users: i64,

    /// 총 게시물 수
    pub total_posts: i64,

    /// 총 Solution 수
    pub total_solutions: i64,

    /// 총 클릭 수
    pub total_clicks: i64,

    /// 오늘 생성된 게시물 수
    pub today_posts: i64,

    /// 오늘 생성된 Solution 수
    pub today_solutions: i64,

    /// 오늘 클릭 수
    pub today_clicks: i64,
}

/// 인기 키워드 응답
#[derive(Debug, Clone, Serialize, utoipa::ToSchema)]
pub struct PopularKeyword {
    /// 키워드
    pub keyword: String,

    /// 검색 횟수
    pub count: i64,
}

/// 인기 키워드 목록 응답
#[derive(Debug, Clone, Serialize, utoipa::ToSchema)]
pub struct PopularKeywordsResponse {
    /// 인기 키워드 목록
    pub keywords: Vec<PopularKeyword>,
}

/// 트래픽 분석 쿼리 파라미터
#[derive(Debug, Clone, Deserialize, utoipa::ToSchema)]
pub struct TrafficQuery {
    /// 시작 날짜 (ISO 8601 형식, 예: 2024-01-01)
    #[serde(default)]
    pub start_date: Option<String>,

    /// 종료 날짜 (ISO 8601 형식, 예: 2024-01-31)
    #[serde(default)]
    pub end_date: Option<String>,
}

/// 일별 트래픽 통계
#[derive(Debug, Clone, Serialize, utoipa::ToSchema)]
pub struct DailyTraffic {
    /// 날짜 (YYYY-MM-DD)
    pub date: String,

    /// 일일 활성 사용자 수
    pub dau: i64,

    /// 검색 횟수
    pub search_count: i64,

    /// 클릭 횟수
    pub click_count: i64,
}

/// 트래픽 분석 응답
#[derive(Debug, Clone, Serialize, utoipa::ToSchema)]
pub struct TrafficAnalysisResponse {
    /// 일별 트래픽 통계
    pub daily_traffic: Vec<DailyTraffic>,

    /// 총 검색 횟수
    pub total_searches: i64,

    /// 총 클릭 횟수
    pub total_clicks: i64,
}

/// GET /api/v1/admin/dashboard - KPI 대시보드
#[utoipa::path(
    get,
    path = "/api/v1/admin/dashboard",
    tag = "admin",
    security(
        ("bearer_auth" = [])
    ),
    responses(
        (status = 200, description = "대시보드 통계 조회 성공", body = DashboardStatsResponse),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "Admin 권한 필요")
    )
)]
pub async fn get_dashboard_stats(
    State(state): State<AppState>,
    _extension: axum::Extension<User>, // Admin 미들웨어에서 이미 검증됨
) -> AppResult<Json<DashboardStatsResponse>> {
    let stats = crate::domains::admin::dashboard::service::get_dashboard_stats(&state).await?;
    Ok(Json(stats))
}

/// GET /api/v1/admin/dashboard/keywords - 인기 키워드
#[utoipa::path(
    get,
    path = "/api/v1/admin/dashboard/keywords",
    tag = "admin",
    security(
        ("bearer_auth" = [])
    ),
    responses(
        (status = 200, description = "인기 키워드 조회 성공", body = PopularKeywordsResponse),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "Admin 권한 필요")
    )
)]
pub async fn get_popular_keywords(
    State(state): State<AppState>,
    _extension: axum::Extension<User>, // Admin 미들웨어에서 이미 검증됨
) -> AppResult<Json<PopularKeywordsResponse>> {
    let keywords = crate::domains::admin::dashboard::service::get_popular_keywords(&state).await?;
    Ok(Json(PopularKeywordsResponse { keywords }))
}

/// GET /api/v1/admin/dashboard/traffic - 트래픽 분석
#[utoipa::path(
    get,
    path = "/api/v1/admin/dashboard/traffic",
    tag = "admin",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("start_date" = Option<String>, Query, description = "시작 날짜 (ISO 8601)"),
        ("end_date" = Option<String>, Query, description = "종료 날짜 (ISO 8601)")
    ),
    responses(
        (status = 200, description = "트래픽 분석 조회 성공", body = TrafficAnalysisResponse),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "Admin 권한 필요")
    )
)]
pub async fn get_traffic_analysis(
    State(state): State<AppState>,
    _extension: axum::Extension<User>, // Admin 미들웨어에서 이미 검증됨
    Query(query): Query<TrafficQuery>,
) -> AppResult<Json<TrafficAnalysisResponse>> {
    let analysis =
        crate::domains::admin::dashboard::service::get_traffic_analysis(&state, query).await?;
    Ok(Json(analysis))
}

/// Admin Dashboard 라우터 (`users.is_admin` DB 검증 — Next `checkIsAdmin`과 정렬)
pub fn router(state: AppState, app_config: AppConfig) -> Router<AppState> {
    Router::new()
        .route("/", get(get_dashboard_stats))
        .route("/keywords", get(get_popular_keywords))
        .route("/traffic", get(get_traffic_analysis))
        .layer(axum::middleware::from_fn_with_state(
            state,
            crate::middleware::admin_db_middleware,
        ))
        .layer(axum::middleware::from_fn_with_state(
            app_config,
            crate::middleware::auth_middleware,
        ))
}

/// Service 모듈
pub mod service {
    use super::*;
    use crate::{
        entities::{
            click_logs::{Column as ClickLogsColumn, Entity as ClickLogs},
            posts::{Column as PostsColumn, Entity as Posts},
            search_logs::{Column, Entity as SearchLogs},
            solutions::{Column as SolutionsColumn, Entity as Solutions},
            users::Entity as Users,
        },
        error::{AppError, AppResult},
    };
    use chrono::{DateTime, NaiveDate, Utc};
    use sea_orm::{
        ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait, QueryFilter, QuerySelect,
    };
    use std::collections::HashMap;

    /// 대시보드 통계 조회
    pub async fn get_dashboard_stats(state: &AppState) -> AppResult<DashboardStatsResponse> {
        let db = &state.db;
        let now = Utc::now();
        let today_start = now
            .date_naive()
            .and_hms_opt(0, 0, 0)
            .ok_or_else(|| AppError::InternalError("invalid local midnight".to_string()))?;
        let today_start_utc = DateTime::<Utc>::from_naive_utc_and_offset(today_start, Utc);

        // DAU: 오늘 활동한 사용자 수 (posts, solutions, clicks 중 하나라도 활동)
        let dau = get_dau_count(db, today_start_utc).await?;

        // MAU: 지난 30일간 활동한 사용자 수
        let thirty_days_ago = now - chrono::Duration::days(30);
        let mau = get_mau_count(db, thirty_days_ago).await?;

        // 총 사용자 수
        let total_users = Users::find()
            .count(db)
            .await
            .map_err(AppError::DatabaseError)? as i64;

        // 총 게시물 수
        let total_posts = Posts::find()
            .count(db)
            .await
            .map_err(AppError::DatabaseError)? as i64;

        // 총 Solution 수
        let total_solutions = Solutions::find()
            .count(db)
            .await
            .map_err(AppError::DatabaseError)? as i64;

        // 총 클릭 수
        let total_clicks = ClickLogs::find()
            .count(db)
            .await
            .map_err(AppError::DatabaseError)? as i64;

        // 오늘 생성된 게시물 수
        let today_posts = Posts::find()
            .filter(PostsColumn::CreatedAt.gte(today_start_utc))
            .count(db)
            .await
            .map_err(AppError::DatabaseError)? as i64;

        // 오늘 생성된 Solution 수
        let today_solutions = Solutions::find()
            .filter(SolutionsColumn::CreatedAt.gte(today_start_utc))
            .count(db)
            .await
            .map_err(AppError::DatabaseError)? as i64;

        // 오늘 클릭 수
        let today_clicks = ClickLogs::find()
            .filter(ClickLogsColumn::CreatedAt.gte(today_start_utc))
            .count(db)
            .await
            .map_err(AppError::DatabaseError)? as i64;

        Ok(DashboardStatsResponse {
            dau,
            mau,
            total_users,
            total_posts,
            total_solutions,
            total_clicks,
            today_posts,
            today_solutions,
            today_clicks,
        })
    }

    /// DAU 계산: 오늘 활동한 고유 사용자 수
    async fn get_dau_count(db: &DatabaseConnection, today_start: DateTime<Utc>) -> AppResult<i64> {
        // posts, solutions, click_logs에서 오늘 활동한 사용자 ID 수집
        let post_users: Vec<uuid::Uuid> = Posts::find()
            .filter(PostsColumn::CreatedAt.gte(today_start))
            .select_only()
            .column(PostsColumn::UserId)
            .distinct()
            .into_tuple()
            .all(db)
            .await
            .map_err(AppError::DatabaseError)?;

        let solution_users: Vec<uuid::Uuid> = Solutions::find()
            .filter(SolutionsColumn::CreatedAt.gte(today_start))
            .select_only()
            .column(SolutionsColumn::UserId)
            .distinct()
            .into_tuple()
            .all(db)
            .await
            .map_err(AppError::DatabaseError)?;

        let click_users: Vec<Option<uuid::Uuid>> = ClickLogs::find()
            .filter(ClickLogsColumn::CreatedAt.gte(today_start))
            .select_only()
            .column(ClickLogsColumn::UserId)
            .distinct()
            .into_tuple()
            .all(db)
            .await
            .map_err(AppError::DatabaseError)?;

        // 모든 사용자 ID를 HashSet으로 합치기
        use std::collections::HashSet;
        let mut unique_users = HashSet::new();
        for user_id in post_users {
            unique_users.insert(user_id);
        }
        for user_id in solution_users {
            unique_users.insert(user_id);
        }
        for user_id in click_users.into_iter().flatten() {
            unique_users.insert(user_id);
        }

        Ok(unique_users.len() as i64)
    }

    /// MAU 계산: 지난 30일간 활동한 고유 사용자 수
    async fn get_mau_count(
        db: &DatabaseConnection,
        thirty_days_ago: DateTime<Utc>,
    ) -> AppResult<i64> {
        use std::collections::HashSet;

        // posts, solutions, click_logs에서 지난 30일간 활동한 사용자 ID 수집
        let post_users: Vec<uuid::Uuid> = Posts::find()
            .filter(PostsColumn::CreatedAt.gte(thirty_days_ago))
            .select_only()
            .column(PostsColumn::UserId)
            .distinct()
            .into_tuple()
            .all(db)
            .await
            .map_err(AppError::DatabaseError)?;

        let solution_users: Vec<uuid::Uuid> = Solutions::find()
            .filter(SolutionsColumn::CreatedAt.gte(thirty_days_ago))
            .select_only()
            .column(SolutionsColumn::UserId)
            .distinct()
            .into_tuple()
            .all(db)
            .await
            .map_err(AppError::DatabaseError)?;

        let click_users: Vec<Option<uuid::Uuid>> = ClickLogs::find()
            .filter(ClickLogsColumn::CreatedAt.gte(thirty_days_ago))
            .select_only()
            .column(ClickLogsColumn::UserId)
            .distinct()
            .into_tuple()
            .all(db)
            .await
            .map_err(AppError::DatabaseError)?;

        // 모든 사용자 ID를 HashSet으로 합치기
        let mut unique_users = HashSet::new();
        for user_id in post_users {
            unique_users.insert(user_id);
        }
        for user_id in solution_users {
            unique_users.insert(user_id);
        }
        for user_id in click_users.into_iter().flatten() {
            unique_users.insert(user_id);
        }

        Ok(unique_users.len() as i64)
    }

    /// 인기 키워드 조회 (TOP 20)
    pub async fn get_popular_keywords(state: &AppState) -> AppResult<Vec<PopularKeyword>> {
        let db = &state.db;

        // 최근 30일간의 검색 로그에서 키워드 집계
        let thirty_days_ago = Utc::now() - chrono::Duration::days(30);
        let search_logs = SearchLogs::find()
            .filter(Column::CreatedAt.gte(thirty_days_ago))
            .all(db)
            .await
            .map_err(AppError::DatabaseError)?;

        // 키워드별 카운트 집계
        let mut keyword_counts: HashMap<String, i64> = HashMap::new();
        for log in search_logs {
            *keyword_counts.entry(log.query).or_insert(0) += 1;
        }

        // 카운트 내림차순으로 정렬하고 TOP 20 추출
        let mut keywords: Vec<PopularKeyword> = keyword_counts
            .into_iter()
            .map(|(keyword, count)| PopularKeyword { keyword, count })
            .collect();
        keywords.sort_by(|a, b| b.count.cmp(&a.count));
        keywords.truncate(20);

        Ok(keywords)
    }

    /// 트래픽 분석 조회
    pub async fn get_traffic_analysis(
        state: &AppState,
        query: TrafficQuery,
    ) -> AppResult<TrafficAnalysisResponse> {
        let db = &state.db;

        // 날짜 범위 결정
        let (start_date, end_date) =
            if let (Some(start_str), Some(end_str)) = (query.start_date, query.end_date) {
                let start = NaiveDate::parse_from_str(&start_str, "%Y-%m-%d")
                    .map_err(|_| AppError::BadRequest("Invalid start_date format".to_string()))?;
                let end = NaiveDate::parse_from_str(&end_str, "%Y-%m-%d")
                    .map_err(|_| AppError::BadRequest("Invalid end_date format".to_string()))?;
                (
                    DateTime::<Utc>::from_naive_utc_and_offset(
                        start.and_hms_opt(0, 0, 0).ok_or_else(|| {
                            AppError::BadRequest("invalid traffic range start time".to_string())
                        })?,
                        Utc,
                    ),
                    DateTime::<Utc>::from_naive_utc_and_offset(
                        end.and_hms_opt(23, 59, 59).ok_or_else(|| {
                            AppError::BadRequest("invalid traffic range end time".to_string())
                        })?,
                        Utc,
                    ),
                )
            } else {
                // 기본값: 최근 30일
                let end = Utc::now();
                let start = end - chrono::Duration::days(30);
                (start, end)
            };

        // 일별 트래픽 통계 계산
        let mut daily_traffic_map: HashMap<String, DailyTraffic> = HashMap::new();

        // 검색 로그 집계
        let search_logs = SearchLogs::find()
            .filter(Column::CreatedAt.gte(start_date))
            .filter(Column::CreatedAt.lte(end_date))
            .all(db)
            .await
            .map_err(AppError::DatabaseError)?;

        for log in search_logs {
            let date = log.created_at.format("%Y-%m-%d").to_string();
            let entry = daily_traffic_map
                .entry(date.clone())
                .or_insert_with(|| DailyTraffic {
                    date,
                    dau: 0,
                    search_count: 0,
                    click_count: 0,
                });
            entry.search_count += 1;
        }

        // 클릭 로그 집계
        let click_logs = ClickLogs::find()
            .filter(ClickLogsColumn::CreatedAt.gte(start_date))
            .filter(ClickLogsColumn::CreatedAt.lte(end_date))
            .all(db)
            .await
            .map_err(AppError::DatabaseError)?;

        for log in click_logs {
            let date = log.created_at.format("%Y-%m-%d").to_string();
            let entry = daily_traffic_map
                .entry(date.clone())
                .or_insert_with(|| DailyTraffic {
                    date,
                    dau: 0,
                    search_count: 0,
                    click_count: 0,
                });
            entry.click_count += 1;
        }

        // 일별 DAU 계산 (각 날짜별 고유 사용자 수)
        for (date_str, traffic) in daily_traffic_map.iter_mut() {
            let date = NaiveDate::parse_from_str(date_str, "%Y-%m-%d")
                .map_err(|_| AppError::InternalError("Invalid date format".to_string()))?;
            let day_start = DateTime::<Utc>::from_naive_utc_and_offset(
                date.and_hms_opt(0, 0, 0)
                    .ok_or_else(|| AppError::InternalError("invalid day start".to_string()))?,
                Utc,
            );
            let day_end = DateTime::<Utc>::from_naive_utc_and_offset(
                date.and_hms_opt(23, 59, 59)
                    .ok_or_else(|| AppError::InternalError("invalid day end".to_string()))?,
                Utc,
            );

            let dau = get_dau_count_for_date(db, day_start, day_end).await?;
            traffic.dau = dau;
        }

        // 날짜순으로 정렬
        let mut daily_traffic: Vec<DailyTraffic> = daily_traffic_map.into_values().collect();
        daily_traffic.sort_by(|a, b| a.date.cmp(&b.date));

        // 총 검색 수, 총 클릭 수 계산
        let total_searches: i64 = daily_traffic.iter().map(|t| t.search_count).sum();
        let total_clicks: i64 = daily_traffic.iter().map(|t| t.click_count).sum();

        Ok(TrafficAnalysisResponse {
            daily_traffic,
            total_searches,
            total_clicks,
        })
    }

    /// 특정 날짜의 DAU 계산
    async fn get_dau_count_for_date(
        db: &DatabaseConnection,
        day_start: DateTime<Utc>,
        day_end: DateTime<Utc>,
    ) -> AppResult<i64> {
        use std::collections::HashSet;

        // posts, solutions, click_logs에서 해당 날짜에 활동한 사용자 ID 수집
        let post_users: Vec<uuid::Uuid> = Posts::find()
            .filter(PostsColumn::CreatedAt.gte(day_start))
            .filter(PostsColumn::CreatedAt.lte(day_end))
            .select_only()
            .column(PostsColumn::UserId)
            .distinct()
            .into_tuple()
            .all(db)
            .await
            .map_err(AppError::DatabaseError)?;

        let solution_users: Vec<uuid::Uuid> = Solutions::find()
            .filter(SolutionsColumn::CreatedAt.gte(day_start))
            .filter(SolutionsColumn::CreatedAt.lte(day_end))
            .select_only()
            .column(SolutionsColumn::UserId)
            .distinct()
            .into_tuple()
            .all(db)
            .await
            .map_err(AppError::DatabaseError)?;

        let click_users: Vec<Option<uuid::Uuid>> = ClickLogs::find()
            .filter(ClickLogsColumn::CreatedAt.gte(day_start))
            .filter(ClickLogsColumn::CreatedAt.lte(day_end))
            .select_only()
            .column(ClickLogsColumn::UserId)
            .distinct()
            .into_tuple()
            .all(db)
            .await
            .map_err(AppError::DatabaseError)?;

        // 모든 사용자 ID를 HashSet으로 합치기
        let mut unique_users = HashSet::new();
        for user_id in post_users {
            unique_users.insert(user_id);
        }
        for user_id in solution_users {
            unique_users.insert(user_id);
        }
        for user_id in click_users.into_iter().flatten() {
            unique_users.insert(user_id);
        }

        Ok(unique_users.len() as i64)
    }
}
