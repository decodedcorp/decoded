//! 테스트 픽스처 — 도메인 엔티티 팩토리 함수들.
//! `MockDatabase`에 넣을 모델 인스턴스를 생성합니다.

use chrono::{TimeZone, Utc};
use sea_orm::prelude::DateTimeWithTimeZone;
use serde_json::json;
use uuid::Uuid;

/// 고정 테스트용 UUID (테스트 간 일관성을 위해)
pub fn test_uuid(n: u8) -> Uuid {
    Uuid::from_bytes([n, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, n])
}

/// 고정 테스트 타임스탬프
pub fn test_timestamp() -> DateTimeWithTimeZone {
    Utc.with_ymd_and_hms(2026, 1, 1, 0, 0, 0).unwrap().into()
}

pub fn post_model() -> crate::entities::posts::Model {
    crate::entities::posts::Model {
        id: test_uuid(1),
        user_id: test_uuid(10),
        image_url: "https://example.com/image.webp".to_string(),
        media_type: "drama".to_string(),
        title: Some("Test Post".to_string()),
        media_metadata: None,
        group_name: Some("TestGroup".to_string()),
        artist_name: Some("TestArtist".to_string()),
        artist_id: None,
        group_id: None,
        context: Some("Test context".to_string()),
        view_count: 42,
        status: "active".to_string(),
        trending_score: Some(1.5),
        created_with_solutions: Some(false),
        post_magazine_id: None,
        ai_summary: None,
        style_tags: None,
        image_width: Some(1080),
        image_height: Some(1920),
        parent_post_id: None,
        post_type: None,
        created_at: test_timestamp(),
        updated_at: test_timestamp(),
    }
}

pub fn user_model() -> crate::entities::users::Model {
    crate::entities::users::Model {
        id: test_uuid(10),
        email: "test@example.com".to_string(),
        username: "testuser".to_string(),
        display_name: Some("Test User".to_string()),
        avatar_url: None,
        bio: None,
        rank: "user".to_string(),
        total_points: 100,
        is_admin: false,
        ink_credits: 0,
        style_dna: None,
        created_at: test_timestamp(),
        updated_at: test_timestamp(),
    }
}

pub fn admin_user_model() -> crate::entities::users::Model {
    let mut u = user_model();
    u.id = test_uuid(99);
    u.email = "admin@example.com".to_string();
    u.username = "admin".to_string();
    u.rank = "admin".to_string();
    u.is_admin = true;
    u
}

pub fn spot_model() -> crate::entities::spots::Model {
    crate::entities::spots::Model {
        id: test_uuid(2),
        post_id: test_uuid(1),
        user_id: test_uuid(10),
        position_left: "50.0".to_string(),
        position_top: "30.0".to_string(),
        subcategory_id: Some(test_uuid(21)),
        status: "active".to_string(),
        created_at: test_timestamp(),
        updated_at: test_timestamp(),
    }
}

pub fn solution_model() -> crate::entities::solutions::Model {
    crate::entities::solutions::Model {
        id: test_uuid(3),
        spot_id: test_uuid(2),
        user_id: test_uuid(10),
        match_type: Some("exact".to_string()),
        link_type: Some("product".to_string()),
        title: "Test Solution".to_string(),
        brand_id: None,
        original_url: Some("https://example.com/product".to_string()),
        affiliate_url: None,
        thumbnail_url: Some("https://example.com/thumb.webp".to_string()),
        description: Some("A test solution".to_string()),
        comment: None,
        accurate_count: 5,
        different_count: 1,
        is_verified: false,
        is_adopted: false,
        adopted_at: None,
        click_count: 10,
        purchase_count: 0,
        status: "active".to_string(),
        metadata: Some(json!({})),
        keywords: None,
        qna: None,
        created_at: test_timestamp(),
        updated_at: test_timestamp(),
    }
}

pub fn comment_model() -> crate::entities::comments::Model {
    crate::entities::comments::Model {
        id: test_uuid(4),
        post_id: test_uuid(1),
        user_id: test_uuid(10),
        content: "Test comment".to_string(),
        parent_id: None,
        created_at: test_timestamp(),
        updated_at: test_timestamp(),
    }
}

pub fn vote_model() -> crate::entities::votes::Model {
    crate::entities::votes::Model {
        id: test_uuid(5),
        solution_id: test_uuid(3),
        user_id: test_uuid(10),
        vote_type: "accurate".to_string(),
        created_at: test_timestamp(),
    }
}

