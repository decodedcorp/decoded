# 시스템 & 백엔드

> 기능: S-01 ~ S-08
> 상태: 7% 구현됨 (기본 테이블만 존재)
> 의존성: 인프라 설정

---

## 개요

시스템 기능은 AI 처리, 데이터 스크래핑, 링크 생성, 리워드 계산, 게이미피케이션을 포함한 백엔드 인프라를 담당합니다. 이러한 기능들은 주로 사용자 대면 기능을 지원하는 서버 측 컴포넌트입니다.

### 현재 구현 상태 (2026-01-15 점검)
- ✅ 기본 테이블 존재: `image`, `item`, `post`, `post_image`
- ❌ API 엔드포인트: 전무
- ❌ Edge Functions: 미구현
- ❌ Cron 작업: 미구현
- ❌ 스크래퍼/어필리에이트/리워드 시스템: 미시작

### 기능별 구현 현황
| 기능 | 완성도 | 상태 |
|------|--------|------|
| S-01 Vision API | 15% | 테이블만 존재 |
| S-02 스크래퍼 | 0% | 미시작 |
| S-03 Deep Link | 0% | 미시작 |
| S-04 DB 관계 | 40% | 기본 테이블만 |
| S-05 클릭 트래커 | 0% | 미시작 |
| S-06 리워드 배치 | 0% | 미시작 |
| S-07 뱃지 시스템 | 0% | 미시작 |
| S-08 랭킹 | 0% | 미시작 |

---

## 기능 목록

### S-01 Vision API 모듈

- **설명**: 아이템 감지를 위한 이미지 분석 및 라벨링 서비스
- **우선순위**: P0 (내부)
- **상태**: 부분 (백엔드 파이프라인 존재)
- **의존성**: Cloud Vision API 또는 커스텀 모델

#### 수락 기준
- [ ] 이미지 URL 또는 base64 입력 수용
- [ ] 감지된 객체와 바운딩 박스 반환
- [ ] 각 객체의 카테고리 분류 반환
- [ ] 신뢰도 점수 반환
- [ ] 배치 처리 지원
- [ ] 응답 시간 < 5초
- [ ] 다양한 이미지 크기 및 포맷 처리
- [ ] 지원되지 않는 이미지에 대한 에러 처리

#### 기술 명세

**API 계약**:
```typescript
// POST /api/ai/detect
interface DetectionRequest {
  imageUrl?: string;
  imageBase64?: string;
  options?: {
    minConfidence?: number;  // Default: 0.7
    maxDetections?: number;  // Default: 10
    categories?: ItemCategory[];  // Filter to specific categories
  };
}

interface DetectionResponse {
  success: boolean;
  detections: Array<{
    id: string;
    bbox: {
      x: number;      // 0-1 normalized
      y: number;      // 0-1 normalized
      width: number;  // 0-1 normalized
      height: number; // 0-1 normalized
    };
    category: ItemCategory;
    confidence: number;
    attributes?: {
      color?: string;
      pattern?: string;
      style?: string;
    };
  }>;
  processingTime: number;
  error?: string;
}
```

**처리 파이프라인**:
```
이미지 입력
    ↓
[전처리]
- 너무 크면 리사이즈 (max 2048px)
- 포맷 정규화 (JPEG)
- 썸네일 생성
    ↓
[객체 감지]
- 패션 아이템 감지 모델
- 바운딩 박스 추출
    ↓
[분류]
- 카테고리 분류
- 속성 추출 (색상, 패턴)
    ↓
[후처리]
- Non-max suppression
- 신뢰도 필터링
- 좌표 정규화
    ↓
감지 결과
```

#### 구현 옵션

**옵션 A: Google Cloud Vision + 커스텀 모델**
```typescript
// lib/ai/visionApi.ts
import vision from '@google-cloud/vision';

async function detectFashionItems(imageUrl: string): Promise<DetectionResponse> {
  const client = new vision.ImageAnnotatorClient();

  // Object detection
  const [objectResult] = await client.objectLocalization(imageUrl);

  // Filter to fashion items
  const fashionItems = objectResult.localizedObjectAnnotations
    .filter(obj => FASHION_CATEGORIES.includes(obj.name))
    .map(obj => ({
      id: generateId(),
      bbox: normalizeVertices(obj.boundingPoly.normalizedVertices),
      category: mapToCategory(obj.name),
      confidence: obj.score,
    }));

  return { success: true, detections: fashionItems };
}
```

