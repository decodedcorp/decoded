use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // votes 테이블 생성
        manager
            .create_table(
                Table::create()
                    .table(Votes::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Votes::Id)
                            .uuid()
                            .not_null()
                            .primary_key()
                            .comment("Vote ID"),
                    )
                    .col(
                        ColumnDef::new(Votes::SolutionId)
                            .uuid()
                            .not_null()
                            .comment("Solution ID (references solutions)"),
                    )
                    .col(
                        ColumnDef::new(Votes::UserId)
                            .uuid()
                            .not_null()
                            .comment("User ID (references users)"),
                    )
                    .col(
                        ColumnDef::new(Votes::VoteType)
                            .string_len(20)
                            .not_null()
                            .comment("Vote type: accurate | different"),
                    )
                    .col(
                        timestamp_with_time_zone(Votes::CreatedAt)
                            .default(Expr::current_timestamp())
                            .comment("Vote creation timestamp"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_votes_solution_id")
                            .from(Votes::Table, Votes::SolutionId)
                            .to(Solutions::Table, Solutions::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_votes_user_id")
                            .from(Votes::Table, Votes::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // UNIQUE 제약조건 추가 (한 사용자는 한 Solution에 한 번만 투표 가능)
        manager
            .create_index(
                Index::create()
                    .name("idx_votes_solution_user_unique")
                    .table(Votes::Table)
                    .col(Votes::SolutionId)
                    .col(Votes::UserId)
                    .unique()
                    .to_owned(),
            )
            .await?;

        // solution_id 인덱스 (투표 현황 조회 시 사용)
        manager
            .create_index(
                Index::create()
                    .name("idx_votes_solution_id")
                    .table(Votes::Table)
                    .col(Votes::SolutionId)
                    .to_owned(),
            )
            .await?;

        // user_id 인덱스 (사용자별 투표 내역 조회 시 사용)
        manager
            .create_index(
                Index::create()
                    .name("idx_votes_user_id")
                    .table(Votes::Table)
                    .col(Votes::UserId)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // votes 테이블 삭제
        manager
            .drop_table(Table::drop().table(Votes::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Votes {
    Table,
    Id,
    SolutionId,
    UserId,
    VoteType,
    CreatedAt,
}

#[derive(DeriveIden)]
enum Solutions {
    Table,
    Id,
}

#[derive(DeriveIden)]
enum Users {
    Table,
    Id,
}
