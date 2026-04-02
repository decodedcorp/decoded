//! Posts DTO (Data Transfer Objects)
//!
//! API 요청/응답에 사용되는 데이터 구조

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;
use validator::Validate;

use crate::domains::categories::dto::CategoryResponse;
use crate::entities::posts::Model as PostModel;
use crate::entities::UsersModel;

/// 미디어 소스 정보
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, Validate)]
pub struct MediaSourceDto {
    /// 미디어 타입 (예: "drama", "music_video", "movie" 등)
    #[serde(rename = "type")]
    #[validate(length(min = 1, max = 128))]
    pub media_type: String,

    /// 자연어 설명 (옵션)
    /// 예: "넷플릭스 드라마 ㅇㅇㅇ 시즌2 3화, 주인공이 카페에서..."
    /// AI가 이 설명에서 title과 metadata를 자동 추출합니다.
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(length(max = 10_000))]
    pub description: Option<String>,
}

/// Solution 생성 요청 (Post 생성 시 Spot과 함께 포함)
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, Validate)]
pub struct CreateSolutionInlineDto {
    /// 원본 상품 URL
    #[validate(length(min = 1))]
    pub original_url: String,

    /// og metadata title
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,

    /// 메타데이터 (가격, 브랜드 등)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,

    /// og metadata description
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    /// solver comment
    #[serde(skip_serializing_if = "Option::is_none")]
    pub comment: Option<String>,

    /// og metadata image
    #[serde(skip_serializing_if = "Option::is_none")]
    pub thumbnail_url: Option<String>,
}

/// Spot 생성 요청 (Post 생성 시 포함)
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, Validate)]
pub struct CreateSpotDto {
    /// 위치 좌표 (왼쪽, 퍼센트)
    #[validate(length(min = 1))]
    pub position_left: String,

    /// 위치 좌표 (위, 퍼센트)
    #[validate(length(min = 1))]
    pub position_top: String,

    /// 서브카테고리 ID (`None`이면 미분류 `uncategorized`로 저장)
    #[serde(default)]
    pub subcategory_id: Option<Uuid>,

    /// Solution 정보 (0개 이상)
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub solutions: Vec<CreateSolutionInlineDto>,
}

/// Post 생성 요청
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, Validate)]
pub struct CreatePostDto {
    /// 이미지 URL (Cloudflare)
    #[validate(length(min = 1))]
    pub image_url: String,

    /// 미디어 소스 정보
    #[validate(nested)]
    pub media_source: MediaSourceDto,

    /// Gemini AI 분석 메타데이터
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<ImageAnalysisMetadata>,

    /// 그룹명 (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub group_name: Option<String>,

    /// 아티스트명 (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub artist_name: Option<String>,

    /// 상황 정보 (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context: Option<String>,

    /// Spots (최소 1개 이상 필요, 유저가 직접 지정)
    #[validate(length(min = 1))]
    pub spots: Vec<CreateSpotDto>,
}

/// Try Post 생성 요청 (multipart의 data 필드)
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, Validate)]
pub struct CreateTryPostDto {
    /// 원본 포스트 ID
    pub parent_post_id: Uuid,

    /// 한줄 코멘트 (선택, 100자)
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(length(max = 100))]
    pub media_title: Option<String>,

    /// 태깅할 스팟 ID 배열 (선택)
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub spot_ids: Vec<Uuid>,
}

/// Try Post 목록 아이템
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct TryPostListItem {
    /// Try Post ID
    pub id: Uuid,

    /// 사용자 정보
    pub user: PostUserInfo,

    /// 이미지 URL
    pub image_url: String,

    /// 한줄 코멘트
    #[serde(skip_serializing_if = "Option::is_none")]
    pub media_title: Option<String>,

    /// 태깅된 스팟 ID 목록
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub tagged_spot_ids: Vec<Uuid>,

    /// 생성일시
    pub created_at: DateTime<Utc>,
}

/// Try 목록 응답
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct TryListResponse {
    /// Try 목록
    pub tries: Vec<TryPostListItem>,

    /// 전체 개수
    pub total: i64,
}

/// Try 개수 응답
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct TryCountResponse {
    /// 개수
    pub count: i64,
}

/// Try 목록 조회 쿼리
#[derive(Debug, Clone, Deserialize, ToSchema)]
pub struct TryListQuery {
    /// 페이지 번호
    #[serde(default = "default_page")]
    pub page: u64,

