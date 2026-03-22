"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ItemCard, type ItemCardData } from "./ItemCard";
import { cn } from "@/lib/utils";

type CategoryTab = {
  id: string;
  label: string;
};

const itemTabs: CategoryTab[] = [
  { id: "newjeans", label: "Newjeans Selection" },
  { id: "blackpink", label: "Blackpink Series" },
  { id: "archive", label: "Archive Collection" },
];

const productTabs: CategoryTab[] = [
  { id: "clothes", label: "CLOTHES" },
  { id: "acc", label: "ACCESSORIES" },
  { id: "objects", label: "OBJECTS" },
];

const sampleItems: ItemCardData[] = [
  {
    id: "1",
    brand: "RON ARAD STUDIO",
    name: "Bookworm Table",
    price: "$450",
    link: "/items/1",
    imageUrl:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400",
  },
  {
    id: "2",
    brand: "RON ARAD STUDIO",
    name: "Bookworm Chair",
    price: "$650",
    link: "/items/2",
    imageUrl:
      "https://images.unsplash.com/photo-1564848005333-590727c99921?w=400",
  },
  {
    id: "3",
    brand: "RON ARAD STUDIO",
    name: "Bookworm Lamp",
    price: "$180",
    link: "/items/3",
    imageUrl:
      "https://images.unsplash.com/photo-1518738458435-19149697112a?w=400",
  },
  {
    id: "4",
    brand: "RON ARAD STUDIO",
    name: "Bookworm Shelf",
    price: "$550",
    link: "/items/4",
    imageUrl:
      "https://images.unsplash.com/photo-1641206189215-9533ceb7a1df?w=400",
  },
  {
    id: "5",
    brand: "RON ARAD STUDIO",
    name: "Bookworm Desk",
    price: "$1,200",
    link: "/items/5",
    imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400",
  },
  {
    id: "6",
    brand: "RON ARAD STUDIO",
    name: "Bookworm Sofa",
    price: "$3,800",
    link: "/items/6",
    imageUrl: "https://images.unsplash.com/photo-1547949003-9792a18a2601?w=400",
  },
];

interface DiscoverItemsSectionProps {
  tabs?: CategoryTab[];
  items?: ItemCardData[];
  itemsByTab?: Record<string, ItemCardData[]>;
}

export function DiscoverItemsSection({
  tabs = itemTabs,
  items = sampleItems,
  itemsByTab,
}: DiscoverItemsSectionProps) {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const displayItems = itemsByTab?.[activeTab] ?? items.slice(0, 6);

  return (
    <section className="py-24 md:py-32 bg-[#050505] px-6 md:px-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div>
            <span className="text-primary font-sans font-bold tracking-[0.3em] text-[10px] md:text-xs uppercase mb-4 block">
              Global Curation
            </span>
            <h2 className="text-5xl md:text-7xl font-serif font-bold italic tracking-tighter text-white">
              Discover Items
            </h2>
          </div>

          {/* Tabs - Minimalist Architectural Style */}
          <div className="flex gap-8 overflow-x-auto no-scrollbar pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative text-xs font-sans font-bold tracking-[0.2em] uppercase transition-all duration-500 py-2 whitespace-nowrap",
                  activeTab === tab.id
                    ? "text-primary"
                    : "text-white/20 hover:text-white/60"
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabUnderlineItems"
                    className="absolute bottom-0 left-0 w-full h-[1px] bg-primary"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8"
          >
            {displayItems.slice(0, 6).map((item, index) => (
              <ItemCard key={index} data={item} index={index} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

export function DiscoverProductsSection({
  tabs = productTabs,
  items = sampleItems,
}: {
  tabs?: CategoryTab[];
  items?: ItemCardData[];
}) {
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <section className="py-24 md:py-32 bg-black px-6 md:px-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div>
            <span className="text-primary font-sans font-bold tracking-[0.3em] text-[10px] md:text-xs uppercase mb-4 block">
              Architectural Design
            </span>
            <h2 className="text-5xl md:text-7xl font-serif font-bold italic tracking-tighter text-white">
              Discover Products
            </h2>
          </div>

          <div className="flex gap-8 overflow-x-auto no-scrollbar pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative text-xs font-sans font-bold tracking-[0.2em] uppercase transition-all duration-500 py-2 whitespace-nowrap",
                  activeTab === tab.id
                    ? "text-primary"
                    : "text-white/20 hover:text-white/60"
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabUnderlineProducts"
                    className="absolute bottom-0 left-0 w-full h-[1px] bg-primary"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8"
          >
            {items.slice(0, 6).map((item, index) => (
              <ItemCard key={index} data={item} index={index} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
