# Metadata Services

AI 서버의 메타데이터 추출 및 처리 서비스들을 제공합니다. 다양한 소스(웹 스크래핑, 외부 API, 로컬 LLM)를 통해 링크와 이미지의 메타데이터를 추출하고 강화합니다.

## 📁 새로운 폴더 구조

```
metadata/
├── clients/              # 외부 서비스 클라이언트
│   ├── searxng_client.py    # SearXNG 검색 API
│   └── web_scraper.py       # HTTP 웹 스크래핑
├── processors/           # 메인 처리 파이프라인
│   ├── image_processor.py   # 이미지 분석 처리
│   └── link_processor.py    # 링크 메타데이터 처리
├── extractors/           # 데이터 추출 로직
│   ├── base_extractor.py    # 기본 추출기 인터페이스
│   ├── og_extractor.py      # Open Graph 태그 추출
│   └── youtube_extractor.py # YouTube 전용 추출
├── core/                 # 시스템 핵심 엔진
│   ├── metadata_extract_manager.py   # 메인 처리 관리자
│   ├── metadata_extract_service.py   # 서비스 레이어
│   └── result_aggregator.py          # 결과 집계
├── management/           # 시스템 관리
│   ├── failed_items_manager.py       # 실패 아이템 관리
│   └── tasks.py                      # 스케줄러 태스크
└── utils/                # 유틸리티 함수
    └── image_compression.py          # 이미지 압축
```

## 📋 Overview

이 디렉토리는 다음과 같은 기능을 제공합니다:

- **🔗 링크 메타데이터 추출**: OG 태그, 제목, 설명 등
- **🖼️ 이미지 분석**: 이미지 설명, 객체 식별, 스타일 분석
- **🤖 AI 기반 메타데이터 강화**: Gemini + Perplexity Fallback 시스템
- **🔄 LLM Fallback 시스템**: Gemini 과부하 시 자동으로 Perplexity로 전환
- **⚡ 빠른 타입 분류**: Groq 기반 LinkTypeClassifier로 링크 타입 사전 분류
- **🔍 검색 기반 컨텍스트**: SearXNG를 통한 추가 정보 수집
- **⚡ 성능 비교**: 다양한 AI 모델 간 성능 및 품질 비교

## 🏗️ Architecture

### Link Analysis Flow (New Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                    LinkAIAnalyzer                            │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  1. LinkTypeClassifier (Groq)                         │ │
│  │     └─ 빠른 추론: "product"|"article"|"video"|"other"│ │
│  └───────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  2. Schema Selection                                 │ │
│  │     └─ ProductResponse|ArticleResponse|VideoResponse│ │
│  └───────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  3. FallbackLLMClient                                │ │
│  │     ├─ Gemini (Primary) → 성공 시 결과 반환          │ │
│  │     └─ 503 에러 → Perplexity (Fallback) → 결과 반환  │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Legacy Link Processing Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    LinkProcessor                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │WebScraper   │ │OGExtractor  │ │   Enhancement Layer     │ │
│  │             │ │             │ │ ┌─────────┐ ┌─────────┐ │ │
│  │ • HTTP      │ │ • OG Tags   │ │ │Perplexity│ │LocalLLM │ │ │
│  │ • User-Agent│ │ • Fallbacks │ │ │   API   │ │ +SearXNG│ │ │
│  │ • Retry     │ │ • Validation│ │ └─────────┘ └─────────┘ │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 ImageProcessor                               │
│  ┌─────────────┐ ┌─────────────────────────────────────────┐ │
│  │URL/Binary   │ │          AI Analysis                    │ │
│  │Validation   │ │ ┌─────────────┐ ┌─────────────────────┐ │ │
│  │             │ │ │ Perplexity  │ │    Future: Other    │ │ │
│  │ • Format    │ │ │ Vision API  │ │    Vision Models    │ │ │
│  │ • Size      │ │ │             │ │                     │ │ │
│  │ • HTTPS     │ │ └─────────────┘ └─────────────────────┘ │ │
│  └─────────────┘ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Components

### 📂 clients/ - 외부 서비스 클라이언트

외부 시스템과의 통신을 담당하는 클라이언트들

#### SearXNGClient

- **목적**: SearXNG 검색 엔진을 통한 관련 정보 검색
- **기능**: 이미지/텍스트 검색, 관련 링크 찾기

#### WebScraperService

- **목적**: HTTP 웹 스크래핑
- **기능**: 다중 User-Agent, 재시도 로직, 리다이렉트 처리

### 📂 processors/ - 메인 처리 파이프라인

핵심 비즈니스 로직을 담당하는 처리기들

