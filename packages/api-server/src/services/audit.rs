//! Admin audit log writer
//!
//! Rust API 핸들러가 admin 액션을 수행할 때 `warehouse.admin_audit_log`에
//! 단일 row 기록. 트랜잭션 내에서 UPDATE와 원자적으로 묶어 사용한다.
//! Next.js `packages/web/lib/api/admin/audit-log.ts`의 후속 구현.

use sea_orm::{ActiveModelTrait, ConnectionTrait, DbErr, Set};
use serde_json::Value as Json;
use uuid::Uuid;

use crate::entities::admin_audit_log::ActiveModel as AuditLogActiveModel;

/// 기록할 감사 로그 엔트리.
///
/// `before_state`/`after_state`는 변경 전·후 상태의 JSON 표현 (RFC-like row snapshot).
/// `metadata`는 부가 컨텍스트 (예: bulk operation `affectedIds`).
#[derive(Debug, Clone)]
pub struct AuditLogEntry {
    pub admin_user_id: Uuid,
    pub action: String,
    pub target_table: String,
    pub target_id: Option<Uuid>,
    pub before_state: Option<Json>,
    pub after_state: Option<Json>,
    pub metadata: Option<Json>,
}

/// `warehouse.admin_audit_log`에 단일 row INSERT.
///
/// `ConnectionTrait` 경계로 `DatabaseConnection`·`DatabaseTransaction` 모두 수락.
/// 트랜잭션 내에서 호출하면 mutation과 원자적으로 commit/rollback된다.
pub async fn write_audit_log<C>(conn: &C, entry: AuditLogEntry) -> Result<Uuid, DbErr>
where
    C: ConnectionTrait,
{
    let id = Uuid::new_v4();
    let now = chrono::Utc::now().fixed_offset();

    let model = AuditLogActiveModel {
        id: Set(id),
        admin_user_id: Set(entry.admin_user_id),
        action: Set(entry.action),
        target_table: Set(entry.target_table),
        target_id: Set(entry.target_id),
        before_state: Set(entry.before_state),
        after_state: Set(entry.after_state),
        metadata: Set(entry.metadata),
        created_at: Set(now),
    };

    let inserted = model.insert(conn).await?;
    Ok(inserted.id)
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;
    use crate::entities::admin_audit_log::Model as AuditLogModel;
    use sea_orm::MockExecResult;

    fn sample_entry() -> AuditLogEntry {
        AuditLogEntry {
            admin_user_id: crate::tests::fixtures::test_uuid(99),
            action: "post.status.update".to_string(),
            target_table: "posts".to_string(),
            target_id: Some(crate::tests::fixtures::test_uuid(1)),
            before_state: Some(serde_json::json!({ "status": "active" })),
            after_state: Some(serde_json::json!({ "status": "hidden" })),
            metadata: None,
        }
    }

    fn returning_row(entry: &AuditLogEntry) -> AuditLogModel {
        AuditLogModel {
            id: Uuid::new_v4(),
            admin_user_id: entry.admin_user_id,
            action: entry.action.clone(),
            target_table: entry.target_table.clone(),
            target_id: entry.target_id,
            before_state: entry.before_state.clone(),
            after_state: entry.after_state.clone(),
            metadata: entry.metadata.clone(),
            created_at: chrono::Utc::now().fixed_offset(),
        }
    }

    #[tokio::test]
    async fn write_audit_log_succeeds_with_returning_row() {
        let entry = sample_entry();
        let row = returning_row(&entry);
        let db = crate::tests::helpers::mock_db_with_results(
            vec![vec![row]],
            vec![MockExecResult {
                last_insert_id: 0,
                rows_affected: 1,
            }],
        );

        let result = write_audit_log(&db, entry).await;
        assert!(result.is_ok(), "expected Ok, got {:?}", result);
    }

    #[tokio::test]
    async fn write_audit_log_surfaces_db_error_when_no_row_returned() {
        let entry = sample_entry();
        let db = crate::tests::helpers::empty_mock_db();
        let result = write_audit_log(&db, entry).await;
        assert!(result.is_err(), "expected Err from empty mock, got Ok");
    }
}
