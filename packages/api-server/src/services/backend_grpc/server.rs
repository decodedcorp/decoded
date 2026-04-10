//! gRPC 메타데이터 서버 — `serde_json::json!` 매크로 전개로 Clippy `disallowed_methods`와 충돌하므로 모듈 단위 허용.
#![allow(clippy::disallowed_methods)]

use crate::entities::{
    failed_batch_items, processed_batches, solutions::Entity as Solutions, FailedBatchItems,
    ProcessedBatches,
};
use crate::grpc::outbound::{
    metadata_server::Metadata, ProcessedBatchRequest, ProcessedBatchResponse,
};
use crate::services::upsert_solution_embedding;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set,
    TransactionTrait,
};
use serde_json::json;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Instant;
use tonic::{Request, Response, Status};
use uuid::Uuid;

use crate::services::EmbeddingClient;

pub struct BackendGrpcService {
    db: Arc<DatabaseConnection>,
    embedding_client: Arc<dyn EmbeddingClient>,
}

impl BackendGrpcService {
    pub fn new(db: Arc<DatabaseConnection>, embedding_client: Arc<dyn EmbeddingClient>) -> Self {
        Self {
            db,
            embedding_client,
        }
    }
}

#[tonic::async_trait]
impl Metadata for BackendGrpcService {
    async fn processed_batch_update(
        &self,
        request: Request<ProcessedBatchRequest>,
    ) -> Result<Response<ProcessedBatchResponse>, Status> {
        let start_time = Instant::now();
        let req = request.into_inner();
        let batch_id = req.batch_id.clone();
        let batch_id_for_error_log = batch_id.clone(); // 에러 로그용

        tracing::info!(
            batch_id = %batch_id,
            total_count = req.results.len(),
            "Received ProcessedBatchUpdate"
        );

        // 트랜잭션 시작
        let result = self
            .db.as_ref()
            .transaction::<_, (ProcessedBatchResponse, Vec<Uuid>), Status>(|txn| {
                Box::pin(async move {
                    // 1. Idempotency 체크
                    if Self::check_batch_processed(txn, &batch_id).await? {
                        tracing::info!(batch_id = %batch_id, "Batch already processed (idempotency)");
                        return Ok((
                            ProcessedBatchResponse {
                                success: true,
                                message: format!("Batch {} already processed", batch_id),
                                processed_count: req.results.len() as i32,
                            },
                            Vec::new(),
                        ));
                    }

                    // 2. item_id 파싱 및 수집
                    let mut item_ids = Vec::new();
                    for result in &req.results {
                        if !result.item_id.is_empty() {
                            if let Ok(uuid) = Uuid::parse_str(&result.item_id) {
                                item_ids.push(uuid);
                            }
                        }
                    }

                    // 3. Bulk 조회 (N+1 제거)
                    let solutions = Solutions::find()
                        .filter(
                            crate::entities::solutions::Column::Id.is_in(item_ids.clone()),
                        )
                        .all(txn)
                        .await
                        .map_err(|e| {
                            Status::internal(format!("Failed to fetch solutions: {}", e))
                        })?;

                    // HashMap으로 빠른 조회
                    let solution_map: HashMap<Uuid, crate::entities::solutions::Model> =
                        solutions.into_iter().map(|s| (s.id, s)).collect();

                    // 4. 각 항목 처리
                    let mut success_count = 0;
                    let mut partial_count = 0;
                    let mut failed_count = 0;
                    let mut errors = Vec::new();
                    let mut ids_to_embed = Vec::new();

                    for result in req.results {
                        // 필요한 값들을 미리 추출 (ownership 문제 방지)
                        let item_id_str = result.item_id.clone();
                        let url = result.url.clone();
                        let status = result.status.clone();

                        if item_id_str.is_empty() {
                            tracing::warn!("Batch item missing item_id, skipping");
                            failed_count += 1;
                            continue;
                        }

                        let solution_id = match Uuid::parse_str(&item_id_str) {
                            Ok(id) => id,
                            Err(_) => {
                                tracing::warn!("Invalid item_id format: {}", item_id_str);
                                errors.push(format!("Invalid item_id: {}", item_id_str));
                                failed_count += 1;
                                continue;
                            }
                        };

                        // Status 기반 처리
                        match status.as_str() {
                            "success" => {
                                match Self::process_success_item(
                                    txn,
                                    &solution_map,
                                    solution_id,
                                    result,
                                )
                                .await
                                {
                                    Ok(_) => {
                                        success_count += 1;
                                        ids_to_embed.push(solution_id);
                                    }
                                    Err(e) => {
                                        tracing::error!(
                                            "Failed to process success item {}: {}",
                                            solution_id,
                                            e
                                        );
                                        // 실패 항목 저장
                                        let _ = Self::save_failed_item(
                                            txn,
                                            &item_id_str,
                                            &batch_id,
                                            &url,
                                            &status,
                                            &e.to_string(),
                                        )
                                        .await;
                                        errors.push(e.to_string());
                                        failed_count += 1;
                                    }
                                }
                            }
                            "partial" => {
                                match Self::process_partial_item(
                                    txn,
                                    &solution_map,
                                    solution_id,
                                    result,
                                )
                                .await
                                {
                                    Ok(_) => {
                                        partial_count += 1;
                                        ids_to_embed.push(solution_id);
                                    }
                                    Err(e) => {
                                        tracing::error!(
                                            "Failed to process partial item {}: {}",
                                            solution_id,
                                            e
                                        );
                                        // 실패 항목 저장
                                        let _ = Self::save_failed_item(
                                            txn,
                                            &item_id_str,
                                            &batch_id,
                                            &url,
                                            &status,
                                            &e.to_string(),
                                        )
                                        .await;
                                        errors.push(e.to_string());
                                        failed_count += 1;
                                    }
                                }
                            }
                            "failed" => {
                                let error_msg = result.error_message.as_deref().unwrap_or("Unknown error").to_string();
                                tracing::warn!(
                                    item_id = %item_id_str,
                                    error = %error_msg,
                                    "Failed item received"
                                );
                                // 실패 항목 저장
                                let _ = Self::save_failed_item(
                                    txn,
                                    &item_id_str,
                                    &batch_id,
                                    &url,
                                    &status,
                                    &error_msg,
                                )
                                .await;
                                failed_count += 1;
                            }
                            _ => {
                                tracing::warn!(
                                    item_id = %item_id_str,
                                    status = %status,
                                    "Unknown status"
                                );
                                failed_count += 1;
                            }
                        }
                    }

                    // 5. 배치 이력 저장
                    let processing_time_ms = start_time.elapsed().as_millis() as i32;
                    let total_count = success_count + partial_count + failed_count;

                    Self::save_batch_history(
                        txn,
                        &batch_id,
                        req.processing_timestamp,
                        total_count,
                        success_count,
                        partial_count,
                        failed_count,
                        processing_time_ms,
                    )
                    .await?;

                    tracing::info!(
                        batch_id = %batch_id,
                        success_count,
                        partial_count,
                        failed_count,
                        processing_time_ms,
                        "Batch processing completed"
                    );

                    let message = if errors.is_empty() {
                        format!(
                            "Processed {} items ({} success, {} partial, {} failed)",
                            total_count, success_count, partial_count, failed_count
                        )
                    } else {
                        format!(
                            "Processed {} items ({} success, {} partial, {} failed). Errors: {}",
                            total_count,
                            success_count,
                            partial_count,
                            failed_count,
                            errors.join("; ")
                        )
                    };

                    Ok((
                        ProcessedBatchResponse {
                            success: true,
                            message,
                            processed_count: (success_count + partial_count),
                        },
                        ids_to_embed,
                    ))
                })
            })
            .await;

        match result {
            Ok((response, ids_to_embed)) => {
                let db = self.db.clone();
                let embedding_client = self.embedding_client.clone();
                for solution_id in ids_to_embed {
                    let db = db.clone();
                    let ec = embedding_client.clone();
                    tokio::spawn(async move {
                        upsert_solution_embedding(db, ec, solution_id).await;
                    });
                }
                Ok(Response::new(response))
            }
            Err(e) => {
                let status_error = match e {
                    sea_orm::TransactionError::Connection(db_err) => {
                        Status::internal(format!("Database error: {}", db_err))
                    }
                    sea_orm::TransactionError::Transaction(status) => status,
                };
                tracing::error!(batch_id = %batch_id_for_error_log, "Batch processing failed: {}", status_error);
                Err(status_error)
            }
        }
    }
}