**옵션 B: 커스텀 TensorFlow 모델**
```typescript
// lib/ai/customModel.ts
import * as tf from '@tensorflow/tfjs-node';

const MODEL_PATH = 'gs://decoded-models/fashion-detection/v1';
let model: tf.GraphModel;

async function loadModel() {
  if (!model) {
    model = await tf.loadGraphModel(MODEL_PATH);
  }
  return model;
}

async function detectFashionItems(imageBuffer: Buffer): Promise<DetectionResponse> {
  const model = await loadModel();
  const tensor = tf.node.decodeImage(imageBuffer, 3);
  const predictions = await model.predict(tensor);
  // Process predictions...
}
```

#### 생성/수정할 파일
- `lib/ai/visionApi.ts`
- `lib/ai/detection.ts`
- `lib/ai/classification.ts`
- `app/api/ai/detect/route.ts`

---

### S-02 스크래퍼 엔진

- **설명**: 쇼핑 사이트 URL에서 상품 메타데이터 파싱
- **우선순위**: P0 (내부)
- **상태**: 미시작
- **의존성**: 없음

#### 수락 기준
- [ ] 쇼핑 URL 입력 수용
- [ ] 추출: 상품명, 브랜드, 가격, 통화, 이미지
- [ ] 10개 이상의 주요 쇼핑 사이트 지원
- [ ] JavaScript 렌더링 페이지 처리
- [ ] robots.txt 준수
- [ ] 도메인별 Rate limiting
- [ ] 반복 URL에 대한 캐싱
- [ ] 실패 시 Graceful degradation

#### 기술 명세

**API 계약**:
```typescript
// POST /api/scrape
interface ScrapeRequest {
  url: string;
  forceRefresh?: boolean;
}

interface ScrapeResponse {
  success: boolean;
  data?: {
    productName: string;
    brand: string;
    price: number;
    currency: string;
    imageUrl: string;
    description?: string;
    originalUrl: string;
    scrapedAt: Date;
  };
  error?: string;
  cached?: boolean;
}
```

**사이트 설정**:
```typescript
// lib/scraper/sites/musinsa.ts
const musinsaConfig: SiteConfig = {
  domain: 'musinsa.com',
  selectors: {
    productName: '.product_title',
    brand: '.product_article_contents a',
    price: '.product_article_price .price',
    image: '.product_img img',
  },
  priceParser: (text) => parseInt(text.replace(/[^0-9]/g, '')),
  currency: 'KRW',
};

// lib/scraper/sites/index.ts
const siteConfigs: Record<string, SiteConfig> = {
  'musinsa.com': musinsaConfig,
  '29cm.co.kr': cm29Config,
  'farfetch.com': farfetchConfig,
  // ...
};
```

