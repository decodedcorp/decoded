use super::*;
use chrono::{FixedOffset, Utc};
use serde_json::json;
use validator::Validate;

fn ts() -> chrono::DateTime<FixedOffset> {
    Utc::now().with_timezone(&FixedOffset::east_opt(0).unwrap())
}

fn sample_post(m: &str) -> PostModel {
    let t = ts();
    PostModel {
        id: Uuid::nil(),
        user_id: Uuid::nil(),
        image_url: "https://cdn.example/img.png".into(),
        media_type: m.into(),
        title: Some("t".into()),
        media_metadata: None,
        group_name: None,
        artist_name: None,
        artist_id: None,
        group_id: None,
        context: None,
        view_count: 3,
        status: "active".into(),
        trending_score: None,
        created_with_solutions: Some(true),
        post_magazine_id: None,
        ai_summary: None,
        style_tags: None,
        image_width: None,
        image_height: None,
        parent_post_id: None,
        post_type: None,
        created_at: t,
        updated_at: t,
    }
}

fn sample_user() -> UsersModel {
    let t = ts();
    UsersModel {
        id: Uuid::nil(),
        email: "u@example.com".into(),
        username: "user".into(),
        display_name: None,
        avatar_url: None,
        bio: None,
        rank: "gold".into(),
        total_points: 0,
        is_admin: false,
        ink_credits: 0,
        style_dna: None,
        created_at: t,
        updated_at: t,
    }
}

