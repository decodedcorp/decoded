use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder,
    QuerySelect, Set,
};
use uuid::Uuid;

use crate::services::DecodedAIGrpcClient;
use crate::{
    entities::{
        post_magazines::{self, Entity as PostMagazines},
        posts::{self, Entity as PostsEntity},
        solutions::{self, Entity as Solutions},
        spots::{self, Entity as Spots},
    },
    error::{AppError, AppResult},
};

use super::dto::{
    NewsReferenceResponse, PostData, PostMagazineResponse, RelatedEditorialItem, SolutionData,
    SpotData,
};

pub async fn generate_post_magazine(
    db: &DatabaseConnection,
    grpc_client: &DecodedAIGrpcClient,
    post_id: Uuid,
) -> AppResult<Uuid> {
    let post = PostsEntity::find_by_id(post_id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found(format!("Post {} not found", post_id)))?;

    if let Some(existing_magazine_id) = post.post_magazine_id {
        let existing = PostMagazines::find_by_id(existing_magazine_id)
            .one(db)
            .await?;

        match existing.as_ref().map(|m| m.status.as_str()) {
            Some("published") => {
                return Err(AppError::bad_request(
                    "Post already has a published magazine",
                ));
            }
            Some("generating") => {
                if let Some(ref mag) = existing {
                    let age = chrono::Utc::now() - mag.updated_at.with_timezone(&chrono::Utc);
                    if age.num_minutes() < 30 {
                        return Err(AppError::bad_request(
                            "Magazine is currently being generated",
                        ));
                    }
                }
            }
            _ => {}
        }
    }

    let spots_with_solutions = Spots::find()
        .filter(spots::Column::PostId.eq(post_id))
        .order_by_asc(spots::Column::CreatedAt)
        .all(db)
        .await?;

    let mut spot_data_list = Vec::new();
    for spot in &spots_with_solutions {
        let solutions_for_spot = Solutions::find()
            .filter(solutions::Column::SpotId.eq(spot.id))
            .order_by_asc(solutions::Column::CreatedAt)
            .all(db)
            .await?;

        let solution_data_list: Vec<SolutionData> = solutions_for_spot
            .into_iter()
            .map(|s| SolutionData {
                id: s.id.to_string(),
                spot_id: s.spot_id.to_string(),
                title: s.title,
                brand_id: s.brand_id.map(|id| id.to_string()),
                link_type: s.link_type,
                original_url: s.original_url,
                affiliate_url: s.affiliate_url,
                thumbnail_url: s.thumbnail_url,
                description: s.description,
                comment: s.comment,
                metadata: s.metadata,
                keywords: s.keywords,
                qna: s.qna,
            })
            .collect();

        spot_data_list.push(SpotData {
            id: spot.id.to_string(),
            post_id: spot.post_id.to_string(),
            position_left: spot.position_left.clone(),
            position_top: spot.position_top.clone(),
            subcategory_id: spot.subcategory_id.map(|id| id.to_string()),
            solutions: solution_data_list,
        });
    }

    let post_data = PostData {
        id: post.id.to_string(),
        user_id: post.user_id.to_string(),
        image_url: post.image_url.clone(),
        media_type: post.media_type.clone(),
        title: post.title.clone(),
        artist_name: post.artist_name.clone(),
        artist_id: post.artist_id.map(|id| id.to_string()),
        group_name: post.group_name.clone(),
        group_id: post.group_id.map(|id| id.to_string()),
        context: post.context.clone(),
        view_count: post.view_count,
        trending_score: post.trending_score,
        spots: spot_data_list,
    };

    let magazine = post_magazines::ActiveModel {
        id: Set(Uuid::new_v4()),
        title: Set("Untitled".to_string()),
        status: Set("generating".to_string()),
        ..Default::default()
    };
    let created_magazine = magazine.insert(db).await?;
    let magazine_id = created_magazine.id;

    let mut post_active: posts::ActiveModel = post.into();
    post_active.post_magazine_id = Set(Some(magazine_id));
    post_active.update(db).await?;

    let post_data_json = serde_json::to_string(&post_data)
        .map_err(|e| AppError::internal(format!("JSON serialize error: {}", e)))?;
    let post_magazine_id = magazine_id.to_string();

    let result = grpc_client
        .process_post_editorial(&post_magazine_id, &post_data_json)
        .await
        .map_err(|e| e.to_string());

    match result {
        Ok(resp) if resp.success => {
            tracing::info!(
                magazine_id = %magazine_id,
                "Post editorial enqueued successfully"
            );
        }
        Ok(resp) => {
            tracing::error!(
                magazine_id = %magazine_id,
                message = %resp.message,
                "decoded-ai returned non-success"
            );
            mark_magazine_failed(db, magazine_id, &resp.message).await?;
        }
        Err(err_msg) => {
            tracing::error!(
                magazine_id = %magazine_id,
                error = %err_msg,
                "Failed to call decoded-ai process_post_editorial"
            );
            mark_magazine_failed(
                db,
                magazine_id,
                &format!("gRPC request failed: {}", err_msg),
            )
            .await?;
        }
    }

    Ok(magazine_id)
}

