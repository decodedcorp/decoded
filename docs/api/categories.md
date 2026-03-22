# Categories API

> 카테고리 관련 API 엔드포인트

---

## 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|--------|------|------|:----:|
| `GET` | `/api/v1/categories` | 카테고리 목록 조회 | - |

> Admin 카테고리 관리 API는 [Admin API](./admin.md)를 참조하세요.

---

## 카테고리 목록 조회

활성화된 모든 카테고리를 조회합니다.

### Request

```http
GET /api/v1/categories
```

### Response

```json
[
  {
    "id": "category-uuid-1",
    "code": "fashion",
    "name": {
      "ko": "패션",
      "en": "Fashion",
      "ja": "ファッション"
    },
    "description": {
      "ko": "의류, 신발, 악세서리",
      "en": "Clothing, shoes, accessories"
    },
    "icon_url": "https://...",
    "color_hex": "#FF5733",
    "display_order": 1,
    "is_active": true
  },
  {
    "id": "category-uuid-2",
    "code": "living",
    "name": {
      "ko": "리빙",
      "en": "Living",
      "ja": "リビング"
    },
    "description": {
      "ko": "가구, 인테리어, 소품"
    },
    "icon_url": "https://...",
    "color_hex": "#33FF57",
    "display_order": 2,
    "is_active": true
  },
  {
    "id": "category-uuid-3",
    "code": "tech",
    "name": {
      "ko": "테크",
      "en": "Tech"
    },
    "icon_url": "https://...",
    "color_hex": "#3357FF",
    "display_order": 3,
    "is_active": true
  },
  {
    "id": "category-uuid-4",
    "code": "beauty",
    "name": {
      "ko": "뷰티",
      "en": "Beauty"
    },
    "icon_url": "https://...",
    "color_hex": "#FF33F5",
    "display_order": 4,
    "is_active": true
  }
]
```

---

## 카테고리 코드

| 코드 | 한국어 | 영어 | 설명 |
|------|--------|------|------|
| `fashion` | 패션 | Fashion | 의류, 신발, 악세서리 |
| `living` | 리빙 | Living | 가구, 인테리어, 소품 |
| `tech` | 테크 | Tech | 전자기기, IT 제품 |
| `beauty` | 뷰티 | Beauty | 화장품, 스킨케어 |

---

## 예시 코드 (TypeScript)

```typescript
// 카테고리 목록 조회
const response = await fetch('/api/v1/categories');
const categories = await response.json();

// 카테고리 ID로 코드 찾기
function getCategoryIdByCode(code: string): string | undefined {
  const category = categories.find(c => c.code === code);
  return category?.id;
}

// 현재 언어에 맞는 카테고리명 가져오기
function getCategoryName(category: CategoryResponse, lang: 'ko' | 'en' | 'ja' = 'ko'): string {
  return category.name[lang] || category.name.ko;
}
```

---

## 관련 API

- [Spots API](./spots.md) - Spot 생성 시 카테고리 지정
- [Search API](./search.md) - 카테고리로 검색 필터링
- [Admin API](./admin.md) - 카테고리 관리

---

## 변경 이력

- **2025-01-15**: 초기 문서 생성
