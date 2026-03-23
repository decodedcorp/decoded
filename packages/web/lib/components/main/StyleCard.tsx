"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useSpots } from "@/lib/hooks/useSpots";

export interface StyleCardData {
  id: string;
  title: string;
  description: string;
  artistName: string;
  imageUrl?: string;
  link: string;
  /** true = post has at least one spot with solution; false = spots but no solutions */
  hasSolutions?: boolean;
  /** number of spots (for solution badge when emphasizeSolutions) */
  spotCount?: number;
  items?: {
    id: string;
    label: string;
    brand: string;
    name: string;
    imageUrl?: string;
  }[];
  spots?: {
    id: string;
    x: number;
    y: number;
    label?: string;
    hasSolution?: boolean;
  }[];
}

interface StyleCardProps {
  data: StyleCardData;
  variant?: "large" | "medium" | "small";
  showItems?: boolean;
  /** show solution count badge (e.g. "N solutions") */
  showSolutionBadge?: boolean;
  /** solution 섹션용: primary 링 + 항상 스팟 표시 */
  solutionCard?: boolean;
  /** 스팟을 호버 없이 항상 로드·표시 */
  alwaysShowSpots?: boolean;
  index?: number;
}

export function StyleCard({
  data,
  variant = "medium",
  showItems = true,
  showSolutionBadge = false,
  solutionCard = false,
  alwaysShowSpots = false,
  index = 0,
}: StyleCardProps) {
  const [hovered, setHovered] = useState(false);
  const { data: spotsFromApi } = useSpots(data.id, {
    enabled: alwaysShowSpots || hovered,
    staleTime: 1000 * 60 * 5,
  });
  const spotsVisible = alwaysShowSpots ? true : hovered;
  const displaySpots =
    spotsVisible && spotsFromApi && spotsFromApi.length > 0
      ? spotsFromApi.map((s) => ({
          id: s.id,
          x: parseFloat(s.position_left) || 0,
          y: parseFloat(s.position_top) || 0,
          hasSolution: ((s as unknown as { solution_count?: number }).solution_count ?? 0) > 0,
        }))
      : data.spots;

  const aspectClasses = {
    large: "aspect-[4/3]",
    medium: "aspect-[3/4]",
    small: "aspect-square",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
        delay: index * 0.1,
      }}
      className={cn(
        "group relative overflow-hidden rounded-[24px] md:rounded-[40px] bg-neutral-900 transition-all duration-700 hover:shadow-[0_30px_60px_rgba(0,0,0,0.6)]",
        solutionCard && "ring-2 ring-primary/40 hover:ring-primary/60",
        aspectClasses[variant]
      )}
    >
      <Link
        href={data.link}
        className="absolute inset-0 block"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Background Image with Hover Zoom */}
        <div className="absolute inset-0 overflow-hidden">
          {data.imageUrl ? (
            <Image
              src={data.imageUrl}
              alt={data.title}
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-1"
            />
          ) : (
            <div className="absolute inset-0 bg-neutral-800" />
          )}
        </div>

        {/* Solution badge – 솔루션 강조 */}
        {showSolutionBadge && (data.spotCount ?? 0) > 0 && (
          <div className="absolute top-4 right-4 z-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-black shadow-lg">
              <svg
                className="h-3.5 w-3.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {data.spotCount} solution{data.spotCount !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Premium Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />

        {/* Content Container */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10 flex flex-col gap-3">
          {/* Label */}
          <div className="flex items-center gap-3 mb-1">
            <span className="w-6 h-[1px] bg-primary" />
            <p className="text-primary font-sans font-bold tracking-[0.25em] text-[10px] uppercase">
              Narrative
            </p>
          </div>

          {/* Artist Name */}
          <h4 className="text-sm md:text-base font-serif italic text-white/60 mb-1 group-hover:text-white transition-colors">
            {data.artistName}
          </h4>

          {/* Title */}
          <h3 className="text-2xl md:text-3xl font-sans font-bold text-white leading-tight tracking-tight line-clamp-2">
            {data.title}
          </h3>

          {/* Interaction Indicator */}
          <div className="flex items-center gap-6 mt-4 overflow-hidden h-8">
            <span className="text-[10px] font-sans font-bold tracking-[0.3em] text-primary uppercase transform translate-y-full group-hover:translate-y-0 transition-transform duration-600 ease-[0.16,1,0.3,1]">
              Explore details
            </span>
            <div className="flex-1 h-[1px] bg-white/10 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-800 delay-100" />
          </div>
        </div>

        {/* Spot Markers – visible on hover only; filled = has solution, ring = no solution */}
        {displaySpots && displaySpots.length > 0 && (
          <div
            className={cn(
              "absolute inset-0 pointer-events-none z-20 transition-opacity duration-200",
              spotsVisible ? "opacity-100" : "opacity-0"
            )}
          >
            {displaySpots.map((spot, spotIndex) => {
              const hasSol = "hasSolution" in spot ? spot.hasSolution : false;
              return (
                <motion.div
                  key={spot.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={
                    spotsVisible
                      ? { opacity: 1, scale: 1 }
                      : { opacity: 0, scale: 0 }
                  }
                  transition={{
                    duration: 0.25,
                    delay: spotIndex * 0.06,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="absolute w-10 h-10 -ml-5 -mt-5 flex items-center justify-center"
                  style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                >
                  {hasSol ? (
                    <>
                      <motion.div
                        className="absolute inset-0 bg-white rounded-full"
                        animate={{ scale: [1, 1.8, 1.8], opacity: [0.4, 0, 0] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          repeatDelay: 0.3,
                        }}
                      />
                      <motion.div
                        className="relative w-4 h-4 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.9)] border-2 border-white"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-white/60"
                        animate={{
                          scale: [1, 2, 2],
                          opacity: [0.5, 0, 0],
                        }}
                        transition={{
                          duration: 1.8,
                          repeat: Infinity,
                          repeatDelay: 0.4,
                        }}
                      />
                      <motion.div
                        className="relative w-5 h-5 rounded-full border-2 border-white bg-white/10 shadow-[0_0_16px_rgba(255,255,255,0.5)]"
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{
                          duration: 1.4,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </Link>
    </motion.div>
  );
}
