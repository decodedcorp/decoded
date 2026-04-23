//! Raw Posts service layer (#258)
//!
//! SeaORM CRUD + the upsert used by the gRPC callback.

use chrono::Utc;
use sea_orm::sea_query::OnConflict;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, ConnectionTrait, DatabaseConnection, EntityTrait,
    PaginatorTrait, QueryFilter, QueryOrder, QuerySelect, Set, Statement,
};
use uuid::Uuid;

use crate::entities::{
    warehouse_raw_post_sources as src_entity, warehouse_raw_posts as post_entity,
    warehouse_source_media_originals as orig_entity, WarehouseRawPostSources, WarehouseRawPosts,
    WarehouseSourceMediaOriginals,
};
use crate::error::{AppError, AppResult};

use super::dto::{
    CreateRawPostSourceDto, ListItemsQuery, ListSourcesQuery, RawPost, RawPostSource,
    RawPostSourcesPage, RawPostUpsertInput, RawPostsItemsPage, RawPostsStatsEntry,
    SourceMediaOriginal, UpdateRawPostSourceDto,
};

const DEFAULT_LIMIT: u64 = 50;
const MAX_LIMIT: u64 = 500;

fn clamp_limit(raw: Option<u64>) -> u64 {
    raw.unwrap_or(DEFAULT_LIMIT).clamp(1, MAX_LIMIT)
}

// ------------------------------------------------------------------
// raw_post_sources CRUD
// ------------------------------------------------------------------

pub async fn create_source(
    db: &DatabaseConnection,
    dto: CreateRawPostSourceDto,
) -> AppResult<RawPostSource> {
    let now = Utc::now().fixed_offset();
    let model = src_entity::ActiveModel {
        id: Set(Uuid::new_v4()),
        platform: Set(dto.platform),
        source_type: Set(dto.source_type),
        source_identifier: Set(dto.source_identifier),
        label: Set(dto.label),
        is_active: Set(dto.is_active),
        fetch_interval_seconds: Set(dto.fetch_interval_seconds),
        last_enqueued_at: Set(None),
        last_scraped_at: Set(None),
        metadata: Set(dto.metadata),
        created_at: Set(now),
        updated_at: Set(now),
    };

    let saved = model.insert(db).await.map_err(AppError::DatabaseError)?;
    Ok(source_model_to_dto(saved))
}

pub async fn list_sources(
    db: &DatabaseConnection,
    query: ListSourcesQuery,
) -> AppResult<RawPostSourcesPage> {
    let limit = clamp_limit(query.limit);
    let offset = query.offset.unwrap_or(0);

    let mut find = WarehouseRawPostSources::find();
    if let Some(platform) = query.platform.as_ref() {
        find = find.filter(src_entity::Column::Platform.eq(platform));
    }
    if let Some(is_active) = query.is_active {
        find = find.filter(src_entity::Column::IsActive.eq(is_active));
    }

    let total = find
        .clone()
        .count(db)
        .await
        .map_err(AppError::DatabaseError)?;

    let rows = find
        .order_by_desc(src_entity::Column::CreatedAt)
        .offset(offset)
        .limit(limit)
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;

    let items = rows.into_iter().map(source_model_to_dto).collect();

    Ok(RawPostSourcesPage {
        items,
        total,
        limit,
        offset,
    })
}

