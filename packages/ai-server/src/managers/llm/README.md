# LLM 표준화 패턴

이 모듈은 다양한 LLM API들을 표준화된 인터페이스로 사용할 수 있도록 하는 어댑터 패턴과 URL 기반 Content Type 라우팅을 구현합니다.

## 폴더 구조

```
src/managers/llm/
├── __init__.py                 # 공용 exports
├── base/                       # 핵심 추상화 계층
│   ├── client.py              # BaseLLMClient 추상클래스
│   ├── message.py             # LLMMessage, LLMResponse 표준 모델
│   ├── config.py              # LLMConfig 설정 클래스
├── routing/                    # 라우팅 시스템
│   ├── router.py              # LLMRouter (Content Type별 라우팅)
│   └── content_resolver.py    # ContentTypeResolver (URL 기반 라우팅)
├── adapters/                   # 각 LLM API별 구현체
│   ├── local_llm.py           # LocalLLMAdapter (SearXNG 통합, 기존 llama.py)
│   ├── perplexity.py          # PerplexityClient (공식 SDK 기반)
│   ├── gemini.py              # GeminiAdapter
│   ├── groq.py                # GroqAdapter
│   └── agent.py               # DefaultLLMAgent (Primary 실패 시 Fallback 전환)
├── utils/                      # 공통 유틸리티 (향후 확장)
├── examples.py                 # 기본 사용 예시
├── router_examples.py          # LLMRouter 사용 예시
└── model.py                    # 기존 파일 (deprecated)
```

## 주요 특징

### 1. 표준화된 인터페이스

모든 LLM 클라이언트가 동일한 메서드로 사용 가능:

- `completion(messages, content_type, **kwargs)`: Content Type별 처리가 가능한 메시지 기반 대화
- `simple_completion()`: 단순 프롬프트
- `health_check()`: 서비스 상태 확인

### 2. URL 기반 Content Type 라우팅 🚀

**ContentTypeResolver**와 **LLMRouter**를 통해 컨텐츠 타입별로 최적화된 LLM 사용:

- `"link"`: 모든 링크 분석 (Perplexity, Groq, LocalLLM 중 선택)
- `"image"`: 이미지 분석 (예: Perplexity)
- `"text"`: 일반 텍스트 (예: Perplexity)

### 3. 완전히 단순화된 의존성

모든 Processor가 `BaseLLMClient` 하나만 의존하여 의존성 관리 단순화

### 4. 기존 코드 100% 호환성

기존에 사용하던 `LlamaManager`와 `PerplexityClient`는 변경 없이 그대로 사용 가능

### 5. 확장성

새로운 LLM API 추가 시 어댑터 파일 하나만 추가하면 됨

## 사용 방법

### 🚀 URL 기반 자동 라우팅 (추천)

```python
from src.managers.llm.routing import LLMRouter, ContentTypeResolver
from src.managers.llm.adapters.perplexity import PerplexityClient
from src.managers.llm.adapters.local_llm import LocalLLMAdapter
from src.database.models.batch import DataItemType

# 1. 각 LLM 클라이언트 생성
perplexity_client = PerplexityClient(perplexity_config)
local_llm_client = LocalLLMAdapter(local_config, searxng_client=searxng_client)

# 2. 컨텐츠 타입별로 최적화된 LLM 할당
router = LLMRouter({
    "link": [perplexity_client, local_llm_client],  # 링크는 여러 LLM 옵션
    "image": perplexity_client,   # 이미지는 Perplexity
    "text": perplexity_client     # 일반 텍스트는 Perplexity
})

# 3. ContentTypeResolver로 URL 자동 분석
resolver = ContentTypeResolver()

# 4. YouTube URL 라우팅 (이제 일반 link와 동일하게 처리)
youtube_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
content_type = resolver.resolve_content_type(youtube_url, DataItemType.LINK)
# → "link" (LinkOGExtractor로 OG metadata 추출 후 LinkAIAnalyzer가 LLM 분석)

messages = [LLMMessage(role="user", content="Analyze this video")]
result = await router.completion(
    messages,
    content_type=content_type,  # "link"
    url=youtube_url
)

# 5. 일반 링크도 동일하게 처리
regular_url = "https://techcrunch.com/article"
content_type = resolver.resolve_content_type(regular_url, DataItemType.LINK)
# → "link" (LinkOGExtractor로 OG metadata 추출 후 LinkAIAnalyzer가 LLM 분석)

result = await router.completion(
    messages,
    content_type=content_type,  # "link"
    url=regular_url
)
```