    /// 페이지당 개수
    #[serde(default = "default_per_page")]
    pub per_page: u64,
}

/// Post 수정 요청
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, Validate)]
pub struct UpdatePostDto {
    /// 미디어 소스 정보 (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub media_source: Option<MediaSourceDto>,

    /// 그룹명 (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(length(max = 256))]
    pub group_name: Option<String>,

    /// 아티스트명 (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(length(max = 256))]
    pub artist_name: Option<String>,

    /// 상황 정보 (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(length(max = 512))]
    pub context: Option<String>,

    /// 상태 (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(length(max = 32))]
    pub status: Option<String>, // 'active' | 'hidden'
}

/// Post 목록 조회 쿼리 파라미터
#[derive(Debug, Clone, Deserialize, ToSchema)]
pub struct PostListQuery {
    /// 아티스트명 필터
    #[serde(skip_serializing_if = "Option::is_none")]
    pub artist_name: Option<String>,

    /// 그룹명 필터
    #[serde(skip_serializing_if = "Option::is_none")]
    pub group_name: Option<String>,

    /// 상황 필터
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context: Option<String>,

    /// 카테고리 필터 (Spot 카테고리)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<String>,

    /// 사용자 ID 필터
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user_id: Option<Uuid>,

    /// 정렬 방식
    #[serde(default = "default_sort")]
    pub sort: String, // 'recent' | 'popular' | 'trending'

    /// 페이지 번호
    #[serde(default = "default_page")]
    pub page: u64,

    /// 페이지당 개수
    #[serde(default = "default_per_page")]
    pub per_page: u64,

    /// 솔루션 보유 여부 필터. true = 최소 1개 spot에 solution 있는 post만, false = spot은 있으나 solution 없는 post만
    #[serde(skip_serializing_if = "Option::is_none")]
    pub has_solutions: Option<bool>,

    /// 매거진(editorial) 보유 여부. true = post_magazine_id가 있는 post만
    #[serde(skip_serializing_if = "Option::is_none")]
    pub has_magazine: Option<bool>,
}

fn default_sort() -> String {
    "recent".to_string()
}

fn default_page() -> u64 {
    1
}

fn default_per_page() -> u64 {
    20
}

/// Post 생성 (with-solutions) 응답 - spot/solution ID 포함
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct CreatePostWithSolutionsResponse {
    #[serde(flatten)]
    pub post: PostResponse,
    pub spot_ids: Vec<Uuid>,
    pub solution_ids: Vec<Uuid>,
}

/// Post 응답 (상세)
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct PostResponse {
    /// Post ID
    pub id: Uuid,

    /// 사용자 ID
    pub user_id: Uuid,

    /// 이미지 URL
    pub image_url: String,

    /// 미디어 소스 정보
    pub media_source: MediaSourceDto,

    /// 미디어 제목 (AI가 추출한 제목)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,

    /// 그룹명
    #[serde(skip_serializing_if = "Option::is_none")]
    pub group_name: Option<String>,

    /// 아티스트명
    #[serde(skip_serializing_if = "Option::is_none")]
    pub artist_name: Option<String>,

    /// 상황 정보
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context: Option<String>,

    /// 조회수
    pub view_count: i32,

    /// 상태
    pub status: String,

    /// Try 포스트의 원본 포스트 ID
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent_post_id: Option<Uuid>,

    /// 포스트 타입 (post | try)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub post_type: Option<String>,

    /// 생성일시
    pub created_at: DateTime<Utc>,
}

/// Post 목록 응답 아이템 (간소화된 정보)
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct PostListItem {
    /// Post ID
    pub id: Uuid,

    /// 사용자 정보 (간소화)
    pub user: PostUserInfo,

    /// 이미지 URL
    pub image_url: String,

    /// 미디어 소스 정보 (간소화)
    pub media_source: MediaSourceDto,

    /// 미디어 제목 (AI가 추출한 제목)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,

    /// 아티스트명
    #[serde(skip_serializing_if = "Option::is_none")]
    pub artist_name: Option<String>,

    /// 그룹명
    #[serde(skip_serializing_if = "Option::is_none")]
    pub group_name: Option<String>,

    /// 상황 정보
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context: Option<String>,

    /// Spot 개수
    pub spot_count: i64,

    /// 조회수
    pub view_count: i32,

    /// 댓글 개수
    pub comment_count: i64,

    /// 생성일시
    pub created_at: DateTime<Utc>,

    /// 에디토리얼(매거진) 타이틀. post_magazine_id가 있을 때만 설정
    #[serde(skip_serializing_if = "Option::is_none")]
    pub post_magazine_title: Option<String>,
}

