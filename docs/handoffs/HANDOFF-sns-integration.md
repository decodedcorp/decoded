# Handoff: SNS Integration Backend

> Created: 2026-03-05 | Author: Claude Opus 4.6
> Source repo: `decoded-app` (frontend specs)
> Target repo: **TBD** (backend / crawler service)

## Context

decoded-app은 AI 기반 패션 매거진 개인화 서비스. 유저의 SNS 데이터(Pinterest 보드, Instagram 피드)를 수집하고 AI로 분석하여 개인 스타일 프로필을 구축한 뒤, 이를 기반으로 맞춤형 매거진을 생성한다.

Frontend spec은 `decoded-app`에 완성됨. Backend 구현(OAuth 핸들러, 크롤링 엔진, AI 파이프라인)은 별도 레포에서 진행.

## Spec References (decoded-app)

| Document | Path | Content |
|----------|------|---------|
| Flow | `specs/flows/FLW-07-sns-ingestion.md` | 전체 데이터 수집 플로우, 3-Tier IG 전략, AI 파이프라인 |
| Screen | `specs/screens/user/SCR-USER-04-sns-connect.md` | SNS 연결 UI, 4-state 와이어프레임, 컴포넌트 맵 |
| Data Model | `specs/_shared/data-models.md` (Social Domain section) | TypeScript 타입 + DB 테이블 스키마 |
| Magazine | `specs/screens/magazine/SCR-MAG-02-personal-issue.md` | Style profile 소비처 (Decoding Ritual) |

## What Needs to Be Built (Backend)

### 1. OAuth Handlers

**Pinterest OAuth 2.0:**
- `GET /api/v1/auth/pinterest` -> Authorization URL 생성
- `GET /api/v1/auth/pinterest/callback` -> Code exchange, token 암호화 저장
- Scopes: `boards:read`, `pins:read`, `user_accounts:read`
- Token refresh: Pinterest refresh token flow
- Docs: https://developers.pinterest.com/docs/api/v5/

**Instagram OAuth (Tier 1 - Professional accounts):**
- `GET /api/v1/auth/instagram` -> Authorization URL 생성
- `GET /api/v1/auth/instagram/callback` -> Code exchange
- Uses "Instagram API with Instagram Login" (not deprecated Basic Display)
- Scopes: `instagram_basic`, `instagram_manage_insights`
- Docs: https://developers.facebook.com/docs/instagram-platform

### 2. Instagram Crawler (Tier 2 - General accounts)

**Purpose:** 공식 API로 접근 불가능한 일반 계정의 공개 피드 이미지를 수집

**Architecture:**
```
POST /api/v1/users/me/social/sync { provider: 'instagram', username: '...', consent: true }
  -> Edge Function: fetch-instagram-media
    -> IG GraphQL endpoint (primary)
    -> Playwright headless (backup)
    -> Apify actor (Tier 3 fallback)
```

**Technical Requirements:**
- Residential proxy pool (10+ IPs, rotation per request)
- User-Agent rotation (5+ real Chrome UAs)
- TLS fingerprint matching (stealth plugin)
- Rate limiting: 3-5s random delay between requests
- 429 handling: exponential backoff (2s -> 4s -> 8s -> 16s)
- Daily cap: 200 requests/day total, 1 sync/user/24h
- Target: 최근 12-50 IMAGE type posts per user

**Primary method - IG Internal GraphQL:**
```
GET https://www.instagram.com/graphql/query/
  ?query_hash=<profile_media_hash>
  &variables={"id":"<user_id>","first":50}
Headers: Cookie (session), X-CSRFToken, User-Agent
```

**Backup method - Playwright Headless:**
- Use `puppeteer-extra-plugin-stealth`
- Navigate to `instagram.com/<username>/`
- Parse post grid, extract image URLs
- Speed: 1-2 req/sec (slow, small-scale only)

**Instagram requires login for all endpoints as of 2026.** Session cookie management required.

### 3. Data Sync Engine

**Pinterest Board/Pin Fetcher:**
```
GET https://api.pinterest.com/v5/boards -> Board list
GET https://api.pinterest.com/v5/boards/{board_id}/pins -> Pin list (paginated)
```
- User selects boards on frontend -> backend fetches pins from selected boards
- Extract: image_url, description, link
- Max 100 pins per sync

**Storage:**
- Save to `user_style_references` table
- Fields: source, source_id, image_url, caption, tags
- No image download - URL reference only

### 4. AI Style Analysis Pipeline

**Trigger:** After image collection from any source

