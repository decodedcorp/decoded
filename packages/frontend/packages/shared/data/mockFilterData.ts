/**
 * Mock data for Hierarchical Filter development
 * Will be replaced with Supabase queries when backend is ready
 */

import type {
  CategoryOption,
  MediaOption,
  CastOption,
  ContextOption,
  CategoryType,
  ContextType,
} from "../types/filter";

// ============================================
// Level 1: Categories
// ============================================
export const MOCK_CATEGORIES: CategoryOption[] = [
  { id: "K-POP", label: "K-POP", labelKo: "케이팝", postCount: 450 },
  { id: "K-Drama", label: "K-Drama", labelKo: "드라마", postCount: 120 },
  { id: "K-Variety", label: "K-Variety", labelKo: "예능", postCount: 85 },
  { id: "K-Movie", label: "K-Movie", labelKo: "영화", postCount: 45 },
  { id: "K-Fashion", label: "K-Fashion", labelKo: "패션", postCount: 30 },
];

// ============================================
// Level 2: Media by Category
// ============================================
export const MOCK_MEDIA: Record<CategoryType, MediaOption[]> = {
  "K-POP": [
    {
      id: "newjeans",
      name: "NewJeans",
      nameKo: "뉴진스",
      type: "group",
      category: "K-POP",
      imageUrl: null,
      postCount: 150,
    },
    {
      id: "blackpink",
      name: "BLACKPINK",
      nameKo: "블랙핑크",
      type: "group",
      category: "K-POP",
      imageUrl: null,
      postCount: 120,
    },
    {
      id: "ive",
      name: "IVE",
      nameKo: "아이브",
      type: "group",
      category: "K-POP",
      imageUrl: null,
      postCount: 95,
    },
    {
      id: "aespa",
      name: "aespa",
      nameKo: "에스파",
      type: "group",
      category: "K-POP",
      imageUrl: null,
      postCount: 85,
    },
    {
      id: "lesserafim",
      name: "LE SSERAFIM",
      nameKo: "르세라핌",
      type: "group",
      category: "K-POP",
      imageUrl: null,
      postCount: 75,
    },
    {
      id: "illit",
      name: "ILLIT",
      nameKo: "아일릿",
      type: "group",
      category: "K-POP",
      imageUrl: null,
      postCount: 45,
    },
  ],
  "K-Drama": [
    {
      id: "lovely-runner",
      name: "Lovely Runner",
      nameKo: "선재 업고 튀어",
      type: "drama",
      category: "K-Drama",
      imageUrl: null,
      postCount: 45,
    },
    {
      id: "queen-of-tears",
      name: "Queen of Tears",
      nameKo: "눈물의 여왕",
      type: "drama",
      category: "K-Drama",
      imageUrl: null,
      postCount: 38,
    },
    {
      id: "business-proposal",
      name: "Business Proposal",
      nameKo: "사내맞선",
      type: "drama",
      category: "K-Drama",
      imageUrl: null,
      postCount: 25,
    },
  ],
  "K-Variety": [
    {
      id: "running-man",
      name: "Running Man",
      nameKo: "런닝맨",
      type: "show",
      category: "K-Variety",
      imageUrl: null,
      postCount: 35,
    },
    {
      id: "knowing-bros",
      name: "Knowing Bros",
      nameKo: "아는 형님",
      type: "show",
      category: "K-Variety",
      imageUrl: null,
      postCount: 28,
    },
    {
      id: "hangout-with-yoo",
      name: "Hangout with Yoo",
      nameKo: "놀면 뭐하니",
      type: "show",
      category: "K-Variety",
      imageUrl: null,
      postCount: 22,
    },
  ],
  "K-Movie": [
    {
      id: "exhuma",
      name: "Exhuma",
      nameKo: "파묘",
      type: "movie",
      category: "K-Movie",
      imageUrl: null,
      postCount: 20,
    },
    {
      id: "concrete-utopia",
      name: "Concrete Utopia",
      nameKo: "콘크리트 유토피아",
      type: "movie",
      category: "K-Movie",
      imageUrl: null,
      postCount: 15,
    },
  ],
  "K-Fashion": [
    {
      id: "vogue-korea",
      name: "Vogue Korea",
      nameKo: "보그 코리아",
      type: "show",
      category: "K-Fashion",
      imageUrl: null,
      postCount: 18,
    },
    {
      id: "elle-korea",
      name: "Elle Korea",
      nameKo: "엘르 코리아",
      type: "show",
      category: "K-Fashion",
      imageUrl: null,
      postCount: 12,
    },
  ],
};

