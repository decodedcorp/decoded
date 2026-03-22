#!/bin/bash
set -e

echo "========================================="
echo "Starting decoded-api"
echo "Environment: ${ENV:-development}"
echo "Port: ${PORT:-8000}"
echo "========================================="

# 환경변수 확인
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL is not set"
    exit 1
fi

echo "Database URL configured: ${DATABASE_URL%%@*}@***"
echo "Meilisearch URL: ${MEILISEARCH_URL}"

# 마이그레이션은 애플리케이션 시작 시 자동으로 실행됨
echo "Starting application..."
echo "========================================="

# 전달된 명령 실행
exec "$@"

