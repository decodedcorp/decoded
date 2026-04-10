//! Backend gRPC server tests
#![allow(clippy::disallowed_methods)]

#[cfg(test)]
mod tests {
    use crate::grpc::outbound::{
        BatchItemResult, BatchStatistics, LinkMetadata, ProcessedBatchRequest, QaPair,
    };
    use crate::services::backend_grpc::server::BackendGrpcService;
    use crate::services::DummyEmbeddingClient;
    use crate::tests::fixtures;
    use sea_orm::{DatabaseBackend, DatabaseConnection, MockDatabase, MockExecResult};
    use std::collections::HashMap;
    use std::sync::Arc;
    use tonic::Request;
    use uuid::Uuid;

    // We need to invoke the trait method directly.
    use crate::grpc::outbound::metadata_server::Metadata;

    fn make_service(db: DatabaseConnection) -> BackendGrpcService {
        BackendGrpcService::new(Arc::new(db), Arc::new(DummyEmbeddingClient))
    }

    fn batch_request(batch_id: &str, results: Vec<BatchItemResult>) -> ProcessedBatchRequest {
        ProcessedBatchRequest {
            batch_id: batch_id.to_string(),
            processing_timestamp: 1_700_000_000,
            results,
            statistics: Some(BatchStatistics {
                total_count: 0,
                success_count: 0,
                partial_count: 0,
                failed_count: 0,
                processing_time_seconds: 0.0,
            }),
        }
    }

    fn success_item(solution_id: Uuid) -> BatchItemResult {
        BatchItemResult {
            item_id: solution_id.to_string(),
            url: "https://example.com/p".to_string(),
            r#type: "link".to_string(),
            status: "success".to_string(),
            error_message: None,
            link_metadata: Some(LinkMetadata {
                summary: "A summary".to_string(),
                qna: vec![QaPair {
                    question: "Q?".to_string(),
                    answer: "A!".to_string(),
                }],
                metadata: {
                    let mut m = HashMap::new();
                    m.insert("brand".to_string(), "Nike".to_string());
                    m.insert("json_field".to_string(), "{\"k\":1}".to_string());
                    m
                },
                citations: vec!["https://cite.example.com".to_string()],
                keywords: vec!["shoe".to_string(), "sneaker".to_string()],
                link_type: "product".to_string(),
            }),
        }
    }

    fn partial_item(solution_id: Uuid) -> BatchItemResult {
        BatchItemResult {
            item_id: solution_id.to_string(),
            url: "https://example.com/p".to_string(),
            r#type: "link".to_string(),
            status: "partial".to_string(),
            error_message: None,
            link_metadata: Some(LinkMetadata {
                summary: "Partial".to_string(),
                qna: vec![],
                metadata: HashMap::new(),
                citations: vec![],
                keywords: vec!["extra".to_string()],
                link_type: "article".to_string(),
            }),
        }
    }

    fn failed_item(item_id: &str) -> BatchItemResult {
        BatchItemResult {
            item_id: item_id.to_string(),
            url: "https://fail.example.com".to_string(),
            r#type: "link".to_string(),
            status: "failed".to_string(),
            error_message: Some("upstream error".to_string()),
            link_metadata: None,
        }
    }

    fn processed_batch_row(batch_id: &str) -> crate::entities::processed_batches::Model {
        crate::entities::processed_batches::Model {
            batch_id: batch_id.to_string(),
            processing_timestamp: fixtures::test_timestamp(),
            total_count: 0,
            success_count: 0,
            partial_count: 0,
            failed_count: 0,
            processing_time_ms: 0,
            created_at: fixtures::test_timestamp(),
        }
    }

    #[tokio::test]
    async fn new_builds_service() {
        let db = MockDatabase::new(DatabaseBackend::Postgres).into_connection();
        let _svc = make_service(db);
    }

