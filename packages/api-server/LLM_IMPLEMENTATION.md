# LLM Client 구현 가이드

**Version:** 1.0.0
**Last Updated:** 2026.01.08
**참조:** [REQUIREMENT.md](./REQUIREMENT.md)

---

> **참고**: `packages/ai-server/src/managers/llm/` 패턴을 Rust로 포팅. Trait 기반 추상화로 다양한 LLM Provider를 통합 관리합니다.

## 1. 아키텍처 개요

```
src/llm/
├── mod.rs                    # 공용 exports
├── base/
│   ├── mod.rs               # Base module exports
│   ├── client.rs            # LLMClient Trait 정의
│   ├── message.rs           # LLMMessage, LLMResponse 표준 모델
│   └── config.rs            # LLMConfig 설정 구조체
├── clients/
│   ├── mod.rs               # Client module exports
│   ├── groq.rs              # GroqClient 구현
│   └── perplexity.rs        # PerplexityClient 구현
├── routing/
│   ├── mod.rs               # Routing module exports
│   ├── router.rs            # LLMRouter (Content Type별 라우팅)
│   └── content_resolver.rs  # ContentTypeResolver (URL 기반 라우팅)
└── prompts/
    ├── mod.rs               # Prompt 관리
    └── templates/           # Tera 템플릿
        ├── link_analysis.tera
        └── image_analysis.tera
```

## 2. 핵심 타입 정의

### 2.1 LLMMessage & LLMResponse (표준 메시지 모델)

```rust
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// LLM 대화 메시지
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LLMMessage {
    /// 역할: "system", "user", "assistant"
    pub role: String,
    /// 메시지 내용
    pub content: String,
}

impl LLMMessage {
    pub fn system(content: impl Into<String>) -> Self {
        Self { role: "system".to_string(), content: content.into() }
    }

    pub fn user(content: impl Into<String>) -> Self {
        Self { role: "user".to_string(), content: content.into() }
    }

    pub fn assistant(content: impl Into<String>) -> Self {
        Self { role: "assistant".to_string(), content: content.into() }
    }
}

/// API 사용량 추적
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct LLMUsage {
    pub prompt_tokens: Option<u32>,
    pub completion_tokens: Option<u32>,
    pub total_tokens: Option<u32>,
}

/// LLM 응답 표준 포맷
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LLMResponse {
    /// 생성된 텍스트 내용
    pub content: String,
    /// 토큰 사용량
    pub usage: Option<LLMUsage>,
    /// 구조화된 메타데이터 (title, description, category 등)
    #[serde(default)]
    pub metadata: HashMap<String, serde_json::Value>,
    /// 원본 응답 (디버깅용)
    pub raw_response: Option<serde_json::Value>,
}
```

### 2.2 LLMConfig (설정 구조체)

```rust
use std::time::Duration;

/// LLM Provider 열거형
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LLMProvider {
    Groq,
    Perplexity,
}

impl LLMProvider {
    pub fn default_model(&self) -> &str {
        match self {
            Self::Groq => "llama-3.3-70b-versatile",
            Self::Perplexity => "sonar",
        }
    }

    pub fn base_url(&self) -> &str {
        match self {
            Self::Groq => "https://api.groq.com/openai/v1",
            Self::Perplexity => "https://api.perplexity.ai",
        }
    }
}

/// LLM 클라이언트 설정
#[derive(Debug, Clone)]
pub struct LLMConfig {
    pub provider: LLMProvider,
    pub api_key: String,
    pub model: String,
    pub base_url: Option<String>,
    pub max_tokens: u32,
    pub temperature: f32,
    pub max_retries: u32,
    pub request_timeout: Duration,
}

impl LLMConfig {
    /// 환경 변수에서 설정 생성
    pub fn from_env(provider: LLMProvider) -> Result<Self, ConfigError> {
        let env_prefix = match provider {
            LLMProvider::Groq => "GROQ",
            LLMProvider::Perplexity => "PERPLEXITY",
        };

        Ok(Self {
            provider: provider.clone(),
            api_key: std::env::var(format!("{}_API_KEY", env_prefix))
                .map_err(|_| ConfigError::MissingApiKey(provider.clone()))?,
            model: std::env::var(format!("{}_MODEL", env_prefix))
                .unwrap_or_else(|_| provider.default_model().to_string()),
            base_url: std::env::var(format!("{}_BASE_URL", env_prefix)).ok(),
            max_tokens: 1024,
            temperature: 0.2,
            max_retries: 3,
            request_timeout: Duration::from_secs(30),
        })
    }
}
```

