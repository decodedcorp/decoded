"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import type { GridItemData } from "./types";

interface StyleMoodsProps {
  items: GridItemData[];
}

export default function StyleMoods({ items }: StyleMoodsProps) {
  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(items.map((item) => item.category).filter(Boolean))
    );
    return ["All", ...unique];
  }, [items]);

  const [activeTab, setActiveTab] = useState("All");

  const filtered = useMemo(() => {
    const base =
      activeTab === "All"
        ? items
        : items.filter((item) => item.category === activeTab);
    return base.slice(0, 12);
  }, [items, activeTab]);

  if (items.length === 0) return null;

  return (
    <section className="bg-mag-bg py-16 md:py-24">
      <div className="px-6 md:px-12 lg:px-20">
        {/* Section header */}
        <div className="mb-6">
          <p
            className="text-[10px] uppercase tracking-[0.3em] mb-2"
            style={{ color: "#eafd67" }}
          >
            By Context
          </p>
          <h2
            className="text-3xl md:text-5xl font-bold text-white leading-[1.1]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Style{" "}
            <span className="italic font-normal text-white/60">Moods</span>
          </h2>
        </div>

        {/* Tab pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-widest transition-colors ${
                activeTab === cat
                  ? "bg-[#eafd67] text-black"
                  : "bg-white/10 text-white/60 hover:bg-white/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((item) => (
            <Link
              key={item.id}
              href={item.link}
              prefetch={false}
              className="group relative block aspect-[3/4] overflow-hidden rounded-sm bg-white/5"
            >
              {item.imageUrl && (
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              {/* Title */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-xs font-medium leading-tight truncate">
                  {item.title}
                </p>
                {item.subtitle && (
                  <p className="text-white/50 text-[10px] mt-0.5 truncate">
                    {item.subtitle}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
