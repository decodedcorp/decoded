use chrono::{TimeZone, Utc};
use sea_orm::{ActiveModelTrait, DatabaseConnection, Set};
use uuid::Uuid;

use crate::entities::user_events;
use crate::error::{AppError, AppResult};

use super::dto::EventItem;

const MAX_BATCH: usize = 200;

/// 배치 INSERT — user_id 는 middleware 에서 검증된 값을 강제 주입.
/// 개별 row 실패는 무시하고 수락된 개수만 반환 (sendBeacon fire-and-forget 성격).
pub async fn insert_events(
    db: &DatabaseConnection,
    user_id: Uuid,
    events: Vec<EventItem>,
) -> AppResult<usize> {
    if events.is_empty() {
        return Ok(0);
    }
    if events.len() > MAX_BATCH {
        return Err(AppError::BadRequest(format!(
            "events batch size {} exceeds max {}",
            events.len(),
            MAX_BATCH
        )));
    }

    let mut accepted = 0usize;
    for ev in events {
        let created_at = Utc
            .timestamp_opt(ev.timestamp.timestamp(), 0)
            .single()
            .unwrap_or_else(Utc::now)
            .fixed_offset();
        let active = user_events::ActiveModel {
            id: Set(Uuid::new_v4()),
            user_id: Set(user_id),
            event_type: Set(ev.event_type),
            entity_id: Set(ev.entity_id),
            session_id: Set(ev.session_id),
            page_path: Set(ev.page_path),
            metadata: Set(ev.metadata),
            created_at: Set(created_at),
        };
        match active.insert(db).await {
            Ok(_) => accepted += 1,
            Err(e) => {
                // Event ingest 는 fire-and-forget 성격 — 개별 실패는 경고만.
                tracing::warn!(error = ?e, "events::insert failed for one row, skipping");
            }
        }
    }
    Ok(accepted)
}
