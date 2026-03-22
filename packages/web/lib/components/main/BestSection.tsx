"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import type { ItemCardData } from "./ItemCard";

const sampleBestItems: ItemCardData[] = [
  {
    id: "bi-1",
    brand: "Prada",
    name: "Re-Edition 2005 Bag",
    link: "/items/1",
    price: "$1,850",
    imageUrl:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400",
  },
  {
    id: "bi-2",
    brand: "Celine",
    name: "Triomphe Belt",
    link: "/items/2",
    price: "$650",
    imageUrl:
      "https://images.unsplash.com/photo-1564848005333-590727c99921?w=400",
  },
  {
    id: "bi-3",
    brand: "Nike",
    name: "Air Jordan 1 Retro",
    link: "/items/3",
    price: "$180",
    imageUrl:
      "https://images.unsplash.com/photo-1518738458435-19149697112a?w=400",
  },
  {
    id: "bi-4",
    brand: "Jacquemus",
    name: "Le Chiquito",
    link: "/items/4",
    price: "$550",
    imageUrl:
      "https://images.unsplash.com/photo-1641206189215-9533ceb7a1df?w=400",
  },
  {
    id: "bi-5",
    brand: "Dior",
    name: "Saddle Bag",
    link: "/items/5",
    price: "$3,800",
    imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400",
  },
  {
    id: "bi-6",
    brand: "YSL",
    name: "Cassandre Belt",
    link: "/items/6",
    price: "$520",
    imageUrl: "https://images.unsplash.com/photo-1547949003-9792a18a2601?w=400",
  },
];

export interface WeeklyBestStyle {
  id: string;
  artistName: string;
  imageUrl?: string;
  link: string;
}

const sampleWeeklyStyles: WeeklyBestStyle[] = [
  {
    id: "ws-1",
    artistName: "Newjeans Danielle",
    link: "/feed",
    imageUrl:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800",
  },
  {
    id: "ws-2",
    artistName: "Newjeans Haerin",
    link: "/feed",
    imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800",
  },
  {
    id: "ws-3",
    artistName: "IVE Wonyoung",
    link: "/feed",
    imageUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800",
  },
  {
    id: "ws-4",
    artistName: "Blackpink Jennie",
    link: "/feed",
    imageUrl:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800",
  },
];

export function BestItemSection({
  items = sampleBestItems,
}: {
  items?: ItemCardData[];
}) {
  return (
    <section className="py-24 md:py-40 bg-black px-6 md:px-12 border-t border-white/5 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-16 gap-10">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="text-primary font-sans font-bold tracking-[0.4em] text-[10px] md:text-xs uppercase mb-6 block">
                Market Analytics
              </span>
              <h2 className="text-6xl md:text-8xl font-serif font-bold italic tracking-tighter text-white leading-[0.85]">
                Best Sellers
              </h2>
            </motion.div>
          </div>
          <Link
            href="/items"
            className="group flex items-center gap-4 text-xs font-sans font-bold tracking-[0.3em] text-white/30 hover:text-white transition-all uppercase px-8 py-4 border border-white/10 rounded-full hover:border-primary/40"
          >
            <span>Shop all curations</span>
            <div className="w-8 h-[1px] bg-white/10 group-hover:bg-primary transition-all group-hover:w-12" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-16 gap-y-20 md:gap-y-24">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.8,
                delay: index * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group flex gap-8 items-center"
            >
              {/* Ranking Number */}
              <div className="text-7xl md:text-9xl font-serif font-bold italic text-white/[0.03] group-hover:text-primary transition-all duration-1000 select-none">
                {String(index + 1).padStart(2, "0")}
              </div>

              <Link href={item.link} className="flex gap-8 items-center flex-1">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-3xl overflow-hidden bg-neutral-900 flex-shrink-0 relative shadow-2xl border border-white/5 transition-all duration-700 group-hover:border-primary/30 group-hover:-translate-y-2">
                  {item.imageUrl && (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-sans font-bold tracking-[0.2em] text-primary mb-2 uppercase">
                    {item.brand}
                  </p>
                  <h3 className="text-lg md:text-xl font-sans font-medium text-white line-clamp-2 mb-2 group-hover:text-primary transition-colors leading-tight">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-serif italic text-white/40">
                      {item.price}
                    </span>
                    <div className="h-[1px] w-0 bg-primary group-hover:w-8 transition-all duration-700" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WeeklyBestSection({
  styles = sampleWeeklyStyles,
}: {
  styles?: WeeklyBestStyle[];
}) {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <section className="py-12 md:py-16 bg-[#020202] px-6 md:px-12 relative overflow-hidden">
      {/* Dynamic Background Spotlight */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIdx}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 z-0 pointer-events-none"
        >
          {styles[activeIdx]?.imageUrl && (
            <Image
              src={styles[activeIdx].imageUrl!}
              alt="bg"
              fill
              className="object-cover blur-[120px] grayscale brightness-50"
            />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-16 gap-10">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="text-primary font-sans font-bold tracking-[0.4em] text-[10px] md:text-xs uppercase mb-6 block">
                Editor's Weekly Roll
              </span>
              <h2 className="text-6xl md:text-8xl font-serif font-bold italic tracking-tighter text-white leading-[0.85]">
                Weekly
                <br />
                Best
              </h2>
            </motion.div>
          </div>
          <div className="flex gap-4 items-center">
            {styles.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={cn(
                  "w-12 h-[2px] transition-all duration-700 rounded-full",
                  activeIdx === i
                    ? "bg-primary w-20"
                    : "bg-white/10 hover:bg-white/20"
                )}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {styles.map((style, index) => (
            <motion.div
              key={style.id}
              onMouseEnter={() => setActiveIdx(index)}
              className="group relative cursor-pointer"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.8,
                delay: index * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <Link href={style.link} className="block">
                <div
                  className={cn(
                    "aspect-[3/4] rounded-[48px] overflow-hidden transition-all duration-1000 shadow-[0_40px_80px_rgba(0,0,0,0.6)] relative",
                    activeIdx === index
                      ? "scale-[1.05] ring-2 ring-primary/40 ring-offset-4 ring-offset-black"
                      : "opacity-40 grayscale-[0.8] scale-95 hover:opacity-60"
                  )}
                >
                  {style.imageUrl ? (
                    <Image
                      src={style.imageUrl}
                      alt={style.artistName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-neutral-900" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  {/* Ranking Overlay */}
                  <div className="absolute top-8 left-8 text-5xl font-serif font-bold italic text-white/30 tracking-tighter group-hover:text-primary/50 transition-colors">
                    #{String(index + 1).padStart(2, "0")}
                  </div>
                </div>

                <div
                  className={cn(
                    "mt-10 text-center transition-all duration-700 ease-[0.16,1,0.3,1]",
                    activeIdx === index
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-6"
                  )}
                >
                  <p className="text-[10px] font-sans font-bold tracking-[0.3em] text-primary uppercase mb-2">
                    Visual Collective
                  </p>
                  <h3 className="text-2xl md:text-3xl font-serif font-bold italic text-white tracking-tight">
                    {style.artistName}
                  </h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
