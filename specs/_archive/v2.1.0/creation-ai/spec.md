# 생성 & AI

> 기능: C-01 ~ C-04
> 상태: 10% 구현됨
> 의존성: Vision API, Scraper 인프라

---

## 개요

생성 기능은 사용자가 플랫폼에 콘텐츠를 기여할 수 있게 합니다. AI 기능은 자동으로 아이템을 감지하고 메타데이터를 추출하여 수동 작업을 줄이고 정확도를 향상시킵니다.

### 관련 화면
- `/create` - 게시물 생성 플로우
- `/create/upload` - 이미지 업로드 단계
- `/create/detect` - AI 감지 단계
- `/create/tag` - 메타데이터 태깅 단계
- `/create/spot` - 스팟 등록

### 현재 구현 상태
- `app/lab/fashion-scan/` - 실험적 AI 시각화
- 아이템 감지용 백엔드 파이프라인 존재
- 사용자용 업로드 플로우 없음

---

## 기능

### C-01 이미지 업로드

- **설명**: 사용자가 모바일 또는 웹에서 이미지 업로드
- **우선순위**: P0
- **상태**: 미시작
- **의존성**: U-01 (인증), Supabase Storage

#### 인수 조건
- [ ] 사용자가 기기 갤러리에서 이미지 선택 가능
- [ ] 웹에서 드래그 앤 드롭 가능
- [ ] 웹에서 클립보드 붙여넣기 가능
- [ ] 다중 이미지 업로드 지원 (최대 5개)
- [ ] 제출 전 이미지 미리보기
- [ ] 업로드 중 진행률 표시
- [ ] 이미지 검증 (크기, 형식, 해상도)
- [ ] 필요시 자동 이미지 압축
- [ ] 진행 중인 업로드 취소
- [ ] 재시도 옵션이 있는 에러 처리

#### UI/UX 요구사항

**업로드 화면 (1단계)**:
```
┌─────────────────────────────────────────────────────────────┐
│  Create New Post                              [Cancel]      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │         📷                                          │   │
│  │                                                      │   │
│  │    Drag & drop images here                          │   │
│  │    or click to select                               │   │
│  │                                                      │   │
│  │    Supports: JPG, PNG, WebP                         │   │
│  │    Max size: 10MB per image                         │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ── or paste from clipboard (Ctrl+V) ──                    │
│                                                             │
│  Selected Images (2/5):                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐                                  │
│  │ [1] │ │ [2] │ │  +  │                                  │
│  │  ✕  │ │  ✕  │ │ add │                                  │
│  └─────┘ └─────┘ └─────┘                                  │
│                                                             │
│                                     [Next: Detect Items →] │
└─────────────────────────────────────────────────────────────┘
```

**모바일 업로드**:
```
┌─────────────────────────────┐
│  Create New Post      [✕]   │
│                             │
│  ┌─────────────────────┐   │
│  │                     │   │
│  │     [Camera]        │   │
│  │                     │   │
│  │   Take Photo        │   │
│  │                     │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │                     │   │
│  │     [Gallery]       │   │
│  │                     │   │
│  │   Choose from       │   │
│  │   Library           │   │
│  └─────────────────────┘   │
│                             │
└─────────────────────────────┘
```

#### 데이터 요구사항
- 업로드용 Supabase Storage 버킷
- 각 업로드에 대한 이미지 테이블 항목
- 처리용 임시 업로드 디렉토리

#### 구현 노트
```typescript
// lib/hooks/useImageUpload.ts
interface UploadProgress {
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number; // 0-100
  error?: string;
}

async function uploadImage(file: File): Promise<UploadResult> {
  // 검증
  if (file.size > 10 * 1024 * 1024) throw new Error('File too large');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Invalid file type');
  }

  // 필요시 압축
  const processedFile = await compressImage(file);

  // Supabase Storage에 업로드
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(`${userId}/${Date.now()}-${file.name}`, processedFile);

  return { url: data.path, id: generateImageId() };
}
```

#### 생성/수정할 파일
- `app/create/page.tsx` - 생성 플로우 진입점
- `app/create/upload/page.tsx` - 업로드 단계
- `lib/components/create/ImageUploader.tsx`
- `lib/components/create/ImagePreviewGrid.tsx`
- `lib/components/create/DropZone.tsx`
- `lib/hooks/useImageUpload.ts`
- `lib/utils/imageCompression.ts`

---

### C-02 AI 객체 인식

- **설명**: 업로드된 이미지에서 패션 아이템을 자동으로 감지하고 크롭
- **우선순위**: P0
- **상태**: 부분 구현 (실험적 시각화 UI만 존재, 프로덕션 API 미연결)
- **의존성**: C-01, Vision API 모듈 (S-01)

#### 현재 구현 상태
**실험적 시각화 (Mock 데이터):**
- `app/lab/fashion-scan/page.tsx` - 실험적 AI 시각화 페이지
- `lib/components/fashion-scan/FashionScanScene.tsx` - 메인 시각화 컴포넌트
- `lib/components/fashion-scan/ImageLayer.tsx` - 이미지 + 바운딩 박스 렌더링
- `lib/components/fashion-scan/CalloutLayer.tsx` - 아이템 카드 및 설명
- `lib/components/fashion-scan/callout-utils.ts` - 레이아웃 계산 유틸

**미구현:**
- `/create/detect` 페이지 (프로덕션용)
- Vision API 엔드포인트 (`/api/ai/detect`)
- 실제 이미지 → AI 감지 파이프라인

#### 인수 조건
- [ ] 업로드된 이미지를 감지 API로 전송
- [ ] "이미지 분석 중..." 로딩 상태 표시
- [ ] 감지된 아이템을 바운딩 박스와 함께 표시
- [ ] 사용자가 바운딩 박스를 수동으로 조정 가능
- [ ] 사용자가 잘못된 감지 제거 가능
- [ ] 사용자가 누락된 아이템 수동 추가 가능
- [ ] 각 아이템에 대해 크롭된 이미지 생성
- [ ] 각 아이템에 대해 카테고리 자동 제안
- [ ] 신뢰도 점수 표시
- [ ] 감지 가능한 아이템이 없는 이미지 처리

#### UI/UX 요구사항

**감지 화면 (2단계)**:
```
┌─────────────────────────────────────────────────────────────┐
│  Detect Items                                 [← Back]      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │     [Image with detection overlays]                 │   │
│  │                                                      │   │
│  │     ┌──────────┐      Detected items shown with    │   │
│  │     │  Item 1  │      dashed bounding boxes        │   │
│  │     │  93%     │                                    │   │
│  │     └──────────┘                                    │   │
│  │              ┌─────────┐                            │   │
│  │              │ Item 2  │                            │   │
│  │              │ 87%     │                            │   │
│  │              └─────────┘                            │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Found 2 items:                                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ┌────┐ Item 1                                 [✕]  │   │
│  │ │crop│ Category: Top (93%)                         │   │
│  │ └────┘ [Edit Box] [Remove]                         │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ┌────┐ Item 2                                 [✕]  │   │
│  │ │crop│ Category: Bag (87%)                         │   │
│  │ └────┘ [Edit Box] [Remove]                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [+ Add Item Manually]                                     │
│                                                             │
│                                  [Next: Add Details →]     │
└─────────────────────────────────────────────────────────────┘
```

**수동 박스 그리기**:
```
클릭하고 드래그하여 바운딩 박스 그리기:
┌─────────────────────────────────────┐
│                                     │
│     ┌ ─ ─ ─ ─ ─ ─ ┐               │
│     │             │                │
│     │   dragging  │                │
│     │             │                │
│     └ ─ ─ ─ ─ ─ ─ ┘               │
│              ↑                      │
│         resize handles              │
└─────────────────────────────────────┘
```

#### 데이터 요구사항
- Vision API 엔드포인트
- 감지 결과 스키마
- 크롭된 이미지 저장소

#### API 엔드포인트
```
POST /api/ai/detect
  body: { imageUrl: string }
  response: {
    items: Array<{
      bbox: BoundingBox;
      category: ItemCategory;
      confidence: number;
      croppedImageUrl: string;
    }>
  }
```

#### 구현 노트
```typescript
// lib/components/create/DetectionOverlay.tsx
interface DetectionResult {
  id: string;
  bbox: BoundingBox;
  category: ItemCategory;
  confidence: number;
  croppedImageUrl: string;
}

function DetectionOverlay({ imageUrl, detections, onUpdate }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleBoxResize = (id: string, newBbox: BoundingBox) => {
    onUpdate(detections.map(d =>
      d.id === id ? { ...d, bbox: newBbox } : d
    ));
  };

  // ... 드래그 핸들이 있는 바운딩 박스 렌더링
}
```

#### 생성/수정할 파일
- `app/create/detect/page.tsx` - 감지 단계
- `lib/components/create/DetectionOverlay.tsx`
- `lib/components/create/BoundingBox.tsx`
- `lib/components/create/DetectedItemList.tsx`
- `lib/hooks/useAIDetection.ts`
- `app/api/ai/detect/route.ts`

---

### C-03 메타데이터 태깅

- **설명**: 사용자가 게시물에 Media, Cast, Context 태그 선택
- **우선순위**: P0
- **상태**: 미시작
- **의존성**: C-01, D-02 (계층적 필터), 데이터베이스 구조

#### 인수 조건
- [ ] Media 선택 단계 (필수)
- [ ] Cast 멤버 선택 단계 (선택, 다중 선택)
- [ ] Context 선택 단계 (선택)
- [ ] Media/Cast 자동완성 검색
- [ ] 찾을 수 없는 경우 새 태그 요청 가능
- [ ] 필수 vs 선택 필드 명확한 표시
- [ ] 제출 전 선택한 태그 요약
- [ ] 사용자가 돌아가서 편집해도 태그 유지

#### UI/UX 요구사항

**태깅 화면 (3단계)**:
```
┌─────────────────────────────────────────────────────────────┐
│  Add Tags                                     [← Back]      │
│                                                             │
│  Where is this from? *                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔍 Search show, drama, or group...                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Popular:                                                   │
│  [BLACKPINK] [NewJeans] [Squid Game] [IVE]                │
│                                                             │
│  Selected: 🎵 BLACKPINK                             [✕]    │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Who is wearing this?                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔍 Search member name...                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Members of BLACKPINK:                                      │
│  [Jisoo] [Jennie] [Rosé] [Lisa]                           │
│                                                             │
│  Selected: 👤 Jisoo                                 [✕]    │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  What's the context?                                        │
│  [✓ Airport] [ Stage] [ MV] [ Photoshoot] [ Daily]        │
│                                                             │
│                                      [Next: Review →]      │
└─────────────────────────────────────────────────────────────┘
```

**새 태그 요청 모달**:
```
┌─────────────────────────────────────────────────────────────┐
│  Request New Tag                              [✕]          │
│                                                             │
│  Can't find what you're looking for?                       │
│  Request a new tag to be added.                            │
│                                                             │
│  Tag Type: [Media ▼]                                       │
│                                                             │
│  Name: [                                                ]   │
│                                                             │
│  Korean Name: [                                         ]   │
│                                                             │
│  Type: [Group ▼] (for Media)                               │
│                                                             │
│                            [Cancel] [Submit Request]        │
└─────────────────────────────────────────────────────────────┘
```

#### 데이터 요구사항
- Media 검색 API
- Cast 검색 API (media로 필터 가능)
- 관리자 검토용 태그 요청 테이블

#### API 엔드포인트
```
GET /api/tags/media/search?q=black
GET /api/tags/cast/search?q=jisoo&mediaId=xxx
POST /api/tags/request
  body: { type: 'media' | 'cast', name: string, nameKo: string, ... }
```

