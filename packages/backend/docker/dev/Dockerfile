# Development Dockerfile - Single Stage for Fast Iteration
FROM rust:1.91-slim

# 필요한 시스템 패키지 설치
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    curl \
    protobuf-compiler \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

EXPOSE 8000

# cargo-watch 설치 (선택사항, hot reload용)
RUN cargo install cargo-watch

# 개발 모드로 실행
CMD ["cargo", "run", "--release"]