**스크래퍼 구현**:
```typescript
// lib/scraper/index.ts
import puppeteer from 'puppeteer';

async function scrapeUrl(url: string): Promise<ScrapeResponse> {
  // Check cache first
  const cached = await checkCache(url);
  if (cached) return { success: true, data: cached, cached: true };

  // Get site config
  const domain = new URL(url).hostname.replace('www.', '');
  const config = siteConfigs[domain];

  if (!config) {
    return { success: false, error: 'Unsupported site' };
  }

  // Check robots.txt
  if (!await canScrape(url)) {
    return { success: false, error: 'Blocked by robots.txt' };
  }

  // Rate limit
  await rateLimiter.wait(domain);

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });

    const data = {
      productName: await page.$eval(config.selectors.productName, el => el.textContent),
      brand: await page.$eval(config.selectors.brand, el => el.textContent),
      price: config.priceParser(await page.$eval(config.selectors.price, el => el.textContent)),
      currency: config.currency,
      imageUrl: await page.$eval(config.selectors.image, el => el.src),
      originalUrl: url,
      scrapedAt: new Date(),
    };

    await browser.close();

    // Cache result
    await setCache(url, data);

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

#### 지원 사이트

| 사이트 | 지역 | 상태 |
|------|--------|--------|
| Musinsa | 한국 | 계획됨 |
| 29CM | 한국 | 계획됨 |
| W Concept | 한국 | 계획됨 |
| SSF Shop | 한국 | 계획됨 |
| Coupang | 한국 | 계획됨 |
| Farfetch | 글로벌 | 계획됨 |
| SSENSE | 글로벌 | 계획됨 |
| Net-a-Porter | 글로벌 | 계획됨 |
| Shopbop | 글로벌 | 계획됨 |
| Amazon | 글로벌 | 계획됨 |

#### 생성/수정할 파일
- `lib/scraper/index.ts`
- `lib/scraper/sites/*.ts` - 사이트별 설정
- `lib/scraper/cache.ts`
- `lib/scraper/rateLimiter.ts`
- `app/api/scrape/route.ts`

---

### S-03 Deep Link 생성기

- **설명**: 쇼핑 URL을 어필리에이트 추적 링크로 변환
- **우선순위**: P0 (내부)
- **상태**: 미시작
- **의존성**: 어필리에이트 네트워크 파트너십

#### 수락 기준
- [ ] 직접 URL을 어필리에이트 URL로 변환
- [ ] 다중 어필리에이트 네트워크 지원
- [ ] 클릭 귀속 추적 (사용자, 아이템)
- [ ] 단축 URL 생성
- [ ] 만료/무효 어필리에이트 링크 처리
- [ ] 어필리에이트 불가 시 직접 링크로 Fallback

#### 기술 명세

**API 계약**:
```typescript
interface GenerateLinkRequest {
  originalUrl: string;
  itemId: string;
  userId?: string;
  campaign?: string;
}

interface GenerateLinkResponse {
  trackedUrl: string;
  shortUrl: string;
  affiliateNetwork?: string;
  expiresAt?: Date;
}
```

**어필리에이트 네트워크 통합**:
```typescript
// lib/affiliate/networks/index.ts
interface AffiliateNetwork {
  name: string;
  supportedDomains: string[];
  generateLink: (url: string, params: TrackingParams) => string;
}

const networks: AffiliateNetwork[] = [
  {
    name: 'linkprice',
    supportedDomains: ['musinsa.com', '29cm.co.kr'],
    generateLink: (url, params) => {
      return `https://click.linkprice.com/click.php?m=decoded&a=${params.itemId}&p=${encodeURIComponent(url)}`;
    },
  },
  // ... more networks
];
```

#### 생성/수정할 파일
- `lib/affiliate/index.ts`
- `lib/affiliate/networks/*.ts`
- `lib/affiliate/shortener.ts`
- `app/api/links/generate/route.ts`

---

### S-04 계층적 DB 관리

- **설명**: Category-Media-Cast-Item 관계 유지
- **우선순위**: P0 (내부)
- **상태**: 부분 (기본 테이블 존재)
- **의존성**: 데이터베이스 설정

#### 수락 기준
- [ ] Category 테이블과 enum 타입
- [ ] Media 테이블과 category FK
- [ ] Cast 테이블과 media junction
- [ ] Context 타입 enum
- [ ] Post 메타데이터 컬럼 (media_id, context_type)
- [ ] Post-Cast junction 테이블
- [ ] 계층적 필터링을 위한 효율적 쿼리
- [ ] 필터 카운트를 위한 Materialized views

#### 데이터베이스 스키마

전체 스키마는 [data-models.md](./data-models.md) 참조.

**주요 관계**:
```
Category (enum)
    ↓ 1:N
Media
    ↓ N:M (media_cast)
Cast
    ↓ N:M (post_cast)
Post
    ↓ 1:N (post_image)
Image
    ↓ 1:N
Item
```

**Materialized Views**:
```sql
-- 카테고리별 필터 카운트
CREATE MATERIALIZED VIEW filter_counts_category AS
SELECT
  m.category,
  COUNT(DISTINCT p.id) as post_count,
  COUNT(DISTINCT i.id) as item_count
FROM media m
JOIN post p ON p.media_id = m.id
JOIN post_image pi ON pi.post_id = p.id
JOIN image img ON img.id = pi.image_id
JOIN item i ON i.image_id = img.id
GROUP BY m.category;

-- 주기적 갱신
CREATE OR REPLACE FUNCTION refresh_filter_counts()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW filter_counts_category;
  REFRESH MATERIALIZED VIEW filter_counts_media;
  REFRESH MATERIALIZED VIEW filter_counts_cast;
END;
$$ LANGUAGE plpgsql;
```

#### 생성/수정할 파일
- `lib/supabase/migrations/xxx_hierarchical_structure.sql`
- `lib/supabase/views/filter_counts.sql`
- `lib/supabase/functions/refresh_counts.sql`

---

### S-05 클릭 트래커

- **설명**: 어필리에이트 링크 클릭 로깅 및 분석
- **우선순위**: P1 (내부)
- **상태**: 미시작
- **의존성**: S-03 (Deep Link 생성기)

#### 수락 기준
- [ ] 모든 어필리에이트 링크 클릭 로깅
- [ ] 추적: 사용자, 아이템, 타임스탬프, 출처
- [ ] 봇/사기 클릭 감지 및 필터링
- [ ] 실시간 클릭 카운팅
- [ ] 기여자 귀속
- [ ] 전환 추적 웹훅

#### 기술 명세

**클릭 이벤트 스키마**:
```typescript
interface ClickEvent {
  id: string;
  itemId: string;
  userId?: string;
  sessionId: string;
  ipHash: string;
  userAgent: string;
  referrer?: string;
  sourcePostId?: string;
  clickedAt: Date;
  affiliateNetwork?: string;
  isConverted: boolean;
  convertedAt?: Date;
  orderValue?: number;
}
```

**클릭 흐름**:
```
사용자가 "구매" 버튼 클릭
    ↓
클라이언트가 /api/track/click 호출
    ↓
서버가 클릭 이벤트 로깅
    ↓
서버가 추적 리다이렉트 URL 생성
    ↓
클라이언트가 어필리에이트 링크로 리다이렉트
    ↓
[이후] 어필리에이트가 전환 웹훅 전송
    ↓
서버가 전환 데이터로 클릭 업데이트
```

**사기 감지**:
```typescript
// lib/tracking/fraudDetection.ts
interface FraudSignals {
  rapidClicks: boolean;        // 1분에 5회 이상 클릭
  knownBotUserAgent: boolean;
  suspiciousIpPattern: boolean;
  noReferrer: boolean;
  headlessBrowser: boolean;
}

async function isLikelyFraud(click: ClickEvent): Promise<boolean> {
  const signals = await checkFraudSignals(click);
  const fraudScore = calculateFraudScore(signals);
  return fraudScore > 0.7;
}
```

#### API 엔드포인트
```
POST /api/track/click
  body: { itemId, sourcePostId }
  response: { redirectUrl }

POST /api/webhooks/affiliate
  body: { clickId, orderValue, commission }
```

#### 생성/수정할 파일
- `lib/tracking/clickTracker.ts`
- `lib/tracking/fraudDetection.ts`
- `app/api/track/click/route.ts`
- `app/api/webhooks/affiliate/route.ts`

---

### S-06 리워드 배치

- **설명**: 기여자에게 수익 계산 및 분배
- **우선순위**: P2 (내부)
- **상태**: 미시작
- **의존성**: S-05 (클릭 트래커), U-01 (사용자 시스템)

#### 수락 기준
- [ ] 리워드 계산을 위한 일일 배치 작업
- [ ] 수익 분배 규칙 (예: 70%를 기여자에게)
- [ ] 최소 지급 임계값
- [ ] 전환에 대한 보류 기간 (예: 30일)
- [ ] 환불/차지백 처리
- [ ] 모든 계산에 대한 감사 추적

#### 기술 명세

**리워드 계산**:
```typescript
// lib/rewards/calculator.ts
interface RewardConfig {
  contributorShare: number;    // 0.7 (70%)
  minimumPayout: number;       // 10000 (₩10,000)
  pendingDays: number;         // 30
}

async function calculateDailyRewards(date: Date) {
  // (date - pendingDays)의 모든 전환 가져오기
  const conversions = await getConfirmedConversions(
    subDays(date, config.pendingDays)
  );

  for (const conversion of conversions) {
    // 기여자 찾기 (아이템 업로더)
    const contributor = await getItemContributor(conversion.itemId);

    // 분배 계산
    const reward = {
      userId: contributor.id,
      type: 'conversion',
      amount: conversion.commission * config.contributorShare,
      itemId: conversion.itemId,
      clickId: conversion.clickId,
      status: 'confirmed',
    };

    await createReward(reward);
    await updateUserEarnings(contributor.id, reward.amount);
  }
}
```

**배치 작업 스케줄**:
```typescript
// 매일 KST 오전 3시에 실행
const CRON_SCHEDULE = '0 3 * * *';

// lib/rewards/batch.ts
async function runDailyRewardBatch() {
  const date = new Date();

  logger.info('Starting reward batch', { date });

  try {
    await calculateDailyRewards(date);
    await updateRankings(date);
    await sendRewardNotifications();

    logger.info('Reward batch completed');
  } catch (error) {
    logger.error('Reward batch failed', { error });
    await alertOps(error);
  }
}
```

#### 생성/수정할 파일
- `lib/rewards/calculator.ts`
- `lib/rewards/batch.ts`
- `lib/rewards/notifications.ts`
- `app/api/cron/rewards/route.ts` (Vercel Cron)

---

### S-07 컨텍스트 기반 뱃지 시스템

- **설명**: 특정 태그에 대한 기여를 기반으로 사용자에게 뱃지 수여
- **우선순위**: P1 (내부)
- **상태**: 미시작
- **의존성**: S-06 (리워드 배치), 기여 추적

#### 수락 기준
- [ ] 태그별 뱃지 기준 정의
- [ ] 태그별 사용자 기여 추적
- [ ] 기준 충족 시 뱃지 수여
- [ ] 뱃지 유형: Expert, Master, Pioneer
- [ ] 주간/월간 재계산
- [ ] 프로필에 뱃지 표시
- [ ] 뱃지 획득 시 알림

#### 기술 명세

**뱃지 기준**:
```typescript
interface BadgeCriteria {
  type: 'expert' | 'master' | 'pioneer';
  targetType: 'media' | 'cast' | 'category';
  targetId?: string;

  rules: {
    minContributions: number;     // 최소 게시물/답변
    minAcceptRate?: number;       // 최소 정확도 (0-1)
    timeWindow?: 'weekly' | 'monthly' | 'allTime';
    rankPosition?: number;        // 상위 N위
  };
}

// 예시 뱃지
const badgeDefinitions: BadgeCriteria[] = [
  {
    type: 'expert',
    targetType: 'cast',
    targetId: 'jennie-uuid',
    rules: {
      minContributions: 20,
      minAcceptRate: 0.8,
      timeWindow: 'allTime',
    },
    title: 'JENNIE Fashion Expert',
    titleKo: '제니 패션 전문가',
  },
  {
    type: 'master',
    targetType: 'media',
    targetId: 'blackpink-uuid',
    rules: {
      minContributions: 50,
      rankPosition: 1,
      timeWindow: 'monthly',
    },
    title: 'BLACKPINK Master',
    titleKo: 'BLACKPINK 마스터',
  },
];
```

**뱃지 계산**:
```typescript
// lib/badges/calculator.ts
async function calculateBadges(userId: string) {
  const stats = await getUserContributionStats(userId);

  for (const badge of badgeDefinitions) {
    const qualifies = await checkBadgeCriteria(userId, badge, stats);

    if (qualifies) {
      const existing = await getUserBadge(userId, badge.id);
      if (!existing) {
        await awardBadge(userId, badge.id, stats);
        await notifyBadgeEarned(userId, badge);
      }
    }
  }
}
```

#### 생성/수정할 파일
- `lib/badges/definitions.ts`
- `lib/badges/calculator.ts`
- `lib/badges/notifications.ts`
- `app/api/cron/badges/route.ts`

---

### S-08 기여자 랭킹

- **설명**: 전역 및 태그별 랭킹 계산 및 표시
- **우선순위**: P1 (내부)
- **상태**: 미시작
- **의존성**: 기여 추적

#### 수락 기준
- [ ] 총 기여에 의한 전역 랭킹
- [ ] 미디어별 랭킹 (예: "이번 주 BTS 1위")
- [ ] 캐스트별 랭킹
- [ ] 주간 및 월간 기간
- [ ] 포인트 계산 (게시물, 답변, 받은 투표)
- [ ] 동점 처리 규칙
- [ ] 과거 랭킹 데이터

#### 기술 명세

**랭킹 계산**:
```typescript
interface RankingConfig {
  points: {
    post: number;           // 게시물당 10점
    acceptedAnswer: number; // 채택된 답변당 5점
    voteReceived: number;   // 받은 투표당 1점
  };
  periods: ('weekly' | 'monthly' | 'allTime')[];
  scopes: ('global' | 'media' | 'cast')[];
}

async function calculateRankings(period: string, scope: string, scopeId?: string) {
  const startDate = getPeriodStart(period);

  const contributions = await getContributions({
    startDate,
    scope,
    scopeId,
  });

  // 사용자별 포인트 계산
  const userPoints = contributions.reduce((acc, c) => {
    const points =
      c.type === 'post' ? config.points.post :
      c.type === 'answer' && c.accepted ? config.points.acceptedAnswer :
      c.type === 'vote_received' ? config.points.voteReceived : 0;

    acc[c.userId] = (acc[c.userId] || 0) + points;
    return acc;
  }, {});

  // 정렬 및 순위 할당
  const ranked = Object.entries(userPoints)
    .sort(([, a], [, b]) => b - a)
    .map(([userId, points], index) => ({
      userId,
      points,
      rank: index + 1,
      period,
      scope,
      scopeId,
      calculatedAt: new Date(),
    }));

  // 랭킹 저장
  await upsertRankings(ranked);
}
```

**랭킹 표시**:
```typescript
// GET /api/rankings?scope=media&scopeId=xxx&period=weekly
interface RankingResponse {
  rankings: Array<{
    rank: number;
    user: {
      id: string;
      displayName: string;
      avatarUrl: string;
    };
    points: number;
    contributions: number;
  }>;
  userRank?: {
    rank: number;
    points: number;
  };
  period: string;
  scope: string;
}
```

#### 생성/수정할 파일
- `lib/rankings/calculator.ts`
- `lib/rankings/points.ts`
- `app/api/rankings/route.ts`
- `app/api/cron/rankings/route.ts`

---

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Routes (/api/*)                         │
├─────────────────────────────────────────────────────────────────┤
│  /ai/detect    │  /scrape      │  /track/click  │  /rankings   │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Vision API    │  │    Scraper      │  │   Click Tracker │
│   (S-01)        │  │    (S-02)       │  │   (S-05)        │
└─────────────────┘  └─────────────────┘  └─────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase (PostgreSQL)                         │
├─────────────────────────────────────────────────────────────────┤
│  media  │  cast  │  post  │  item  │  user  │  reward  │  ...  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Background Jobs (Cron)                      │
├─────────────────────────────────────────────────────────────────┤
│  Reward Batch (S-06)  │  Badge Calc (S-07)  │  Rankings (S-08)  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 마이그레이션 경로

### 1단계: 데이터베이스 구조
1. media, cast, junction 테이블 생성
2. post에 메타데이터 컬럼 추가
3. Materialized views 생성

### 2단계: AI & 스크래핑
1. Vision API 통합 설정
2. 초기 사이트로 스크래퍼 구축
3. 감지 파이프라인 생성

### 3단계: 추적 & 링크
1. 클릭 트래커 구현
2. 어필리에이트 링크 생성기 구축
3. 전환 웹훅 설정

### 4단계: 게이미피케이션
1. 리워드 배치 구현
2. 뱃지 시스템 구축
3. 랭킹 계산 생성

---

## 모니터링 & 알림

- Vision API 지연 시간/에러율
- 사이트별 스크래퍼 성공률
- 클릭 사기 감지율
- 리워드 계산 이상 징후
- 랭킹 작업 완료 여부