#### 생성/수정할 파일
- `app/create/tag/page.tsx` - 태깅 단계
- `lib/components/create/MediaSelector.tsx`
- `lib/components/create/CastSelector.tsx`
- `lib/components/create/ContextSelector.tsx`
- `lib/components/create/TagRequestModal.tsx`
- `lib/hooks/useTagSearch.ts`

---

### C-04 스팟 등록 (URL 파싱)

- **설명**: 사용자가 쇼핑 URL을 입력하면 시스템이 제품 정보 추출
- **우선순위**: P0
- **상태**: 미시작
- **의존성**: C-02, S-02 (Scraper Engine)

#### 인수 조건
- [ ] 감지된 각 아이템에 쇼핑 URL 붙여넣기 가능
- [ ] 시스템이 스크래핑: 제품명, 브랜드, 가격, 이미지
- [ ] 확인 전 스크래핑된 데이터 미리보기
- [ ] 모든 필드에 대해 수동 재정의 가능
- [ ] 주요 한국/해외 쇼핑 사이트 지원
- [ ] 스크래핑 실패 시 수동 입력으로 대체
- [ ] 아이템당 여러 URL (original + vibe 대안)
- [ ] 어필리에이트 링크 처리

#### UI/UX 요구사항

**스팟 등록 (4단계)**:
```
┌─────────────────────────────────────────────────────────────┐
│  Add Product Links                            [← Back]      │
│                                                             │
│  Item 1: Top                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [crop] Category: Top                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  THE ORIGINAL (Exact Match)                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔗 Paste shopping URL...                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Parsed: ✓                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Product Image]                                      │   │
│  │ Brand: Celine                            [Edit]      │   │
│  │ Name: Triomphe Jacket                    [Edit]      │   │
│  │ Price: ₩2,850,000                        [Edit]      │   │
│  │ URL: celine.com/...                      ✓ Valid     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  THE VIBE (Similar Alternative)                [+ Add]     │
│  (No alternatives added yet)                               │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Item 2: Bag                                                │
│  ...                                                        │
│                                                             │
│                                       [Publish Post →]     │
└─────────────────────────────────────────────────────────────┘
```

**URL 파싱 흐름**:
```
사용자가 URL 붙여넣기
    ↓
[Loading: Fetching product info...]
    ↓
성공 → 파싱된 데이터 표시, 사용자 확인
    ↓
실패 → 수동 입력 폼 표시
```

#### 데이터 요구사항
- Scraper API 엔드포인트
- 지원 사이트 설정
- 제품 메타데이터 스키마

#### API 엔드포인트
```
POST /api/scrape
  body: { url: string }
  response: {
    success: boolean;
    data?: {
      productName: string;
      brand: string;
      price: number;
      currency: string;
      imageUrl: string;
    };
    error?: string;
  }
```

#### 지원 사이트 (초기)
- 한국: Musinsa, 29CM, W Concept, SSF Shop
- 해외: Farfetch, SSENSE, Net-a-Porter
- 일반: Amazon, Coupang

#### 구현 노트
```typescript
// lib/hooks/useScrapeUrl.ts
interface ScrapeResult {
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: ProductData;
  error?: string;
}

function useScrapeUrl() {
  const [result, setResult] = useState<ScrapeResult>({ status: 'idle' });

  const scrape = async (url: string) => {
    setResult({ status: 'loading' });
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        body: JSON.stringify({ url })
      });
      const data = await response.json();
      if (data.success) {
        setResult({ status: 'success', data: data.data });
      } else {
        setResult({ status: 'error', error: data.error });
      }
    } catch (e) {
      setResult({ status: 'error', error: 'Network error' });
    }
  };

  return { ...result, scrape };
}
```

#### 생성/수정할 파일
- `app/create/spot/page.tsx` - 스팟 등록 단계
- `lib/components/create/SpotRegistration.tsx`
- `lib/components/create/UrlInput.tsx`
- `lib/components/create/ParsedProductCard.tsx`
- `lib/components/create/ManualProductForm.tsx`
- `lib/hooks/useScrapeUrl.ts`
- `app/api/scrape/route.ts`

---

## 데이터 모델

전체 타입 정의는 [data-models.md](./data-models.md)를 참조하세요.

### 생성 & AI의 주요 타입

```typescript
interface CreatePostState {
  step: 'upload' | 'detect' | 'tag' | 'spot' | 'review';
  images: UploadedImage[];
  detections: DetectionResult[];
  tags: {
    mediaId?: string;
    castIds: string[];
    contextType?: ContextType;
  };
  items: ItemDraft[];
}

interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
  uploadedUrl?: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
}

interface DetectionResult {
  id: string;
  imageId: string;
  bbox: BoundingBox;
  category: ItemCategory;
  confidence: number;
  croppedImageUrl: string;
  isManual: boolean;
}

interface ItemDraft {
  detectionId: string;
  original?: ProductData;
  vibes: ProductData[];
}

interface ProductData {
  productName: string;
  brand: string;
  price?: number;
  currency?: string;
  purchaseUrl: string;
  imageUrl?: string;
}
```

---

## 생성 플로우 상태 머신

```
START
  ↓
[Upload Images] → 이미지 선택됨
  ↓
[AI Detection] → 아이템 감지됨, 편집 가능
  ↓
[Metadata Tagging] → 태그 선택됨
  ↓
[Spot Registration] → 제품 URL 추가됨
  ↓
[Review & Publish] → 모든 데이터 확인
  ↓
PUBLISHED
```

---

## 마이그레이션 경로

### 1단계: 기본 업로드
1. Supabase Storage 설정
2. 업로드 UI 구축
3. 이미지 검증 및 압축

### 2단계: AI 감지
1. Vision API 연결
2. 감지 오버레이 UI 구축
3. 수동 편집 도구

### 3단계: 태깅
1. 태그 선택자 컴포넌트 구축
2. 태그 검색 API
3. 태그 요청 플로우

### 4단계: 스팟 등록
1. Scraper 통합
2. URL 파싱 UI
3. 수동 대체 폼

---

## 보안 고려사항

- 파일 타입 검증 (확장자가 아닌 magic bytes)
- 이미지 크기 제한 서버측 적용
- 업로드 엔드포인트 레이트 리미팅
- Scraper는 임의 리다이렉트 따르지 않음
- 사용자 업로드 콘텐츠 모더레이션 큐

---

## 컴포넌트 매핑 (상세 구현 참조)

> 이 섹션은 AI 파이프라인과 각 UI 요소가 실제 코드에서 어떻게 구현되는지 매핑합니다.

### AI Detection Pipeline - 전체 흐름

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         AI ITEM DETECTION PIPELINE                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [1. IMAGE INGESTION]                                                        │
│       │                                                                      │
│       ├─── 사용자 업로드 (C-01)                                              │
│       │    └─── Supabase Storage: uploads/{userId}/{timestamp}-{filename}   │
│       │                                                                      │
│       ├─── Instagram Scraper (배치)                                          │
│       │    └─── S3 Storage → CDN URL                                        │
│       │                                                                      │
│       ▼                                                                      │
│  [2. IMAGE PREPROCESSING]                                                    │
│       │                                                                      │
│       ├─── 이미지 유효성 검사                                                │
│       │    ├─── Magic bytes 검증 (not just extension)                       │
│       │    ├─── 해상도 체크 (min: 200x200, max: 4096x4096)                  │
│       │    └─── 파일 크기 체크 (max: 10MB)                                  │
│       │                                                                      │
│       ├─── 이미지 정규화                                                     │
│       │    ├─── EXIF orientation 보정                                       │
│       │    ├─── 리사이징 (max 1920px on longer side)                       │
│       │    └─── 포맷 통일 (→ JPEG quality 85)                              │
│       │                                                                      │
│       ▼                                                                      │
│  [3. AI DETECTION]                                                           │
│       │                                                                      │
│       ├─── Fashion Detection Model                                          │
│       │    │                                                                 │
│       │    ├─── Model: YOLO v8 (custom trained on fashion)                 │
│       │    │                                                                 │
│       │    ├─── Categories:                                                 │
│       │    │    ├─── top (상의)                                             │
│       │    │    ├─── bottom (하의)                                          │
│       │    │    ├─── dress (드레스/원피스)                                  │
│       │    │    ├─── outerwear (아우터)                                     │
│       │    │    ├─── bag (가방)                                             │
│       │    │    ├─── shoes (신발)                                           │
│       │    │    ├─── accessory (액세서리)                                   │
│       │    │    ├─── jewelry (주얼리)                                       │
│       │    │    └─── eyewear (안경/선글라스)                                │
│       │    │                                                                 │
│       │    └─── Output per item:                                            │
│       │         {                                                            │
│       │           bbox: { x, y, width, height },  // 정규화된 0-1 값       │
│       │           category: string,                                          │
│       │           confidence: number,  // 0-1                               │
│       │           center: { x, y }     // 스팟 위치용                         │
│       │         }                                                            │
│       │                                                                      │
│       ▼                                                                      │
│  [4. POST-PROCESSING]                                                        │
│       │                                                                      │
│       ├─── Confidence Filtering                                             │
│       │    └─── threshold: 0.5 (< 50% 신뢰도는 제외)                       │
│       │                                                                      │
│       ├─── Non-Maximum Suppression (NMS)                                    │
│       │    └─── IoU threshold: 0.5 (겹치는 박스 제거)                      │
│       │                                                                      │
│       ├─── Item Cropping                                                    │
│       │    ├─── 각 detection bbox로 이미지 크롭                            │
│       │    ├─── padding: 10% (여백 추가)                                   │
│       │    └─── 저장: crops/{imageId}/{itemIndex}.jpg                      │
│       │                                                                      │
│       ▼                                                                      │
│  [5. DATABASE STORAGE]                                                       │
│       │                                                                      │
│       ├─── post_image 테이블                                                │
│       │    {                                                                 │
│       │      id, post_id, storage_path,                                     │
│       │      item_locations: JSON[]  // detection 결과                     │
│       │    }                                                                 │
│       │                                                                      │
│       └─── item 테이블 (각 detection당)                                     │
│            {                                                                 │
│              id, post_image_id, category,                                   │
│              center: { x, y }, bbox: { ... },                               │
│              cropped_image_url                                               │
│            }                                                                 │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 비전 API 상세

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         VISION API ARCHITECTURE                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Client Request                                                              │
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ POST /api/ai/detect                                                     ││
│  │                                                                          ││
│  │ Request Body:                                                            ││
│  │ {                                                                        ││
│  │   imageUrl: string,      // Supabase Storage URL                        ││
│  │   options?: {                                                            ││
│  │     minConfidence?: number,  // default: 0.5                            ││
│  │     maxItems?: number,       // default: 10                             ││
│  │     includeAccessories?: boolean  // default: true                      ││
│  │   }                                                                      ││
│  │ }                                                                        ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ API Route Handler                                                        ││
│  │ packages/web/app/api/ai/detect/route.ts                                 ││
│  │                                                                          ││
│  │ 1. Request validation (Zod schema)                                      ││
│  │ 2. Rate limiting check (10 req/min per user)                            ││
│  │ 3. Image fetch & preprocessing                                          ││
│  │ 4. Call Vision Service                                                  ││
│  │ 5. Post-process results                                                 ││
│  │ 6. Generate crop images                                                 ││
│  │ 7. Return response                                                      ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Vision Service (External)                                                ││
│  │                                                                          ││
│  │ Option A: Self-hosted YOLO                                              ││
│  │ ├─── Docker container with FastAPI                                      ││
│  │ ├─── GPU acceleration (CUDA)                                            ││
│  │ └─── Endpoint: VISION_API_URL env var                                   ││
│  │                                                                          ││
│  │ Option B: Cloud Vision API (Google/AWS)                                 ││
│  │ ├─── Fashion-specific model                                             ││
│  │ └─── Pay-per-request pricing                                            ││
│  │                                                                          ││
│  │ Option C: Hybrid                                                        ││
│  │ ├─── Self-hosted for batch processing                                   ││
│  │ └─── Cloud API for real-time user uploads                               ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│       │                                                                      │
│       ▼                                                                      │
│  Response:                                                                   │
│  {                                                                           │
│    success: true,                                                            │
│    items: [                                                                  │
│      {                                                                       │
│        id: "uuid",                                                           │
│        category: "top",                                                      │
│        confidence: 0.93,                                                     │
│        bbox: { x: 0.15, y: 0.20, width: 0.40, height: 0.50 },              │
│        center: { x: 0.35, y: 0.45 },                                        │
│        croppedImageUrl: "https://storage.../crops/abc123/0.jpg"            │
│      },                                                                      │
│      ...                                                                     │
│    ],                                                                        │
│    processingTime: 1234  // ms                                              │
│  }                                                                           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### C-01 이미지 업로드 - 컴포넌트 매핑

