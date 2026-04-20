//! RawPostsCallback gRPC server implementation (#258)
//!
//! Implements the `outbound.RawPostsCallback` service. ai-server calls
//! `ReportRawPostsFetched` once per dispatched source to hand over
//! scraped metadata + R2 URLs. This server upserts rows into
//! `warehouse.raw_posts` and updates the source row on success.

use std::sync::Arc;

use sea_orm::DatabaseConnection;
use serde_json::Value as JsonValue;
use tonic::{Request, Response, Status};
use uuid::Uuid;

use crate::domains::raw_posts::{dto::RawPostUpsertInput, service};
use crate::grpc::outbound::{
    raw_posts_callback_server::RawPostsCallback, RawPostsFetchStatus, ReportRawPostsFetchedRequest,
    ReportRawPostsFetchedResponse,
};

pub struct RawPostsCallbackService {
    db: Arc<DatabaseConnection>,
}

impl RawPostsCallbackService {
    pub fn new(db: Arc<DatabaseConnection>) -> Self {
        Self { db }
    }
}

#[tonic::async_trait]
impl RawPostsCallback for RawPostsCallbackService {
    async fn report_raw_posts_fetched(
        &self,
        request: Request<ReportRawPostsFetchedRequest>,
    ) -> Result<Response<ReportRawPostsFetchedResponse>, Status> {
        let req = request.into_inner();
        let source_id = Uuid::parse_str(&req.source_id).map_err(|e| {
            Status::invalid_argument(format!("invalid source_id ({}): {}", req.source_id, e))
        })?;

        let status =
            RawPostsFetchStatus::try_from(req.status).unwrap_or(RawPostsFetchStatus::Unspecified);

        tracing::info!(
            source_id = %source_id,
            dispatch_id = %req.dispatch_id,
            platform = %req.platform,
            fetched_count = req.fetched_count,
            status = ?status,
            "ReportRawPostsFetched: received"
        );

        let db_ref = self.db.as_ref();
        let dispatch_id_opt = if req.dispatch_id.is_empty() {
            None
        } else {
            Some(req.dispatch_id.clone())
        };

        let mut upserted = 0i32;
        for result in &req.raw_posts {
            let platform_metadata = parse_optional_json(&result.platform_metadata_json);
            let input = RawPostUpsertInput {
                platform: req.platform.clone(),
                external_id: result.external_id.clone(),
                external_url: result.external_url.clone(),
                image_url: result.image_url.clone(),
                r2_key: opt_string(&result.r2_key),
                r2_url: opt_string(&result.r2_url),
                caption: result.caption.clone(),
                author_name: result.author_name.clone(),
                platform_metadata,
            };
            match service::upsert_raw_post(db_ref, source_id, dispatch_id_opt.clone(), input).await
            {
                Ok(()) => upserted += 1,
                Err(e) => {
                    tracing::warn!(
                        source_id = %source_id,
                        external_id = %result.external_id,
                        error = ?e,
                        "ReportRawPostsFetched: upsert failed"
                    );
                }
            }
        }

        if matches!(status, RawPostsFetchStatus::Success) {
            if let Err(e) = service::mark_source_scraped(db_ref, source_id).await {
                tracing::warn!(
                    source_id = %source_id,
                    error = ?e,
                    "ReportRawPostsFetched: mark_source_scraped failed"
                );
            }
        } else if matches!(status, RawPostsFetchStatus::Failed) {
            tracing::warn!(
                source_id = %source_id,
                error_message = %req.error_message,
                "ReportRawPostsFetched: reported FAILED"
            );
        }

        Ok(Response::new(ReportRawPostsFetchedResponse {
            received: true,
            upserted_count: upserted,
        }))
    }
}

fn opt_string(s: &str) -> Option<String> {
    if s.is_empty() {
        None
    } else {
        Some(s.to_string())
    }
}

fn parse_optional_json(raw: &str) -> Option<JsonValue> {
    if raw.trim().is_empty() {
        return None;
    }
    match serde_json::from_str::<JsonValue>(raw) {
        Ok(v) => Some(v),
        Err(e) => {
            tracing::warn!(
                error = ?e,
                payload_len = raw.len(),
                "RawPostsCallback: invalid platform_metadata_json, ignoring"
            );
            None
        }
    }
}
