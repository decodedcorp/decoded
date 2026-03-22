# Phase m8-01: Event Tracking Infrastructure - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

유저 행동을 비동기적으로 기록하는 인프라 구축 (DB 스키마, API 엔드포인트, 클라이언트 큐, 이벤트 삽입) + 미구현 소셜 연동 UI 제거. 추천/개인화는 Phase m8-02 스코프.

</domain>

<decisions>
## Implementation Decisions

### Event Payload Design
- Standard payload: event_type + entity_id + timestamp + page_path + session_id
- session_id는 tab-scoped UUID (crypto.randomUUID(), sessionStorage 저장, 탭 닫으면 만료)
- 이벤트 타입 네이밍: snake_case (post_click, category_filter, scroll_depth, dwell_time, search_query, spot_click)
- metadata 필드는 JSONB — 이벤트별 추가 데이터 유연하게 저장 (GIN 인덱스)
- dwell_time 이벤트: 3초 임계값 도달 후 실제 체류 ms 기록 (강도 정보 보존)
- search_query 이벤트: metadata에 실제 검색어 저장 (m8-03 DYNUI-03 검색 갭 위젯에 필요)
- sendBeacon 실패 시: silent drop (이벤트 데이터는 best effort, UI 영향 제로)
- 단일 user_events 테이블 + metadata JSONB 구조 (이벤트 타입별 별도 칼럼 아님)

### Privacy & Consent
- 이용약관/개인정보처리방침에 행동데이터 수집 및 활용 명시 — 별도 동의 배너 없이 로그인 시 동의 간주 (한국 PIPA 기본 충족)
- 유저 데이터 삭제 기능: v6.0에서는 미포함, 별도 페이즈로 defer (30일 TTL로 자동 만료)
- 30일 TTL: pg_cron scheduled delete (매일 created_at < 30일 전 레코드 삭제)
- 간단한 개인정보 수집 안내 placeholder 페이지 포함

### DataSourcesCard Cleanup (CLEAN-01)
- DataSourcesCard.tsx 전체 삭제 (버튼만 제거가 아닌 카드 전체)
- ProfileClient.tsx에서 import/렌더링 제거
- profile/index.ts barrel export에서 제거
- DB 쿼리(queries/profile.ts)의 SocialAccount 페치 로직은 유지 — DB 테이블 존재하므로
- 제거 후 레이아웃 재정리 없음 — 나머지 카드들이 자연스럽게 리플로우

### Dev Observability
- 개발 환경: console.log로 이벤트 발화/flush 로깅 (process.env.NODE_ENV === 'development')
- Production 모니터링: Supabase 대시보드에서 user_events 테이블 직접 조회 (별도 코드 불필요)
- behaviorStore API: track() 함수만 노출, 내부 큐 상태(queueSize, lastFlushTime)는 숨김
- useTrackEvent 훅: 단일 track 함수 반환 — `const track = useTrackEvent(); track('post_click', { entity_id })`

### Claude's Discretion
- 비로그인 유저 추적 여부 (logged-in only vs anonymous UUID)
- scroll_depth 기록 방식 (per milestone vs max depth on leave)
- post_click source 필드 포함 여부 (metadata에 source: 'feed' | 'explore' 등)
- scroll_depth 이벤트의 구체적 발화 로직

</decisions>

<specifics>
## Specific Ideas

- 기존 코드베이스에서 process.env.NODE_ENV === 'development' 패턴으로 dev-only 로깅 확립되어 있음 — 동일 패턴 사용
- STATE.md에 "Zero new npm packages" 결정 기록됨 — Supabase + Zustand + React Query만 사용
- 기존 Zustand store 패턴 (authStore, filterStore 등) 따라 behaviorStore 구성
- sendBeacon + in-memory queue 패턴 STATE.md에서 이미 결정됨

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/stores/` Zustand 패턴: create() + 상태/액션 분리 + selector 패턴 → behaviorStore에 동일 적용
- `lib/hooks/` 커스텀 훅 패턴: use* 접두사, lib/hooks/ 위치 → useTrackEvent, useTrackDwellTime 등
- `lib/supabase/client.ts`: 브라우저 클라이언트 싱글톤 → 이벤트 인제스트 API에서 재사용
- `lib/supabase/queries/` 패턴: 쿼리 레이어 분리 → events 쿼리도 동일 패턴
- IntersectionObserver: infinite scroll에 이미 사용 중 (useInfiniteFilteredImages) → dwell time 관찰에 동일 API 활용

### Established Patterns
- API routes: `app/api/v1/` 하위에 REST 엔드포인트 → `/api/v1/events` 동일 구조
- Error handling: try-catch + development-only console.error + graceful fallback
- Type safety: Supabase 자동생성 타입 (`lib/supabase/types.ts`) + 수동 DTO
- React Query: staleTime 1분, gcTime 5분 기본값

### Integration Points
- `app/providers.tsx`: AuthProvider처럼 EventTracking provider 또는 store 초기화
- `ProfileClient.tsx`: DataSourcesCard import/render 제거 지점
- `lib/components/profile/index.ts`: barrel export 정리 지점
- FeedCard, explore grid, search overlay: 이벤트 삽입 대상 컴포넌트들

</code_context>

<deferred>
## Deferred Ideas

- 유저 데이터 삭제 API (DELETE /api/v1/events/me) — 프라이버시 권리 기능, 별도 페이즈
- 이용약관/개인정보처리방침 본문 업데이트 — v6.0 출시 전 별도 처리 (STATE.md blocker로 기록됨)
- Admin 이벤트 통계 엔드포인트 — m8-03 어드민 위젯과 함께 고려

</deferred>

---

*Phase: m8-01-event-tracking-infrastructure*
*Context gathered: 2026-03-12*
