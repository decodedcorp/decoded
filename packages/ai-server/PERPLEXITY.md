# Perplexity API Guide

## Search Domain Filter Guide

The search_domain_filter parameter allows you to control which websites are included in or excluded from the search results used by the Sonar models. This feature is particularly useful when you want to:
Restrict search results to trusted sources
Filter out specific domains from search results
Focus research on particular websites
Enabling domain filtering can be done by adding a search_domain_filter field in the request:

```json
"search_domain_filter": [
  "<domain1>",
  "<domain2>",
  ...
]

// Allowlist: Only search these domains
"search_domain_filter": ["wikipedia.org", "github.com", "stackoverflow.com"]

// Denylist: Exclude these domains
"search_domain_filter": ["-reddit.com", "-pinterest.com", "-quora.com"]
```

## Search Context Size

Default search_context_size is low
Selecting "high" increases search costs due to more extensive web retrieval. Use "low" when cost efficiency is critical.

The search_context_size field—passed via the web_search_options object—determines how much search context is retrieved by the Sonar models. This setting can help you optimize for either:
Cost savings with minimal search input (low)
Comprehensive answers by maximizing retrieved information (high)
A balance of both (medium)
This flexibility allows teams to tune their API usage to their budget and use case.
To enable this feature, include the web_search_options.search_context_size parameter in your request payload:

```json
"web_search_options": {
  "search_context_size": "medium"
}
```

Choosing the Right Context Size

- low: Best for short factual queries or when operating under strict token cost constraints.
- medium: The default and best suited for general use cases.
- high: Use for deep research, exploratory questions, or when citations and evidence coverage are critical.

## Search Control Guide

Sonar models provide powerful web search capabilities, but there are times when you want to control when and how searches are performed. Perplexity offers two main approaches for search control:

Search Classifier - Let AI intelligently decide when to search based on the query context

Disable Search - Turn off web search completely for specific requests

The classifier analyzes your query and decides whether:
Search is needed - For questions requiring current information, facts, or research
Search is unnecessary - For creative tasks, math problems, or general knowledge that doesn’t require real-time data

```python
import requests

# API configuration
API_URL = "https://api.perplexity.ai/chat/completions"
API_KEY = "your-api-key-here"

headers = {
    "accept": "application/json",
    "authorization": f"Bearer {API_KEY}",
    "content-type": "application/json"
}

# Query that benefits from search classifier
user_query = "What are the latest developments in quantum computing?"

payload = {
    "model": "sonar-pro",
    "messages": [{"role": "user", "content": user_query}],
    "stream": False,
    "enable_search_classifier": True
}

response = requests.post(API_URL, json=payload, headers=headers)
print(response.json())
```

To disable search completely, set the disable_search parameter to true:

```python
import requests

# API configuration
API_URL = "https://api.perplexity.ai/chat/completions"
API_KEY = "your-api-key-here"

headers = {
    "accept": "application/json",
    "authorization": f"Bearer {API_KEY}",
    "content-type": "application/json"
}

# Query that doesn't need web search
user_query = "What is 2 + 2?"

payload = {
    "model": "sonar-pro",
    "messages": [{"role": "user", "content": user_query}],
    "stream": False,
    "disable_search": True
}

response = requests.post(API_URL, json=payload, headers=headers)
print(response.json())
```

## Structured Output

### Example

```python
curl -X POST "https://api.perplexity.ai/chat/completions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "sonar-pro",
    "messages": [
      {
        "role": "user",
        "content": "Analyze the latest quarterly earnings report for Apple Inc. Extract key financial metrics."
      }
    ],
    "response_format": {
      "type": "json_schema",
      "json_schema": {
        "schema": {
          "type": "object",
          "properties": {
            "company": {"type": "string"},
            "quarter": {"type": "string"},
            "revenue": {"type": "number"},
            "net_income": {"type": "number"},
            "eps": {"type": "number"},
            "revenue_growth_yoy": {"type": "number"},
            "key_highlights": {
              "type": "array",
              "items": {"type": "string"}
            }
          },
          "required": ["company", "quarter", "revenue", "net_income", "eps"]
        }
      }
    }
  }'
```
