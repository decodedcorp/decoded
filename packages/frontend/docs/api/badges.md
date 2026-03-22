# Badges API

> 뱃지(업적) 시스템 관련 API 엔드포인트

---

## 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|--------|------|------|:----:|
| `GET` | `/api/v1/badges` | 전체 뱃지 목록 | - |
| `GET` | `/api/v1/badges/me` | 내 뱃지 현황 | O |

> Admin 뱃지 관리 API는 [Admin API](./admin.md)를 참조하세요.

---

## 전체 뱃지 목록 조회

시스템에 등록된 모든 뱃지를 조회합니다.

### Request

```http
GET /api/v1/badges
```

### Response

```json
{
  "data": [
    {
      "id": "badge-uuid-1",
      "type": "achievement",
      "name": "첫 Solution",
      "description": "첫 번째 Solution을 등록하세요",
      "icon_url": "https://...",
      "criteria": {
        "type": "count",
        "threshold": 1
      },
      "rarity": "common",
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": "badge-uuid-2",
      "type": "specialist",
      "name": "패션 전문가",
      "description": "패션 카테고리에서 30개 이상의 Solution 채택",
      "icon_url": "https://...",
      "criteria": {
        "type": "category",
        "target": "fashion",
        "threshold": 30
      },
      "rarity": "epic",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

## 내 뱃지 현황 조회

로그인한 사용자의 뱃지 획득 현황과 진행 중인 뱃지를 조회합니다.

### Request

```http
GET /api/v1/badges/me
Authorization: Bearer <token>
```

### Response

```json
{
  "data": [
    {
      "id": "badge-uuid-1",
      "type": "achievement",
      "name": "첫 Solution",
      "description": "첫 번째 Solution을 등록하세요",
      "icon_url": "https://...",
      "criteria": {
        "type": "count",
        "threshold": 1
      },
      "rarity": "common",
      "created_at": "2024-01-01T00:00:00Z",
      "earned_at": "2024-06-15T12:00:00Z",
      "progress": {
        "current": 1,
        "threshold": 1,
        "completed": true
      }
    }
  ],
  "available_badges": [
    {
      "id": "badge-uuid-2",
      "name": "패션 전문가",
      "description": "패션 카테고리에서 30개 이상의 Solution 채택",
      "icon_url": "https://...",
      "rarity": "epic",
      "progress": {
        "current": 12,
        "threshold": 30,
        "completed": false
      }
    }
  ]
}
```

### 응답 필드 설명

| 필드 | 설명 |
|------|------|
| `data` | 획득한 뱃지 목록 |
| `available_badges` | 진행 중인 (미획득) 뱃지 목록 |
| `earned_at` | 뱃지 획득 일시 |
| `progress` | 뱃지 진행도 |

### 에러 코드

| 코드 | 설명 |
|------|------|
| `401` | 인증 필요 |

---

## 뱃지 타입

| 타입 | 설명 | 예시 |
|------|------|------|
| `achievement` | 업적 뱃지 | 첫 Solution, 첫 채택 |
| `milestone` | 마일스톤 뱃지 | Solution 100개 달성 |
| `specialist` | 전문가 뱃지 | 아티스트/그룹 전문가 |
| `category` | 카테고리 뱃지 | 패션 전문가, 뷰티 전문가 |
| `explorer` | 탐험가 뱃지 | 다양한 분야 활동 |
| `shopper` | 쇼퍼 뱃지 | 구매 관련 활동 |

---

## 뱃지 희귀도

| 희귀도 | 색상 | 설명 |
|--------|------|------|
| `common` | 회색 | 쉽게 획득 가능 |
| `rare` | 파랑 | 약간의 노력 필요 |
| `epic` | 보라 | 상당한 활동 필요 |
| `legendary` | 금색 | 최상위 업적 |

---

## 뱃지 획득 조건 타입

| criteria.type | 설명 | 예시 |
|---------------|------|------|
| `count` | 단순 수량 달성 | Solution 10개 등록 |
| `verified` | 검증된 수량 | Verified Solution 5개 |
| `adopted` | 채택 수량 | 채택된 Solution 10개 |
| `artist` | 특정 아티스트 전문 | 아이유 관련 Solution 20개 |
| `group` | 특정 그룹 전문 | BTS 관련 Solution 20개 |
| `category` | 카테고리 전문 | 패션 카테고리 Solution 30개 |

---

## 예시 코드 (TypeScript)

```typescript
// 내 뱃지 현황 조회
const response = await fetch('/api/v1/badges/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { data: earnedBadges, available_badges } = await response.json();

// 획득한 뱃지 표시
earnedBadges.forEach(badge => {
  console.log(`${badge.name} - 획득: ${badge.earned_at}`);
});

// 진행 중인 뱃지 표시
available_badges.forEach(badge => {
  const percent = (badge.progress.current / badge.progress.threshold) * 100;
  console.log(`${badge.name}: ${percent.toFixed(0)}% 진행`);
});
```

---

## 관련 API

- [Rankings API](./rankings.md) - 랭킹 관련 뱃지
- [Users API](./users.md) - 사용자 활동 통계
- [Admin API](./admin.md) - 뱃지 관리

---

## 변경 이력

- **2025-01-15**: 초기 문서 생성
