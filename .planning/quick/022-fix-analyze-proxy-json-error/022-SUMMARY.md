# Quick Task 022 Summary: Fix Analyze Proxy JSON Error

## Completed

**Problem**: `/api/v1/posts/analyze` proxy failing with JSON parse error when backend returns non-JSON error text.

**Solution**: Changed response handling to:
1. Get response as text first (`response.text()`)
2. Try JSON parsing with `JSON.parse()`
3. If parsing fails, wrap the text message in a JSON response

## Changes

### `packages/web/app/api/v1/posts/analyze/route.ts`

Before:
```typescript
const data = await response.json();
return NextResponse.json(data, { status: response.status });
```

After:
```typescript
const responseText = await response.text();
let data;
try {
  data = JSON.parse(responseText);
} catch {
  console.error("Backend returned non-JSON response:", responseText);
  return NextResponse.json(
    { message: responseText || "Backend error" },
    { status: response.status || 500 }
  );
}
return NextResponse.json(data, { status: response.status });
```

## Result

- Proxy no longer crashes on non-JSON backend responses
- Original backend error message is preserved and forwarded to client
- Proper error status codes maintained
