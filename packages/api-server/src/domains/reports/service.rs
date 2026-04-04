//! Reports service
//!
//! 콘텐츠 신고 비즈니스 로직

use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait, QueryFilter,
    QueryOrder, QuerySelect, Set,
};
use uuid::Uuid;

use crate::{
    entities::content_reports::{ActiveModel, Column, Entity as ContentReports},
    error::{AppError, AppResult},
    utils::pagination::{PaginatedResponse, Pagination},
};

use super::dto::{
    AdminReportListQuery, ReportListItem, ReportResponse, ReporterInfo, UpdateReportStatusDto,
};

/// 신고 생성
pub async fn create_report(
    db: &DatabaseConnection,
    reporter_id: Uuid,
    target_type: &str,
    target_id: Uuid,
    reason: &str,
    details: Option<&str>,
) -> AppResult<ReportResponse> {
    // 중복 신고 방지
    let existing = ContentReports::find()
        .filter(Column::TargetType.eq(target_type))
        .filter(Column::TargetId.eq(target_id))
        .filter(Column::ReporterId.eq(reporter_id))
        .one(db)
        .await
        .map_err(AppError::DatabaseError)?;

    if existing.is_some() {
        return Err(AppError::BadRequest(
            "You have already reported this content".to_string(),
        ));
    }

    let id = Uuid::new_v4();
    let now = chrono::Utc::now().fixed_offset();

    let report = ActiveModel {
        id: Set(id),
        target_type: Set(target_type.to_string()),
        target_id: Set(target_id),
        reporter_id: Set(reporter_id),
        reason: Set(reason.to_string()),
        details: Set(details.map(|d| d.to_string())),
        status: Set("pending".to_string()),
        resolution: Set(None),
        reviewed_by: Set(None),
        created_at: Set(now),
        updated_at: Set(now),
    };

    let inserted = report.insert(db).await.map_err(AppError::DatabaseError)?;

    Ok(ReportResponse {
        id: inserted.id,
        target_type: inserted.target_type,
        target_id: inserted.target_id,
        reason: inserted.reason,
        status: inserted.status,
        created_at: inserted.created_at.with_timezone(&chrono::Utc),
    })
}

/// Admin: 신고 목록 조회
pub async fn admin_list_reports(
    db: &DatabaseConnection,
    query: AdminReportListQuery,
) -> AppResult<PaginatedResponse<ReportListItem>> {
    let pagination = Pagination {
        page: query.page.unwrap_or(1),
        per_page: query.per_page.unwrap_or(20),
    };

    let mut q = ContentReports::find();

    if let Some(ref status) = query.status {
        q = q.filter(Column::Status.eq(status.as_str()));
    }
    if let Some(ref target_type) = query.target_type {
        q = q.filter(Column::TargetType.eq(target_type.as_str()));
    }

    q = q.order_by_desc(Column::CreatedAt);

    let total = q.clone().count(db).await.map_err(AppError::DatabaseError)?;

    let reports = q
        .offset((pagination.page - 1) * pagination.per_page)
        .limit(pagination.per_page)
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;

    // 신고자 정보 배치 로딩
    let reporter_ids: Vec<Uuid> = reports.iter().map(|r| r.reporter_id).collect();
    let users = crate::entities::users::Entity::find()
        .filter(crate::entities::users::Column::Id.is_in(reporter_ids))
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;

    let users_map: std::collections::HashMap<Uuid, _> =
        users.into_iter().map(|u| (u.id, u)).collect();

    let items: Vec<ReportListItem> = reports
        .into_iter()
        .map(|r| {
            let reporter = users_map
                .get(&r.reporter_id)
                .map(|u| ReporterInfo {
                    id: u.id,
                    username: u.username.clone(),
                })
                .unwrap_or_else(|| ReporterInfo {
                    id: r.reporter_id,
                    username: "Unknown".to_string(),
                });

            ReportListItem {
                id: r.id,
                target_type: r.target_type,
                target_id: r.target_id,
                reporter,
                reason: r.reason,
                details: r.details,
                status: r.status,
                resolution: r.resolution,
                created_at: r.created_at.with_timezone(&chrono::Utc),
                updated_at: r.updated_at.with_timezone(&chrono::Utc),
            }
        })
        .collect();

    Ok(PaginatedResponse::new(items, pagination, total))
}

/// Admin: 신고 상태 업데이트
pub async fn admin_update_report_status(
    db: &DatabaseConnection,
    report_id: Uuid,
    admin_id: Uuid,
    dto: UpdateReportStatusDto,
) -> AppResult<ReportListItem> {
    let valid_statuses = ["pending", "reviewed", "dismissed", "actioned"];
    if !valid_statuses.contains(&dto.status.as_str()) {
        return Err(AppError::BadRequest(format!(
            "Invalid status. Must be one of: {}",
            valid_statuses.join(", ")
        )));
    }

    let report = ContentReports::find_by_id(report_id)
        .one(db)
        .await
        .map_err(AppError::DatabaseError)?
        .ok_or(AppError::NotFound("Report not found".to_string()))?;

    let mut active: ActiveModel = report.into();
    active.status = Set(dto.status);
    active.reviewed_by = Set(Some(admin_id));
    active.updated_at = Set(chrono::Utc::now().fixed_offset());
    if let Some(resolution) = dto.resolution {
        active.resolution = Set(Some(resolution));
    }

    let updated = active.update(db).await.map_err(AppError::DatabaseError)?;

    // 신고자 정보 로딩
    let reporter = crate::entities::users::Entity::find_by_id(updated.reporter_id)
        .one(db)
        .await
        .map_err(AppError::DatabaseError)?
        .map(|u| ReporterInfo {
            id: u.id,
            username: u.username.clone(),
        })
        .unwrap_or_else(|| ReporterInfo {
            id: updated.reporter_id,
            username: "Unknown".to_string(),
        });

    Ok(ReportListItem {
        id: updated.id,
        target_type: updated.target_type,
        target_id: updated.target_id,
        reporter,
        reason: updated.reason,
        details: updated.details,
        status: updated.status,
        resolution: updated.resolution,
        created_at: updated.created_at.with_timezone(&chrono::Utc),
        updated_at: updated.updated_at.with_timezone(&chrono::Utc),
    })
}
