//! Earnings service
//!
//! 클릭 추적 및 통계 집계 비즈니스 로직

use chrono::{Duration, Utc};
use sea_orm::prelude::Expr;
use sea_orm::{
    ColumnTrait, DatabaseConnection, EntityTrait, Order, PaginatorTrait, QueryFilter, QueryOrder,
    QuerySelect,
};
use uuid::Uuid;

use crate::{
    domains::solutions::service::get_solution_by_id,
    entities::click_logs::{Column, Entity as ClickLogs},
    error::{AppError, AppResult},
};

use super::dto::{ClickStatsResponse, MonthlyClickStats};

/// 부정 클릭 방지: 동일 User + Solution 24시간 내 중복 클릭 체크
async fn check_duplicate_click(
    db: &DatabaseConnection,
    user_id: Option<Uuid>,
    solution_id: Uuid,
) -> AppResult<bool> {
    // user_id가 None이면 익명 사용자이므로 중복 체크 불가
    let user_id = match user_id {
        Some(id) => id,
        None => return Ok(false), // 익명 사용자는 중복 체크 스킵
    };

    let one_day_ago = Utc::now() - Duration::hours(24);

    let count = ClickLogs::find()
        .filter(Column::UserId.eq(user_id))
        .filter(Column::SolutionId.eq(solution_id))
        .filter(Column::CreatedAt.gte(one_day_ago))
        .count(db)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(count > 0)
}

/// 부정 클릭 방지: IP 기반 Rate Limiting (1분당 최대 10회)
async fn check_ip_rate_limit(db: &DatabaseConnection, ip_address: &str) -> AppResult<bool> {
    let one_minute_ago = Utc::now() - Duration::minutes(1);

    let count = ClickLogs::find()
        .filter(Column::IpAddress.eq(ip_address))
        .filter(Column::CreatedAt.gte(one_minute_ago))
        .count(db)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(count >= 10) // 1분당 10회 이상이면 제한
}

/// User Agent 검증: 정상적인 브라우저 요청인지 확인
pub(crate) fn validate_user_agent(user_agent: Option<&String>) -> bool {
    let user_agent = match user_agent {
        Some(ua) => ua.to_lowercase(),
        None => return false, // User Agent가 없으면 거부
    };

    // 일반적인 브라우저 User Agent 패턴 확인
    let valid_patterns = [
        "mozilla", "chrome", "safari", "firefox", "edge", "opera", "webkit",
    ];

    valid_patterns
        .iter()
        .any(|pattern| user_agent.contains(pattern))
}

/// 클릭 로그 저장
pub async fn create_click_log(
    db: &DatabaseConnection,
    user_id: Option<Uuid>,
    solution_id: Uuid,
    ip_address: String,
    user_agent: Option<String>,
    referrer: Option<String>,
) -> AppResult<()> {
    // Solution 존재 확인
    let _solution = get_solution_by_id(db, solution_id).await?;

    // 부정 클릭 방지: 24시간 내 중복 클릭 체크
    if check_duplicate_click(db, user_id, solution_id).await? {
        return Ok(()); // 중복 클릭이면 조용히 무시
    }

    // 부정 클릭 방지: IP Rate Limiting 체크
    if check_ip_rate_limit(db, &ip_address).await? {
        return Err(AppError::BadRequest(
            "Too many requests from this IP address".to_string(),
        ));
    }

    // User Agent 검증
    if !validate_user_agent(user_agent.as_ref()) {
        return Err(AppError::BadRequest(
            "Invalid or missing User-Agent header".to_string(),
        ));
    }

    // 클릭 로그 저장
    use crate::entities::click_logs::ActiveModel;
    use sea_orm::ActiveModelTrait;
    use sea_orm::Set;

    let click_log = ActiveModel {
        id: Set(Uuid::new_v4()),
        user_id: Set(user_id),
        solution_id: Set(solution_id),
        ip_address: Set(ip_address),
        user_agent: Set(user_agent),
        referrer: Set(referrer),
        ..Default::default()
    };

    click_log
        .insert(db)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(())
}

/// 사용자의 Solution별 클릭 통계 조회
pub async fn get_click_stats_by_user(
    db: &DatabaseConnection,
    user_id: Uuid,
) -> AppResult<ClickStatsResponse> {
    use crate::entities::solutions::{Column as SolutionColumn, Entity as Solutions};

    // 사용자가 작성한 Solution ID 목록 조회
    let solution_ids: Vec<Uuid> = Solutions::find()
        .filter(SolutionColumn::UserId.eq(user_id))
        .select_only()
        .column(SolutionColumn::Id)
        .into_tuple()
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;

    if solution_ids.is_empty() {
        return Ok(ClickStatsResponse {
            total_clicks: 0,
            unique_clicks: 0,
            monthly_stats: vec![],
        });
    }

    // 총 클릭 수 계산
    let total_clicks = ClickLogs::find()
        .filter(Column::SolutionId.is_in(solution_ids.clone()))
        .count(db)
        .await
        .map_err(AppError::DatabaseError)?;

    // 고유 클릭 수 계산 (user_id별로 중복 제거)
    let unique_clicks = ClickLogs::find()
        .filter(Column::SolutionId.is_in(solution_ids.clone()))
        .filter(Column::UserId.is_not_null())
        .select_only()
        .column(Column::UserId)
        .distinct()
        .count(db)
        .await
        .map_err(AppError::DatabaseError)?;

    // 월별 통계 집계
    let monthly_stats = get_monthly_click_stats(db, solution_ids).await?;

    Ok(ClickStatsResponse {
        total_clicks: total_clicks as i64,
        unique_clicks: unique_clicks as i64,
        monthly_stats,
    })
}

/// 월별 클릭 통계 집계
async fn get_monthly_click_stats(
    db: &DatabaseConnection,
    solution_ids: Vec<Uuid>,
) -> AppResult<Vec<MonthlyClickStats>> {
    // 월별 클릭 수 집계 (PostgreSQL의 date_trunc 사용)
    let results: Vec<(String, i64)> = ClickLogs::find()
        .filter(Column::SolutionId.is_in(solution_ids.clone()))
        .select_only()
        .column_as(Expr::cust("DATE_TRUNC('month', created_at)::text"), "month")
        .column_as(Expr::cust("COUNT(*)"), "clicks")
        .group_by(Expr::cust("DATE_TRUNC('month', created_at)"))
        .order_by(Expr::cust("DATE_TRUNC('month', created_at)"), Order::Desc)
        .into_tuple()
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;

    let mut monthly_stats = Vec::new();
    for (month_str, clicks) in results {
        // "2026-01-01 00:00:00+00" 형식을 "2026-01"로 변환
        let month = month_str
            .split_whitespace()
            .next()
            .unwrap_or("")
            .split('-')
            .take(2)
            .collect::<Vec<_>>()
            .join("-");

        // 고유 클릭 수 계산 (해당 월의 user_id별 중복 제거)
        let unique_clicks = ClickLogs::find()
            .filter(Column::SolutionId.is_in(solution_ids.clone()))
            .filter(Column::UserId.is_not_null())
            .filter(Expr::cust(format!(
                "DATE_TRUNC('month', created_at) = '{}'",
                month_str.split_whitespace().next().unwrap_or("")
            )))
            .select_only()
            .column(Column::UserId)
            .distinct()
            .count(db)
            .await
            .map_err(AppError::DatabaseError)?;

        monthly_stats.push(MonthlyClickStats {
            month,
            clicks,
            unique_clicks: unique_clicks as i64,
        });
    }

    Ok(monthly_stats)
}