## 3. LLMClient Trait (핵심 추상화)

```rust
use async_trait::async_trait;

/// Content Type 열거형
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ContentType {
    Text,
    Link,
    Image,
}

impl ContentType {
    pub fn as_str(&self) -> &str {
        match self {
            Self::Text => "text",
            Self::Link => "link",
            Self::Image => "image",
        }
    }
}

/// LLM 클라이언트 추상화 Trait
#[async_trait]
pub trait LLMClient: Send + Sync {
    /// Content Type별 completion 처리
    async fn completion(
        &self,
        messages: Vec<LLMMessage>,
        content_type: ContentType,
        locale: &str,
        options: CompletionOptions,
    ) -> Result<LLMResponse, LLMError>;

    /// 서비스 상태 확인
    async fn health_check(&self) -> bool;

    /// Provider 이름 반환
    fn provider(&self) -> LLMProvider;

    /// 모델 이름 반환
    fn model(&self) -> &str;
}

/// Completion 옵션
#[derive(Debug, Clone, Default)]
pub struct CompletionOptions {
    pub max_tokens: Option<u32>,
    pub temperature: Option<f32>,
    pub url: Option<String>,           // Link 분석용
    pub image_data: Option<String>,    // Image 분석용 (Base64)
    pub image_url: Option<String>,     // Image URL 분석용
}

/// LLM 에러 타입
#[derive(Debug, thiserror::Error)]
pub enum LLMError {
    #[error("API request failed: {0}")]
    RequestFailed(String),

    #[error("Rate limit exceeded")]
    RateLimited,

    #[error("Invalid response format: {0}")]
    InvalidResponse(String),

    #[error("Content type {0} not supported by this provider")]
    UnsupportedContentType(String),

    #[error("Configuration error: {0}")]
    ConfigError(String),

    #[error("Network error: {0}")]
    NetworkError(#[from] reqwest::Error),
}
```

## 4. GroqClient 구현