#### 업로드 UI 구조

```
┌────────────────────────────────────────────────────────────────────────────┐
│ IMAGE UPLOAD COMPONENT STRUCTURE                                            │
│                                                                            │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ CreateUploadPage.tsx (app/create/upload/page.tsx)                      │ │
│ │                                                                        │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐│ │
│ │ │ CreateFlowHeader.tsx                                               ││ │
│ │ │ ┌─────────────────────────────────────────────────────────────┐   ││ │
│ │ │ │ Create New Post                              [Cancel]       │   ││ │
│ │ │ └─────────────────────────────────────────────────────────────┘   ││ │
│ │ │                                                                    ││ │
│ │ │ ┌─────────────────────────────────────────────────────────────┐   ││ │
│ │ │ │ Step Indicator: [1. Upload] - 2. Detect - 3. Tag - 4. Link │   ││ │
│ │ │ └─────────────────────────────────────────────────────────────┘   ││ │
│ │ └────────────────────────────────────────────────────────────────────┘│ │
│ │                                                                        │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐│ │
│ │ │ DropZone.tsx                                                       ││ │
│ │ │                                                                    ││ │
│ │ │ ┌────────────────────────────────────────────────────────────────┐││ │
│ │ │ │                                                                │││ │
│ │ │ │              📷 Drag & drop images here                       │││ │
│ │ │ │                                                                │││ │
│ │ │ │              or click to select files                         │││ │
│ │ │ │                                                                │││ │
│ │ │ │              ─────────────────────────                        │││ │
│ │ │ │                                                                │││ │
│ │ │ │              Supports: JPG, PNG, WebP                         │││ │
│ │ │ │              Max: 10MB per image                              │││ │
│ │ │ │                                                                │││ │
│ │ │ └────────────────────────────────────────────────────────────────┘││ │
│ │ │                                                                    ││ │
│ │ │ Events:                                                            ││ │
│ │ │ ├─── onDragEnter → setIsDragging(true), border highlight         ││ │
│ │ │ ├─── onDragLeave → setIsDragging(false)                          ││ │
│ │ │ ├─── onDrop → handleFiles(e.dataTransfer.files)                  ││ │
│ │ │ └─── onClick → inputRef.current.click()                          ││ │
│ │ │                                                                    ││ │
│ │ │ Hidden input:                                                      ││ │
│ │ │ <input type="file" accept="image/*" multiple ref={inputRef} />   ││ │
│ │ └────────────────────────────────────────────────────────────────────┘│ │
│ │                                                                        │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐│ │
│ │ │ ImagePreviewGrid.tsx                                               ││ │
│ │ │                                                                    ││ │
│ │ │ Selected Images (2/5):                                            ││ │
│ │ │ ┌─────────┐ ┌─────────┐ ┌─────────┐                              ││ │
│ │ │ │ImagePre-│ │ImagePre-│ │ AddMore │                              ││ │
│ │ │ │view.tsx │ │view.tsx │ │ Button  │                              ││ │
│ │ │ │         │ │         │ │         │                              ││ │
│ │ │ │ [img 1] │ │ [img 2] │ │   [+]   │                              ││ │
│ │ │ │   [✕]   │ │   [✕]   │ │   add   │                              ││ │
│ │ │ │uploading│ │uploaded │ │         │                              ││ │
│ │ │ │ ████░░  │ │  ✓      │ │         │                              ││ │
│ │ │ └─────────┘ └─────────┘ └─────────┘                              ││ │
│ │ │                                                                    ││ │
│ │ │ 상태:                                                             ││ │
│ │ │ images: UploadedImage[] (createStore)                            ││ │
│ │ └────────────────────────────────────────────────────────────────────┘│ │
│ │                                                                        │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐│ │
│ │ │ [Next: Detect Items →]                                            ││ │
│ │ │                                                                    ││ │
│ │ │ disabled={!hasUploadedImages || isUploading}                      ││ │
│ │ │ onClick → router.push('/create/detect')                          ││ │
│ │ └────────────────────────────────────────────────────────────────────┘│ │
│ │                                                                        │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│ 파일 위치:                                                                 │
│ packages/web/app/create/upload/page.tsx                                   │
│ packages/web/lib/components/create/                                       │
│ ├── DropZone.tsx                                                          │
│ ├── ImagePreviewGrid.tsx                                                  │
│ ├── ImagePreview.tsx                                                      │
│ └── CreateFlowHeader.tsx                                                  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

#### 이미지 업로드 이벤트 흐름

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    IMAGE UPLOAD EVENT FLOW                                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [사용자 액션: 파일 선택/드롭]                                           │
│       │                                                                  │
│       ▼                                                                  │
│  DropZone.tsx: handleFiles(fileList)                                     │
│       │                                                                  │
│       ├─── 파일 개수 검증 ────────────────────────────────────────┐      │
│       │    현재 + 새로운 파일 <= 5개                              │      │
│       │         │                                                 │      │
│       │    초과 시 → Toast: "Maximum 5 images allowed"            │      │
│       │                                                           │      │
│       ▼                                                           │      │
│  각 파일에 대해 순차 처리:                                        │      │
│       │                                                           │      │
│  for (const file of files) {                                      │      │
│       │                                                           │      │
│       ├─── [1. 클라이언트 검증] ──────────────────────────────────┤      │
│       │         │                                                 │      │
│       │         ├─── 타입 검증                                    │      │
│       │         │    file.type in ['image/jpeg', 'image/png',    │      │
│       │         │                  'image/webp']                  │      │
│       │         │                                                 │      │
│       │         ├─── 크기 검증                                    │      │
│       │         │    file.size <= 10 * 1024 * 1024 (10MB)        │      │
│       │         │                                                 │      │
│       │         └─── 실패 시 → Toast with error                   │      │
│       │                                                           │      │
│       ├─── [2. 프리뷰 생성] ──────────────────────────────────────┤      │
│       │         │                                                 │      │
│       │         ├─── URL.createObjectURL(file)                   │      │
│       │         │                                                 │      │
│       │         └─── createStore.addImage({                      │      │
│       │                id: uuid(),                                │      │
│       │                file,                                      │      │
│       │                previewUrl,                                │      │
│       │                status: 'pending'                          │      │
│       │              })                                           │      │
│       │                                                           │      │
│       ├─── [3. 이미지 압축] ──────────────────────────────────────┤      │
│       │         │                                                 │      │
│       │         ├─── browser-image-compression 라이브러리         │      │
│       │         │    options: {                                   │      │
│       │         │      maxSizeMB: 2,                             │      │
│       │         │      maxWidthOrHeight: 1920,                   │      │
│       │         │      useWebWorker: true                        │      │
│       │         │    }                                           │      │
│       │         │                                                 │      │
│       │         └─── createStore.updateImage(id, {               │      │
│       │                status: 'uploading',                       │      │
│       │                progress: 0                                │      │
│       │              })                                           │      │
│       │                                                           │      │
│       ├─── [4. Supabase 업로드] ──────────────────────────────────┤      │
│       │         │                                                 │      │
│       │         ├─── path = `uploads/${userId}/${timestamp}_${name}`     │
│       │         │                                                 │      │
│       │         ├─── supabase.storage                            │      │
│       │         │      .from('user-uploads')                     │      │
│       │         │      .upload(path, compressedFile, {           │      │
│       │         │        cacheControl: '3600',                   │      │
│       │         │        upsert: false,                          │      │
│       │         │        onUploadProgress: (progress) => {       │      │
│       │         │          createStore.updateImage(id, {         │      │
│       │         │            progress: progress.percent           │      │
│       │         │          })                                     │      │
│       │         │        }                                        │      │
│       │         │      })                                         │      │
│       │         │                                                 │      │
│       │         └─── 성공 시 → createStore.updateImage(id, {     │      │
│       │                         status: 'uploaded',               │      │
│       │                         uploadedUrl: publicUrl            │      │
│       │                       })                                  │      │
│       │                                                           │      │
│       └─── [5. 에러 처리] ────────────────────────────────────────┤      │
│                 │                                                 │      │
│                 └─── 실패 시 → createStore.updateImage(id, {     │      │
│                                 status: 'error',                  │      │
│                                 error: message                    │      │
│                               })                                  │      │
│  }                                                                │      │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### C-02 AI Detection - 컴포넌트 매핑

#### Detection UI 구조

```
┌────────────────────────────────────────────────────────────────────────────┐
│ AI DETECTION COMPONENT STRUCTURE                                            │
│                                                                            │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ CreateDetectPage.tsx (app/create/detect/page.tsx)                      │ │
│ │                                                                        │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐│ │
│ │ │ CreateFlowHeader.tsx                                               ││ │
│ │ │ Step Indicator: 1. Upload - [2. Detect] - 3. Tag - 4. Link        ││ │
│ │ └────────────────────────────────────────────────────────────────────┘│ │
│ │                                                                        │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐│ │
│ │ │ DetectionCanvas.tsx                                                ││ │
│ │ │                                                                    ││ │
│ │ │ ┌────────────────────────────────────────────────────────────────┐││ │
│ │ │ │ Canvas Container (position: relative)                          │││ │
│ │ │ │                                                                │││ │
│ │ │ │  ┌────────────────────────────────────────────────────────┐   │││ │
│ │ │ │  │ <Image />  (업로드된 이미지)                           │   │││ │
│ │ │ │  │                                                        │   │││ │
│ │ │ │  │     ┌─ ─ ─ ─ ─ ─ ─ ┐  BoundingBox.tsx #1              │   │││ │
│ │ │ │  │     │              │  category: "top"                  │   │││ │
│ │ │ │  │     │   Item 1     │  confidence: 93%                  │   │││ │
│ │ │ │  │     │   93%        │  draggable, resizable            │   │││ │
│ │ │ │  │     └─ ─ ─ ─ ─ ─ ─ ┘                                  │   │││ │
│ │ │ │  │                                                        │   │││ │
│ │ │ │  │          ┌─ ─ ─ ─ ─ ─ ┐  BoundingBox.tsx #2           │   │││ │
│ │ │ │  │          │            │  category: "bag"               │   │││ │
│ │ │ │  │          │  Item 2    │  confidence: 87%               │   │││ │
│ │ │ │  │          │  87%       │                                │   │││ │
│ │ │ │  │          └─ ─ ─ ─ ─ ─ ┘                                │   │││ │
│ │ │ │  │                                                        │   │││ │
│ │ │ │  └────────────────────────────────────────────────────────┘   │││ │
│ │ │ │                                                                │││ │
│ │ │ │  Tools:                                                        │││ │
│ │ │ │  [Select] [Draw New Box] [Zoom In] [Zoom Out]                 │││ │
│ │ │ │                                                                │││ │
│ │ │ └────────────────────────────────────────────────────────────────┘││ │
│ │ │                                                                    ││ │
│ │ │ 모드:                                                             ││ │
│ │ │ - select: 박스 선택/이동/리사이즈                                ││ │
│ │ │ - draw: 새 박스 그리기                                           ││ │
│ │ └────────────────────────────────────────────────────────────────────┘│ │
│ │                                                                        │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐│ │
│ │ │ DetectedItemList.tsx                                               ││ │
│ │ │                                                                    ││ │
│ │ │ Found 2 items:                                                    ││ │
│ │ │                                                                    ││ │
│ │ │ ┌────────────────────────────────────────────────────────────────┐││ │
│ │ │ │ DetectedItemCard.tsx #1                                        │││ │
│ │ │ │                                                                │││ │
│ │ │ │ ┌────┐  Item 1                                          [✕]  │││ │
│ │ │ │ │crop│  Category: [Top ▼]  (드롭다운으로 변경 가능)          │││ │
│ │ │ │ └────┘  Confidence: 93%                                      │││ │
│ │ │ │                                                                │││ │
│ │ │ │         [Edit Box]  [Remove]                                  │││ │
│ │ │ │                                                                │││ │
│ │ │ │ onClick → setSelectedBoxId(item.id)                          │││ │
│ │ │ └────────────────────────────────────────────────────────────────┘││ │
│ │ │                                                                    ││ │
│ │ │ ┌────────────────────────────────────────────────────────────────┐││ │
│ │ │ │ DetectedItemCard.tsx #2                                        │││ │
│ │ │ │ ...                                                            │││ │
│ │ │ └────────────────────────────────────────────────────────────────┘││ │
│ │ │                                                                    ││ │
│ │ │ [+ Add Item Manually]                                             ││ │
│ │ └────────────────────────────────────────────────────────────────────┘│ │
│ │                                                                        │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐│ │
│ │ │ [← Back]                           [Next: Add Details →]          ││ │
│ │ └────────────────────────────────────────────────────────────────────┘│ │
│ │                                                                        │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│ 파일 위치:                                                                 │
│ packages/web/app/create/detect/page.tsx                                   │
│ packages/web/lib/components/create/                                       │
│ ├── DetectionCanvas.tsx                                                   │
│ ├── BoundingBox.tsx                                                       │
│ ├── DetectedItemList.tsx                                                  │
│ └── DetectedItemCard.tsx                                                  │
│                                                                            │
│ 훅:                                                                        │
│ packages/web/lib/hooks/useAIDetection.ts                                  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

