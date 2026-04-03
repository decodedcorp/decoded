pub use sea_orm_migration::prelude::*;

mod m20240101_000001_create_users;
mod m20240101_000002_create_categories;
mod m20240101_000003_create_posts;
mod m20240101_000004_create_spots;
mod m20240101_000005_create_solutions;
mod m20240101_000006_create_votes;
mod m20240101_000007_create_comments;
mod m20240101_000008_create_synonyms;
mod m20240101_000009_create_search_logs;
mod m20240101_000010_create_curations;
mod m20240101_000011_create_curation_posts;
mod m20240101_000013_create_badges;
mod m20240101_000014_create_user_badges;
mod m20240101_000015_create_click_logs;
mod m20240101_000016_create_earnings;
mod m20240101_000017_create_settlements;
mod m20240101_000018_create_view_logs;
mod m20240101_000019_seed_badges;
mod m20240101_000020_add_trending_score_to_posts;
mod m20260108_005000_create_point_logs;
mod m20260110_000001_create_subcategories;
mod m20260110_000002_update_categories_and_seed_subcategories;
mod m20260110_000003_alter_spots_subcategory_id;
mod m20260111_000001_add_ai_metadata_to_solutions;
mod m20260112_000001_add_comment_to_solutions;
mod m20260126_000001_add_qna_to_solutions;
mod m20260127_000001_update_solutions_schema;
mod m20260129_000001_remove_product_fields_from_solutions;
mod m20260129_000002_rename_solution_product_name_to_title;
mod m20260130_000001_add_link_type_to_solutions;
mod m20260205_000001_create_processed_batches;
mod m20260205_000002_create_failed_batch_items;
mod m20260205_000003_make_subcategory_nullable;
mod m20260205_000004_make_media_title_nullable;
mod m20260205_000005_rename_media_title_to_title;
mod m20260215_000001_add_created_with_solutions_to_posts;
mod m20260316_000001_create_post_magazines;
mod m20260316_000002_add_post_magazine_id_to_posts;
mod m20260317_000001_add_ai_summary_to_posts;
mod m20260318_000001_create_post_likes;
mod m20260318_000002_create_saved_posts;
mod m20260320_000001_add_system_uncategorized_subcategory;
mod m20260403_000001_backfill_created_with_solutions;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20240101_000001_create_users::Migration),
            Box::new(m20240101_000002_create_categories::Migration),
            Box::new(m20240101_000003_create_posts::Migration),
            Box::new(m20240101_000004_create_spots::Migration),
            Box::new(m20240101_000005_create_solutions::Migration),
            Box::new(m20240101_000006_create_votes::Migration),
            Box::new(m20240101_000007_create_comments::Migration),
            Box::new(m20240101_000008_create_synonyms::Migration),
            Box::new(m20240101_000009_create_search_logs::Migration),
            Box::new(m20240101_000010_create_curations::Migration),
            Box::new(m20240101_000011_create_curation_posts::Migration),
            Box::new(m20260108_005000_create_point_logs::Migration),
            Box::new(m20240101_000013_create_badges::Migration),
            Box::new(m20240101_000014_create_user_badges::Migration),
            Box::new(m20240101_000015_create_click_logs::Migration),
            Box::new(m20240101_000016_create_earnings::Migration),
            Box::new(m20240101_000017_create_settlements::Migration),
            Box::new(m20240101_000018_create_view_logs::Migration),
            Box::new(m20240101_000019_seed_badges::Migration),
            Box::new(m20240101_000020_add_trending_score_to_posts::Migration),
            Box::new(m20260110_000001_create_subcategories::Migration),
            Box::new(m20260110_000002_update_categories_and_seed_subcategories::Migration),
            Box::new(m20260110_000003_alter_spots_subcategory_id::Migration),
            Box::new(m20260111_000001_add_ai_metadata_to_solutions::Migration),
            Box::new(m20260112_000001_add_comment_to_solutions::Migration),
            Box::new(m20260126_000001_add_qna_to_solutions::Migration),
            Box::new(m20260127_000001_update_solutions_schema::Migration),
            Box::new(m20260129_000001_remove_product_fields_from_solutions::Migration),
            Box::new(m20260129_000002_rename_solution_product_name_to_title::Migration),
            Box::new(m20260130_000001_add_link_type_to_solutions::Migration),
            Box::new(m20260205_000001_create_processed_batches::Migration),
            Box::new(m20260205_000002_create_failed_batch_items::Migration),
            Box::new(m20260205_000003_make_subcategory_nullable::Migration),
            Box::new(m20260205_000004_make_media_title_nullable::Migration),
            Box::new(m20260205_000005_rename_media_title_to_title::Migration),
            Box::new(m20260215_000001_add_created_with_solutions_to_posts::Migration),
            Box::new(m20260316_000001_create_post_magazines::Migration),
            Box::new(m20260316_000002_add_post_magazine_id_to_posts::Migration),
            Box::new(m20260317_000001_add_ai_summary_to_posts::Migration),
            Box::new(m20260318_000001_create_post_likes::Migration),
            Box::new(m20260318_000002_create_saved_posts::Migration),
            Box::new(m20260320_000001_add_system_uncategorized_subcategory::Migration),
            Box::new(m20260403_000001_backfill_created_with_solutions::Migration),
        ]
    }
}