**Process:**
1. Batch images (max 100 URLs) -> Gemini Vision API
2. Per-image prompt: "Analyze this fashion image. Extract: style keywords, dominant colors (hex), brand identifiers, aesthetic category"
3. Aggregate across all images:
   - `persona_keywords`: top 5-8 recurring style descriptors
   - `color_palette`: top 5 dominant hex colors
   - `brand_affinities`: brand name -> confidence score map
4. Generate 768-dim embedding vector for similarity search
5. Save to `user_style_profiles` table

**Gemini API considerations:**
- Use batch processing to minimize API calls
- Estimated cost: ~$0.01-0.02 per image analysis
- Error handling: retry with exponential backoff, max 3 attempts

### 5. API Endpoints Summary

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/v1/auth/pinterest` | GET | Required | Pinterest OAuth redirect URL |
| `/api/v1/auth/pinterest/callback` | GET | Required | Token exchange + save |
| `/api/v1/auth/instagram` | GET | Required | Instagram OAuth redirect URL |
| `/api/v1/auth/instagram/callback` | GET | Required | Token exchange + save |
| `/api/v1/users/me/social` | GET | Required | Connected platforms list |
| `/api/v1/users/me/social/:provider` | DELETE | Required | Disconnect + CASCADE delete |
| `/api/v1/users/me/social/sync` | POST | Required | Trigger image sync |
| `/api/v1/users/me/style-profile` | GET | Required | AI style analysis result |
| `/api/v1/pinterest/boards` | GET | Required | Pinterest boards list |
| `/api/v1/users/me/style-references` | POST | Required | Direct upload save |

## Database Migration

3 new tables required in Supabase. Full DDL in `specs/flows/FLW-07-sns-ingestion.md` section 5, also in `specs/_shared/data-models.md` Social Domain section.

```sql
-- Tables
user_social_tokens    -- OAuth tokens (AES-256 encrypted)
user_style_references -- Collected image references
user_style_profiles   -- AI analysis results (with pgvector)

-- RLS
ALTER TABLE user_social_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own tokens" ON user_social_tokens
  FOR ALL USING (user_id = auth.uid());
-- Same pattern for other tables

-- Extension
CREATE EXTENSION IF NOT EXISTS vector;  -- for style_vector column
```

## Infrastructure Requirements

| Item | Purpose | Priority |
|------|---------|----------|
| Pinterest Developer App | API Key + Secret | P0 - register at developers.pinterest.com |
| Meta Developer App | Instagram API Key | P1 - register at developers.facebook.com |
| Residential Proxy Service | IG crawling anti-detection | P1 - e.g. Bright Data, Oxylabs |
| Supabase pgvector extension | Style vector similarity search | P1 |
| Apify account (optional) | Tier 3 managed scraping fallback | P2 |

## Security Checklist

- [ ] OAuth tokens encrypted with AES-256 before storage
- [ ] Decryption only in server-side Edge Functions (never client)
- [ ] RLS on all social tables: `user_id = auth.uid()`
- [ ] Instagram crawler: no user credentials stored
- [ ] Explicit consent flag required for crawling (`consent: true`)
- [ ] CASCADE delete on disconnect (tokens + references + profile)
- [ ] Rate limiting on sync endpoint (1/user/24h)
- [ ] Proxy credentials in environment variables (not hardcoded)

## Frontend Integration Points

When backend is ready, `decoded-app` frontend needs:

1. **socialStore** (`lib/stores/socialStore.ts`) - Zustand store for connection state, sync progress, style profile
2. **API client functions** (`lib/api/social.ts`) - Typed fetch wrappers for all endpoints
3. **Components** in `lib/components/settings/` - 6 new components (see SCR-USER-04)
4. **Route** `app/settings/connect/page.tsx` - SNS connect page
5. **SCR-MAG-02 update** - Wire style profile into Decoding Ritual particle animation

## Decision Log

| Decision | Rationale |
|----------|-----------|
| Pinterest-first priority | General account access, rich fashion board data |
| Instagram 3-tier strategy | Official API limited to Pro accounts; crawling covers general users |
| Server-side crawling (not client) | Anti-detection, proxy support, token security |
| URL reference only (no image download) | Privacy by design, storage cost reduction |
| Separate backend repo | Crawler infrastructure (proxies, stealth) doesn't belong in frontend repo |
| AES-256 token encryption | Industry standard, Supabase vault integration possible |
| pgvector for embeddings | Native Supabase support, similarity search capability |

---

*This handoff document is self-contained. The backend team can implement without needing decoded-app frontend context beyond the spec files referenced above.*