#### LinkAIAnalyzer

**AI 기반 링크 분석 파이프라인 (New Architecture)**

```python
async def analyze(self, url: str, item_id: str, og_metadata: Dict) -> LinkProcessingResult:
    # 1. LinkTypeClassifier로 링크 타입 분류 (Groq - 빠른 추론)
    # 2. 타입에 맞는 단일 스키마 선택 (Union 타입 문제 해결)
    # 3. FallbackLLMClient로 메타데이터 분석 (Gemini → Perplexity)
    # 4. 구조화된 결과 반환
```

**주요 기능:**

- **Fallback 시스템**: Gemini 503 에러 시 자동으로 Perplexity로 전환
- **LinkTypeClassifier**: Groq를 활용한 빠른 링크 타입 사전 분류
- **단일 스키마 사용**: Union 타입 대신 타입별 단일 스키마로 LLM 호환성 보장
- **에러 복원력**: Primary 모델 실패 시 자동 Fallback으로 서비스 안정성 확보

#### LinkTypeClassifier

**Groq 기반 빠른 링크 타입 분류기**

```python
async def classify(self, url: str, title: str, description: str) -> str:
    # Groq로 빠르게 분류: "product" | "article" | "video" | "other"
    # 실패 시 기본값 "other" 반환
```

**목적:**

- Union 타입 스키마 호환성 문제 해결
- 타입별 단일 스키마 사용으로 LLM 응답 품질 향상
- 빠른 추론을 통한 전체 처리 시간 최적화

#### LinkProcessor

**메인 링크 처리 파이프라인 (Legacy)**

```python
async def process_link(self, url: str, item_id: str) -> LinkResult:
    # 1. 웹 스크래핑
    # 2. OG 태그 추출
    # 3. 데이터 완성도 평가
    # 4. AI 기반 강화 (Perplexity + Local LLM)
    # 5. 결과 조합
```

**주요 기능:**

- 웹 스크래핑 실패 시에도 AI 기반 강화 진행
- Perplexity vs Local LLM 성능 비교 로깅
- 품질 기반 처리 상태 결정

#### ImageProcessor

**이미지 분석 처리 파이프라인**

```python
async def process_image(self, url: str, item_id: str) -> ImageResult:
    # 1. 이미지 유효성 검증
    # 2. AI 기반 분석 (Perplexity Vision API)
    # 3. 결과 반환
```

### 📂 extractors/ - 데이터 추출 로직

다양한 소스에서 메타데이터를 추출하는 추출기들

#### OGTagExtractor

- **목적**: Open Graph 태그 및 메타 태그 추출
- **기능**: OG 태그 우선 추출, 표준 meta 태그 fallback, 상대→절대 URL 변환

#### BaseExtractor

- **목적**: 추출기들의 공통 인터페이스
- **기능**: 표준화된 추출 메서드 정의

#### YouTubeExtractor

- **목적**: YouTube URL에서 전용 메타데이터 추출
- **기능**: 비디오 정보, 채널 정보, 썸네일 등

### 📂 core/ - 시스템 핵심 엔진

전체 시스템의 핵심 처리 로직

#### MetadataExtractManager

**메인 처리 관리자 - 배치 처리 오케스트레이션**

```python
async def process_batch(self, batch_id: str, items: List[DataItem]) -> ProcessedDataBatch:
    # 1. 데이터 분류 (링크/이미지)
    # 2. 병렬 처리
    # 3. 결과 집계
    # 4. 통계 계산
```

**초기화 구성:**

- **GroqClient**: LinkTypeClassifier용 빠른 추론
- **LinkTypeClassifier**: 링크 타입 사전 분류
- **FallbackLLMClient**: Gemini(Primary) + Perplexity(Fallback) 래퍼
- **LinkAIAnalyzer**: classifier와 fallback_client 주입

#### MetadataExtractService

**서비스 레이어 - 비즈니스 로직 조합**

- 여러 Manager와 Service 조합
- gRPC 요청 처리
- 에러 핸들링 및 로깅

#### ResultAggregator

**결과 집계 및 백엔드 전송**

- 처리 결과 포맷 변환
- 실패 아이템 필터링
- 백엔드 API 전송

### 📂 management/ - 시스템 관리

실패 처리 및 스케줄링 등 시스템 운영 관리

#### FailedItemsManager

**실패 아이템 관리 시스템**

```python
# 실패 아이템 저장
await failed_items_manager.add_failed_item(
    item_id="test_1", url="https://example.com",
    item_type="link", error_message="Network timeout"
)

# 재시도 가능한 아이템 조회
ready_items = await failed_items_manager.get_items_ready_for_retry()
```

