use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 1. FK 제약 조건 삭제
        manager
            .drop_foreign_key(
                ForeignKey::drop()
                    .name("fk_spots_category_id")
                    .table(Spots::Table)
                    .to_owned(),
            )
            .await?;

        // 2. 인덱스 삭제
        manager
            .drop_index(
                Index::drop()
                    .name("idx_spots_category_id")
                    .table(Spots::Table)
                    .to_owned(),
            )
            .await?;

        // 3. 컬럼 이름 변경: category_id → subcategory_id
        manager
            .alter_table(
                Table::alter()
                    .table(Spots::Table)
                    .rename_column(Spots::CategoryId, Spots::SubcategoryId)
                    .to_owned(),
            )
            .await?;

        // 4. 새로운 FK 제약 조건 추가 (subcategories 참조)
        manager
            .create_foreign_key(
                ForeignKey::create()
                    .name("fk_spots_subcategory_id")
                    .from(Spots::Table, Spots::SubcategoryId)
                    .to(Subcategories::Table, Subcategories::Id)
                    .to_owned(),
            )
            .await?;

        // 5. 새로운 인덱스 추가
        manager
            .create_index(
                Index::create()
                    .name("idx_spots_subcategory_id")
                    .table(Spots::Table)
                    .col(Spots::SubcategoryId)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 1. FK 제약 조건 삭제
        manager
            .drop_foreign_key(
                ForeignKey::drop()
                    .name("fk_spots_subcategory_id")
                    .table(Spots::Table)
                    .to_owned(),
            )
            .await?;

        // 2. 인덱스 삭제
        manager
            .drop_index(
                Index::drop()
                    .name("idx_spots_subcategory_id")
                    .table(Spots::Table)
                    .to_owned(),
            )
            .await?;

        // 3. 컬럼 이름 롤백: subcategory_id → category_id
        manager
            .alter_table(
                Table::alter()
                    .table(Spots::Table)
                    .rename_column(Spots::SubcategoryId, Spots::CategoryId)
                    .to_owned(),
            )
            .await?;

        // 4. 기존 FK 제약 조건 복원 (categories 참조)
        manager
            .create_foreign_key(
                ForeignKey::create()
                    .name("fk_spots_category_id")
                    .from(Spots::Table, Spots::CategoryId)
                    .to(Categories::Table, Categories::Id)
                    .to_owned(),
            )
            .await?;

        // 5. 기존 인덱스 복원
        manager
            .create_index(
                Index::create()
                    .name("idx_spots_category_id")
                    .table(Spots::Table)
                    .col(Spots::CategoryId)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum Spots {
    Table,
    CategoryId,    // 기존 컬럼명
    SubcategoryId, // 새 컬럼명
}

#[derive(DeriveIden)]
enum Subcategories {
    Table,
    Id,
}

#[derive(DeriveIden)]
enum Categories {
    Table,
    Id,
}
