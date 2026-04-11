"use client";

import { motion } from "motion/react";
import Link from "next/link";

export interface CelebrityItem {
  id: string;
  imageUrl: string;
  title?: string;
  link: string;
}

interface CelebrityGridProps {
  items: CelebrityItem[];
  showCTA?: boolean;
  ctaText?: string;
}

export function CelebrityGrid({
  items,
  showCTA = true,
  ctaText = "Browse items",
}: CelebrityGridProps) {
  // Ensure we have exactly 3 items for the grid
  const gridItems = items.slice(0, 3);

  // Determine which item gets the CTA (center item)
  const ctaIndex = 1;

  return (
    <section className="px-4 md:px-8 lg:px-16 pb-16 md:pb-24 bg-main-bg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-7xl mx-auto">
        {gridItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              duration: 0.6,
              delay: index * 0.15,
              ease: "easeOut",
            }}
            className="relative group"
          >
            <Link href={item.link} className="block">
              <div className="relative aspect-[621/704] rounded-[var(--main-border-radius)] overflow-hidden bg-gray-800">
                {/* Placeholder gradient while no actual images */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900" />

                {/* Uncomment when actual images are available */}
                {/* <Image
                  src={item.imageUrl}
                  alt={item.title || "Celebrity image"}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                /> */}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />

                {/* CTA button on center image */}
                {showCTA && index === ctaIndex && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 }}
                      className="px-8 py-4 bg-white text-black font-semibold rounded-full
                               hover:bg-white/90 transition-all duration-300
                               group-hover:scale-105"
                    >
                      {ctaText}
                    </motion.button>
                  </div>
                )}

                {/* Title overlay (if provided) */}
                {item.title && (
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                    <h3 className="text-heading-sm font-bold text-white">
                      {item.title}
                    </h3>
                  </div>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// Default celebrity items for demonstration
export const defaultCelebrityItems: CelebrityItem[] = [
  {
    id: "1",
    imageUrl: "/images/celebrity/celeb-1.jpg",
    link: "/feed",
  },
  {
    id: "2",
    imageUrl: "/images/celebrity/celeb-2.jpg",
    link: "/feed",
  },
  {
    id: "3",
    imageUrl: "/images/celebrity/celeb-3.jpg",
    link: "/feed",
  },
];
