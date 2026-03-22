# API 공통 스키마

> 이 문서는 DECODED API에서 공통으로 사용되는 스키마(타입)를 정의합니다.

---

## 목차

1. [공통 타입](#공통-타입)
2. [페이지네이션](#페이지네이션)
3. [에러 응답](#에러-응답)
4. [사용자 관련](#사용자-관련)
5. [Post 관련](#post-관련)
6. [Spot 관련](#spot-관련)
7. [Solution 관련](#solution-관련)
8. [카테고리 관련](#카테고리-관련)
9. [미디어 소스](#미디어-소스)
10. [가격 정보](#가격-정보)
11. [투표 관련](#투표-관련)
12. [뱃지 관련](#뱃지-관련)
13. [랭킹 관련](#랭킹-관련)

---

## 공통 타입

### 기본 타입

| 타입 | 형식 | 설명 | 예시 |
|------|------|------|------|
| `uuid` | UUID v4 | 고유 식별자 | `"550e8400-e29b-41d4-a716-446655440000"` |
| `datetime` | ISO 8601 | 날짜시간 | `"2025-01-15T12:00:00Z"` |
| `url` | URL 문자열 | 유효한 URL | `"https://example.com/image.jpg"` |

---

## 페이지네이션

### PaginationMeta

페이지네이션 메타데이터

```typescript
interface PaginationMeta {
  current_page: number;   // 현재 페이지 번호
  per_page: number;       // 페이지당 아이템 수
  total_items: number;    // 총 아이템 수
  total_pages: number;    // 총 페이지 수
}
```

### PaginatedResponse<T>

페이지네이션이 적용된 응답

```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}
```

---

## 에러 응답

### ErrorResponse

```typescript
interface ErrorResponse {
  error: {
    code: number;      // HTTP 상태 코드
    message: string;   // 에러 메시지
  };
}
```

### 공통 에러 코드

| 코드 | 설명 |
|------|------|
| `400` | 잘못된 요청 |
| `401` | 인증 필요 |
| `403` | 권한 부족 |
| `404` | 리소스 없음 |
| `500` | 서버 오류 |

---

## 사용자 관련

### UserResponse

사용자 전체 정보

```typescript
interface UserResponse {
  id: string;              // UUID
  username: string;        // 사용자명
  display_name?: string;   // 표시 이름
  avatar_url?: string;     // 아바타 URL
  bio?: string;            // 자기소개
  rank: string;            // 사용자 등급
  created_at: string;      // 가입일시
}
```

### PostUserInfo

Post에 포함된 간소화된 사용자 정보

```typescript
interface PostUserInfo {
  id: string;              // UUID
  username: string;        // 사용자명
  avatar_url?: string;     // 아바타 URL
  rank: string;            // 사용자 등급
}
```

### CommentUser

댓글 작성자 정보

```typescript
interface CommentUser {
  id: string;              // UUID
  username: string;        // 사용자명
  display_name?: string;   // 표시 이름
  avatar_url?: string;     // 아바타 URL
  rank: string;            // 사용자 등급
}
```

### UserActivityType

사용자 활동 타입

```typescript
type UserActivityType = 'post' | 'spot' | 'solution';
```

### UserStatsResponse

사용자 활동 통계

```typescript
interface UserStatsResponse {
  post_count: number;
  spot_count: number;
  solution_count: number;
  adopted_count: number;
  verified_count: number;
  total_points: number;
}
```

---

## Post 관련

### PostListItem

Post 목록 아이템 (간소화)

```typescript
interface PostListItem {
  id: string;                    // UUID
  user: PostUserInfo;            // 사용자 정보
  image_url: string;             // 이미지 URL
  media_source: MediaSourceDto;  // 미디어 소스 정보
  artist_name?: string;          // 아티스트명
  group_name?: string;           // 그룹명
  context?: string;              // 상황 정보
  spot_count: number;            // Spot 개수
  view_count: number;            // 조회수
  comment_count: number;         // 댓글 수
  created_at: string;            // 생성일시
}
```

### PostResponse

Post 상세 정보

```typescript
interface PostResponse {
  id: string;                    // UUID
  user_id: string;               // 작성자 UUID
  image_url: string;             // 이미지 URL
  media_source: MediaSourceDto;  // 미디어 소스 정보
  artist_name?: string;          // 아티스트명
  group_name?: string;           // 그룹명
  context?: string;              // 상황 정보
  view_count: number;            // 조회수
  status: string;                // 상태 (active, hidden, deleted)
  created_at: string;            // 생성일시
}
```

### CreatePostDto

Post 생성 요청

```typescript
interface CreatePostDto {
  image_url: string;             // 이미지 URL (필수)
  media_source: MediaSourceDto;  // 미디어 소스 정보 (필수)
  spots: CreateSpotDto[];        // Spots (최소 1개 필수)
  artist_name?: string;          // 아티스트명
  group_name?: string;           // 그룹명
  context?: string;              // 상황 정보
}
```

### UpdatePostDto

Post 수정 요청

```typescript
interface UpdatePostDto {
  artist_name?: string;
  group_name?: string;
  context?: string;
  media_source?: MediaSourceDto;
  status?: string;
}
```

---

## Spot 관련

### SpotListItem

Spot 목록 아이템 (간소화)

```typescript
interface SpotListItem {
  id: string;                    // UUID
  position_left: string;         // 위치 좌표 (왼쪽, %)
  position_top: string;          // 위치 좌표 (위, %)
  category: CategoryResponse;    // 카테고리 정보
  status: string;                // 상태
  created_at: string;            // 생성일시
}
```

### SpotResponse

Spot 상세 정보

```typescript
interface SpotResponse {
  id: string;                    // UUID
  post_id: string;               // Post UUID
  user_id: string;               // 작성자 UUID
  position_left: string;         // 위치 좌표 (왼쪽, %)
  position_top: string;          // 위치 좌표 (위, %)
  category: CategoryResponse;    // 카테고리 정보
  status: string;                // 상태
  created_at: string;            // 생성일시
}
```

### CreateSpotDto

Spot 생성 요청

```typescript
interface CreateSpotDto {
  position_left: string;         // 위치 좌표 (왼쪽, %) - 필수
  position_top: string;          // 위치 좌표 (위, %) - 필수
  category_id: string;           // 카테고리 UUID - 필수
}
```

### UpdateSpotDto

Spot 수정 요청

```typescript
interface UpdateSpotDto {
  position_left?: string;
  position_top?: string;
  category_id?: string;
  status?: string;
}
```

---

## Solution 관련

### SolutionListItem

Solution 목록 아이템 (간소화)

```typescript
interface SolutionListItem {
  id: string;                    // UUID
  user: UserResponse;            // 사용자 정보
  product_name: string;          // 상품명
  brand?: string;                // 브랜드명
  price?: PriceDto;              // 가격 정보
  thumbnail_url?: string;        // 썸네일 URL
  vote_stats: VoteStatsDto;      // 투표 통계
  is_verified: boolean;          // 검증 여부
  is_adopted: boolean;           // 채택 여부
  match_type?: string;           // 매치 타입 (perfect | close)
  created_at: string;            // 생성일시
}
```

### SolutionResponse

Solution 상세 정보

```typescript
interface SolutionResponse {
  id: string;                    // UUID
  spot_id: string;               // Spot UUID
  user: UserResponse;            // 사용자 정보
  product_name: string;          // 상품명
  brand?: string;                // 브랜드명
  description?: string;          // 상품 설명
  price?: PriceDto;              // 가격 정보
  original_url?: string;         // 원본 URL
  affiliate_url?: string;        // 제휴 링크 URL
  thumbnail_url?: string;        // 썸네일 URL
  vote_stats: VoteStatsDto;      // 투표 통계
  is_verified: boolean;          // 검증 여부
  is_adopted: boolean;           // 채택 여부
  match_type?: string;           // 매치 타입
  click_count: number;           // 클릭 수
  purchase_count: number;        // 구매 수
  adopted_at?: string;           // 채택 일시
  created_at: string;            // 생성일시
}
```

### CreateSolutionDto

Solution 생성 요청

```typescript
interface CreateSolutionDto {
  original_url: string;          // 원본 상품 URL - 필수
  product_name?: string;         // 상품명 (메타데이터에서 자동 추출)
  brand?: string;                // 브랜드명 (메타데이터에서 자동 추출)
  description?: string;          // 상품 설명
  price?: PriceDto;              // 가격 정보 (메타데이터에서 자동 추출)
}
```

### UpdateSolutionDto

Solution 수정 요청

```typescript
interface UpdateSolutionDto {
  product_name?: string;
  brand?: string;
  description?: string;
  price?: PriceDto;
}
```

---

## 카테고리 관련

### CategoryResponse

카테고리 정보

```typescript
interface CategoryResponse {
  id: string;                    // UUID
  code: string;                  // 코드 (fashion, living, tech, beauty)
  name: CategoryName;            // 다국어 이름
  description?: CategoryDescription;  // 다국어 설명
  icon_url?: string;             // 아이콘 URL
  color_hex?: string;            // 색상 (예: #FF5733)
  display_order: number;         // 표시 순서
  is_active: boolean;            // 활성화 여부
}
```

### CategoryName

다국어 카테고리명

```typescript
interface CategoryName {
  ko: string;      // 한국어 (필수)
  en: string;      // 영어 (필수)
  ja?: string;     // 일본어
}
```

### CategoryDescription

다국어 카테고리 설명

```typescript
interface CategoryDescription {
  ko?: string;     // 한국어
  en?: string;     // 영어
  ja?: string;     // 일본어
}
```

---

## 미디어 소스

### MediaSourceDto

미디어 소스 정보

```typescript
interface MediaSourceDto {
  type: string;       // 미디어 타입 (drama, movie, mv, youtube, variety)
  title: string;      // 미디어 제목
  platform?: string;  // 플랫폼
  year?: number;      // 연도
  season?: number;    // 시즌 (드라마용)
  episode?: number;   // 에피소드 (드라마/예능용)
  timestamp?: string; // 타임스탬프
}
```

### 미디어 타입

| 타입 | 설명 |
|------|------|
| `drama` | 드라마 |
| `movie` | 영화 |
| `mv` | 뮤직비디오 |
| `youtube` | 유튜브 |
| `variety` | 예능 |

---

## 가격 정보

### PriceDto

가격 정보

```typescript
interface PriceDto {
  amount: number;     // 가격 금액
  currency: string;   // 통화 코드 (KRW, USD 등)
}
```

---

## 투표 관련

### VoteType

투표 타입

```typescript
type VoteType = 'accurate' | 'different';
```

| 타입 | 설명 |
|------|------|
| `accurate` | 정확함 (동일 상품) |
| `different` | 다름 |

### VoteStatsDto

투표 통계

```typescript
interface VoteStatsDto {
  accurate_count: number;   // 정확함 투표 수
  different_count: number;  // 다름 투표 수
  total_count: number;      // 총 투표 수
}
```

### VoteStatsResponse

투표 현황 응답

```typescript
interface VoteStatsResponse {
  solution_id: string;
  accurate_count: number;
  different_count: number;
  total_count: number;
  my_vote?: VoteType;       // 내 투표 (인증된 경우)
}
```

### CreateVoteDto

투표 생성 요청

```typescript
interface CreateVoteDto {
  vote_type: VoteType;      // 투표 타입 (accurate | different)
}
```

### AdoptSolutionDto

채택 요청

```typescript
interface AdoptSolutionDto {
  match_type: string;       // 매치 타입 (perfect | close)
}
```

### AdoptResponse

채택 응답

```typescript
interface AdoptResponse {
  solution_id: string;
  is_adopted: boolean;
  match_type: string;
  adopted_at: string;
  updated_spot?: UpdatedSpotInfo;  // Perfect Match인 경우
}
```

---

## 뱃지 관련

### BadgeType

뱃지 타입

```typescript
type BadgeType =
  | 'specialist'   // 전문가
  | 'category'     // 카테고리별
  | 'achievement'  // 업적
  | 'milestone'    // 마일스톤
  | 'explorer'     // 탐험가
  | 'shopper';     // 쇼퍼
```

### BadgeRarity

뱃지 희귀도

```typescript
type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';
```

### BadgeCriteria

뱃지 획득 조건

```typescript
interface BadgeCriteria {
  type: string;       // 조건 타입
  threshold: number;  // 임계값
  target?: string;    // 대상 (아티스트명, 그룹명, 카테고리 등)
}
```

### BadgeResponse

뱃지 정보

```typescript
interface BadgeResponse {
  id: string;                    // UUID
  type: BadgeType;               // 뱃지 타입
  name: string;                  // 뱃지 이름
  description?: string;          // 설명
  icon_url?: string;             // 아이콘 URL
  criteria: BadgeCriteria;       // 획득 조건
  rarity: BadgeRarity;           // 희귀도
  created_at: string;            // 생성일시
}
```

### BadgeProgress

뱃지 진행도

```typescript
interface BadgeProgress {
  current: number;      // 현재 값
  threshold: number;    // 목표 값
  completed: boolean;   // 완료 여부
}
```

---

## 랭킹 관련

### RankingUser

랭킹 사용자 정보

```typescript
interface RankingUser {
  id: string;
  username: string;
  avatar_url?: string;
  rank: string;
}
```

### RankingItem

랭킹 항목

```typescript
interface RankingItem {
  rank: number;                  // 순위
  user: RankingUser;             // 사용자 정보
  total_points: number;          // 총 포인트
  weekly_points: number;         // 주간 포인트
  solution_count: number;        // Solution 수
  adopted_count: number;         // 채택된 수
  verified_count: number;        // 검증된 수
}
```

### RankingListResponse

랭킹 목록 응답

```typescript
interface RankingListResponse {
  data: RankingItem[];
  pagination: PaginationMeta;
  my_ranking?: MyRanking;        // 내 랭킹 (인증된 경우)
}
```

---

## 검색 관련

### SearchResultItem

검색 결과 항목

```typescript
interface SearchResultItem {
  id: string;                    // Post UUID
  type: string;                  // 결과 타입 (post)
  image_url: string;             // 이미지 URL
  artist_name?: string;          // 아티스트명
  group_name?: string;           // 그룹명
  context?: string;              // 컨텍스트
  media_source?: MediaSource;    // 미디어 소스
  spot_count: number;            // Spot 개수
  view_count: number;            // 조회수
  highlight?: Record<string, string>;  // 검색어 하이라이트
}
```

### SearchResponse

검색 응답

```typescript
interface SearchResponse {
  data: SearchResultItem[];
  facets: Facets;                // 필터링 집계
  pagination: PaginationMeta;
  query: string;                 // 검색어
  took_ms: number;               // 검색 소요 시간 (ms)
}
```

### Facets

검색 필터 집계

```typescript
interface Facets {
  category?: Record<string, number>;    // 카테고리별 개수
  media_type?: Record<string, number>;  // 미디어 타입별 개수
  context?: Record<string, number>;     // 컨텍스트별 개수
}
```

---

## 변경 이력

- **2025-01-15**: OpenAPI 3.1.0 스펙 기반 초기 문서 생성
