| ID | 발견일 | 수정일 | 심각도 | 문제요약 | 커밋 |
|---|---|---|---|---|---|
| BUG-20260107-001 | 2026-01-07 | 2026-01-07 | High | 마이그레이션에서 초기 데이터 INSERT 시 `id` 컬럼 누락으로 NOT NULL 에러 | 019e0da |
| BUG-20260107-002 | 2026-01-07 | 2026-01-07 | Critical | 서버 시작 시 스택 오버플로우 (`thread 'main' has overflowed its stack`) | 019e0da |
| BUG-20260108-001 | 2026-01-08 | 2026-01-08 | High | 서버 시작 시 `MaxClientsInSessionMode: max clients reached` 에러 | 3d8c6e8 |
| BUG-20260109-001 | 2026-01-09 | 2026-01-09 | High | `GET /api/v1/posts` 엔드포인트에서 쿼리 파라미터 파싱 실패 (`Failed to deserialize query string: invalid type: string \"1\", expected u64`) | 8a3f5c2 |
| BUG-20260109-002 | 2026-01-09 | 2026-01-09 | High | 데이터베이스 타입 불일치: `created_at` 컬럼이 PostgreSQL `TIMESTAMPTZ`인데 Rust 엔티티에서 `NaiveDateTime` (`DateTime`) 사용 | 632a221 |
| BUG-20260110-001 | 2026-01-10 | 2026-01-10 | High | `POST /api/v1/posts` 엔드포인트에서 Post 및 Spot 생성 시 `id` 컬럼 누락으로 NOT NULL 제약조건 위반 에러 | 953b83d |
| BUG-20260110-002 | 2026-01-10 | 2026-01-10 | High | Solutions, Spots, ClickLogs 생성 시 `id` 컬럼 누락으로 NOT NULL 제약조건 위반 가능성 (사전 수정) | 2d18747 |
| BUG-20260110-003 | 2026-01-10 | 2026-01-10 | High | Meilisearch `posts` 인덱스 미생성으로 검색 실패 (`index_not_found` 502 에러) | e6b00cc |
| BUG-20260110-004 | 2026-01-10 | 2026-01-10 | High | Meilisearch 검색 결과 파싱 실패: `hit["result"]` 접근 오류로 검색 결과가 비어있음 (`total_items: 1`이지만 `data: []`) | 0ce4189 |
| BUG-20260121-001 | 2026-01-21 | 2026-01-21 | High | `GET /api/v1/posts`에서 SQL GROUP BY 에러 (`column "spots.id" must appear in the GROUP BY clause`) | feca5de |