```rust
use reqwest::Client;
use tracing::{info, warn, error};

pub struct GroqClient {
    config: LLMConfig,
    client: Client,
}

impl GroqClient {
    pub fn new(config: LLMConfig) -> Result<Self, LLMError> {
        if config.provider != LLMProvider::Groq {
            return Err(LLMError::ConfigError("Invalid provider for GroqClient".into()));
        }

        let client = Client::builder()
            .timeout(config.request_timeout)
            .build()?;

        Ok(Self { config, client })
    }

    /// Link 분석 프롬프트 생성
    fn build_link_analysis_prompt(&self, content: &str, locale: &str) -> String {
        let truncated = Self::truncate_content(content, 3000);
        let lang_instruction = get_language_instruction(locale);

        format!(
            "{}\n\
            Return with following fields: title, description, metadata, category, qna\n\
            Content: {}\n\
            Format your response as JSON:\n\
            {{\n  \"title\": \"Improved title here\",\n  \"description\": \"...\",\n  \
            \"metadata\": {{}},\n  \"category\": \"...\",\n  \"qna\": [{{\"question\": \"...\", \"answer\": \"...\"}}]\n}}",
            lang_instruction, truncated
        )
    }

    /// API 요청 전송
    async fn make_api_request(
        &self,
        messages: Vec<serde_json::Value>,
        temperature: f32,
    ) -> Result<GroqApiResponse, LLMError> {
        let payload = serde_json::json!({
            "model": self.config.model,
            "messages": messages,
            "temperature": temperature
        });

        let response = self.client
            .post(format!("{}/chat/completions", self.config.base_url.as_ref()
                .unwrap_or(&"https://api.groq.com/openai/v1".to_string())))
            .header("Authorization", format!("Bearer {}", self.config.api_key))
            .header("Content-Type", "application/json")
            .json(&payload)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(LLMError::RequestFailed(format!("{}: {}", status, body)));
        }

        response.json().await.map_err(|e| LLMError::InvalidResponse(e.to_string()))
    }

    /// Content 토큰 제한 truncate
    fn truncate_content(content: &str, max_tokens: usize) -> String {
        let estimated_tokens = content.len() / 4;
        if estimated_tokens <= max_tokens {
            return content.to_string();
        }

        let max_chars = max_tokens * 4;
        if content.len() <= max_chars {
            return content.to_string();
        }

        let keep_start = max_chars / 3;
        let keep_end = max_chars / 3;

        format!(
            "{}\n\n[Content truncated - original length: {} chars]\n\n{}",
            &content[..keep_start],
            content.len(),
            &content[content.len() - keep_end..]
        )
    }
}

#[async_trait]
impl LLMClient for GroqClient {
    async fn completion(
        &self,
        messages: Vec<LLMMessage>,
        content_type: ContentType,
        locale: &str,
        options: CompletionOptions,
    ) -> Result<LLMResponse, LLMError> {
        match content_type {
            ContentType::Link => {
                let prompt = self.build_link_analysis_prompt(&messages[0].content, locale);
                let lang_instruction = get_language_instruction(locale);

                let api_messages = vec![
                    serde_json::json!({"role": "system", "content": format!("You are a professional content analyzer. {}", lang_instruction)}),
                    serde_json::json!({"role": "user", "content": prompt}),
                ];

                let response = self.make_api_request(
                    api_messages,
                    options.temperature.unwrap_or(self.config.temperature),
                ).await?;

                Ok(parse_groq_response(response))
            }
            ContentType::Image => {
                Err(LLMError::UnsupportedContentType("Groq doesn't support image analysis".into()))
            }
            ContentType::Text => {
                let api_messages: Vec<_> = messages.iter().map(|m| {
                    serde_json::json!({"role": &m.role, "content": &m.content})
                }).collect();

                let response = self.make_api_request(
                    api_messages,
                    options.temperature.unwrap_or(self.config.temperature),
                ).await?;

                Ok(parse_groq_response(response))
            }
        }
    }

    async fn health_check(&self) -> bool {
        !self.config.api_key.is_empty()
    }

    fn provider(&self) -> LLMProvider {
        LLMProvider::Groq
    }

    fn model(&self) -> &str {
        &self.config.model
    }
}
```

## 5. PerplexityClient 구현

