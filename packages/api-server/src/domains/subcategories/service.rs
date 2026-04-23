//! Subcategories service

use sea_orm::{
    ColumnTrait, ConnectionTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder,
};
use uuid::Uuid;

use crate::{
    domains::categories::service::get_category_by_id,
    entities::{
        subcategories::Column as SubcategoryColumn, subcategories::Entity as Subcategories,
        subcategories::Model as SubcategoryModel,
    },
    error::{AppError, AppResult},
};

use super::dto::{CategoryWithSubcategories, SubcategoryName, SubcategoryResponse};

/// 모든 Subcategories 조회 (Category별 그룹화)
pub async fn list_all_with_categories(
    db: &DatabaseConnection,
) -> AppResult<Vec<CategoryWithSubcategories>> {
    use crate::entities::categories::{Column as CategoryColumn, Entity as Categories};

    // 모든 활성 카테고리 조회
    let categories = Categories::find()
        .filter(CategoryColumn::IsActive.eq(true))
        .order_by_asc(CategoryColumn::DisplayOrder)
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;

    let mut result = Vec::new();

    for category in categories {
        // 각 카테고리의 서브카테고리 조회
        let subcategories = Subcategories::find()
            .filter(SubcategoryColumn::CategoryId.eq(category.id))
            .filter(SubcategoryColumn::IsActive.eq(true))
            .order_by_asc(SubcategoryColumn::DisplayOrder)
            .all(db)
            .await
            .map_err(AppError::DatabaseError)?;

        let subcategory_responses: Vec<SubcategoryResponse> = subcategories
            .into_iter()
            .map(subcategory_model_to_response)
            .collect();

        result.push(CategoryWithSubcategories {
            category: crate::domains::categories::service::get_category_by_id(db, category.id)
                .await?,
            subcategories: subcategory_responses,
        });
    }

    Ok(result)
}

/// 특정 카테고리의 Subcategories 조회
pub async fn list_subcategories_by_category(
    db: &DatabaseConnection,
    category_id: Uuid,
) -> AppResult<Vec<SubcategoryResponse>> {
    // 카테고리 존재 확인
    let _category = get_category_by_id(db, category_id).await?;

    // 서브카테고리 조회
    let subcategories = Subcategories::find()
        .filter(SubcategoryColumn::CategoryId.eq(category_id))
        .filter(SubcategoryColumn::IsActive.eq(true))
        .order_by_asc(SubcategoryColumn::DisplayOrder)
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(subcategories
        .into_iter()
        .map(subcategory_model_to_response)
        .collect())
}

/// Subcategory code로 조회
pub async fn get_subcategory_by_code(
    db: &DatabaseConnection,
    code: &str,
) -> AppResult<SubcategoryResponse> {
    let subcategory = Subcategories::find()
        .filter(SubcategoryColumn::Code.eq(code))
        .one(db)
        .await
        .map_err(AppError::DatabaseError)?
        .ok_or_else(|| AppError::not_found("Subcategory를 찾을 수 없습니다"))?;

    Ok(subcategory_model_to_response(subcategory))
}

/// Subcategory ID로 조회
pub async fn get_subcategory_by_id(
    db: &DatabaseConnection,
    id: Uuid,
) -> AppResult<SubcategoryResponse> {
    let subcategory = Subcategories::find_by_id(id)
        .one(db)
        .await
        .map_err(AppError::DatabaseError)?
        .ok_or_else(|| AppError::not_found("Subcategory를 찾을 수 없습니다"))?;

    Ok(subcategory_model_to_response(subcategory))
}

/// `system` 카테고리 하위 `uncategorized` 서브카테고리 ID (마이그레이션 시드 필요)
pub async fn resolve_uncategorized_subcategory_id(db: &impl ConnectionTrait) -> AppResult<Uuid> {
    use crate::entities::categories::{Column as CategoryColumn, Entity as Categories};

    let category = Categories::find()
        .filter(CategoryColumn::Code.eq("system"))
        .one(db)
        .await
        .map_err(AppError::DatabaseError)?
        .ok_or_else(|| {
            AppError::InternalError(
                "system category not found — apply \
                 supabase/migrations/20260423075700_seed_system_uncategorized.sql \
                 (or SeaORM m20260320_000001_add_system_uncategorized_subcategory)"
                    .to_string(),
            )
        })?;

    let sub = Subcategories::find()
        .filter(SubcategoryColumn::CategoryId.eq(category.id))
        .filter(SubcategoryColumn::Code.eq("uncategorized"))
        .one(db)
        .await
        .map_err(AppError::DatabaseError)?
        .ok_or_else(|| {
            AppError::InternalError(
                "uncategorized subcategory not found — apply \
                 supabase/migrations/20260423075700_seed_system_uncategorized.sql \
                 (or SeaORM m20260320_000001_add_system_uncategorized_subcategory)"
                    .to_string(),
            )
        })?;

    Ok(sub.id)
}

/// subcategory_id가 `subcategories`에 존재하는지 검증
pub async fn ensure_subcategory_exists(db: &impl ConnectionTrait, id: Uuid) -> AppResult<()> {
    let exists = Subcategories::find_by_id(id)
        .one(db)
        .await
        .map_err(AppError::DatabaseError)?
        .is_some();
    if !exists {
        return Err(AppError::BadRequest(format!(
            "Invalid subcategory_id: {}",
            id
        )));
    }
    Ok(())
}

/// SubcategoryModel을 SubcategoryResponse로 변환
fn subcategory_model_to_response(model: SubcategoryModel) -> SubcategoryResponse {
    SubcategoryResponse {
        id: model.id,
        code: model.code,
        name: SubcategoryName::from(model.name),
        display_order: model.display_order,
        is_active: model.is_active,
    }
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;

    #[test]
    fn test_subcategory_name_from_json() {
        let json = serde_json::json!({
            "ko": "모자",
            "en": "Headwear"
        });

        let name = SubcategoryName::from(json);
        assert_eq!(name.ko, "모자");
        assert_eq!(name.en, "Headwear");
    }
}
