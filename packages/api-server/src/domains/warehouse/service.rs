//! Warehouse service
//!
//! 읽기 전용 프로필 조회. 홈 페이지가 한 번에 많은 엔티티를 매핑할 수 있도록
//! limit 를 크게(기본 500) 허용한다. 정렬은 `created_at DESC`.

use sea_orm::{DatabaseConnection, EntityTrait, QueryOrder, QuerySelect};

use crate::entities::warehouse_artists::{Column as ArtistColumn, Entity as WarehouseArtists};
use crate::entities::warehouse_groups::{Column as GroupColumn, Entity as WarehouseGroups};
use crate::error::{AppError, AppResult};

use super::dto::{WarehouseProfile, WarehouseProfilesResponse};

/// 기본 limit
pub const DEFAULT_LIMIT: u64 = 500;
/// 상한
pub const MAX_LIMIT: u64 = 2000;

pub fn clamp_limit(raw: Option<u64>) -> u64 {
    raw.unwrap_or(DEFAULT_LIMIT).clamp(1, MAX_LIMIT)
}

pub async fn list_profiles(
    db: &DatabaseConnection,
    limit: u64,
) -> AppResult<WarehouseProfilesResponse> {
    let artists = WarehouseArtists::find()
        .order_by_desc(ArtistColumn::CreatedAt)
        .limit(limit)
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?
        .into_iter()
        .map(|a| WarehouseProfile {
            id: a.id,
            name_ko: a.name_ko,
            name_en: a.name_en,
            profile_image_url: a.profile_image_url,
        })
        .collect();

    let groups = WarehouseGroups::find()
        .order_by_desc(GroupColumn::CreatedAt)
        .limit(limit)
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?
        .into_iter()
        .map(|g| WarehouseProfile {
            id: g.id,
            name_ko: g.name_ko,
            name_en: g.name_en,
            profile_image_url: g.profile_image_url,
        })
        .collect();

    Ok(WarehouseProfilesResponse { artists, groups })
}