#### AI Detection 이벤트 흐름

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    AI DETECTION EVENT FLOW                                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [페이지 마운트]                                                         │
│       │                                                                  │
│       ▼                                                                  │
│  CreateDetectPage.tsx                                                    │
│       │                                                                  │
│       ├─── createStore.images 로드                                      │
│       │                                                                  │
│       ├─── 각 이미지에 대해 detection 실행 ─────────────────────────┐    │
│       │         │                                                   │    │
│       │         ▼                                                   │    │
│       │    useAIDetection(imageUrl)                                 │    │
│       │         │                                                   │    │
│       │         ├─── 상태: 'loading'                                │    │
│       │         │    UI: "Analyzing image..." + Spinner             │    │
│       │         │                                                   │    │
│       │         ├─── POST /api/ai/detect                           │    │
│       │         │    body: { imageUrl }                             │    │
│       │         │                                                   │    │
│       │         │         │                                         │    │
│       │         │    ┌────┴────┐                                    │    │
│       │         │    ▼         ▼                                    │    │
│       │         │ Success   Error                                   │    │
│       │         │    │         │                                    │    │
│       │         │    │         └─── 상태: 'error'                   │    │
│       │         │    │              UI: "Detection failed"          │    │
│       │         │    │              [Retry] 버튼                     │    │
│       │         │    │                                              │    │
│       │         │    └─── 상태: 'success'                           │    │
│       │         │         detections = response.items               │    │
│       │         │         createStore.setDetections(detections)     │    │
│       │         │                                                   │    │
│       ▼         │                                                   │    │
│  [Detection 결과 표시]                                               │    │
│       │                                                              │    │
│       ├─── items.length === 0?                                      │    │
│       │         │                                                   │    │
│       │    YES  ▼                                                   │    │
│       │    "No items detected"                                      │    │
│       │    [Draw manually] 버튼                                     │    │
│       │                                                              │    │
│       │    NO   ▼                                                   │    │
│       │    DetectionCanvas에 BoundingBox 렌더링                     │    │
│       │    DetectedItemList에 카드 렌더링                           │    │
│       │                                                              │    │
│       ▼                                                              │    │
│  [사용자 수정]                                                       │    │
│       │                                                              │    │
│       ├─── BoundingBox 드래그                                       │    │
│       │    onDrag → createStore.updateDetection(id, { bbox })      │    │
│       │                                                              │    │
│       ├─── BoundingBox 리사이즈                                     │    │
│       │    onResize → createStore.updateDetection(id, { bbox })    │    │
│       │                                                              │    │
│       ├─── Category 변경                                            │    │
│       │    onCategoryChange → createStore.updateDetection(id,      │    │
│       │                       { category })                         │    │
│       │                                                              │    │
│       ├─── 항목 삭제                                                │    │
│       │    onRemove → createStore.removeDetection(id)              │    │
│       │                                                              │    │
│       └─── 수동 추가                                                │    │
│            onAddManual → setMode('draw')                            │    │
│            사용자가 캔버스에 박스 그리기                             │    │
│            onDrawComplete → createStore.addDetection({              │    │
│              bbox, category: 'unknown', isManual: true              │    │
│            })                                                        │    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### C-04 스팟 등록 - 컴포넌트 매핑

#### URL 파싱 이벤트 흐름

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    URL SCRAPING EVENT FLOW                                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [사용자 액션: URL 붙여넣기]                                             │
│       │                                                                  │
│       ▼                                                                  │
│  UrlInput.tsx: onPaste/onChange                                          │
│       │                                                                  │
│       ├─── URL 형식 검증 (regex) ────────────────────────────────────┐   │
│       │         │                                                    │   │
│       │    유효하지 않음 → 에러 표시: "Invalid URL"                   │   │
│       │                                                              │   │
│       │    유효함 ▼                                                  │   │
│       │    useScrapeUrl().scrape(url)                                │   │
│       │         │                                                    │   │
│       │         ▼                                                    │   │
│       │    상태: 'loading'                                           │   │
│       │    UI: [████████░░░░░░░] Fetching product info...           │   │
│       │         │                                                    │   │
│       │         ▼                                                    │   │
│       │    POST /api/scrape                                          │   │
│       │    body: { url }                                             │   │
│       │         │                                                    │   │
│       │    ┌────┴────────────────────────────────────────┐           │   │
│       │    ▼                                              ▼           │   │
│       │  Server-side Scraping                         Timeout        │   │
│       │    │                                              │           │   │
│       │    ├─── 지원 사이트 확인                         │           │   │
│       │    │    scraperConfigs[domain]                   │           │   │
│       │    │                                              │           │   │
│       │    ├─── Puppeteer/Playwright 실행                │           │   │
│       │    │    (필요시 JavaScript 렌더링)               │           │   │
│       │    │                                              │           │   │
│       │    ├─── HTML 파싱                                │           │   │
│       │    │    Cheerio로 상품 정보 추출                 │           │   │
│       │    │                                              │           │   │
│       │    ├─── 정규화                                   │           │   │
│       │    │    {                                         │           │   │
│       │    │      productName: string,                   │           │   │
│       │    │      brand: string,                         │           │   │
│       │    │      price: number,                         │           │   │
│       │    │      currency: string,                      │           │   │
│       │    │      imageUrl: string                       │           │   │
│       │    │    }                                         │           │   │
│       │    │                                              │           │   │
│       │    │         │                                    │           │   │
│       │    │    ┌────┴────┐                              │           │   │
│       │    │    ▼         ▼                              ▼           │   │
│       │  Success    Partial     Failed / Unsupported / Timeout      │   │
│       │    │         │              │                                │   │
│       │    │         │              └─── 상태: 'error'               │   │
│       │    │         │                   UI: "Could not fetch"       │   │
│       │    │         │                   [Enter manually] 버튼        │   │
│       │    │         │                                               │   │
│       │    │         └─── 상태: 'partial'                            │   │
│       │    │              UI: ParsedProductCard (일부 필드 비어있음) │   │
│       │    │              필드별 [Edit] 버튼                         │   │
│       │    │                                                         │   │
│       │    └─── 상태: 'success'                                      │   │
│       │         UI: ParsedProductCard (모든 정보 표시)               │   │
│       │         createStore.setItemProduct(detectionId, {            │   │
│       │           type: 'original', data: parsedData                 │   │
│       │         })                                                   │   │
│       │                                                              │   │
│       ▼                                                              │   │
│  [수동 입력 fallback]                                                │   │
│       │                                                              │   │
│       └─── ManualProductForm.tsx                                    │   │
│            ├─── Brand input (autocomplete)                          │   │
│            ├─── Product name input                                  │   │
│            ├─── Price input (currency selector)                     │   │
│            ├─── Image URL input (or upload)                         │   │
│            └─── [Save] → createStore.setItemProduct(...)            │   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### createStore (생성 플로우 상태)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ CREATE FLOW STATE STORE                                                    │
│                                                                            │
│ packages/web/lib/stores/createStore.ts                                    │
│                                                                            │
│ interface CreateState {                                                    │
│   // Current step                                                          │
│   step: 'upload' | 'detect' | 'tag' | 'spot' | 'review';                  │
│                                                                            │
│   // Step 1: Upload                                                        │
│   images: UploadedImage[];                                                │
│   addImage: (image: UploadedImage) => void;                               │
│   updateImage: (id: string, updates: Partial<UploadedImage>) => void;    │
│   removeImage: (id: string) => void;                                      │
│                                                                            │
│   // Step 2: Detect                                                        │
│   detections: DetectionResult[];                                          │
│   setDetections: (detections: DetectionResult[]) => void;                 │
│   updateDetection: (id: string, updates: Partial<DetectionResult>) => void;│
│   removeDetection: (id: string) => void;                                  │
│   addDetection: (detection: DetectionResult) => void;                     │
│                                                                            │
│   // Step 3: Tag                                                           │
│   tags: {                                                                  │
│     mediaId: string | null;                                               │
│     castIds: string[];                                                     │
│     contextType: ContextType | null;                                      │
│   };                                                                       │
│   setMedia: (mediaId: string | null) => void;                             │
│   toggleCast: (castId: string) => void;                                   │
│   setContext: (contextType: ContextType | null) => void;                  │
│                                                                            │
│   // Step 4: Spot                                                          │
│   items: Map<string, ItemDraft>;  // detectionId → ItemDraft              │
│   setItemProduct: (                                                        │
│     detectionId: string,                                                   │
│     type: 'original' | 'vibe',                                            │
│     data: ProductData                                                      │
│   ) => void;                                                               │
│   removeItemProduct: (detectionId: string, type: string) => void;         │
│                                                                            │
│   // Navigation                                                            │
│   goToStep: (step: CreateState['step']) => void;                          │
│   canProceed: () => boolean;  // 현재 step 완료 여부                      │
│                                                                            │
│   // Reset                                                                 │
│   reset: () => void;                                                       │
│ }                                                                          │
│                                                                            │
│ Step 진행 조건:                                                            │
│ ├─── upload → detect: images.length > 0 && 모든 이미지 uploaded           │
│ ├─── detect → tag: detections.length > 0                                  │
│ ├─── tag → spot: tags.mediaId !== null                                    │
│ └─── spot → review: 최소 1개 item에 original 설정                         │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 에지 케이스 및 에러 처리

