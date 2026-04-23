# Source Type별 구조화 필드 — Phase A (FE-only) 설계

**Issue:** #305 (author: thxforall, 2026-04-23)
**Status:** Draft — pending user review
**Scope:** Phase A FE-only. BE DTO 확장/Meilisearch/AI structured output은 Phase B/C로 이연.

## 배경

현재 Upload 플로우 Details 단계의 `mediaDescription`은 단일 자유 텍스트. `MetadataInputForm.tsx`에서 source type별로 placeholder만 바뀌고, 추가 구조화 입력은 없음. 이슈 #305의 Phase A는 drama/movie/music_video/variety/event 각 타입에 대해 고유 필드(Title, Platform, Year, Episode, Location 등) 입력 UI를 제공하는 것.

## 선결 제약: 기존 AI 추출 파이프라인

이미 활성화된 파이프라인이 있다:

```
DescriptionInput → POST /api/v1/posts/extract-metadata
  → AI(Gemini) 분석 → { title, media_metadata: MediaMetadataItem[] }
  → FE setExtractedMetadata → submit 시 posts.media_metadata JSONB로 저장
```

증거:

- `packages/api-server/src/domains/posts/service.rs:1242` — "title과 media_metadata는 AI가 description에서 추출할 예정"
- `packages/web/lib/components/request/DescriptionInput.tsx:50` — `setExtractedMetadata(response.media_metadata)`
- `MediaMetadataItem { key: string; value: string }` 배열이 이미 wire/storage 포맷

이 경로를 무시하고 구조화 필드를 새 writer로 추가하면 동일 컬럼에 두 쓰기 경로가 공존하며 충돌·우선순위 미정의가 발생한다. Phase A는 기존 파이프라인을 존중하고, 수동 입력 결과물을 동일한 `MediaMetadataItem[]` wire format으로 변환해 주입한다.

## 핵심 원칙

1. **FE-only 변경**: BE DTO, 서비스 로직, 스키마 미변경.
2. **Wire 호환성 유지**: 서버로 전송되는 메타데이터는 기존 `MediaMetadataItem[]` 배열 포맷 그대로.
3. **Manual overrides AI**: 사용자가 수동으로 채운 필드가 AI 추출 결과를 덮어쓴다 (마지막 수동 입력이 final value).
4. **Zero schema migration**: `posts.media_metadata: Json` 컬럼 그대로 사용. Phase C에서 structured 컬럼화가 결정되면 key whitelist를 기준으로 SELECT→INSERT 마이그레이션.
5. **Gating 일관성**: `canProceed` 규칙은 현행 그대로(`mediaSource.type && mediaSource.title` 및 spots). 구조화 필드는 UI 힌트로 권장만 하고 제출을 막지 않는다.

## 데이터 플로우

```
[수동 입력 — source type별 conditional fields]
         ↓ (toMediaMetadataItems)
[MediaMetadataItem[]  ← key whitelist 검증]
         ↓ merge (manual wins)
[AI extracted  MediaMetadataItem[]]
         ↓
[submit payload.media_metadata]  →  BE  →  posts.media_metadata JSONB
```

### 병합 규칙

- Submit 시점에 `manualItems`와 `aiExtractedItems`를 합칠 때 동일 key는 **manual 값 우선**.
- Key는 whitelist(`MEDIA_METADATA_KEYS`)에 속한 값만 wire로 내보낸다. 화이트리스트 외 key는 AI 결과든 수동이든 drop (안전장치).
- 빈 문자열(`""`) / undefined 필드는 omit (payload 최소화).
- Phase A의 타입별 추가 필드는 wire에서 항상 `MediaMetadataItem[]` 요소로 직렬화되며, 최상위 `MediaSource`에 신규 필드를 추가하지 않는다.

### Key Whitelist

```ts
export const MEDIA_METADATA_KEYS = [
  "title",
  "platform",
  "year",
  "episode",
  "location",
] as const;
export type MediaMetadataKey = (typeof MEDIA_METADATA_KEYS)[number];
```

이 상수는 FE(`packages/web/lib/api/mutation-types.ts` 또는 동등 위치)에 정의하고, 장래 BE와 공유하려면 `packages/shared`로 이전한다 (이 PR 범위에는 포함하지 않음).

## Source Type별 필드 매핑

| Type          | description | Title           | Platform | Year     | Episode  | Location | 기존 `artist_name` 재사용    |
| ------------- | ----------- | --------------- | -------- | -------- | -------- | -------- | ---------------------------- |
| `user_upload` | 표시 (현행) | -               | -        | -        | -        | -        | -                            |
| `youtube`     | 표시 (현행) | -               | -        | -        | -        | -        | -                            |
| `drama`       | 숨김        | **required UI** | optional | optional | -        | -        | -                            |
| `movie`       | 숨김        | **required UI** | optional | optional | -        | -        | -                            |
| `music_video` | 숨김        | **required UI** | -        | optional | -        | -        | UI 라벨 "Artist" (MV 공연자) |
| `variety`     | 숨김        | **required UI** | -        | -        | optional | -        | -                            |
| `event`       | 숨김        | **required UI** | -        | optional | -        | optional | -                            |
| `other`       | 표시 (현행) | -               | -        | -        | -        | -        | -                            |

