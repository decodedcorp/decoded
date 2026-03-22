# Phase v4-06: Screen Specs — Creation-AI - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Creation-AI 번들(Upload, AI Detect, Edit/Solution) 3개 화면의 spec 문서를 현재 구현 기준으로 작성한다. requestStore step enum과 AI 감지 API 응답 형태가 정확하게 반영된다. Documentation-only — 코드 변경 없음.

</domain>

<decisions>
## Implementation Decisions

### Upload 화면 (SCR-CREA-01)
- 이미지 압축/리사이즈 플로우를 포함하여 문서화 (용량 제한, 리사이즈 조건, 사용자 피드백)
- 전체 에러 케이스 문서화 (파일 크기 초과, 형식 불일치, 네트워크 실패, 서버 에러)
- 카메라 촬영 옵션 포함 (실제 구현 확인 후 있는 것만)
- 업로드 완료 시 자동 전환 여부 확인하여 문서화 (수동 버튼 vs 자동 전환)

### AI Detect 화면 (SCR-CREA-02)
- 로딩 상태: 스켈레톤 UI + 프로그레스 인디케이터 상세 문서화
- API 응답: `POST /api/v1/posts/analyze` 응답 JSON 구조를 spec 내에 인라인 예시로 포함
- Spot 시각화: ASCII 와이어프레임으로 이미지 위 spot 오버레이 위치 표현
- 실패 대응: 각 실패 케이스별(아이템 미발견, 서버 에러, 타임아웃) UI 응답 상세 문서화 (재시도, 수동 입력 안내 등)

### Edit/Solution 화면 (SCR-CREA-03)
- Spec 구성: 200라인 넘으면 분리 고려 (CREA-03a spot 생성, CREA-03b solution 입력)
- Spot 생성 인터랙션: 탭 위치 → spot 마커 생성 → 드래그 조정 등 단계별 인터랙션 상세 문서화
- 솔루션 폼: 각 필드(브랜드, 상품명, URL 등)의 타입/필수여부/밸리데이션 규칙을 테이블로 명시
- 제출 플로우: API 호출 순서(spots 생성 → solutions 생성 → post 완료) 상세 문서화

### requestStore Step 전환
- 각 화면 spec에 해당 step enum 값을 직접 인라인으로 명시 (e.g., step: 'upload' → step: 'detecting')
- 전체 step 전환 다이어그램은 FLW-03-creation.md 참조 (중복하지 않음)
- 각 화면이 읽기/쓰기하는 requestStore 필드를 테이블로 명시
- Reset 동작(뒤로가기, 취소, 페이지 이탈) 시 store 초기화 동작 상세 문서화

### Claude's Discretion
- 각 화면의 ASCII 와이어프레임 레이아웃 구체적 표현
- 200라인 제한 내에서 섹션 비중 배분
- SCR-CREA-03 분리 여부 최종 판단 (코드 복잡도 확인 후)
- 에러 메시지 구체적 문구

</decisions>

<specifics>
## Specific Ideas

- STATE.md 기록된 사전 검증 항목: requestStore step enum 값 + `POST /api/v1/posts/analyze` 응답 형태를 반드시 실제 코드에서 확인 후 spec에 반영
- v4-04에서 확인된 NOT-IMPL 패턴 동일하게 적용 — 구현되지 않은 기능은 명확히 표시
- API 응답 인라인 예시는 실제 코드의 타입/응답 기준 (추측 아닌 검증된 형태)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: v4-06-creation-ai*
*Context gathered: 2026-02-19*