### C-01 이미지 업로드

| 상황 | 처리 방법 | 구현 위치 |
|------|----------|----------|
| 파일 5개 초과 | Toast 알림 + 추가 파일 무시 | DropZone.tsx |
| 잘못된 파일 형식 | Toast 에러 + 파일 거부 | useImageUpload.ts |
| 파일 크기 초과 (>10MB) | Toast 에러 + 파일 거부 | useImageUpload.ts |
| 업로드 네트워크 오류 | 재시도 버튼 + 에러 상태 표시 | ImagePreview.tsx |
| 압축 실패 | 원본 파일로 업로드 시도 | imageCompression.ts |

### C-02 AI Detection

| 상황 | 처리 방법 | 구현 위치 |
|------|----------|----------|
| Detection API 타임아웃 | 재시도 버튼 + 수동 입력 옵션 | useAIDetection.ts |
| 아이템 0개 감지 | "No items found" + 수동 추가 안내 | CreateDetectPage.tsx |
| 낮은 신뢰도 (<50%) | 결과에서 제외 (필터링) | /api/ai/detect |
| 박스 겹침 | NMS로 중복 제거 | /api/ai/detect |
| 이미지 로드 실패 | placeholder + 에러 메시지 | DetectionCanvas.tsx |

### C-03 메타데이터 태깅

| 상황 | 처리 방법 | 구현 위치 |
|------|----------|----------|
| 미디어 검색 결과 없음 | "Request new tag" 옵션 표시 | MediaSelector.tsx |
| 필수 필드 미선택 | Next 버튼 비활성화 + 안내 | CreateTagPage.tsx |
| 네트워크 오류 | 검색 결과 캐시 사용 + 재시도 | useTagSearch.ts |

### C-04 스팟 등록

| 상황 | 처리 방법 | 구현 위치 |
|------|----------|----------|
| 미지원 사이트 | 수동 입력 폼 표시 | useScrapeUrl.ts |
| 스크래핑 실패 | 수동 입력 폼 표시 | SpotRegistration.tsx |
| 가격 파싱 실패 | 가격 필드만 수동 입력 요청 | ParsedProductCard.tsx |
| 이미지 URL 만료 | 이미지 다운로드 후 재업로드 | /api/scrape |

---

---

## 모바일 UI 명세

> 모바일 앱 (packages/mobile)에서의 생성 플로우 상세 명세

### 모바일 vs 웹 차이점 요약

| 기능 | 웹 (packages/web) | 모바일 (packages/mobile) |
|------|------------------|------------------------|
| 이미지 소스 | 파일 선택, 드래그&드롭, 클립보드 | 카메라, 갤러리, 클립보드 |
| 권한 | 없음 | 카메라, 갤러리 접근 권한 |
| 박스 조작 | 마우스 드래그/리사이즈 | 터치 제스처 (드래그, 핀치 줌, 롱프레스) |
| 태그 선택 | 드롭다운 with 검색 | 풀스크린 검색 시트 |
| URL 입력 | 텍스트 필드 | 공유 시트 수신 + 텍스트 필드 |
| 레이아웃 | 2컬럼 (이미지 좌, 패널 우) | 단일 컬럼 + 스텝 네비게이션 |

---

### C-01 모바일 이미지 업로드

#### 모바일 업로드 화면 구조

```
┌─────────────────────────────────────────┐
│  Create Post                      [✕]   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │       Step 1 of 4: Upload       │   │
│  │  ●───○───○───○                   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │          📷                     │   │
│  │                                 │   │
│  │    Take Photo                   │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │          🖼️                     │   │
│  │                                 │   │
│  │    Choose from Gallery          │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │          📋                     │   │
│  │                                 │   │
│  │    Paste from Clipboard         │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Selected (0/5):                        │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐       │
│  │ + │ │   │ │   │ │   │ │   │       │
│  └───┘ └───┘ └───┘ └───┘ └───┘       │
│                                         │
│         [Next: Detect Items]            │
│         (disabled until 1+ selected)    │
└─────────────────────────────────────────┘
```

#### 권한 요청 플로우

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    MOBILE PERMISSION FLOW                                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [카메라 버튼 탭]                                                         │
│       │                                                                  │
│       ▼                                                                  │
│  Permissions.getAsync(Permissions.CAMERA)                                │
│       │                                                                  │
│       ├─── status === 'granted' ────────────────────────────────────┐    │
│       │         └─── 카메라 실행                                    │    │
│       │                                                              │    │
│       ├─── status === 'undetermined' ───────────────────────────────┤    │
│       │         │                                                   │    │
│       │         ▼                                                   │    │
│       │    ┌─────────────────────────────────────┐                  │    │
│       │    │  Camera Access Required              │                  │    │
│       │    │                                      │                  │    │
│       │    │  Decoded needs camera access to      │                  │    │
│       │    │  take photos of fashion items.       │                  │    │
│       │    │                                      │                  │    │
│       │    │  [Not Now]        [Allow Access]     │                  │    │
│       │    └─────────────────────────────────────┘                  │    │
│       │         │                                                   │    │
│       │         └─── Permissions.requestAsync(CAMERA)              │    │
│       │                   │                                         │    │
│       │              granted → 카메라 실행                          │    │
│       │              denied → Toast "카메라 권한 필요"              │    │
│       │                                                              │    │
│       └─── status === 'denied' ─────────────────────────────────────┤    │
│                 │                                                   │    │
│                 ▼                                                   │    │
│            ┌─────────────────────────────────────┐                  │    │
│            │  Camera Access Denied                │                  │    │
│            │                                      │                  │    │
│            │  Please enable camera access in      │                  │    │
│            │  your device settings.               │                  │    │
│            │                                      │                  │    │
│            │  [Cancel]         [Open Settings]    │                  │    │
│            └─────────────────────────────────────┘                  │    │
│                 │                                                   │    │
│                 └─── Linking.openSettings()                        │    │
│                                                                          │
│  [갤러리 버튼 탭] - 동일한 플로우 (MEDIA_LIBRARY 권한)                   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

#### 모바일 업로드 컴포넌트 매핑

##### CreateUploadScreen.tsx

```
packages/mobile/app/(main)/create/upload.tsx

┌────────────────────────────────────────────────────────────────────────┐
│ CreateUploadScreen                                                      │
│                                                                         │
│ Props: (Screen Component - no props, uses route params)                 │
│                                                                         │
│ State (Zustand - createStore):                                          │
│ ├─── images: UploadedImage[]                                           │
│ ├─── isUploading: boolean                                              │
│ └─── uploadProgress: Record<string, number>                            │
│                                                                         │
│ Local State:                                                            │
│ ├─── showPermissionModal: boolean                                      │
│ └─── permissionType: 'camera' | 'gallery' | null                       │
│                                                                         │
│ 자식 컴포넌트:                                                          │
│ ├─── <CreateStepIndicator step={1} totalSteps={4} />                   │
│ ├─── <SourceOptionCard type="camera" onPress={handleCameraPress} />    │
│ ├─── <SourceOptionCard type="gallery" onPress={handleGalleryPress} />  │
│ ├─── <SourceOptionCard type="clipboard" onPress={handleClipboard} />   │
│ ├─── <ImageThumbnailStrip images={images} onRemove={handleRemove} />   │
│ └─── <NextStepButton disabled={!canProceed} onPress={goToDetect} />    │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

##### SourceOptionCard.tsx

```typescript
// packages/mobile/lib/components/create/SourceOptionCard.tsx

interface SourceOptionCardProps {
  type: 'camera' | 'gallery' | 'clipboard';
  onPress: () => void;
  disabled?: boolean;
}

interface SourceOptionCardState {
  isPressed: boolean;
}

// 렌더링
// - Pressable 카드 (터치 피드백)
// - 아이콘 + 텍스트
// - disabled 시 회색 처리
```

##### ImageThumbnailStrip.tsx

```typescript
// packages/mobile/lib/components/create/ImageThumbnailStrip.tsx

interface ImageThumbnailStripProps {
  images: UploadedImage[];
  maxImages: number; // default: 5
  onRemove: (id: string) => void;
  onAdd: () => void;
}

