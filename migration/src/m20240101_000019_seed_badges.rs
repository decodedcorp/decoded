use sea_orm_migration::{prelude::*, sea_orm::Statement};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();

        // Achievement 타입 뱃지
        let achievement_badges = vec![
            (
                "First Solver",
                "첫 Solution 등록",
                r#"{"type": "count", "threshold": 1}"#,
                "common",
            ),
            (
                "First Post",
                "첫 Post 생성",
                r#"{"type": "count", "threshold": 1}"#,
                "common",
            ),
            (
                "First Spotter",
                "첫 Spot 생성",
                r#"{"type": "count", "threshold": 1}"#,
                "common",
            ),
        ];

        for (name, description, criteria, rarity) in achievement_badges {
            db.execute(Statement::from_string(
                manager.get_database_backend(),
                format!(
                    r#"INSERT INTO badges (id, type, name, description, criteria, rarity, created_at, updated_at)
                    VALUES (gen_random_uuid(), 'achievement', '{}', '{}', '{}', '{}', NOW(), NOW())"#,
                    name, description, criteria, rarity
                ),
            ))
            .await?;
        }

        // Milestone 타입 뱃지
        let milestone_badges = vec![
            ("10 Solutions", "누적 Solution 10개", 10, "common"),
            ("50 Solutions", "누적 Solution 50개", 50, "rare"),
            ("100 Solutions", "누적 Solution 100개", 100, "rare"),
            ("500 Solutions", "누적 Solution 500개", 500, "epic"),
            ("1000 Solutions", "누적 Solution 1000개", 1000, "legendary"),
        ];

        for (name, description, threshold, rarity) in milestone_badges {
            db.execute(Statement::from_string(
                manager.get_database_backend(),
                format!(
                    r#"INSERT INTO badges (id, type, name, description, criteria, rarity, created_at, updated_at)
                    VALUES (gen_random_uuid(), 'milestone', '{}', '{}', '{{"type": "count", "threshold": {}}}', '{}', NOW(), NOW())"#,
                    name, description, threshold, rarity
                ),
            ))
            .await?;
        }

        // Category 타입 뱃지 (주요 카테고리별)
        let category_badges = vec![
            (
                "Fashion Master",
                "패션 카테고리 Solution 50개 이상",
                "fashion",
            ),
            (
                "Living Master",
                "리빙 카테고리 Solution 50개 이상",
                "living",
            ),
            ("Tech Master", "테크 카테고리 Solution 50개 이상", "tech"),
            (
                "Beauty Master",
                "뷰티 카테고리 Solution 50개 이상",
                "beauty",
            ),
        ];

        for (name, description, category) in category_badges {
            db.execute(Statement::from_string(
                manager.get_database_backend(),
                format!(
                    r#"INSERT INTO badges (id, type, name, description, criteria, rarity, created_at, updated_at)
                    VALUES (gen_random_uuid(), 'category', '{}', '{}', '{{"type": "category", "target": "{}", "threshold": 50}}', 'rare', NOW(), NOW())"#,
                    name, description, category
                ),
            ))
            .await?;
        }

        // Explorer 타입 뱃지 (Post/Spot 조회 활동)
        let explorer_badges = vec![
            (
                "탐험가 (Explorer)",
                "Post 20개 조회 또는 Spot 30개 조회",
                r#"{"type": "explorer_post", "threshold": 20}"#,
                "common",
            ),
            (
                "모험가 (Adventurer)",
                "Post 100개 조회 또는 Spot 150개 조회",
                r#"{"type": "explorer_post", "threshold": 100}"#,
                "rare",
            ),
            (
                "여행자 (Traveler)",
                "Post 500개 조회 또는 Spot 750개 조회",
                r#"{"type": "explorer_post", "threshold": 500}"#,
                "rare",
            ),
            (
                "탐험 마스터 (Exploration Master)",
                "Post 2000개 조회 또는 Spot 3000개 조회",
                r#"{"type": "explorer_post", "threshold": 2000}"#,
                "epic",
            ),
        ];

        for (name, description, criteria, rarity) in explorer_badges {
            db.execute(Statement::from_string(
                manager.get_database_backend(),
                format!(
                    r#"INSERT INTO badges (id, type, name, description, criteria, rarity, created_at, updated_at)
                    VALUES (gen_random_uuid(), 'explorer', '{}', '{}', '{}', '{}', NOW(), NOW())"#,
                    name, description, criteria, rarity
                ),
            ))
            .await?;
        }

        // Shopper 타입 뱃지 (Solution 클릭 활동)
        let shopper_badges = vec![
            ("쇼퍼 (Shopper)", "Solution 10개 클릭", 10, "common"),
            (
                "열정 쇼퍼 (Passionate Shopper)",
                "Solution 50개 클릭",
                50,
                "rare",
            ),
            (
                "마스터 쇼퍼 (Master Shopper)",
                "Solution 200개 클릭",
                200,
                "rare",
            ),
            (
                "전설의 쇼퍼 (Legendary Shopper)",
                "Solution 1000개 클릭",
                1000,
                "epic",
            ),
        ];

        for (name, description, threshold, rarity) in shopper_badges {
            db.execute(Statement::from_string(
                manager.get_database_backend(),
                format!(
                    r#"INSERT INTO badges (id, type, name, description, criteria, rarity, created_at, updated_at)
                    VALUES (gen_random_uuid(), 'shopper', '{}', '{}', '{{"type": "shopper_solution", "threshold": {}}}', '{}', NOW(), NOW())"#,
                    name, description, threshold, rarity
                ),
            ))
            .await?;
        }

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();

        // 시드 데이터 삭제 (타입별로)
        db.execute(Statement::from_string(
            manager.get_database_backend(),
            "DELETE FROM badges WHERE type IN ('achievement', 'milestone', 'category', 'explorer', 'shopper')".to_string(),
        ))
        .await?;

        Ok(())
    }
}
