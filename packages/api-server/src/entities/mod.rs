//! Database entities generated from migrations
//!
//! SeaORM entities for interacting with database tables
//!
//! `DeriveEntityModel` 등 SeaORM 매크로 전개 코드에 `unwrap`이 포함되어 Clippy
//! `disallowed_methods`와 충돌하므로 이 모듈 트리에서만 허용합니다.
#![allow(clippy::disallowed_methods)]

pub mod agent_sessions;
pub mod badges;
pub mod categories;
pub mod click_logs;
pub mod comments;
pub mod content_reports;
pub mod curation_posts;
pub mod curations;
pub mod earnings;
pub mod failed_batch_items;
pub mod point_logs;
pub mod post_likes;
pub mod post_magazine_news_references;
pub mod post_magazines;
pub mod posts;
pub mod processed_batches;
pub mod saved_posts;
pub mod search_logs;
pub mod settlements;
pub mod solutions;
pub mod spots;
pub mod subcategories;
pub mod synonyms;
pub mod try_spot_tags;
pub mod user_badges;
pub mod user_tryon_history;
pub mod users;
pub mod view_logs;
pub mod votes;

pub use categories::ActiveModel as CategoriesActiveModel;
pub use categories::Entity as Categories;
pub use categories::Model as CategoriesModel;

pub use subcategories::ActiveModel as SubcategoriesActiveModel;
pub use subcategories::Entity as Subcategories;
pub use subcategories::Model as SubcategoriesModel;

pub use comments::ActiveModel as CommentsActiveModel;
pub use comments::Entity as Comments;
pub use comments::Model as CommentsModel;

pub use posts::ActiveModel as PostsActiveModel;
pub use posts::Entity as Posts;
pub use posts::Model as PostsModel;

pub use solutions::ActiveModel as SolutionsActiveModel;
pub use solutions::Entity as Solutions;
pub use solutions::Model as SolutionsModel;

pub use spots::ActiveModel as SpotsActiveModel;
pub use spots::Entity as Spots;
pub use spots::Model as SpotsModel;

pub use users::ActiveModel as UsersActiveModel;
pub use users::Entity as Users;
pub use users::Model as UsersModel;

pub use votes::ActiveModel as VotesActiveModel;
pub use votes::Entity as Votes;
pub use votes::Model as VotesModel;

pub use search_logs::ActiveModel as SearchLogsActiveModel;
pub use search_logs::Entity as SearchLogs;
pub use search_logs::Model as SearchLogsModel;

pub use synonyms::ActiveModel as SynonymsActiveModel;
pub use synonyms::Entity as Synonyms;
pub use synonyms::Model as SynonymsModel;

pub use curations::ActiveModel as CurationsActiveModel;
pub use curations::Entity as Curations;
pub use curations::Model as CurationsModel;

pub use curation_posts::ActiveModel as CurationPostsActiveModel;
pub use curation_posts::Entity as CurationPosts;
pub use curation_posts::Model as CurationPostsModel;

pub use point_logs::ActiveModel as PointLogsActiveModel;
pub use point_logs::Entity as PointLogs;
pub use point_logs::Model as PointLogsModel;

pub use badges::ActiveModel as BadgesActiveModel;
pub use badges::Entity as Badges;
pub use badges::Model as BadgesModel;

pub use user_badges::ActiveModel as UserBadgesActiveModel;
pub use user_badges::Entity as UserBadges;
pub use user_badges::Model as UserBadgesModel;

pub use click_logs::ActiveModel as ClickLogsActiveModel;
pub use click_logs::Entity as ClickLogs;
pub use click_logs::Model as ClickLogsModel;

pub use content_reports::ActiveModel as ContentReportsActiveModel;
pub use content_reports::Entity as ContentReports;
pub use content_reports::Model as ContentReportsModel;

pub use earnings::ActiveModel as EarningsActiveModel;
pub use earnings::Entity as Earnings;
pub use earnings::Model as EarningsModel;

pub use settlements::ActiveModel as SettlementsActiveModel;
pub use settlements::Entity as Settlements;
pub use settlements::Model as SettlementsModel;

pub use view_logs::ActiveModel as ViewLogsActiveModel;
pub use view_logs::Entity as ViewLogs;
pub use view_logs::Model as ViewLogsModel;

pub use post_likes::ActiveModel as PostLikesActiveModel;
pub use post_likes::Entity as PostLikes;
pub use post_likes::Model as PostLikesModel;

pub use post_magazines::ActiveModel as PostMagazinesActiveModel;
pub use post_magazines::Entity as PostMagazines;
pub use post_magazines::Model as PostMagazinesModel;

pub use saved_posts::ActiveModel as SavedPostsActiveModel;
pub use saved_posts::Entity as SavedPosts;
pub use saved_posts::Model as SavedPostsModel;

pub use processed_batches::ActiveModel as ProcessedBatchesActiveModel;
pub use processed_batches::Entity as ProcessedBatches;
pub use processed_batches::Model as ProcessedBatchesModel;

pub use failed_batch_items::ActiveModel as FailedBatchItemsActiveModel;
pub use failed_batch_items::Entity as FailedBatchItems;
pub use failed_batch_items::Model as FailedBatchItemsModel;

pub use agent_sessions::ActiveModel as AgentSessionsActiveModel;
pub use agent_sessions::Entity as AgentSessions;
pub use agent_sessions::Model as AgentSessionsModel;

pub use try_spot_tags::ActiveModel as TrySpotTagsActiveModel;
pub use try_spot_tags::Entity as TrySpotTags;
pub use try_spot_tags::Model as TrySpotTagsModel;

pub use user_tryon_history::ActiveModel as UserTryonHistoryActiveModel;
pub use user_tryon_history::Entity as UserTryonHistory;
pub use user_tryon_history::Model as UserTryonHistoryModel;
