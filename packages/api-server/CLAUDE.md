# DECODED - Coding Agent 행동 규칙

**Version:** 3.1.0
**Last Updated:** 2026.04.21
**Purpose:** Coding Agent가 개발 시 반드시 준수해야 하는 실행 가능한 규칙

---

## 1. 커밋 전 필수 체크 ⚠️

모든 커밋 전에 다음을 순서대로 실행해야 합니다:

1. `cargo fmt --check` - 포맷 검사 (실패 시 `cargo fmt` 실행)
2. `cargo check` - 컴파일 에러 확인 및 수정
3. 라인 카운트 업데이트: `find src -name "*.rs" | xargs wc -l | tail -1`
   - README.md의 "프로젝트 통계" 섹션에 업데이트
4. REQUIREMENT.md 수정 시 하단 "변경 이력" 섹션에 기록

**규칙**: 모든 체크가 통과해야만 커밋 가능 (예외 없음)

---

## 2. 런타임 에러 방지 ⚠️

### 2.1 마이그레이션 UUID 명시

이 프로젝트는 UUID `id` 컬럼에 DEFAULT 값을 설정하지 않으므로, 마이그레이션에서 초기 데이터를 INSERT할 때는 반드시 `gen_random_uuid()`를 명시적으로 사용해야 합니다. 서비스 레이어에서는 `Uuid::new_v4()`로 ID를 생성합니다.

**에러 메시지**: `null value in column "id" violates not-null constraint`

### 2.2 utoipa ToSchema 재귀 타입

자기 자신을 참조하는 타입(댓글 대댓글, 트리 구조 등)은 런타임 스택 오버플로우를 발생시킵니다. 이는 컴파일 타임이 아닌 **런타임 에러**이므로 주의해야 합니다.

**해결책**: 자기 자신을 참조하는 필드에 반드시 `#[schema(no_recursion)]` 속성을 추가해야 합니다.

**에러 메시지**: `thread 'main' has overflowed its stack - fatal runtime error: stack overflow`

### 2.3 Axum v0.7 경로 파라미터

Axum v0.7에서는 경로 파라미터를 `{param}` 형식으로 사용해야 합니다. `:param` 형식은 지원되지 않습니다. 이는 공개 라우트, 보호된 라우트, 중첩 라우터에서 모두 동일하게 적용됩니다.

**에러 메시지**: `Path segments must not start with ':'. For capture groups, use {capture}.`

---

## 3. Trait 네이밍 규칙 ⚠️

모든 외부 서비스는 역할 기반으로 네이밍해야 합니다. 구현체 이름을 사용하면 안 됩니다.

**규칙**:
- ❌ 구현체 이름: `groq: Arc<GroqClient>`, `r2: Arc<R2Service>`
- ✅ 역할 기반: `llm_client: Arc<dyn LLMClient>`, `storage_client: Arc<dyn StorageClient>`

**이유**: 구현체 변경 시 AppState 초기화 부분만 수정하면 되고, 비즈니스 로직 변경이 필요 없으며, 벤더 종속(Vendor Lock-in)을 방지할 수 있습니다.

---

## 4. 에러 처리 규칙 ⚠️

### 금지 패턴
- `unwrap()` 사용 절대 금지
- `panic!()` 사용 절대 금지
- 프로덕션 코드에서 프로그램을 종료하면 안 됩니다

### 권장 패턴
- `?` 연산자를 사용하여 에러 전파
- `ok_or()`를 사용하여 Option을 Result로 변환
- 적절한 AppError 타입 반환

**비교**:
- ❌ `let user = db.find_user(id).await.unwrap();`
- ✅ `let user = db.find_user(id).await?.ok_or(AppError::NotFound(...))?;`

---

## 5. 코드 작성 규칙 ⚠️

### 5.1 KISS 원칙 (Keep It Simple, Stupid)

과도한 추상화를 금지합니다. 필요하지 않은 추상화 계층을 만들지 않으며, "미래에 필요할 수도"는 이유로 복잡하게 만들지 않습니다(YAGNI). 10줄로 해결되는 문제를 100줄로 만들지 않습니다.

### 5.2 조기 반환 (Early Return)

중첩된 if를 사용하지 않습니다. Guard clause를 사용하여 실패 조건을 먼저 체크하고 반환합니다. 성공 경로는 들여쓰기 없이 작성합니다.

**비교**:
- ❌ 중첩된 if: `if user.is_active { if user.points > 100 { ... } }`
- ✅ 조기 반환: `if !user.is_active { return Ok(()); } if user.points <= 100 { return Ok(()); }`

### 5.3 코드 간결성

불필요한 변수 선언을 최소화합니다. 체이닝을 활용하고, 불필요한 match를 `ok_or()`로 대체합니다.

### 5.4 네이밍 컨벤션
- 파일명: snake_case
- 구조체: PascalCase
- 함수: snake_case
- 상수: SCREAMING_SNAKE_CASE