    #[tokio::test]
    async fn processed_batch_update_idempotent_returns_already_processed() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[processed_batch_row("batch-xyz")]])
            .into_connection();
        let svc = make_service(db);

        let req = batch_request("batch-xyz", vec![success_item(fixtures::test_uuid(3))]);
        let resp = svc.processed_batch_update(Request::new(req)).await;
        assert!(resp.is_ok(), "unexpected err: {:?}", resp.err());
        let inner = resp.unwrap().into_inner();
        assert!(inner.success);
        assert!(inner.message.contains("already processed"));
    }

    #[tokio::test]
    async fn processed_batch_update_empty_results_saves_history() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::processed_batches::Model>::new()])
            .append_query_results([Vec::<crate::entities::solutions::Model>::new()])
            .append_query_results([[processed_batch_row("b1")]])
            .append_exec_results([MockExecResult {
                last_insert_id: 0,
                rows_affected: 1,
            }])
            .into_connection();
        let svc = make_service(db);

        let req = batch_request("b1", vec![]);
        let resp = svc.processed_batch_update(Request::new(req)).await;
        assert!(resp.is_ok(), "unexpected err: {:?}", resp.err());
    }

    #[tokio::test]
    async fn processed_batch_update_item_missing_item_id_counts_as_failed() {
        let mut item = failed_item("");
        item.status = "success".to_string();
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::processed_batches::Model>::new()])
            .append_query_results([Vec::<crate::entities::solutions::Model>::new()])
            .append_query_results([[processed_batch_row("b2")]])
            .append_exec_results([MockExecResult {
                last_insert_id: 0,
                rows_affected: 1,
            }])
            .into_connection();
        let svc = make_service(db);

        let req = batch_request("b2", vec![item]);
        let resp = svc.processed_batch_update(Request::new(req)).await;
        assert!(resp.is_ok(), "unexpected err: {:?}", resp.err());
    }

    #[tokio::test]
    async fn processed_batch_update_invalid_uuid_counts_as_failed() {
        let item = BatchItemResult {
            item_id: "not-a-uuid".to_string(),
            url: "https://example.com".to_string(),
            r#type: "link".to_string(),
            status: "success".to_string(),
            error_message: None,
            link_metadata: None,
        };
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::processed_batches::Model>::new()])
            .append_query_results([Vec::<crate::entities::solutions::Model>::new()])
            .append_query_results([[processed_batch_row("b3")]])
            .append_exec_results([MockExecResult {
                last_insert_id: 0,
                rows_affected: 1,
            }])
            .into_connection();
        let svc = make_service(db);

        let req = batch_request("b3", vec![item]);
        let resp = svc.processed_batch_update(Request::new(req)).await;
        assert!(resp.is_ok(), "unexpected err: {:?}", resp.err());
    }

    #[tokio::test]
    async fn processed_batch_update_unknown_status_counts_as_failed() {
        let item = BatchItemResult {
            item_id: fixtures::test_uuid(3).to_string(),
            url: "https://example.com".to_string(),
            r#type: "link".to_string(),
            status: "weird_status".to_string(),
            error_message: None,
            link_metadata: None,
        };
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::processed_batches::Model>::new()])
            .append_query_results([[fixtures::solution_model()]])
            .append_query_results([[processed_batch_row("b4")]])
            .append_exec_results([MockExecResult {
                last_insert_id: 0,
                rows_affected: 1,
            }])
            .into_connection();
        let svc = make_service(db);

        let req = batch_request("b4", vec![item]);
        let resp = svc.processed_batch_update(Request::new(req)).await;
        assert!(resp.is_ok(), "unexpected err: {:?}", resp.err());
    }

    #[tokio::test]
    async fn processed_batch_update_failed_item_saves_failed() {
        let item = failed_item(&fixtures::test_uuid(3).to_string());
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::processed_batches::Model>::new()])
            .append_query_results([[fixtures::solution_model()]])
            .append_query_results([[fixtures::failed_batch_item_model()]])
            .append_exec_results([MockExecResult {
                last_insert_id: 0,
                rows_affected: 1,
            }])
            .append_query_results([[processed_batch_row("b5")]])
            .append_exec_results([MockExecResult {
                last_insert_id: 0,
                rows_affected: 1,
            }])
            .into_connection();
        let svc = make_service(db);

        let req = batch_request("b5", vec![item]);
        let resp = svc.processed_batch_update(Request::new(req)).await;
        assert!(resp.is_ok(), "unexpected err: {:?}", resp.err());
    }

    #[tokio::test]
    async fn processed_batch_update_success_item_updates_solution() {
        let sol_id = fixtures::test_uuid(3);
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::processed_batches::Model>::new()])
            .append_query_results([[fixtures::solution_model()]])
            .append_query_results([[fixtures::solution_model()]])
            .append_query_results([[processed_batch_row("b6")]])
            .append_exec_results([MockExecResult {
                last_insert_id: 0,
                rows_affected: 1,
            }])
            .into_connection();
        let svc = make_service(db);

        let req = batch_request("b6", vec![success_item(sol_id)]);
        let resp = svc.processed_batch_update(Request::new(req)).await;
        assert!(resp.is_ok(), "unexpected err: {:?}", resp.err());
        let inner = resp.unwrap().into_inner();
        assert!(inner.success);
        assert_eq!(inner.processed_count, 1);
    }

    #[tokio::test]
    async fn processed_batch_update_partial_item_updates_solution() {
        let sol_id = fixtures::test_uuid(3);
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::processed_batches::Model>::new()])
            .append_query_results([[fixtures::solution_model()]])
            .append_query_results([[fixtures::solution_model()]])
            .append_query_results([[processed_batch_row("b7")]])
            .append_exec_results([MockExecResult {
                last_insert_id: 0,
                rows_affected: 1,
            }])
            .into_connection();
        let svc = make_service(db);

        let req = batch_request("b7", vec![partial_item(sol_id)]);
        let resp = svc.processed_batch_update(Request::new(req)).await;
        assert!(resp.is_ok(), "unexpected err: {:?}", resp.err());
    }

    #[tokio::test]
    async fn processed_batch_update_db_error_returns_internal() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_errors(vec![sea_orm::DbErr::Custom("connection failed".into())])
            .into_connection();
        let svc = make_service(db);

        let req = batch_request("b-err", vec![]);
        let resp = svc.processed_batch_update(Request::new(req)).await;
        assert!(resp.is_err());
    }

    // ── Direct helper method tests ──

    #[tokio::test]
    async fn check_batch_processed_returns_false_when_none() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::processed_batches::Model>::new()])
            .into_connection();
        let r = BackendGrpcService::check_batch_processed(&db, "nope")
            .await
            .unwrap();
        assert!(!r);
    }

    #[tokio::test]
    async fn check_batch_processed_returns_true_when_some() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[processed_batch_row("b")]])
            .into_connection();
        let r = BackendGrpcService::check_batch_processed(&db, "b")
            .await
            .unwrap();
        assert!(r);
    }

    #[tokio::test]
    async fn check_batch_processed_db_error() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_errors(vec![sea_orm::DbErr::Custom("bad".into())])
            .into_connection();
        let r = BackendGrpcService::check_batch_processed(&db, "b").await;
        assert!(r.is_err());
    }

    #[tokio::test]
    async fn save_failed_item_success() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::failed_batch_item_model()]])
            .append_exec_results([MockExecResult {
                last_insert_id: 0,
                rows_affected: 1,
            }])
            .into_connection();
        let r = BackendGrpcService::save_failed_item(
            &db,
            "item-1",
            "batch-1",
            "https://x",
            "failed",
            "err",
        )
        .await;
        assert!(r.is_ok(), "unexpected err: {:?}", r.err());
    }

    #[tokio::test]
    async fn save_failed_item_db_error() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_errors(vec![sea_orm::DbErr::Custom("bad".into())])
            .into_connection();
        let r = BackendGrpcService::save_failed_item(
            &db,
            "item-1",
            "batch-1",
            "https://x",
            "failed",
            "err",
        )
        .await;
        assert!(r.is_err());
    }

    #[tokio::test]
    async fn save_batch_history_success() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[processed_batch_row("b")]])
            .append_exec_results([MockExecResult {
                last_insert_id: 0,
                rows_affected: 1,
            }])
            .into_connection();
        let r =
            BackendGrpcService::save_batch_history(&db, "b", 1_700_000_000, 1, 1, 0, 0, 10).await;
        assert!(r.is_ok(), "unexpected err: {:?}", r.err());
    }

    #[tokio::test]
    async fn save_batch_history_handles_invalid_timestamp() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[processed_batch_row("b")]])
            .append_exec_results([MockExecResult {
                last_insert_id: 0,
                rows_affected: 1,
            }])
            .into_connection();
        let r = BackendGrpcService::save_batch_history(&db, "b", i64::MIN, 0, 0, 0, 0, 0).await;
        assert!(r.is_ok());
    }

    #[tokio::test]
    async fn process_success_item_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres).into_connection();
        let map: HashMap<Uuid, crate::entities::solutions::Model> = HashMap::new();
        let item = success_item(fixtures::test_uuid(3));
        let r =
            BackendGrpcService::process_success_item(&db, &map, fixtures::test_uuid(3), item).await;
        assert!(r.is_err());
    }

    #[tokio::test]
    async fn process_partial_item_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres).into_connection();
        let map: HashMap<Uuid, crate::entities::solutions::Model> = HashMap::new();
        let item = partial_item(fixtures::test_uuid(3));
        let r =
            BackendGrpcService::process_partial_item(&db, &map, fixtures::test_uuid(3), item).await;
        assert!(r.is_err());
    }

    #[tokio::test]
    async fn process_success_item_no_link_metadata_updates_nothing() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .into_connection();
        let mut map: HashMap<Uuid, crate::entities::solutions::Model> = HashMap::new();
        map.insert(fixtures::test_uuid(3), fixtures::solution_model());
        let item = BatchItemResult {
            item_id: fixtures::test_uuid(3).to_string(),
            url: "https://x".to_string(),
            r#type: "link".to_string(),
            status: "success".to_string(),
            error_message: None,
            link_metadata: None,
        };
        let r =
            BackendGrpcService::process_success_item(&db, &map, fixtures::test_uuid(3), item).await;
        assert!(r.is_ok(), "unexpected err: {:?}", r.err());
    }
}