pub fn category_model() -> crate::entities::categories::Model {
    crate::entities::categories::Model {
        id: test_uuid(20),
        code: "fashion".to_string(),
        name: json!({"ko": "패션", "en": "Fashion"}),
        icon_url: None,
        color_hex: None,
        description: Some(json!({"ko": "패션 카테고리"})),
        display_order: 1,
        is_active: true,
        created_at: test_timestamp(),
        updated_at: test_timestamp(),
    }
}

pub fn point_log_model() -> crate::entities::point_logs::Model {
    crate::entities::point_logs::Model {
        id: test_uuid(30),
        user_id: test_uuid(10),
        activity_type: "solution_registered".to_string(),
        points: 10,
        ref_id: Some(test_uuid(3)),
        ref_type: Some("solution".to_string()),
        description: Some("Solution registered".to_string()),
        created_at: test_timestamp(),
    }
}

pub fn curation_model() -> crate::entities::curations::Model {
    crate::entities::curations::Model {
        id: test_uuid(40),
        title: "Test Curation".to_string(),
        description: Some("A test curation".to_string()),
        cover_image_url: Some("https://example.com/cover.webp".to_string()),
        display_order: 1,
        is_active: true,
        created_at: test_timestamp(),
        updated_at: test_timestamp(),
    }
}

pub fn search_log_model() -> crate::entities::search_logs::Model {
    crate::entities::search_logs::Model {
        id: test_uuid(50),
        user_id: Some(test_uuid(10)),
        query: "jennie airport".to_string(),
        filters: None,
        created_at: test_timestamp(),
    }
}

pub fn badge_model() -> crate::entities::badges::Model {
    crate::entities::badges::Model {
        id: test_uuid(60),
        r#type: "achievement".to_string(),
        name: "First Post".to_string(),
        description: Some("Created your first post".to_string()),
        icon_url: Some("https://example.com/badge.webp".to_string()),
        criteria: serde_json::json!({"type": "count", "target": null, "threshold": 1}),
        rarity: "common".to_string(),
        created_at: test_timestamp(),
        updated_at: test_timestamp(),
    }
}

pub fn agent_session_model() -> crate::entities::agent_sessions::Model {
    crate::entities::agent_sessions::Model {
        id: test_uuid(70),
        thread_id: "mag-test-thread".to_string(),
        magazine_id: None,
        user_id: test_uuid(10),
        status: "active".to_string(),
        keywords: Some(json!(["test topic"])),
        metadata: Some(json!({
            "topic": "test topic",
            "current_step": "vision",
            "step_status": "pending_confirm",
            "image_urls": [],
            "images_b64": [],
            "images_json": [],
            "outline": {},
            "external_solutions": [],
            "sections": [],
            "layout_spec": {},
            "revision_history": [],
        })),
        created_at: Some(test_timestamp()),
        updated_at: Some(test_timestamp()),
    }
}

pub fn post_magazine_model() -> crate::entities::post_magazines::Model {
    crate::entities::post_magazines::Model {
        id: test_uuid(80),
        title: "Test Magazine".to_string(),
        subtitle: Some("A test subtitle".to_string()),
        keyword: Some("test".to_string()),
        layout_json: Some(json!({"design_spec": {"bg_color": "#123456"}})),
        status: "published".to_string(),
        review_summary: None,
        error_log: None,
        created_at: test_timestamp(),
        updated_at: test_timestamp(),
        published_at: Some(test_timestamp()),
    }
}

pub fn click_log_model() -> crate::entities::click_logs::Model {
    crate::entities::click_logs::Model {
        id: test_uuid(90),
        user_id: Some(test_uuid(10)),
        solution_id: test_uuid(3),
        ip_address: "127.0.0.1".to_string(),
        user_agent: Some("test-agent".to_string()),
        referrer: None,
        created_at: test_timestamp(),
    }
}

/// public.admin_audit_log row — default admin + post target.
pub fn audit_log_model() -> crate::entities::admin_audit_log::Model {
    crate::entities::admin_audit_log::Model {
        id: test_uuid(130),
        admin_user_id: test_uuid(99),
        action: "test.action".to_string(),
        target_table: "posts".to_string(),
        target_id: Some(test_uuid(1)),
        before_state: None,
        after_state: None,
        metadata: None,
        created_at: test_timestamp(),
    }
}