async fn mark_magazine_failed(
    db: &DatabaseConnection,
    magazine_id: Uuid,
    error_msg: &str,
) -> AppResult<()> {
    let magazine = PostMagazines::find_by_id(magazine_id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Magazine not found"))?;

    let mut active: post_magazines::ActiveModel = magazine.into();
    active.status = Set("failed".to_string());
    active.error_log = Set(Some(serde_json::Value::Array(vec![
        serde_json::Value::String(error_msg.to_string()),
    ])));
    active.update(db).await?;
    Ok(())
}

pub async fn get_post_magazine(
    db: &DatabaseConnection,
    magazine_id: Uuid,
) -> AppResult<PostMagazineResponse> {
    let magazine = PostMagazines::find_by_id(magazine_id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found(format!("PostMagazine {} not found", magazine_id)))?;

    let related_editorials =
        find_related_editorials(db, magazine_id, magazine.layout_json.as_ref()).await?;

    let news_refs = crate::entities::post_magazine_news_references::Entity::find()
        .filter(
            crate::entities::post_magazine_news_references::Column::PostMagazineId.eq(magazine_id),
        )
        .all(db)
        .await?;

    let news_references: Vec<NewsReferenceResponse> = news_refs
        .into_iter()
        .map(|r| NewsReferenceResponse {
            id: r.id,
            title: r.title,
            url: r.url,
            source: r.source,
            summary: r.summary,
            og_title: r.og_title,
            og_description: r.og_description,
            og_image: r.og_image,
            og_site_name: r.og_site_name,
            relevance_score: r.relevance_score,
            credibility_score: r.credibility_score,
            matched_item: r.matched_item,
        })
        .collect();

    Ok(PostMagazineResponse {
        id: magazine.id,
        title: magazine.title,
        subtitle: magazine.subtitle,
        keyword: magazine.keyword,
        layout_json: magazine.layout_json,
        status: magazine.status,
        review_summary: magazine.review_summary,
        error_log: magazine.error_log,
        created_at: magazine.created_at.to_string(),
        updated_at: magazine.updated_at.to_string(),
        published_at: magazine.published_at.map(|t| t.to_string()),
        related_editorials,
        news_references,
    })
}

/// Find related editorial posts by keyword (artist_name, group_name).
/// Fallback: when no keyword matches, return recently published editorials.
async fn find_related_editorials(
    db: &DatabaseConnection,
    current_magazine_id: Uuid,
    _current_layout: Option<&serde_json::Value>,
) -> AppResult<Vec<RelatedEditorialItem>> {
    use sea_orm::Condition;

    let current_post = PostsEntity::find()
        .filter(posts::Column::PostMagazineId.eq(current_magazine_id))
        .one(db)
        .await?;

    let Some(current) = current_post else {
        return fetch_recent_published_editorials(db, current_magazine_id, None).await;
    };

    let keyword_items = {
        let mut keywords: Vec<String> = vec![];
        if let Some(ref a) = current.artist_name {
            let s = a.trim();
            if !s.is_empty() {
                keywords.push(s.to_string());
            }
        }
        if let Some(ref g) = current.group_name {
            let s = g.trim();
            if !s.is_empty() && !keywords.iter().any(|k| k == s) {
                keywords.push(s.to_string());
            }
        }
        if keywords.is_empty() {
            vec![]
        } else {
            let keyword_conds: Condition = keywords
                .iter()
                .map(|kw| {
                    Condition::any()
                        .add(
                            posts::Column::ArtistName
                                .is_not_null()
                                .and(posts::Column::ArtistName.like(format!("%{}%", kw))),
                        )
                        .add(
                            posts::Column::GroupName
                                .is_not_null()
                                .and(posts::Column::GroupName.like(format!("%{}%", kw))),
                        )
                })
                .fold(Condition::any(), |acc, c| acc.add(c));

            let related_posts = PostsEntity::find()
                .filter(posts::Column::PostMagazineId.is_not_null())
                .filter(posts::Column::Id.ne(current.id))
                .filter(posts::Column::Status.eq(crate::constants::post_status::ACTIVE))
                .filter(keyword_conds)
                .all(db)
                .await?;

            let magazine_ids: Vec<Uuid> = related_posts
                .iter()
                .filter_map(|p| p.post_magazine_id)
                .collect();

            if magazine_ids.is_empty() {
                vec![]
            } else {
                let magazines = PostMagazines::find()
                    .filter(post_magazines::Column::Id.is_in(magazine_ids.clone()))
                    .filter(post_magazines::Column::Status.eq("published"))
                    .order_by_desc(post_magazines::Column::PublishedAt)
                    .limit(10)
                    .all(db)
                    .await?;

                build_related_items(&magazines, &related_posts)
            }
        }
    };

    if !keyword_items.is_empty() {
        return Ok(keyword_items);
    }

    // Fallback: recently published editorials
    fetch_recent_published_editorials(db, current_magazine_id, Some(current.id)).await
}

/// Fetch recently published editorials, excluding current magazine and optionally current post.
async fn fetch_recent_published_editorials(
    db: &DatabaseConnection,
    exclude_magazine_id: Uuid,
    exclude_post_id: Option<Uuid>,
) -> AppResult<Vec<RelatedEditorialItem>> {
    let magazines = PostMagazines::find()
        .filter(post_magazines::Column::Id.ne(exclude_magazine_id))
        .filter(post_magazines::Column::Status.eq("published"))
        .order_by_desc(post_magazines::Column::PublishedAt)
        .limit(10)
        .all(db)
        .await?;

    let magazine_ids: Vec<Uuid> = magazines.iter().map(|m| m.id).collect();
    if magazine_ids.is_empty() {
        return Ok(vec![]);
    }

    let mut posts_query = PostsEntity::find()
        .filter(posts::Column::PostMagazineId.is_in(magazine_ids))
        .filter(posts::Column::Status.eq(crate::constants::post_status::ACTIVE));

    if let Some(pid) = exclude_post_id {
        posts_query = posts_query.filter(posts::Column::Id.ne(pid));
    }

    let related_posts = posts_query.all(db).await?;

    Ok(build_related_items(&magazines, &related_posts))
}

fn build_related_items(
    magazines: &[post_magazines::Model],
    related_posts: &[posts::Model],
) -> Vec<RelatedEditorialItem> {
    let post_by_magazine: std::collections::HashMap<Uuid, Uuid> = related_posts
        .iter()
        .filter_map(|p| p.post_magazine_id.map(|mid| (mid, p.id)))
        .collect();

    let post_by_id: std::collections::HashMap<Uuid, &posts::Model> =
        related_posts.iter().map(|p| (p.id, p)).collect();

    let mut items: Vec<RelatedEditorialItem> = vec![];
    for mag in magazines {
        if let Some(&post_id) = post_by_magazine.get(&mag.id) {
            let image_url = post_by_id.get(&post_id).map(|p| p.image_url.clone());

            let mut bg_color = Some("#000000".to_string());
            if let Some(ref layout) = mag.layout_json {
                if let Some(obj) = layout.as_object() {
                    if let Some(serde_json::Value::Object(ds)) = obj.get("design_spec") {
                        if let Some(serde_json::Value::String(c)) = ds.get("bg_color") {
                            bg_color = Some(c.clone());
                        }
                    }
                }
            }
            items.push(RelatedEditorialItem {
                post_id,
                title: mag.title.clone(),
                image_url,
                bg_color,
            });
        }
    }
    items
}