pub async fn update_source(
    db: &DatabaseConnection,
    id: Uuid,
    dto: UpdateRawPostSourceDto,
) -> AppResult<RawPostSource> {
    let existing = WarehouseRawPostSources::find_by_id(id)
        .one(db)
        .await
        .map_err(AppError::DatabaseError)?
        .ok_or_else(|| AppError::NotFound(format!("raw_post_source {id} not found")))?;

    let mut active: src_entity::ActiveModel = existing.into();

    if let Some(label) = dto.label {
        active.label = Set(Some(label));
    }
    if let Some(is_active) = dto.is_active {
        active.is_active = Set(is_active);
    }
    if let Some(interval) = dto.fetch_interval_seconds {
        if interval < 60 {
            return Err(AppError::BadRequest(
                "fetch_interval_seconds must be >= 60".to_string(),
            ));
        }
        active.fetch_interval_seconds = Set(interval);
    }
    if let Some(metadata) = dto.metadata {
        active.metadata = Set(Some(metadata));
    }
    active.updated_at = Set(Utc::now().fixed_offset());

    let updated = active.update(db).await.map_err(AppError::DatabaseError)?;
    Ok(source_model_to_dto(updated))
}

pub async fn delete_source(db: &DatabaseConnection, id: Uuid) -> AppResult<()> {
    let res = WarehouseRawPostSources::delete_by_id(id)
        .exec(db)
        .await
        .map_err(AppError::DatabaseError)?;
    if res.rows_affected == 0 {
        return Err(AppError::NotFound(format!(
            "raw_post_source {id} not found"
        )));
    }
    Ok(())
}

// ------------------------------------------------------------------
// Scheduler support
// ------------------------------------------------------------------

/// Select sources that are due for a fetch. Uses a raw SQL expression
/// because SeaORM's expression DSL cannot easily compare `last_enqueued_at`
/// against `now() - fetch_interval_seconds * interval '1 second'`.
pub async fn list_due_sources(
    db: &DatabaseConnection,
    limit: u64,
) -> AppResult<Vec<src_entity::Model>> {
    let sql = "SELECT * FROM warehouse.raw_post_sources \
               WHERE is_active = true \
                 AND (last_enqueued_at IS NULL \
                      OR last_enqueued_at < now() - (fetch_interval_seconds || ' seconds')::interval) \
               ORDER BY COALESCE(last_enqueued_at, to_timestamp(0)) ASC \
               LIMIT $1";
    src_entity::Entity::find()
        .from_raw_sql(Statement::from_sql_and_values(
            sea_orm::DatabaseBackend::Postgres,
            sql,
            [i64::try_from(limit).unwrap_or(100).into()],
        ))
        .all(db)
        .await
        .map_err(AppError::DatabaseError)
}

pub async fn mark_source_enqueued(db: &DatabaseConnection, id: Uuid) -> AppResult<()> {
    let stmt = Statement::from_sql_and_values(
        sea_orm::DatabaseBackend::Postgres,
        "UPDATE warehouse.raw_post_sources \
           SET last_enqueued_at = now(), updated_at = now() \
         WHERE id = $1",
        [id.into()],
    );
    db.execute(stmt).await.map_err(AppError::DatabaseError)?;
    Ok(())
}

pub async fn mark_source_scraped(db: &DatabaseConnection, id: Uuid) -> AppResult<()> {
    let stmt = Statement::from_sql_and_values(
        sea_orm::DatabaseBackend::Postgres,
        "UPDATE warehouse.raw_post_sources \
           SET last_scraped_at = now(), updated_at = now() \
         WHERE id = $1",
        [id.into()],
    );
    db.execute(stmt).await.map_err(AppError::DatabaseError)?;
    Ok(())
}

// ------------------------------------------------------------------
// raw_posts (listing + upsert)
// ------------------------------------------------------------------

pub async fn list_items(
    db: &DatabaseConnection,
    query: ListItemsQuery,
) -> AppResult<RawPostsItemsPage> {
    let limit = clamp_limit(query.limit);
    let offset = query.offset.unwrap_or(0);

    let mut find = WarehouseRawPosts::find();
    if let Some(platform) = query.platform.as_ref() {
        find = find.filter(post_entity::Column::Platform.eq(platform));
    }
    if let Some(status) = query.parse_status.as_ref() {
        find = find.filter(post_entity::Column::ParseStatus.eq(status));
    }
    if let Some(source_id) = query.source_id {
        find = find.filter(post_entity::Column::SourceId.eq(source_id));
    }

    let total = find
        .clone()
        .count(db)
        .await
        .map_err(AppError::DatabaseError)?;

    let rows = find
        .order_by_desc(post_entity::Column::CreatedAt)
        .offset(offset)
        .limit(limit)
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;

    let items = rows.into_iter().map(post_model_to_dto).collect();
    Ok(RawPostsItemsPage {
        items,
        total,
        limit,
        offset,
    })
}

