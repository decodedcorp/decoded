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
    title: "Gentle Monster × Jennie",
    subtitle: "Browse the drop",
    link: "/feed",
  },
  {
    id: "2",
    imageUrl: "/images/hero/hero-2.jpg",
    title: "IVE Jang Wonyoung",
    subtitle: "Style collection",
    link: "/feed",
  },
  {
    id: "3",
    imageUrl: "/images/hero/hero-3.jpg",
    title: "BLACKPINK Rosé",
    subtitle: "Fashion items",
    link: "/feed",
  },
];
