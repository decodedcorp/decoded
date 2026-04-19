//! Raw Posts dispatch batch (#258)
//!
//! Every 5 minutes, scans `warehouse.raw_post_sources` for targets that
//! are due and asks ai-server to enqueue a fetch job for each. The actual
//! scraping + R2 upload + DB upsert all happen asynchronously via the
//! callback path — this job only hands out work.

use crate::{config::AppState, domains::raw_posts::service};
use std::sync::Arc;
use tracing::{error, info, warn};
use uuid::Uuid;

const DUE_LIMIT: u64 = 100;
const FETCH_LIMIT_PER_SOURCE: i32 = 50;

pub async fn run(state: Arc<AppState>) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let dispatch_id = Uuid::new_v4().to_string();
    info!(dispatch_id = %dispatch_id, "raw_posts_dispatch: starting");

    let db = state.db.as_ref();

    let due = service::list_due_sources(db, DUE_LIMIT).await.map_err(
        |e| -> Box<dyn std::error::Error + Send + Sync> {
            Box::new(std::io::Error::other(e.to_string()))
        },
    )?;

    if due.is_empty() {
        info!("raw_posts_dispatch: no due sources");
        return Ok(());
    }

    info!(
        "raw_posts_dispatch: {} due source(s), dispatch_id={}",
        due.len(),
        dispatch_id
    );

    let mut dispatched = 0usize;
    let mut errors = 0usize;

    for src in due {
        let source_id_str = src.id.to_string();
        match state
            .decoded_ai_client
            .enqueue_fetch_raw_posts(
                source_id_str.clone(),
                src.platform.clone(),
                src.source_type.clone(),
                src.source_identifier.clone(),
                FETCH_LIMIT_PER_SOURCE,
                dispatch_id.clone(),
            )
            .await
        {
            Ok(ack) => {
                if ack.success {
                    if let Err(e) = service::mark_source_enqueued(db, src.id).await {
                        warn!(
                            source_id = %src.id,
                            error = ?e,
                            "raw_posts_dispatch: mark_source_enqueued failed"
                        );
                    }
                    dispatched += 1;
                } else {
                    warn!(
                        source_id = %src.id,
                        message = %ack.message,
                        "raw_posts_dispatch: ai-server rejected enqueue"
                    );
                    errors += 1;
                }
            }
            Err(e) => {
                error!(
                    source_id = %src.id,
                    error = %e,
                    "raw_posts_dispatch: enqueue_fetch_raw_posts failed"
                );
                errors += 1;
            }
        }
    }

    info!(
        "raw_posts_dispatch: done — dispatched={}, errors={}, dispatch_id={}",
        dispatched, errors, dispatch_id
    );
    Ok(())
}
