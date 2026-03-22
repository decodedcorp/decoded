# [SCR-CREA-01] 업로드 (Upload)

| 항목 | 내용 |
|------|------|
| **문서 ID** | SCR-CREA-01 |
| **화면명** | 업로드 |
| **경로** | `/create/upload` |
| **작성일** | 2025-01-14 |
| **버전** | v1.0 |
| **상태** | 초안 |

---

## 1. 화면 개요

- **목적**: 사용자가 아이템 정보를 공유하기 위해 이미지를 업로드하는 첫 번째 단계
- **선행 조건**: 로그인 필수
- **후속 화면**: SCR-CREA-02 (AI 검출 결과)
- **관련 기능 ID**: C-01 Image Upload

---

## 2. UI 와이어프레임

### 2.1 데스크톱 (≥768px)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [←] Create New Post                                    Step 1 of 4        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ○ Upload ━━━━ ○ Detect ━━━━ ○ Tag ━━━━ ○ Link                            │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │                                                                      │   │
│  │                         [ICON-01]                                    │   │
│  │                            📷                                        │   │
│  │                                                                      │   │
│  │                  Drag & drop images here                            │   │
│  │                     or click to select                              │   │
│  │                                                                      │   │
│  │             ─────────────────────────────────────                   │   │
│  │                                                                      │   │
│  │             Supports: JPG, PNG, WebP (max 10MB)                     │   │
│  │                                                                      │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                        [DROP-ZONE-01]                                      │
│                                                                             │
│  ─────── or paste from clipboard (Ctrl/Cmd + V) ───────                   │
│                                                                             │
│  Selected Images (0/5):                                                     │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                                                                        │ │
│  │    ┌─────────┐                                                        │ │
│  │    │   [+]   │  [CARD-ADD]                                           │ │
│  │    │   Add   │  Click to add more                                    │ │
│  │    │  Image  │                                                        │ │
│  │    └─────────┘                                                        │ │
│  │                                                                        │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                        [GRID-01]                                           │
│                                                                             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                           [BTN-NEXT] Next: Detect →  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 이미지 선택 후 상태

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [←] Create New Post                                    Step 1 of 4        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ● Upload ━━━━ ○ Detect ━━━━ ○ Tag ━━━━ ○ Link                            │
│                                                                             │
│  Selected Images (2/5):                                                     │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                                                                        │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                      │ │
│  │  │ [PREVIEW-1] │ │ [PREVIEW-2] │ │    [+]      │                      │ │
│  │  │             │ │             │ │    Add      │                      │ │
│  │  │   [img]     │ │   [img]     │ │   Image     │                      │ │
│  │  │             │ │             │ │             │                      │ │
│  │  │ ████████░░  │ │     ✓       │ │             │                      │ │
│  │  │  uploading  │ │  uploaded   │ │             │                      │ │
│  │  │     [✕]     │ │     [✕]     │ │             │                      │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘                      │ │
│  │   [CARD-01]       [CARD-02]       [CARD-ADD]                          │ │
│  │                                                                        │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                              [BTN-NEXT] Detect Items → │ │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 모바일 (<768px)