```rust
pub struct PerplexityClient {
    config: LLMConfig,
    client: Client,
}

impl PerplexityClient {
    pub fn new(config: LLMConfig) -> Result<Self, LLMError> {
        if config.provider != LLMProvider::Perplexity {
            return Err(LLMError::ConfigError("Invalid provider for PerplexityClient".into()));
        }

        let client = Client::builder()
            .timeout(config.request_timeout)
            .build()?;

        Ok(Self { config, client })
    }

    /// Link 분석 API 요청
    async fn analyze_link(
        &self,
        url: &str,
        messages: &[LLMMessage],
        locale: &str,
    ) -> Result<LLMResponse, LLMError> {
        let prompt = self.build_link_analysis_prompt(url, messages, locale);
        let lang_instruction = get_language_instruction(locale);

        let payload = serde_json::json!({
            "model": self.config.model,
            "messages": [
                {"role": "system", "content": format!("You are professional contents analyzer. {} All of the info must be your own content", lang_instruction)},
                {"role": "user", "content": prompt}
            ],
            "return_related_questions": true,
            "search_mode": "web",
            "enable_search_classifier": true,
            "web_search_options": {"search_context_size": "medium"},
            "max_tokens": 1000,
            "temperature": 0.2,
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            "description": {"type": "string"},
                            "metadata": {"type": "object", "additionalProperties": {"type": "string"}},
                            "category": {"type": "string"},
                            "qna": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "question": {"type": "string"},
                                        "answer": {"type": "string"}
                                    }
                                },
                                "maxItems": 5
                            }
                        },
                        "required": ["title", "description", "category", "qna", "metadata"]
                    }
                }
            }
        });

        let response = self.client
            .post(format!("{}/chat/completions", self.config.base_url.as_ref()
                .unwrap_or(&"https://api.perplexity.ai".to_string())))
            .header("Authorization", format!("Bearer {}", self.config.api_key))
            .header("Content-Type", "application/json")
            .json(&payload)
            .send()
            .await?;

        self.parse_api_response(response).await
    }

    /// Image 분석 API 요청 (Base64 데이터)
    async fn analyze_image_data(
        &self,
        base64_data: &str,
        locale: &str,
    ) -> Result<LLMResponse, LLMError> {
        let mime_type = detect_image_format(base64_data)?;
        let image_data_uri = format!("data:{};base64,{}", mime_type, base64_data);

        let lang_instruction = get_language_instruction(locale);
        let prompt = self.build_image_analysis_prompt(locale);

        let payload = serde_json::json!({
            "model": self.config.model,
            "messages": [
                {"role": "system", "content": format!("You are professional image analyzer. {} All of the info must be your own analysis", lang_instruction)},
                {"role": "user", "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": image_data_uri}}
                ]}
            ],
            "max_tokens": 1000,
            "temperature": 0.2,
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "description": {"type": "string"},
                            "objects": {"type": "array", "items": {"type": "string"}},
                            "context": {"type": "string"},
                            "style": {"type": "string"},
                            "category": {"type": "string"},
                            "metadata": {"type": "object", "additionalProperties": {"type": "string"}},
                            "qna": {"type": "array", "items": {"type": "object"}, "maxItems": 5}
                        },
                        "required": ["description", "category"]
                    }
                }
            }
        });

        let response = self.client
            .post(format!("{}/chat/completions", self.config.base_url.as_ref()
                .unwrap_or(&"https://api.perplexity.ai".to_string())))
            .header("Authorization", format!("Bearer {}", self.config.api_key))
            .header("Content-Type", "application/json")
            .json(&payload)
            .send()
            .await?;

        self.parse_api_response(response).await
    }

    fn build_link_analysis_prompt(&self, url: &str, messages: &[LLMMessage], locale: &str) -> String {
        let lang_instruction = get_language_instruction(locale);
        let enriched_context = messages.first().map(|m| m.content.as_str()).unwrap_or("");

        format!(
            "{} Analyze the following enriched content and provide enhanced metadata.\n\n\
            Enriched content to analyze:\n{}\n\n\
            Based on the provided enriched content, please provide:\n\
            1. Improved title (max 100 characters)\n\
            2. Improved description (max 300 characters)\n\
            3. Main topics or keywords (comma-separated) in metadata\n\
            4. Content category (e.g., sns, article, product, service, news, blog, video, etc)\n\
            5. List of questions and answers (maximum 5 questions)",
            lang_instruction, enriched_context
        )
    }

    fn build_image_analysis_prompt(&self, locale: &str) -> String {
        let lang_instruction = get_language_instruction(locale);

        format!(
            "{} Analyze the provided image and provide detailed metadata.\n\n\
            Please provide:\n\
            1. Detailed description of what you see in the image\n\
            2. List of main objects in the image\n\
            3. Context of the image if possible\n\
            4. Style of the image\n\
            5. Category of the image\n\
            6. Any kind of metadata you can find in the image\n\
            7. List of questions and answers (maximum 5 questions)",
            lang_instruction
        )
    }
}

#[async_trait]
impl LLMClient for PerplexityClient {
    async fn completion(
        &self,
        messages: Vec<LLMMessage>,
        content_type: ContentType,
        locale: &str,
        options: CompletionOptions,
    ) -> Result<LLMResponse, LLMError> {
        match content_type {
            ContentType::Link => {
                let url = options.url.as_deref().unwrap_or("");
                self.analyze_link(url, &messages, locale).await
            }
            ContentType::Image => {
                if let Some(image_data) = &options.image_data {
                    self.analyze_image_data(image_data, locale).await
                } else if let Some(image_url) = &options.image_url {
                    self.analyze_image_url(image_url, locale).await
                } else {
                    Err(LLMError::ConfigError("Either image_data or image_url required".into()))
                }
            }
            ContentType::Text => {
                self.text_completion(&messages, locale, &options).await
            }
        }
    }

    async fn health_check(&self) -> bool {
        !self.config.api_key.is_empty()
    }

    fn provider(&self) -> LLMProvider {
        LLMProvider::Perplexity
    }

    fn model(&self) -> &str {
        &self.config.model
    }
}
```

