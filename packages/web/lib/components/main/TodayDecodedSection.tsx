"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SpotDetail {
  id: string;
  number: number;
  title: string;
  brand: string;
  price: string;
  stylingTip: string;
  imageUrl: string;
  link: string;
  x: number;
  y: number;
}

const sampleSpots: SpotDetail[] = [
  {
    id: "spot-1",
    number: 1,
    title: "Lavender Oversized Blazer",
    brand: "NewJeans Hanni · ZARA",
    price: "$129",
    stylingTip:
      "Perfect for layering over a simple white tee for that effortless airport look.",
    imageUrl:
      "https://images.unsplash.com/photo-1699847061593-188987efcd3e?w=800",
    link: "/items/1",
    x: 45,
    y: 35,
  },
  {
    id: "spot-2",
    number: 2,
    title: "Y2K Denim Jacket",
    brand: "IVE Wonyoung · Levi's",
    price: "$89",
    stylingTip:
      "Retro vibes meet modern streetwear. Layer over a cropped top for the perfect Y2K moment.",
    imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800",
    link: "/items/2",
    x: 55,
    y: 25,
  },
  {
    id: "spot-3",
    number: 3,
    title: "Minimal White Sneakers",
    brand: "aespa Karina · Nike",
    price: "$110",
    stylingTip:
      "Clean, classic, and versatile. The foundation of any minimalist wardrobe.",
    imageUrl:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800",
    link: "/items/3",
    x: 50,
    y: 75,
  },
];

interface TodayDecodedSectionProps {
  spots?: SpotDetail[];
}

export function TodayDecodedSection({
  spots = sampleSpots,
}: TodayDecodedSectionProps) {
  const [hoveredSpotId, setHoveredSpotId] = useState<string | null>(null);

  return (
    <section className="py-24 md:py-40 bg-black text-white px-6 md:px-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 md:mb-24 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-primary font-sans font-bold tracking-[0.4em] text-[10px] md:text-xs uppercase mb-6 block">
              Featured Spots
            </span>
            <h2 className="text-6xl md:text-8xl font-serif font-bold italic tracking-tighter leading-[0.85]">
              Today's
              <br />
              Decoded
            </h2>
          </motion.div>

          <Link
            href="/explore"
            className="group flex items-center gap-4 py-4 px-8 border border-white/10 rounded-full text-[10px] font-sans font-bold tracking-[0.2em] text-white/50 hover:text-white hover:border-white/30 transition-all uppercase"
          >
            <span>View All Spots</span>
            <svg
              className="w-4 h-4 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </Link>
        </div>

        {/* Spots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {spots.map((spot, index) => (
            <motion.div
              key={spot.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 1,
                delay: index * 0.2,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="flex flex-col gap-8 group"
              onMouseEnter={() => setHoveredSpotId(spot.id)}
              onMouseLeave={() => setHoveredSpotId(null)}
            >
              {/* Image Container */}
              <div className="relative aspect-[3/4] rounded-[48px] overflow-hidden shadow-2xl bg-neutral-900">
                <Image
                  src={spot.imageUrl}
                  alt={spot.title}
                  fill
                  className={cn(
                    "object-cover transition-all duration-1000",
                    hoveredSpotId === spot.id
                      ? "scale-110"
                      : "scale-100 grayscale-[0.3]"
                  )}
                />

                {/* Spotlight Mask Pattern */}
                <div
                  className={cn(
                    "absolute inset-0 bg-black/40 transition-opacity duration-700 pointer-events-none",
                    hoveredSpotId === spot.id ? "opacity-0" : "opacity-100"
                  )}
                />

                {/* Numbered Spot Marker */}
                <div
                  className="absolute"
                  style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute w-12 h-12 -ml-6 -mt-6 rounded-full bg-[#E2FF32]/30 flex items-center justify-center"
                  />
                  <div className="relative w-10 h-10 -ml-5 -mt-5 rounded-full bg-[#E2FF32] text-black flex items-center justify-center font-bold text-lg shadow-xl">
                    {spot.number}
                  </div>
                </div>
              </div>

              {/* Spot Info */}
              <div className="flex flex-col gap-6 px-4">
                <div className="flex gap-6 items-start">
                  <span className="text-4xl font-serif font-bold italic text-[#E2FF32]">
                    {spot.number}
                  </span>
                  <div>
                    <h3 className="text-2xl font-serif font-bold mb-2 tracking-tight group-hover:text-[#E2FF32] transition-colors line-clamp-1">
                      {spot.title}
                    </h3>
                    <p className="text-sm font-sans font-bold tracking-widest text-white/40 uppercase">
                      {spot.brand} · {spot.price}
                    </p>
                  </div>
                </div>

                {/* Styling Tip Card */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden group-hover:bg-white/10 transition-colors">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#E2FF32]/50" />
                  <span className="text-[10px] font-sans font-bold tracking-[0.3em] text-white/30 uppercase mb-3 block">
                    Styling Tip
                  </span>
                  <p className="text-sm font-sans font-light leading-relaxed text-white/70">
                    {spot.stylingTip}
                  </p>
                </div>

                {/* View Solution Button */}
                <Link
                  href={spot.link}
                  className="group/btn relative w-full h-16 bg-[#E2FF32] rounded-2xl flex items-center justify-center gap-3 overflow-hidden transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="relative z-10 text-black font-sans font-bold text-xs tracking-[0.2em] uppercase">
                    View Solution
                  </span>
                  <svg
                    className="relative z-10 w-5 h-5 text-black"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-0 transition-transform duration-500" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
