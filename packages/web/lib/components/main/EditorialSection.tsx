"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import type { StyleCardData } from "./StyleCard";
import { PostImage } from "@/lib/components/shared/PostImage";

interface EditorialSectionProps {
  style?: StyleCardData;
  /** When true, removes outer padding/max-width (used when embedded in a grid) */
  embedded?: boolean;
}

export function EditorialSection({ style, embedded }: EditorialSectionProps) {
  if (!style) return null;

  const trendingItems = style.items?.slice(0, 3) ?? [];

  const content = (
    <Link href={style.link} className="group block h-full">
      <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_280px] rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/[0.06]">
        {/* Left: Editorial image — full image with blur bg */}
        <div className="relative aspect-[4/3] lg:aspect-auto overflow-hidden isolate">
          <div className="absolute inset-0 transition-transform duration-1000 group-hover:scale-105">
            {style.imageUrl ? (
              <PostImage
                src={style.imageUrl}
                alt={style.artistName}
                className="absolute inset-0"
                flagKey="FeedCard"
              />
            ) : (
              <div className="absolute inset-0 bg-neutral-800" />
            )}
          </div>

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-20" />

          {/* Top-left: EDITORIAL */}
          <div className="absolute top-5 left-6 z-20">
            <h2 className="text-xl md:text-2xl font-bold uppercase tracking-[0.1em] text-white">
              Editorial
            </h2>
            <div className="mt-2 h-[2px] w-10 bg-[#eafd67]" />
          </div>

          {/* Bottom-left: LATEST STORIES */}
          <div className="absolute bottom-5 left-6 z-20">
            <p className="text-lg md:text-xl font-bold uppercase tracking-wide text-white">
              Latest Stories
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mt-0.5">
              {style.artistName}
            </p>
          </div>
        </div>

        {/* Right: Trending items */}
        <div className="bg-[#1a1a1a] p-5 flex flex-col">
          <h3 className="text-base font-bold uppercase tracking-[0.12em] text-white mb-5">
            Items
          </h3>

          <div className="flex flex-col gap-4 flex-1 justify-center">
            {trendingItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: 0.1 + i * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex items-center gap-3"
              >
                {/* Thumbnail */}
                <div className="relative w-[80px] h-[80px] shrink-0 rounded-lg overflow-hidden bg-neutral-800">
                  {item.imageUrl && (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  )}
                </div>

                {/* Info + price */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate uppercase">
                    {item.name}
                  </p>
                  {item.brand && (
                    <p className="text-[10px] text-white/40 mt-0.5 truncate">
                      {item.brand}
                    </p>
                  )}
                </div>

                {/* Accent dot */}
                <div className="shrink-0 w-2.5 h-2.5 rounded-full bg-[#eafd67] shadow-[0_0_8px_rgba(234,253,103,0.5)]" />
              </motion.div>
            ))}

            {trendingItems.length === 0 && (
              <p className="text-xs text-white/30 italic">No items yet</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );

  if (embedded) return content;

  return (
    <section className="py-10 lg:py-14 px-6 md:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl">{content}</div>
    </section>
  );
}