### Notes

- **"required UI"**: 해당 필드가 비어 있으면 inline 힌트로 경고 표시 + Post 버튼 `aria-describedby` 연결. **하지만 submit을 막지는 않는다** (기존 `canProceed`와 일관). submit 후 서버 레벨 validation도 변경하지 않는다. 이 정책은 "데이터 품질을 권장하되 사용자 흐름을 강제 차단하지 않는다"는 #306 Part C(disabled hint)와 동일한 철학.
- **`description` 숨김 타입**: drama/movie/music_video/variety/event에서는 자유 텍스트 description 대신 구조화 필드만 노출. AI `extract-metadata` 호출은 이 타입들에서 skip (수동 구조화가 이미 신뢰 가능한 입력).
- **`artist` 필드 없음**: music_video의 공연자 정보는 기존 `CreatePostRequest.artist_name` top-level 필드를 그대로 사용한다. `MetadataInputForm`이 music_video일 때 기존 Artist 입력의 라벨/placeholder를 MV-specific 문구로 교체 (예: "Artist / Group"). post.artist_name과 MediaSource.artist를 분리하지 않음으로써 중복 입력과 데이터 드리프트 제거.
- **Source type 전환 시 정책**: drama ↔ movie (동일 필드 셋)는 입력 값 유지. 그 외 전환은 불일치 key 필드를 **초기화**. 예: movie(platform/year 입력) → variety로 바꾸면 platform/year는 drop, episode는 empty로 시작.

## FE ViewModel

`MetadataInputForm`이 내부적으로 관리하는 로컬 state:

```ts
interface StructuredFieldsState {
  title?: string;
  platform?: string;
  year?: string; // <input type="number">의 값이지만 wire에서는 string으로 유지(기존 패턴 일치)
  episode?: string;
  location?: string;
}
```

컴포넌트 props:

```ts
interface MetadataFormValues {
  // 기존
  mediaType: MediaSourceType;
  mediaDescription: string; // user_upload/youtube/other 전용
  groupName: string;
  artistName: string;
  context: ContextType | null;
  // 신규 — 구조화 필드
  structured: StructuredFieldsState;
}
```

`requestStore`는 `structured` state를 `mediaSource` 내부에 병합해 보관한다. 기존 `MediaSource` 타입은 변경하지 않고 별도의 store slice 또는 로컬 state로 관리한다 (권장: `requestStore.structuredMetadata`). Submit 시 `toMediaMetadataItems(structured)` 유틸로 배열 변환 후 `CreatePostRequest.media_metadata` 기존 경로에 주입.

## 구현 파일 (예상)

| 경로                                                                       | 작업                                                                                    |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `packages/web/lib/api/mutation-types.ts`                                   | `MEDIA_METADATA_KEYS` 상수, `StructuredFieldsState` 타입 추가                           |
| `packages/web/lib/stores/requestStore.ts`                                  | `structuredMetadata` slice + setter + reset 통합                                        |
| `packages/web/lib/components/request/MetadataInputForm.tsx`                | Source type별 conditional fields 렌더링, description 조건부 숨김, Artist 라벨 MV 분기   |
| `packages/web/lib/components/request/UploadFlowSteps.tsx`                  | `handleMetadataChange` payload에 structured 포함, submit payload 조립 시 병합           |
| `packages/web/lib/hooks/useCreatePost.ts` (또는 useUploadFlow)             | `toMediaMetadataItems` 호출 지점: structured → AI extracted 병합 후 서버 payload에 주입 |
| `packages/web/lib/utils/mediaMetadata.ts` (신규)                           | `toMediaMetadataItems`, `fromMediaMetadataItems`, `mergeManualOverAi` 유틸              |
| `packages/web/lib/components/request/__tests__/MetadataInputForm.test.tsx` | Conditional render per type, state transitions                                          |
| `packages/web/tests/mediaMetadata.test.ts` (신규)                          | 직렬화/역직렬화/병합 유닛                                                               |

## 테스트 시나리오

### Unit (신규 유틸)

- `toMediaMetadataItems({platform: "Netflix", year: "2023"})` → `[{key:"platform", value:"Netflix"}, {key:"year", value:"2023"}]`
- `toMediaMetadataItems({platform: "", episode: undefined})` → `[]` (빈 값 omit)
- `toMediaMetadataItems({unknown: "x"})` → `[]` (whitelist 외 drop; 컴파일 타임에도 막아야 하나 런타임 방어)
- `fromMediaMetadataItems([{key:"year", value:"2023"}])` → `{year: "2023"}`
- `mergeManualOverAi(manual, ai)` — 중복 key는 manual 값 선택, 고유 key는 합집합