// 렌더링
// - FlatList horizontal
// - 각 이미지: 썸네일 + 삭제 버튼 + 업로드 상태
// - 마지막: "+" 버튼 (maxImages 미만일 때)
```

#### 카메라 촬영 플로우

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    CAMERA CAPTURE FLOW                                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [카메라 화면 진입]                                                       │
│       │                                                                  │
│       ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │                    [Camera Preview - Full Screen]                   ││
│  │                                                                     ││
│  │                                                                     ││
│  │                                                                     ││
│  │                                                                     ││
│  │                                                                     ││
│  │  ┌─────────────────────────────────────────────────────────────┐   ││
│  │  │  [Flash]    [Capture Button]    [Flip Camera]               │   ││
│  │  │    💡             ⚪              🔄                        │   ││
│  │  └─────────────────────────────────────────────────────────────┘   ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│       │                                                                  │
│       ▼                                                                  │
│  [셔터 버튼 탭]                                                           │
│       │                                                                  │
│       ├─── takePictureAsync({ quality: 0.8 })                           │
│       │                                                                  │
│       ▼                                                                  │
│  [촬영 확인 화면]                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │                    [Captured Image Preview]                         ││
│  │                                                                     ││
│  │  ┌─────────────────────────────────────────────────────────────┐   ││
│  │  │  [Retake]                               [Use Photo]          │   ││
│  │  │    ↩️                                      ✓                 │   ││
│  │  └─────────────────────────────────────────────────────────────┘   ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│       │                                                                  │
│       ├─── [Retake] → 카메라 화면으로 돌아가기                          │
│       │                                                                  │
│       └─── [Use Photo] → createStore.addImage(capturedImage)            │
│                        → 업로드 화면으로 돌아가기                       │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

#### 갤러리 선택 플로우

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    GALLERY PICKER FLOW                                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [갤러리 버튼 탭]                                                         │
│       │                                                                  │
│       ▼                                                                  │
│  ImagePicker.launchImageLibraryAsync({                                   │
│    mediaTypes: ImagePicker.MediaTypeOptions.Images,                      │
│    allowsMultipleSelection: true,                                        │
│    selectionLimit: remainingSlots,  // 5 - 현재 선택된 이미지 수        │
│    quality: 0.8,                                                         │
│    exif: false,                                                          │
│  })                                                                      │
│       │                                                                  │
│       ├─── canceled: true                                                │
│       │         └─── return (아무 동작 없음)                             │
│       │                                                                  │
│       └─── assets: ImagePickerAsset[]                                    │
│                 │                                                        │
│                 ▼                                                        │
│            for (const asset of assets) {                                 │
│                 │                                                        │
│                 ├─── 파일 크기 검증                                      │
│                 │    asset.fileSize > 10MB → Toast 경고, skip            │
│                 │                                                        │
│                 ├─── 이미지 압축 (manipulateAsync)                       │
│                 │    resize: { width: 1920 }                             │
│                 │    compress: 0.8                                       │
│                 │                                                        │
│                 └─── createStore.addImage({                              │
│                        id: uuid(),                                       │
│                        uri: compressedUri,                               │
│                        status: 'pending'                                 │
│                      })                                                  │
│            }                                                             │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### C-02 모바일 AI Detection

#### 모바일 Detection 화면 구조

```
┌─────────────────────────────────────────┐
│  Detect Items                     [←]   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │       Step 2 of 4: Detect       │   │
│  │  ○───●───○───○                   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │  [Image with Bounding Boxes]    │   │
│  │                                 │   │
│  │     ┌─────────┐                 │   │
│  │     │ Item 1  │ ← 드래그 가능   │   │
│  │     │  93%    │                 │   │
│  │     └─────────┘                 │   │
│  │                                 │   │
│  │          ┌───────┐              │   │
│  │          │Item 2 │              │   │
│  │          └───────┘              │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Pinch to zoom • Drag boxes to adjust   │
│                                         │
│  Found 2 items:                         │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ [crop] Top (93%)          [···] │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ [crop] Bag (87%)          [···] │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [+ Add Item Manually]                  │
│                                         │
│         [Next: Add Tags]                │
└─────────────────────────────────────────┘
```

#### 모바일 터치 제스처

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    MOBILE GESTURE HANDLING                                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  라이브러리: react-native-gesture-handler + react-native-reanimated      │
│                                                                          │
│  [1. 이미지 줌/팬]                                                        │
│       │                                                                  │
│       ├─── PinchGestureHandler                                          │
│       │    └─── 두 손가락 핀치 → scale 조절 (0.5 ~ 3.0)                │
│       │                                                                  │
│       ├─── PanGestureHandler (이미지용)                                  │
│       │    └─── 두 손가락 드래그 → translateX, translateY               │
│       │                                                                  │
│       └─── DoubleTapGestureHandler                                      │
│            └─── 더블탭 → 원래 크기로 리셋                               │
│                                                                          │
│  [2. 박스 선택]                                                           │
│       │                                                                  │
│       └─── TapGestureHandler (박스 영역)                                 │
│            └─── 탭 → setSelectedBoxId(box.id)                           │
│                 └─── 선택된 박스: 파란 테두리 + 리사이즈 핸들           │
│                                                                          │
│  [3. 박스 이동]                                                           │
│       │                                                                  │
│       └─── PanGestureHandler (선택된 박스)                               │
│            └─── 한 손가락 드래그 → box.center 업데이트                  │
│            └─── onEnd → createStore.updateDetection(id, { bbox })       │
│                                                                          │
│  [4. 박스 리사이즈]                                                       │
│       │                                                                  │
│       └─── PanGestureHandler (코너 핸들)                                 │
│            ├─── 우하단 핸들 드래그 → width, height 조절                  │
│            ├─── 최소 크기 제한: 50x50 px                                │
│            └─── 종횡비 유지 옵션 (shift 대체: 두 손가락)                │
│                                                                          │
│  [5. 박스 삭제]                                                           │
│       │                                                                  │
│       └─── LongPressGestureHandler (선택된 박스)                         │
│            └─── 1초 롱프레스 → 삭제 확인 ActionSheet                    │
│                 ├─── "Delete this item"                                 │
│                 └─── "Cancel"                                           │
│                                                                          │
│  [6. 수동 박스 그리기]                                                    │
│       │                                                                  │
│       └─── [+ Add Manually] 버튼 탭 → 그리기 모드 진입                   │
│            └─── PanGestureHandler (전체 캔버스)                          │
│                 └─── 한 손가락 드래그 → 새 박스 생성                    │
│                 └─── onEnd → 카테고리 선택 ActionSheet                  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

#### 모바일 Detection 컴포넌트

##### DetectionScreen.tsx

```typescript
// packages/mobile/app/(main)/create/detect.tsx

interface DetectionScreenState {
  // Zustand
  images: UploadedImage[];
  detections: DetectionResult[];

  // Local
  selectedBoxId: string | null;
  mode: 'select' | 'draw';
  scale: number;
  translateX: number;
  translateY: number;
  isLoading: boolean;
}

// 자식 컴포넌트
// - CreateStepIndicator
// - DetectionCanvasMobile (GestureHandlerRootView)
// - DetectedItemListMobile (FlatList)
// - AddManuallyButton
// - NextStepButton
```

##### DetectionCanvasMobile.tsx

```typescript
// packages/mobile/lib/components/create/DetectionCanvasMobile.tsx

interface DetectionCanvasMobileProps {
  image: UploadedImage;
  detections: DetectionResult[];
  selectedId: string | null;
  mode: 'select' | 'draw';
  onSelectBox: (id: string | null) => void;
  onUpdateBox: (id: string, bbox: BoundingBox) => void;
  onDeleteBox: (id: string) => void;
  onAddBox: (bbox: BoundingBox) => void;
}

// 내부 컴포넌트
// - GestureDetector (핀치 줌)
// - Animated.Image (이미지)
// - BoundingBoxMobile[] (각 detection)
```

##### BoundingBoxMobile.tsx

```typescript
// packages/mobile/lib/components/create/BoundingBoxMobile.tsx

interface BoundingBoxMobileProps {
  detection: DetectionResult;
  isSelected: boolean;
  imageScale: number;
  onSelect: () => void;
  onUpdate: (bbox: BoundingBox) => void;
  onDelete: () => void;
}

interface BoundingBoxMobileState {
  position: Animated.ValueXY;
  size: { width: Animated.Value; height: Animated.Value };
}

// 렌더링
// - Animated.View (박스)
// - 라벨 (카테고리 + 신뢰도)
// - isSelected일 때: 리사이즈 핸들 4개
```

---

### C-03 모바일 메타데이터 태깅

#### 모바일 태깅 화면 구조

```
┌─────────────────────────────────────────┐
│  Add Tags                         [←]   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │       Step 3 of 4: Tags         │   │
│  │  ○───○───●───○                   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Where is this from? *                  │
│  ┌─────────────────────────────────┐   │
│  │ 🔍 Search show, drama, group... │   │
│  │                              [>]│   │
│  └─────────────────────────────────┘   │
│  → 탭 시 풀스크린 검색 시트 열림        │
│                                         │
│  Selected: BLACKPINK              [✕]   │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Who is wearing this?                   │
│  ┌─────────────────────────────────┐   │
│  │ Select cast members...       [>]│   │
│  └─────────────────────────────────┘   │
│  → 탭 시 풀스크린 검색 시트 열림        │
│                                         │
│  Selected:                              │
│  ┌──────┐ ┌──────┐                     │
│  │Jisoo │ │Jennie│                     │
│  │  ✕   │ │  ✕   │                     │
│  └──────┘ └──────┘                     │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Context                                │
│  ┌────────────────────────────────┐    │
│  │ [Airport✓] [Stage] [MV]       │    │
│  │ [Photoshoot] [Daily] [Event]  │    │
│  └────────────────────────────────┘    │
│                                         │
│         [Next: Add Links]               │
└─────────────────────────────────────────┘
```

#### 풀스크린 검색 시트 (Media)

```
┌─────────────────────────────────────────┐
│  ← Select Media                         │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🔍 Search...                    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Recent:                                │
│  ┌─────────────────────────────────┐   │
│  │ 🎵 BLACKPINK                    │   │
│  │ 🎵 NewJeans                     │   │
│  │ 📺 Squid Game                   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Popular:                               │
│  ┌─────────────────────────────────┐   │
│  │ 🎵 IVE                          │   │
│  │ 🎵 aespa                        │   │
│  │ 📺 Lovely Runner                │   │
│  │ ...                             │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Can't find it?                         │
│  [Request New Tag]                      │
│                                         │
└─────────────────────────────────────────┘