---

## 6. TDD 사이클 ⚠️

반드시 이 순서를 준수해야 합니다:

1. **Red**: 실패하는 테스트를 먼저 작성합니다
2. **Green**: 테스트를 통과하는 최소한의 코드를 작성합니다
3. **Refactor**: 리팩토링을 진행합니다 (테스트는 계속 통과해야 함)

**원칙**:
- 구현하기 전에 테스트부터 작성
- 테스트가 실패하는 것을 확인 (Red)
- 테스트를 통과하는 최소 코드 작성 (Green)
- 리팩토링 후에도 테스트 통과 확인 (Refactor)
- **테스트 없는 코드는 작성하지 않음**

---

## 7. 프롬프트 관리 ⚠️

프롬프트를 코드에 하드코딩하면 안 됩니다. 반드시 Tera 템플릿을 사용해야 합니다.

**템플릿 위치**: `src/services/llm/prompts/templates/`

**사용 방법**: `PromptManager::render()` 메서드로 템플릿을 렌더링하고, 템플릿 파일명과 로케일을 전달합니다.

**이유**:
- 프롬프트 수정 시 재컴파일 불필요
- 여러 Client에서 재사용 가능
- Git으로 버전 관리 용이
- 다국어 지원 자동 처리

---

## 8. AppState 패턴

모든 외부 의존성은 AppState에 주입되어야 합니다. Trait로 추상화된 클라이언트를 사용하며, Handler에서 `State(state)` Extractor로 접근합니다.

**라우터 설정**:
- 보호된 라우트: `route_layer(auth_middleware)` 사용
- 공개 라우트: 미들웨어 없이 직접 등록
- 경로 파라미터: `{param}` 형식 사용 (`:param` 금지)

---

## 9. 트랜잭션 처리

**사용 시점**:
- 여러 테이블에 걸친 작업
- 데이터 일관성이 중요한 경우
- 실패 시 모두 롤백해야 하는 경우

**패턴**:
- SeaORM의 `transaction()` 메서드 사용
- 클로저 기반 패턴 권장
- `Box::pin(async move { ... })` 사용
- 에러 발생 시 자동 롤백
- Ok 반환 시 자동 커밋

---

## 10. Environment & Migration ⚠️

dev 는 **Supabase CLI self-hosted**, prod 는 **Cloud Supabase** (#282). 두 환경의 endpoint / key 는 다르며, dev 에는 반드시 `SKIP_DB_MIGRATIONS=1` 이 세팅되어 있어야 함 (supabase/migrations 가 SOT 이라 SeaORM 과 충돌 회피).

### 두 DB 풀: prod + assets (#333)

- **`AppState.db`** — prod 프로젝트 (검증본 `public.posts`, `users`, `solutions`, `artists`/`groups`/`brands` 등). 기존 `DATABASE_URL` 사용.
- **`AppState.assets_db`** — assets 프로젝트 (파이프라인 스테이징 `raw_post_sources`, `raw_posts`, `pipeline_events`). `ASSETS_DATABASE_URL` 사용.
- 신규 코드는 도메인에 맞는 풀을 골라 쓸 것:
    - `domains/raw_posts/*` → `state.assets_db`
    - 그 외 (`domains/posts`, `users`, `solutions`, ...) → `state.db`
- `APP_ENV` (`Local` / `Production`) 가 verify 엔드포인트의 assets write 를 제어한다 — `Local` 에선 cloud assets 오염 방지를 위해 status write 스킵.
- 자세한 설계: [`docs/architecture/assets-project.md`](../../docs/architecture/assets-project.md)

### 참조

- env matrix: [`docs/agent/environments.md`](../../docs/agent/environments.md)
- 마이그레이션 SOT / 워크플로우: [`docs/DATABASE-MIGRATIONS.md`](../../docs/DATABASE-MIGRATIONS.md)
- 로컬 기동: `just dev` 한 줄이면 Supabase + BE + FE 동시 기동 + env 자동 셋업

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 3.2.0 | 2026.04.25 | Environment & Migration 에 두 DB 풀(prod + assets, #333) 단락 추가 |
| 3.1.0 | 2026.04.21 | Environment & Migration 섹션 추가 (#282 self-hosted 전환 반영) |
| 3.0.0 | 2026.01.08 | 코드 예제 제거, 텍스트 설명 중심으로 재구성 (510줄 → 250줄) |
| 2.0.0 | 2026.01.08 | 문서 대폭 축소 및 구조 개편 (2,338줄 → ~510줄) |
| 1.3.0 | 2026.01.07 | utoipa ToSchema 재귀 타입 주의사항 추가 |
| 1.2.0 | 2026.01.07 | 마이그레이션 UUID 명시 규칙 추가 |
| 1.0.0 | 2026.01.04 | 초안 작성 |