**주요 기능:**

- Redis 기반 저장소
- 7가지 에러 타입 분류
- 지수적 백오프 재시도
- 영구 실패 아이템 관리

#### Tasks (tasks.py)

**스케줄러용 태스크 함수들**

- `retry_failed_items`: 실패한 아이템 재시도 (1분마다)
- `cleanup_old_failed_items`: 오래된 아이템 정리 (6시간마다)
- `get_failed_items_stats`: 실패 통계 로깅 (5분마다)

### 📂 utils/ - 유틸리티 함수

범용 유틸리티 클래스들

#### ImageCompressor

- **목적**: 이미지 압축 및 최적화
- **기능**: 크기 조정, 품질 최적화, 포맷 변환

## ⚙️ Configuration

### Environment Variables

```bash
# Perplexity API
PERPLEXITY_API_KEY=pplx-your-api-key
PERPLEXITY_API_URL=https://api.perplexity.ai
PERPLEXITY_MODEL=sonar

# SearXNG
SEARXNG_API_URL=https://searx.be

# Local LLM (llama-server)
LLM_HOST=localhost
LLM_PORT=1234
LLM_MODEL_NAME=llama-3.2-3b-instruct

# Processing
MAX_CONCURRENT_REQUESTS=5
REQUEST_TIMEOUT=30
MAX_RETRIES=3
```

### Dependency Injection

```python
# src/config/_container.py에서 자동 설정
# 새로운 구조의 import 경로 사용
from src.services.metadata.processors.link_processor import LinkProcessor
from src.services.metadata.clients.web_scraper import WebScraperService
from src.services.metadata.extractors.og_extractor import OGTagExtractor

link_processor: Singleton[LinkProcessor] = Singleton(
    LinkProcessor,
    web_scraper=web_scraper,
    og_extractor=og_extractor,
    llm_client=llm_router,
    searxng_client=searxng_client
)
```

## 🚀 Usage Examples

### 기본 링크 처리

```python
from src.services.metadata.processors.link_processor import LinkProcessor

# 의존성 주입으로 자동 초기화
link_processor = container.metadata.link_processor()

# 링크 처리
result = await link_processor.process_link(
    url="https://example.com/article",
    item_id="unique-id-123"
)

print(f"Title: {result.og_title}")
print(f"Enhanced Title: {result.enhanced_title}")
print(f"Status: {result.processing_status}")
```

### 성능 비교 로깅

링크 처리 시 자동으로 콘솔에 성능 비교 결과가 출력됩니다:

```
============================================================
🌐 PERPLEXITY ANALYSIS
============================================================
📍 URL: https://example.com/article
🤖 Perplexity Analysis:
  Title: Enhanced Article Title
  Description: Comprehensive article description...
  Topics: technology, ai, development
  Category: article
  ⏱️ Processing Time: 2.34s
============================================================

============================================================
🔍 PERFORMANCE COMPARISON - Link Analysis
============================================================
📍 URL: https://example.com/article
🔍 Search Results Found: 5

📊 Top Search Results:
  1. Article Title - News Site...
     https://news.example.com/article

🤖 Local LLM Analysis:
  Title: Alternative Enhanced Title
  Description: Different perspective description...
  Topics: tech, artificial-intelligence
  Category: article
  ⏱️ Processing Time: 1.82s
============================================================
```

### 이미지 분석

```python
from src.services.metadata.processors.image_processor import ImageProcessor

# 의존성 주입으로 자동 초기화
image_processor = container.metadata.image_processor()

# 이미지 처리
result = await image_processor.process_image(
    url="https://example.com/image.jpg",
    item_id="unique-image-123"
)

print(f"Description: {result.description}")
print(f"Status: {result.processing_status}")
```

### 실패 아이템 관리

```python
from src.services.metadata.management.failed_items_manager import FailedItemsManager

# 의존성 주입으로 자동 초기화
failed_mgr = container.metadata.failed_items_manager()

# 실패 아이템 추가
await failed_mgr.add_failed_item(
    item_id="test_1",
    url="https://example.com/failed-link",
    item_type="link",
    error_message="Network timeout"
)

# 재시도 준비된 아이템 조회
ready_items = await failed_mgr.get_items_ready_for_retry(batch_size=10)
print(f"Ready for retry: {len(ready_items)} items")
```

## 📊 Performance Features

### AI 모델 비교

- **Perplexity API**: 외부 API, 높은 품질, 네트워크 의존
- **Local LLM**: 로컬 처리, 빠른 응답, SearXNG 컨텍스트 활용

### 메트릭 수집