검색 입력 시:
┌─────────────────────────────────────────┐
│  ← Select Media                         │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🔍 black                      ✕ │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Results:                               │
│  ┌─────────────────────────────────┐   │
│  │ 🎵 BLACKPINK         Group      │   │
│  │ 🎵 Black Pink (debut)           │   │
│  │ 📺 Black Knight      Drama      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  탭 → 선택 후 자동으로 시트 닫힘        │
│                                         │
└─────────────────────────────────────────┘
```

---

## C-03 메타데이터 태깅 - 컴포넌트 상세 매핑

> 웹/모바일 공통 및 플랫폼별 구현 상세

### MediaSelector 컴포넌트

#### 웹 버전 (MediaSelector.tsx)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ MediaSelector.tsx (Web)                                                     │
│ packages/web/lib/components/create/MediaSelector.tsx                       │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│ Props:                                                                     │
│ interface MediaSelectorProps {                                             │
│   selectedMediaId: string | null;                                          │
│   onSelect: (mediaId: string | null) => void;                             │
│   disabled?: boolean;                                                      │
│   error?: string;                                                          │
│ }                                                                          │
│                                                                            │
│ State:                                                                     │
│ interface MediaSelectorState {                                             │
│   isOpen: boolean;                        // 드롭다운 열림 상태            │
│   searchQuery: string;                    // 검색어                        │
│   searchResults: MediaItem[];             // 검색 결과                     │
│   recentItems: MediaItem[];               // 최근 선택 항목                │
│   popularItems: MediaItem[];              // 인기 항목                     │
│   isLoading: boolean;                     // 검색 로딩 상태                │
│   showRequestModal: boolean;              // 태그 요청 모달                │
│ }                                                                          │
│                                                                            │
│ 렌더링 구조:                                                               │
│ ┌────────────────────────────────────────────────────────────────────────┐│
│ │ <div className="relative">                                             ││
│ │                                                                        ││
│ │   <!-- Trigger Button -->                                              ││
│ │   ┌────────────────────────────────────────────────────────────────┐  ││
│ │   │ <button onClick={() => setIsOpen(!isOpen)}>                    │  ││
│ │   │   {selectedMedia ? (                                           │  ││
│ │   │     <SelectedMediaChip media={selectedMedia} onClear={...} /> │  ││
│ │   │   ) : (                                                        │  ││
│ │   │     <SearchPlaceholder text="Search show, drama..." />        │  ││
│ │   │   )}                                                           │  ││
│ │   │   <ChevronIcon />                                              │  ││
│ │   │ </button>                                                      │  ││
│ │   └────────────────────────────────────────────────────────────────┘  ││
│ │                                                                        ││
│ │   <!-- Dropdown Panel (isOpen일 때) -->                                ││
│ │   ┌────────────────────────────────────────────────────────────────┐  ││
│ │   │ <div className="absolute top-full left-0 w-full z-50">         │  ││
│ │   │                                                                │  ││
│ │   │   <!-- Search Input -->                                        │  ││
│ │   │   <input                                                       │  ││
│ │   │     value={searchQuery}                                        │  ││
│ │   │     onChange={(e) => handleSearch(e.target.value)}            │  ││
│ │   │     placeholder="Search..."                                    │  ││
│ │   │     autoFocus                                                  │  ││
│ │   │   />                                                           │  ││
│ │   │                                                                │  ││
│ │   │   <!-- Results List -->                                        │  ││
│ │   │   {searchQuery ? (                                             │  ││
│ │   │     <SearchResults items={searchResults} onSelect={...} />    │  ││
│ │   │   ) : (                                                        │  ││
│ │   │     <>                                                         │  ││
│ │   │       <SectionHeader title="Recent" />                        │  ││
│ │   │       <MediaList items={recentItems} onSelect={...} />        │  ││
│ │   │       <SectionHeader title="Popular" />                       │  ││
│ │   │       <MediaList items={popularItems} onSelect={...} />       │  ││
│ │   │     </>                                                        │  ││
│ │   │   )}                                                           │  ││
│ │   │                                                                │  ││
│ │   │   <!-- Request New Tag -->                                     │  ││
│ │   │   <button onClick={() => setShowRequestModal(true)}>          │  ││
│ │   │     Can't find it? Request new tag                            │  ││
│ │   │   </button>                                                    │  ││
│ │   │                                                                │  ││
│ │   │ </div>                                                         │  ││
│ │   └────────────────────────────────────────────────────────────────┘  ││
│ │                                                                        ││
│ │ </div>                                                                 ││
│ └────────────────────────────────────────────────────────────────────────┘│
│                                                                            │
│ Events:                                                                    │
│ ├─── onClick (trigger) → setIsOpen(true)                                  │
│ ├─── onChange (search input) → debounce(fetchResults, 300ms)              │
│ ├─── onClick (result item) → onSelect(item.id), setIsOpen(false)          │
│ ├─── onClick (clear button) → onSelect(null)                              │
│ └─── onClickOutside → setIsOpen(false)                                    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

#### 모바일 버전 (MediaSelectorMobile.tsx)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ MediaSelectorMobile.tsx                                                     │
│ packages/mobile/lib/components/create/MediaSelectorMobile.tsx              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│ Props:                                                                     │
│ interface MediaSelectorMobileProps {                                       │
│   selectedMediaId: string | null;                                          │
│   onSelect: (mediaId: string | null) => void;                             │
│   disabled?: boolean;                                                      │
│   error?: string;                                                          │
│ }                                                                          │
│                                                                            │
│ State:                                                                     │
│ interface MediaSelectorMobileState {                                       │
│   isSheetOpen: boolean;                   // 풀스크린 시트 열림            │
│   searchQuery: string;                                                     │
│   searchResults: MediaItem[];                                              │
│   isLoading: boolean;                                                      │
│ }                                                                          │
│                                                                            │
│ 렌더링 구조:                                                               │
│ ┌────────────────────────────────────────────────────────────────────────┐│
│ │ <View>                                                                 ││
│ │                                                                        ││
│ │   <!-- Trigger Pressable -->                                           ││
│ │   <Pressable onPress={() => setIsSheetOpen(true)}>                    ││
│ │     <SearchIcon />                                                     ││
│ │     <Text>                                                             ││
│ │       {selectedMedia?.name || "Search show, drama..."}                ││
│ │     </Text>                                                            ││
│ │     <ChevronRightIcon />                                               ││
│ │   </Pressable>                                                         ││
│ │                                                                        ││
│ │   <!-- Selected Chip (선택된 경우) -->                                  ││
│ │   {selectedMedia && (                                                  ││
│ │     <SelectedChip                                                      ││
│ │       media={selectedMedia}                                            ││
│ │       onRemove={() => onSelect(null)}                                 ││
│ │     />                                                                  ││
│ │   )}                                                                    ││
│ │                                                                        ││
│ │   <!-- Full Screen Search Sheet -->                                    ││
│ │   <Modal visible={isSheetOpen} animationType="slide">                 ││
│ │     <SafeAreaView>                                                     ││
│ │       <MediaSearchSheet                                                ││
│ │         onSelect={(id) => {                                           ││
│ │           onSelect(id);                                                ││
│ │           setIsSheetOpen(false);                                       ││
│ │         }}                                                             ││
│ │         onClose={() => setIsSheetOpen(false)}                         ││
│ │         onRequestNew={() => {                                         ││
│ │           setIsSheetOpen(false);                                       ││
│ │           navigation.navigate('TagRequest', { type: 'media' });       ││
│ │         }}                                                             ││
│ │       />                                                               ││
│ │     </SafeAreaView>                                                    ││
│ │   </Modal>                                                             ││
│ │                                                                        ││
│ │ </View>                                                                ││
│ └────────────────────────────────────────────────────────────────────────┘│
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

##### MediaSearchSheet.tsx (모바일 전용)

```typescript
// packages/mobile/lib/components/create/MediaSearchSheet.tsx

interface MediaSearchSheetProps {
  onSelect: (mediaId: string) => void;
  onClose: () => void;
  onRequestNew: () => void;
}

interface MediaSearchSheetState {
  searchQuery: string;
  searchResults: MediaItem[];
  recentItems: MediaItem[];
  popularItems: MediaItem[];
  isLoading: boolean;
}

// 렌더링
// - 상단: 검색 입력 + 뒤로가기 버튼
// - 검색어 없을 때: Recent + Popular 섹션
// - 검색어 있을 때: 검색 결과 리스트 (FlashList)
// - 하단: "Request New Tag" 버튼
```

### CastSelector 컴포넌트

#### 웹 버전 (CastSelector.tsx)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ CastSelector.tsx (Web)                                                      │
│ packages/web/lib/components/create/CastSelector.tsx                        │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│ Props:                                                                     │
│ interface CastSelectorProps {                                              │
│   mediaId: string | null;                 // 선택된 미디어 (필터링용)      │
│   selectedCastIds: string[];              // 선택된 캐스트 목록            │
│   onToggle: (castId: string) => void;     // 캐스트 선택/해제             │
│   disabled?: boolean;                                                      │
│   maxSelections?: number;                 // 최대 선택 가능 수 (default: 5)│
│ }                                                                          │
│                                                                            │
│ State:                                                                     │
│ interface CastSelectorState {                                              │
│   isOpen: boolean;                                                         │
│   searchQuery: string;                                                     │
│   availableCasts: CastItem[];             // mediaId에 속한 캐스트         │
│   searchResults: CastItem[];                                               │
│   isLoading: boolean;                                                      │
│ }                                                                          │
│                                                                            │
│ 렌더링 구조:                                                               │
│ ┌────────────────────────────────────────────────────────────────────────┐│
│ │ <div>                                                                  ││
│ │                                                                        ││
│ │   <!-- 선택된 캐스트 칩들 -->                                           ││
│ │   <div className="flex flex-wrap gap-2">                               ││
│ │     {selectedCasts.map(cast => (                                       ││
│ │       <CastChip                                                        ││
│ │         key={cast.id}                                                  ││
│ │         cast={cast}                                                    ││
│ │         onRemove={() => onToggle(cast.id)}                            ││
│ │       />                                                               ││
│ │     ))}                                                                ││
│ │   </div>                                                               ││
│ │                                                                        ││
│ │   <!-- 드롭다운 트리거 -->                                              ││
│ │   <button onClick={() => setIsOpen(true)}>                            ││
│ │     <PlusIcon /> Add cast member                                       ││
│ │   </button>                                                            ││
│ │                                                                        ││
│ │   <!-- 드롭다운 패널 -->                                                ││
│ │   {isOpen && (                                                         ││
│ │     <div className="absolute ...">                                     ││
│ │       <input                                                           ││
│ │         value={searchQuery}                                            ││
│ │         onChange={handleSearch}                                        ││
│ │         placeholder="Search cast..."                                   ││
│ │       />                                                               ││
│ │                                                                        ││
│ │       {/* mediaId가 있으면 해당 미디어의 멤버들 먼저 표시 */}           ││
│ │       {mediaId && (                                                    ││
│ │         <>                                                             ││
│ │           <SectionHeader title={`Members of ${mediaName}`} />         ││
│ │           <CastGrid                                                    ││
│ │             items={availableCasts}                                     ││
│ │             selectedIds={selectedCastIds}                              ││
│ │             onToggle={onToggle}                                        ││
│ │           />                                                           ││
│ │         </>                                                            ││
│ │       )}                                                               ││
│ │                                                                        ││
│ │       {/* 검색 결과 */}                                                 ││
│ │       {searchQuery && (                                                ││
│ │         <SearchResults                                                 ││
│ │           items={searchResults}                                        ││
│ │           selectedIds={selectedCastIds}                                ││
│ │           onToggle={onToggle}                                          ││
│ │         />                                                             ││
│ │       )}                                                               ││
│ │     </div>                                                             ││
│ │   )}                                                                    ││
│ │                                                                        ││
│ │ </div>                                                                 ││
│ └────────────────────────────────────────────────────────────────────────┘│
│                                                                            │
│ API 호출:                                                                  │
│ ├─── mediaId 변경 시 → GET /api/cast?mediaId={mediaId}                    │
│ └─── searchQuery 변경 시 → GET /api/cast/search?q={query}&mediaId={id}    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

#### 모바일 버전 (CastSelectorMobile.tsx)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ CastSelectorMobile.tsx                                                      │
│ packages/mobile/lib/components/create/CastSelectorMobile.tsx               │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│ Props: (웹과 동일)                                                          │
│                                                                            │
│ State:                                                                     │
│ interface CastSelectorMobileState {                                        │
│   isSheetOpen: boolean;                                                    │
│   searchQuery: string;                                                     │
│   availableCasts: CastItem[];                                              │
│   searchResults: CastItem[];                                               │
│   isLoading: boolean;                                                      │
│ }                                                                          │
│                                                                            │
│ 렌더링 구조:                                                               │
│ ┌────────────────────────────────────────────────────────────────────────┐│
│ │ <View>                                                                 ││
│ │                                                                        ││
│ │   <!-- 트리거 -->                                                       ││
│ │   <Pressable onPress={() => setIsSheetOpen(true)}>                    ││
│ │     <Text>Select cast members...</Text>                                ││
│ │     <ChevronRightIcon />                                               ││
│ │   </Pressable>                                                         ││
│ │                                                                        ││
│ │   <!-- 선택된 캐스트 (수평 스크롤) -->                                   ││
│ │   <FlatList                                                            ││
│ │     horizontal                                                         ││
│ │     data={selectedCasts}                                               ││
│ │     renderItem={({ item }) => (                                        ││
│ │       <CastChipMobile                                                  ││
│ │         cast={item}                                                    ││
│ │         onRemove={() => onToggle(item.id)}                            ││
│ │       />                                                               ││
│ │     )}                                                                  ││
│ │   />                                                                    ││
│ │                                                                        ││
│ │   <!-- 풀스크린 선택 시트 -->                                           ││
│ │   <Modal visible={isSheetOpen} animationType="slide">                 ││
│ │     <CastSearchSheet                                                   ││
│ │       mediaId={mediaId}                                                ││
│ │       selectedIds={selectedCastIds}                                    ││
│ │       onToggle={onToggle}                                              ││
│ │       onClose={() => setIsSheetOpen(false)}                           ││
│ │     />                                                                  ││
│ │   </Modal>                                                             ││
│ │                                                                        ││
│ │ </View>                                                                ││
│ └────────────────────────────────────────────────────────────────────────┘│
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### ContextSelector 컴포넌트

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ContextSelector.tsx (Web) / ContextSelectorMobile.tsx (Mobile)              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│ Props:                                                                     │
│ interface ContextSelectorProps {                                           │
│   selectedContext: ContextType | null;                                     │
│   onSelect: (context: ContextType | null) => void;                        │
│   disabled?: boolean;                                                      │
│ }                                                                          │
│                                                                            │
│ Context Types:                                                             │
│ type ContextType = 'airport' | 'stage' | 'mv' | 'photoshoot' |            │
│                    'daily' | 'event' | 'drama' | 'variety';               │
│                                                                            │
│ 렌더링 (단순 칩 그리드 - 웹/모바일 동일):                                   │
│ ┌────────────────────────────────────────────────────────────────────────┐│
│ │ <div className="flex flex-wrap gap-2">                                 ││
│ │   {CONTEXT_OPTIONS.map(option => (                                     ││
│ │     <ContextChip                                                       ││
│ │       key={option.value}                                               ││
│ │       label={option.label}                                             ││
│ │       icon={option.icon}                                               ││
│ │       isSelected={selectedContext === option.value}                   ││
│ │       onPress={() => onSelect(                                        ││
│ │         selectedContext === option.value ? null : option.value        ││
│ │       )}                                                               ││
│ │     />                                                                  ││
│ │   ))}                                                                   ││
│ │ </div>                                                                 ││
│ └────────────────────────────────────────────────────────────────────────┘│
│                                                                            │
│ CONTEXT_OPTIONS:                                                           │
│ [                                                                          │
│   { value: 'airport', label: 'Airport', icon: '✈️' },                     │
│   { value: 'stage', label: 'Stage', icon: '🎤' },                         │
│   { value: 'mv', label: 'Music Video', icon: '🎬' },                      │
│   { value: 'photoshoot', label: 'Photoshoot', icon: '📸' },               │
│   { value: 'daily', label: 'Daily', icon: '👕' },                         │
│   { value: 'event', label: 'Event', icon: '🎉' },                         │
│   { value: 'drama', label: 'Drama', icon: '📺' },                         │
│   { value: 'variety', label: 'Variety', icon: '🎭' },                     │
│ ]                                                                          │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 태그 검색 자동완성 이벤트 흐름

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    TAG SEARCH AUTOCOMPLETE FLOW                           │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [사용자 입력]                                                            │
│       │                                                                  │
│       ▼                                                                  │
│  onChange → setSearchQuery(value)                                        │
│       │                                                                  │
│       ▼                                                                  │
│  useEffect (debounced, 300ms)                                            │
│       │                                                                  │
│       ├─── value.length < 2 → 검색 안 함, 기본 목록 표시                 │
│       │                                                                  │
│       └─── value.length >= 2 → fetchSearchResults()                      │
│                 │                                                        │
│                 ▼                                                        │
│            setIsLoading(true)                                            │
│                 │                                                        │
│                 ▼                                                        │
│            GET /api/tags/{type}/search?q={query}                         │
│                 │                                                        │
│                 ├─── type: 'media' | 'cast'                              │
│                 │                                                        │
│                 ├─── 추가 params (cast 검색 시):                         │
│                 │    mediaId: string  // 해당 미디어 멤버 우선 표시      │
│                 │                                                        │
│                 ▼                                                        │
│            Response:                                                     │
│            {                                                             │
│              results: [                                                  │
│                {                                                         │
│                  id: string,                                             │
│                  name: string,                                           │
│                  nameKo: string,                                         │
│                  type: 'group' | 'solo' | 'drama' | 'show',             │
│                  imageUrl?: string,                                      │
│                  memberCount?: number,  // group인 경우                  │
│                },                                                        │
│                ...                                                       │
│              ],                                                          │
│              hasMore: boolean,                                           │
│            }                                                             │
│                 │                                                        │
│                 ▼                                                        │
│            setSearchResults(results)                                     │
│            setIsLoading(false)                                           │
│                 │                                                        │
│                 ▼                                                        │
│            [결과 렌더링]                                                  │
│                 │                                                        │
│                 ├─── 결과 있음 → 리스트 표시                             │
│                 │                                                        │
│                 └─── 결과 없음 → "No results" + "Request new tag" 표시  │
│                                                                          │
│  [항목 선택]                                                              │
│       │                                                                  │
│       ▼                                                                  │
│  onClick (result item)                                                   │
│       │                                                                  │
│       ├─── localStorage에 최근 선택 저장                                 │
│       │    recentMedias / recentCasts (최대 5개)                         │
│       │                                                                  │
│       ├─── onSelect(item.id)                                             │
│       │                                                                  │
│       └─── 드롭다운/시트 닫기                                            │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### useTagSearch 훅

```typescript
// packages/shared/lib/hooks/useTagSearch.ts

