# Requirements: decoded-monorepo v10.0

**Defined:** 2026-03-26
**Core Value:** 프로덕션 안정성과 코드 품질 — 모든 서비스에 에러 트래킹, 비용 보호, 테스트 커버리지 확보

## v1 Requirements

Requirements for v10.0 Tech Debt Resolution milestone. Each maps to roadmap phases.

### Memory Leak Prevention

- [x] **MEM-01**: GSAP contextSafe() 패턴을 47개 GSAP 사용 컴포넌트의 이벤트 핸들러 애니메이션에 적용하여 언마운트 시 클린업 보장
- [x] **MEM-02**: 모든 비동기 fetch 요청에 AbortController를 적용하여 컴포넌트 언마운트 시 abort (현재 0건 적용)
- [x] **MEM-03**: useEffect 클린업 패턴 정비 — setTimeout 워크어라운드 제거, addEventListener/removeEventListener 직접 사용
- [x] **MEM-04**: Chrome DevTools Memory 프로파일링으로 주요 페이지의 메모리 누수 제거 검증

### Component Refactoring

- [x] **REF-01**: ThiingsGrid(950줄) 분리 — physics 엔진, spiral 계산, intersection observer를 커스텀 훅으로 추출하여 300줄 이하로
- [ ] **REF-02**: VtonModal(880줄) 분리 — 모달 상태, 폼 로직, 이미지 처리를 커스텀 훅과 서브컴포넌트로 분리
- [ ] **REF-03**: ItemDetailCard(771줄) 분리 — solution 관리, adopt dropdown, GSAP 스크롤 애니메이션을 커스텀 훅으로 추출
- [ ] **REF-04**: ImageDetailModal(726줄) 분리 — 모달 상태와 콘텐츠 컴포지션을 서브컴포넌트로 분리
- [ ] **REF-05**: 분리된 컴포넌트에 data-testid 속성 추가 (E2E 테스트 대상 마킹)

### Rate Limiting

- [x] **RATE-01**: Axum에 tower-governor 미들웨어를 추가하여 AI 분석 엔드포인트에 GCRA 기반 Rate Limiting 적용
- [x] **RATE-02**: Per-user JWT 기반 커스텀 키 추출기 구현 (IP 대신 유저 ID로 제한)
- [x] **RATE-03**: Next.js proxy 레이어(image-proxy 등)에 in-memory sliding window 방어 Rate Limiting 추가
- [x] **RATE-04**: 제한 초과 시 429 Too Many Requests 응답 + Retry-After 헤더 반환

### Error Tracking (Sentry)

- [ ] **SENT-01**: @sentry/nextjs 설치 및 설정 — instrumentation.ts, 소스맵 업로드, 클라이언트/서버 에러 수집
- [ ] **SENT-02**: Rust 백엔드에 sentry + sentry-tower 레이어 연동 — 기존 tracing 스택과 통합
- [ ] **SENT-03**: Python AI 서버에 sentry-sdk[fastapi] 연동 — gRPC 핸들러 에러 수집
- [ ] **SENT-04**: dev/prod 환경별 DSN 분리 설정 및 환경 태깅

### E2E Testing

- [ ] **E2E-01**: playwright.config.ts 수정(yarn→bun) + Supabase REST API 기반 storageState 인증 픽스처 구축
- [ ] **E2E-02**: 로그인 플로우 + 메인 페이지 네비게이션 E2E 테스트 작성
- [ ] **E2E-03**: AI 이미지 분석 파이프라인 E2E 테스트 (업로드 → 분석 → 결과 표시)
- [ ] **E2E-04**: 핵심 인터랙티브 컴포넌트에 data-testid 마킹

## Future Requirements

### Advanced Observability (v10.1+)

- **OBS-01**: Sentry 크로스 서비스 트레이스 (Rust → Python gRPC trace 전파)
- **OBS-02**: Web Vitals 모니터링 (LCP, FID, CLS 대시보드)
- **OBS-03**: Sentry 알림 룰 및 Slack 연동

### Extended Testing (v10.1+)

- **TEST-01**: Docker Compose 기반 풀스택 E2E 테스트 환경
- **TEST-02**: 크로스 브라우저 테스트 (Firefox, Safari)
- **TEST-03**: 모바일 터치 이벤트 E2E 테스트

### Extended Refactoring (v10.1+)

- **XREF-01**: CircularGallery(792줄) 분리
- **XREF-02**: DecodedLogo(764줄) 분리
- **XREF-03**: NeonDoodles(699줄) 분리
- **XREF-04**: ESLint max-lines 규칙 추가 (400줄 경고, 600줄 에러)

## Out of Scope

| Feature | Reason |
|---------|--------|
| GitHub Actions CI/CD | 사용자가 사용하지 않기로 결정 |
| Full unit test coverage | 이번은 E2E 중심, unit은 리팩토링 훅에 한정 |
| Redis 기반 분산 Rate Limiting | 현재 단일 서버 배포 — in-memory로 충분 |
| Performance monitoring (APM) | Sentry 기본 설정 후 별도 마일스톤에서 |
| 600줄 미만 컴포넌트 리팩토링 | 726줄 이상 4개 컴포넌트만 대상 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MEM-01 | Phase 44 | Complete |
| MEM-02 | Phase 44 | Complete |
| MEM-03 | Phase 44 | Complete |
| MEM-04 | Phase 44 | Complete |
| REF-01 | Phase 46 | Complete |
| REF-02 | Phase 46 | Pending |
| REF-03 | Phase 46 | Pending |
| REF-04 | Phase 46 | Pending |
| REF-05 | Phase 48 | Pending |
| RATE-01 | Phase 45 | Complete |
| RATE-02 | Phase 45 | Complete |
| RATE-03 | Phase 45 | Complete |
| RATE-04 | Phase 45 | Complete |
| SENT-01 | Phase 47 | Pending |
| SENT-02 | Phase 47 | Pending |
| SENT-03 | Phase 47 | Pending |
| SENT-04 | Phase 47 | Pending |
| E2E-01 | Phase 48 | Pending |
| E2E-02 | Phase 48 | Pending |
| E2E-03 | Phase 48 | Pending |
| E2E-04 | Phase 48 | Pending |

**Coverage:**
- v1 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-26*
*Last updated: 2026-03-26 after roadmap creation — all requirements mapped to Phases 44-48*
