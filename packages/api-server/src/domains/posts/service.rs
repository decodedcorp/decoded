//! Posts service
//!
//! 게시물 관련 비즈니스 로직

use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait, QueryFilter,
    QueryOrder, QuerySelect, Set, TransactionTrait,
};
use uuid::Uuid;

use crate::{
    config::AppState,
    entities::posts::{ActiveModel, Column, Entity as Posts, Model as PostModel},
    error::{AppError, AppResult},
    utils::pagination::{PaginatedResponse, Pagination},
};

use super::dto::{
    CreatePostDto, CreatePostWithSolutionsResponse, ImageAnalyzeResponse, ImageUploadResponse,
    MediaSourceDto, PostDetailResponse, PostListItem, PostListQuery, PostResponse, PostUserInfo,
    SpotWithTopSolution, TopSolutionSummary, UpdatePostDto,
};

/// Solution 정보 (AI 분석 트리거용)
struct SolutionInfo {
    id: Uuid,
    url: String,
    title: Option<String>,
    description: String,
    site_name: String,
}

/// Post 생성 트랜잭션 (공통 로직)
async fn create_post_transaction(
    db: &DatabaseConnection,
    user_id: Uuid,
    dto: CreatePostDto,
    created_with_solutions: bool,
) -> AppResult<(PostResponse, Vec<Uuid>, Vec<SolutionInfo>)> {
    let uncategorized_subcategory_id =
        crate::domains::subcategories::service::resolve_uncategorized_subcategory_id(db).await?;

    db.transaction::<_, (PostResponse, Vec<Uuid>, Vec<SolutionInfo>), AppError>(|txn| {
        Box::pin(async move {
            let mut solution_infos = Vec::new();
            let mut spot_ids = Vec::new();

            // dto에서 직접 전달된 group_name, artist_name, context 사용
            let group_name = dto.group_name;
            let artist_name = dto.artist_name;
            let context = dto.context;

            // ActiveModel 생성
            let post = ActiveModel {
                id: Set(Uuid::new_v4()),
                user_id: Set(user_id),
                image_url: Set(dto.image_url),
                media_type: Set(dto.media_source.media_type().to_string()),
                title: Set(None),          // AI가 description에서 추출할 예정
                media_metadata: Set(None), // AI가 description에서 추출할 예정
                group_name: Set(group_name),
                artist_name: Set(artist_name),
                context: Set(context),
                view_count: Set(0),
                status: Set(crate::constants::post_status::ACTIVE.to_string()),
                created_with_solutions: Set(Some(created_with_solutions)),
                ..Default::default()
            };

            // Post 저장
            let created_post = post.insert(txn).await.map_err(AppError::DatabaseError)?;

            // Spots 생성
            use crate::domains::solutions::dto::CreateSolutionDto;
            use crate::entities::spots::ActiveModel as SpotActiveModel;

            for spot_dto in dto.spots {
                let resolved_sub = match spot_dto.subcategory_id {
                    Some(id) => {
                        crate::domains::subcategories::service::ensure_subcategory_exists(txn, id)
                            .await?;
                        id
                    }
                    None => uncategorized_subcategory_id,
                };

                let spot = SpotActiveModel {
                    id: Set(Uuid::new_v4()),
                    post_id: Set(created_post.id),
                    user_id: Set(user_id),
                    position_left: Set(spot_dto.position_left),
                    position_top: Set(spot_dto.position_top),
                    subcategory_id: Set(Some(resolved_sub)),
                    status: Set(crate::constants::spot_status::OPEN.to_string()),
                    ..Default::default()
                };

                let created_spot = spot.insert(txn).await.map_err(AppError::DatabaseError)?;
                spot_ids.push(created_spot.id);

                // Solutions 생성 (0개 이상)
                for solution_dto in spot_dto.solutions {
                    let create_solution_dto = CreateSolutionDto {
                        original_url: solution_dto.original_url.clone(),
                        affiliate_url: None,
                        title: solution_dto.title.clone(),
                        metadata: solution_dto.metadata.clone(),
                        description: solution_dto.description.clone(),
                        comment: solution_dto.comment.clone(),
                        thumbnail_url: solution_dto.thumbnail_url.clone(),
                    };

                    let solution = create_solution_dto.into_active_model(created_spot.id, user_id);

                    let solution_id = *solution.id.as_ref();
                    let url = solution_dto.original_url.clone();
                    let title = solution_dto.title.clone();
                    let description = solution_dto.description.clone().unwrap_or_default();
                    let site_name = extract_site_name_from_url(&url);

                    solution
                        .insert(txn)
                        .await
                        .map_err(AppError::DatabaseError)?;

                    solution_infos.push(SolutionInfo {
                        id: solution_id,
                        url,
                        title,
                        description,
                        site_name,
                    });
                }
            }

            Ok((created_post.into(), spot_ids, solution_infos))
        })
    })
    .await
    .map_err(|e| match e {
        sea_orm::TransactionError::Transaction(err) => err,
        sea_orm::TransactionError::Connection(err) => AppError::DatabaseError(err),
    })
}

/// Post 생성 (Solution 없이, 이미지 업로드 포함)
pub async fn create_post_without_solutions(
    state: &AppState,
    user_id: Uuid,
    image_data: Vec<u8>,
    content_type: &str,
    mut dto: CreatePostDto,
) -> AppResult<PostResponse> {
    // 이미지 업로드
    let upload_response = upload_image(state, image_data, content_type, user_id).await?;
    let image_key = extract_key_from_url(&upload_response.image_url);

    // 업로드된 이미지 URL을 dto에 설정
    dto.image_url = upload_response.image_url.clone();

    // Post 생성 (트랜잭션 내에서 Post + Spots 생성)
    let (post, _spot_ids, _solution_infos) =
        create_post_transaction(&state.db, user_id, dto, false)
            .await
            .inspect_err(|_e| {
                // Post 생성 실패 시 업로드된 이미지 삭제
                let image_key_clone = image_key.clone();
                let storage_client = state.storage_client.clone();
                tokio::spawn(async move {
                    if let Err(delete_err) = storage_client.delete(&image_key_clone).await {
                        tracing::warn!(
                            "Failed to delete orphaned image {}: {}",
                            image_key_clone,
                            delete_err
                        );
                    }
                });
            })?;
    // solution_infos는 비어있을 것 (Solution 없이 생성)

    // Meilisearch에 색인 (비동기, 실패해도 Post 생성은 성공)
    let search_fields = match load_post_related_data(&state.db, post.id).await {
        Ok(data) => compute_search_fields(&data),
        Err(e) => {
            tracing::warn!("Failed to load search fields for post {}: {}", post.id, e);
            PostSearchFields {
                category_codes: vec![],
                has_adopted_solution: false,
                solution_count: 0,
                spot_count: 0,
            }
        }
    };
    let search_result = index_post_to_meilisearch(
        &state.search_client,
        &post,
        &upload_response.image_url,
        &search_fields,
    )
    .await;

    if let Err(e) = search_result {
        tracing::warn!("Failed to index post {} to Meilisearch: {}", post.id, e);
    }

    Ok(post)
}

