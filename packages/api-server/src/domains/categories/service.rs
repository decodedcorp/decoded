//! Categories service
//!
//! 카테고리 관련 비즈니스 로직

use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder, Set,
    TransactionTrait,
};
use serde_json::Value;

use uuid::Uuid;

use crate::{
    entities::categories::{ActiveModel, Column, Entity as Categories, Model as CategoryModel},
    error::{AppError, AppResult},
};

use super::dto::{CategoryDescription, CategoryName, CategoryResponse};

/// 카테고리 ID로 조회
pub async fn get_category_by_id(
    db: &DatabaseConnection,
    category_id: Uuid,
) -> AppResult<CategoryResponse> {
    let category = Categories::find_by_id(category_id)
        .one(db)
        .await
        .map_err(AppError::DatabaseError)?
        .ok_or_else(|| AppError::NotFound(format!("Category not found: {}", category_id)))?;

    category_model_to_response(category)
}

/// 활성화된 카테고리 목록 조회
pub async fn list_active_categories(db: &DatabaseConnection) -> AppResult<Vec<CategoryResponse>> {
    let categories = Categories::find()
        .filter(Column::IsActive.eq(true))
        .order_by_asc(Column::DisplayOrder)
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;

    categories
        .into_iter()
        .map(category_model_to_response)
        .collect::<Result<Vec<_>, _>>()
}

/// CategoryModel을 CategoryResponse로 변환
fn category_model_to_response(model: CategoryModel) -> AppResult<CategoryResponse> {
    // JSONB name 파싱
    let name_value: Value = serde_json::from_value(model.name.clone())
        .map_err(|e| AppError::InternalError(format!("Failed to parse category name: {}", e)))?;

    let name = CategoryName {
        ko: name_value
            .get("ko")
            .and_then(|v| v.as_str())
            .ok_or_else(|| AppError::InternalError("Missing 'ko' in category name".to_string()))?
            .to_string(),
        en: name_value
            .get("en")
            .and_then(|v| v.as_str())
            .ok_or_else(|| AppError::InternalError("Missing 'en' in category name".to_string()))?
            .to_string(),
        ja: name_value
            .get("ja")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
    };

    // JSONB description 파싱 (옵션)
    let description = if let Some(desc_value) = model.description {
        let desc_json: Value = serde_json::from_value(desc_value)
            .map_err(|e| AppError::InternalError(format!("Failed to parse description: {}", e)))?;

        Some(CategoryDescription {
            ko: desc_json
                .get("ko")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string()),
            en: desc_json
                .get("en")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string()),
            ja: desc_json
                .get("ja")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string()),
        })
    } else {
        None
    };

    Ok(CategoryResponse {
        id: model.id,
        code: model.code,
        name,
        icon_url: model.icon_url,
        color_hex: model.color_hex,
        description,
        display_order: model.display_order,
        is_active: model.is_active,
    })
}

/// Admin용 카테고리 생성
pub async fn admin_create_category(
    db: &DatabaseConnection,
    dto: crate::domains::admin::categories::CreateCategoryDto,
) -> AppResult<CategoryResponse> {
    // 코드 중복 확인
    let existing = Categories::find()
        .filter(Column::Code.eq(&dto.code))
        .one(db)
        .await
        .map_err(AppError::DatabaseError)?;

    if existing.is_some() {
        return Err(AppError::BadRequest(format!(
            "Category with code '{}' already exists",
            dto.code
        )));
    }

    // display_order 결정 (없으면 마지막 순서 + 1)
    let display_order = if let Some(order) = dto.display_order {
        order
    } else {
        let max_order = Categories::find()
            .order_by_desc(Column::DisplayOrder)
            .one(db)
            .await
            .map_err(AppError::DatabaseError)?
            .map(|cat| cat.display_order)
            .unwrap_or(0);
        max_order + 1
    };

    // JSONB name 생성
    let mut name_json = serde_json::Map::new();
    name_json.insert("ko".to_string(), Value::String(dto.name.ko));
    name_json.insert("en".to_string(), Value::String(dto.name.en));
    if let Some(ja) = dto.name.ja {
        name_json.insert("ja".to_string(), Value::String(ja));
    }

    // JSONB description 생성 (옵션)
    let description_json = dto.description.map(|desc| {
        let mut desc_map = serde_json::Map::new();
        if let Some(ko) = desc.ko {
            desc_map.insert("ko".to_string(), Value::String(ko));
        }
        if let Some(en) = desc.en {
            desc_map.insert("en".to_string(), Value::String(en));
        }
        if let Some(ja) = desc.ja {
            desc_map.insert("ja".to_string(), Value::String(ja));
        }
        Value::Object(desc_map)
    });

    // ActiveModel 생성
    let category = ActiveModel {
        code: Set(dto.code),
        name: Set(Value::Object(name_json)),
        icon_url: Set(dto.icon_url),
        color_hex: Set(dto.color_hex),
        description: Set(description_json),
        display_order: Set(display_order),
        is_active: Set(true), // 기본값: 활성화
        ..Default::default()
    };

    // DB 저장
    let saved_category = category.insert(db).await.map_err(AppError::DatabaseError)?;

    category_model_to_response(saved_category)
}