```
┌─────────────────────────────────┐
│  [←]  Create Post         [✕]  │
├─────────────────────────────────┤
│                                 │
│   ● ━━━ ○ ━━━ ○ ━━━ ○          │
│   1     2     3     4          │
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │     [ICON-CAM]          │   │
│  │        📷               │   │
│  │                         │   │
│  │    Take Photo           │   │
│  │                         │   │
│  └─────────────────────────┘   │
│       [BTN-CAMERA]             │
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │     [ICON-GAL]          │   │
│  │        🖼️               │   │
│  │                         │   │
│  │   Choose from Library   │   │
│  │                         │   │
│  └─────────────────────────┘   │
│       [BTN-GALLERY]            │
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │     [ICON-URL]          │   │
│  │        🔗               │   │
│  │                         │   │
│  │   Paste Image URL       │   │
│  │                         │   │
│  └─────────────────────────┘   │
│       [BTN-URL]                │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  Selected (0/5)                │
│  ┌───────────────────────────┐ │
│  │  (empty)                  │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌─────────────────────────┐   │
│  │      Next →              │   │
│  │     (disabled)           │   │
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

---

## 3. UI 요소 정의

### 3.1 헤더/네비게이션

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| BTN-BACK | 버튼 | 뒤로가기 | Icon: ArrowLeft | 홈/이전 화면으로 이동 |
| TXT-TITLE | 텍스트 | 제목 | "Create New Post", font-semibold | - |
| TXT-STEP | 텍스트 | 단계 표시 | "Step 1 of 4", text-muted | - |
| PROGRESS-01 | 진행바 | 스텝 인디케이터 | 4단계: Upload, Detect, Tag, Link | 현재 단계 강조, 클릭 불가 |

### 3.2 드롭존 영역

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| DROP-ZONE-01 | 컨테이너 | 드롭존 | border-dashed, border-2, rounded-lg | 드래그 오버 시 border-primary |
| ICON-01 | 아이콘 | 카메라 | size: 48px, color: muted | - |
| TXT-DROP-MAIN | 텍스트 | 안내 문구 | "Drag & drop images here" | - |
| TXT-DROP-SUB | 텍스트 | 보조 문구 | "or click to select" | - |
| TXT-FORMATS | 텍스트 | 지원 형식 | "Supports: JPG, PNG, WebP (max 10MB)" | - |
| INP-FILE | 입력 | 파일 입력 | type="file", accept="image/*", multiple, hidden | 클릭 시 파일 선택 다이얼로그 |

### 3.3 이미지 그리드

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| TXT-COUNT | 텍스트 | 선택 수 | "Selected Images (n/5)" | 실시간 업데이트 |
| GRID-01 | 컨테이너 | 이미지 그리드 | flex, gap-4, flex-wrap | 최대 5개 + 1개 추가 버튼 |
| CARD-01~05 | 카드 | 이미지 프리뷰 | 120x120px, rounded, relative | 삭제 버튼 오버레이 |
| CARD-ADD | 버튼 | 추가 버튼 | 120x120px, border-dashed | 클릭 시 파일 선택 |
| BTN-REMOVE | 버튼 | 삭제 버튼 | position: absolute, top-right, Icon: X | 클릭 시 이미지 제거 |
| PROGRESS-IMG | 진행바 | 업로드 진행률 | height: 4px, bg-primary | 0-100% 애니메이션 |
| ICON-CHECK | 아이콘 | 완료 체크 | Icon: CheckCircle, color: success | 업로드 완료 시 표시 |
| ICON-ERROR | 아이콘 | 에러 | Icon: AlertCircle, color: destructive | 업로드 실패 시 표시 |

### 3.4 모바일 전용 버튼

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| BTN-CAMERA | 버튼 | 카메라 촬영 | large, variant: outline | 카메라 앱 실행 |
| BTN-GALLERY | 버튼 | 갤러리 선택 | large, variant: outline | 사진 라이브러리 열기 |
| BTN-URL | 버튼 | URL 입력 | large, variant: outline | URL 입력 모달 열기 |

### 3.5 하단 액션

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| BTN-NEXT | 버튼 | 다음 단계 | variant: primary, disabled 조건부 | 이미지 1개 이상 업로드 완료 시 활성화 |

---

## 4. 상태 정의

| 상태 | 조건 | UI 변화 |
|------|------|--------|
| 초기 | 이미지 없음 | 드롭존만 표시, Next 버튼 비활성화 |
| 드래그 중 | 파일 드래그 오버 | 드롭존 테두리 강조 (primary), 배경 변경 |
| 업로드 중 | 파일 업로드 진행 | 프리뷰에 진행률 바 표시, 삭제 가능 |
| 업로드 완료 | 모든 파일 완료 | 체크 아이콘 표시, Next 버튼 활성화 |
| 에러 | 업로드 실패 | 에러 아이콘 + 재시도 버튼 표시 |
| 최대 개수 | 5개 이미지 | 추가 버튼 숨김, 드롭존 비활성화 |

---

## 5. 데이터 요구사항

### 5.1 API 호출

| API | Method | Endpoint | 호출 시점 |
|-----|--------|----------|----------|
| 이미지 업로드 | POST | Supabase Storage `uploads/{userId}/{timestamp}` | 파일 드롭/선택 시 |

### 5.2 상태 관리 (Zustand)

| 스토어 | 키 | 타입 | 설명 |
|--------|-----|------|------|
| createStore | step | `'upload' \| 'detect' \| 'tag' \| 'spot'` | 현재 단계 |
| createStore | images | `UploadedImage[]` | 업로드된 이미지 목록 |

```typescript
interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;      // URL.createObjectURL
  uploadedUrl?: string;    // Supabase 저장 URL
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  progress: number;        // 0-100
  error?: string;
}
```

---

## 6. 에러 처리

| 에러 상황 | 사용자 메시지 | 처리 방법 |
|----------|-------------|----------|
| 지원하지 않는 형식 | "Only JPG, PNG, WebP files are supported" | Toast 에러 + 파일 거부 |
| 파일 크기 초과 | "File size must be under 10MB" | Toast 에러 + 파일 거부 |
| 최대 개수 초과 | "Maximum 5 images allowed" | Toast 경고 + 추가 파일 무시 |
| 네트워크 오류 | "Upload failed. Please try again." | 재시도 버튼 표시 |
| 압축 실패 | (자동 처리) | 원본 파일로 업로드 시도 |

---

## 7. 접근성 (A11y)

### 7.1 키보드 네비게이션
- `Tab`: 드롭존 → 이미지 카드들 → Next 버튼 순서
- `Enter/Space`: 드롭존에서 파일 선택 다이얼로그 열기
- `Delete/Backspace`: 선택된 이미지 카드 삭제
- `Escape`: 드래그 취소

### 7.2 스크린 리더
- 드롭존: `role="button"`, `aria-label="Upload images. Drag and drop or click to select"`
- 이미지 카드: `aria-label="Image 1. Uploading 50%"` 또는 `"Image 1. Uploaded"`
- 삭제 버튼: `aria-label="Remove image 1"`
- Next 버튼: `aria-disabled="true"` (비활성화 시)

### 7.3 포커스 관리
- 이미지 업로드 완료 시: Next 버튼으로 포커스 이동
- 이미지 삭제 시: 이전 이미지 또는 추가 버튼으로 포커스 이동

---

## 8. 컴포넌트 매핑

| UI 영역 | 컴포넌트 | 파일 경로 |
|--------|---------|----------|
| 페이지 | CreateUploadPage | `app/create/upload/page.tsx` |
| 플로우 헤더 | CreateFlowHeader | `lib/components/create/CreateFlowHeader.tsx` |
| 스텝 인디케이터 | StepIndicator | `lib/components/create/StepIndicator.tsx` |
| 드롭존 | DropZone | `lib/components/create/DropZone.tsx` |
| 이미지 그리드 | ImagePreviewGrid | `lib/components/create/ImagePreviewGrid.tsx` |
| 이미지 프리뷰 | ImagePreview | `lib/components/create/ImagePreview.tsx` |
| 훅: 업로드 | useImageUpload | `lib/hooks/useImageUpload.ts` |
| 유틸: 압축 | compressImage | `lib/utils/imageCompression.ts` |

---

## 9. 구현 체크리스트

- [ ] DropZone 컴포넌트 (드래그앤드롭 + 클릭)
- [ ] 파일 검증 (타입, 크기, 매직 바이트)
- [ ] 이미지 압축 (browser-image-compression)
- [ ] Supabase Storage 업로드 (진행률 콜백)
- [ ] ImagePreviewGrid (최대 5개 제한)
- [ ] 개별 이미지 삭제 기능
- [ ] 클립보드 붙여넣기 지원 (Ctrl/Cmd+V)
- [ ] 모바일 카메라/갤러리 통합
- [ ] URL 입력 지원 (옵션)
- [ ] 에러 상태 및 재시도 UI
- [ ] 반응형 레이아웃 (데스크톱/모바일)
- [ ] 접근성 테스트

---

## 10. 참고 사항

### 10.1 이미지 압축 옵션
```typescript
const compressionOptions = {
  maxSizeMB: 2,              // 최대 2MB로 압축
  maxWidthOrHeight: 1920,    // 긴 쪽 최대 1920px
  useWebWorker: true,        // 웹 워커 사용
  fileType: 'image/jpeg',    // 출력 형식
  initialQuality: 0.85       // 품질 85%
};
```

### 10.2 Supabase Storage 경로
```
uploads/{userId}/{timestamp}_{filename}

예: uploads/user_abc123/1705234567890_photo.jpg
```

### 10.3 모바일 카메라 접근
```typescript
// iOS Safari / Android Chrome
<input
  type="file"
  accept="image/*"
  capture="environment"  // 후면 카메라
/>
```