/// Post 생성 (Solution과 함께, 이미지 업로드 포함)
pub async fn create_post_with_solutions(
    state: &AppState,
    user_id: Uuid,
    image_data: Vec<u8>,
    content_type: &str,
    mut dto: CreatePostDto,
) -> AppResult<CreatePostWithSolutionsResponse> {
    // 이미지 업로드
    let upload_response = upload_image(state, image_data, content_type, user_id).await?;
    let image_key = extract_key_from_url(&upload_response.image_url);

    // 업로드된 이미지 URL을 dto에 설정
    dto.image_url = upload_response.image_url.clone();

    // Post 생성 (트랜잭션 내에서 Post + Spots + Solutions 생성)
    let (post, spot_ids, solution_infos) = create_post_transaction(&state.db, user_id, dto, true)
        .await
        .inspect_err(|_e| {
            // Post 생성 실패 시 업로드된 이미지 삭제
            let image_key_clone = image_key.clone();
            let storage_client = state.storage_client.clone();
            tokio::spawn(async move {
                if let Err(delete_err) = storage_client.delete(&image_key_clone).await {
                    tracing::warn!(
                        "Failed to delete orphaned image {}: {}",
                        image_key_clone,
                        delete_err
                    );
                }
            });
        })?;

    let solution_ids: Vec<Uuid> = solution_infos.iter().map(|s| s.id).collect();

    // 트랜잭션 완료 후 Solution에 대해 AI 분석 트리거
    // DB 조회 없이 트랜잭션에서 수집한 정보 활용
    for solution_info in solution_infos {
        let ai_client = state.decoded_ai_client.clone();
        tokio::spawn(async move {
            if let Err(e) = ai_client
                .analyze_link(
                    solution_info.url,
                    solution_info.id.to_string(),
                    solution_info.title.unwrap_or_default(),
                    solution_info.description,
                    solution_info.site_name,
                )
                .await
            {
                tracing::error!(
                    "Failed to trigger AI analysis for solution {}: {}",
                    solution_info.id,
                    e
                );
            } else {
                tracing::info!("Triggered AI analysis for solution {}", solution_info.id);
            }
        });
    }

    // Meilisearch에 색인 (비동기, 실패해도 Post 생성은 성공)
    let search_fields = match load_post_related_data(&state.db, post.id).await {
        Ok(data) => compute_search_fields(&data),
        Err(e) => {
            tracing::warn!("Failed to load search fields for post {}: {}", post.id, e);
            PostSearchFields {
                category_codes: vec![],
                has_adopted_solution: false,
                solution_count: 0,
                spot_count: 0,
            }
        }
    };
    let search_result = index_post_to_meilisearch(
        &state.search_client,
        &post,
        &upload_response.image_url,
        &search_fields,
    )
    .await;

    if let Err(e) = search_result {
        tracing::warn!("Failed to index post {} to Meilisearch: {}", post.id, e);
    }

    Ok(CreatePostWithSolutionsResponse {
        post,
        spot_ids,
        solution_ids,
    })
}

/// Post ID로 조회
pub async fn get_post_by_id(db: &DatabaseConnection, post_id: Uuid) -> AppResult<PostModel> {
    Posts::find_by_id(post_id)
        .one(db)
        .await
        .map_err(AppError::DatabaseError)?
        .ok_or_else(|| AppError::NotFound(format!("Post not found: {}", post_id)))
}

/// 관련 데이터 구조체 (배치 로드 데이터)
pub(crate) struct PostRelatedData {
    pub spots: Vec<crate::entities::spots::Model>,
    pub solutions: Vec<crate::entities::solutions::Model>,
    pub subcategories: Vec<crate::entities::subcategories::Model>,
    pub categories: Vec<crate::entities::categories::Model>,
}

/// Meilisearch 색인용 검색 필드
pub(crate) struct PostSearchFields {
    pub category_codes: Vec<String>,
    pub has_adopted_solution: bool,
    pub solution_count: i64,
    pub spot_count: i32,
}

/// PostRelatedData로부터 검색 색인 필드를 계산하는 순수 함수
pub(crate) fn compute_search_fields(data: &PostRelatedData) -> PostSearchFields {
    use std::collections::HashSet;

    // spots → subcategory_id → subcategories → category_id → categories.code (distinct)
    let cat_ids: HashSet<Uuid> = data
        .spots
        .iter()
        .filter_map(|s| s.subcategory_id)
        .filter_map(|sid| data.subcategories.iter().find(|sc| sc.id == sid))
        .map(|sc| sc.category_id)
        .collect();

    let category_codes: Vec<String> = data
        .categories
        .iter()
        .filter(|c| cat_ids.contains(&c.id))
        .map(|c| c.code.clone())
        .filter(|code| !code.is_empty())
        .collect::<HashSet<_>>()
        .into_iter()
        .collect();

    let has_adopted_solution = data.solutions.iter().any(|s| s.is_adopted);
    let solution_count = data.solutions.len() as i64;
    let spot_count = data.spots.len() as i32;

    PostSearchFields {
        category_codes,
        has_adopted_solution,
        solution_count,
        spot_count,
    }
}

/// Post의 모든 관련 데이터를 배치 로드
pub(crate) async fn load_post_related_data(
    db: &DatabaseConnection,
    post_id: Uuid,
) -> AppResult<PostRelatedData> {
    use crate::entities::solutions::{Column as SolutionColumn, Entity as Solutions};
    use crate::entities::spots::{Column as SpotColumn, Entity as Spots};

    // 1. Spots 배치 조회
    let spots = Spots::find()
        .filter(SpotColumn::PostId.eq(post_id))
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;

    if spots.is_empty() {
        // Spots가 없으면 빈 데이터로 반환
        return Ok(PostRelatedData {
            spots: vec![],
            solutions: vec![],
            subcategories: vec![],
            categories: vec![],
        });
    }

    let spot_ids: Vec<Uuid> = spots.iter().map(|s| s.id).collect();
    // subcategory_id가 None인 경우 필터링
    let subcategory_ids: Vec<Uuid> = spots.iter().filter_map(|s| s.subcategory_id).collect();

    // 2. Solutions 배치 조회 (N+1 방지)
    let solutions = Solutions::find()
        .filter(SolutionColumn::SpotId.is_in(spot_ids.clone()))
        .filter(SolutionColumn::Status.eq(crate::constants::solution_status::ACTIVE))
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;

    // 3. Subcategories 배치 조회 (N+1 방지) - subcategory_id가 있는 경우만
    let subcategories = if subcategory_ids.is_empty() {
        vec![]
    } else {
        crate::entities::subcategories::Entity::find()
            .filter(crate::entities::subcategories::Column::Id.is_in(subcategory_ids.clone()))
            .all(db)
            .await
            .map_err(AppError::DatabaseError)?
    };

    // 4. Categories 배치 조회 (N+1 방지)
    let category_ids: Vec<Uuid> = subcategories.iter().map(|s| s.category_id).collect();
    let categories = if category_ids.is_empty() {
        vec![]
    } else {
        crate::entities::categories::Entity::find()
            .filter(crate::entities::categories::Column::Id.is_in(category_ids))
            .all(db)
            .await
            .map_err(AppError::DatabaseError)?
    };

    Ok(PostRelatedData {
        spots,
        solutions,
        subcategories,
        categories,
    })
}

