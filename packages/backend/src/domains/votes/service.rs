use crate::entities::{solutions, spots, votes};
use crate::error::{AppError, AppResult};
use sea_orm::ActiveValue::Set;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, ConnectionTrait, DatabaseConnection, EntityTrait, QueryFilter,
    TransactionTrait,
};
use uuid::Uuid;

use super::dto::{AdoptResponse, UpdatedSpotInfo, VoteStatsResponse, VoteType};

/// 투표 생성
pub async fn create_vote(
    db: &DatabaseConnection,
    solution_id: Uuid,
    user_id: Uuid,
    vote_type: VoteType,
) -> AppResult<votes::Model> {
    // Solution 존재 확인
    let solution = solutions::Entity::find_by_id(solution_id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Solution을 찾을 수 없습니다"))?;

    // 이미 투표했는지 확인
    let existing_vote = votes::Entity::find()
        .filter(votes::Column::SolutionId.eq(solution_id))
        .filter(votes::Column::UserId.eq(user_id))
        .one(db)
        .await?;

    if existing_vote.is_some() {
        return Err(AppError::bad_request("이미 투표하셨습니다"));
    }

    // 트랜잭션 실행
    db.transaction::<_, _, AppError>(|txn| {
        Box::pin(async move {
            // 투표 생성
            let vote = votes::ActiveModel {
                id: Set(Uuid::new_v4()),
                solution_id: Set(solution_id),
                user_id: Set(user_id),
                vote_type: Set(vote_type.as_str().to_string()),
                ..Default::default()
            };

            let vote = vote.insert(txn).await?;

            // Solution의 투표 카운트 업데이트
            let mut solution_active: solutions::ActiveModel = solution.into();
            match vote_type {
                VoteType::Accurate => {
                    solution_active.accurate_count =
                        Set(solution_active.accurate_count.unwrap() + 1);
                }
                VoteType::Different => {
                    solution_active.different_count =
                        Set(solution_active.different_count.unwrap() + 1);
                }
            }

            let updated_solution = solution_active.update(txn).await?;

            // Verified 자동 판정 체크
            check_and_update_verified(txn, &updated_solution).await?;

            Ok(vote)
        })
    })
    .await
    .map_err(|e| match e {
        sea_orm::TransactionError::Transaction(err) => err,
        sea_orm::TransactionError::Connection(err) => AppError::DatabaseError(err),
    })
}

/// 투표 취소
pub async fn delete_vote(
    db: &DatabaseConnection,
    solution_id: Uuid,
    user_id: Uuid,
) -> AppResult<()> {
    // 투표 찾기
    let vote = votes::Entity::find()
        .filter(votes::Column::SolutionId.eq(solution_id))
        .filter(votes::Column::UserId.eq(user_id))
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("투표를 찾을 수 없습니다"))?;

    // Solution 찾기
    let solution = solutions::Entity::find_by_id(solution_id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Solution을 찾을 수 없습니다"))?;

    // 트랜잭션 실행
    db.transaction::<_, _, AppError>(|txn| {
        Box::pin(async move {
            // 투표 삭제
            let vote_active: votes::ActiveModel = vote.clone().into();
            vote_active.delete(txn).await?;

            // Solution의 투표 카운트 감소
            let mut solution_active: solutions::ActiveModel = solution.into();
            let vote_type = vote
                .vote_type
                .parse::<VoteType>()
                .map_err(|_| AppError::internal("잘못된 투표 타입입니다"))?;

            match vote_type {
                VoteType::Accurate => {
                    let current = solution_active.accurate_count.unwrap();
                    solution_active.accurate_count = Set((current - 1).max(0));
                }
                VoteType::Different => {
                    let current = solution_active.different_count.unwrap();
                    solution_active.different_count = Set((current - 1).max(0));
                }
            }

            let updated_solution = solution_active.update(txn).await?;

            // Verified 상태 재확인
            check_and_update_verified(txn, &updated_solution).await?;

            Ok(())
        })
    })
    .await
    .map_err(|e| match e {
        sea_orm::TransactionError::Transaction(err) => err,
        sea_orm::TransactionError::Connection(err) => AppError::DatabaseError(err),
    })
}

/// 투표 현황 조회
pub async fn get_vote_stats(
    db: &DatabaseConnection,
    solution_id: Uuid,
    user_id: Option<Uuid>,
) -> AppResult<VoteStatsResponse> {
    // Solution 찾기
    let solution = solutions::Entity::find_by_id(solution_id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Solution을 찾을 수 없습니다"))?;

    // 사용자의 투표 여부 확인
    let user_vote = if let Some(uid) = user_id {
        let vote = votes::Entity::find()
            .filter(votes::Column::SolutionId.eq(solution_id))
            .filter(votes::Column::UserId.eq(uid))
            .one(db)
            .await?;

        vote.and_then(|v| v.vote_type.parse().ok())
    } else {
        None
    };

    let total = solution.accurate_count + solution.different_count;
    let accuracy_rate = if total > 0 {
        solution.accurate_count as f64 / total as f64
    } else {
        0.0
    };

    Ok(VoteStatsResponse {
        solution_id,
        accurate_count: solution.accurate_count,
        different_count: solution.different_count,
        total_count: total,
        accuracy_rate,
        user_vote,
    })
}

/// Solution 채택
pub async fn adopt_solution(
    db: &DatabaseConnection,
    solution_id: Uuid,
    spotter_id: Uuid,
    match_type: String,
) -> AppResult<AdoptResponse> {
    // Solution 찾기
    let solution = solutions::Entity::find_by_id(solution_id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Solution을 찾을 수 없습니다"))?;

    // Spot 찾기
    let spot = spots::Entity::find_by_id(solution.spot_id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Spot을 찾을 수 없습니다"))?;

    // Spotter 권한 확인 (Spot 작성자만 채택 가능)
    if spot.user_id != spotter_id {
        return Err(AppError::forbidden("Spot 작성자만 채택할 수 있습니다"));
    }

    // 이미 채택된 Solution이 있는지 확인
    let existing_adopted = solutions::Entity::find()
        .filter(solutions::Column::SpotId.eq(spot.id))
        .filter(solutions::Column::IsAdopted.eq(true))
        .one(db)
        .await?;

    if let Some(adopted) = existing_adopted {
        if adopted.id != solution_id {
            return Err(AppError::bad_request("이미 다른 Solution이 채택되었습니다"));
        }
    }

    // 트랜잭션 실행
    let match_type_clone = match_type.clone();
    db.transaction::<_, _, AppError>(|txn| {
        Box::pin(async move {
            // Solution 채택 처리
            let mut solution_active: solutions::ActiveModel = solution.clone().into();
            solution_active.is_adopted = Set(true);
            solution_active.match_type = Set(Some(match_type.clone()));
            solution_active.adopted_at = Set(Some(chrono::Utc::now().into()));

            let updated_solution = solution_active.update(txn).await?;

            // Perfect Match인 경우 Spot 메타데이터 자동 업데이트
            let _updated_spot_info = if match_type == "perfect" {
                // TODO: Spot에 메타데이터 필드 추가 후 업데이트 로직 구현
                // 현재는 Spot 테이블에 product_name, brand 등 필드가 없으므로 스킵

                Some((
                    updated_solution.spot_id,
                    updated_solution.title.clone(),
                    updated_solution.metadata.clone(),
                ))
            } else {
                None
            };

            Ok(updated_solution)
        })
    })
    .await
    .map_err(|e| match e {
        sea_orm::TransactionError::Transaction(err) => err,
        sea_orm::TransactionError::Connection(err) => AppError::DatabaseError(err),
    })
    .map(|updated_solution| {
        let updated_spot_info = if match_type_clone == "perfect" {
            Some(UpdatedSpotInfo {
                spot_id: updated_solution.spot_id,
                title: updated_solution.title.clone(),
                metadata: updated_solution.metadata.clone(),
            })
        } else {
            None
        };

        AdoptResponse {
            solution_id: updated_solution.id,
            is_adopted: updated_solution.is_adopted,
            match_type: updated_solution.match_type.unwrap_or_default(),
            adopted_at: updated_solution
                .adopted_at
                .map(|dt| dt.with_timezone(&chrono::Utc))
                .expect("adopted solution must have adopted_at timestamp"),
            updated_spot: updated_spot_info,
        }
    })
}

/// 채택 취소
pub async fn unadopt_solution(
    db: &DatabaseConnection,
    solution_id: Uuid,
    spotter_id: Uuid,
) -> AppResult<()> {
    // Solution 찾기
    let solution = solutions::Entity::find_by_id(solution_id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Solution을 찾을 수 없습니다"))?;

    // Spot 찾기
    let spot = spots::Entity::find_by_id(solution.spot_id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Spot을 찾을 수 없습니다"))?;

    // Spotter 권한 확인
    if spot.user_id != spotter_id {
        return Err(AppError::forbidden(
            "Spot 작성자만 채택을 취소할 수 있습니다",
        ));
    }

    // 채택 취소
    let mut solution_active: solutions::ActiveModel = solution.into();
    solution_active.is_adopted = Set(false);
    solution_active.match_type = Set(None);
    solution_active.adopted_at = Set(None);

    solution_active.update(db).await?;

    Ok(())
}

/// Verified 자동 판정 및 업데이트
/// 조건: accurate_count >= 5 AND accuracy_rate >= 0.8
async fn check_and_update_verified<C>(txn: &C, solution: &solutions::Model) -> AppResult<()>
where
    C: ConnectionTrait,
{
    let total = solution.accurate_count + solution.different_count;
    let should_be_verified = if total > 0 {
        solution.accurate_count >= 5 && (solution.accurate_count as f64 / total as f64) >= 0.8
    } else {
        false
    };

    // Verified 상태가 변경된 경우에만 업데이트
    if solution.is_verified != should_be_verified {
        let mut solution_active: solutions::ActiveModel = solution.clone().into();
        solution_active.is_verified = Set(should_be_verified);
        solution_active.update(txn).await?;
    }

    Ok(())
}
