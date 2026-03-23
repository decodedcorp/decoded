//! Embedding sync helpers
//!
//! Solution 등 엔티티 생성/수정 시 embeddings 테이블에 자동 upsert

use sea_orm::{ConnectionTrait, DatabaseConnection, EntityTrait, Statement};
use serde_json::Value;
use std::sync::Arc;
use uuid::Uuid;

use crate::entities::solutions;
use crate::services::EmbeddingClient;

/// Solution 엔티티의 검색용 텍스트 조합
/// Plan: "{title} {keywords} {metadata.keywords} {description}"
fn build_solution_content_text(
    title: &str,
    keywords: &Option<sea_orm::prelude::Json>,
    metadata: &Option<sea_orm::prelude::Json>,
    description: &Option<String>,
) -> String {
    let mut parts = vec![title.trim().to_string()];

    if let Some(ref kw) = keywords {
        match kw {
            Value::Array(arr) => {
                for v in arr {
                    if let Some(s) = v.as_str() {
                        parts.push(s.trim().to_string());
                    }
                }
            }
            Value::String(s) => parts.push(s.trim().to_string()),
            _ => {}
        }
    }

    if let Some(ref meta) = metadata {
        if let Some(obj) = meta.as_object() {
            if let Some(kw) = obj.get("keywords") {
                if let Some(arr) = kw.as_array() {
                    for v in arr {
                        if let Some(s) = v.as_str() {
                            parts.push(s.trim().to_string());
                        }
                    }
                }
            }
        }
    }

    if let Some(ref desc) = description {
        parts.push(desc.trim().to_string());
    }

    parts
        .into_iter()
        .filter(|p| !p.is_empty())
        .collect::<Vec<_>>()
        .join(" ")
}

fn build_solution_content_text_from_model(solution: &solutions::Model) -> String {
    let text = build_solution_content_text(
        &solution.title,
        &solution.keywords,
        &solution.metadata,
        &solution.description,
    );
    if text.is_empty() {
        solution.id.to_string()
    } else {
        text
    }
}

/// Solution embedding을 비동기로 upsert (실패 시 로그만, 핵심 로직에 영향 없음)
pub async fn upsert_solution_embedding(
    db: DatabaseConnection,
    embedding_client: Arc<dyn EmbeddingClient>,
    solution_id: Uuid,
) {
    let solution = match solutions::Entity::find_by_id(solution_id).one(&db).await {
        Ok(Some(s)) => s,
        Ok(None) => {
            tracing::warn!(solution_id = %solution_id, "Solution not found for embedding");
            return;
        }
        Err(e) => {
            tracing::error!(
                solution_id = %solution_id,
                "Failed to fetch solution for embedding: {}",
                e
            );
            return;
        }
    };

    let content_text = build_solution_content_text_from_model(&solution);

    let embedding = match embedding_client.embed_text(&content_text).await {
        Ok(v) => v,
        Err(e) => {
            tracing::error!(
                solution_id = %solution_id,
                "Embedding API failed: {}",
                e
            );
            return;
        }
    };

    let vec_str = format!(
        "[{}]",
        embedding
            .iter()
            .map(|x| x.to_string())
            .collect::<Vec<_>>()
            .join(",")
    );

    let sql = r#"
        INSERT INTO embeddings (entity_type, entity_id, content_text, embedding)
        VALUES ('solution', $1::uuid, $2::text, $3::vector)
        ON CONFLICT (entity_type, entity_id)
        DO UPDATE SET content_text = EXCLUDED.content_text, embedding = EXCLUDED.embedding
    "#;

    if let Err(e) = db
        .execute(Statement::from_sql_and_values(
            sea_orm::DatabaseBackend::Postgres,
            sql,
            [solution_id.into(), content_text.into(), vec_str.into()],
        ))
        .await
    {
        tracing::error!(
            solution_id = %solution_id,
            "Failed to upsert embedding: {}",
            e
        );
    } else {
        tracing::debug!(solution_id = %solution_id, "Embedding upserted");
    }
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn build_solution_content_text_joins_title_keywords_array() {
        let kw: Option<sea_orm::prelude::Json> = Some(json!([" kw1 ", "kw2"]));
        let out = build_solution_content_text("  Title  ", &kw, &None, &None);
        assert_eq!(out, "Title kw1 kw2");
    }

    #[test]
    fn build_solution_content_text_keywords_as_json_string() {
        let kw: Option<sea_orm::prelude::Json> = Some(json!("single_kw"));
        let out = build_solution_content_text("T", &kw, &None, &None);
        assert_eq!(out, "T single_kw");
    }

    #[test]
    fn build_solution_content_text_pulls_keywords_from_metadata_object() {
        let meta: Option<sea_orm::prelude::Json> = Some(json!({
            "keywords": ["meta_a", "meta_b"]
        }));
        let out = build_solution_content_text("T", &None, &meta, &None);
        assert!(out.contains("T"));
        assert!(out.contains("meta_a"));
        assert!(out.contains("meta_b"));
    }

    #[test]
    fn build_solution_content_text_appends_description() {
        let out = build_solution_content_text("T", &None, &None, &Some("  line  ".into()));
        assert_eq!(out, "T line");
    }

    #[test]
    fn build_solution_content_text_drops_empty_segments() {
        let out = build_solution_content_text("", &None, &None, &None);
        assert!(out.is_empty());
    }
}