/// Spot 목록을 SpotWithTopSolution으로 변환
fn build_spots_response(related_data: &PostRelatedData) -> AppResult<Vec<SpotWithTopSolution>> {
    // 1. Subcategory ID -> Category 매핑 (배치 로드된 데이터 사용)
    let mut subcategory_to_category: std::collections::HashMap<
        Uuid,
        crate::entities::categories::Model,
    > = std::collections::HashMap::new();
    for subcategory in &related_data.subcategories {
        if let Some(category) = related_data
            .categories
            .iter()
            .find(|c| c.id == subcategory.category_id)
        {
            subcategory_to_category.insert(subcategory.id, category.clone());
        }
    }

    // 2. Spot ID -> Solutions 매핑
    let mut spot_to_solutions: std::collections::HashMap<Uuid, Vec<_>> =
        std::collections::HashMap::new();
    for solution in &related_data.solutions {
        spot_to_solutions
            .entry(solution.spot_id)
            .or_insert_with(Vec::new)
            .push(solution.clone());
    }

    // 3. 각 Spot별 SpotWithTopSolution 생성
    let mut spots_with_solutions = Vec::new();
    for spot in &related_data.spots {
        let solutions_for_spot = spot_to_solutions
            .get(&spot.id)
            .map(|v| v.as_slice())
            .unwrap_or(&[]);
        let solution_count = solutions_for_spot.len() as i32;

        let top_solution = select_top_solution(solutions_for_spot);

        // 배치 로드된 category 데이터에서 직접 조회 (subcategory_id가 있는 경우만)
        let category = if let Some(subcategory_id) = spot.subcategory_id {
            subcategory_to_category
                .get(&subcategory_id)
                .map(|category_model| convert_category_model_to_response(category_model.clone()))
                .transpose()?
        } else {
            None
        };

        spots_with_solutions.push(SpotWithTopSolution {
            id: spot.id,
            position_left: spot.position_left.clone(),
            position_top: spot.position_top.clone(),
            category,
            status: spot.status.clone(),
            solution_count,
            top_solution,
            created_at: spot.created_at.with_timezone(&chrono::Utc),
        });
    }

    Ok(spots_with_solutions)
}

/// Post 상세 조회 (Spots + 대표 Solution 포함)
pub async fn get_post_detail(
    db: &DatabaseConnection,
    post_id: Uuid,
    user_id: Option<Uuid>,
) -> AppResult<PostDetailResponse> {
    use crate::domains::comments::service::count_comments_by_post_id;
    use crate::domains::post_likes::service::get_like_stats as get_post_like_stats;
    use crate::domains::users::service::get_user_by_id;

    // 1. Post 및 관련 데이터 로드
    let post = get_post_by_id(db, post_id).await?;
    let user = get_user_by_id(db, post.user_id).await?;
    let related_data = load_post_related_data(db, post_id).await?;

    // 2. Like/Saved 상태 조회
    let like_stats = get_post_like_stats(db, post_id, user_id).await?;
    let user_has_saved = if let Some(uid) = user_id {
        crate::domains::saved_posts::service::user_has_saved(db, post_id, uid)
            .await
            .unwrap_or(false)
    } else {
        false
    };

    // 3. Spots이 없으면 빈 응답 반환
    if related_data.spots.is_empty() {
        let media_source = build_media_source_from_post(&post);
        return Ok(PostDetailResponse::from_post_model(
            post,
            user,
            media_source,
            None,
            0,
            like_stats.like_count as i64,
            Some(like_stats.user_has_liked),
            user_id.map(|_| user_has_saved),
        ));
    }

    // 4. Spot 목록 생성 (배치 로드된 데이터로부터)
    let spots = build_spots_response(&related_data)?;

    // 5. Comment 개수 및 MediaSource 조회
    let comment_count = count_comments_by_post_id(db, post_id).await? as i64;
    let media_source = build_media_source_from_post(&post);

    // 6. PostDetailResponse 반환
    Ok(PostDetailResponse::from_post_model(
        post,
        user,
        media_source,
        Some(spots),
        comment_count,
        like_stats.like_count as i64,
        Some(like_stats.user_has_liked),
        user_id.map(|_| user_has_saved),
    ))
}

/// 대표 Solution 선택 (우선순위: is_adopted > is_verified > vote score)
fn select_top_solution(
    solutions: &[crate::entities::solutions::Model],
) -> Option<TopSolutionSummary> {
    if solutions.is_empty() {
        return None;
    }

    // 우선순위에 따라 정렬
    let mut sorted = solutions.to_vec();
    sorted.sort_by(|a, b| {
        // 1. is_adopted 우선
        match b.is_adopted.cmp(&a.is_adopted) {
            std::cmp::Ordering::Equal => {}
            other => return other,
        }
        // 2. is_verified 우선
        match b.is_verified.cmp(&a.is_verified) {
            std::cmp::Ordering::Equal => {}
            other => return other,
        }
        // 3. vote score (accurate_count - different_count) 높은 순
        let score_a = a.accurate_count - a.different_count;
        let score_b = b.accurate_count - b.different_count;
        score_b.cmp(&score_a)
    });

    let top = &sorted[0];
    Some(TopSolutionSummary {
        id: top.id,
        title: top.title.clone(),
        metadata: top.metadata.clone(),
        thumbnail_url: top.thumbnail_url.clone(),
        original_url: top.original_url.clone(),
        affiliate_url: top.affiliate_url.clone(),
        is_verified: top.is_verified,
        is_adopted: top.is_adopted,
    })
}