// ============================================
// Level 3: Cast by Media
// ============================================
export const MOCK_CAST: Record<string, CastOption[]> = {
  newjeans: [
    { id: "minji", name: "Minji", nameKo: "민지", profileImageUrl: null, postCount: 45 },
    { id: "hanni", name: "Hanni", nameKo: "하니", profileImageUrl: null, postCount: 42 },
    { id: "danielle", name: "Danielle", nameKo: "다니엘", profileImageUrl: null, postCount: 38 },
    { id: "haerin", name: "Haerin", nameKo: "해린", profileImageUrl: null, postCount: 35 },
    { id: "hyein", name: "Hyein", nameKo: "혜인", profileImageUrl: null, postCount: 30 },
  ],
  blackpink: [
    { id: "jisoo", name: "Jisoo", nameKo: "지수", profileImageUrl: null, postCount: 35 },
    { id: "jennie", name: "Jennie", nameKo: "제니", profileImageUrl: null, postCount: 40 },
    { id: "rose", name: "Rosé", nameKo: "로제", profileImageUrl: null, postCount: 32 },
    { id: "lisa", name: "Lisa", nameKo: "리사", profileImageUrl: null, postCount: 38 },
  ],
  ive: [
    { id: "yujin", name: "Yujin", nameKo: "유진", profileImageUrl: null, postCount: 25 },
    { id: "gaeul", name: "Gaeul", nameKo: "가을", profileImageUrl: null, postCount: 18 },
    { id: "rei", name: "Rei", nameKo: "레이", profileImageUrl: null, postCount: 20 },
    { id: "wonyoung", name: "Wonyoung", nameKo: "원영", profileImageUrl: null, postCount: 35 },
    { id: "liz", name: "Liz", nameKo: "리즈", profileImageUrl: null, postCount: 15 },
    { id: "leeseo", name: "Leeseo", nameKo: "이서", profileImageUrl: null, postCount: 12 },
  ],
  aespa: [
    { id: "karina", name: "Karina", nameKo: "카리나", profileImageUrl: null, postCount: 30 },
    { id: "giselle", name: "Giselle", nameKo: "지젤", profileImageUrl: null, postCount: 22 },
    { id: "winter", name: "Winter", nameKo: "윈터", profileImageUrl: null, postCount: 25 },
    { id: "ningning", name: "Ningning", nameKo: "닝닝", profileImageUrl: null, postCount: 18 },
  ],
  lesserafim: [
    { id: "sakura", name: "Sakura", nameKo: "사쿠라", profileImageUrl: null, postCount: 22 },
    { id: "chaewon", name: "Chaewon", nameKo: "채원", profileImageUrl: null, postCount: 28 },
    { id: "yunjin", name: "Yunjin", nameKo: "윤진", profileImageUrl: null, postCount: 20 },
    { id: "kazuha", name: "Kazuha", nameKo: "카즈하", profileImageUrl: null, postCount: 25 },
    { id: "eunchae", name: "Eunchae", nameKo: "은채", profileImageUrl: null, postCount: 15 },
  ],
  illit: [
    { id: "yunah", name: "Yunah", nameKo: "윤아", profileImageUrl: null, postCount: 12 },
    { id: "minju", name: "Minju", nameKo: "민주", profileImageUrl: null, postCount: 15 },
    { id: "moka", name: "Moka", nameKo: "모카", profileImageUrl: null, postCount: 10 },
    { id: "wonhee", name: "Wonhee", nameKo: "원희", profileImageUrl: null, postCount: 8 },
    { id: "iroha", name: "Iroha", nameKo: "이로하", profileImageUrl: null, postCount: 10 },
  ],
  "lovely-runner": [
    { id: "byeon-wooseok", name: "Byeon Woo-seok", nameKo: "변우석", profileImageUrl: null, postCount: 25 },
    { id: "kim-hyeyoon", name: "Kim Hye-yoon", nameKo: "김혜윤", profileImageUrl: null, postCount: 20 },
  ],
  "queen-of-tears": [
    { id: "kim-soohyun", name: "Kim Soo-hyun", nameKo: "김수현", profileImageUrl: null, postCount: 22 },
    { id: "kim-jiwon", name: "Kim Ji-won", nameKo: "김지원", profileImageUrl: null, postCount: 18 },
  ],
};

// ============================================
// Level 4: Context Options (Static)
// ============================================
export const CONTEXT_OPTIONS: ContextOption[] = [
  { id: "airport", label: "Airport", labelKo: "공항패션" },
  { id: "stage", label: "Stage", labelKo: "무대" },
  { id: "mv", label: "Music Video", labelKo: "뮤비" },
  { id: "drama_scene", label: "Drama Scene", labelKo: "드라마" },
  { id: "variety", label: "Variety Show", labelKo: "예능" },
  { id: "photoshoot", label: "Photoshoot", labelKo: "화보" },
  { id: "daily", label: "Daily", labelKo: "일상" },
  { id: "event", label: "Event", labelKo: "행사" },
];

// ============================================
// Helper Functions (Mock API simulation)
// ============================================
export function getMockCategories(): CategoryOption[] {
  return MOCK_CATEGORIES;
}

export function getMockMediaByCategory(category: CategoryType): MediaOption[] {
  return MOCK_MEDIA[category] || [];
}

export function getMockCastByMedia(mediaId: string): CastOption[] {
  return MOCK_CAST[mediaId] || [];
}

export function getMockContextOptions(): ContextOption[] {
  return CONTEXT_OPTIONS;
}

// Search within options
export function searchMockMedia(
  category: CategoryType,
  query: string
): MediaOption[] {
  const media = MOCK_MEDIA[category] || [];
  const lowerQuery = query.toLowerCase();
  return media.filter(
    (m) =>
      m.name.toLowerCase().includes(lowerQuery) ||
      m.nameKo.includes(query)
  );
}

export function searchMockCast(mediaId: string, query: string): CastOption[] {
  const cast = MOCK_CAST[mediaId] || [];
  const lowerQuery = query.toLowerCase();
  return cast.filter(
    (c) =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.nameKo.includes(query)
  );
}
