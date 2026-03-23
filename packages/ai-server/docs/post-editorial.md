# Post Editorial Pipeline

포스트당 에디토리얼 매거진을 생성하는 LangGraph 파이프라인입니다. Backend `POST /api/v1/post-magazines/generate` 요청 시 decoded-ai gRPC를 통해 처리됩니다.

---

## 처리 흐름

```
Backend POST /api/v1/post-magazines/generate
    → decoded-ai gRPC ProcessPostEditorial
    → QueueManager.enqueue_job("post_editorial_job")
    → ARQ Worker (max_jobs=1)
    → PostEditorialService.post_editorial_job
    → LangGraph 파이프라인
    → Supabase post_magazines 업데이트
```

---

## gRPC ProcessPostEditorial

### Request
| 필드 | 타입 | 설명 |
|------|------|------|
| post_magazine_id | string | Backend에서 생성한 UUID |
| post_data_json | string | JSON 직렬화 PostData (post, spots, solutions) |

### Response
| 필드 | 타입 | 설명 |
|------|------|------|
| success | bool | enqueue 성공 여부 |
| message | string | 메시지 |
| batch_id | string | ARQ job_id (추적용) |

---

## ARQ post_editorial_job

- **함수**: `PostEditorialService.post_editorial_job(ctx, post_magazine_id, post_data_json)`
- **설정**:
  - `max_jobs=1`: 동시 1개만 처리 (API rate limit 고려)
  - `job_timeout=600`: 10분
  - `max_tries=1`: 실패 시 재시도 없음

---

## 파이프라인 노드

| 노드 | 파일 | 역할 |
|------|------|------|
| DesignSpec | `nodes/design_spec.py` | 포스트 이미지/컨텍스트 기반 비주얼 스펙 (accent_color 등) |
| ImageAnalysis | `nodes/image_analysis.py` | 이미지 분석 |
| ItemResearch | `nodes/item_research.py` | 스팟/솔루션 아이템 리서치 |
| Editorial | `nodes/editorial.py` | 에디토리얼 본문 생성 |
| CelebSearch | `nodes/celeb_search.py` | 셀럽 스타일 검색 |
| ItemSearch | `nodes/item_search.py` | 관련 아이템 검색 |
| Summary | `nodes/summary.py` | 매거진 요약 (ai_summary) |
| Review | `nodes/review.py` | PostMagazineLayout 품질 검수 (최대 3회 수정) |
| Publish | `nodes/publish.py` | layout_json → Supabase post_magazines 업데이트 |

### 노드 흐름

```
DesignSpec, ImageAnalysis, ItemResearch (병렬)
    → Editorial
    → CelebSearch, ItemSearch, Summary (병렬)
    → Review → (통과) Publish / (실패) Editorial 재진입 (최대 3회)
```

---

## 설정

- **GEMINI_***: Gemini API (모델: gemini-2.5-pro → gemini-2.5-flash → gemini-2.5-flash-lite fallback)
- **SUPABASE_URL**, **SUPABASE_SERVICE_ROLE_KEY**: post_magazines 테이블 업데이트
- **MetadataExtractService**: item_search 노드에서 메타데이터 추출 (configurable로 전달)