### BatchProcessor에서의 실제 사용

```python
# BatchProcessor에서 이렇게 사용됩니다
llm_router = LLMRouter({
    "link": perplexity_client,
    "image": perplexity_client,
    "text": perplexity_client  # 현재는 모두 Perplexity, 쉽게 변경 가능
})

# 모든 Processor에 동일한 router 주입
link_processor = LinkProcessor(web_scraper, og_extractor, llm_router, searxng_client)
image_processor = ImageProcessor(web_scraper, llm_router)
```

### 개별 클라이언트 사용

```python
from src.managers.llm import LLMConfig, LLMMessage

# 2. Content Type 지정해서 사용
messages = [
    LLMMessage(role="system", content="You are a helpful assistant"),
    LLMMessage(role="user", content="Explain AI")
]

response = await llama_client.completion(messages, content_type="text")
print(response.content)
```

### 기존 방식 (변경 없음)

```python
# 기존 LlamaManager - 그대로 사용
from src.managers.llm import LlamaManager

llama_manager = LlamaManager(
    port=8080, host="localhost",
    llm_model_name="llama-3", logger=logger
)
response = await llama_manager.completion("Hello")

# 기존 PerplexityClient - 그대로 사용
from src.managers.llm.adapters.perplexity import PerplexityClient
result = await perplexity_client.analyze_link("https://example.com")
```

## 설정 관리

```python
from src.managers.llm import LLMConfig

# 다양한 LLM 설정 생성
llama_config = LLMConfig.for_local_llm(host="localhost", port=8080)
perplexity_config = LLMConfig.for_perplexity(api_key="key")
gemini_config = LLMConfig.for_gemini(api_key="key")  # 향후 구현
groq_config = LLMConfig.for_groq(api_key="key")      # 향후 구현
```

## Content Type별 LLM 최적화 예시

### 실제 운영 환경 구성 예시

```python
# 각 작업에 최적화된 LLM 할당
optimized_router = LLMRouter({
    "link": perplexity_client,    # 웹 검색이 강한 Perplexity
    "image": groq_client,         # 빠른 처리가 가능한 Groq
    "text": llama_client          # 비용 절약을 위한 로컬 Llama
})

# 이제 각 작업이 최적화된 LLM으로 자동 라우팅됩니다!
```

### 쉬운 LLM 변경

```python
# 현재 설정
router = LLMRouter({
    "link": perplexity_client,
    "image": perplexity_client,  # 모두 Perplexity 사용
    "text": perplexity_client
})

# 나중에 Groq 추가 시 - 한 줄만 변경!
router = LLMRouter({
    "link": perplexity_client,
    "image": groq_client,        # 이미지만 Groq로 변경
    "text": perplexity_client
})
```

## 향후 확장 계획

### 1. 새로운 LLM API 추가

- **Groq**: 고속 추론을 위한 Groq API 어댑터 구현
- **Gemini**: Google의 Gemini API 지원
- **Claude**: Anthropic의 Claude API 지원
- **GPT-4**: OpenAI GPT-4 API 지원

### 2. 고급 라우팅 기능