/// PostModel에서 MediaSourceDto 추출 (중복 코드 제거, dto.rs의 extract_media_source_from_model 사용)
fn build_media_source_from_post(post: &PostModel) -> MediaSourceDto {
    super::dto::extract_media_source_from_model(post)
}

/// Post 목록 조회 (필터, 정렬, 페이지네이션)
/// Note: spot_count는 Phase 7에서 조인하여 계산
pub async fn list_posts(
    db: &DatabaseConnection,
    query: PostListQuery,
) -> AppResult<PaginatedResponse<PostListItem>> {
    let mut select = Posts::find().filter(Column::Status.eq(crate::constants::post_status::ACTIVE));

    // 필터 적용
    if let Some(ref artist_name) = query.artist_name {
        select = select.filter(Column::ArtistName.eq(artist_name));
    }

    if let Some(ref group_name) = query.group_name {
        select = select.filter(Column::GroupName.eq(group_name));
    }

    if let Some(ref context) = query.context {
        select = select.filter(Column::Context.eq(context));
    }

    if let Some(user_id) = query.user_id {
        select = select.filter(Column::UserId.eq(user_id));
    }

    // has_magazine 필터: true = post_magazine_id가 있는 post만 (editorial 탭용)
    if query.has_magazine == Some(true) {
        select = select.filter(Column::PostMagazineId.is_not_null());
    }

    // has_solutions 필터: true = ACTIVE 솔루션 있는 post만, false = spot은 있으나 솔루션 없는 post만
    if let Some(has_solutions) = query.has_solutions {
        use crate::entities::solutions::{Column as SolutionColumn, Entity as Solutions};
        use crate::entities::spots::{Column as SpotColumn, Entity as Spots};

        let solution_spot_ids: Vec<Uuid> = Solutions::find()
            .filter(SolutionColumn::Status.eq(crate::constants::solution_status::ACTIVE))
            .select_only()
            .column(SolutionColumn::SpotId)
            .into_tuple::<Uuid>()
            .all(db)
            .await
            .map_err(AppError::DatabaseError)?;

        if has_solutions {
            // post_id in (spots where spot_id in solution_spot_ids)
            let post_ids_with_solutions: Vec<Uuid> = if solution_spot_ids.is_empty() {
                vec![]
            } else {
                Spots::find()
                    .filter(SpotColumn::Id.is_in(solution_spot_ids))
                    .select_only()
                    .column(SpotColumn::PostId)
                    .into_tuple::<Uuid>()
                    .all(db)
                    .await
                    .map_err(AppError::DatabaseError)?
            };
            if !post_ids_with_solutions.is_empty() {
                select = select.filter(Column::Id.is_in(post_ids_with_solutions));
            } else {
                // no post has solutions -> return empty
                select = select.filter(Column::Id.is_in([Uuid::nil()]));
            }
        } else {
            // spot은 있으나 solution 없는 post: post_id in (all spots) AND post_id not in (posts with solutions)
            let post_ids_with_solutions: Vec<Uuid> = if solution_spot_ids.is_empty() {
                vec![]
            } else {
                Spots::find()
                    .filter(SpotColumn::Id.is_in(solution_spot_ids))
                    .select_only()
                    .column(SpotColumn::PostId)
                    .into_tuple::<Uuid>()
                    .all(db)
                    .await
                    .map_err(AppError::DatabaseError)?
            };
            let post_ids_with_any_spot: Vec<Uuid> = Spots::find()
                .select_only()
                .column(SpotColumn::PostId)
                .into_tuple::<Uuid>()
                .all(db)
                .await
                .map_err(AppError::DatabaseError)?;
            let post_ids_spot_only: Vec<Uuid> = post_ids_with_any_spot
                .into_iter()
                .filter(|id| !post_ids_with_solutions.contains(id))
                .collect();
            if post_ids_spot_only.is_empty() {
                select = select.filter(Column::Id.is_in([Uuid::nil()]));
            } else {
                select = select.filter(Column::Id.is_in(post_ids_spot_only));
            }
        }
    }

    // 정렬 적용
    match query.sort.as_str() {
        "recent" => {
            select = select.order_by_desc(Column::CreatedAt);
        }
        "popular" => {
            select = select.order_by_desc(Column::ViewCount);
        }
        "trending" => {
            // trending_score DESC 정렬, NULL인 경우 created_at DESC로 fallback
            select = select
                .order_by_desc(Column::TrendingScore)
                .order_by_desc(Column::CreatedAt);
        }
        _ => {
            select = select.order_by_desc(Column::CreatedAt);
        }
    }

    // 전체 개수 조회
    let total = select
        .clone()
        .count(db)
        .await
        .map_err(AppError::DatabaseError)?;

    // 페이지네이션 설정
    let pagination = Pagination::new(query.page, query.per_page);

    // 페이지네이션 적용
    let posts = select
        .offset(pagination.offset())
        .limit(pagination.limit())
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;

    // 배치 로딩: User 정보
    use crate::entities::comments::{Column as CommentColumn, Entity as Comments};
    use crate::entities::spots::{Column as SpotColumn, Entity as Spots};
    use crate::entities::users::{Column as UserColumn, Entity as Users};

    let post_ids: Vec<Uuid> = posts.iter().map(|p| p.id).collect();
    let user_ids: Vec<Uuid> = posts.iter().map(|p| p.user_id).collect();

    // 1. User 배치 조회
    let users = Users::find()
        .filter(UserColumn::Id.is_in(user_ids))
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;
    let users_map: std::collections::HashMap<Uuid, crate::entities::users::Model> =
        users.into_iter().map(|u| (u.id, u)).collect();

    // 2. Spot 개수 배치 조회 (GROUP BY)
    let spot_counts = Spots::find()
        .select_only()
        .column(SpotColumn::PostId)
        .filter(SpotColumn::PostId.is_in(post_ids.clone()))
        .group_by(SpotColumn::PostId)
        .column_as(SpotColumn::Id.count(), "count")
        .into_tuple::<(Uuid, i64)>()
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;
    let spot_count_map: std::collections::HashMap<Uuid, i64> = spot_counts.into_iter().collect();

    // 3. Comment 개수 배치 조회 (GROUP BY)
    let comment_counts = Comments::find()
        .select_only()
        .column(CommentColumn::PostId)
        .filter(CommentColumn::PostId.is_in(post_ids))
        .group_by(CommentColumn::PostId)
        .column_as(CommentColumn::Id.count(), "count")
        .into_tuple::<(Uuid, i64)>()
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;
    let comment_count_map: std::collections::HashMap<Uuid, i64> =
        comment_counts.into_iter().collect();

    // 4. PostMagazines 배치 조회 (post_magazine_title용)
    use crate::entities::post_magazines::{Column as MagazineColumn, Entity as PostMagazines};
    let magazine_ids: Vec<Uuid> = posts.iter().filter_map(|p| p.post_magazine_id).collect();
    let magazine_titles_map: std::collections::HashMap<Uuid, String> = if magazine_ids.is_empty() {
        std::collections::HashMap::new()
    } else {
        PostMagazines::find()
            .filter(MagazineColumn::Id.is_in(magazine_ids))
            .all(db)
            .await
            .map_err(AppError::DatabaseError)?
            .into_iter()
            .map(|m| (m.id, m.title))
            .collect()
    };

    // PostListItem으로 변환 (배치 로딩 데이터 사용)
    let items: Vec<PostListItem> = posts
        .into_iter()
        .map(|post| {
            let media_source = super::dto::extract_media_source_from_model(&post);

            // HashMap에서 O(1)로 데이터 조회
            let user = users_map
                .get(&post.user_id)
                .map(|u| PostUserInfo {
                    id: u.id,
                    username: u.username.clone(),
                    avatar_url: u.avatar_url.clone(),
                    rank: u.rank.clone(),
                })
                .unwrap_or_else(|| PostUserInfo {
                    id: post.user_id,
                    username: "Unknown".to_string(),
                    avatar_url: None,
                    rank: "Member".to_string(),
                });

            let spot_count = *spot_count_map.get(&post.id).unwrap_or(&0);
            let comment_count = *comment_count_map.get(&post.id).unwrap_or(&0);
            let post_magazine_title = post
                .post_magazine_id
                .and_then(|id| magazine_titles_map.get(&id).cloned());

            PostListItem {
                id: post.id,
                user,
                image_url: post.image_url,
                media_source,
                title: post.title.clone(),
                artist_name: post.artist_name,
                group_name: post.group_name,
                context: post.context,
                spot_count,
                view_count: post.view_count,
                comment_count,
                status: post.status.clone(),
                created_at: post.created_at.with_timezone(&chrono::Utc),
                post_magazine_title,
            }
        })
        .collect();

    Ok(PaginatedResponse::new(items, pagination, total))
}

