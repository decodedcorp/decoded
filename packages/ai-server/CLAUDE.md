# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## MUST FOLLOW

1. Always update [Progress](./PROGRESS.md) when:

- implement a new feature
- Updating TODOs(Already Done & Have Done)

2. Write how to problem solve existing error in detail. Always include logical reason on Notion page called "Learn With Agentic Coding" using MCP. Page name should in format of date. Do only if it is breaking and major changes.

## Project Overview

DECODED-AI is a metadata extraction AI server that processes batches of links and images using various LLM providers. The core functionality involves receiving URLs via gRPC, extracting metadata using web scraping and LLM analysis, and returning structured results.

## Architecture

### Domain-Driven Design

The project follows a **domain-centric architecture** with clear separation of concerns:

- **MetadataContainer**: Central domain container managing all metadata extraction components
- **InfrastructureContainer**: Common infrastructure (Redis, Logger)
- **GRPCContainer**: API layer with servicers

### Three-Layer Pattern

- **Manager Layer** (`src/managers/`): External system integrations (Redis, LLM APIs, Selenium)
- **Service Layer** (`src/services/`): Business logic orchestration
  - `@business_service`: Combines multiple managers/services
  - `@resource_service`: Single manager focused services
- **Controller Layer**: gRPC servicers handle external requests

### LLM Architecture

The project uses a sophisticated LLM routing system:

- **Environment-based configuration**: All LLM settings managed via `Environment` class
- **Adapter pattern**: Standardized `BaseLLMClient` interface for all LLM providers
- **Content-type routing**: `LLMRouter` automatically selects optimal LLM based on content type
  - `"link"`: General web links → Perplexity
  - `"local"`: YouTube URLs → LocalLLM + SearXNG
  - `"image"`: Images → Perplexity
  - `"text"`: General text → Perplexity

## Key Components

### Dependency Injection

Uses `dependency-injector` with container-based DI:

- `Application` container manages all sub-containers
- Environment-based configuration eliminates external_apis.py complexity
- Container hierarchy: Infrastructure → Metadata → GRPC

### Metadata Processing Pipeline

```
gRPC Request → MetadataServicer → MetadataExtractService → MetadataExtractManager
                                                            ↓
                                      LLMRouter → [Perplexity|LocalLLM] → Response
```

### GRPC Structure

- **MetadataServicer**: Handles `ProcessDataBatch` RPC calls
- **Auto-registration**: Container method `register_servicers_to_server()` automatically registers all servicers
- **Standard patterns**: Uses `aio.server()` directly in main.py

## Development Commands

### Environment Setup

```bash
# Development environment
docker-compose -f docker-compose-ai-dev.yml up --build

# Production environment
docker-compose -f docker-compose-ai.yml up --build
```

### Testing

```bash
# Run all tests
pytest

# Run specific test types
pytest -m unit          # Unit tests only
pytest -m integration   # Integration tests
pytest -m e2e           # End-to-end tests
pytest -m performance   # Performance tests

# Run single test file
pytest tests/unit/test_metadata_extractor.py

# Run with specific markers
pytest -m "not external_api"  # Skip external API tests
pytest -m requires_redis      # Only Redis-dependent tests
```

### Local LLM Setup

```bash
# Install llama.cpp
brew install llama.cpp

# Download model
llama-cli -hf google/gemma-3-4b-it-qat-q4_0-gguf --hf-token <token>

# Start llama server
llama-server --model <model_path> --port 1234

# Test llama integration
pytest tests/manager/test_llama.py
```

### Linting and Formatting

```bash
uv run flake8 src      # Linting with flake8
uv run black .         # Formatting with black
```

## Important Implementation Details

### Configuration Management

- **Single source**: All configuration in `Environment` class (`src/config/_environment.py`)
- **Environment injection**: LLM clients receive `Environment` object, not individual config objects
- **LLMConfig.from_env()**: Creates LLM configurations from environment

### Adding New LLM Providers

1. Create adapter in `src/managers/llm/adapters/`
2. Implement `BaseLLMClient` interface
3. Add to `MetadataContainer` LLM client definitions
4. Update `llm_router` mapping in container

### Adding New gRPC Servicers

1. Create servicer class inheriting from protobuf-generated base
2. Add to `GRPCContainer` as singleton
3. Add registration call in `register_servicers_to_server()` method
4. **No changes needed** to main.py - automatic registration

### File Structure Notes

- `services/metadata/processing/`: Core metadata extraction logic
  - `metadata_extract_manager.py`: Actual processing orchestration
  - `metadata_extract_service.py`: Service layer coordination
- `services/metadata/extraction/`: Domain-specific extractors (YouTube, etc.)
- `managers/llm/`: LLM abstraction and routing system

### Environment Variables

Key variables managed through `Environment` class:

- `PERPLEXITY_API_KEY`, `PERPLEXITY_MODEL`, `PERPLEXITY_BASE_URL`
- `LOCAL_LLM_BASE_URL`, `LOCAL_LLM_MODEL`
- `SEARXNG_API_URL`
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ENABLED`
- `REDIS_HOST`, `REDIS_PASSWORD`

## Testing Strategy

- **Unit tests**: Individual component testing in `tests/unit/`
- **Integration tests**: Component interaction testing in `tests/integration/`
- **E2E tests**: Full workflow testing in `tests/e2e/`
- **Performance tests**: Load and concurrent processing in `tests/performance/`
- **Async support**: All tests support asyncio with `asyncio_mode = auto`