- **동적 라우팅**: 부하나 응답시간에 따른 자동 라우팅
- **폴백 체인**: 주 LLM 실패 시 자동으로 백업 LLM 사용 ✅ (DefaultLLMAgent 구현 완료)
- **A/B 테스팅**: 동일한 요청을 다른 LLM으로 처리하여 성능 비교

### DefaultLLMAgent 사용 예시

```python
from src.managers.llm.adapters.agent import DefaultLLMAgent
from src.managers.llm.adapters.gemini import GeminiClient
from src.managers.llm.adapters.perplexity import PerplexityClient

# Primary와 Fallback 클라이언트 생성
gemini_client = GeminiClient(gemini_config, environment=env)
perplexity_client = PerplexityClient(environment=env)  # 공식 SDK 기반

# Default LLM Agent 생성 (표준 래퍼)
llm_agent = DefaultLLMAgent(
    primary=gemini_client,           # 1차 시도
    fallback=perplexity_client        # 실패 시 자동 전환
)

# 사용 - Gemini 실패 시 자동으로 Perplexity로 전환
response = await llm_agent.completion(
    messages=messages,
    content_type=ContentType.TEXT,
    response_schema=ProductResponse  # Structured Output 지원
)
```

### ⭐ Perplexity 클라이언트 (공식 SDK 기반)

공식 Perplexity Python SDK를 사용한 구현체로, 더욱 안정적이고 유지보수가 쉬운 구조:

```python
from src.managers.llm.adapters.perplexity import PerplexityClient
from src.managers.llm.base.types import ContentType

# 클라이언트 초기화
perplexity_client = PerplexityClient(environment=env)

# Structured Output 지원 (Pydantic model → JSON Schema 자동 변환)
from pydantic import BaseModel

class AnalysisResult(BaseModel):
    summary: str
    keywords: list[str]
    category: str

# TEXT 컨텐츠 처리 (링크 분석)
response = await perplexity_client.completion(
    messages=[LLMMessage(role="user", content="Analyze this article")],
    content_type=ContentType.TEXT,
    response_schema=AnalysisResult  # 자동으로 JSON Schema 변환
)

# IMAGE 컨텐츠 처리 (base64 이미지 분석)
response = await perplexity_client.completion(
    messages=[LLMMessage(role="user", content="Analyze this image")],
    content_type=ContentType.IMAGE,
    image_data="base64_encoded_image_data"
)

# structured_output에서 파싱된 결과 확인
print(response.structured_output)  # dict 형태로 반환
```

**Perplexity 클라이언트의 장점**:
- ✅ 공식 SDK의 자동 재시도 및 에러 핸들링
- ✅ 타입 안전성 (SDK 타입 힌팅)
- ✅ API 변경사항 자동 반영 (SDK 업데이트)
- ✅ Structured Output 완벽 지원
- ✅ BASE64 이미지 검증 및 Data URI 변환 자동화

### 3. 공통 유틸리티 확장

- HTTP 클라이언트 공통화
- 에러 처리 및 재시도 로직 표준화
- 응답 캐싱 및 최적화
- 스트리밍 응답 지원

### 4. 모니터링 및 최적화

- LLM별 성능 메트릭 수집
- 비용 추적 및 최적화
- 응답 품질 모니터링

## 아키텍처 장점

### ✅ 완전한 의존성 단순화

- 모든 Processor가 `BaseLLMClient` 하나만 의존
- 복잡한 구체적 타입 의존성 제거

### ✅ Content Type별 최적화

- 각 작업에 가장 적합한 LLM 자동 선택
- 성능과 비용 최적화 가능

### ✅ 무중단 확장

- 새로운 LLM 추가 시 기존 코드 수정 불필요
- Router 설정만 변경하면 즉시 적용

### ✅ 완벽한 호환성

- 기존 코드 100% 그대로 동작
- 점진적 마이그레이션 가능

이제 정말로 확장 가능하고 유지보수하기 쉬운 LLM 아키텍처가 완성되었습니다! 🚀