/// Post 수정
pub async fn update_post(
    state: &AppState,
    post_id: Uuid,
    user_id: Uuid,
    dto: UpdatePostDto,
) -> AppResult<PostResponse> {
    // Post 존재 확인 및 소유권 확인
    let post = get_post_by_id(&state.db, post_id).await?;
    if post.user_id != user_id {
        return Err(AppError::Forbidden(
            "You can only update your own posts".to_string(),
        ));
    }

    // ActiveModel로 변환하여 업데이트
    let mut active_post: ActiveModel = post.into();

    if let Some(media_source) = dto.media_source {
        active_post.media_type = Set(media_source.media_type().to_string());
        // title과 media_metadata는 AI가 description에서 추출할 예정
        // 현재는 None으로 유지
    }

    if let Some(group_name) = dto.group_name {
        active_post.group_name = Set(Some(group_name));
    }

    if let Some(artist_name) = dto.artist_name {
        active_post.artist_name = Set(Some(artist_name));
    }

    if let Some(context) = dto.context {
        active_post.context = Set(Some(context));
    }

    if let Some(status) = dto.status {
        active_post.status = Set(status);
    }

    // DB 업데이트
    let updated_post = active_post
        .update(&state.db)
        .await
        .map_err(AppError::DatabaseError)?;

    let updated_response: PostResponse = updated_post.into();

    // Meilisearch 업데이트 (비동기, 실패해도 Post 업데이트는 성공)
    let search_fields = match load_post_related_data(&state.db, post_id).await {
        Ok(data) => compute_search_fields(&data),
        Err(e) => {
            tracing::warn!("Failed to load search fields for post {}: {}", post_id, e);
            PostSearchFields {
                category_codes: vec![],
                has_adopted_solution: false,
                solution_count: 0,
                spot_count: 0,
            }
        }
    };
    let search_result = index_post_to_meilisearch(
        &state.search_client,
        &updated_response,
        &updated_response.image_url,
        &search_fields,
    )
    .await;

    if let Err(e) = search_result {
        tracing::warn!("Failed to update post {} in Meilisearch: {}", post_id, e);
    }

    Ok(updated_response)
}

/// Post 삭제
pub async fn delete_post(
    search_client: &std::sync::Arc<dyn crate::services::search::SearchClient>,
    db: &DatabaseConnection,
    post_id: Uuid,
    user_id: Uuid,
) -> AppResult<()> {
    // Post 존재 확인 및 소유권 확인
    let post = get_post_by_id(db, post_id).await?;
    if post.user_id != user_id {
        return Err(AppError::Forbidden(
            "You can only delete your own posts".to_string(),
        ));
    }

    // 삭제
    let active_post: ActiveModel = post.into();
    active_post
        .delete(db)
        .await
        .map_err(AppError::DatabaseError)?;

    // Meilisearch에서 삭제 (비동기, 실패해도 Post 삭제는 성공)
    let search_result = search_client.delete("posts", &post_id.to_string()).await;

    if let Err(e) = search_result {
        tracing::warn!("Failed to delete post {} from Meilisearch: {}", post_id, e);
    }

    Ok(())
}