/// Admin용 카테고리 수정
pub async fn admin_update_category(
    db: &DatabaseConnection,
    category_id: Uuid,
    dto: crate::domains::admin::categories::UpdateCategoryDto,
) -> AppResult<CategoryResponse> {
    // 카테고리 존재 확인
    let category = Categories::find_by_id(category_id)
        .one(db)
        .await
        .map_err(AppError::DatabaseError)?
        .ok_or_else(|| AppError::NotFound(format!("Category not found: {}", category_id)))?;

    // 코드 중복 확인 (변경하는 경우)
    if let Some(ref new_code) = dto.code {
        if new_code != &category.code {
            let existing = Categories::find()
                .filter(Column::Code.eq(new_code))
                .one(db)
                .await
                .map_err(AppError::DatabaseError)?;

            if existing.is_some() {
                return Err(AppError::BadRequest(format!(
                    "Category with code '{}' already exists",
                    new_code
                )));
            }
        }
    }

    // ActiveModel로 변환하여 업데이트
    let mut active_category: ActiveModel = category.into();

    if let Some(code) = dto.code {
        active_category.code = Set(code);
    }

    if let Some(name) = dto.name {
        let mut name_json = serde_json::Map::new();
        name_json.insert("ko".to_string(), Value::String(name.ko));
        name_json.insert("en".to_string(), Value::String(name.en));
        if let Some(ja) = name.ja {
            name_json.insert("ja".to_string(), Value::String(ja));
        }
        active_category.name = Set(Value::Object(name_json));
    }

    if let Some(icon_url) = dto.icon_url {
        active_category.icon_url = Set(Some(icon_url));
    }

    if let Some(color_hex) = dto.color_hex {
        active_category.color_hex = Set(Some(color_hex));
    }

    if let Some(description) = dto.description {
        let mut desc_map = serde_json::Map::new();
        if let Some(ko) = description.ko {
            desc_map.insert("ko".to_string(), Value::String(ko));
        }
        if let Some(en) = description.en {
            desc_map.insert("en".to_string(), Value::String(en));
        }
        if let Some(ja) = description.ja {
            desc_map.insert("ja".to_string(), Value::String(ja));
        }
        active_category.description = Set(Some(Value::Object(desc_map)));
    }

    if let Some(display_order) = dto.display_order {
        active_category.display_order = Set(display_order);
    }

    // DB 업데이트
    let updated_category = active_category
        .update(db)
        .await
        .map_err(AppError::DatabaseError)?;

    category_model_to_response(updated_category)
}

/// Admin용 카테고리 순서 변경
pub async fn admin_update_category_order(
    db: &DatabaseConnection,
    orders: Vec<crate::domains::admin::categories::CategoryOrderItem>,
) -> AppResult<Vec<CategoryResponse>> {
    // 카테고리 ID 목록 추출 (트랜잭션 후 사용)
    let category_ids: Vec<uuid::Uuid> = orders.iter().map(|o| o.category_id).collect();

    // 트랜잭션 실행
    db.transaction::<_, _, AppError>(|txn| {
        Box::pin(async move {
            // 각 카테고리의 순서 업데이트
            for order_item in &orders {
                let category = Categories::find_by_id(order_item.category_id)
                    .one(txn)
                    .await
                    .map_err(AppError::DatabaseError)?
                    .ok_or_else(|| {
                        AppError::NotFound(format!(
                            "Category not found: {}",
                            order_item.category_id
                        ))
                    })?;

                let mut active_category: ActiveModel = category.into();
                active_category.display_order = Set(order_item.display_order);
                active_category
                    .update(txn)
                    .await
                    .map_err(AppError::DatabaseError)?;
            }

            Ok(())
        })
    })
    .await
    .map_err(|e| match e {
        sea_orm::TransactionError::Transaction(err) => err,
        sea_orm::TransactionError::Connection(err) => AppError::DatabaseError(err),
    })?;

    // 업데이트된 카테고리 목록 반환 (display_order 순서대로)
    let categories = Categories::find()
        .filter(Column::Id.is_in(category_ids))
        .order_by_asc(Column::DisplayOrder)
        .all(db)
        .await
        .map_err(AppError::DatabaseError)?;

    categories
        .into_iter()
        .map(category_model_to_response)
        .collect()
}

/// Admin용 카테고리 상태 변경
pub async fn admin_update_category_status(
    db: &DatabaseConnection,
    category_id: Uuid,
    is_active: bool,
) -> AppResult<CategoryResponse> {
    // 카테고리 존재 확인
    let category = Categories::find_by_id(category_id)
        .one(db)
        .await
        .map_err(AppError::DatabaseError)?
        .ok_or_else(|| AppError::NotFound(format!("Category not found: {}", category_id)))?;

    // ActiveModel로 변환하여 상태만 업데이트
    let mut active_category: ActiveModel = category.into();
    active_category.is_active = Set(is_active);

    // DB 업데이트
    let updated_category = active_category
        .update(db)
        .await
        .map_err(AppError::DatabaseError)?;

    category_model_to_response(updated_category)
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    // Note: 실제 DB 테스트는 통합 테스트에서 수행
}