### Component (MetadataInputForm)

- `mediaType="drama"` → Title/Platform/Year input 존재, description textarea 부재
- `mediaType="music_video"` → Artist 입력 라벨이 "Artist" / placeholder "e.g., BLACKPINK"
- `mediaType="variety"` → Episode input 존재, Platform/Year 부재
- `mediaType="user_upload"` → 기존 description textarea 유지, structured fields 부재
- Source type 전환: movie(year=2024) → drama → year 유지 / variety → year drop, episode empty

### Integration (UploadFlowSteps)

- Submit payload의 `media_metadata` 배열에 수동 입력 필드가 포함됨
- AI extract가 먼저 실행되고 수동 입력이 덮어쓰기 발생 시 final payload에 수동 값이 존재
- 기존 `canProceed` 게이팅 동작은 변경 없음 (회귀 테스트)

### Playwright E2E (권장, 이 PR 필수 아님)

- drama 선택 → Title "The Glory" + Platform "Netflix" + Year "2022" 입력 → submit → 네트워크 페이로드에 3개 `MediaMetadataItem` 확인

## UX 세부 (간단)

- 필드 레이아웃: Title을 최상단 라인 단독, 아래에 2-column grid (Platform/Year, Episode/Location 등). 모바일에서는 모두 single column.
- 플레이스홀더: 타입별 실제 콘텐츠 예시 (e.g., drama: "The Glory", movie: "Parasite (2019)").
- required UI 힌트: Title 비어 있을 때 inline hint "Title helps viewers find the reference" (disabled 아니고 텍스트만). 이 문구는 Post 버튼의 disabled 힌트와 **독립** (기존 `disabledReason`은 그대로).
- 상단 섹션 라벨: "Photo info" → "Photo info" 유지. 조건부 required라도 섹션 제목은 바꾸지 않는다.

## 보안/성능

- 클라이언트 whitelist drop은 XSS/injection 방어가 아닌 데이터 정합 목적. 서버 측 validation은 이미 `posts.media_metadata` JSONB 전체를 받아들이므로 추가 노출면 없음.
- payload 크기 변화는 무시할 수준 (최대 5개 key × 짧은 문자열).

## Rollout

- Feature flag 불필요 (UI 구조 변경, wire 호환 유지).
- Reversion 전략: PR revert만으로 충분 (DB 상태 무변경).

## Out of Scope (Phase B/C로 이연)

1. BE `MediaSourceDto` 구조화 필드 확장 → **Phase C와 묶어서 Meilisearch 인덱싱 요구가 확정되면 진행**.
2. `/api/v1/posts/metadata-suggestions` 엔드포인트 → **Phase B**.
3. Meilisearch `media_titles` 인덱스 → **Phase C**.
4. AI `extract-metadata`의 structured output → **별도 AI 이슈**.
5. 로컬라이제이션 (현재 영문 고정).

## 리스크 / 미해결 이슈

- **AI 추출 UX 혼선**: description이 숨겨지는 타입(drama/movie 등)에서는 AI extract가 호출되지 않는다. 반대로 user_upload/youtube/other는 기존 description + AI 경로 유지. 사용자 관점에서 "왜 어떤 타입만 자동 채움이 있지?" 혼동 가능 — Minor UX 이슈, 별도 메시지나 help tooltip으로 보완 가능하지만 이번 스코프 밖.
- **`artist_name` 라벨 분기**: music_video에서 "Artist" 라벨이 "공연자"로 해석될지 "착장 주인공"으로 해석될지 사용자에 따라 다를 수 있음. 대부분의 경우 일치하므로 실무적으로는 문제 적음. 장기적으로 artist 구분이 필요하면 별도 이슈.
- **Source type 전환 시 값 유지 정책**이 drama ↔ movie 만 예외 — 이 규칙을 spec에 고정하지만 장래 확장 시 일관성 규칙 재검토 필요.

## 완료 기준 (Acceptance)

- [ ] drama/movie/music_video/variety/event 각 타입별 conditional field 렌더 + 유닛 테스트 통과
- [ ] user_upload/youtube/other는 현행 description textarea 유지 (회귀 없음)
- [ ] music_video에서 Artist 라벨이 "Artist"로 노출 (placeholder 변경)
- [ ] Submit payload의 `media_metadata`에 whitelist key 직렬화 + manual-over-AI 병합 검증
- [ ] Source type 전환 정책(drama↔movie 유지 외 초기화) 유닛 테스트
- [ ] 기존 `canProceed` 회귀 테스트 녹색
- [ ] `bun run test:unit` 전체 통과, `bunx tsc --noEmit` 신규 오류 없음

## 참고

- Parent: #145 Upload 모달 리팩토링
- Minimal gap (Movie 옵션 추가): PR #304
- ContextSelector 12 옵션: PR #302
- Upload UX polish (Back/힌트/배지): PR #307, #309
