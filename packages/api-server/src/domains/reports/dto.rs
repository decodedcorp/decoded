//! Reports DTOs

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

/// 신고 생성 요청
#[derive(Debug, Clone, Deserialize, ToSchema)]
pub struct CreateReportDto {
    /// 대상 타입 (post, comment, solution)
    pub target_type: String,
    /// 대상 ID
    pub target_id: Uuid,
    /// 신고 사유 (spam, inappropriate, copyright, incorrect, other)
    pub reason: String,
    /// 상세 설명 (선택)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<String>,
}

/// 신고 상태 업데이트 요청 (admin)
#[derive(Debug, Clone, Deserialize, ToSchema)]
pub struct UpdateReportStatusDto {
    /// 새 상태 (pending, reviewed, dismissed, actioned)
    pub status: String,
    /// 처리 결과 메모 (선택)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolution: Option<String>,
}

/// Admin용 신고 목록 쿼리
#[derive(Debug, Clone, Deserialize, ToSchema)]
pub struct AdminReportListQuery {
    /// 상태 필터
    pub status: Option<String>,
    /// 대상 타입 필터
    pub target_type: Option<String>,
    /// 페이지 번호
    pub page: Option<u64>,
    /// 페이지당 개수
    pub per_page: Option<u64>,
}

/// 신고자 정보 (간소화)
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct ReporterInfo {
    pub id: Uuid,
    pub username: String,
}

/// 신고 목록 아이템
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct ReportListItem {
    pub id: Uuid,
    pub target_type: String,
    pub target_id: Uuid,
    pub reporter: ReporterInfo,
    pub reason: String,
    pub details: Option<String>,
    pub status: String,
    pub resolution: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// 신고 생성 응답
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct ReportResponse {
    pub id: Uuid,
    pub target_type: String,
    pub target_id: Uuid,
    pub reason: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
}