pub async fn get_item(db: &DatabaseConnection, id: Uuid) -> AppResult<RawPost> {
    let item = WarehouseRawPosts::find_by_id(id)
        .one(db)
        .await
        .map_err(AppError::DatabaseError)?
        .ok_or_else(|| AppError::NotFound(format!("raw_post {id} not found")))?;
    Ok(post_model_to_dto(item))
}

/// Insert-or-update a single raw_post given by the ai-server callback.
/// Uniqueness key: `(platform, external_id)`.
pub async fn upsert_raw_post(
    db: &DatabaseConnection,
    source_id: Uuid,
    dispatch_id: Option<String>,
    input: RawPostUpsertInput,
) -> AppResult<()> {
    let now = Utc::now().fixed_offset();
    let model = post_entity::ActiveModel {
        id: Set(Uuid::new_v4()),
        source_id: Set(source_id),
        platform: Set(input.platform),
        external_id: Set(input.external_id),
        external_url: Set(input.external_url),
        image_url: Set(input.image_url),
        r2_key: Set(input.r2_key),
        r2_url: Set(input.r2_url),
        image_hash: Set(None),
        caption: Set(input.caption),
        author_name: Set(input.author_name),
        parse_status: Set("pending".to_string()),
        original_status: Set("pending".to_string()),
        parse_result: Set(None),
        parse_error: Set(None),
        parse_attempts: Set(0),
        seed_post_id: Set(None),
        platform_metadata: Set(input.platform_metadata),
        dispatch_id: Set(dispatch_id),
        created_at: Set(now),
        updated_at: Set(now),
    };

    WarehouseRawPosts::insert(model)
        .on_conflict(
            OnConflict::columns([
                post_entity::Column::Platform,
                post_entity::Column::ExternalId,
            ])
            .update_columns([
                post_entity::Column::SourceId,
                post_entity::Column::ExternalUrl,
                post_entity::Column::ImageUrl,
                post_entity::Column::R2Key,
                post_entity::Column::R2Url,
                post_entity::Column::Caption,
                post_entity::Column::AuthorName,
                post_entity::Column::PlatformMetadata,
                post_entity::Column::DispatchId,
                post_entity::Column::UpdatedAt,
            ])
            .to_owned(),
        )
        .exec(db)
        .await
        .map_err(AppError::DatabaseError)?;
    Ok(())
}

// ------------------------------------------------------------------
// stats
// ------------------------------------------------------------------

pub async fn stats(db: &DatabaseConnection) -> AppResult<Vec<RawPostsStatsEntry>> {
    let stmt = Statement::from_string(
        sea_orm::DatabaseBackend::Postgres,
        "SELECT platform, parse_status, COUNT(*)::bigint AS count \
         FROM warehouse.raw_posts \
         GROUP BY platform, parse_status \
         ORDER BY platform, parse_status"
            .to_string(),
    );
    let rows = db.query_all(stmt).await.map_err(AppError::DatabaseError)?;

    let mut out = Vec::with_capacity(rows.len());
    for row in rows {
        let platform: String = row
            .try_get("", "platform")
            .map_err(AppError::DatabaseError)?;
        let parse_status: String = row
            .try_get("", "parse_status")
            .map_err(AppError::DatabaseError)?;
        let count: i64 = row.try_get("", "count").map_err(AppError::DatabaseError)?;
        out.push(RawPostsStatsEntry {
            platform,
            parse_status,
            count,
        });
    }
    Ok(out)
}

