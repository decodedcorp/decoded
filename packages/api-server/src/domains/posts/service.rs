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
    CreatePostDto, CreatePostWithSolutionsResponse, CreateTryPostDto, ImageAnalyzeResponse,
    ImageUploadResponse, MediaSourceDto, PostDetailResponse, PostListItem, PostListQuery,
    PostResponse, PostUserInfo, SpotWithTopSolution, TopSolutionSummary, TryCountResponse,
    TryListQuery, TryListResponse, TryPostListItem, UpdatePostDto,
};
use super::magazine_preview::{parse_magazine_preview_items, PostMagazinePreviewItem};

#[allow(dead_code)]
const POST_TYPE_POST: &str = "post";
const POST_TYPE_TRY: &str = "try";

/// Solution 정보 (AI 분석 트리거용)
struct SolutionInfo {
    id: Uuid,
    url: String,
    title: Option<String>,
    description: String,
    site_name: String,
}

/// 이름 문자열로 warehouse.artists / warehouse.groups의 FK를 찾아 반환.
/// create_post 시점에 dto.artist_id / dto.group_id가 비어 있을 때 자동 lookup에
/// 사용한다. 매칭은 case-insensitive + BTRIM — 레거시 post는 소문자 Instagram
/// 핸들("jennie")을 저장하는 반면 warehouse는 정규 표기("Jennie")를 쓰므로
/// 완전 일치로는 매칭이 거의 되지 않는다. 실패는 graceful (None 반환) — 매칭
/// 실패가 post 생성을 차단해서는 안 된다.
async fn resolve_warehouse_ids_from_names<C>(
    conn: &C,
    artist_name: Option<&str>,
    group_name: Option<&str>,
) -> (Option<Uuid>, Option<Uuid>)
where
    C: sea_orm::ConnectionTrait,
{
    use crate::entities::artists::Entity as WarehouseArtists;
    use crate::entities::groups::Entity as WarehouseGroups;
    use sea_orm::sea_query::Expr;

    let artist_fut = async {
        let name = artist_name?.trim();
        if name.is_empty() {
            return None;
        }
        let lower = name.to_lowercase();
        WarehouseArtists::find()
            .filter(Expr::cust_with_values(
                "LOWER(BTRIM(name_ko)) = $1 OR LOWER(BTRIM(name_en)) = $1",
                [lower],
            ))
            .one(conn)
            .await
            .ok()
            .flatten()
            .map(|a| a.id)
    };
    let group_fut = async {
        let name = group_name?.trim();
        if name.is_empty() {
            return None;
        }
        let lower = name.to_lowercase();
        WarehouseGroups::find()
            .filter(Expr::cust_with_values(
                "LOWER(BTRIM(name_ko)) = $1 OR LOWER(BTRIM(name_en)) = $1",
                [lower],
            ))
            .one(conn)
            .await
            .ok()
            .flatten()
            .map(|g| g.id)
    };
    tokio::join!(artist_fut, group_fut)
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

            // dto에서 직접 전달된 group_name, artist_name, context 및 optional warehouse FK 사용
            let group_name = dto.group_name;
            let mut group_id = dto.group_id;
            let artist_name = dto.artist_name;
            let mut artist_id = dto.artist_id;
            let context = dto.context;

            // 클라이언트가 warehouse FK를 명시하지 않은 경우(대부분의 업로드),
            // artist_name / group_name 문자열로 warehouse를 자동 lookup해서
            // posts.artist_id / group_id를 채운다. 이미 값이 있으면 사용자 지정을
            // 우선해 lookup을 생략한다.
            if artist_id.is_none() || group_id.is_none() {
                let (resolved_artist, resolved_group) = resolve_warehouse_ids_from_names(
                    txn,
                    if artist_id.is_none() {
                        artist_name.as_deref()
                    } else {
                        None
                    },
                    if group_id.is_none() {
                        group_name.as_deref()
                    } else {
                        None
                    },
                )
                .await;
                if artist_id.is_none() {
                    artist_id = resolved_artist;
                }
                if group_id.is_none() {
                    group_id = resolved_group;
                }
            }

            // ActiveModel 생성
            let post = ActiveModel {
                id: Set(Uuid::new_v4()),
                user_id: Set(user_id),
                image_url: Set(dto.image_url),
                media_type: Set(dto.media_source.media_type().to_string()),
                title: Set(None),          // AI가 description에서 추출할 예정
                media_metadata: Set(None), // AI가 description에서 추출할 예정
                group_name: Set(group_name),
                group_id: Set(group_id),
                artist_name: Set(artist_name),
                artist_id: Set(artist_id),
                context: Set(context),
                view_count: Set(0),
                status: Set(crate::constants::post_status::ACTIVE.to_string()),
                created_with_solutions: Set(Some(created_with_solutions)),
                image_width: Set(dto.image_width),
                image_height: Set(dto.image_height),
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
                        brand_id: solution_dto.brand_id,
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
/// 포스트 이미지에서 context/style_tags 자동 추출 (fire-and-forget)
fn spawn_extract_post_context(state: &AppState, post_id: Uuid, image_url: String) {
    let ai_client = state.decoded_ai_client.clone();
    tokio::spawn(async move {
        match ai_client
            .extract_post_context(post_id.to_string(), image_url)
            .await
        {
            Ok(resp) if resp.success => {
                tracing::info!("Post {} context extracted: {}", post_id, resp.context);
            }
            Ok(resp) => {
                tracing::warn!(
                    "Post {} context extraction failed: {}",
                    post_id,
                    resp.error_message
                );
            }
            Err(e) => {
                tracing::warn!("Post {} context extraction gRPC error: {}", post_id, e);
            }
        }
    });
}

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

    // 업로드된 이미지 URL과 dimension을 dto에 설정
    dto.image_url = upload_response.image_url.clone();
    if dto.image_width.is_none() {
        dto.image_width = upload_response.image_width;
    }
    if dto.image_height.is_none() {
        dto.image_height = upload_response.image_height;
    }

    // Post 생성 (트랜잭션 내에서 Post + Spots 생성)
    let (post, _spot_ids, _solution_infos) =
        create_post_transaction(state.db.as_ref(), user_id, dto, false)
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
    let search_fields = match load_post_related_data(state.db.as_ref(), post.id).await {
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

    // AI context/style_tags 추출 (비동기, fire-and-forget)
    spawn_extract_post_context(state, post.id, upload_response.image_url);

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

    // 업로드된 이미지 URL과 dimension을 dto에 설정
    dto.image_url = upload_response.image_url.clone();
    if dto.image_width.is_none() {
        dto.image_width = upload_response.image_width;
    }
    if dto.image_height.is_none() {
        dto.image_height = upload_response.image_height;
    }

    // Post 생성 (트랜잭션 내에서 Post + Spots + Solutions 생성)
    let (post, spot_ids, solution_infos) =
        create_post_transaction(state.db.as_ref(), user_id, dto, true)
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
    let search_fields = match load_post_related_data(state.db.as_ref(), post.id).await {
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

    // AI context/style_tags 추출 (비동기, fire-and-forget)
    spawn_extract_post_context(state, post.id, upload_response.image_url.clone());

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
    pub brand_logos: std::collections::HashMap<Uuid, String>,
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
        return Ok(PostRelatedData {
            spots: vec![],
            solutions: vec![],
            subcategories: vec![],
            categories: vec![],
            brand_logos: std::collections::HashMap::new(),
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

    // 5. Brand logos 배치 조회 (solutions.brand_id → warehouse.brands.logo_image_url)
    let brand_ids: Vec<Uuid> = solutions.iter().filter_map(|s| s.brand_id).collect();
    let brand_logos = if brand_ids.is_empty() {
        std::collections::HashMap::new()
    } else {
        use crate::entities::brands::{Column as BrandCol, Entity as WBrands};
        let brands = WBrands::find()
            .filter(BrandCol::Id.is_in(brand_ids))
            .all(db)
            .await
            .map_err(AppError::DatabaseError)?;
        brands
            .into_iter()
            .filter_map(|b| b.logo_image_url.map(|url| (b.id, url)))
            .collect()
    };

    Ok(PostRelatedData {
        spots,
        solutions,
        subcategories,
        categories,
        brand_logos,
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

        let top_solution = select_top_solution(solutions_for_spot, &related_data.brand_logos);

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

/// Warehouse 배치 조회: posts 목록에서 artist_id/group_id를 모아 한 번의 쿼리로
/// (name_en, name_ko, profile_image_url) 디스플레이 데이터를 로드한다.
/// list_posts / admin_list_posts에서 공유한다. 응답 DTO 쪽에서 English-first fallback
/// 적용 (name_en → name_ko → posts.*_name legacy).
#[allow(clippy::type_complexity)]
async fn load_warehouse_display_maps(
    db: &DatabaseConnection,
    posts: &[crate::entities::posts::Model],
) -> AppResult<(
    std::collections::HashMap<Uuid, EntityDisplay>,
    std::collections::HashMap<Uuid, EntityDisplay>,
)> {
    use crate::entities::artists::{Column as ArtistCol, Entity as WarehouseArtists};
    use crate::entities::groups::{Column as GroupCol, Entity as WarehouseGroups};

    let artist_ids: Vec<Uuid> = posts.iter().filter_map(|p| p.artist_id).collect();
    let group_ids: Vec<Uuid> = posts.iter().filter_map(|p| p.group_id).collect();

    let artist_map = if artist_ids.is_empty() {
        std::collections::HashMap::new()
    } else {
        WarehouseArtists::find()
            .filter(ArtistCol::Id.is_in(artist_ids))
            .all(db)
            .await
            .map_err(AppError::DatabaseError)?
            .into_iter()
            .map(|a| (a.id, (a.name_en, a.name_ko, a.profile_image_url)))
            .collect()
    };

    let group_map = if group_ids.is_empty() {
        std::collections::HashMap::new()
    } else {
        WarehouseGroups::find()
            .filter(GroupCol::Id.is_in(group_ids))
            .all(db)
            .await
            .map_err(AppError::DatabaseError)?
            .into_iter()
            .map(|g| (g.id, (g.name_en, g.name_ko, g.profile_image_url)))
            .collect()
    };

    Ok((artist_map, group_map))
}

/// 단일 post의 artist/group display fallback: (artist_name, profile), (group_name, profile).
/// `name_en → name_ko → legacy posts.*_name` 순서로 이름을 선택하고, profile image는
/// warehouse 값을 그대로 전달한다 (없으면 None).
#[allow(clippy::type_complexity)]
fn resolve_display_from_maps(
    post: &crate::entities::posts::Model,
    artist_display_map: &std::collections::HashMap<Uuid, EntityDisplay>,
    group_display_map: &std::collections::HashMap<Uuid, EntityDisplay>,
) -> (
    (Option<String>, Option<String>),
    (Option<String>, Option<String>),
) {
    let (artist_name, artist_img) = match post
        .artist_id
        .and_then(|id| artist_display_map.get(&id).cloned())
    {
        Some((name_en, name_ko, img)) => {
            let name = name_en.or(name_ko).or_else(|| post.artist_name.clone());
            (name, img)
        }
        None => (post.artist_name.clone(), None),
    };
    let (group_name, group_img) = match post
        .group_id
        .and_then(|id| group_display_map.get(&id).cloned())
    {
        Some((name_en, name_ko, img)) => {
            let name = name_en.or(name_ko).or_else(|| post.group_name.clone());
            (name, img)
        }
        None => (post.group_name.clone(), None),
    };
    ((artist_name, artist_img), (group_name, group_img))
}

/// Warehouse에서 아티스트/그룹의 display data(name_en, name_ko, profile image)를 병렬 조회.
/// 반환 순서: ((artist_name_en, artist_name_ko, artist_profile_image_url),
///            (group_name_en, group_name_ko, group_profile_image_url))
///
/// artist_id/group_id가 None이거나 warehouse row가 없으면 해당 튜플은 전부 None.
/// 응답 DTO 쪽에서 `name_en → name_ko → posts.artist_name(legacy)` 순으로 fallback을 적용한다.
type EntityDisplay = (Option<String>, Option<String>, Option<String>);

async fn load_entity_display_data(
    db: &DatabaseConnection,
    artist_id: Option<Uuid>,
    group_id: Option<Uuid>,
) -> (EntityDisplay, EntityDisplay) {
    let artist_fut = async {
        match artist_id {
            Some(aid) => crate::entities::Artists::find_by_id(aid)
                .one(db)
                .await
                .ok()
                .flatten()
                .map(|a| (a.name_en, a.name_ko, a.profile_image_url))
                .unwrap_or((None, None, None)),
            None => (None, None, None),
        }
    };

    let group_fut = async {
        match group_id {
            Some(gid) => crate::entities::Groups::find_by_id(gid)
                .one(db)
                .await
                .ok()
                .flatten()
                .map(|g| (g.name_en, g.name_ko, g.profile_image_url))
                .unwrap_or((None, None, None)),
            None => (None, None, None),
        }
    };

    tokio::join!(artist_fut, group_fut)
}

/// Post 상세 조회 (Spots + 대표 Solution 포함)
///
/// 독립적인 쿼리를 tokio::try_join!으로 병렬 실행하여 응답 시간을 최소화한다.
/// Before: post → user → related_data → like_stats → saved → profile (직렬 ~6 RTT)
/// After:  post → [user, related_data, like_count, user_liked, saved, profile] 병렬 (~2 RTT)
#[allow(clippy::disallowed_methods)] // tokio::try_join! 매크로 전개 false positive
pub async fn get_post_detail(
    db: &DatabaseConnection,
    post_id: Uuid,
    user_id: Option<Uuid>,
) -> AppResult<PostDetailResponse> {
    use crate::domains::comments::service::count_comments_by_post_id;
    use crate::domains::post_likes::service::{count_likes_by_post_id, user_has_liked};
    use crate::domains::saved_posts::service::{count_saves_by_post_id, user_has_saved};
    use crate::domains::users::service::get_user_by_id;

    // 1. Post 조회 (나머지 쿼리에서 post.user_id, post.artist_id 등이 필요)
    let post = get_post_by_id(db, post_id).await?;

    // 2. 독립적인 쿼리들을 모두 병렬 실행 (커넥션 풀 압박 최소화를 위해 5개로 제한)
    let user_fut = get_user_by_id(db, post.user_id);
    let related_fut = load_post_related_data(db, post_id);
    let like_count_fut = count_likes_by_post_id(db, post_id);
    let display_fut = load_entity_display_data(db, post.artist_id, post.group_id);

    let user_liked_fut = async {
        match user_id {
            Some(uid) => user_has_liked(db, post_id, uid).await,
            None => Ok(false),
        }
    };
    let saved_fut = async {
        match user_id {
            Some(uid) => match user_has_saved(db, post_id, uid).await {
                Ok(saved) => Ok(saved),
                Err(_) => Ok(false),
            },
            None => Ok::<bool, crate::error::AppError>(false),
        }
    };

    let (
        user,
        related_data,
        like_count,
        user_has_liked_val,
        user_has_saved_val,
        ((artist_name_en, artist_name_ko, artist_img), (group_name_en, group_name_ko, group_img)),
    ) = tokio::try_join!(
        user_fut,
        related_fut,
        like_count_fut,
        user_liked_fut,
        saved_fut,
        async { Ok(display_fut.await) },
    )?;

    // 3. Spots이 없으면 빈 응답 반환
    if related_data.spots.is_empty() {
        let media_source = build_media_source_from_post(&post);
        let try_count = if post.post_type.as_deref() != Some(POST_TYPE_TRY) {
            let c = count_tries(db, post_id).await?;
            if c.count > 0 {
                Some(c.count)
            } else {
                None
            }
        } else {
            None
        };
        let save_count: u64 = count_saves_by_post_id(db, post_id)
            .await
            .unwrap_or_default();
        let mut response = PostDetailResponse::from_post_model(
            post,
            user,
            media_source,
            None,
            0,
            like_count as i64,
            Some(user_has_liked_val),
            user_id.map(|_| user_has_saved_val),
        );
        response.save_count = save_count as i64;
        response.try_count = try_count;
        response.artist_profile_image_url = artist_img;
        response.group_profile_image_url = group_img;
        // English-first fallback: warehouse name_en → name_ko → posts.artist_name(legacy).
        // legacy 값은 from_post_model()이 이미 response.*_name에 넣어뒀으므로, warehouse 값이
        // 있을 때만 덮어쓴다.
        if let Some(name) = artist_name_en.or(artist_name_ko) {
            response.artist_name = Some(name);
        }
        if let Some(name) = group_name_en.or(group_name_ko) {
            response.group_name = Some(name);
        }
        return Ok(response);
    }

    // 4. Spot 목록 생성 + Comment/Try 카운트 병렬
    let spots = build_spots_response(&related_data)?;
    let media_source = build_media_source_from_post(&post);

    let is_try = post.post_type.as_deref() == Some(POST_TYPE_TRY);
    let (comment_count, try_count_result, save_count) = tokio::try_join!(
        async {
            count_comments_by_post_id(db, post_id)
                .await
                .map(|c| c as i64)
        },
        async {
            if is_try {
                return Ok(None);
            }
            count_tries(db, post_id)
                .await
                .map(|c| if c.count > 0 { Some(c.count) } else { None })
        },
        async { count_saves_by_post_id(db, post_id).await },
    )?;

    // 5. PostDetailResponse 반환
    let mut response = PostDetailResponse::from_post_model(
        post,
        user,
        media_source,
        Some(spots),
        comment_count,
        like_count as i64,
        Some(user_has_liked_val),
        user_id.map(|_| user_has_saved_val),
    );
    response.save_count = save_count as i64;
    response.try_count = try_count_result;
    response.artist_profile_image_url = artist_img;
    response.group_profile_image_url = group_img;
    // English-first fallback (see empty-spots branch above for rationale)
    if let Some(name) = artist_name_en.or(artist_name_ko) {
        response.artist_name = Some(name);
    }
    if let Some(name) = group_name_en.or(group_name_ko) {
        response.group_name = Some(name);
    }

    Ok(response)
}

/// 대표 Solution 선택 (우선순위: is_adopted > is_verified > vote score)
fn select_top_solution(
    solutions: &[crate::entities::solutions::Model],
    brand_logos: &std::collections::HashMap<Uuid, String>,
) -> Option<TopSolutionSummary> {
    if solutions.is_empty() {
        return None;
    }

    let mut sorted = solutions.to_vec();
    sorted.sort_by(|a, b| {
        match b.is_adopted.cmp(&a.is_adopted) {
            std::cmp::Ordering::Equal => {}
            other => return other,
        }
        match b.is_verified.cmp(&a.is_verified) {
            std::cmp::Ordering::Equal => {}
            other => return other,
        }
        let score_a = a.accurate_count - a.different_count;
        let score_b = b.accurate_count - b.different_count;
        score_b.cmp(&score_a)
    });

    let top = &sorted[0];
    let brand_logo_url = top.brand_id.and_then(|bid| brand_logos.get(&bid).cloned());

    Some(TopSolutionSummary {
        id: top.id,
        title: top.title.clone(),
        metadata: top.metadata.clone(),
        thumbnail_url: top.thumbnail_url.clone(),
        original_url: top.original_url.clone(),
        affiliate_url: top.affiliate_url.clone(),
        is_verified: top.is_verified,
        is_adopted: top.is_adopted,
        brand_logo_url,
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

    // Try 포스트는 일반 피드에서 제외
    select = select.filter(
        Column::PostType
            .is_null()
            .or(Column::PostType.ne(POST_TYPE_TRY)),
    );

    // 필터 적용
    if let Some(ref artist_name) = query.artist_name {
        select = select.filter(Column::ArtistName.eq(artist_name));
    }

    if let Some(ref group_name) = query.group_name {
        select = select.filter(Column::GroupName.eq(group_name));
    }

    if let Some(artist_id) = query.artist_id {
        select = select.filter(Column::ArtistId.eq(artist_id));
    }

    if let Some(group_id) = query.group_id {
        select = select.filter(Column::GroupId.eq(group_id));
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
    // 최적화: 2~3개 순차 쿼리 → 1개 JOIN 쿼리로 통합
    if let Some(has_solutions) = query.has_solutions {
        use sea_orm::sea_query::{Alias, Query as SeaQuery};

        // spots JOIN solutions (status='active') → DISTINCT post_id (단일 쿼리)
        let subquery = SeaQuery::select()
            .distinct()
            .column((Alias::new("spots"), Alias::new("post_id")))
            .from(Alias::new("spots"))
            .inner_join(
                Alias::new("solutions"),
                sea_orm::sea_query::Expr::col((Alias::new("solutions"), Alias::new("spot_id")))
                    .equals((Alias::new("spots"), Alias::new("id"))),
            )
            .and_where(
                sea_orm::sea_query::Expr::col((Alias::new("solutions"), Alias::new("status")))
                    .eq(crate::constants::solution_status::ACTIVE),
            )
            .to_owned();

        if has_solutions {
            select = select.filter(Column::Id.in_subquery(subquery));
        } else {
            // spot은 있으나 solution이 없는 post
            let spot_subquery = SeaQuery::select()
                .distinct()
                .column((Alias::new("spots"), Alias::new("post_id")))
                .from(Alias::new("spots"))
                .to_owned();
            select = select
                .filter(Column::Id.in_subquery(spot_subquery))
                .filter(Column::Id.not_in_subquery(subquery));
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

    // 페이지네이션 설정
    let pagination = Pagination::new(query.page, query.per_page);

    // COUNT + SELECT 병렬 실행 (동시 2 커넥션)
    let (total_result, posts_result) = tokio::join!(
        select.clone().count(db),
        select
            .offset(pagination.offset())
            .limit(pagination.limit())
            .all(db),
    );
    let total = total_result.map_err(AppError::DatabaseError)?;
    let posts = posts_result.map_err(AppError::DatabaseError)?;

    // 배치 로딩: 부가 데이터 병렬 조회
    use crate::entities::comments::{Column as CommentColumn, Entity as Comments};
    use crate::entities::post_magazines::{Column as MagazineColumn, Entity as PostMagazines};
    use crate::entities::spots::{Column as SpotColumn, Entity as Spots};
    use crate::entities::users::{Column as UserColumn, Entity as Users};

    let post_ids: Vec<Uuid> = posts.iter().map(|p| p.id).collect();
    let user_ids: Vec<Uuid> = posts.iter().map(|p| p.user_id).collect();
    let magazine_ids: Vec<Uuid> = posts.iter().filter_map(|p| p.post_magazine_id).collect();

    // 그룹 A: users + spot counts + comment counts (동시 3 커넥션)
    let (users_result, spot_counts_result, comment_counts_result) = tokio::join!(
        Users::find().filter(UserColumn::Id.is_in(user_ids)).all(db),
        Spots::find()
            .select_only()
            .column(SpotColumn::PostId)
            .filter(SpotColumn::PostId.is_in(post_ids.clone()))
            .group_by(SpotColumn::PostId)
            .column_as(SpotColumn::Id.count(), "count")
            .into_tuple::<(Uuid, i64)>()
            .all(db),
        Comments::find()
            .select_only()
            .column(CommentColumn::PostId)
            .filter(CommentColumn::PostId.is_in(post_ids))
            .group_by(CommentColumn::PostId)
            .column_as(CommentColumn::Id.count(), "count")
            .into_tuple::<(Uuid, i64)>()
            .all(db),
    );

    let users_map: std::collections::HashMap<Uuid, crate::entities::users::Model> = users_result
        .map_err(AppError::DatabaseError)?
        .into_iter()
        .map(|u| (u.id, u))
        .collect();
    let spot_count_map: std::collections::HashMap<Uuid, i64> = spot_counts_result
        .map_err(AppError::DatabaseError)?
        .into_iter()
        .collect();
    let comment_count_map: std::collections::HashMap<Uuid, i64> = comment_counts_result
        .map_err(AppError::DatabaseError)?
        .into_iter()
        .collect();

    // magazines + warehouse 순차 (커넥션 1개씩)
    let include_preview = query.include_magazine_items == Some(true);
    let (magazine_titles_map, magazine_preview_map) = if magazine_ids.is_empty() {
        (
            std::collections::HashMap::new(),
            std::collections::HashMap::new(),
        )
    } else {
        let rows = PostMagazines::find()
            .filter(MagazineColumn::Id.is_in(magazine_ids))
            .filter(MagazineColumn::Status.eq("published"))
            .all(db)
            .await
            .map_err(AppError::DatabaseError)?;
        let mut titles = std::collections::HashMap::with_capacity(rows.len());
        let mut previews: std::collections::HashMap<Uuid, Vec<PostMagazinePreviewItem>> =
            std::collections::HashMap::new();
        for m in rows {
            titles.insert(m.id, m.title.clone());
            if include_preview {
                if let Some(layout) = m.layout_json.as_ref() {
                    let items = parse_magazine_preview_items(layout, 4);
                    if !items.is_empty() {
                        previews.insert(m.id, items);
                    }
                }
            }
        }
        (titles, previews)
    };
    let (artist_display_map, group_display_map) = load_warehouse_display_maps(db, &posts).await?;

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
            let post_magazine_items = post
                .post_magazine_id
                .and_then(|id| magazine_preview_map.get(&id).cloned());

            let ((artist_name, artist_profile_image_url), (group_name, group_profile_image_url)) =
                resolve_display_from_maps(&post, &artist_display_map, &group_display_map);

            PostListItem {
                id: post.id,
                user,
                image_url: post.image_url,
                media_source,
                title: post.title.clone(),
                artist_name,
                group_name,
                artist_id: post.artist_id,
                group_id: post.group_id,
                context: post.context,
                spot_count,
                view_count: post.view_count,
                comment_count,
                status: post.status.clone(),
                created_at: post.created_at.with_timezone(&chrono::Utc),
                post_magazine_title,
                post_magazine_items,
                created_with_solutions: post.created_with_solutions,
                image_width: post.image_width,
                image_height: post.image_height,
                artist_profile_image_url,
                group_profile_image_url,
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
    let post = get_post_by_id(state.db.as_ref(), post_id).await?;
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
        .update(state.db.as_ref())
        .await
        .map_err(AppError::DatabaseError)?;

    let updated_response: PostResponse = updated_post.into();

    // Meilisearch 업데이트 (비동기, 실패해도 Post 업데이트는 성공)
    let search_fields = match load_post_related_data(state.db.as_ref(), post_id).await {
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

    // 통합 검색어 q 적용 — artist_name/group_name/context 부분매칭 OR (admin 자동완성 용도)
    if let Some(ref q) = query.q {
        let trimmed = q.trim();
        if !trimmed.is_empty() {
            let pattern = format!("%{trimmed}%");
            let cond = sea_orm::Condition::any()
                .add(Column::ArtistName.like(&pattern))
                .add(Column::GroupName.like(&pattern))
                .add(Column::Context.like(&pattern));
            select = select.filter(cond);
        }
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
            .filter(MagazineColumn::Status.eq("published"))
            .all(db)
            .await
            .map_err(AppError::DatabaseError)?
            .into_iter()
            .map(|m| (m.id, m.title))
            .collect()
    };

    // 5. Warehouse 배치 조회 (artist/group의 name_en, name_ko, profile_image_url)
    let (artist_display_map, group_display_map) = load_warehouse_display_maps(db, &posts).await?;

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

            let ((artist_name, artist_profile_image_url), (group_name, group_profile_image_url)) =
                resolve_display_from_maps(&post, &artist_display_map, &group_display_map);

            PostListItem {
                id: post.id,
                user,
                image_url: post.image_url,
                media_source,
                title: post.title.clone(),
                artist_name,
                group_name,
                artist_id: post.artist_id,
                group_id: post.group_id,
                context: post.context,
                spot_count,
                view_count: post.view_count,
                comment_count,
                status: post.status.clone(),
                created_at: post.created_at.with_timezone(&chrono::Utc),
                post_magazine_title,
                post_magazine_items: None,
                created_with_solutions: post.created_with_solutions,
                image_width: post.image_width,
                image_height: post.image_height,
                artist_profile_image_url,
                group_profile_image_url,
            }
        })
        .collect();

    Ok(PaginatedResponse::new(items, pagination, total))
}

/// Admin용 Post 상태 변경 — UPDATE + audit log 원자 기록.
#[allow(clippy::disallowed_methods)] // serde_json::json! 매크로 전개
pub async fn admin_update_post_status(
    search_client: &std::sync::Arc<dyn crate::services::search::SearchClient>,
    db: &DatabaseConnection,
    post_id: Uuid,
    status: &str,
    admin_id: Uuid,
) -> AppResult<PostResponse> {
    let txn = db.begin().await.map_err(AppError::DatabaseError)?;

    let post = Posts::find_by_id(post_id)
        .one(&txn)
        .await
        .map_err(AppError::DatabaseError)?
        .ok_or_else(|| AppError::NotFound(format!("Post not found: {}", post_id)))?;
    let before_state = serde_json::to_value(&post).ok();

    let mut active_post: ActiveModel = post.into();
    active_post.status = Set(status.to_string());

    let updated_post = active_post
        .update(&txn)
        .await
        .map_err(AppError::DatabaseError)?;
    let after_state = serde_json::to_value(&updated_post).ok();

    crate::services::audit::write_audit_log(
        &txn,
        crate::services::audit::AuditLogEntry {
            admin_user_id: admin_id,
            action: "post.status.update".to_string(),
            target_table: "posts".to_string(),
            target_id: Some(post_id),
            before_state,
            after_state,
            metadata: None,
        },
    )
    .await
    .map_err(AppError::DatabaseError)?;

    txn.commit().await.map_err(AppError::DatabaseError)?;

    // Meilisearch 동기화 — 커밋 이후 (트랜잭션 외부, 실패해도 상태 변경은 성공)
    match status {
        "hidden" | "deleted" => {
            if let Err(e) = search_client.delete("posts", &post_id.to_string()).await {
                tracing::warn!("Failed to delete post {} from Meilisearch: {}", post_id, e);
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
                tracing::warn!("Failed to update post {} in Meilisearch: {}", post_id, e);
            }
        }
        _ => {}
    }

    Ok(updated_post.into())
}

/// Admin용 Post 메타데이터 수정 (소유권 검사 없음) — UPDATE + audit log 원자 기록.
pub async fn admin_update_post(
    state: &AppState,
    post_id: Uuid,
    dto: UpdatePostDto,
    admin_id: Uuid,
) -> AppResult<PostResponse> {
    let txn = state.db.begin().await.map_err(AppError::DatabaseError)?;

    let post = Posts::find_by_id(post_id)
        .one(&txn)
        .await
        .map_err(AppError::DatabaseError)?
        .ok_or_else(|| AppError::NotFound(format!("Post not found: {}", post_id)))?;
    let before_state = serde_json::to_value(&post).ok();

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
        .update(&txn)
        .await
        .map_err(AppError::DatabaseError)?;
    let after_state = serde_json::to_value(&updated_post).ok();

    crate::services::audit::write_audit_log(
        &txn,
        crate::services::audit::AuditLogEntry {
            admin_user_id: admin_id,
            action: "post.metadata.update".to_string(),
            target_table: "posts".to_string(),
            target_id: Some(post_id),
            before_state,
            after_state,
            metadata: None,
        },
    )
    .await
    .map_err(AppError::DatabaseError)?;

    txn.commit().await.map_err(AppError::DatabaseError)?;

    let updated_response: PostResponse = updated_post.into();

    // Meilisearch 재인덱싱
    let search_fields = match load_post_related_data(state.db.as_ref(), post_id).await {
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
    // 이미지 dimension 추출 (업로드 전에 메모리에서 읽기)
    let (image_width, image_height) = extract_image_dimensions(&image_data);

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

    Ok(ImageUploadResponse {
        image_url,
        image_width,
        image_height,
    })
}

/// 이미지 바이트에서 width/height 추출 (실패 시 None 반환)
fn extract_image_dimensions(data: &[u8]) -> (Option<i32>, Option<i32>) {
    match image::load_from_memory(data) {
        Ok(img) => {
            let (w, h) = (img.width(), img.height());
            (Some(w as i32), Some(h as i32))
        }
        Err(e) => {
            tracing::warn!("Failed to extract image dimensions: {}", e);
            (None, None)
        }
    }
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
    let category_rules = state
        .category_cache
        .build_category_rules(state.db.as_ref())
        .await?;

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

// ============================================================
// Try Post Service Functions
// ============================================================

/// Try Post 생성 (이미지 업로드 포함, 경량 경로)
pub async fn create_try_post(
    state: &AppState,
    user_id: Uuid,
    image_data: Vec<u8>,
    content_type: &str,
    dto: CreateTryPostDto,
) -> AppResult<PostResponse> {
    // 1. parent_post_id 검증
    let parent = get_post_by_id(state.db.as_ref(), dto.parent_post_id).await?;
    if parent.post_type.as_deref() == Some(POST_TYPE_TRY) {
        return Err(AppError::BadRequest(
            "Cannot create a try on another try post".to_string(),
        ));
    }

    // 2. spot_ids 검증 (parent post 소속인지)
    if !dto.spot_ids.is_empty() {
        use crate::entities::spots::{Column as SpotColumn, Entity as Spots};
        let valid_spots = Spots::find()
            .filter(SpotColumn::PostId.eq(dto.parent_post_id))
            .filter(SpotColumn::Id.is_in(dto.spot_ids.clone()))
            .count(state.db.as_ref())
            .await
            .map_err(AppError::DatabaseError)?;
        if valid_spots != dto.spot_ids.len() as u64 {
            return Err(AppError::BadRequest(
                "Some spot_ids do not belong to the parent post".to_string(),
            ));
        }
    }

    // 3. 이미지 업로드
    let upload_response = upload_image(state, image_data, content_type, user_id).await?;
    let image_key = extract_key_from_url(&upload_response.image_url);

    // 4. Post + try_spot_tags 생성 (트랜잭션)
    let result = state
        .db
        .as_ref()
        .transaction::<_, PostResponse, AppError>(|txn| {
            let image_url = upload_response.image_url.clone();
            let img_width = upload_response.image_width;
            let img_height = upload_response.image_height;
            let spot_ids = dto.spot_ids.clone();
            let media_title = dto.media_title.clone();
            let parent_post_id = dto.parent_post_id;

            Box::pin(async move {
                let post = ActiveModel {
                    id: Set(Uuid::new_v4()),
                    user_id: Set(user_id),
                    image_url: Set(image_url),
                    media_type: Set(POST_TYPE_TRY.to_string()),
                    title: Set(media_title),
                    media_metadata: Set(None),
                    group_name: Set(None),
                    artist_name: Set(None),
                    context: Set(None),
                    view_count: Set(0),
                    status: Set(crate::constants::post_status::ACTIVE.to_string()),
                    created_with_solutions: Set(None),
                    image_width: Set(img_width),
                    image_height: Set(img_height),
                    parent_post_id: Set(Some(parent_post_id)),
                    post_type: Set(Some(POST_TYPE_TRY.to_string())),
                    ..Default::default()
                };

                let created_post = post.insert(txn).await.map_err(AppError::DatabaseError)?;

                // try_spot_tags 생성
                if !spot_ids.is_empty() {
                    use crate::entities::try_spot_tags::ActiveModel as TagActiveModel;

                    for spot_id in &spot_ids {
                        let tag = TagActiveModel {
                            id: Set(Uuid::new_v4()),
                            try_post_id: Set(created_post.id),
                            spot_id: Set(*spot_id),
                            ..Default::default()
                        };
                        tag.insert(txn).await.map_err(AppError::DatabaseError)?;
                    }
                }

                Ok(created_post.into())
            })
        })
        .await
        .map_err(|e| match e {
            sea_orm::TransactionError::Transaction(err) => err,
            sea_orm::TransactionError::Connection(err) => AppError::DatabaseError(err),
        })
        .inspect_err(|_| {
            // 실패 시 업로드된 이미지 삭제
            let image_key_clone = image_key.clone();
            let storage_client = state.storage_client.clone();
            tokio::spawn(async move {
                if let Err(e) = storage_client.delete(&image_key_clone).await {
                    tracing::warn!(
                        "Failed to delete orphaned try image {}: {}",
                        image_key_clone,
                        e
                    );
                }
            });
        })?;

    // Meilisearch 인덱싱 생략 (Try는 검색에 포함하지 않음)

    Ok(result)
}

/// Try 목록 조회 (원본 포스트의 Try 포스트들)
pub async fn list_tries(
    db: &DatabaseConnection,
    parent_post_id: Uuid,
    query: TryListQuery,
) -> AppResult<TryListResponse> {
    use crate::entities::users::{Column as UserColumn, Entity as Users};

    let paginator = Posts::find()
        .filter(Column::ParentPostId.eq(parent_post_id))
        .filter(Column::PostType.eq(POST_TYPE_TRY))
        .filter(Column::Status.eq(crate::constants::post_status::ACTIVE))
        .order_by_desc(Column::CreatedAt);

    let total = paginator
        .clone()
        .count(db)
        .await
        .map_err(AppError::DatabaseError)? as i64;

    let offset = (query.page.saturating_sub(1)) * query.per_page;
    let posts = paginator
        .offset(offset)
        .limit(query.per_page)
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;

    // 유저 정보 배치 로드
    let user_ids: Vec<Uuid> = posts.iter().map(|p| p.user_id).collect();
    let users: Vec<crate::entities::users::Model> = if user_ids.is_empty() {
        vec![]
    } else {
        Users::find()
            .filter(UserColumn::Id.is_in(user_ids))
            .all(db)
            .await
            .map_err(AppError::DatabaseError)?
    };

    // try_spot_tags 배치 로드
    let post_ids: Vec<Uuid> = posts.iter().map(|p| p.id).collect();
    let tags = if post_ids.is_empty() {
        vec![]
    } else {
        use crate::entities::try_spot_tags::{Column as TagColumn, Entity as TrySpotTags};
        TrySpotTags::find()
            .filter(TagColumn::TryPostId.is_in(post_ids))
            .all(db)
            .await
            .map_err(AppError::DatabaseError)?
    };

    let tries = posts
        .into_iter()
        .map(|post| {
            let user = users.iter().find(|u| u.id == post.user_id);
            let tagged_spot_ids: Vec<Uuid> = tags
                .iter()
                .filter(|t| t.try_post_id == post.id)
                .map(|t| t.spot_id)
                .collect();

            TryPostListItem {
                id: post.id,
                user: user.map_or_else(
                    || PostUserInfo {
                        id: post.user_id,
                        username: "unknown".to_string(),
                        avatar_url: None,
                        rank: "bronze".to_string(),
                    },
                    |u| PostUserInfo {
                        id: u.id,
                        username: u.username.clone(),
                        avatar_url: u.avatar_url.clone(),
                        rank: u.rank.clone(),
                    },
                ),
                image_url: post.image_url,
                media_title: post.title,
                tagged_spot_ids,
                created_at: post.created_at.with_timezone(&chrono::Utc),
            }
        })
        .collect();

    Ok(TryListResponse { tries, total })
}

/// Try 개수 조회
pub async fn count_tries(
    db: &DatabaseConnection,
    parent_post_id: Uuid,
) -> AppResult<TryCountResponse> {
    let count = Posts::find()
        .filter(Column::ParentPostId.eq(parent_post_id))
        .filter(Column::PostType.eq(POST_TYPE_TRY))
        .filter(Column::Status.eq(crate::constants::post_status::ACTIVE))
        .count(db)
        .await
        .map_err(AppError::DatabaseError)? as i64;

    Ok(TryCountResponse { count })
}

/// 특정 스팟을 태깅한 Try 목록 조회
pub async fn list_tries_by_spot(
    db: &DatabaseConnection,
    spot_id: Uuid,
    query: TryListQuery,
) -> AppResult<TryListResponse> {
    use crate::entities::try_spot_tags::{Column as TagColumn, Entity as TrySpotTags};
    use crate::entities::users::{Column as UserColumn, Entity as Users};

    // 1. 해당 spot을 태깅한 try_post_id 목록
    let tag_post_ids: Vec<Uuid> = TrySpotTags::find()
        .filter(TagColumn::SpotId.eq(spot_id))
        .select_only()
        .column(TagColumn::TryPostId)
        .into_tuple::<Uuid>()
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;

    if tag_post_ids.is_empty() {
        return Ok(TryListResponse {
            tries: vec![],
            total: 0,
        });
    }

    // 2. 해당 포스트 조회
    let paginator = Posts::find()
        .filter(Column::Id.is_in(tag_post_ids.clone()))
        .filter(Column::Status.eq(crate::constants::post_status::ACTIVE))
        .order_by_desc(Column::CreatedAt);

    let total = paginator
        .clone()
        .count(db)
        .await
        .map_err(AppError::DatabaseError)? as i64;

    let offset = (query.page.saturating_sub(1)) * query.per_page;
    let posts = paginator
        .offset(offset)
        .limit(query.per_page)
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;

    // 유저 정보 배치 로드
    let user_ids: Vec<Uuid> = posts.iter().map(|p| p.user_id).collect();
    let users: Vec<crate::entities::users::Model> = if user_ids.is_empty() {
        vec![]
    } else {
        Users::find()
            .filter(UserColumn::Id.is_in(user_ids))
            .all(db)
            .await
            .map_err(AppError::DatabaseError)?
    };

    // 모든 tags 로드
    let post_ids: Vec<Uuid> = posts.iter().map(|p| p.id).collect();
    let all_tags = if post_ids.is_empty() {
        vec![]
    } else {
        TrySpotTags::find()
            .filter(TagColumn::TryPostId.is_in(post_ids))
            .all(db)
            .await
            .map_err(AppError::DatabaseError)?
    };

    let tries = posts
        .into_iter()
        .map(|post| {
            let user = users.iter().find(|u| u.id == post.user_id);
            let tagged_spot_ids: Vec<Uuid> = all_tags
                .iter()
                .filter(|t| t.try_post_id == post.id)
                .map(|t| t.spot_id)
                .collect();

            TryPostListItem {
                id: post.id,
                user: user.map_or_else(
                    || PostUserInfo {
                        id: post.user_id,
                        username: "unknown".to_string(),
                        avatar_url: None,
                        rank: "bronze".to_string(),
                    },
                    |u| PostUserInfo {
                        id: u.id,
                        username: u.username.clone(),
                        avatar_url: u.avatar_url.clone(),
                        rank: u.rank.clone(),
                    },
                ),
                image_url: post.image_url,
                media_title: post.title,
                tagged_spot_ids,
                created_at: post.created_at.with_timezone(&chrono::Utc),
            }
        })
        .collect();

    Ok(TryListResponse { tries, total })
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
            brand_id: None,
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
        let empty_brands = std::collections::HashMap::new();
        assert!(select_top_solution(&[], &empty_brands).is_none());
    }

    #[test]
    fn select_top_solution_prefers_adopted() {
        let empty_brands = std::collections::HashMap::new();
        let sid = Uuid::new_v4();
        let a = mk_solution(sid, true, false, 0, 0);
        let b = mk_solution(sid, false, true, 100, 0);
        let top = select_top_solution(&[b, a], &empty_brands).expect("some");
        assert!(top.is_adopted);
    }

    #[test]
    fn select_top_solution_tie_breaks_by_vote_score() {
        let empty_brands = std::collections::HashMap::new();
        let sid = Uuid::new_v4();
        let lower = mk_solution(sid, false, false, 1, 0);
        let higher = mk_solution(sid, false, false, 10, 0);
        let higher_id = higher.id;
        let top = select_top_solution(&[lower, higher], &empty_brands).expect("some");
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
            artist_id: None,
            group_id: None,
            context: None,
            view_count: 0,
            status: "active".into(),
            trending_score: None,
            created_with_solutions: None,
            post_magazine_id: None,
            ai_summary: None,
            style_tags: None,
            image_width: None,
            image_height: None,
            parent_post_id: None,
            post_type: None,
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
            brand_logos: std::collections::HashMap::new(),
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
            image_width: None,
            image_height: None,
            parent_post_id: None,
            post_type: None,
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
            brand_logos: std::collections::HashMap::new(),
        };
        let fields = compute_search_fields(&data);
        assert!(fields.category_codes.is_empty());
        assert!(!fields.has_adopted_solution);
        assert_eq!(fields.solution_count, 0);
        assert_eq!(fields.spot_count, 0);
    }

    // ── MockDatabase 기반 서비스 테스트 ──

    #[tokio::test]
    async fn get_post_by_id_returns_post() {
        use crate::tests::fixtures;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::post_model()]])
            .into_connection();
        let result = get_post_by_id(&db, fixtures::test_uuid(1)).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().id, fixtures::test_uuid(1));
    }

    #[tokio::test]
    async fn get_post_by_id_not_found() {
        use crate::tests::fixtures;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<posts::Model>::new()])
            .into_connection();
        let result = get_post_by_id(&db, fixtures::test_uuid(1)).await;
        assert!(result.is_err());
        match result {
            Err(crate::AppError::NotFound(msg)) => {
                assert!(msg.contains("Post not found"));
            }
            other => panic!("Expected NotFound, got {:?}", other),
        }
    }

    #[tokio::test]
    async fn increment_view_count_succeeds() {
        use crate::tests::fixtures;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let mut updated_post = fixtures::post_model();
        updated_post.view_count = 43;

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::post_model()]]) // get_post_by_id
            .append_query_results([[updated_post]]) // update returns model
            .into_connection();
        let result = increment_view_count(&db, fixtures::test_uuid(1)).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn increment_view_count_post_not_found() {
        use crate::tests::fixtures;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<posts::Model>::new()])
            .into_connection();
        let result = increment_view_count(&db, fixtures::test_uuid(99)).await;
        assert!(matches!(result, Err(crate::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn load_post_related_data_empty_spots() {
        use crate::tests::fixtures;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::spots::Model>::new()])
            .into_connection();
        let result = load_post_related_data(&db, fixtures::test_uuid(1)).await;
        assert!(result.is_ok());
        let data = result.unwrap();
        assert!(data.spots.is_empty());
        assert!(data.solutions.is_empty());
    }

    #[tokio::test]
    async fn load_post_related_data_with_spot() {
        use crate::tests::fixtures;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::spot_model()]]) // spots query
            .append_query_results([Vec::<solutions::Model>::new()]) // solutions query
            .append_query_results([[fixtures::subcategory_model()]]) // subcategories query
            .append_query_results([[fixtures::category_model()]]) // categories query
            .into_connection();
        let result = load_post_related_data(&db, fixtures::test_uuid(1)).await;
        assert!(result.is_ok());
        let data = result.unwrap();
        assert_eq!(data.spots.len(), 1);
        assert_eq!(data.categories.len(), 1);
    }

    // ── delete_post tests ──

    #[tokio::test]
    async fn delete_post_success_owner() {
        use crate::tests::fixtures;
        use sea_orm::{DatabaseBackend, MockDatabase, MockExecResult};

        let post = fixtures::post_model(); // user_id = test_uuid(10)
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[post.clone()]]) // get_post_by_id
            .append_exec_results([MockExecResult {
                last_insert_id: 0,
                rows_affected: 1,
            }]) // delete
            .into_connection();

        let client: Arc<dyn crate::services::SearchClient> = Arc::new(DummySearchClient);
        let result = delete_post(
            &client,
            &db,
            fixtures::test_uuid(1),
            fixtures::test_uuid(10),
        )
        .await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn delete_post_forbidden_non_owner() {
        use crate::tests::fixtures;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let post = fixtures::post_model(); // user_id = test_uuid(10)
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[post]]) // get_post_by_id
            .into_connection();

        let client: Arc<dyn crate::services::SearchClient> = Arc::new(DummySearchClient);
        let result = delete_post(
            &client,
            &db,
            fixtures::test_uuid(1),
            fixtures::test_uuid(99),
        )
        .await;
        assert!(matches!(result, Err(crate::AppError::Forbidden(_))));
    }

    #[tokio::test]
    async fn delete_post_not_found() {
        use crate::tests::fixtures;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<posts::Model>::new()])
            .into_connection();

        let client: Arc<dyn crate::services::SearchClient> = Arc::new(DummySearchClient);
        let result = delete_post(
            &client,
            &db,
            fixtures::test_uuid(1),
            fixtures::test_uuid(10),
        )
        .await;
        assert!(matches!(result, Err(crate::AppError::NotFound(_))));
    }

    // ── select_top_solution additional tests ──

    #[test]
    fn select_top_solution_verified_beats_unverified_when_neither_adopted() {
        let empty_brands = std::collections::HashMap::new();
        let sid = Uuid::new_v4();
        let unverified = mk_solution(sid, false, false, 10, 0);
        let verified = mk_solution(sid, false, true, 0, 0);
        let verified_id = verified.id;
        let top = select_top_solution(&[unverified, verified], &empty_brands).expect("some");
        assert_eq!(top.id, verified_id);
    }

    #[test]
    fn select_top_solution_single_solution() {
        let empty_brands = std::collections::HashMap::new();
        let sid = Uuid::new_v4();
        let only = mk_solution(sid, false, false, 3, 1);
        let only_id = only.id;
        let top = select_top_solution(&[only], &empty_brands).expect("some");
        assert_eq!(top.id, only_id);
    }

    #[test]
    fn select_top_solution_adopted_beats_verified() {
        let empty_brands = std::collections::HashMap::new();
        let sid = Uuid::new_v4();
        let adopted = mk_solution(sid, true, false, 0, 0);
        let verified = mk_solution(sid, false, true, 100, 0);
        let top = select_top_solution(&[verified, adopted], &empty_brands).expect("some");
        assert!(top.is_adopted);
    }

    #[test]
    fn select_top_solution_includes_brand_logo_url_when_mapped() {
        let sid = Uuid::new_v4();
        let brand_id = Uuid::new_v4();
        let mut sol = mk_solution(sid, false, false, 5, 0);
        sol.brand_id = Some(brand_id);
        let mut brands = std::collections::HashMap::new();
        brands.insert(brand_id, "https://logo.example.com/brand.png".to_string());
        let top = select_top_solution(&[sol], &brands).expect("some");
        assert_eq!(
            top.brand_logo_url.as_deref(),
            Some("https://logo.example.com/brand.png")
        );
    }

    #[test]
    fn select_top_solution_brand_logo_none_when_not_mapped() {
        let sid = Uuid::new_v4();
        let mut sol = mk_solution(sid, false, false, 5, 0);
        sol.brand_id = Some(Uuid::new_v4());
        let empty_brands = std::collections::HashMap::new();
        let top = select_top_solution(&[sol], &empty_brands).expect("some");
        assert!(top.brand_logo_url.is_none());
    }

    #[test]
    fn select_top_solution_brand_logo_none_when_no_brand_id() {
        let sid = Uuid::new_v4();
        let sol = mk_solution(sid, false, false, 5, 0);
        let mut brands = std::collections::HashMap::new();
        brands.insert(Uuid::new_v4(), "https://logo.example.com/x.png".to_string());
        let top = select_top_solution(&[sol], &brands).expect("some");
        assert!(top.brand_logo_url.is_none());
    }

    #[tokio::test]
    async fn load_entity_display_data_both_none_ids() {
        let db = sea_orm::MockDatabase::new(sea_orm::DatabaseBackend::Postgres).into_connection();
        let ((a_en, a_ko, a_img), (g_en, g_ko, g_img)) =
            load_entity_display_data(&db, None, None).await;
        assert!(a_en.is_none() && a_ko.is_none() && a_img.is_none());
        assert!(g_en.is_none() && g_ko.is_none() && g_img.is_none());
    }

    #[tokio::test]
    async fn load_entity_display_data_artist_found() {
        use crate::entities::artists;
        let t = ts();
        let db = sea_orm::MockDatabase::new(sea_orm::DatabaseBackend::Postgres)
            .append_query_results([[artists::Model {
                id: Uuid::nil(),
                name_ko: Some("카리나".into()),
                name_en: Some("Karina".into()),
                profile_image_url: Some("https://img.example.com/karina.jpg".into()),
                primary_instagram_account_id: None,
                metadata: None,
                created_at: t,
                updated_at: t,
            }]])
            .into_connection();
        let ((a_en, a_ko, a_img), (_, _, g_img)) =
            load_entity_display_data(&db, Some(Uuid::nil()), None).await;
        assert_eq!(a_en.as_deref(), Some("Karina"));
        assert_eq!(a_ko.as_deref(), Some("카리나"));
        assert_eq!(a_img.as_deref(), Some("https://img.example.com/karina.jpg"));
        assert!(g_img.is_none());
    }

    #[tokio::test]
    async fn load_entity_display_data_group_found() {
        use crate::entities::groups;
        let t = ts();
        let db = sea_orm::MockDatabase::new(sea_orm::DatabaseBackend::Postgres)
            .append_query_results([[groups::Model {
                id: Uuid::nil(),
                name_ko: Some("에스파".into()),
                name_en: Some("aespa".into()),
                profile_image_url: Some("https://img.example.com/aespa.jpg".into()),
                primary_instagram_account_id: None,
                metadata: None,
                created_at: t,
                updated_at: t,
            }]])
            .into_connection();
        let ((_, _, a_img), (g_en, g_ko, g_img)) =
            load_entity_display_data(&db, None, Some(Uuid::nil())).await;
        assert!(a_img.is_none());
        assert_eq!(g_en.as_deref(), Some("aespa"));
        assert_eq!(g_ko.as_deref(), Some("에스파"));
        assert_eq!(g_img.as_deref(), Some("https://img.example.com/aespa.jpg"));
    }

    #[tokio::test]
    async fn load_entity_display_data_artist_not_found() {
        let db = sea_orm::MockDatabase::new(sea_orm::DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::artists::Model>::new()])
            .into_connection();
        let ((a_en, a_ko, a_img), _) =
            load_entity_display_data(&db, Some(Uuid::new_v4()), None).await;
        assert!(a_en.is_none() && a_ko.is_none() && a_img.is_none());
    }

    // ── resolve_warehouse_ids_from_names ──

    #[tokio::test]
    async fn resolve_warehouse_ids_returns_none_for_none_inputs() {
        let db = sea_orm::MockDatabase::new(sea_orm::DatabaseBackend::Postgres).into_connection();
        let (artist, group) = resolve_warehouse_ids_from_names(&db, None, None).await;
        assert!(artist.is_none());
        assert!(group.is_none());
    }

    #[tokio::test]
    async fn resolve_warehouse_ids_skips_empty_strings() {
        let db = sea_orm::MockDatabase::new(sea_orm::DatabaseBackend::Postgres).into_connection();
        let (artist, group) = resolve_warehouse_ids_from_names(&db, Some("  "), Some("")).await;
        assert!(artist.is_none());
        assert!(group.is_none());
    }

    #[tokio::test]
    async fn resolve_warehouse_ids_case_insensitive_artist_match() {
        use crate::entities::artists;
        let t = ts();
        let artist_row = artists::Model {
            id: Uuid::nil(),
            name_ko: Some("제니".into()),
            name_en: Some("Jennie".into()),
            profile_image_url: None,
            primary_instagram_account_id: None,
            metadata: None,
            created_at: t,
            updated_at: t,
        };
        // Client sends lowercase "jennie" — should still match via LOWER().
        let db = sea_orm::MockDatabase::new(sea_orm::DatabaseBackend::Postgres)
            .append_query_results([[artist_row]])
            // group lookup is skipped when group_name is None
            .into_connection();
        let (artist, group) = resolve_warehouse_ids_from_names(&db, Some("jennie"), None).await;
        assert_eq!(artist, Some(Uuid::nil()));
        assert!(group.is_none());
    }

    #[tokio::test]
    async fn resolve_warehouse_ids_unmatched_name_returns_none() {
        // Empty warehouse result → fallback to None, no error.
        let db = sea_orm::MockDatabase::new(sea_orm::DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::artists::Model>::new()])
            .into_connection();
        let (artist, group) =
            resolve_warehouse_ids_from_names(&db, Some("unknown-artist"), None).await;
        assert!(artist.is_none());
        assert!(group.is_none());
    }

    // ── build_spots_response additional tests ──

    #[test]
    fn build_spots_response_with_solutions_and_categories() {
        use crate::tests::fixtures;

        let data = PostRelatedData {
            spots: vec![fixtures::spot_model()],
            solutions: vec![fixtures::solution_model()],
            subcategories: vec![fixtures::subcategory_model()],
            categories: vec![fixtures::category_model()],
            brand_logos: std::collections::HashMap::new(),
        };
        let result = build_spots_response(&data).unwrap();
        assert_eq!(result.len(), 1);
        assert!(result[0].category.is_some());
        assert_eq!(result[0].solution_count, 1);
        assert!(result[0].top_solution.is_some());
    }

    #[test]
    fn build_spots_response_subcategory_mismatch() {
        use crate::tests::fixtures;

        // Spot has subcategory_id = test_uuid(21), but we provide a different subcategory
        let mut mismatched_subcategory = fixtures::subcategory_model();
        mismatched_subcategory.id = fixtures::test_uuid(99); // won't match spot's subcategory_id

        let data = PostRelatedData {
            spots: vec![fixtures::spot_model()],
            solutions: vec![],
            subcategories: vec![mismatched_subcategory],
            categories: vec![fixtures::category_model()],
            brand_logos: std::collections::HashMap::new(),
        };
        let result = build_spots_response(&data).unwrap();
        assert_eq!(result.len(), 1);
        // Category should be None because subcategory didn't match
        assert!(result[0].category.is_none());
    }

    #[test]
    fn build_spots_response_spot_without_subcategory() {
        use crate::tests::fixtures;

        let mut spot = fixtures::spot_model();
        spot.subcategory_id = None;

        let data = PostRelatedData {
            spots: vec![spot],
            solutions: vec![],
            subcategories: vec![],
            categories: vec![],
            brand_logos: std::collections::HashMap::new(),
        };
        let result = build_spots_response(&data).unwrap();
        assert_eq!(result.len(), 1);
        assert!(result[0].category.is_none());
    }

    #[test]
    fn build_spots_response_multiple_spots_different_solutions() {
        use crate::tests::fixtures;

        let mut spot2 = fixtures::spot_model();
        spot2.id = fixtures::test_uuid(5);
        spot2.subcategory_id = None;

        let mut sol_for_spot2 = fixtures::solution_model();
        sol_for_spot2.id = fixtures::test_uuid(6);
        sol_for_spot2.spot_id = fixtures::test_uuid(5);

        let data = PostRelatedData {
            spots: vec![fixtures::spot_model(), spot2],
            solutions: vec![fixtures::solution_model(), sol_for_spot2],
            subcategories: vec![fixtures::subcategory_model()],
            categories: vec![fixtures::category_model()],
            brand_logos: std::collections::HashMap::new(),
        };
        let result = build_spots_response(&data).unwrap();
        assert_eq!(result.len(), 2);
        assert_eq!(result[0].solution_count, 1);
        assert_eq!(result[1].solution_count, 1);
    }

    #[test]
    fn build_spots_response_propagates_brand_logo_url() {
        use crate::tests::fixtures;

        let brand_id = Uuid::new_v4();
        let mut sol = fixtures::solution_model();
        sol.brand_id = Some(brand_id);

        let mut brand_logos = std::collections::HashMap::new();
        brand_logos.insert(brand_id, "https://logo.example.com/b.png".to_string());

        let data = PostRelatedData {
            spots: vec![fixtures::spot_model()],
            solutions: vec![sol],
            subcategories: vec![fixtures::subcategory_model()],
            categories: vec![fixtures::category_model()],
            brand_logos,
        };
        let result = build_spots_response(&data).unwrap();
        assert_eq!(result.len(), 1);
        let top = result[0].top_solution.as_ref().expect("top solution");
        assert_eq!(
            top.brand_logo_url.as_deref(),
            Some("https://logo.example.com/b.png")
        );
    }

    // ── admin_update_post_status tests ──

    #[tokio::test]
    async fn admin_update_post_status_success() {
        use crate::tests::fixtures;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let mut updated_post = fixtures::post_model();
        updated_post.status = "hidden".to_string();

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::post_model()]]) // find_by_id (txn)
            .append_query_results([[updated_post.clone()]]) // update returns model
            .append_query_results([[fixtures::audit_log_model()]]) // audit insert RETURNING
            .into_connection();

        let client: Arc<dyn crate::services::SearchClient> = Arc::new(DummySearchClient);
        let result = admin_update_post_status(
            &client,
            &db,
            fixtures::test_uuid(1),
            "hidden",
            fixtures::test_uuid(99),
        )
        .await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().status, "hidden");
    }

    #[tokio::test]
    async fn admin_update_post_status_not_found() {
        use crate::tests::fixtures;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<posts::Model>::new()])
            .into_connection();

        let client: Arc<dyn crate::services::SearchClient> = Arc::new(DummySearchClient);
        let result = admin_update_post_status(
            &client,
            &db,
            fixtures::test_uuid(1),
            "hidden",
            fixtures::test_uuid(99),
        )
        .await;
        assert!(matches!(result, Err(crate::AppError::NotFound(_))));
    }

    // ── compute_search_fields tests ──

    #[test]
    fn compute_search_fields_with_data() {
        use crate::tests::fixtures;

        let mut adopted_solution = fixtures::solution_model();
        adopted_solution.is_adopted = true;

        let data = PostRelatedData {
            spots: vec![fixtures::spot_model()],
            solutions: vec![adopted_solution],
            subcategories: vec![fixtures::subcategory_model()],
            categories: vec![fixtures::category_model()],
            brand_logos: std::collections::HashMap::new(),
        };
        let fields = compute_search_fields(&data);
        assert_eq!(fields.spot_count, 1);
        assert_eq!(fields.solution_count, 1);
        assert!(fields.has_adopted_solution);
        assert!(fields.category_codes.contains(&"fashion".to_string()));
    }

    #[test]
    fn compute_search_fields_no_adopted() {
        use crate::tests::fixtures;

        let data = PostRelatedData {
            spots: vec![fixtures::spot_model()],
            solutions: vec![fixtures::solution_model()], // is_adopted = false
            subcategories: vec![fixtures::subcategory_model()],
            categories: vec![fixtures::category_model()],
            brand_logos: std::collections::HashMap::new(),
        };
        let fields = compute_search_fields(&data);
        assert!(!fields.has_adopted_solution);
    }

    // ── build_media_source_from_post additional test ──

    // ── load_post_related_data tests ──

    #[tokio::test]
    async fn load_post_related_data_empty_spots_returns_early() {
        use crate::tests::fixtures;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::spots::Model>::new()])
            .into_connection();
        let data = load_post_related_data(&db, fixtures::test_uuid(1))
            .await
            .unwrap();
        assert!(data.spots.is_empty());
        assert!(data.solutions.is_empty());
        assert!(data.subcategories.is_empty());
        assert!(data.categories.is_empty());
        assert!(data.brand_logos.is_empty());
    }

    #[tokio::test]
    async fn load_post_related_data_with_spots_no_subcategories() {
        use crate::tests::fixtures;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let mut spot = fixtures::spot_model();
        spot.subcategory_id = None;

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[spot.clone()]]) // spots query
            .append_query_results([Vec::<crate::entities::solutions::Model>::new()]) // solutions query
            .into_connection();
        let data = load_post_related_data(&db, fixtures::test_uuid(1))
            .await
            .unwrap();
        assert_eq!(data.spots.len(), 1);
        assert!(data.solutions.is_empty());
        assert!(data.subcategories.is_empty());
        assert!(data.categories.is_empty());
        assert!(data.brand_logos.is_empty());
    }

    #[tokio::test]
    async fn load_post_related_data_with_spots_solutions_and_brands() {
        use crate::tests::fixtures;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let spot = fixtures::spot_model();
        let mut sol = fixtures::solution_model();
        let brand_id = Uuid::new_v4();
        sol.brand_id = Some(brand_id);

        let wb = crate::entities::brands::Model {
            id: brand_id,
            name_ko: Some("나이키".into()),
            name_en: Some("Nike".into()),
            logo_image_url: Some("https://logo.test/nike.png".into()),
            primary_instagram_account_id: None,
            metadata: None,
            created_at: ts(),
            updated_at: ts(),
        };

        let subcat = fixtures::subcategory_model();
        let cat = fixtures::category_model();

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[spot.clone()]])
            .append_query_results([[sol.clone()]])
            .append_query_results([[subcat.clone()]])
            .append_query_results([[cat.clone()]])
            .append_query_results([[wb]])
            .into_connection();
        let data = load_post_related_data(&db, fixtures::test_uuid(1))
            .await
            .unwrap();
        assert_eq!(data.spots.len(), 1);
        assert_eq!(data.solutions.len(), 1);
        assert_eq!(data.subcategories.len(), 1);
        assert_eq!(data.categories.len(), 1);
        assert_eq!(
            data.brand_logos.get(&brand_id).map(String::as_str),
            Some("https://logo.test/nike.png")
        );
    }

    // ── get_post_detail tests ──

    #[tokio::test]
    async fn get_post_detail_not_found() {
        use crate::tests::fixtures;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<posts::Model>::new()]) // get_post_by_id → empty
            .into_connection();
        let result = get_post_detail(&db, fixtures::test_uuid(1), None).await;
        assert!(matches!(result, Err(crate::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn get_post_detail_not_found_with_user_id() {
        use crate::tests::fixtures;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<posts::Model>::new()])
            .into_connection();
        let result =
            get_post_detail(&db, fixtures::test_uuid(1), Some(fixtures::test_uuid(10))).await;
        assert!(matches!(result, Err(crate::AppError::NotFound(_))));
    }

    // ── admin_update_post tests ──

    #[tokio::test]
    async fn admin_update_post_not_found() {
        use crate::tests::fixtures;
        use crate::tests::helpers::test_app_state;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<posts::Model>::new()])
            .into_connection();
        let state = test_app_state(db);
        let dto = UpdatePostDto {
            media_source: None,
            group_name: None,
            artist_name: None,
            context: None,
            status: None,
        };
        let result =
            admin_update_post(&state, fixtures::test_uuid(1), dto, fixtures::test_uuid(99)).await;
        assert!(matches!(result, Err(crate::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn admin_update_post_success() {
        use crate::tests::fixtures;
        use crate::tests::helpers::test_app_state;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let mut updated = fixtures::post_model();
        updated.artist_name = Some("New Artist".to_string());

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::post_model()]]) // find_by_id (txn)
            .append_query_results([[updated.clone()]]) // update returns model
            .append_query_results([[fixtures::audit_log_model()]]) // audit insert RETURNING
            .append_query_results([Vec::<crate::entities::spots::Model>::new()]) // load_post_related_data (post-commit)
            .into_connection();
        let state = test_app_state(db);
        let dto = UpdatePostDto {
            media_source: None,
            group_name: None,
            artist_name: Some("New Artist".to_string()),
            context: None,
            status: None,
        };
        let result =
            admin_update_post(&state, fixtures::test_uuid(1), dto, fixtures::test_uuid(99)).await;
        assert!(result.is_ok());
    }

    // ── count_tries tests ──

    #[tokio::test]
    async fn count_tries_returns_zero_when_no_tries() {
        use crate::tests::fixtures;
        use sea_orm::{DatabaseBackend, MockDatabase};

        // count() in SeaORM mock needs a query result that returns u64-compatible
        // MockDatabase treats .count() as returning a vec of models then counting,
        // so we provide empty results
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<posts::Model>::new()])
            .into_connection();
        let result = count_tries(&db, fixtures::test_uuid(1)).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().count, 0);
    }

    // ── list_tries_by_spot tests ──

    #[tokio::test]
    async fn list_tries_by_spot_empty() {
        use crate::tests::fixtures;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::try_spot_tags::Model>::new()]) // tag query
            .into_connection();
        let query = TryListQuery {
            page: 1,
            per_page: 20,
        };
        let result = list_tries_by_spot(&db, fixtures::test_uuid(1), query).await;
        assert!(result.is_ok());
        let resp = result.unwrap();
        assert!(resp.tries.is_empty());
        assert_eq!(resp.total, 0);
    }

    // ── delete_post additional tests ──

    #[tokio::test]
    async fn delete_post_db_error_propagates() {
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_errors(vec![sea_orm::DbErr::Custom("db down".into())])
            .into_connection();

        let client: Arc<dyn crate::services::SearchClient> = Arc::new(DummySearchClient);
        let result = delete_post(&client, &db, Uuid::new_v4(), Uuid::new_v4()).await;
        assert!(result.is_err());
    }

    // ── increment_view_count additional tests ──

    #[tokio::test]
    async fn increment_view_count_db_error() {
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_errors(vec![sea_orm::DbErr::Custom("connection lost".into())])
            .into_connection();
        let result = increment_view_count(&db, Uuid::new_v4()).await;
        assert!(result.is_err());
    }

    // ── get_post_by_id db error ──

    #[tokio::test]
    async fn get_post_by_id_db_error() {
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_errors(vec![sea_orm::DbErr::Custom("timeout".into())])
            .into_connection();
        let result = get_post_by_id(&db, Uuid::new_v4()).await;
        assert!(result.is_err());
    }

    #[test]
    fn build_media_source_from_post_drama_type() {
        let t = ts();
        let post = posts::Model {
            id: Uuid::nil(),
            user_id: Uuid::nil(),
            image_url: "https://i".into(),
            media_type: "drama".into(),
            title: Some("My Drama".into()),
            media_metadata: Some(json!({"title": "Drama Title"})),
            group_name: None,
            artist_name: None,
            artist_id: None,
            group_id: None,
            context: None,
            view_count: 0,
            status: "active".into(),
            trending_score: None,
            created_with_solutions: None,
            post_magazine_id: None,
            ai_summary: None,
            style_tags: None,
            image_width: None,
            image_height: None,
            parent_post_id: None,
            post_type: None,
            created_at: t,
            updated_at: t,
        };
        let ms = build_media_source_from_post(&post);
        assert_eq!(ms.media_type(), "drama");
    }

    // ── update_post tests ──

    #[tokio::test]
    async fn update_post_success_owner() {
        use crate::tests::{fixtures, helpers::test_app_state};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let mut updated = fixtures::post_model();
        updated.artist_name = Some("New Artist".to_string());

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::post_model()]]) // get_post_by_id
            .append_query_results([[updated.clone()]]) // update
            .append_query_results([Vec::<crate::entities::spots::Model>::new()]) // load_post_related_data spots
            .into_connection();
        let state = test_app_state(db);
        let dto = UpdatePostDto {
            media_source: None,
            group_name: None,
            artist_name: Some("New Artist".to_string()),
            context: None,
            status: None,
        };
        let result =
            update_post(&state, fixtures::test_uuid(1), fixtures::test_uuid(10), dto).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn update_post_forbidden_non_owner() {
        use crate::tests::{fixtures, helpers::test_app_state};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::post_model()]]) // get_post_by_id
            .into_connection();
        let state = test_app_state(db);
        let dto = UpdatePostDto {
            media_source: None,
            group_name: None,
            artist_name: None,
            context: None,
            status: None,
        };
        // user_id 99 != post owner (10)
        let result =
            update_post(&state, fixtures::test_uuid(1), fixtures::test_uuid(99), dto).await;
        assert!(matches!(result, Err(crate::AppError::Forbidden(_))));
    }

    #[tokio::test]
    async fn update_post_not_found() {
        use crate::tests::{fixtures, helpers::test_app_state};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<posts::Model>::new()])
            .into_connection();
        let state = test_app_state(db);
        let dto = UpdatePostDto {
            media_source: None,
            group_name: None,
            artist_name: None,
            context: None,
            status: None,
        };
        let result =
            update_post(&state, fixtures::test_uuid(1), fixtures::test_uuid(10), dto).await;
        assert!(matches!(result, Err(crate::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn update_post_all_fields() {
        use crate::tests::{fixtures, helpers::test_app_state};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let updated = fixtures::post_model();
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::post_model()]]) // get_post_by_id
            .append_query_results([[updated]]) // update
            .append_query_results([Vec::<crate::entities::spots::Model>::new()]) // spots (empty)
            .into_connection();
        let state = test_app_state(db);
        let dto = UpdatePostDto {
            media_source: Some(MediaSourceDto {
                media_type: "movie".to_string(),
                description: None,
            }),
            group_name: Some("Group".to_string()),
            artist_name: Some("Artist".to_string()),
            context: Some("Ctx".to_string()),
            status: Some("active".to_string()),
        };
        let result =
            update_post(&state, fixtures::test_uuid(1), fixtures::test_uuid(10), dto).await;
        assert!(result.is_ok());
    }

    // ── list_tries tests ──

    #[tokio::test]
    async fn list_tries_empty_result() {
        use crate::tests::fixtures;
        use sea_orm::{DatabaseBackend, MockDatabase};

        // count → 0, all → empty; users/tags batches skipped when empty
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<posts::Model>::new()]) // count
            .append_query_results([Vec::<posts::Model>::new()]) // all
            .into_connection();
        let query = TryListQuery {
            page: 1,
            per_page: 20,
        };
        let result = list_tries(&db, fixtures::test_uuid(1), query).await;
        assert!(result.is_ok());
        let resp = result.unwrap();
        assert!(resp.tries.is_empty());
        assert_eq!(resp.total, 0);
    }

    #[tokio::test]
    async fn list_tries_db_error() {
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_errors(vec![sea_orm::DbErr::Custom("boom".into())])
            .into_connection();
        let query = TryListQuery {
            page: 1,
            per_page: 20,
        };
        let result = list_tries(&db, Uuid::new_v4(), query).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn list_tries_by_spot_db_error() {
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_errors(vec![sea_orm::DbErr::Custom("boom".into())])
            .into_connection();
        let query = TryListQuery {
            page: 1,
            per_page: 20,
        };
        let result = list_tries_by_spot(&db, Uuid::new_v4(), query).await;
        assert!(result.is_err());
    }

    // ── list_posts tests ──

    #[tokio::test]
    async fn list_posts_empty_result() {
        use sea_orm::{DatabaseBackend, MockDatabase};

        // Query pipeline: count → posts.all → users.all → spot_counts → comment_counts
        // magazine_ids are empty so magazine query is skipped.
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<posts::Model>::new()]) // count
            .append_query_results([Vec::<posts::Model>::new()]) // posts.all
            .append_query_results([Vec::<crate::entities::users::Model>::new()]) // users
            .append_query_results([
                Vec::<std::collections::BTreeMap<String, sea_orm::Value>>::new(),
            ]) // spot_counts
            .append_query_results([
                Vec::<std::collections::BTreeMap<String, sea_orm::Value>>::new(),
            ]) // comment_counts
            .into_connection();
        let query = PostListQuery {
            artist_name: None,
            group_name: None,
            context: None,
            category: None,
            user_id: None,
            artist_id: None,
            group_id: None,
            sort: "recent".to_string(),
            page: 1,
            per_page: 20,
            has_solutions: None,
            has_magazine: None,
            include_magazine_items: None,
        };
        let result = list_posts(&db, query).await;
        assert!(result.is_ok());
        let resp = result.unwrap();
        assert!(resp.data.is_empty());
    }

    #[tokio::test]
    async fn list_posts_with_filters_and_popular_sort() {
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<posts::Model>::new()]) // count
            .append_query_results([Vec::<posts::Model>::new()]) // posts
            .append_query_results([Vec::<crate::entities::users::Model>::new()]) // users
            .append_query_results([
                Vec::<std::collections::BTreeMap<String, sea_orm::Value>>::new(),
            ]) // spot_counts
            .append_query_results([
                Vec::<std::collections::BTreeMap<String, sea_orm::Value>>::new(),
            ]) // comment_counts
            .into_connection();
        let query = PostListQuery {
            artist_name: Some("Jennie".to_string()),
            group_name: Some("BP".to_string()),
            context: Some("airport".to_string()),
            category: None,
            user_id: Some(Uuid::new_v4()),
            artist_id: Some(Uuid::new_v4()),
            group_id: Some(Uuid::new_v4()),
            sort: "popular".to_string(),
            page: 1,
            per_page: 20,
            has_solutions: None,
            has_magazine: Some(true),
            include_magazine_items: None,
        };
        let result = list_posts(&db, query).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn list_posts_trending_sort() {
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<posts::Model>::new()]) // count
            .append_query_results([Vec::<posts::Model>::new()]) // posts
            .append_query_results([Vec::<crate::entities::users::Model>::new()])
            .append_query_results([
                Vec::<std::collections::BTreeMap<String, sea_orm::Value>>::new(),
            ])
            .append_query_results([
                Vec::<std::collections::BTreeMap<String, sea_orm::Value>>::new(),
            ])
            .into_connection();
        let query = PostListQuery {
            artist_name: None,
            group_name: None,
            context: None,
            category: None,
            user_id: None,
            artist_id: None,
            group_id: None,
            sort: "trending".to_string(),
            page: 1,
            per_page: 20,
            has_solutions: None,
            has_magazine: None,
            include_magazine_items: None,
        };
        assert!(list_posts(&db, query).await.is_ok());
    }

    // ── admin_list_posts tests ──

    #[tokio::test]
    async fn admin_list_posts_empty_with_status_filter() {
        use crate::domains::admin::posts::AdminPostListQuery;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<posts::Model>::new()]) // count
            .append_query_results([Vec::<posts::Model>::new()]) // posts
            .append_query_results([Vec::<crate::entities::users::Model>::new()]) // users
            .append_query_results([
                Vec::<std::collections::BTreeMap<String, sea_orm::Value>>::new(),
            ]) // spots
            .append_query_results([
                Vec::<std::collections::BTreeMap<String, sea_orm::Value>>::new(),
            ]) // comments
            .into_connection();
        let query = AdminPostListQuery {
            q: None,
            status: Some("hidden".to_string()),
            base_query: PostListQuery {
                artist_name: Some("X".to_string()),
                group_name: Some("Y".to_string()),
                context: Some("Z".to_string()),
                category: None,
                user_id: Some(Uuid::new_v4()),
                artist_id: None,
                group_id: None,
                sort: "recent".to_string(),
                page: 1,
                per_page: 20,
                has_solutions: None,
                has_magazine: None,
                include_magazine_items: None,
            },
        };
        let result = admin_list_posts(&db, query).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn admin_list_posts_popular_sort_no_status() {
        use crate::domains::admin::posts::AdminPostListQuery;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<posts::Model>::new()])
            .append_query_results([Vec::<posts::Model>::new()])
            .append_query_results([Vec::<crate::entities::users::Model>::new()])
            .append_query_results([
                Vec::<std::collections::BTreeMap<String, sea_orm::Value>>::new(),
            ])
            .append_query_results([
                Vec::<std::collections::BTreeMap<String, sea_orm::Value>>::new(),
            ])
            .into_connection();
        let query = AdminPostListQuery {
            q: None,
            status: None,
            base_query: PostListQuery {
                artist_name: None,
                group_name: None,
                context: None,
                category: None,
                user_id: None,
                artist_id: None,
                group_id: None,
                sort: "popular".to_string(),
                page: 1,
                per_page: 20,
                has_solutions: None,
                has_magazine: None,
                include_magazine_items: None,
            },
        };
        assert!(admin_list_posts(&db, query).await.is_ok());
    }

    #[tokio::test]
    async fn admin_list_posts_trending_sort() {
        use crate::domains::admin::posts::AdminPostListQuery;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<posts::Model>::new()])
            .append_query_results([Vec::<posts::Model>::new()])
            .append_query_results([Vec::<crate::entities::users::Model>::new()])
            .append_query_results([
                Vec::<std::collections::BTreeMap<String, sea_orm::Value>>::new(),
            ])
            .append_query_results([
                Vec::<std::collections::BTreeMap<String, sea_orm::Value>>::new(),
            ])
            .into_connection();
        let query = AdminPostListQuery {
            q: None,
            status: None,
            base_query: PostListQuery {
                artist_name: None,
                group_name: None,
                context: None,
                category: None,
                user_id: None,
                artist_id: None,
                group_id: None,
                sort: "trending".to_string(),
                page: 1,
                per_page: 20,
                has_solutions: None,
                has_magazine: None,
                include_magazine_items: None,
            },
        };
        assert!(admin_list_posts(&db, query).await.is_ok());
    }

    // ── get_post_detail: propagation paths ──

    #[tokio::test]
    async fn get_post_detail_db_error_on_post_lookup() {
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_errors(vec![sea_orm::DbErr::Custom("db down".into())])
            .into_connection();
        let result = get_post_detail(&db, Uuid::new_v4(), None).await;
        assert!(result.is_err());
    }

    // ── upload_image tests (DummyStorageClient) ──

    #[tokio::test]
    async fn upload_image_jpeg_returns_url_with_jpg_ext() {
        use crate::tests::{fixtures, helpers::test_app_state};
        let state = test_app_state(crate::tests::helpers::empty_mock_db());
        let result =
            upload_image(&state, vec![1, 2, 3], "image/jpeg", fixtures::test_uuid(10)).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let resp = result.unwrap();
        assert!(resp.image_url.contains("posts/"));
        assert!(resp.image_url.ends_with(".jpg"));
    }

    #[tokio::test]
    async fn upload_image_png_returns_url_with_png_ext() {
        use crate::tests::{fixtures, helpers::test_app_state};
        let state = test_app_state(crate::tests::helpers::empty_mock_db());
        let resp = upload_image(&state, vec![0; 8], "image/png", fixtures::test_uuid(10))
            .await
            .expect("ok");
        assert!(resp.image_url.ends_with(".png"));
    }

    #[tokio::test]
    async fn upload_image_webp_returns_url_with_webp_ext() {
        use crate::tests::{fixtures, helpers::test_app_state};
        let state = test_app_state(crate::tests::helpers::empty_mock_db());
        let resp = upload_image(&state, vec![0; 4], "image/webp", fixtures::test_uuid(10))
            .await
            .expect("ok");
        assert!(resp.image_url.ends_with(".webp"));
    }

    #[tokio::test]
    async fn upload_image_jpg_alias_accepted() {
        use crate::tests::{fixtures, helpers::test_app_state};
        let state = test_app_state(crate::tests::helpers::empty_mock_db());
        let resp = upload_image(&state, vec![0; 4], "image/jpg", fixtures::test_uuid(10))
            .await
            .expect("ok");
        assert!(resp.image_url.ends_with(".jpg"));
    }

    #[tokio::test]
    async fn upload_image_unsupported_content_type_errors() {
        use crate::tests::{fixtures, helpers::test_app_state};
        let state = test_app_state(crate::tests::helpers::empty_mock_db());
        let result = upload_image(&state, vec![0; 2], "image/gif", fixtures::test_uuid(10)).await;
        assert!(matches!(result, Err(crate::AppError::BadRequest(_))));
    }

    // ── get_post_detail success path: empty spots branch ──
    // Query order in get_post_detail (parallelized with tokio::try_join!):
    //   1. get_post_by_id            → posts
    //   2. tokio::try_join! (poll order: user, related, likes, liked, saved, profile):
    //      a) get_user_by_id         → users
    //      b) load_post_related_data → spots (empty → early return)
    //      c) count_likes_by_post_id → post_likes count
    //      d) user_has_liked (None)  → no query
    //      e) user_has_saved (None)  → no query
    //      f) profile images (None)  → no query
    //   3. count_tries               → posts count

    #[tokio::test]
    async fn get_post_detail_empty_spots_no_user_success() {
        use crate::tests::fixtures;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::post_model()]]) // 1) get_post_by_id
            .append_query_results([[fixtures::user_model()]]) // 2a) get_user_by_id
            .append_query_results([Vec::<crate::entities::spots::Model>::new()]) // 2b) spots (empty)
            .append_query_results([vec![fixtures::count_row(0)]]) // 2c) count_likes_by_post_id
            .append_query_results([vec![fixtures::count_row(0)]]) // 3) count_tries
            .into_connection();
        let result = get_post_detail(&db, fixtures::test_uuid(1), None).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let resp = result.unwrap();
        assert_eq!(resp.id, fixtures::test_uuid(1));
        assert!(resp.try_count.is_none());
    }

    // ── get_post_detail: populated spots branch ──

    #[tokio::test]
    async fn get_post_detail_with_spots_success() {
        use crate::tests::fixtures;
        use sea_orm::{DatabaseBackend, MockDatabase};

        // Query order (parallelized with tokio::try_join!):
        //  1) get_post_by_id
        //  2) tokio::try_join! poll order:
        //     a) get_user_by_id
        //     b) load_post_related_data: spots → solutions → subcategories → categories
        //     c) count_likes_by_post_id
        //     d-f) no query (no user_id, no artist/group_id)
        //  3) tokio::try_join! for comment_count + count_tries
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::post_model()]]) // 1
            .append_query_results([[fixtures::user_model()]]) // 2a
            .append_query_results([[fixtures::spot_model()]]) // 2b-i spots
            .append_query_results([[fixtures::solution_model()]]) // 2b-ii solutions
            .append_query_results([[fixtures::subcategory_model()]]) // 2b-iii subcategories
            .append_query_results([[fixtures::category_model()]]) // 2b-iv categories
            .append_query_results([vec![fixtures::count_row(0)]]) // 2c like count
            .append_query_results([vec![fixtures::count_row(2)]]) // 3a comment count
            .append_query_results([vec![fixtures::count_row(0)]]) // 3b count_tries
            .append_query_results([vec![fixtures::count_row(0)]]) // 3c count_saves
            .into_connection();
        let result = get_post_detail(&db, fixtures::test_uuid(1), None).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let resp = result.unwrap();
        assert_eq!(resp.spots.len(), 1);
    }

    #[tokio::test]
    async fn get_post_detail_user_not_found_propagates() {
        use crate::tests::fixtures;
        use sea_orm::{DatabaseBackend, MockDatabase};

        // Post found, but subsequent get_user_by_id returns empty → NotFound
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::post_model()]])
            .append_query_results([Vec::<crate::entities::users::Model>::new()])
            .into_connection();
        let result = get_post_detail(&db, fixtures::test_uuid(1), None).await;
        assert!(result.is_err());
    }

    // ── list_posts has_solutions filter branches ──

    #[tokio::test]
    async fn list_posts_has_solutions_true_no_solutions_returns_empty() {
        use sea_orm::{DatabaseBackend, MockDatabase};

        // has_solutions=true but empty solutions → early short-circuit
        // Queries: solutions (empty) → count → posts.all → users → spot_counts → comment_counts
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([
                Vec::<std::collections::BTreeMap<String, sea_orm::Value>>::new(),
            ]) // solution spot_ids (empty → short-circuit)
            .append_query_results([Vec::<posts::Model>::new()]) // count
            .append_query_results([Vec::<posts::Model>::new()]) // posts
            .append_query_results([Vec::<crate::entities::users::Model>::new()]) // users
            .append_query_results([
                Vec::<std::collections::BTreeMap<String, sea_orm::Value>>::new(),
            ]) // spot_counts
            .append_query_results([
                Vec::<std::collections::BTreeMap<String, sea_orm::Value>>::new(),
            ]) // comment_counts
            .into_connection();
        let query = PostListQuery {
            artist_name: None,
            group_name: None,
            context: None,
            category: None,
            user_id: None,
            artist_id: None,
            group_id: None,
            sort: "recent".to_string(),
            page: 1,
            per_page: 20,
            has_solutions: Some(true),
            has_magazine: None,
            include_magazine_items: None,
        };
        let result = list_posts(&db, query).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
    }

    #[tokio::test]
    async fn list_posts_has_solutions_false_spot_only_branch() {
        use crate::tests::fixtures;
        use sea_orm::{DatabaseBackend, MockDatabase};

        // has_solutions=false branch:
        //   count → posts → users → spot_counts → comment_counts
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![fixtures::count_row(0)]]) // count
            .append_query_results([Vec::<posts::Model>::new()]) // posts
            .append_query_results([Vec::<crate::entities::users::Model>::new()]) // users
            .append_query_results([
                Vec::<std::collections::BTreeMap<String, sea_orm::Value>>::new(),
            ]) // spot_counts
            .append_query_results([
                Vec::<std::collections::BTreeMap<String, sea_orm::Value>>::new(),
            ]) // comment_counts
            .into_connection();
        let query = PostListQuery {
            artist_name: None,
            group_name: None,
            context: None,
            category: None,
            user_id: None,
            artist_id: None,
            group_id: None,
            sort: "recent".to_string(),
            page: 1,
            per_page: 20,
            has_solutions: Some(false),
            has_magazine: None,
            include_magazine_items: None,
        };
        let result = list_posts(&db, query).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
    }

    #[tokio::test]
    async fn list_posts_with_populated_data_all_lookups() {
        use crate::tests::fixtures;
        use sea_orm::{DatabaseBackend, MockDatabase};

        // Populated posts → users, spot_counts, comment_counts, magazine_titles
        let mut post = fixtures::post_model();
        post.post_magazine_id = Some(fixtures::test_uuid(80));

        let magazine = crate::entities::post_magazines::Model {
            id: fixtures::test_uuid(80),
            title: "Mag Title".to_string(),
            subtitle: None,
            keyword: None,
            layout_json: None,
            status: "published".to_string(),
            review_summary: None,
            error_log: None,
            created_at: fixtures::test_timestamp(),
            updated_at: fixtures::test_timestamp(),
            published_at: Some(fixtures::test_timestamp()),
        };

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![fixtures::count_row(1)]]) // count
            .append_query_results([vec![post]]) // posts
            .append_query_results([vec![fixtures::user_model()]]) // users
            .append_query_results([
                Vec::<std::collections::BTreeMap<String, sea_orm::Value>>::new(),
            ]) // spot_counts
            .append_query_results([
                Vec::<std::collections::BTreeMap<String, sea_orm::Value>>::new(),
            ]) // comment_counts
            .append_query_results([vec![magazine]]) // magazine titles
            .into_connection();
        let query = PostListQuery {
            artist_name: None,
            group_name: None,
            context: None,
            category: None,
            user_id: None,
            artist_id: None,
            group_id: None,
            sort: "recent".to_string(),
            page: 1,
            per_page: 20,
            has_solutions: None,
            has_magazine: None,
            include_magazine_items: None,
        };
        let result = list_posts(&db, query).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let resp = result.unwrap();
        assert_eq!(resp.data.len(), 1);
        assert_eq!(
            resp.data[0].post_magazine_title.as_deref(),
            Some("Mag Title")
        );
    }

    // ── list_tries populated ──

    #[tokio::test]
    async fn list_tries_with_populated_data() {
        use crate::tests::fixtures;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let mut try_post = fixtures::post_model();
        try_post.id = fixtures::test_uuid(50);
        try_post.post_type = Some("try".to_string());
        try_post.parent_post_id = Some(fixtures::test_uuid(1));

        let tag = crate::entities::try_spot_tags::Model {
            id: fixtures::test_uuid(4),
            try_post_id: fixtures::test_uuid(50),
            spot_id: fixtures::test_uuid(2),
            created_at: fixtures::test_timestamp(),
        };

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![fixtures::count_row(1)]]) // count
            .append_query_results([vec![try_post]]) // posts
            .append_query_results([vec![fixtures::user_model()]]) // users
            .append_query_results([vec![tag]]) // tags
            .into_connection();
        let query = TryListQuery {
            page: 1,
            per_page: 20,
        };
        let result = list_tries(&db, fixtures::test_uuid(1), query).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let resp = result.unwrap();
        assert_eq!(resp.total, 1);
        assert_eq!(resp.tries.len(), 1);
        assert_eq!(resp.tries[0].tagged_spot_ids, vec![fixtures::test_uuid(2)]);
    }

    // ── list_tries_by_spot populated ──

    #[tokio::test]
    async fn list_tries_by_spot_with_populated_data() {
        use crate::tests::fixtures;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let mut try_post = fixtures::post_model();
        try_post.id = fixtures::test_uuid(50);
        try_post.post_type = Some("try".to_string());

        let tag = crate::entities::try_spot_tags::Model {
            id: fixtures::test_uuid(4),
            try_post_id: fixtures::test_uuid(50),
            spot_id: fixtures::test_uuid(2),
            created_at: fixtures::test_timestamp(),
        };

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![fixtures::uuid_row(
                "try_post_id",
                fixtures::test_uuid(50),
            )]]) // tag into_tuple
            .append_query_results([vec![fixtures::count_row(1)]]) // count
            .append_query_results([vec![try_post]]) // posts
            .append_query_results([vec![fixtures::user_model()]]) // users
            .append_query_results([vec![tag]]) // all tags
            .into_connection();
        let query = TryListQuery {
            page: 1,
            per_page: 20,
        };
        let result = list_tries_by_spot(&db, fixtures::test_uuid(2), query).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let resp = result.unwrap();
        assert_eq!(resp.total, 1);
        assert_eq!(resp.tries.len(), 1);
    }

    // ── admin_list_posts populated ──

    #[tokio::test]
    async fn admin_list_posts_with_populated_data() {
        use crate::domains::admin::posts::AdminPostListQuery;
        use crate::tests::fixtures;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![fixtures::count_row(1)]]) // count
            .append_query_results([vec![fixtures::post_model()]]) // posts
            .append_query_results([vec![fixtures::user_model()]]) // users
            .append_query_results([
                Vec::<std::collections::BTreeMap<String, sea_orm::Value>>::new(),
            ]) // spot_counts
            .append_query_results([
                Vec::<std::collections::BTreeMap<String, sea_orm::Value>>::new(),
            ]) // comment_counts
            .into_connection();
        let query = AdminPostListQuery {
            q: None,
            status: None,
            base_query: PostListQuery {
                artist_name: None,
                group_name: None,
                context: None,
                category: None,
                user_id: None,
                artist_id: None,
                group_id: None,
                sort: "recent".to_string(),
                page: 1,
                per_page: 20,
                has_solutions: None,
                has_magazine: None,
                include_magazine_items: None,
            },
        };
        let result = admin_list_posts(&db, query).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let resp = result.unwrap();
        assert_eq!(resp.data.len(), 1);
    }

    // ── admin_update_post_status: meilisearch sync branches ──

    #[tokio::test]
    async fn admin_update_post_status_hidden_triggers_search_delete() {
        use crate::tests::fixtures;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let mut updated = fixtures::post_model();
        updated.status = "hidden".to_string();

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::post_model()]])
            .append_query_results([[updated.clone()]])
            .append_query_results([[fixtures::audit_log_model()]])
            .into_connection();
        let client: Arc<dyn crate::services::SearchClient> = Arc::new(DummySearchClient);
        let result = admin_update_post_status(
            &client,
            &db,
            fixtures::test_uuid(1),
            "hidden",
            fixtures::test_uuid(99),
        )
        .await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn admin_update_post_status_active_triggers_search_update() {
        use crate::tests::fixtures;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let mut updated = fixtures::post_model();
        updated.status = "active".to_string();

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::post_model()]])
            .append_query_results([[updated.clone()]])
            .append_query_results([[fixtures::audit_log_model()]])
            .into_connection();
        let client: Arc<dyn crate::services::SearchClient> = Arc::new(DummySearchClient);
        let result = admin_update_post_status(
            &client,
            &db,
            fixtures::test_uuid(1),
            "active",
            fixtures::test_uuid(99),
        )
        .await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn admin_update_post_status_deleted_triggers_search_delete() {
        use crate::tests::fixtures;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let mut updated = fixtures::post_model();
        updated.status = "deleted".to_string();

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::post_model()]])
            .append_query_results([[updated.clone()]])
            .append_query_results([[fixtures::audit_log_model()]])
            .into_connection();
        let client: Arc<dyn crate::services::SearchClient> = Arc::new(DummySearchClient);
        let result = admin_update_post_status(
            &client,
            &db,
            fixtures::test_uuid(1),
            "deleted",
            fixtures::test_uuid(99),
        )
        .await;
        assert!(result.is_ok());
    }

    // ── count_tries: populated count_row path ──

    #[tokio::test]
    async fn count_tries_returns_populated_count() {
        use crate::tests::fixtures;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![fixtures::count_row(5)]])
            .into_connection();
        let result = count_tries(&db, fixtures::test_uuid(1)).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().count, 5);
    }

    // ── create_try_post error paths (pre-transaction validation) ──

    #[tokio::test]
    async fn create_try_post_parent_not_found() {
        use crate::tests::{fixtures, helpers::test_app_state};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<posts::Model>::new()]) // parent lookup
            .into_connection();
        let state = test_app_state(db);
        let dto = CreateTryPostDto {
            parent_post_id: fixtures::test_uuid(1),
            media_title: None,
            spot_ids: vec![],
        };
        let result = create_try_post(
            &state,
            fixtures::test_uuid(10),
            vec![1, 2, 3],
            "image/jpeg",
            dto,
        )
        .await;
        assert!(matches!(result, Err(crate::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn create_try_post_rejects_try_on_try_parent() {
        use crate::tests::{fixtures, helpers::test_app_state};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let mut parent = fixtures::post_model();
        parent.post_type = Some("try".to_string());

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![parent]]) // parent is a try
            .into_connection();
        let state = test_app_state(db);
        let dto = CreateTryPostDto {
            parent_post_id: fixtures::test_uuid(1),
            media_title: None,
            spot_ids: vec![],
        };
        let result = create_try_post(
            &state,
            fixtures::test_uuid(10),
            vec![1, 2, 3],
            "image/jpeg",
            dto,
        )
        .await;
        assert!(matches!(result, Err(crate::AppError::BadRequest(_))));
    }

    #[tokio::test]
    async fn create_try_post_rejects_spot_ids_not_belonging_to_parent() {
        use crate::tests::{fixtures, helpers::test_app_state};
        use sea_orm::{DatabaseBackend, MockDatabase};

        // Parent OK (non-try); spot count mismatch (0 vs 2 requested)
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![fixtures::post_model()]]) // parent lookup
            .append_query_results([vec![fixtures::count_row(0)]]) // spots.count → 0 (mismatch)
            .into_connection();
        let state = test_app_state(db);
        let dto = CreateTryPostDto {
            parent_post_id: fixtures::test_uuid(1),
            media_title: None,
            spot_ids: vec![fixtures::test_uuid(2), fixtures::test_uuid(3)],
        };
        let result = create_try_post(
            &state,
            fixtures::test_uuid(10),
            vec![1, 2, 3],
            "image/jpeg",
            dto,
        )
        .await;
        assert!(matches!(result, Err(crate::AppError::BadRequest(_))));
    }

    #[tokio::test]
    async fn get_post_detail_empty_spots_with_user_success() {
        use crate::tests::fixtures;
        use sea_orm::{DatabaseBackend, MockDatabase};

        // With user_id: user_has_liked + user_has_saved queries fire
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::post_model()]]) // 1) get_post_by_id
            .append_query_results([[fixtures::user_model()]]) // 2a) get_user_by_id
            .append_query_results([Vec::<crate::entities::spots::Model>::new()]) // 2b) spots (empty)
            .append_query_results([vec![fixtures::count_row(2)]]) // 2c) count_likes_by_post_id
            .append_query_results([Vec::<crate::entities::post_likes::Model>::new()]) // 2d) user_has_liked
            .append_query_results([Vec::<crate::entities::saved_posts::Model>::new()]) // 2e) user_has_saved
            .append_query_results([vec![fixtures::count_row(3)]]) // 3) count_tries
            .into_connection();
        let result =
            get_post_detail(&db, fixtures::test_uuid(1), Some(fixtures::test_uuid(10))).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let resp = result.unwrap();
        assert_eq!(resp.try_count, Some(3));
    }
}