// Helper methods
impl BackendGrpcService {
    /// Idempotency 체크
    pub(super) async fn check_batch_processed<C>(txn: &C, batch_id: &str) -> Result<bool, Status>
    where
        C: sea_orm::ConnectionTrait,
    {
        ProcessedBatches::find_by_id(batch_id)
            .one(txn)
            .await
            .map(|opt| opt.is_some())
            .map_err(|e| Status::internal(format!("Failed to check batch: {}", e)))
    }

    /// Success 항목 처리 (모든 메타데이터 저장)
    pub(super) async fn process_success_item<C>(
        txn: &C,
        solution_map: &HashMap<Uuid, crate::entities::solutions::Model>,
        solution_id: Uuid,
        result: crate::grpc::outbound::BatchItemResult,
    ) -> Result<(), Status>
    where
        C: sea_orm::ConnectionTrait,
    {
        let solution = solution_map
            .get(&solution_id)
            .ok_or_else(|| Status::not_found(format!("Solution not found: {}", solution_id)))?;

        let mut active_solution: crate::entities::solutions::ActiveModel = solution.clone().into();

        // link_metadata 처리
        if let Some(link_metadata) = result.link_metadata {
            // link_type
            let link_type = link_metadata.link_type.trim();
            if !link_type.is_empty() {
                active_solution.link_type = Set(Some(link_type.to_string()));
            }

            // description (summary)
            if let Some(summary) = link_metadata.summary.as_str().strip_suffix('\0') {
                let summary = summary.trim();
                if !summary.is_empty() {
                    active_solution.description = Set(Some(summary.to_string()));
                }
            }

            // QnA
            if !link_metadata.qna.is_empty() {
                let qna_json = json!(link_metadata
                    .qna
                    .iter()
                    .map(|qa| {
                        json!({
                            "question": qa.question.trim_end_matches('\0'),
                            "answer": qa.answer.trim_end_matches('\0')
                        })
                    })
                    .collect::<Vec<_>>());
                active_solution.qna = Set(Some(qna_json));
            }

            // Keywords
            if !link_metadata.keywords.is_empty() {
                let keywords: Vec<String> = link_metadata
                    .keywords
                    .iter()
                    .map(|k| k.trim_end_matches('\0').trim().to_string())
                    .filter(|k| !k.is_empty())
                    .collect();

                if !keywords.is_empty() {
                    active_solution.keywords = Set(Some(json!(keywords)));
                }
            }

            // Metadata (citations + dynamic metadata)
            let mut metadata = json!({});

            if !link_metadata.citations.is_empty() {
                let citations: Vec<String> = link_metadata
                    .citations
                    .iter()
                    .map(|c| c.trim_end_matches('\0').trim().to_string())
                    .filter(|c| !c.is_empty())
                    .collect();
                if !citations.is_empty() {
                    metadata["citations"] = json!(citations);
                }
            }

            if !link_metadata.metadata.is_empty() {
                let dynamic_metadata: HashMap<String, String> = link_metadata
                    .metadata
                    .into_iter()
                    .map(|(k, v)| (k, v.trim_end_matches('\0').trim().to_string()))
                    .filter(|(_, v)| !v.is_empty())
                    .collect();

                for (k, v) in dynamic_metadata {
                    if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(&v) {
                        metadata[k] = parsed;
                    } else {
                        metadata[k] = json!(v);
                    }
                }
            }

            if !metadata.as_object().unwrap().is_empty() {
                active_solution.metadata = Set(Some(metadata));
            }
        }

        // DB 업데이트
        active_solution
            .update(txn)
            .await
            .map_err(|e| Status::internal(format!("Failed to update solution: {}", e)))?;

        tracing::info!(solution_id = %solution_id, "Success item processed");
        Ok(())
    }

