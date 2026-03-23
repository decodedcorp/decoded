# Sea-ORM 패턴

- 트랜잭션: `txn`에서 `begin` 후 커밋/롤백.
- 관계: `find_with_related`, `Entity::find()` + `filter`.
- 에러: `AppError::db` / `AppError::not_found`로 매핑.
