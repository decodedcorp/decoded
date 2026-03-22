"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { StyleCard, type StyleCardData } from "./StyleCard";

const sampleSpotlightData: StyleCardData[] = [
  {
    id: "1",
    title: "ROSE x FUMA",
    description:
      "뉴진스의 다니엘이 'How Sweet' 뮤비에서 Nike Cortes Nylon Midnight Navy, 핑크 아노락을 매치해 스타일을 완성했다.",
    artistName: "Newjeans Danielle",
    link: "/feed",
    imageUrl:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800",
  },
  {
    id: "2",
    title: "IVE Wonyoung Airport Look",
    description: "IVE 장원영이 공항에서 착용한 럭셔리 브랜드 아이템들.",
    artistName: "IVE Wonyoung",
    link: "/feed",
    imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800",
  },
];

interface ArtistSpotlightSectionProps {
  data?: StyleCardData[];
  /** 어떤 아티스트 스포트라이트인지 (예: "Justin Bieber, 뉴진스 등") */
  subtitle?: string;
}

export function ArtistSpotlightSection({
  data = sampleSpotlightData,
  subtitle,
}: ArtistSpotlightSectionProps) {
  return (
    <section className="py-12 md:py-16 bg-[#0a0a0a] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12 mb-8 md:mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-primary font-sans font-bold tracking-[0.3em] text-[10px] md:text-xs uppercase mb-4 block">
              Global Perspectives
            </span>
            <h2 className="text-4xl md:text-6xl font-serif font-bold italic tracking-tighter text-white">
              Artist Spotlight
            </h2>
            {subtitle && (
              <p className="mt-3 text-white/60 font-sans text-base md:text-lg">
                {subtitle}
              </p>
            )}
          </motion.div>
          <Link
            href="/artist"
            className="group flex items-center gap-3 text-xs md:text-sm font-sans font-medium text-white/40 hover:text-white transition-colors"
          >
            <span>DISCOVER ALL TALENTS</span>
            <div className="w-8 h-[1px] bg-white/10 group-hover:bg-primary transition-all group-hover:w-12" />
          </Link>
        </div>
      </div>

      {/* Horizontal Scroll Area */}
      <div className="relative group">
        <motion.div
          className="flex gap-6 overflow-x-auto px-6 md:px-[max(1.5rem,calc((100vw-80rem)/2+3rem))] pb-12 no-scrollbar snap-x snap-mandatory"
          style={{ scrollbarWidth: "none" }}
        >
          {data.map((item, index) => (
            <div
              key={item.id}
              className="min-w-[300px] md:min-w-[450px] snap-center"
            >
              <StyleCard data={item} variant="medium" index={index} />
            </div>
          ))}

          {/* View More Card at the end */}
          <div className="min-w-[200px] h-full flex items-center justify-center p-6 snap-center">
            <Link
              href="/artist"
              className="group flex flex-col items-center gap-6"
            >
              <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center group-hover:border-primary transition-colors">
                <svg
                  className="w-6 h-6 text-white group-hover:text-primary transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <span className="text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase group-hover:text-white transition-colors">
                View More
              </span>
            </Link>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