#[test]
fn posts_dto_validation_serde_and_entity_helpers() {
    let ms_bad =
        |mt: &str, d: Option<String>| MediaSourceDto { media_type: mt.into(), description: d };
    assert!(ms_bad("", None).validate().is_err());
    assert!(ms_bad(&"x".repeat(129), None).validate().is_err());
    assert!(ms_bad("mv", Some("y".repeat(10_001))).validate().is_err());
    let ser = serde_json::to_value(&MediaSourceDto {
        media_type: "music_video".into(),
        description: None,
    })
    .unwrap();
    assert_eq!(ser.get("type").and_then(|x| x.as_str()), Some("music_video"));
    assert!(ser.get("description").is_none());
    let parsed: MediaSourceDto =
        serde_json::from_str(r#"{"type":"movie","description":"scene"}"#).unwrap();
    assert_eq!(parsed.media_type(), "movie");
    assert_eq!(parsed.description(), Some("scene"));

    assert!(CreateSolutionInlineDto {
        original_url: String::new(),
        title: None,
        metadata: None,
        description: None,
        comment: None,
        thumbnail_url: None,
        brand_id: None,
    }
    .validate()
    .is_err());
    let sol = CreateSolutionInlineDto {
        original_url: "https://shop.example/p".into(),
        title: None,
        metadata: Some(json!({"price": "10"})),
        description: None,
        comment: None,
        thumbnail_url: None,
        brand_id: None,
    };
    assert!(sol.validate().is_ok());
    let sj = serde_json::to_value(&sol).unwrap();
    assert!(sj.get("metadata").is_some() && sj.get("title").is_none());

    assert!(CreateSpotDto {
        position_left: String::new(),
        position_top: "1".into(),
        subcategory_id: None,
        solutions: vec![],
    }
    .validate()
    .is_err());
    let spot: CreateSpotDto =
        serde_json::from_str(r#"{"position_left":"5","position_top":"6"}"#).unwrap();
    assert!(spot.subcategory_id.is_none() && spot.solutions.is_empty() && spot.validate().is_ok());

    let spot_ok = || CreateSpotDto {
        position_left: "10".into(),
        position_top: "20".into(),
        subcategory_id: None,
        solutions: vec![],
    };
    let ms_ok = || MediaSourceDto {
        media_type: "drama".into(),
        description: None,
    };
    assert!(CreatePostDto {
        image_url: "https://i".into(),
        media_source: MediaSourceDto {
            media_type: String::new(),
            description: None,
        },
        metadata: None,
        group_name: None,
        group_id: None,
        artist_name: None,
        artist_id: None,
        context: None,
        image_width: None,
        image_height: None,
        spots: vec![spot_ok()],
    }
    .validate()
    .is_err());
    assert!(CreatePostDto {
        image_url: "https://i".into(),
        media_source: ms_ok(),
        metadata: None,
        group_name: None,
        group_id: None,
        artist_name: None,
        artist_id: None,
        context: None,
        image_width: None,
        image_height: None,
        spots: vec![],
    }
    .validate()
    .is_err());
    assert!(CreatePostDto {
        image_url: "https://cdn/x.png".into(),
        media_source: ms_ok(),
        metadata: None,
        group_name: None,
        group_id: None,
        artist_name: None,
        artist_id: None,
        context: None,
        image_width: None,
        image_height: None,
        spots: vec![spot_ok()],
    }
    .validate()
    .is_ok());

    let z257 = "z".repeat(257);
    assert!(UpdatePostDto {
        media_source: None,
        group_name: Some(z257.clone()),
        artist_name: None,
        context: None,
        status: None,
    }
    .validate()
    .is_err());
    assert!(UpdatePostDto {
        media_source: None,
        group_name: None,
        artist_name: Some(z257),
        context: None,
        status: None,
    }
    .validate()
    .is_err());
    assert!(UpdatePostDto {
        media_source: None,
        group_name: None,
        artist_name: None,
        context: Some("c".repeat(513)),
        status: None,
    }
    .validate()
    .is_err());
    assert!(UpdatePostDto {
        media_source: None,
        group_name: None,
        artist_name: None,
        context: None,
        status: Some("s".repeat(33)),
    }
    .validate()
    .is_err());
    assert!(UpdatePostDto {
        media_source: Some(ms_ok()),
        group_name: Some("g".into()),
        artist_name: None,
        context: None,
        status: Some("active".into()),
    }
    .validate()
    .is_ok());

    let q: PostListQuery = serde_json::from_str("{}").unwrap();
    assert_eq!((q.sort.as_str(), q.page, q.per_page), ("recent", 1, 20));

    let p0 = sample_post("variety");
    let ext = extract_media_source_from_model(&p0);
    assert_eq!(ext.media_type, "variety");
    assert!(ext.description.is_none());

    let post = sample_post("movie");
    let pr = PostResponse::from(post.clone());
    assert_eq!(pr.media_source.media_type, "movie");
    assert_eq!(pr.image_url, "https://cdn.example/img.png");

    let user = sample_user();
    let media = ms_ok();
    let spot = SpotWithTopSolution {
        id: Uuid::nil(),
        position_left: "0".into(),
        position_top: "0".into(),
        category: None,
        status: "active".into(),
        solution_count: 0,
        top_solution: None,
        created_at: Utc::now(),
    };
    let d0 = PostDetailResponse::from_post_model(
        post.clone(),
        user.clone(),
        media.clone(),
        None,
        2,
        5,
        Some(false),
        Some(true),
    );
    assert!(d0.spots.is_empty());
    assert_eq!(
        (
            d0.user.username.as_str(),
            d0.comment_count,
            d0.like_count,
            d0.user_has_liked,
            d0.user_has_saved
        ),
        ("user", 2, 5, Some(false), Some(true))
    );
    assert_eq!(
        PostDetailResponse::from_post_model(post, user, media, Some(vec![spot]), 0, 0, None, None)
            .spots
            .len(),
        1
    );

    let item: ItemWithCoordinates =
        serde_json::from_str(r#"{"sub_category":"Headwear","type":"cap","top":"1","left":"2"}"#)
            .unwrap();
    assert_eq!((item.sub_category.as_str(), item.r#type.as_str()), ("Headwear", "cap"));
    let out = serde_json::to_value(&item).unwrap();
    assert_eq!(
        (
            out.get("sub_category").and_then(|v| v.as_str()),
            out.get("type").and_then(|v| v.as_str())
        ),
        (Some("Headwear"), Some("cap"))
    );
}