## 6. LLMRouter 구현 (Content Type 라우팅)

```rust
use std::collections::HashMap;
use std::sync::Arc;

/// Content Type별 LLM 라우터
pub struct LLMRouter {
    /// Content Type → LLM Client(s) 매핑
    clients: HashMap<ContentType, Vec<Arc<dyn LLMClient>>>,
    /// Fallback Content Type
    fallback: ContentType,
    /// URL 기반 Content Type 리졸버
    content_resolver: ContentTypeResolver,
}

impl LLMRouter {
    pub fn new(fallback: ContentType) -> Self {
        Self {
            clients: HashMap::new(),
            fallback,
            content_resolver: ContentTypeResolver::new(),
        }
    }

    /// Builder 패턴으로 클라이언트 추가
    pub fn with_client(mut self, content_type: ContentType, client: Arc<dyn LLMClient>) -> Self {
        self.clients.entry(content_type).or_default().push(client);
        self
    }

    /// 여러 클라이언트를 한 Content Type에 매핑
    pub fn with_clients(mut self, content_type: ContentType, clients: Vec<Arc<dyn LLMClient>>) -> Self {
        self.clients.entry(content_type).or_default().extend(clients);
        self
    }

    /// Content Type에 맞는 클라이언트 선택
    fn get_client(&self, content_type: &ContentType, url: Option<&str>) -> Option<Arc<dyn LLMClient>> {
        if let Some(clients) = self.clients.get(content_type) {
            if clients.len() == 1 {
                return Some(clients[0].clone());
            }

            if let Some(url) = url {
                return Some(self.select_client_for_url(url, clients));
            }

            return clients.first().cloned();
        }

        self.clients.get(&self.fallback)?.first().cloned()
    }

    /// URL 패턴에 따른 최적 클라이언트 선택
    fn select_client_for_url(&self, url: &str, clients: &[Arc<dyn LLMClient>]) -> Arc<dyn LLMClient> {
        // YouTube URL → Groq 선호 (빠른 처리)
        if url.contains("youtube.com") || url.contains("youtu.be") {
            if let Some(groq) = clients.iter().find(|c| c.provider() == LLMProvider::Groq) {
                return groq.clone();
            }
        }

        // 일반 URL → Perplexity 선호 (웹 검색 능력)
        if let Some(perplexity) = clients.iter().find(|c| c.provider() == LLMProvider::Perplexity) {
            return perplexity.clone();
        }

        clients[0].clone()
    }
}

#[async_trait]
impl LLMClient for LLMRouter {
    async fn completion(
        &self,
        messages: Vec<LLMMessage>,
        content_type: ContentType,
        locale: &str,
        options: CompletionOptions,
    ) -> Result<LLMResponse, LLMError> {
        let url = options.url.as_deref();

        let client = self.get_client(&content_type, url)
            .ok_or_else(|| LLMError::ConfigError(
                format!("No client available for content type {:?}", content_type)
            ))?;

        info!(
            "Routing {:?} request to {} ({})",
            content_type,
            client.provider().to_string(),
            client.model()
        );

        client.completion(messages, content_type, locale, options).await
    }

    async fn health_check(&self) -> bool {
        for clients in self.clients.values() {
            for client in clients {
                if client.health_check().await {
                    return true;
                }
            }
        }
        false
    }

    fn provider(&self) -> LLMProvider {
        LLMProvider::Groq // Placeholder
    }

    fn model(&self) -> &str {
        "router"
    }
}
```

## 7. ContentTypeResolver (URL 기반 라우팅)