/// Post에 포함된 사용자 정보 (간소화)
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct PostUserInfo {
    /// 사용자 ID
    pub id: Uuid,

    /// 사용자명
    pub username: String,

    /// 아바타 URL
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avatar_url: Option<String>,

    /// 사용자 등급
    pub rank: String,
}

/// 대표 Solution 요약 (Spot 호버용)
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct TopSolutionSummary {
    /// Solution ID
    pub id: Uuid,

    /// 제목
    pub title: String,

    /// 메타데이터 (가격, 브랜드 등)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,

    /// 썸네일 이미지 URL
    #[serde(skip_serializing_if = "Option::is_none")]
    pub thumbnail_url: Option<String>,

    /// 원본 상품 URL (Shop the Look 링크용)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub original_url: Option<String>,

    /// 제휴 링크 URL
    #[serde(skip_serializing_if = "Option::is_none")]
    pub affiliate_url: Option<String>,

    /// 검증 여부
    pub is_verified: bool,

    /// 채택 여부
    pub is_adopted: bool,
}

/// Spot + 대표 Solution (Post 상세용)
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct SpotWithTopSolution {
    /// Spot ID
    pub id: Uuid,

    /// 위치 좌표 (왼쪽, 퍼센트)
    pub position_left: String,

    /// 위치 좌표 (위, 퍼센트)
    pub position_top: String,

    /// 카테고리 정보 (선택사항)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<CategoryResponse>,

    /// 상태
    pub status: String,

    /// Solution 개수
    pub solution_count: i32,

    /// 대표 Solution
    #[serde(skip_serializing_if = "Option::is_none")]
    pub top_solution: Option<TopSolutionSummary>,

    /// 생성일시
    pub created_at: DateTime<Utc>,
}

/// Post 상세 응답 (REQUIREMENT.md 명세)
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct PostDetailResponse {
    /// Post ID
    pub id: Uuid,

    /// 이미지 URL
    pub image_url: String,

    /// 미디어 소스 정보
    pub media_source: MediaSourceDto,

    /// 미디어 제목 (AI가 추출한 제목)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,

    /// 그룹명
    #[serde(skip_serializing_if = "Option::is_none")]
    pub group_name: Option<String>,

    /// 아티스트명
    #[serde(skip_serializing_if = "Option::is_none")]
    pub artist_name: Option<String>,

    /// 상황 정보
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context: Option<String>,

    /// 조회수
    pub view_count: i32,

    /// 상태
    pub status: String,

    /// 생성일시
    pub created_at: DateTime<Utc>,

    /// 수정일시
    pub updated_at: DateTime<Utc>,

    /// 포스트 생성 시 솔루션을 알고 등록했는지. true=with-solutions, false=without, null=기존 데이터
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_with_solutions: Option<bool>,

    /// 사용자 정보
    pub user: PostUserInfo,

    /// Spots 목록 (대표 Solution 포함)
    pub spots: Vec<SpotWithTopSolution>,

    /// 댓글 개수
    pub comment_count: i64,

    /// 좋아요 개수
    #[serde(default)]
    pub like_count: i64,

    /// 현재 사용자가 좋아요 했는지 (인증 시에만 설정)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user_has_liked: Option<bool>,

    /// 현재 사용자가 저장했는지 (인증 시에만 설정)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user_has_saved: Option<bool>,

    /// 연결된 Post Magazine ID (매거진이 생성된 경우)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub post_magazine_id: Option<Uuid>,

    /// AI가 생성한 포스트 요약 (1-2문장)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ai_summary: Option<String>,

    /// Try 포스트의 원본 포스트 ID
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent_post_id: Option<Uuid>,

    /// 포스트 타입 (post | try)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub post_type: Option<String>,

    /// Try 개수 (원본 포스트일 때만)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub try_count: Option<i64>,
}

