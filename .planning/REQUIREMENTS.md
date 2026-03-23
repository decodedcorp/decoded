# Requirements: decoded-monorepo v9.0 Type-Safe API Generation

**Defined:** 2026-03-23
**Core Value:** 백엔드 OpenAPI spec에서 타입 안전한 API 클라이언트를 자동 생성하여 수동 API 코드를 완전 교체

## v9.0 Requirements

### Infrastructure (코드 생성 파이프라인)

- [x] **INFRA-01**: Orval, axios, zod 패키지 설치 및 orval.config.ts 작성 (react-query + zod 두 config 블록)
- [x] **INFRA-02**: 커스텀 mutator 구현 (Supabase JWT 인증 + baseURL="" Next.js 프록시 라우팅 + 에러 핸들링 — 기존 lib/api/client.ts apiClient() 대체)
- [x] **INFRA-03**: generate:api bun 스크립트 + Turborepo 파이프라인 통합 (빌드 전 자동 실행)
- [x] **INFRA-04**: Zod 스키마 생성 설정 (별도 config 블록, .zod.ts 확장자, 응답/요청 body 검증)
- [x] **INFRA-05**: afterAllFilesWrite 포매팅 설정 (Prettier + ESLint 자동 적용)

### Spec Validation (OpenAPI 스펙 준비)

- [x] **SPEC-01**: 백엔드 OpenAPI 스펙 버전 확인 (3.0 vs 3.1) 및 utoipa nullable 이슈 검증
- [x] **SPEC-02**: 전체 엔드포인트 operationId 검증 (존재 + 중복 없음 + camelCase verbNoun 패턴) 및 태그 매핑 검증
- [x] **SPEC-03**: 업로드/multipart 엔드포인트 명시적 목록화 (POST /posts/upload 등) 및 Orval config 제외 설정
- [x] **SPEC-04**: 파이프라인 스모크 테스트 (단일 엔드포인트로 생성 → 빌드 → 실행 검증)
- [x] **SPEC-05**: 무한 스크롤 엔드포인트 식별 및 pagination 파라미터 확인 (cursor/page/offset)

### Migration (수동 코드 → 생성 코드 교체)

- [x] **MIG-01**: Read hook 마이그레이션 — badges, rankings, categories 도메인
- [x] **MIG-02**: Read hook 마이그레이션 — comments, spots, solutions 도메인
- [x] **MIG-03**: Read hook 마이그레이션 — users, posts 도메인
- [x] **MIG-04**: Read hook 마이그레이션 — admin 도메인 (dashboard, ai-cost, audit, pipeline, server-logs)
- [x] **MIG-05**: Mutation hook 마이그레이션 — POST/PATCH/DELETE + onSuccess 캐시 무효화 연결
- [x] **MIG-06**: Zustand 스토어 동기화 업데이트 (mutation onSuccess에서 store 업데이트 패턴 보존 — useUpdateProfile 등)
- [x] **MIG-07**: 기존 lib/api/*.ts 및 lib/api/types.ts 삭제 (마이그레이션 완료 후)
- [x] **MIG-08**: 마이그레이션 중 타입 이름 중복 해결 (생성 타입 vs 기존 types.ts — import type aliasing)
- [x] **MIG-09**: Supabase 직접 쿼리 vs Orval 생성 쿼리 캐시 무효화 경계 정의

### CI/CD Integration

- [x] **CI-01**: 빌드 파이프라인에 generate:api 단계 추가 (prebuild 실행)
- [x] **CI-02**: Spec drift 감지 (generate && git diff --exit-code) pre-push 훅 추가
- [x] **CI-03**: 생성 코드 .gitignore 설정 (packages/web/lib/api/generated/)
- [x] **CI-04**: 백엔드 OpenAPI 스펙 변경 감지 및 프론트엔드 자동 재생성 trigger 프로세스
- [x] **CI-05**: 마이그레이션 단계별 롤백 계획 (git branching strategy + pre-push validation)

### Testing

- [x] **TEST-01**: Zod 스키마 유효성 검증 테스트 (생성된 스키마 vs 실제 API 응답)

### Tooling (에이전트 워크플로우 최적화)

- [x] **TOOL-01**: Claude Code 생성 파일 보호 메커니즘 (lib/api/generated/ 수정 시도 감지 및 차단/경고)
- [x] **TOOL-02**: CLAUDE.md 업데이트 — 생성 코드 구조, 파일 소유권, generate 명령어 문서화
- [x] **TOOL-03**: 코드 리뷰어 에이전트 업데이트 — 생성 파일 스타일 스킵, 스키마 유효성 검사, scope drift 감지 규칙

## Future Requirements

### v9.1 고급 생성 기능

- **ADV-01**: useInfiniteQuery 생성 설정 (이미지/피드 무한 스크롤 엔드포인트)
- **ADV-02**: Auto-invalidation 헬퍼 (useMutation onSuccess 자동 무효화)
- **ADV-03**: usePrefetch hooks (SSR 프리페칭)
- **ADV-04**: useOperationIdAsQueryKey (DevTools 가독성 개선)

### v10+ 테스트 인프라

- **MSW-01**: MSW mock 생성 (@faker-js/faker + msw 통합)
- **ZOD-01**: Zod strict mode (안정화된 스펙에 대해 엄격한 응답 검증)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Supabase 직접 쿼리 전환 | 별도 마일스톤으로 분리 |
| Zod v4 사용 | Orval 호환성 미안정 (이슈 #2249, #2304) — v3 사용 |
| 생성 코드 git 커밋 | .gitignore + CI 재생성 패턴 채택 |
| Next.js API 프록시 제거 | CORS/보안/인증 이유로 프록시 유지 |
| 생성 파일 수동 편집 | Orval 재생성 시 덮어써짐 — 커스텀 mutator/adapter 패턴 사용 |
| 전체 HTTP status별 Zod 스키마 | 150+ 스키마 생성 → 노이즈, 에러는 mutator에서 일괄 처리 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 39 | Complete |
| INFRA-02 | Phase 40 | Complete |
| INFRA-03 | Phase 40 | Complete |
| INFRA-04 | Phase 40 | Complete |
| INFRA-05 | Phase 40 | Complete |
| SPEC-01 | Phase 39 | Complete |
| SPEC-02 | Phase 39 | Complete |
| SPEC-03 | Phase 39 | Complete |
| SPEC-04 | Phase 40 | Complete |
| SPEC-05 | Phase 39 | Complete |
| MIG-01 | Phase 41 | Complete |
| MIG-02 | Phase 41 | Complete |
| MIG-03 | Phase 41 | Complete |
| MIG-04 | Phase 41 | Complete |
| MIG-05 | Phase 42 | Complete |
| MIG-06 | Phase 42 | Complete |
| MIG-07 | Phase 42 | Complete |
| MIG-08 | Phase 41 | Complete |
| MIG-09 | Phase 42 | Complete |
| CI-01 | Phase 43 | Complete |
| CI-02 | Phase 43 | Complete |
| CI-03 | Phase 43 | Complete |
| CI-04 | Phase 43 | Complete |
| CI-05 | Phase 43 | Complete |
| TEST-01 | Phase 43 | Complete |
| TOOL-01 | Phase 43 | Complete |
| TOOL-02 | Phase 43 | Complete |
| TOOL-03 | Phase 43 | Complete |

**Coverage:**
- v9.0 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-23*
*Last updated: 2026-03-23 — traceability complete (28/28 mapped to Phases 39-43)*
