---
name: screen-spec-generator
description: 디자인 설명에서 화면 스펙 문서 생성. "screen spec", "document screen" 요청 시 자동 적용.
allowed-tools: Read, Write, Edit, Glob, Grep
model: claude-sonnet-4-20250514
---

# Screen Spec Generator

## 개요

디자인 설명이나 와이어프레임을 기반으로 화면 스펙 문서(SCR-XXX-##)를 자동 생성합니다.
`specs/shared/templates/screen-template.md` 형식을 준수합니다.

## 트리거 조건

다음 키워드가 포함된 요청에서 자동 활성화:
- "screen spec", "화면 스펙"
- "document screen", "화면 문서화"
- "화면 명세 작성"
- "SCR-XXX 생성"

## 생성 프로세스

### Step 1: 입력 분석

```
[디자인 설명] → 요소 추출
[와이어프레임 이미지] → 레이아웃 파악
[기능 요구사항] → 인터랙션 정의
```

### Step 2: ID 할당

| 도메인 | 접두사 | 예시 |
|--------|--------|------|
| Discovery | DISC | SCR-DISC-01 |
| Detail View | VIEW | SCR-VIEW-01 |
| User | USER | SCR-USER-01 |
| Creation | CREA | SCR-CREA-01 |
| Admin | ADMN | SCR-ADMN-01 |

### Step 3: 문서 생성

## 화면 스펙 구조

### 1. 헤더

```markdown
# [SCR-{도메인}-##] 화면명 (Screen Name)

| 항목 | 내용 |
|:---|:---|
| **문서 ID** | SCR-{도메인}-## |
| **경로** | `/route/path` |
| **작성일** | YYYY-MM-DD |
| **버전** | v1.0 |
| **상태** | 초안 |
```

### 2. 화면 개요

```markdown
## 1. 화면 개요

- **목적**: 화면의 주요 목적을 한 문장으로 설명
- **선행 조건**: 로그인 필요 여부, 권한 요구사항
- **후속 화면**: 이동 가능한 화면 목록
- **관련 기능 ID**: [U-##](../spec.md#u-##)
```

### 3. 와이어프레임 (ASCII)

```markdown
## 2. UI 와이어프레임

### 2.1 데스크톱 (≥768px)

┌────────────────────────────────────────────┐
│  [ Header ]                                │
├────────────────────────────────────────────┤
│                                            │
│  [IMG-01] 메인 이미지 영역                  │
│                                            │
│  [TXT-01] 제목                             │
│  [TXT-02] 부제목                           │
│                                            │
│  ┌────────────────────────────────────┐    │
│  │ [BTN-01] CTA 버튼                  │    │
│  └────────────────────────────────────┘    │
│                                            │
├────────────────────────────────────────────┤
│  [ Footer ]                                │
└────────────────────────────────────────────┘

### 2.2 모바일 (<768px)

┌──────────────────────┐
│  [ Header ]          │
├──────────────────────┤
│  [IMG-01]            │
│  (full width)        │
│                      │
│  [TXT-01] 제목       │
│  [TXT-02] 부제목     │
│                      │
│  [BTN-01] 버튼       │
│  (full width)        │
├──────────────────────┤
│  [ Footer ]          │
└──────────────────────┘
```

### 4. UI 요소 정의

```markdown
## 3. UI 요소 정의

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---|:---|:---|
| **IMG-01** | 이미지 | 메인 이미지 | Aspect: 16:9, Fallback: placeholder | 클릭 시 확대 |
| **TXT-01** | 텍스트 | 제목 | Font: H1, Color: text-primary | - |
| **TXT-02** | 텍스트 | 부제목 | Font: Body, Color: text-muted | - |
| **BTN-01** | 버튼 | CTA 버튼 | Style: Primary, Disabled: 조건 미충족 | Click: 다음 화면 이동 |
```

### 5. 상태 정의

```markdown
## 4. 상태 정의

| 상태 | 조건 | UI 변화 |
|:---|:---|:---|
| **기본** | 데이터 로드 완료 | 정상 표시 |
| **로딩** | 데이터 요청 중 | 스켈레톤 UI |
| **빈 상태** | 데이터 없음 | Empty state 표시 |
| **에러** | API 실패 | 에러 메시지 + 재시도 |
```

### 6. 데이터 요구사항

```markdown
## 5. 데이터 요구사항

### 5.1 API 호출

| API | Method | Endpoint | 호출 시점 | 응답 |
|:---|:---:|:---|:---|:---|
| 데이터 조회 | GET | `/api/v1/resource` | 화면 진입 | `{ data: T[] }` |

### 5.2 상태 관리

| 스토어 | 키 | 타입 | 설명 |
|:---|:---|:---|:---|
| Zustand | `filterStore.active` | `string` | 활성 필터 |
| React Query | `["resource", id]` | `QueryKey` | 캐시 키 |
```

### 7. 테스트 시나리오

```markdown
## 6. 테스트 시나리오

| ID | 시나리오 | 기대 결과 | 우선순위 |
|:---|:---|:---|:---:|
| T-01 | 정상 데이터 로드 | 목록 표시 | High |
| T-02 | 데이터 없음 | Empty state | High |
| T-03 | API 에러 | 에러 메시지 | High |
```

## 출력 위치

```
specs/{feature}/screens/SCR-{도메인}-##.md
```

## 참조 파일

- `specs/shared/templates/screen-template.md` - 전체 템플릿
- `docs/design-system/` - 디자인 토큰
- `specs/{feature}/spec.md` - Feature spec (User Story 참조)

## 검증 체크리스트

- [ ] 문서 ID 형식 준수 (SCR-XXX-##)
- [ ] 와이어프레임 (데스크톱/모바일) 포함
- [ ] 모든 UI 요소에 ID 부여
- [ ] 상태 정의 (기본, 로딩, 빈 상태, 에러)
- [ ] API 호출 명세
- [ ] User Story 연결
- [ ] 테스트 시나리오

## 사용 예시

```
> 홈 화면에 대한 screen spec 생성해줘
> 이 디자인을 SCR-DISC-01 형식으로 문서화해줘
> 검색 결과 화면의 화면 명세 작성해줘
```