/// Admin용 Post 목록 조회 (모든 상태 조회 가능)
pub async fn admin_list_posts(
    db: &DatabaseConnection,
    query: crate::domains::admin::posts::AdminPostListQuery,
) -> AppResult<PaginatedResponse<PostListItem>> {
    let mut select = Posts::find();

    // status 필터 적용 (있으면 적용, 없으면 모든 상태 조회)
    if let Some(ref status) = query.status {
        select = select.filter(Column::Status.eq(status));
    }

    // 필터 적용
    if let Some(ref artist_name) = query.base_query.artist_name {
        select = select.filter(Column::ArtistName.eq(artist_name));
    }

    if let Some(ref group_name) = query.base_query.group_name {
        select = select.filter(Column::GroupName.eq(group_name));
    }

    if let Some(ref context) = query.base_query.context {
        select = select.filter(Column::Context.eq(context));
    }

    if let Some(user_id) = query.base_query.user_id {
        select = select.filter(Column::UserId.eq(user_id));
    }

    // 정렬 적용
    match query.base_query.sort.as_str() {
        "recent" => {
            select = select.order_by_desc(Column::CreatedAt);
        }
        "popular" => {
            select = select.order_by_desc(Column::ViewCount);
        }
        "trending" => {
            // trending_score DESC 정렬, NULL인 경우 created_at DESC로 fallback
            select = select
                .order_by_desc(Column::TrendingScore)
                .order_by_desc(Column::CreatedAt);
        }
        _ => {
            select = select.order_by_desc(Column::CreatedAt);
        }
    }

    // 전체 개수 조회
    let total = select
        .clone()
        .count(db)
        .await
        .map_err(AppError::DatabaseError)?;

    // 페이지네이션 설정
    let pagination = Pagination::new(query.base_query.page, query.base_query.per_page);

    // 페이지네이션 적용
    let posts = select
        .offset(pagination.offset())
        .limit(pagination.limit())
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;

    // 배치 로딩: User 정보 (list_posts와 동일)
    use crate::entities::comments::{Column as CommentColumn, Entity as Comments};
    use crate::entities::spots::{Column as SpotColumn, Entity as Spots};
    use crate::entities::users::{Column as UserColumn, Entity as Users};

    let post_ids: Vec<Uuid> = posts.iter().map(|p| p.id).collect();
    let user_ids: Vec<Uuid> = posts.iter().map(|p| p.user_id).collect();

    // 1. User 배치 조회
    let users = Users::find()
        .filter(UserColumn::Id.is_in(user_ids))
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;
    let users_map: std::collections::HashMap<Uuid, crate::entities::users::Model> =
        users.into_iter().map(|u| (u.id, u)).collect();

    // 2. Spot 개수 배치 조회 (GROUP BY)
    let spot_counts = Spots::find()
        .select_only()
        .column(SpotColumn::PostId)
        .filter(SpotColumn::PostId.is_in(post_ids.clone()))
        .group_by(SpotColumn::PostId)
        .column_as(SpotColumn::Id.count(), "count")
        .into_tuple::<(Uuid, i64)>()
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;
    let spot_count_map: std::collections::HashMap<Uuid, i64> = spot_counts.into_iter().collect();

    // 3. Comment 개수 배치 조회 (GROUP BY)
    let comment_counts = Comments::find()
        .select_only()
        .column(CommentColumn::PostId)
        .filter(CommentColumn::PostId.is_in(post_ids))
        .group_by(CommentColumn::PostId)
        .column_as(CommentColumn::Id.count(), "count")
        .into_tuple::<(Uuid, i64)>()
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;
    let comment_count_map: std::collections::HashMap<Uuid, i64> =
        comment_counts.into_iter().collect();

    // 4. PostMagazines 배치 조회 (post_magazine_title용)
    use crate::entities::post_magazines::{Column as MagazineColumn, Entity as PostMagazines};
    let magazine_ids: Vec<Uuid> = posts.iter().filter_map(|p| p.post_magazine_id).collect();
    let magazine_titles_map: std::collections::HashMap<Uuid, String> = if magazine_ids.is_empty() {
        std::collections::HashMap::new()
    } else {
        PostMagazines::find()
            .filter(MagazineColumn::Id.is_in(magazine_ids))
            .all(db)
            .await
            .map_err(AppError::DatabaseError)?
            .into_iter()
            .map(|m| (m.id, m.title))
            .collect()
    };

    // PostListItem으로 변환 (배치 로딩 데이터 사용)
    let items: Vec<PostListItem> = posts
        .into_iter()
        .map(|post| {
            let media_source = super::dto::extract_media_source_from_model(&post);

            // HashMap에서 O(1)로 데이터 조회
            let user = users_map
                .get(&post.user_id)
                .map(|u| PostUserInfo {
                    id: u.id,
                    username: u.username.clone(),
                    avatar_url: u.avatar_url.clone(),
                    rank: u.rank.clone(),
                })
                .unwrap_or_else(|| PostUserInfo {
                    id: post.user_id,
                    username: "Unknown".to_string(),
                    avatar_url: None,
                    rank: "Member".to_string(),
                });

            let spot_count = *spot_count_map.get(&post.id).unwrap_or(&0);
            let comment_count = *comment_count_map.get(&post.id).unwrap_or(&0);
            let post_magazine_title = post
                .post_magazine_id
                .and_then(|id| magazine_titles_map.get(&id).cloned());

            PostListItem {
                id: post.id,
                user,
                image_url: post.image_url,
                media_source,
                title: post.title.clone(),
                artist_name: post.artist_name,
                group_name: post.group_name,
                context: post.context,
                spot_count,
                view_count: post.view_count,
                comment_count,
                status: post.status.clone(),
                created_at: post.created_at.with_timezone(&chrono::Utc),
                post_magazine_title,
            }
        })
        .collect();

    Ok(PaginatedResponse::new(items, pagination, total))
}

/// Admin용 Post 상태 변경
pub async fn admin_update_post_status(
    search_client: &std::sync::Arc<dyn crate::services::search::SearchClient>,
    db: &DatabaseConnection,
    post_id: Uuid,
    status: &str,
) -> AppResult<PostResponse> {
    // Post 존재 확인
    let post = get_post_by_id(db, post_id).await?;

    // ActiveModel로 변환하여 상태만 업데이트
    let mut active_post: ActiveModel = post.into();
    active_post.status = Set(status.to_string());

    // DB 업데이트
    let updated_post = active_post
        .update(db)
        .await
        .map_err(AppError::DatabaseError)?;

    // Meilisearch 동기화 (비동기, 실패해도 상태 변경은 성공)
    match status {
        "hidden" | "deleted" => {
            if let Err(e) = search_client.delete("posts", &post_id.to_string()).await {
                tracing::warn!(
                    "Failed to delete post {} from Meilisearch: {}",
                    post_id,
                    e
                );
            }
        }
        "active" => {
            let doc = serde_json::json!({
                "id": post_id.to_string(),
                "status": "active"
            });
            if let Err(e) = search_client
                .update_document("posts", &post_id.to_string(), doc)
                .await
            {
                tracing::warn!(
                    "Failed to update post {} in Meilisearch: {}",
                    post_id,
                    e
                );
            }
        }
        _ => {}
    }

    Ok(updated_post.into())
}

