use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(PointLogs::Table)
                    .if_not_exists()
                    .col(uuid(PointLogs::Id).primary_key())
                    .col(uuid(PointLogs::UserId).not_null())
                    .col(string(PointLogs::ActivityType).not_null())
                    .col(integer(PointLogs::Points).not_null())
                    .col(uuid_null(PointLogs::RefId))
                    .col(string_null(PointLogs::RefType))
                    .col(string_null(PointLogs::Description))
                    .col(timestamp(PointLogs::CreatedAt).default(Expr::current_timestamp()))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_point_logs_user")
                            .from(PointLogs::Table, PointLogs::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // 인덱스 생성
        manager
            .create_index(
                Index::create()
                    .name("idx_point_logs_user_id")
                    .table(PointLogs::Table)
                    .col(PointLogs::UserId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_point_logs_created_at")
                    .table(PointLogs::Table)
                    .col(PointLogs::CreatedAt)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_point_logs_user_created")
                    .table(PointLogs::Table)
                    .col(PointLogs::UserId)
                    .col(PointLogs::CreatedAt)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(PointLogs::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum PointLogs {
    Table,
    Id,
    UserId,
    ActivityType,
    Points,
    RefId,
    RefType,
    Description,
    CreatedAt,
}

#[derive(DeriveIden)]
enum Users {
    Table,
    Id,
}
