"use client";

import Image from "next/image";
import Link from "next/link";

interface EditorPickItem {
  id: string;
  imageUrl: string;
  title: string;
  link: string;
  artistName: string;
}

interface EditorPicksProps {
  items: EditorPickItem[];
}

export default function EditorPicks({ items }: EditorPicksProps) {
  if (!items || items.length === 0) return null;

  return (
    <section className="bg-mag-bg px-6 py-16 md:py-24 md:px-12 lg:px-20">
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-2">
            Curated
          </p>
          <h2
            className="text-3xl md:text-5xl font-bold text-white leading-[1.1]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Editor&apos;s{" "}
            <span className="italic font-normal text-white/60">Pick</span>
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.link}
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-xs font-medium leading-tight truncate">
                  {item.title}
                </p>
                {item.artistName && (
                  <p className="text-white/50 text-[10px] mt-0.5 truncate">
                    {item.artistName}
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