/// Admin용 Post 메타데이터 수정 (소유권 검사 없음)
pub async fn admin_update_post(
    state: &AppState,
    post_id: Uuid,
    dto: UpdatePostDto,
) -> AppResult<PostResponse> {
    let post = get_post_by_id(&state.db, post_id).await?;

    let mut active_post: ActiveModel = post.into();

    if let Some(media_source) = dto.media_source {
        active_post.media_type = Set(media_source.media_type().to_string());
    }
    if let Some(group_name) = dto.group_name {
        active_post.group_name = Set(Some(group_name));
    }
    if let Some(artist_name) = dto.artist_name {
        active_post.artist_name = Set(Some(artist_name));
    }
    if let Some(context) = dto.context {
        active_post.context = Set(Some(context));
    }
    if let Some(status) = dto.status {
        active_post.status = Set(status);
    }

    let updated_post = active_post
        .update(&state.db)
        .await
        .map_err(AppError::DatabaseError)?;

    let updated_response: PostResponse = updated_post.into();

    // Meilisearch 재인덱싱
    let search_fields = match load_post_related_data(&state.db, post_id).await {
        Ok(data) => compute_search_fields(&data),
        Err(e) => {
            tracing::warn!("Failed to load search fields for post {}: {}", post_id, e);
            PostSearchFields {
                category_codes: vec![],
                has_adopted_solution: false,
                solution_count: 0,
                spot_count: 0,
            }
        }
    };
    if let Err(e) = index_post_to_meilisearch(
        &state.search_client,
        &updated_response,
        &updated_response.image_url,
        &search_fields,
    )
    .await
    {
        tracing::warn!("Failed to update post {} in Meilisearch: {}", post_id, e);
    }

    Ok(updated_response)
}

/// 조회수 증가
pub async fn increment_view_count(db: &DatabaseConnection, post_id: Uuid) -> AppResult<()> {
    let post = get_post_by_id(db, post_id).await?;
    let mut active_post: ActiveModel = post.into();
    active_post.view_count = Set(active_post.view_count.take().unwrap_or(0) + 1);

    active_post
        .update(db)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(())
}

/// 이미지 업로드
pub async fn upload_image(
    state: &AppState,
    image_data: Vec<u8>,
    content_type: &str,
    user_id: Uuid,
) -> AppResult<ImageUploadResponse> {
    // 파일 키 생성 (user_id/timestamp_uuid.ext 형식)
    use chrono::Utc;
    let timestamp = Utc::now().timestamp();
    let file_uuid = Uuid::new_v4();
    let extension = match content_type {
        "image/jpeg" | "image/jpg" => "jpg",
        "image/png" => "png",
        "image/webp" => "webp",
        _ => {
            return Err(AppError::BadRequest(format!(
                "Unsupported content type: {}",
                content_type
            )));
        }
    };
    let key = format!(
        "posts/{}/{}_{}.{}",
        user_id, timestamp, file_uuid, extension
    );

    // StorageClient를 사용하여 업로드
    let image_url = state
        .storage_client
        .upload(&key, image_data, content_type)
        .await
        .map_err(|e| AppError::ExternalService(format!("Failed to upload image: {}", e)))?;

    Ok(ImageUploadResponse { image_url })
}

/// AI 이미지 분석 (decoded-ai gRPC)
pub async fn analyze_image(
    state: &AppState,
    mut multipart: axum_extra::extract::Multipart,
) -> AppResult<ImageAnalyzeResponse> {
    // Multipart에서 이미지 데이터 추출
    let mut image_data: Option<Vec<u8>> = None;
    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| AppError::BadRequest(format!("Failed to read multipart field: {}", e)))?
    {
        let name = field.name().unwrap_or("").to_string();
        if name == "image" {
            let data = field
                .bytes()
                .await
                .map_err(|e| AppError::BadRequest(format!("Failed to read image data: {}", e)))?;
            image_data = Some(data.to_vec());
            break;
        }
    }

    let image_data =
        image_data.ok_or_else(|| AppError::BadRequest("No image field found".to_string()))?;

    // 카테고리 캐시에서 카테고리 규칙 생성
    let category_rules = state.category_cache.build_category_rules(&state.db).await?;

    // decoded-ai gRPC 클라이언트 호출
    let metadata = state
        .decoded_ai_client
        .analyze_image(image_data, category_rules)
        .await?;

    Ok(ImageAnalyzeResponse { metadata })
}

/// Post를 Meilisearch에 색인하는 헬퍼 함수
#[allow(clippy::disallowed_methods)] // serde_json::json! 매크로 전개
pub(crate) async fn index_post_to_meilisearch(
    search_client: &std::sync::Arc<dyn crate::services::search::SearchClient>,
    post: &PostResponse,
    image_url: &str,
    search_fields: &PostSearchFields,
) -> AppResult<()> {
    let document = serde_json::json!({
        "id": post.id.to_string(),
        "artist_name": post.artist_name,
        "group_name": post.group_name,
        "title": post.title,
        "context": post.context,
        "media_type": post.media_source.media_type.clone(),
        "status": post.status.clone(),
        "created_at": post.created_at.timestamp(),
        "view_count": post.view_count,
        "image_url": image_url,
        "spot_count": search_fields.spot_count,
        "category_codes": search_fields.category_codes,
        "has_adopted_solution": search_fields.has_adopted_solution,
        "solution_count": search_fields.solution_count,
    });

    search_client
        .index("posts", &post.id.to_string(), document)
        .await
        .map_err(|e| AppError::ExternalService(format!("Failed to index to Meilisearch: {}", e)))?;

    Ok(())
}

/// 공개 URL에서 저장소 키 추출
/// URL: https://example.com/posts/user_id/timestamp_uuid.ext
/// Key: posts/user_id/timestamp_uuid.ext
fn extract_key_from_url(url: &str) -> String {
    url.split('/')
        .skip_while(|part| !part.contains("posts"))
        .collect::<Vec<_>>()
        .join("/")
}

/// URL에서 사이트명 추출 (Solution 생성 시 사용)
fn extract_site_name_from_url(url: &str) -> String {
    if let Ok(parsed) = url::Url::parse(url) {
        if let Some(host) = parsed.host_str() {
            // Remove www. prefix and get first part
            let host = host.replace("www.", "");
            if let Some(first_part) = host.split('.').next() {
                return first_part.to_string();
            }
        }
    }
    "unknown".to_string()
}