pub fn report_model() -> crate::entities::content_reports::Model {
    crate::entities::content_reports::Model {
        id: test_uuid(100),
        target_type: "post".to_string(),
        target_id: test_uuid(1),
        reporter_id: test_uuid(10),
        reason: "spam".to_string(),
        details: Some("Test spam report".to_string()),
        status: "pending".to_string(),
        resolution: None,
        reviewed_by: None,
        created_at: test_timestamp(),
        updated_at: test_timestamp(),
    }
}

pub fn try_history_model() -> crate::entities::user_tryon_history::Model {
    crate::entities::user_tryon_history::Model {
        id: test_uuid(110),
        user_id: test_uuid(10),
        image_url: "https://example.com/tryon.webp".to_string(),
        created_at: test_timestamp(),
    }
}

/// Count row for SeaORM Paginator (`num_items` column with i64 Value).
/// Use with `append_query_results([[count_row(n)]])` to mock `.count()` calls.
pub fn count_row(n: i64) -> std::collections::BTreeMap<String, sea_orm::Value> {
    let mut map = std::collections::BTreeMap::new();
    map.insert("num_items".to_string(), sea_orm::Value::BigInt(Some(n)));
    map
}

/// UUID tuple row for `into_tuple::<Uuid>()` queries.
/// Column name must match the selected column (e.g., "user_id", "post_id").
pub fn uuid_row(column: &str, id: Uuid) -> std::collections::BTreeMap<String, sea_orm::Value> {
    let mut map = std::collections::BTreeMap::new();
    map.insert(column.to_string(), sea_orm::Value::Uuid(Some(Box::new(id))));
    map
}

/// Optional UUID tuple row for `into_tuple::<Option<Uuid>>()` queries.
pub fn opt_uuid_row(
    column: &str,
    id: Option<Uuid>,
) -> std::collections::BTreeMap<String, sea_orm::Value> {
    let mut map = std::collections::BTreeMap::new();
    map.insert(column.to_string(), sea_orm::Value::Uuid(id.map(Box::new)));
    map
}

pub fn failed_batch_item_model() -> crate::entities::failed_batch_items::Model {
    crate::entities::failed_batch_items::Model {
        id: test_uuid(120),
        item_id: test_uuid(3).to_string(),
        batch_id: "batch-1".to_string(),
        url: "https://example.com/image.webp".to_string(),
        status: "failed".to_string(),
        error_message: Some("timeout".to_string()),
        retry_count: 0,
        next_retry_at: test_timestamp(),
        created_at: test_timestamp(),
        updated_at: test_timestamp(),
    }
}

/// public.artists row — default: id=test_uuid(200), name_en="Danielle", name_ko="다니엘"
pub fn warehouse_artist_model() -> crate::entities::artists::Model {
    crate::entities::artists::Model {
        id: test_uuid(200),
        name_ko: Some("다니엘".to_string()),
        name_en: Some("Danielle".to_string()),
        profile_image_url: Some("https://warehouse.test/artist.webp".to_string()),
        primary_instagram_account_id: None,
        metadata: None,
        created_at: test_timestamp(),
        updated_at: test_timestamp(),
    }
}

/// public.groups row — default: id=test_uuid(201), name_en="NewJeans", name_ko="뉴진스"
pub fn warehouse_group_model() -> crate::entities::groups::Model {
    crate::entities::groups::Model {
        id: test_uuid(201),
        name_ko: Some("뉴진스".to_string()),
        name_en: Some("NewJeans".to_string()),
        profile_image_url: Some("https://warehouse.test/group.webp".to_string()),
        primary_instagram_account_id: None,
        metadata: None,
        created_at: test_timestamp(),
        updated_at: test_timestamp(),
    }
}

pub fn subcategory_model() -> crate::entities::subcategories::Model {
    crate::entities::subcategories::Model {
        id: test_uuid(21),
        category_id: test_uuid(20),
        code: "tops".to_string(),
        name: json!({"ko": "상의", "en": "Tops"}),
        description: Some(json!({"ko": "상의 서브카테고리"})),
        display_order: 1,
        is_active: true,
        created_at: test_timestamp(),
        updated_at: test_timestamp(),
    }
}
