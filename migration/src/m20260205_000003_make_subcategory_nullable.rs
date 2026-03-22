use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // FK 제약 조건을 일시적으로 삭제 (nullable 변경을 위해)
        manager
            .drop_foreign_key(
                ForeignKey::drop()
                    .name("fk_spots_subcategory_id")
                    .table(Spots::Table)
                    .to_owned(),
            )
            .await?;

        // 컬럼을 nullable로 변경
        manager
            .alter_table(
                Table::alter()
                    .table(Spots::Table)
                    .modify_column(ColumnDef::new(Spots::SubcategoryId).uuid().null())
                    .to_owned(),
            )
            .await?;

        // FK 제약 조건 재추가 (nullable 컬럼에 대한 FK는 가능)
        manager
            .create_foreign_key(
                ForeignKey::create()
                    .name("fk_spots_subcategory_id")
                    .from(Spots::Table, Spots::SubcategoryId)
                    .to(Subcategories::Table, Subcategories::Id)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // FK 제약 조건 삭제
        manager
            .drop_foreign_key(
                ForeignKey::drop()
                    .name("fk_spots_subcategory_id")
                    .table(Spots::Table)
                    .to_owned(),
            )
            .await?;

        // 기존 NULL 값이 있다면 먼저 처리 필요 (롤백 시)
        // 여기서는 간단히 NOT NULL로 복원
        manager
            .alter_table(
                Table::alter()
                    .table(Spots::Table)
                    .modify_column(ColumnDef::new(Spots::SubcategoryId).uuid().not_null())
                    .to_owned(),
            )
            .await?;

        // FK 제약 조건 재추가
        manager
            .create_foreign_key(
                ForeignKey::create()
                    .name("fk_spots_subcategory_id")
                    .from(Spots::Table, Spots::SubcategoryId)
                    .to(Subcategories::Table, Subcategories::Id)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum Spots {
    Table,
    SubcategoryId,
}

#[derive(DeriveIden)]
enum Subcategories {
    Table,
    Id,
}
