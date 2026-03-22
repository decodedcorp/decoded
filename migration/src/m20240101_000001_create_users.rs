use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // users 테이블 생성
        manager
            .create_table(
                Table::create()
                    .table(Users::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Users::Id)
                            .uuid()
                            .not_null()
                            .primary_key()
                            .comment("User ID (references auth.users)"),
                    )
                    .col(
                        ColumnDef::new(Users::Email)
                            .string_len(255)
                            .not_null()
                            .unique_key()
                            .comment("User email"),
                    )
                    .col(
                        ColumnDef::new(Users::Username)
                            .string_len(50)
                            .not_null()
                            .unique_key()
                            .comment("Unique username"),
                    )
                    .col(
                        ColumnDef::new(Users::DisplayName)
                            .string_len(100)
                            .comment("Display name"),
                    )
                    .col(
                        ColumnDef::new(Users::AvatarUrl)
                            .text()
                            .comment("Avatar image URL"),
                    )
                    .col(ColumnDef::new(Users::Bio).text().comment("User bio"))
                    .col(
                        ColumnDef::new(Users::Rank)
                            .string_len(20)
                            .not_null()
                            .default("Member")
                            .comment("User rank: Member | Contributor | Expert"),
                    )
                    .col(
                        ColumnDef::new(Users::TotalPoints)
                            .integer()
                            .not_null()
                            .default(0)
                            .comment("Total points earned"),
                    )
                    .col(
                        ColumnDef::new(Users::IsAdmin)
                            .boolean()
                            .not_null()
                            .default(false)
                            .comment("Admin privilege flag"),
                    )
                    .col(
                        timestamp_with_time_zone(Users::CreatedAt)
                            .default(Expr::current_timestamp())
                            .comment("Record creation timestamp"),
                    )
                    .col(
                        timestamp_with_time_zone(Users::UpdatedAt)
                            .default(Expr::current_timestamp())
                            .comment("Record last update timestamp"),
                    )
                    .to_owned(),
            )
            .await?;

        // users 테이블에 외래키 추가 (auth.users 참조)
        // Note: Supabase의 auth.users 테이블을 참조하는 FK는 직접 SQL로 추가해야 함
        // SeaORM의 ForeignKey는 같은 스키마 내의 테이블만 지원
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                ALTER TABLE users
                ADD CONSTRAINT fk_users_auth_users
                FOREIGN KEY (id) REFERENCES auth.users(id)
                ON DELETE CASCADE;
                "#,
            )
            .await?;

        // updated_at 자동 업데이트 트리거 함수 생성
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE OR REPLACE FUNCTION update_updated_at_column()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = NOW();
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
                "#,
            )
            .await?;

        // users 테이블에 updated_at 트리거 추가
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TRIGGER update_users_updated_at
                BEFORE UPDATE ON users
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
                "#,
            )
            .await?;

        // 인덱스 생성
        manager
            .create_index(
                Index::create()
                    .name("idx_users_email")
                    .table(Users::Table)
                    .col(Users::Email)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_users_username")
                    .table(Users::Table)
                    .col(Users::Username)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_users_rank")
                    .table(Users::Table)
                    .col(Users::Rank)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 트리거 삭제
        manager
            .get_connection()
            .execute_unprepared("DROP TRIGGER IF EXISTS update_users_updated_at ON users;")
            .await?;

        // 트리거 함수 삭제 (다른 테이블에서도 사용할 수 있으므로 주의)
        manager
            .get_connection()
            .execute_unprepared("DROP FUNCTION IF EXISTS update_updated_at_column();")
            .await?;

        // users 테이블 삭제
        manager
            .drop_table(Table::drop().table(Users::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Users {
    Table,
    Id,
    Email,
    Username,
    DisplayName,
    AvatarUrl,
    Bio,
    Rank,
    TotalPoints,
    IsAdmin,
    CreatedAt,
    UpdatedAt,
}