// ------------------------------------------------------------------
// helpers
// ------------------------------------------------------------------

fn source_model_to_dto(m: src_entity::Model) -> RawPostSource {
    RawPostSource {
        id: m.id,
        platform: m.platform,
        source_type: m.source_type,
        source_identifier: m.source_identifier,
        label: m.label,
        is_active: m.is_active,
        fetch_interval_seconds: m.fetch_interval_seconds,
        last_enqueued_at: m.last_enqueued_at,
        last_scraped_at: m.last_scraped_at,
        metadata: m.metadata,
        created_at: m.created_at,
        updated_at: m.updated_at,
    }
}

fn post_model_to_dto(m: post_entity::Model) -> RawPost {
    RawPost {
        id: m.id,
        source_id: m.source_id,
        platform: m.platform,
        external_id: m.external_id,
        external_url: m.external_url,
        image_url: m.image_url,
        r2_key: m.r2_key,
        r2_url: m.r2_url,
        image_hash: m.image_hash,
        caption: m.caption,
        author_name: m.author_name,
        parse_status: m.parse_status,
        original_status: m.original_status,
        parse_attempts: m.parse_attempts,
        parse_result: m.parse_result,
        seed_post_id: m.seed_post_id,
        platform_metadata: m.platform_metadata,
        dispatch_id: m.dispatch_id,
        created_at: m.created_at,
        updated_at: m.updated_at,
    }
}

// ------------------------------------------------------------------
// source_media_originals (#261) + admin actions (#289)
// ------------------------------------------------------------------

pub async fn list_originals(
    db: &DatabaseConnection,
    raw_post_id: Uuid,
) -> AppResult<Vec<SourceMediaOriginal>> {
    let rows = WarehouseSourceMediaOriginals::find()
        .filter(orig_entity::Column::RawPostId.eq(raw_post_id))
        .order_by_desc(orig_entity::Column::IsPrimary)
        .order_by_desc(orig_entity::Column::CreatedAt)
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;
    Ok(rows.into_iter().map(original_model_to_dto).collect())
}

pub async fn update_seed_status(
    db: &DatabaseConnection,
    raw_post_id: Uuid,
    status: &str,
) -> AppResult<(Uuid, String)> {
    // Look up the raw_post → seed_post_id linkage first.
    let raw_post = WarehouseRawPosts::find_by_id(raw_post_id)
        .one(db)
        .await
        .map_err(AppError::DatabaseError)?
        .ok_or_else(|| AppError::NotFound(format!("raw_post {raw_post_id} not found")))?;
    let seed_post_id = raw_post.seed_post_id.ok_or_else(|| {
        AppError::BadRequest(format!(
            "raw_post {raw_post_id} has no seed_post yet — reparse first"
        ))
    })?;
    let stmt = Statement::from_sql_and_values(
        sea_orm::DatabaseBackend::Postgres,
        "UPDATE warehouse.seed_posts \
           SET status = $2, updated_at = now() \
         WHERE id = $1 \
         RETURNING id",
        [seed_post_id.into(), status.into()],
    );
    let rows = db.query_all(stmt).await.map_err(AppError::DatabaseError)?;
    if rows.is_empty() {
        return Err(AppError::NotFound(format!(
            "seed_post {seed_post_id} not found"
        )));
    }
    Ok((seed_post_id, status.to_string()))
}

fn original_model_to_dto(m: orig_entity::Model) -> SourceMediaOriginal {
    SourceMediaOriginal {
        id: m.id,
        raw_post_id: m.raw_post_id,
        origin_url: m.origin_url,
        origin_domain: m.origin_domain,
        r2_key: m.r2_key,
        r2_url: m.r2_url,
        width: m.width,
        height: m.height,
        byte_size: m.byte_size,
        image_hash: m.image_hash,
        search_provider: m.search_provider,
        is_primary: m.is_primary,
        metadata: m.metadata,
        created_at: m.created_at,
    }
}