- 처리 시간 측정
- 검색 결과 개수
- 성공/실패 비율
- 품질 점수

### 성능 최적화

- 병렬 처리 (Perplexity + Local LLM 동시 실행)
- 컴팩트한 프롬프트 (Local LLM 최적화)
- 스마트 fallback (웹 스크래핑 실패 시 AI 의존)

## 🔍 API Requirements

### Perplexity API

- **인증**: Bearer token 필요
- **이미지 제한**: 50MB, PNG/JPEG/WEBP/GIF
- **URL 요구사항**: HTTPS 공개 접근 가능
- **API 구조**: OpenAI 호환 chat/completions

### SearXNG

- **설치**: 자체 인스턴스 또는 공개 인스턴스
- **포맷**: JSON API
- **엔진**: Google, Bing, DuckDuckGo

### Local LLM

- **서버**: llama-server (OpenAI 호환)
- **모델**: 텍스트 생성 모델 (예: Llama 3.2)
- **접속**: HTTP/HTTPS

## 🛠️ Development

### 새로운 구조에서의 확장성

#### 새로운 클라이언트 추가

1. `clients/` 폴더에 새 클라이언트 클래스 생성
2. `clients/__init__.py`에 export 추가
3. 컨테이너 설정에서 의존성 주입 설정

#### 새로운 처리기 추가

1. `processors/` 폴더에 새 처리기 클래스 생성
2. `processors/__init__.py`에 export 추가
3. 필요한 클라이언트 및 추출기 의존성 주입

#### 새로운 추출기 추가

1. `extractors/` 폴더에 새 추출기 클래스 생성
2. `BaseExtractor` 인터페이스 구현
3. `extractors/__init__.py`에 export 추가

### 폴더별 역할과 확장 가이드

- **clients/**: 외부 API, 웹 스크래핑 등 외부 통신
- **processors/**: 메인 비즈니스 로직, 여러 클라이언트 조합
- **extractors/**: 특정 포맷/플랫폼별 데이터 추출
- **core/**: 시스템 전체 오케스트레이션
- **management/**: 시스템 관리, 에러 처리, 스케줄링
- **utils/**: 범용 유틸리티 함수

## 📝 Testing

```bash
# 테스트 엔드포인트 (개발용)
POST /metadata/test-link-processor?url=https://example.com
```

콘솔에서 실시간으로 성능 비교 결과를 확인할 수 있습니다.

## 🆕 Recent Updates

### Fallback System & LinkTypeClassifier (2026-01-30)

**추가된 기능:**

- **FallbackLLMClient**: Primary 모델(Gemini) 실패 시 자동으로 Fallback 모델(Perplexity)로 전환
- **LinkTypeClassifier**: Groq를 활용한 빠른 링크 타입 분류 (product/article/video/other)
- **단일 스키마 사용**: Union 타입 대신 타입별 단일 스키마로 LLM 호환성 문제 해결

**주요 개선사항:**

- Gemini 503 에러 발생 시 자동으로 Perplexity로 전환하여 서비스 안정성 확보
- 링크 타입 사전 분류로 스키마 호환성 문제 완전 해결
- Groq의 빠른 추론으로 전체 처리 시간 최적화

**관련 파일:**

- `src/managers/llm/adapters/agent.py` - DefaultLLMAgent 구현
- `src/services/metadata/processors/link_type_classifier.py` - LinkTypeClassifier 구현
- `src/services/metadata/processors/link_ai_analyzer.py` - Fallback 시스템 통합

## 🔮 Future Enhancements

### 새로운 구조에서 계획된 기능들

- [ ] **clients/** - 새로운 LLM 클라이언트 (Claude, GPT-4V 등)
- [ ] **processors/** - 배치 최적화 처리기, 실시간 스트리밍 처리기
- [ ] **extractors/** - PDF 추출기, 소셜미디어 전용 추출기
- [ ] **core/** - 결과 캐싱 시스템, A/B 테스트 프레임워크
- [ ] **management/** - 실시간 모니터링, 사용자 피드백 기반 품질 개선
- [ ] **utils/** - 성능 메트릭 수집기, 이미지 최적화 파이프라인

### 구조적 장점을 활용한 확장

- **관심사 분리**: 각 폴더는 독립적으로 확장 가능
- **테스트 용이성**: 폴더별 단위 테스트 구성
- **유지보수성**: 기능별 코드 위치가 명확
- **재사용성**: 클라이언트와 유틸리티는 다른 처리기에서 재사용

---

## 📚 References

- [Perplexity API Documentation](https://docs.perplexity.ai/)
- [SearXNG Documentation](https://docs.searxng.org/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