/// CategoryModel을 CategoryResponse로 변환
fn convert_category_model_to_response(
    model: crate::entities::categories::Model,
) -> AppResult<crate::domains::categories::dto::CategoryResponse> {
    use crate::domains::categories::dto::{CategoryDescription, CategoryName};
    use serde_json::Value;

    // JSONB name 파싱
    let name_value: Value = serde_json::from_value(model.name.clone())
        .map_err(|e| AppError::InternalError(format!("Failed to parse category name: {}", e)))?;

    let name = CategoryName {
        ko: name_value
            .get("ko")
            .and_then(|v| v.as_str())
            .ok_or_else(|| AppError::InternalError("Missing 'ko' in category name".to_string()))?
            .to_string(),
        en: name_value
            .get("en")
            .and_then(|v| v.as_str())
            .ok_or_else(|| AppError::InternalError("Missing 'en' in category name".to_string()))?
            .to_string(),
        ja: name_value
            .get("ja")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
    };

    // JSONB description 파싱 (옵션)
    let description = if let Some(desc_value) = model.description {
        let desc_json: Value = serde_json::from_value(desc_value)
            .map_err(|e| AppError::InternalError(format!("Failed to parse description: {}", e)))?;

        Some(CategoryDescription {
            ko: desc_json
                .get("ko")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string()),
            en: desc_json
                .get("en")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string()),
            ja: desc_json
                .get("ja")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string()),
        })
    } else {
        None
    };

    Ok(crate::domains::categories::dto::CategoryResponse {
        id: model.id,
        code: model.code,
        name,
        icon_url: model.icon_url,
        color_hex: model.color_hex,
        description,
        display_order: model.display_order,
        is_active: model.is_active,
    })
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;
    use crate::entities::{categories, posts, solutions};
    use crate::services::DummySearchClient;
    use chrono::{DateTime, FixedOffset, Utc};
    use serde_json::json;
    use std::sync::Arc;

    fn ts() -> chrono::DateTime<FixedOffset> {
        Utc::now().with_timezone(&FixedOffset::east_opt(0).unwrap())
    }

    #[test]
    fn extract_key_from_url_takes_path_after_posts_segment() {
        let key = extract_key_from_url("https://cdn.example.com/posts/uuid/file.png");
        assert_eq!(key, "posts/uuid/file.png");
    }

    #[test]
    fn extract_key_from_url_empty_when_no_posts_segment() {
        assert_eq!(
            extract_key_from_url("https://example.com/no-here/image.png"),
            ""
        );
    }

    #[test]
    fn extract_site_name_from_https_url() {
        assert_eq!(
            extract_site_name_from_url("https://www.shop.example.com/path"),
            "shop"
        );
    }

    #[test]
    fn extract_site_name_unknown_for_invalid_url() {
        assert_eq!(extract_site_name_from_url("not a url"), "unknown");
    }

    fn mk_solution(
        spot_id: Uuid,
        adopted: bool,
        verified: bool,
        acc: i32,
        diff: i32,
    ) -> solutions::Model {
        let t = ts();
        solutions::Model {
            id: Uuid::new_v4(),
            spot_id,
            user_id: Uuid::nil(),
            match_type: None,
            link_type: None,
            title: "t".into(),
            original_url: None,
            affiliate_url: None,
            thumbnail_url: None,
            description: None,
            comment: None,
            accurate_count: acc,
            different_count: diff,
            is_verified: verified,
            is_adopted: adopted,
            adopted_at: None,
            click_count: 0,
            purchase_count: 0,
            status: "active".into(),
            metadata: None,
            keywords: None,
            qna: None,
            created_at: t,
            updated_at: t,
        }
    }

    #[test]
    fn select_top_solution_empty() {
        assert!(select_top_solution(&[]).is_none());
    }

    #[test]
    fn select_top_solution_prefers_adopted() {
        let sid = Uuid::new_v4();
        let a = mk_solution(sid, true, false, 0, 0);
        let b = mk_solution(sid, false, true, 100, 0);
        let top = select_top_solution(&[b, a]).expect("some");
        assert!(top.is_adopted);
    }

    #[test]
    fn select_top_solution_tie_breaks_by_vote_score() {
        let sid = Uuid::new_v4();
        let lower = mk_solution(sid, false, false, 1, 0);
        let higher = mk_solution(sid, false, false, 10, 0);
        let higher_id = higher.id;
        let top = select_top_solution(&[lower, higher]).expect("some");
        assert_eq!(top.id, higher_id);
    }

    #[test]
    fn build_media_source_from_post_delegates_to_dto() {
        let t = ts();
        let post = posts::Model {
            id: Uuid::nil(),
            user_id: Uuid::nil(),
            image_url: "https://i".into(),
            media_type: "mv".into(),
            title: None,
            media_metadata: None,
            group_name: None,
            artist_name: None,
            context: None,
            view_count: 0,
            status: "active".into(),
            trending_score: None,
            created_with_solutions: None,
            post_magazine_id: None,
            ai_summary: None,
            created_at: t,
            updated_at: t,
        };
        let ms = build_media_source_from_post(&post);
        assert_eq!(ms.media_type(), "mv");
    }

    #[test]
    fn convert_category_model_ok() {
        let t = ts();
        let m = categories::Model {
            id: Uuid::new_v4(),
            code: "c".into(),
            name: json!({"ko": "한", "en": "En"}),
            icon_url: None,
            color_hex: None,
            description: None,
            display_order: 0,
            is_active: true,
            created_at: t,
            updated_at: t,
        };
        let r = convert_category_model_to_response(m).expect("ok");
        assert_eq!(r.code, "c");
        assert_eq!(r.name.ko, "한");
    }

    #[test]
    fn convert_category_model_errors_on_bad_name_json() {
        let t = ts();
        let m = categories::Model {
            id: Uuid::new_v4(),
            code: "c".into(),
            name: json!("not-object"),
            icon_url: None,
            color_hex: None,
            description: None,
            display_order: 0,
            is_active: true,
            created_at: t,
            updated_at: t,
        };
        assert!(convert_category_model_to_response(m).is_err());
    }

    #[test]
    fn build_spots_response_empty_inputs() {
        let data = PostRelatedData {
            spots: vec![],
            solutions: vec![],
            subcategories: vec![],
            categories: vec![],
        };
        assert!(build_spots_response(&data).unwrap().is_empty());
    }

    #[tokio::test]
    async fn index_post_to_meilisearch_with_dummy_client() {
        let client: Arc<dyn crate::services::SearchClient> = Arc::new(DummySearchClient);
        let post = PostResponse {
            id: Uuid::nil(),
            user_id: Uuid::nil(),
            image_url: "https://i".into(),
            media_source: MediaSourceDto {
                media_type: "drama".into(),
                description: None,
            },
            title: None,
            group_name: None,
            artist_name: None,
            context: None,
            view_count: 1,
            status: "active".into(),
            created_at: DateTime::parse_from_rfc3339("2025-01-01T00:00:00Z")
                .unwrap()
                .with_timezone(&Utc),
        };
        let search_fields = PostSearchFields {
            category_codes: vec!["fashion".to_string()],
            has_adopted_solution: false,
            solution_count: 0,
            spot_count: 2,
        };
        index_post_to_meilisearch(&client, &post, "https://img/x.png", &search_fields)
            .await
            .expect("index ok");
    }

    #[test]
    fn compute_search_fields_empty_data() {
        let data = PostRelatedData {
            spots: vec![],
            solutions: vec![],
            subcategories: vec![],
            categories: vec![],
        };
        let fields = compute_search_fields(&data);
        assert!(fields.category_codes.is_empty());
        assert!(!fields.has_adopted_solution);
        assert_eq!(fields.solution_count, 0);
        assert_eq!(fields.spot_count, 0);
    }
}
