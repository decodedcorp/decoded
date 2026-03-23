# Production Dockerfile - Multi-Stage Build with Optimizations
# Stage 1: Builder
FROM rust:1.91-slim as builder

# 빌드 의존성 설치
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    build-essential \
    protobuf-compiler \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 전체 소스 한 번에 복사 후 release 빌드 (더미 캐시 단계는 migration/entity와 충돌할 수 있어 사용하지 않음)
COPY . .

RUN cargo build --release && \
    strip target/release/decoded-api

# Stage 2: Runtime — builder(rust:1.91-slim)와 동일 계열 glibc 필요 (bookworm 런타임은 GLIBC 불일치 가능)
FROM rust:1.91-slim

# 런타임 의존성만 설치 (Rust 이미지는 빌드 도구 포함이므로 프로덕션에서는 distroless 대신 glibc 정합용으로 사용)
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 비-root 유저 생성
RUN useradd -m -u 1001 appuser

# 빌드된 바이너리 복사
COPY --from=builder /app/target/release/decoded-api .

# 소유권 변경
RUN chown -R appuser:appuser /app

# 비-root 유저로 전환
USER appuser

EXPOSE 8080

# 헬스체크
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["./decoded-api"]

