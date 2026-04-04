# Warehouse Schema Reference

> ETL 파이프라인 데이터를 저장하는 Supabase `warehouse` 스키마.  
> Instagram 수집 → 엔티티 관리 → Seed 퍼블리싱 파이프라인 전체를 커버한다.

> **참고**: `public.posts` 및 `public.solutions` 테이블(앱 스키마)에는 warehouse 엔티티를 참조하는 FK 컬럼이 추가되었습니다. 자세한 내용은 아래 [App 스키마 FK 컬럼](#app-스키마-fk-컬럼-warehouse-참조) 섹션을 참고합니다.

**Project ID:** `fvxchskblyhuswzlcmql`  
**Schema:** `warehouse` (API Exposed)  
**Types 파일:** `packages/web/lib/supabase/warehouse-types.ts` (2026-03-26 생성, warehouse 스키마 전용)
**Public Types 파일:** `packages/web/lib/supabase/types.ts` (2026-04-04 재생성, `supabase gen types` 기반)  
**Client 파일:** `packages/web/lib/supabase/warehouse.ts`

---

## Quick Start

```ts
// Server Component
import { createWarehouseServerClient } from "@/lib/supabase/warehouse";
const wh = await createWarehouseServerClient();
const { data } = await wh.from("artists").select("*");

// Client Component
import { getWarehouseBrowserClient } from "@/lib/supabase/warehouse";
const wh = getWarehouseBrowserClient();
```

타입 재생성:
```bash
npx supabase gen types typescript --project-id fvxchskblyhuswzlcmql --schema warehouse
```

---

## ERD Overview

```
┌─────────────┐     ┌─────────────────────┐     ┌─────────────┐
│   artists   │────▶│ instagram_accounts   │◀────│   brands    │
└──────┬──────┘     └──────────┬──────────┘     └─────────────┘
       │                       │
┌──────┴──────┐         ┌──────┴──────┐
│group_members│         │    posts    │
└──────┬──────┘         └──────┬──────┘
       │                       │
┌──────┴──────┐         ┌──────┴──────┐
│   groups    │         │   images    │
└─────────────┘         └─────────────┘
                               │
                        ┌──────┴──────┐
                        │ seed_posts  │
                        └──────┬──────┘
                               │
                 ┌─────────────┼─────────────┐
                 │             │             │
          ┌──────┴──────┐ ┌───┴────┐ ┌──────┴──────┐
          │ seed_spots  │ │seed_   │ │             │
          └──────┬──────┘ │asset   │ │             │
                 │        └────────┘ │             │
          ┌──────┴──────┐            │             │
          │seed_solutions│            │             │
          └─────────────┘            │             │
```

---

## Tables

### 1. Entity 레이어 (아티스트/그룹/브랜드)

#### `artists`
K-pop 아티스트 등 인물 엔티티.

| Column | Type | Note |
|--------|------|------|
| `id` | uuid PK | |
| `name_ko` | text | 한국어 이름 |
| `name_en` | text | 영어 이름 |
| `profile_image_url` | text | 프로필 이미지 |
| `primary_instagram_account_id` | uuid FK → instagram_accounts | 대표 IG 계정 |
| `metadata` | jsonb | 확장 필드 |
| `created_at` / `updated_at` | timestamptz | |

#### `groups`
K-pop 그룹 등 단체 엔티티. 구조는 `artists`와 동일.

| Column | Type | Note |
|--------|------|------|
| `id` | uuid PK | |
| `name_ko` / `name_en` | text | i18n 이름 |
| `profile_image_url` | text | |
| `primary_instagram_account_id` | uuid FK → instagram_accounts | |
| `metadata` | jsonb | |

#### `group_members`
Artist ↔ Group 다대다 관계 (조인 테이블).

| Column | Type | Note |
|--------|------|------|
| `artist_id` | uuid FK → artists | PK 일부 |
| `group_id` | uuid FK → groups | PK 일부 |
| `is_active` | boolean | 현재 활동 여부 (default: true) |
| `metadata` | jsonb | |

#### `brands`
브랜드 엔티티.

| Column | Type | Note |
|--------|------|------|
| `id` | uuid PK | |
| `name_ko` / `name_en` | text | |
| `logo_image_url` | text | 로고 이미지 |
| `primary_instagram_account_id` | uuid FK → instagram_accounts | |
| `metadata` | jsonb | |

---

### 2. Instagram 수집 레이어

#### `instagram_accounts`
ETL이 추적하는 Instagram 계정. 모든 엔티티(artist/group/brand)의 IG 연결 허브.

| Column | Type | Note |
|--------|------|------|
| `id` | uuid PK | |
| `username` | text NOT NULL | IG 유저네임 |
| `display_name` | text | 표시 이름 |
| `account_type` | enum | artist, group, brand, source, influencer, place, other |
| `entity_ig_role` | enum | primary, regional, secondary |
| `entity_region_code` | text | 지역 코드 (regional 계정용) |
| `artist_id` | uuid FK → artists | |
| `brand_id` | uuid FK → brands | |
| `bio` | text | 프로필 소개 |
| `profile_image_url` | text | |
| `name_ko` / `name_en` | text | i18n |
| `is_active` | boolean | 수집 활성 여부 |
| `needs_review` | boolean | 리뷰 필요 플래그 |
| `wikidata_id` | text | Wikidata 연동 |
| `wikidata_status` | text | |
| `metadata` | jsonb | |

#### `posts`
수집된 Instagram 게시물.

| Column | Type | Note |
|--------|------|------|
| `id` | uuid PK | |
| `account_id` | uuid FK → instagram_accounts | 작성 계정 |
| `caption_text` | text | 캡션 |
| `posted_at` | timestamptz NOT NULL | 게시 시각 |
| `tagged_account_ids` | uuid[] | 태그된 계정 ID 배열 |
| `created_at` | timestamptz | |

#### `images`
게시물의 이미지. Hash 기반 중복 제거.

| Column | Type | Note |
|--------|------|------|
| `id` | uuid PK | |
| `post_id` | uuid FK → posts | |
| `image_url` | text NOT NULL | 원본 이미지 URL |
| `image_hash` | text NOT NULL | 중복 제거용 해시 |
| `status` | text | 처리 상태 |
| `with_items` | boolean | 아이템 포함 여부 (default: false) |
| `created_at` | timestamptz | |

---

### 3. Seed 퍼블리싱 파이프라인

ETL에서 수집한 데이터를 큐레이션하여 앱에 퍼블리시하는 파이프라인.

```
seed_posts (큐레이션된 포스트)
  └─ seed_spots (아이템 위치 마킹)
       └─ seed_solutions (매칭된 상품)
  └─ seed_asset (아카이브된 이미지)
```

#### `seed_posts`
큐레이션된 포스트. ETL 원본에서 선별되어 앱에 퍼블리시될 대상.

| Column | Type | Note |
|--------|------|------|
| `id` | uuid PK | |
| `image_url` | text NOT NULL | 대표 이미지 |
| `status` | text | draft, ready, published, error 등 |
| `context` | text | 큐레이션 맥락/설명 |
| `artist_account_id` | uuid FK → instagram_accounts | 아티스트 계정 |
| `group_account_id` | uuid FK → instagram_accounts | 그룹 계정 |
| `source_post_id` | uuid FK → posts | 원본 ETL 포스트 |
| `source_image_id` | uuid FK → images | 원본 이미지 |
| `backend_post_id` | text | 앱 백엔드에 퍼블리시된 post ID |
| `publish_error` | text | 퍼블리시 실패 시 에러 |
| `media_source` | jsonb | 미디어 출처 메타 |
| `metadata` | jsonb | |

#### `seed_spots`
Seed post 이미지 위의 아이템 위치 (핀/마커).

| Column | Type | Note |
|--------|------|------|
| `id` | uuid PK | |
| `seed_post_id` | uuid FK → seed_posts | |
| `position_left` | text | CSS left % |
| `position_top` | text | CSS top % |
| `request_order` | int NOT NULL | 표시 순서 |
| `subcategory_code` | text | 아이템 카테고리 |
| `status` | text | |
| `backend_spot_id` | text | 퍼블리시된 spot ID |
| `publish_error` | text | |

#### `seed_solutions`
Spot에 매칭된 상품 정보.

| Column | Type | Note |
|--------|------|------|
| `id` | uuid PK | |
| `seed_spot_id` | uuid FK → seed_spots | |
| `product_name` | text | 상품명 |
| `brand` | text | 브랜드명 |
| `description` | text | 설명 |
| `original_url` | text | 상품 URL |
| `price_amount` | numeric | 가격 |
| `price_currency` | text | 통화 |
| `status` | text | |
| `backend_solution_id` | text | 퍼블리시된 solution ID |
| `publish_error` | text | |
| `metadata` | jsonb | |

#### `seed_asset`
Seed post의 아카이브된 이미지 에셋.

| Column | Type | Note |
|--------|------|------|
| `id` | uuid PK | |
| `seed_post_id` | uuid FK → seed_posts | |
| `image_hash` | text NOT NULL | 해시 |
| `source_url` | text | 원본 URL |
| `source_domain` | text | 출처 도메인 |
| `archived_url` | text | 아카이브된 URL |
| `metadata` | jsonb | |

---

## Enums

| Enum | Values |
|------|--------|
| `account_type` | `artist`, `group`, `brand`, `source`, `influencer`, `place`, `other` |
| `entity_ig_role` | `primary`, `regional`, `secondary` |

---

## Data Flow

```
1. ETL 수집
   Instagram → instagram_accounts + posts + images

2. 엔티티 매핑
   instagram_accounts ↔ artists / groups / brands

3. Seed 큐레이션
   images (with_items=true) → seed_posts 선별

4. 아이템 어노테이션
   seed_posts → seed_spots (위치 마킹) → seed_solutions (상품 매칭)

5. 퍼블리시
   seed_posts.status → published → backend_post_id 기록
```

---

## Data Volume (2026-04-02 기준)

| Table | Rows | Note |
|-------|------|------|
| `artists` | 67 | K-pop 아티스트 |
| `brands` | 395 | 패션 브랜드 |
| `groups` | 39 | K-pop 그룹 |
| `group_members` | 48 | Artist↔Group 매핑 |
| `instagram_accounts` | 618 | brand 419, artist 130, group 40, other 15, place 6, influencer 5, source 3 |
| `posts` | 849 | 수집된 IG 게시물 |
| `images` | 2,542 | pending 1,651 / skipped 647 / extracted 233 (with_items=true) / pending+items 10 |
| `seed_posts` | 244 | **draft 243**, failed 1 — published 0 |
| `seed_spots` | **0** | 아직 어노테이션 없음 |
| `seed_solutions` | **0** | 아직 상품 매칭 없음 |
| `seed_asset` | 244 | 아카이브 이미지 |

### 데이터 상태 요약

- **Entity 레이어**: 충분한 데이터 (artists 67, brands 395, groups 39)
- **Instagram 수집**: 활발 (618 계정, 849 포스트, 2,542 이미지)
- **Seed 파이프라인**: **초기 단계** — seed_posts 244개 모두 draft, spots/solutions 비어있음
- **즉시 활용 가능**: artists, brands, groups, instagram_accounts (Entity 데이터)
- **아직 미완성**: seed 퍼블리싱 파이프라인 (spots/solutions 비어있어 앱 연동 불가)

---

## App 활용 가능 데이터

| 데이터 | 테이블 | Rows | 활용 아이디어 | 상태 |
|--------|--------|------|--------------|------|
| 아티스트/그룹 목록 | `artists`, `groups` | 67/39 | 아티스트 브라우징, 필터, 프로필 | **Ready** |
| 브랜드 목록 | `brands` | 395 | 브랜드 디렉토리, 필터 | **Ready** |
| IG 계정 정보 | `instagram_accounts` | 618 | 소셜 링크, 프로필 이미지 | **Ready** |
| 수집된 이미지 | `images` (extracted) | 233 | 갤러리, AI 분석 원본 | **Ready** |
| 수집된 포스트 | `posts` | 849 | 타임라인 | **Ready** |
| 큐레이션 포스트 | `seed_posts` | 244 | 피드 콘텐츠 | Draft only |
| 아이템 스팟 | `seed_spots` | 0 | 이미지 위 아이템 마커 | Empty |
| 상품 매칭 | `seed_solutions` | 0 | "이 아이템 찾기" | Empty |

---

## RLS 상태

> 모든 warehouse 테이블: RLS ON + **"Allow public read" (SELECT)** 정책 적용 (2026-04-02)

| Table | RLS | Read Policy | Write |
|-------|-----|-------------|-------|
| artists | ON | Public read | 없음 (차단) |
| brands | ON | Public read | 없음 (차단) |
| groups | ON | Public read | 없음 (차단) |
| group_members | ON | Public read | 없음 (차단) |
| instagram_accounts | ON | Public read | 없음 (차단) |
| posts | ON | Public read | 없음 (차단) |
| images | ON | Public read | 없음 (차단) |
| seed_posts | ON | Public read | 없음 (차단) |
| seed_spots | ON | Public read | 없음 (차단) |
| seed_solutions | ON | Public read | 없음 (차단) |
| seed_asset | ON | Public read | 없음 (차단) |

- anon key로 **SELECT 가능**, INSERT/UPDATE/DELETE는 차단
- 쓰기가 필요하면 별도 정책 추가 또는 service_role key 사용 (Server-side only)

---

## App 스키마 FK 컬럼 (warehouse 참조)

PR #69 / SeaORM migration `m20260402_000001_add_warehouse_fk_posts_solutions`에서 추가됨.  
`public` 스키마(앱 데이터)의 테이블에 warehouse 엔티티 FK를 연결한다.

### `public.posts` 추가 컬럼

| Column | Type | Constraint | Note |
|--------|------|------------|------|
| `artist_id` | uuid | nullable, FK → `warehouse.artists.id` ON DELETE SET NULL | `artist_name`에서 이름 매칭으로 백필됨 |
| `group_id` | uuid | nullable, FK → `warehouse.groups.id` ON DELETE SET NULL | `group_name`에서 이름 매칭으로 백필됨 |

인덱스: `idx_posts_artist_id`, `idx_posts_group_id`

### `public.solutions` 추가 컬럼

| Column | Type | Constraint | Note |
|--------|------|------------|------|
| `brand_id` | uuid | nullable, FK → `warehouse.brands.id` ON DELETE SET NULL | `metadata.brand` 또는 `title` prefix 매칭으로 백필됨 |
| `price_amount` | numeric(12,2) | nullable | 상품 가격 (2026-04-04 추가) |
| `price_currency` | varchar(10) | nullable, DEFAULT 'KRW' | 통화 코드 (2026-04-04 추가) |

인덱스: `idx_solutions_brand_id`

### 백필 전략

- `posts.artist_id`: `artist_name` → `warehouse.artists.name_ko / name_en` (unaccent + lower 정규화, 고유 매칭만)
- `posts.group_id`: `group_name` → `warehouse.groups.name_ko / name_en` (동일 방식)
- `solutions.brand_id`: `metadata->>'brand'` 값 우선, 없으면 `title` prefix로 `warehouse.brands` 매칭

---

## Type Aliases

`warehouse-types.ts`에서 export하는 편의 타입:

```ts
import type {
  ArtistRow,
  BrandRow,
  GroupRow,
  GroupMemberRow,
  InstagramAccountRow,
  WarehousePostRow,
  WarehouseImageRow,
  SeedPostRow,
  SeedSpotRow,
  SeedSolutionRow,
  SeedAssetRow,
  AccountType,
  EntityIgRole,
} from "@/lib/supabase/warehouse-types";
```
