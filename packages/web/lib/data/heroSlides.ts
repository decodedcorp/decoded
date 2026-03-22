export interface HeroSlide {
  id: string;
  imageUrl: string;
  title: string;
  subtitle?: string;
  link: string;
}

export const heroSlides: HeroSlide[] = [
  {
    id: "1",
    imageUrl: "/images/hero/hero-1.jpg",
    title: "젠틀몬스터 + 제니",
    subtitle: "제품 살펴보기",
    link: "/feed",
  },
  {
    id: "2",
    imageUrl: "/images/hero/hero-2.jpg",
    title: "IVE 장원영",
    subtitle: "스타일 컬렉션",
    link: "/feed",
  },
  {
    id: "3",
    imageUrl: "/images/hero/hero-3.jpg",
    title: "BLACKPINK 로제",
    subtitle: "패션 아이템",
    link: "/feed",
  },
];