```rust
use regex::Regex;

/// URL 패턴 기반 Content Type 리졸버
pub struct ContentTypeResolver {
    youtube_pattern: Regex,
    image_extensions: Vec<&'static str>,
}

impl ContentTypeResolver {
    pub fn new() -> Self {
        Self {
            youtube_pattern: Regex::new(r"(youtube\.com|youtu\.be)").unwrap(),
            image_extensions: vec!["jpg", "jpeg", "png", "gif", "webp", "svg"],
        }
    }

    /// URL에서 Content Type 추론
    pub fn resolve(&self, url: &str) -> ContentType {
        let lower_url = url.to_lowercase();

        if self.youtube_pattern.is_match(&lower_url) {
            return ContentType::Link;
        }

        for ext in &self.image_extensions {
            if lower_url.ends_with(ext) {
                return ContentType::Image;
            }
        }

        ContentType::Link
    }

    /// YouTube URL인지 확인
    pub fn is_youtube(&self, url: &str) -> bool {
        self.youtube_pattern.is_match(&url.to_lowercase())
    }
}
```

## 8. 언어 지원 (다국어 응답)

```rust
/// 로케일 코드에 따른 언어 지시문 반환
pub fn get_language_instruction(locale: &str) -> &'static str {
    match locale.to_lowercase().as_str() {
        "ko" => "Please respond in Korean.",
        "ja" => "Please respond in Japanese.",
        "zh" | "zh-cn" => "Please respond in Simplified Chinese.",
        "zh-tw" => "Please respond in Traditional Chinese.",
        "en" | "" => "",
        _ => "Please respond in Korean.",
    }
}
```

## 9. 프롬프트 관리 (Tera 템플릿)

> **중요**: 프롬프트는 항상 Tera 템플릿을 사용하여 재사용 가능하고 유지보수가 용이하게 관리합니다.

### 9.1 템플릿 구조

```
src/llm/prompts/
├── mod.rs
├── manager.rs           # PromptManager 구현
└── templates/
    ├── link_analysis.tera
    ├── image_analysis.tera
    └── text_completion.tera
```

### 9.2 PromptManager 구현

```rust
use tera::{Tera, Context};
use std::sync::Arc;

pub struct PromptManager {
    tera: Arc<Tera>,
}

impl PromptManager {
    pub fn new() -> Result<Self, LLMError> {
        let tera = match Tera::new("src/llm/prompts/templates/**/*.tera") {
            Ok(t) => t,
            Err(e) => {
                return Err(LLMError::ConfigError(
                    format!("Failed to load prompt templates: {}", e)
                ));
            }
        };

        Ok(Self {
            tera: Arc::new(tera),
        })
    }

    pub fn render(
        &self,
        template_name: &str,
        locale: &str,
        context: &mut Context,
    ) -> Result<String, LLMError> {
        let language_instruction = get_language_instruction(locale);
        context.insert("language_instruction", language_instruction);

        self.tera
            .render(template_name, context)
            .map_err(|e| LLMError::ConfigError(format!("Template render error: {}", e)))
    }

    pub fn render_link_analysis(
        &self,
        enriched_content: &str,
        locale: &str,
    ) -> Result<String, LLMError> {
        let mut context = Context::new();
        context.insert("enriched_content", enriched_content);

        self.render("link_analysis.tera", locale, &mut context)
    }

    pub fn render_image_analysis(&self, locale: &str) -> Result<String, LLMError> {
        let context = Context::new();
        self.render("image_analysis.tera", locale, &mut context)
    }
}
```

### 9.3 템플릿 파일 예시

**link_analysis.tera:**
```jinja2
{% if language_instruction %}{{ language_instruction }}{% endif %}

Analyze the following enriched content and provide enhanced metadata.

Enriched content to analyze:
{{ enriched_content }}

Based on the provided enriched content, please provide:
1. Improved title (max 100 characters)
2. Improved description (max 300 characters)
3. Main topics or keywords (comma-separated) in metadata
4. Content category (e.g., sns, article, product, service, news, blog, video, etc)
5. List of questions and answers (maximum 5 questions)

Format your response as JSON:
{
  "title": "Improved title here",
  "description": "Improved description here",
  "metadata": {"key": "value"},
  "category": "content category",
  "qna": [{"question": "question", "answer": "answer"}, ...]
}
```