interface UseTagSearchOptions {
  type: 'media' | 'cast';
  mediaId?: string;         // cast 검색 시 필터링용
  debounceMs?: number;      // default: 300
}

interface UseTagSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  results: TagSearchResult[];
  isLoading: boolean;
  error: Error | null;
  recentItems: TagSearchResult[];
  popularItems: TagSearchResult[];
  clearQuery: () => void;
}

// 구현
export function useTagSearch(options: UseTagSearchOptions): UseTagSearchReturn {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TagSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 최근 항목 (localStorage)
  const recentItems = useRecentItems(options.type);

  // 인기 항목 (React Query)
  const { data: popularItems } = useQuery({
    queryKey: ['popular-tags', options.type],
    queryFn: () => fetchPopularTags(options.type),
    staleTime: 5 * 60 * 1000, // 5분
  });

  // Debounced 검색
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await searchTags(options.type, query, options.mediaId);
        setResults(res.results);
      } catch (e) {
        setError(e as Error);
      } finally {
        setIsLoading(false);
      }
    }, options.debounceMs ?? 300);

    return () => clearTimeout(timer);
  }, [query, options.type, options.mediaId]);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    recentItems,
    popularItems: popularItems ?? [],
    clearQuery: () => setQuery(''),
  };
}
```

---

### C-04 모바일 스팟 등록

#### 모바일 스팟 화면 구조

```
┌─────────────────────────────────────────┐
│  Add Links                        [←]   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │       Step 4 of 4: Links        │   │
│  │  ○───○───○───●                   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Item 1: Top                            │
│  ┌─────────────────────────────────┐   │
│  │ [crop image]  Category: Top     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  THE ORIGINAL                           │
│  ┌─────────────────────────────────┐   │
│  │ 🔗 Paste shopping URL...        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  또는                                    │
│                                         │
│  [Share from other app]                 │
│  → 다른 앱에서 공유 시트로 URL 전달     │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Parsed: ✓                              │
│  ┌─────────────────────────────────┐   │
│  │ [Product Image]                 │   │
│  │ Brand: Celine                   │   │
│  │ Name: Triomphe Jacket           │   │
│  │ Price: ₩2,850,000               │   │
│  │ [Edit]                    [✓]   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  THE VIBE                    [+ Add]    │
│                                         │
│         [Publish Post]                  │
└─────────────────────────────────────────┘
```

#### 공유 시트 수신 (모바일 전용)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    SHARE SHEET INTEGRATION (Mobile)                       │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [다른 앱에서 URL 공유]                                                   │
│       │                                                                  │
│       ▼                                                                  │
│  iOS: Share Extension / Android: Intent Filter                           │
│       │                                                                  │
│       ▼                                                                  │
│  App Scheme: decoded://share?url={encodedUrl}                            │
│       │                                                                  │
│       ▼                                                                  │
│  Linking.getInitialURL() 또는 Linking.addEventListener('url')            │
│       │                                                                  │
│       ▼                                                                  │
│  현재 생성 플로우 중인지 확인                                            │
│       │                                                                  │
│       ├─── 생성 플로우 중 (Step 4)                                       │
│       │         └─── 현재 선택된 아이템에 URL 자동 입력                  │
│       │              useScrapeUrl().scrape(sharedUrl)                    │
│       │                                                                  │
│       └─── 생성 플로우 아님                                              │
│                 └─── Alert: "스팟 등록 단계에서 사용해주세요"            │
│                                                                          │
│  app.json 설정:                                                          │
│  {                                                                       │
│    "expo": {                                                             │
│      "scheme": "decoded",                                                │
│      "ios": {                                                            │
│        "associatedDomains": ["applinks:decoded.style"],                 │
│        "infoPlist": {                                                    │
│          "CFBundleDocumentTypes": [                                     │
│            {                                                             │
│              "CFBundleTypeName": "URL",                                 │
│              "CFBundleTypeRole": "Viewer",                              │
│              "LSItemContentTypes": ["public.url"]                       │
│            }                                                             │
│          ]                                                               │
│        }                                                                 │
│      },                                                                  │
│      "android": {                                                        │
│        "intentFilters": [                                                │
│          {                                                               │
│            "action": "android.intent.action.SEND",                      │
│            "data": [{ "mimeType": "text/plain" }],                      │
│            "category": ["android.intent.category.DEFAULT"]              │
│          }                                                               │
│        ]                                                                 │
│      }                                                                   │
│    }                                                                     │
│  }                                                                       │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 구현 상태 체크리스트

### C-01 이미지 업로드

#### 웹 (packages/web)
- [ ] DropZone 컴포넌트
- [ ] 파일 검증 (타입, 크기)
- [ ] 이미지 압축 (browser-image-compression)
- [ ] Supabase Storage 업로드
- [ ] 업로드 진행률 표시
- [ ] 프리뷰 그리드
- [ ] 다중 이미지 지원
- [ ] 클립보드 붙여넣기

#### 모바일 (packages/mobile)
- [ ] 카메라 권한 요청 플로우
- [ ] 갤러리 권한 요청 플로우
- [ ] expo-camera 연동
- [ ] expo-image-picker 연동
- [ ] 이미지 압축 (expo-image-manipulator)
- [ ] 촬영 확인 화면
- [ ] ImageThumbnailStrip 컴포넌트
- [ ] 업로드 진행률 표시

### C-02 AI 객체 인식

#### 공통
- [x] Backend detection pipeline

#### 웹 (packages/web)
- [ ] DetectionCanvas UI (마우스 인터랙션)
- [ ] BoundingBox 컴포넌트
- [ ] 박스 드래그/리사이즈 (마우스)
- [ ] 수동 박스 그리기
- [ ] 카테고리 변경 UI
- [ ] Crop 이미지 생성

#### 모바일 (packages/mobile)
- [ ] DetectionCanvasMobile (터치 인터랙션)
- [ ] BoundingBoxMobile 컴포넌트
- [ ] 핀치 줌 (react-native-gesture-handler)
- [ ] 박스 드래그/리사이즈 (터치)
- [ ] 롱프레스 삭제
- [ ] 수동 박스 그리기

### C-03 메타데이터 태깅

#### 웹 (packages/web)
- [ ] MediaSelector 컴포넌트 (드롭다운)
- [ ] CastSelector 컴포넌트 (드롭다운 + 다중선택)
- [ ] ContextSelector 컴포넌트
- [ ] TagRequestModal 컴포넌트
- [ ] useTagSearch 훅

#### 모바일 (packages/mobile)
- [ ] MediaSelectorMobile 컴포넌트
- [ ] MediaSearchSheet 풀스크린 시트
- [ ] CastSelectorMobile 컴포넌트
- [ ] CastSearchSheet 풀스크린 시트
- [ ] ContextSelectorMobile 컴포넌트

#### 공통 API
- [ ] GET /api/tags/media/search
- [ ] GET /api/tags/cast/search
- [ ] GET /api/tags/popular
- [ ] POST /api/tags/request

### C-04 스팟 등록

#### 웹 (packages/web)
- [ ] UrlInput 컴포넌트
- [ ] ParsedProductCard 컴포넌트
- [ ] ManualProductForm 컴포넌트
- [ ] Vibe 추가 기능

#### 모바일 (packages/mobile)
- [ ] UrlInputMobile 컴포넌트
- [ ] ParsedProductCardMobile 컴포넌트
- [ ] ManualProductFormMobile (BottomSheet)
- [ ] 공유 시트 수신 (intent filter)

#### 공통 API
- [ ] POST /api/scrape
- [ ] 지원 사이트 목록 설정
