# Quick Task 022: Fix Analyze Proxy JSON Error

## Problem

`/api/v1/posts/analyze` 엔드포인트에서 JSON 파싱 오류 발생:

```
SyntaxError: Unexpected token 'I', "Invalid `b"... is not valid JSON
```

백엔드 API가 에러 시 JSON이 아닌 plain text를 반환하면 `response.json()`이 실패.

## Root Cause

- 백엔드가 에러 응답을 plain text로 반환 (예: "Invalid `base64` encoding")
- 프록시가 `response.json()`을 무조건 호출하여 파싱 실패
- catch 블록에서 원래 에러 메시지 대신 generic 메시지만 반환

## Solution

응답을 먼저 text로 받고 JSON 파싱 시도:

1. `response.text()`로 응답 받기
2. `JSON.parse()` 시도
3. 파싱 실패 시 텍스트 메시지를 JSON으로 래핑하여 반환

## Tasks

- [x] Task 1: Fix JSON parsing in analyze proxy route

## Files Changed

- `packages/web/app/api/v1/posts/analyze/route.ts`
