# Staging Dockerfile - Multi-Stage Build
# Stage 1: Builder
FROM rust:1.91-slim as builder

# 빌드 의존성 설치
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    build-essential \
    curl \
    protobuf-compiler \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 의존성 캐싱 최적화
# 먼저 Cargo.toml과 Cargo.lock만 복사
COPY Cargo.toml Cargo.lock build.rs ./
COPY entity/Cargo.toml ./entity/
COPY migration/Cargo.toml ./migration/
COPY proto ./proto

# 더미 main.rs로 의존성 빌드
RUN mkdir -p src entity/src migration/src && \
    echo "fn main() {}" > src/main.rs && \
    echo "fn main() {}" > entity/src/lib.rs && \
    echo "fn main() {}" > migration/src/lib.rs && \
    cargo build --release && \
    rm -rf src entity/src migration/src

# 실제 소스코드 복사 및 빌드
COPY . .
RUN cargo build --release

# Stage 2: Runtime
FROM debian:bookworm-slim

# 런타임 의존성만 설치
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 비-root 유저 생성
RUN useradd -m -u 1001 appuser

# 빌드된 바이너리 복사
COPY --from=builder /app/target/release/decoded-api .

# LLM 템플릿 파일 복사 (필요한 경우)
COPY --from=builder /app/src/services/llm/templates ./templates

# 소유권 변경
RUN chown -R appuser:appuser /app

# 비-root 유저로 전환
USER appuser

EXPOSE 8001

# 헬스체크
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

CMD ["./decoded-api"]