impl PostDetailResponse {
    #[allow(clippy::too_many_arguments)]
    pub fn from_post_model(
        post: PostModel,
        user: UsersModel,
        media_source: MediaSourceDto,
        spots: Option<Vec<SpotWithTopSolution>>,
        comment_count: i64,
        like_count: i64,
        user_has_liked: Option<bool>,
        user_has_saved: Option<bool>,
    ) -> Self {
        Self {
            id: post.id,
            image_url: post.image_url.clone(),
            media_source,
            title: post.title.clone(),
            group_name: post.group_name.clone(),
            artist_name: post.artist_name.clone(),
            context: post.context.clone(),
            view_count: post.view_count,
            status: post.status.clone(),
            created_at: post.created_at.with_timezone(&chrono::Utc),
            updated_at: post.updated_at.with_timezone(&chrono::Utc),
            created_with_solutions: post.created_with_solutions,
            post_magazine_id: post.post_magazine_id,
            ai_summary: post.ai_summary.clone(),
            parent_post_id: post.parent_post_id,
            post_type: post.post_type.clone(),
            try_count: None,
            user: PostUserInfo {
                id: user.id,
                username: user.username,
                avatar_url: user.avatar_url,
                rank: user.rank,
            },
            spots: spots.map_or(vec![], |spots| spots),
            comment_count,
            like_count,
            user_has_liked,
            user_has_saved,
        }
    }
}

/// MediaSourceDto 헬퍼 메서드
impl MediaSourceDto {
    /// media_type 반환
    pub fn media_type(&self) -> &str {
        &self.media_type
    }

    /// description 반환
    pub fn description(&self) -> Option<&str> {
        self.description.as_deref()
    }
}

/// PostModel에서 MediaSourceDto 추출 (헬퍼 함수)
pub fn extract_media_source_from_model(model: &PostModel) -> MediaSourceDto {
    MediaSourceDto {
        media_type: model.media_type.clone(),
        description: None, // description은 저장하지 않음 (AI 분석용 임시 데이터)
    }
}

/// PostModel을 PostResponse로 변환
impl From<PostModel> for PostResponse {
    fn from(model: PostModel) -> Self {
        let media_source = extract_media_source_from_model(&model);

        Self {
            id: model.id,
            user_id: model.user_id,
            image_url: model.image_url,
            media_source,
            title: model.title,
            group_name: model.group_name,
            artist_name: model.artist_name,
            context: model.context,
            view_count: model.view_count,
            status: model.status,
            parent_post_id: model.parent_post_id,
            post_type: model.post_type,
            created_at: model.created_at.with_timezone(&chrono::Utc),
        }
    }
}

/// 이미지 업로드 응답
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct ImageUploadResponse {
    /// 업로드된 이미지 URL
    pub image_url: String,
}

/// 이미지 분석 결과의 아이템 (좌표 정보 포함)
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct ItemWithCoordinates {
    /// 서브카테고리 이름 (예: "Tops", "Headwear")
    #[serde(rename = "sub_category")]
    pub sub_category: String,
    /// 아이템 타입 (예: "hoodie", "tshirt", "sneakers")
    #[serde(rename = "type")]
    pub r#type: String,
    /// 상단 좌표 (이미지 크기와 무관한 상대적 퍼센트, 0-100%, 선택사항)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub top: Option<String>,
    /// 좌측 좌표 (이미지 크기와 무관한 상대적 퍼센트, 0-100%, 선택사항)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub left: Option<String>,
}

/// AI 이미지 분석 메타데이터 (Gemini 응답)
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct ImageAnalysisMetadata {
    /// 주요 인물/대상
    pub subject: String,
    /// 미디어 제목 (예: MV 제목, 드라마 제목 등)
    pub title: String,
    /// 아티스트명 (선택사항)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub artist_name: Option<String>,
    /// 그룹명 (선택사항)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub group_name: Option<String>,
    /// 상황 정보 (선택사항, 예: mv, airport, stage 등)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context: Option<String>,
    /// 카테고리별 서브카테고리 목록 (좌표 정보 포함)
    /// 예: { "Wearables": [{"sub_category": "Headwear", "type": "baseball cap", "top": "25.5", "left": "30.0"}], "Electronics": [{"sub_category": "Smartphone", "type": "iphone"}] }
    pub items: std::collections::HashMap<String, Vec<ItemWithCoordinates>>,
}

/// AI 이미지 분석 응답
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct ImageAnalyzeResponse {
    /// 분석 메타데이터 (subject, items)
    pub metadata: ImageAnalysisMetadata,
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    include!("dto_tests.inc");
}