**image_analysis.tera:**
```jinja2
{% if language_instruction %}{{ language_instruction }}{% endif %}

Analyze the provided image and provide detailed metadata.

Please provide:
1. Detailed description of what you see in the image
2. List of main objects in the image
3. Context of the image if possible
4. Style of the image
5. Category of the image
6. Any kind of metadata you can find in the image
7. List of questions and answers (maximum 5 questions)

Format your response as JSON:
{
  "description": "Detailed description",
  "objects": ["object1", "object2"],
  "context": "Image context",
  "style": "Image style",
  "category": "Image category",
  "metadata": {"key": "value"},
  "qna": [{"question": "question", "answer": "answer"}, ...]
}
```

## 10. AppState 통합

```rust
use std::sync::Arc;
use crate::llm::{LLMRouter, LLMClient, GroqClient, PerplexityClient, LLMConfig, LLMProvider, ContentType};

pub struct AppState {
    pub db: DatabaseConnection,
    pub meilisearch: meilisearch_sdk::Client,
    pub r2_client: aws_sdk_s3::Client,
    pub llm_router: Arc<LLMRouter>,
    // ... 기타 상태
}

impl AppState {
    pub async fn new() -> Result<Self, Error> {
        let groq_config = LLMConfig::from_env(LLMProvider::Groq)?;
        let perplexity_config = LLMConfig::from_env(LLMProvider::Perplexity)?;

        let groq_client: Arc<dyn LLMClient> = Arc::new(GroqClient::new(groq_config)?);
        let perplexity_client: Arc<dyn LLMClient> = Arc::new(PerplexityClient::new(perplexity_config)?);

        let llm_router = Arc::new(
            LLMRouter::new(ContentType::Text)
                .with_clients(ContentType::Link, vec![perplexity_client.clone(), groq_client.clone()])
                .with_client(ContentType::Image, perplexity_client.clone())
                .with_client(ContentType::Text, perplexity_client.clone())
        );

        Ok(Self {
            // ... 기타 필드
            llm_router,
        })
    }
}
```

## 11. 사용 예시

```rust
async fn analyze_post_image(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<AnalyzeImageRequest>,
) -> Result<Json<AnalyzeImageResponse>, ApiError> {
    let messages = vec![LLMMessage::user(&payload.context)];

    let options = CompletionOptions {
        image_data: Some(payload.image_base64),
        ..Default::default()
    };

    let response = state.llm_router
        .completion(messages, ContentType::Image, "ko", options)
        .await
        .map_err(|e| ApiError::LLMError(e.to_string()))?;

    let detected_items = response.metadata.get("objects")
        .and_then(|v| v.as_array())
        .map(|arr| arr.iter().filter_map(|v| v.as_str()).collect::<Vec<_>>())
        .unwrap_or_default();

    Ok(Json(AnalyzeImageResponse {
        detected_items,
        metadata: response.metadata,
    }))
}
```

## 12. 환경 변수 설정

```bash
# Groq AI
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=llama-3.3-70b-versatile  # optional

# Perplexity AI
PERPLEXITY_API_KEY=your-perplexity-api-key
PERPLEXITY_MODEL=sonar  # optional
PERPLEXITY_BASE_URL=https://api.perplexity.ai  # optional
```

## 13. 주요 특징 요약

| 특징 | 설명 |
|------|------|
| **Trait 기반 추상화** | `LLMClient` trait으로 모든 Provider 통합 |
| **Content Type 라우팅** | Link, Image, Text별 최적 Provider 자동 선택 |
| **URL 기반 선택** | YouTube → Groq (속도), 일반 URL → Perplexity (웹 검색) |
| **다국어 지원** | 로케일 코드에 따른 응답 언어 제어 |
| **JSON Schema 응답** | Perplexity의 structured output 활용 |
| **확장 가능** | 새 Provider 추가 시 Client 구현체만 추가 |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2026.01.08 | REQUIREMENT.md에서 분리하여 독립 문서로 생성 |
