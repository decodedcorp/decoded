use crate::{entities, AppResult};
use sea_orm::{
    entity::*, query::*, ActiveValue::Set, ColumnTrait, DatabaseConnection, EntityTrait,
    QueryFilter,
};
use uuid::Uuid;

/// Post 또는 Spot 조회 로그를 기록합니다
///
/// 중복 조회 방지: 24시간 내 같은 사용자가 같은 Post/Spot을 조회한 경우 무시
///
/// # Arguments
/// * `db` - 데이터베이스 연결
/// * `user_id` - 사용자 ID (로그인한 사용자만)
/// * `reference_type` - 'post' 또는 'spot'
/// * `reference_id` - Post ID 또는 Spot ID
pub async fn create_view_log(
    db: &DatabaseConnection,
    user_id: Uuid,
    reference_type: &str,
    reference_id: Uuid,
) -> AppResult<()> {
    // 24시간 내 중복 조회 체크
    let twenty_four_hours_ago = chrono::Utc::now() - chrono::Duration::hours(24);

    let existing = entities::ViewLogs::find()
        .filter(entities::view_logs::Column::UserId.eq(user_id))
        .filter(entities::view_logs::Column::ReferenceType.eq(reference_type))
        .filter(entities::view_logs::Column::ReferenceId.eq(reference_id))
        .filter(entities::view_logs::Column::CreatedAt.gte(twenty_four_hours_ago))
        .one(db)
        .await?;

    // 24시간 내 이미 조회한 기록이 있으면 무시
    if existing.is_some() {
        return Ok(());
    }

    // 새로운 조회 로그 생성
    let view_log = entities::view_logs::ActiveModel {
        id: Set(Uuid::new_v4()),
        user_id: Set(Some(user_id)),
        reference_type: Set(reference_type.to_string()),
        reference_id: Set(reference_id),
        created_at: Set(chrono::Utc::now().into()),
    };

    view_log.insert(db).await?;

    Ok(())
}

/// 특정 사용자의 Post 조회 수를 카운트합니다 (뱃지 체크용)
pub async fn count_post_views(db: &DatabaseConnection, user_id: Uuid) -> AppResult<u64> {
    let count = entities::ViewLogs::find()
        .filter(entities::view_logs::Column::UserId.eq(user_id))
        .filter(entities::view_logs::Column::ReferenceType.eq("post"))
        .count(db)
        .await?;

    Ok(count)
}

/// 특정 사용자의 Spot 조회 수를 카운트합니다 (뱃지 체크용)
pub async fn count_spot_views(db: &DatabaseConnection, user_id: Uuid) -> AppResult<u64> {
    let count = entities::ViewLogs::find()
        .filter(entities::view_logs::Column::UserId.eq(user_id))
        .filter(entities::view_logs::Column::ReferenceType.eq("spot"))
        .count(db)
        .await?;

    Ok(count)
}