    /// Partial 항목 처리 (있는 필드만 업데이트)
    pub(super) async fn process_partial_item<C>(
        txn: &C,
        solution_map: &HashMap<Uuid, crate::entities::solutions::Model>,
        solution_id: Uuid,
        result: crate::grpc::outbound::BatchItemResult,
    ) -> Result<(), Status>
    where
        C: sea_orm::ConnectionTrait,
    {
        let solution = solution_map
            .get(&solution_id)
            .ok_or_else(|| Status::not_found(format!("Solution not found: {}", solution_id)))?;

        let mut active_solution: crate::entities::solutions::ActiveModel = solution.clone().into();

        // link_metadata 처리 (null 체크)
        if let Some(link_metadata) = result.link_metadata {
            // link_type
            let link_type = link_metadata.link_type.trim();
            if !link_type.is_empty() {
                active_solution.link_type = Set(Some(link_type.to_string()));
            }

            // description (summary) - 있으면 업데이트
            if let Some(summary) = link_metadata.summary.as_str().strip_suffix('\0') {
                let summary = summary.trim();
                if !summary.is_empty() {
                    active_solution.description = Set(Some(summary.to_string()));
                }
            }

            // Keywords - 있으면 기존과 병합
            if !link_metadata.keywords.is_empty() {
                let new_keywords: Vec<String> = link_metadata
                    .keywords
                    .iter()
                    .map(|k| k.trim_end_matches('\0').trim().to_string())
                    .filter(|k| !k.is_empty())
                    .collect();

                if !new_keywords.is_empty() {
                    // 기존 keywords와 병합
                    let mut merged_keywords = if let Some(existing) = &solution.keywords {
                        serde_json::from_value::<Vec<String>>(existing.clone()).unwrap_or_default()
                    } else {
                        Vec::new()
                    };

                    merged_keywords.extend(new_keywords);
                    merged_keywords.sort();
                    merged_keywords.dedup();

                    active_solution.keywords = Set(Some(json!(merged_keywords)));
                }
            }
        }

        // DB 업데이트
        active_solution
            .update(txn)
            .await
            .map_err(|e| Status::internal(format!("Failed to update solution: {}", e)))?;

        tracing::info!(solution_id = %solution_id, "Partial item processed");
        Ok(())
    }

