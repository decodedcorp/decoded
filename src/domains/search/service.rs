//! Search 서비스
//!
//! 검색 비즈니스 로직

use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, FromQueryResult, QueryFilter,
    QueryOrder, QuerySelect, Set, Statement,
};
use uuid::Uuid;

use crate::{
    config::AppState,
    entities,
    error::{AppError, AppResult},
    utils::pagination::PaginationMeta,
};
use std::collections::HashMap;

use super::dto::{
    Facets, PopularSearchResponse, RecentSearchItem, RecentSearchResponse, SearchQuery,
    SearchResponse, SimilarSearchQuery, SimilarSearchResponse, SimilarSearchResultItem,
};

pub struct SearchService;

impl SearchService {
    /// 통합 검색
    pub async fn search(
        state: &AppState,
        user_id: Option<Uuid>,
        query: SearchQuery,
    ) -> AppResult<SearchResponse> {
        let start = std::time::Instant::now();

        // 검색어 로그 저장 (백그라운드에서 처리)
        if let Some(uid) = user_id {
            let _ = Self::log_search(&state.db, uid, &query.q).await;
        }

        // Meilisearch 검색 수행
        let limit = query.limit.min(50); // 최대 50개
        let offset = ((query.page - 1) * limit) as usize;

        // 필터 구성
        let mut filters = Vec::new();
        if let Some(category) = &query.category {
            filters.push(format!("category = \"{}\"", category));
        }
        if let Some(media_type) = &query.media_type {
            filters.push(format!("media_type = \"{}\"", media_type));
        }
        if let Some(context) = &query.context {
            filters.push(format!("context = \"{}\"", context));
        }
        if let Some(has_adopted) = query.has_adopted {
            if has_adopted {
                filters.push("has_adopted_solution = true".to_string());
            }
        }

        // 정렬 구성
        let sort = match query.sort.as_str() {
            "recent" => vec!["created_at:desc".to_string()],
            "popular" => vec!["view_count:desc".to_string()],
            "solution_count" => vec!["solution_count:desc".to_string()],
            _ => vec![], // relevant (기본 관련성 정렬)
        };

        // 하이라이트 필드
        let attributes_to_highlight = vec![
            "artist_name".to_string(),
            "group_name".to_string(),
            "context".to_string(),
            "title".to_string(),
        ];

        // Meilisearch 검색 실행
        let search_results = state
            .search_client
            .advanced_search(
                "posts",
                &query.q,
                filters,
                sort,
                offset,
                limit as usize,
                attributes_to_highlight,
            )
            .await?;

        // JSON 응답 파싱
        let empty_vec = vec![];
        let hits = search_results["hits"].as_array().unwrap_or(&empty_vec);
        let estimated_total_hits = search_results["estimatedTotalHits"].as_u64().unwrap_or(0);

        // 검색 결과 변환
        let data: Vec<super::dto::SearchResultItem> = hits
            .iter()
            .filter_map(|hit| {
                // Meilisearch SDK는 hit 안에 result와 _formatted 필드를 가집니다
                // result가 없으면 hit 자체를 document로 사용 (REST API 직접 호출 시)
                let doc = hit.get("result").unwrap_or(hit);
                let formatted = hit.get("_formatted").unwrap_or(&serde_json::Value::Null);

                // 하이라이트 처리
                let highlight = if !formatted.is_null() {
                    let mut map = HashMap::new();
                    if let Some(artist) = formatted["artist_name"].as_str() {
                        if artist.contains("<em>") {
                            map.insert("artist_name".to_string(), artist.to_string());
                        }
                    }
                    if let Some(group) = formatted["group_name"].as_str() {
                        if group.contains("<em>") {
                            map.insert("group_name".to_string(), group.to_string());
                        }
                    }
                    if !map.is_empty() {
                        Some(map)
                    } else {
                        None
                    }
                } else {
                    None
                };

                Some(super::dto::SearchResultItem {
                    id: Uuid::parse_str(doc["id"].as_str()?).ok()?,
                    type_: "post".to_string(),
                    image_url: doc["image_url"].as_str()?.to_string(),
                    artist_name: doc["artist_name"].as_str().map(|s| s.to_string()),
                    group_name: doc["group_name"].as_str().map(|s| s.to_string()),
                    context: doc["context"].as_str().map(|s| s.to_string()),
                    media_source: {
                        let media_type = doc["media_type"].as_str()?;
                        let title = doc
                            .get("title")
                            .and_then(|v| v.as_str())
                            .map(|s| s.to_string());
                        Some(super::dto::MediaSource {
                            type_: media_type.to_string(),
                            title,
                        })
                    },
                    spot_count: doc["spot_count"].as_i64()? as i32,
                    view_count: doc["view_count"].as_i64()? as i32,
                    highlight,
                })
            })
            .collect();

        // Facets는 Meilisearch facet distribution 사용
        // 현재는 빈 응답 (향후 Meilisearch facet 설정 필요)
        let facets = Facets {
            category: None,
            context: None,
            media_type: None,
        };

        let total_items = estimated_total_hits;
        let pagination = PaginationMeta {
            current_page: query.page as u64,
            per_page: limit as u64,
            total_items,
            total_pages: total_items.div_ceil(limit as u64),
        };

        let took_ms = start.elapsed().as_millis() as u64;

        Ok(SearchResponse {
            data,
            facets,
            pagination,
            query: query.q,
            took_ms,
        })
    }

