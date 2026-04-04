"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";

export interface HeroData {
  artistName: string;
  title: string;
  subtitle: string;
  imageUrl?: string;
  link: string;
}

interface HeroSectionProps {
  data?: HeroData;
}

const defaultHeroData: HeroData = {
  artistName: "NEWJEANS",
  title: "뉴진스 'Supernatural' 컨셉 엿보기",
  subtitle: "",
  imageUrl:
    "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1920&q=80",
  link: "/feed",
};

export function HeroSection({ data = defaultHeroData }: HeroSectionProps) {
  const [isNeonMode, setIsNeonMode] = useState(false);

  return (
    <section className="relative w-full min-h-[85vh] md:min-h-screen overflow-hidden bg-black flex items-center">
      {/* Background Image with Parallax & Mask */}
      <motion.div
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 z-0"
      >
        {data.imageUrl ? (
          <AnimatePresence mode="wait">
            {isNeonMode ? (
              <motion.div
                key="neon"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0"
              >
                <Image
                  src="/lab-assets/neon-test/04_neon_glow.png"
                  alt={data.artistName}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover opacity-90"
                  style={{
                    filter:
                      "drop-shadow(0 0 6px #eafd67) drop-shadow(0 0 15px #eafd67) drop-shadow(0 0 30px #eafd67)",
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="normal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0"
              >
                <Image
                  src={data.imageUrl}
                  alt={data.artistName}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover opacity-70 grayscale-[10%]"
                />
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-black to-neutral-900" />
        )}
      </motion.div>

      {/* Neon Glow Toggle Button */}
      <motion.button
        onClick={() => setIsNeonMode((prev) => !prev)}
        whileTap={{ scale: 0.9 }}
        className={[
          "absolute top-6 right-6 md:top-8 md:right-8 z-30",
          "w-10 h-10 rounded-full flex items-center justify-center",
          "backdrop-blur-sm border transition-all duration-300",
          isNeonMode
            ? "bg-primary/20 border-primary/40"
            : "bg-white/10 border-white/20 hover:bg-white/20",
        ].join(" ")}
        aria-label={
          isNeonMode ? "Switch to normal mode" : "Switch to neon mode"
        }
      >
        {/* Sparkle / 4-point star icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`transition-colors duration-300 ${isNeonMode ? "text-[#eafd67]" : "text-white/60"}`}
        >
          <path d="M10 1 L11.5 8.5 L19 10 L11.5 11.5 L10 19 L8.5 11.5 L1 10 L8.5 8.5 Z" />
        </svg>
      </motion.button>

      {/* Premium Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 z-10" />

      {/* Texture/Grain Overlay */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none z-10 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* Decorative vertical line */}
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "140px", opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute left-8 md:left-16 top-0 w-[1px] bg-primary/40 z-20 hidden md:block"
      />

      {/* Content Container */}
      <div className="container mx-auto px-6 md:px-16 lg:px-24 relative z-20">
        <div className="max-w-[1200px]">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            {/* Top Label */}
            <div className="flex items-center gap-4 mb-8">
              <span className="w-10 h-[1px] bg-primary" />
              <span className="text-primary font-sans font-bold tracking-[0.4em] text-[10px] md:text-xs uppercase">
                Featured Narrative
              </span>
            </div>

            {/* Big Artist Name */}
            <h2 className="text-[15vw] md:text-[12vw] lg:text-[10vw] xl:text-[14rem] font-serif font-bold text-white leading-[0.8] tracking-tighter mb-12 italic drop-shadow-2xl">
              {data.artistName}
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-12"
          >
            {/* Title & Description */}
            <div className="max-w-2xl">
              <p className="text-2xl md:text-3xl lg:text-4xl text-white/95 font-sans font-light leading-snug mb-14 tracking-tight">
                {data.title}
              </p>

              {/* Action Button */}
              <Link
                href={data.link}
                className="group relative inline-flex items-center gap-10 px-16 py-8 bg-white text-black font-sans font-bold text-xs md:text-sm tracking-[0.25em] overflow-hidden transition-all hover:scale-[1.02] active:scale-95 shadow-2xl"
              >
                <span className="relative z-10 transition-colors duration-500 group-hover:text-white">
                  VIEW EDITORIAL
                </span>
                <motion.div
                  animate={{ x: [0, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="relative z-10 transition-colors duration-500 group-hover:text-white"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </motion.div>
                <div className="absolute top-0 left-0 w-0 h-full bg-black transition-all duration-700 ease-[0.16,1,0.3,1] group-hover:w-full z-0" />
              </Link>
            </div>

            {/* Scroll Indicator - Premium Minimalism */}
            <div className="hidden lg:flex flex-col items-center gap-8 ml-auto group cursor-pointer">
              <span className="text-[10px] tracking-[0.5em] font-bold text-white/40 uppercase vertical-text group-hover:text-primary transition-colors">
                Discover More
              </span>
              <div className="w-[1px] h-24 bg-white/10 relative overflow-hidden">
                <motion.div
                  animate={{ y: ["-100%", "100%"] }}
                  transition={{
                    repeat: Infinity,
                    duration: 3,
                    ease: "linear",
                  }}
                  className="absolute top-0 left-0 w-full h-full bg-primary"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        .vertical-text {
          writing-mode: vertical-rl;
        }
      `}</style>
    </section>
  );
}