    /// 실패 항목 저장 (재시도 큐)
    pub(super) async fn save_failed_item<C>(
        txn: &C,
        item_id: &str,
        batch_id: &str,
        url: &str,
        status: &str,
        error_message: &str,
    ) -> Result<(), Status>
    where
        C: sea_orm::ConnectionTrait,
    {
        let now = chrono::Utc::now();
        let next_retry_at = now + chrono::Duration::seconds(2); // 첫 재시도: 2초 후

        let failed_item = failed_batch_items::ActiveModel {
            id: Set(Uuid::new_v4()),
            item_id: Set(item_id.to_string()),
            batch_id: Set(batch_id.to_string()),
            url: Set(url.to_string()),
            status: Set(status.to_string()),
            error_message: Set(Some(error_message.to_string())),
            retry_count: Set(0),
            next_retry_at: Set(next_retry_at.into()),
            created_at: Set(now.into()),
            updated_at: Set(now.into()),
        };

        FailedBatchItems::insert(failed_item)
            .exec(txn)
            .await
            .map_err(|e| Status::internal(format!("Failed to save failed item: {}", e)))?;

        tracing::info!(item_id, batch_id, "Failed item saved for retry");
        Ok(())
    }

    /// 배치 이력 저장
    #[allow(clippy::too_many_arguments)]
    pub(super) async fn save_batch_history<C>(
        txn: &C,
        batch_id: &str,
        processing_timestamp: i64,
        total_count: i32,
        success_count: i32,
        partial_count: i32,
        failed_count: i32,
        processing_time_ms: i32,
    ) -> Result<(), Status>
    where
        C: sea_orm::ConnectionTrait,
    {
        let now = chrono::Utc::now();
        let processing_ts =
            chrono::DateTime::from_timestamp(processing_timestamp, 0).unwrap_or(now);

        let batch = processed_batches::ActiveModel {
            batch_id: Set(batch_id.to_string()),
            processing_timestamp: Set(processing_ts.into()),
            total_count: Set(total_count),
            success_count: Set(success_count),
            partial_count: Set(partial_count),
            failed_count: Set(failed_count),
            processing_time_ms: Set(processing_time_ms),
            created_at: Set(now.into()),
        };

        ProcessedBatches::insert(batch)
            .exec(txn)
            .await
            .map_err(|e| Status::internal(format!("Failed to save batch history: {}", e)))?;

        Ok(())
    }
}