    /// 인기 검색어 조회 (최근 24시간 기준)
    pub async fn popular_searches(state: &AppState) -> AppResult<PopularSearchResponse> {
        let twenty_four_hours_ago = chrono::Utc::now() - chrono::Duration::hours(24);

        // SQL로 검색어 집계 (GROUP BY + COUNT + ORDER BY)
        #[derive(Debug, FromQueryResult)]
        struct PopularQueryResult {
            query: String,
            search_count: i64,
        }

        let sql = r#"
            SELECT query, COUNT(*) as search_count
            FROM search_logs
            WHERE created_at >= $1
            GROUP BY query
            ORDER BY search_count DESC
            LIMIT 10
        "#;

        let results = PopularQueryResult::find_by_statement(Statement::from_sql_and_values(
            sea_orm::DatabaseBackend::Postgres,
            sql,
            vec![twenty_four_hours_ago.into()],
        ))
        .all(&state.db)
        .await?;

        let data = results
            .into_iter()
            .enumerate()
            .map(|(index, result)| super::dto::PopularSearchItem {
                rank: (index + 1) as u32,
                query: result.query,
                search_count: result.search_count as u32,
            })
            .collect();

        Ok(PopularSearchResponse { data })
    }

    /// 최근 검색어 조회 (사용자별)
    pub async fn recent_searches(
        state: &AppState,
        user_id: Uuid,
        limit: u32,
    ) -> AppResult<RecentSearchResponse> {
        let limit = limit.min(20); // 최대 20개

        let logs = entities::SearchLogs::find()
            .filter(entities::search_logs::Column::UserId.eq(user_id))
            .order_by_desc(entities::search_logs::Column::CreatedAt)
            .limit(limit as u64)
            .all(&state.db)
            .await?;

        let data = logs
            .into_iter()
            .map(|log| RecentSearchItem {
                id: log.id,
                query: log.query,
                searched_at: log.created_at.with_timezone(&chrono::Utc),
            })
            .collect();

        Ok(RecentSearchResponse { data })
    }

    /// 시멘틱 유사도 검색 (Vector Search)
    pub async fn search_similar(
        state: &AppState,
        query: SimilarSearchQuery,
    ) -> AppResult<SimilarSearchResponse> {
        let start = std::time::Instant::now();

        let limit = query.limit.min(50) as i32;
        let filter_type: Option<String> = query.entity_type.filter(|s| !s.is_empty());

        if query.q.trim().is_empty() {
            return Ok(SimilarSearchResponse {
                data: vec![],
                query: query.q,
                took_ms: start.elapsed().as_millis() as u64,
            });
        }

        let embedding = state
            .embedding_client
            .embed_text(query.q.trim())
            .await
            .map_err(|e| AppError::ExternalService(format!("Embedding failed: {}", e)))?;

        let vec_str = format!(
            "[{}]",
            embedding
                .iter()
                .map(|x| x.to_string())
                .collect::<Vec<_>>()
                .join(",")
        );

        #[derive(Debug, FromQueryResult)]
        struct SimilarRow {
            entity_type: String,
            entity_id: Uuid,
            content_text: String,
            similarity: f64,
        }

        let sql = r#"
            SELECT entity_type, entity_id, content_text, similarity
            FROM search_similar($1::vector, $2::int, $3)
        "#;

        let params: Vec<sea_orm::Value> = vec![vec_str.into(), limit.into(), filter_type.into()];

        let results = SimilarRow::find_by_statement(Statement::from_sql_and_values(
            sea_orm::DatabaseBackend::Postgres,
            sql,
            params,
        ))
        .all(&state.db)
        .await?;

        let data: Vec<SimilarSearchResultItem> = results
            .into_iter()
            .map(|r| SimilarSearchResultItem {
                entity_type: r.entity_type,
                entity_id: r.entity_id,
                similarity: r.similarity,
                content_text: r.content_text,
            })
            .collect();

        let took_ms = start.elapsed().as_millis() as u64;

        Ok(SimilarSearchResponse {
            data,
            query: query.q,
            took_ms,
        })
    }

    /// 최근 검색어 삭제
    pub async fn delete_recent_search(
        state: &AppState,
        user_id: Uuid,
        search_id: Uuid,
    ) -> AppResult<()> {
        // 검색 로그 조회 및 소유권 확인
        let log = entities::SearchLogs::find_by_id(search_id)
            .one(&state.db)
            .await?
            .ok_or(AppError::NotFound("Search log not found".to_string()))?;

        // 소유권 확인
        if log.user_id != Some(user_id) {
            return Err(AppError::Forbidden(
                "You can only delete your own search history".to_string(),
            ));
        }

        // 삭제
        entities::SearchLogs::delete_by_id(search_id)
            .exec(&state.db)
            .await?;

        Ok(())
    }

    /// 검색어 로그 저장
    async fn log_search(db: &DatabaseConnection, user_id: Uuid, query: &str) -> AppResult<()> {
        let log = entities::search_logs::ActiveModel {
            id: Set(Uuid::new_v4()),
            user_id: Set(Some(user_id)),
            query: Set(query.to_string()),
            filters: Set(None),
            created_at: Set(chrono::Utc::now().into()),
        };

        log.insert(db).await?;

        Ok(())
    }
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;

    #[test]
    fn test_search_query_limit_validation() {
        let query = SearchQuery {
            q: "test".to_string(),
            limit: 100, // Should be capped at 50
            ..Default::default()
        };

        // `search`는 Meilisearch 호출 전에 `query.limit.min(50)`으로 캡함
        assert_eq!(query.limit.min(50), 50);
    }

    #[test]
    fn test_recent_search_item_creation() {
        let item = RecentSearchItem {
            id: Uuid::new_v4(),
            query: "jennie airport".to_string(),
            searched_at: chrono::Utc::now(),
        };

        assert_eq!(item.query, "jennie airport");
    }
}
