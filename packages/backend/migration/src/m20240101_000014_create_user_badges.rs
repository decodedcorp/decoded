use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // user_badges 테이블 생성
        manager
            .create_table(
                Table::create()
                    .table(UserBadges::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(UserBadges::UserId)
                            .uuid()
                            .not_null()
                            .comment("User ID (references users)"),
                    )
                    .col(
                        ColumnDef::new(UserBadges::BadgeId)
                            .uuid()
                            .not_null()
                            .comment("Badge ID (references badges)"),
                    )
                    .col(
                        timestamp_with_time_zone(UserBadges::EarnedAt)
                            .default(Expr::current_timestamp())
                            .not_null()
                            .comment("Badge earned timestamp"),
                    )
                    .primary_key(
                        Index::create()
                            .name("pk_user_badges")
                            .col(UserBadges::UserId)
                            .col(UserBadges::BadgeId),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_user_badges_user_id")
                            .from(UserBadges::Table, UserBadges::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_user_badges_badge_id")
                            .from(UserBadges::Table, UserBadges::BadgeId)
                            .to(Badges::Table, Badges::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // 인덱스 추가
        manager
            .create_index(
                Index::create()
                    .name("idx_user_badges_user_id")
                    .table(UserBadges::Table)
                    .col(UserBadges::UserId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_user_badges_badge_id")
                    .table(UserBadges::Table)
                    .col(UserBadges::BadgeId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_user_badges_earned_at")
                    .table(UserBadges::Table)
                    .col(UserBadges::EarnedAt)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(UserBadges::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum UserBadges {
    Table,
    UserId,
    BadgeId,
    EarnedAt,
}

#[derive(DeriveIden)]
enum Users {
    Table,
    Id,
}

#[derive(DeriveIden)]
enum Badges {
    Table,
    Id,
}
