"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { TrendingKeyword } from "@/lib/utils/main-page-mapper";

const sampleKeywords: TrendingKeyword[] = [
  { id: "1", label: "Newjeans Danielle", href: "/search?q=뉴진스+다니엘" },
  { id: "2", label: "Nike", href: "/search?q=나이키" },
  { id: "3", label: "Pink Anorak", href: "/search?q=핑크+아노락" },
  { id: "4", label: "Blackpink Jennie", href: "/search?q=블랙핑크+제니" },
  { id: "5", label: "Triomphe", href: "/search?q=Triomphe" },
  { id: "6", label: "RON ARAD STUDIO", href: "/search?q=RON+ARAD+STUDIO" },
  { id: "7", label: "Spring Bloom", href: "/search?q=Spring+Bloom" },
  { id: "8", label: "Denim Archives", href: "/search?q=Denim" },
];

interface TrendingNowSectionProps {
  keywords?: TrendingKeyword[];
}

export function TrendingNowSection({
  keywords = sampleKeywords,
}: TrendingNowSectionProps) {
  return (
    <section className="py-24 md:py-32 bg-[#050505] px-6 md:px-12 relative overflow-hidden border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8 text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <span className="text-primary font-sans font-bold tracking-[0.3em] text-[10px] md:text-xs uppercase mb-4 block">
              Global Search
            </span>
            <h2 className="text-5xl md:text-7xl font-serif font-bold italic tracking-tighter text-white">
              Trending Now
            </h2>
          </motion.div>
        </div>

        <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-6 max-w-5xl">
          {keywords.map((keyword, index) => (
            <motion.div
              key={keyword.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.5 }}
            >
              <Link
                href={keyword.href}
                className="group relative inline-block px-8 py-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-full
                         hover:bg-primary/10 hover:border-primary/50 transition-all duration-500 overflow-hidden"
              >
                {/* Hover Background Animation */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <span className="relative text-sm md:text-base font-sans font-medium text-white/60 group-hover:text-white transition-colors tracking-wide">
                  {keyword.label}
                </span>

                {/* Underline Animation */}
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-primary origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
