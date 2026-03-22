"use client";

import { useState } from "react";
import Image from "next/image";
import type { MainBItem, MainBRelatedPost } from "./types";

interface ScatteredCanvasProps {
  items: MainBItem[];
  relatedPosts: MainBRelatedPost[];
}

/**
 * Scattered item crop images + related post thumbnails placed left/right of the center hero.
 * Items alternate left/right, related posts fill remaining slots.
 */
export function ScatteredCanvas({ items, relatedPosts }: ScatteredCanvasProps) {
  // Related posts use slots after items
  const totalSlots = items.length + relatedPosts.length;

  return (
    <div className="absolute inset-0 z-[2]">
      {items.map((item, i) => (
        <CropItem key={item.id} item={item} index={i} total={totalSlots} />
      ))}
      {relatedPosts.map((rp, i) => (
        <RelatedPostThumb
          key={rp.id}
          post={rp}
          index={items.length + i}
          total={totalSlots}
        />
      ))}
    </div>
  );
}

function CropItem({
  item,
  index,
  total,
}: {
  item: MainBItem;
  index: number;
  total: number;
}) {
  const [hovered, setHovered] = useState(false);

  // Alternate left/right by index
  const isLeft = index % 2 === 0;

  // Vertical: distribute evenly, use center.y for relative ordering
  const slotHeight = 70 / total;
  const baseY = 5 + index * slotHeight + item.center[1] * slotHeight * 0.5;
  const yPos = Math.max(3, Math.min(78, baseY));

  // Horizontal: left or right of center hero (which sits at ~38-62%)
  const seed = (index * 7 + 13) % 11;
  const leftPos = isLeft
    ? 20 + (seed % 4) * 3 // 20~29%
    : 62 + (seed % 4) * 4; // 62~74%

  // Slight rotation for organic feel
  const rotate = ((index * 37 + 11) % 13) - 6;

  return (
    <div
      className="scattered-item absolute group"
      style={{
        top: `${yPos}%`,
        left: `${leftPos}%`,
        width: "clamp(90px, 13vw, 170px)",
        zIndex: hovered ? 20 : 2,
        transform: `rotate(${rotate}deg)`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="relative overflow-hidden rounded-sm transition-transform duration-500 ease-out"
        style={{
          transform: hovered ? "scale(1.1)" : "scale(1)",
          aspectRatio: "1 / 1",
        }}
      >
        <Image
          src={item.imageUrl}
          alt={item.brand ?? item.productName ?? "Item crop"}
          fill
          sizes="(max-width:768px) 22vw, 13vw"
          className="object-cover"
          style={{
            filter: hovered ? "brightness(1.1)" : "brightness(0.95)",
            transition: "filter 0.5s ease",
          }}
        />
      </div>

      {/* Label on hover */}
      {hovered && (item.brand || item.productName) && (
        <div className="absolute -bottom-7 left-0 right-0 text-center">
          {item.brand && (
            <p
              className="text-[8px] tracking-[0.15em] uppercase"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              {item.brand}
            </p>
          )}
          {item.productName && (
            <p
              className="text-[9px] truncate"
              style={{ color: "rgba(234, 253, 103, 0.7)" }}
            >
              {item.productName}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Related post thumbnail (same artist, different post) ── */

function RelatedPostThumb({
  post,
  index,
  total,
}: {
  post: MainBRelatedPost;
  index: number;
  total: number;
}) {
  const [hovered, setHovered] = useState(false);
  const isLeft = index % 2 === 0;

  const slotHeight = 70 / total;
  const baseY = 5 + index * slotHeight;
  const yPos = Math.max(3, Math.min(78, baseY));

  const seed = (index * 7 + 13) % 11;
  const leftPos = isLeft ? 20 + (seed % 4) * 3 : 62 + (seed % 4) * 4;

  const rotate = ((index * 37 + 11) % 13) - 6;

  return (
    <div
      className="scattered-item absolute group"
      style={{
        top: `${yPos}%`,
        left: `${leftPos}%`,
        width: "clamp(80px, 11vw, 140px)",
        zIndex: hovered ? 20 : 2,
        transform: `rotate(${rotate}deg)`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="relative overflow-hidden rounded-sm transition-transform duration-500 ease-out"
        style={{
          transform: hovered ? "scale(1.1)" : "scale(1)",
          aspectRatio: "3 / 4",
        }}
      >
        <Image
          src={post.imageUrl}
          alt={post.artistName ?? "Related post"}
          fill
          sizes="(max-width:768px) 18vw, 11vw"
          className="object-cover object-left"
          style={{
            filter: hovered ? "brightness(1.1)" : "brightness(0.95)",
            transition: "filter 0.5s ease",
          }}
        />
      </div>
      {hovered && post.artistName && (
        <div className="absolute -bottom-5 left-0 right-0 text-center">
          <p
            className="text-[8px] tracking-[0.15em] uppercase"
            style={{ color: "rgba(234, 253, 103, 0.6)" }}
          >
            {post.artistName}
          </p>
        </div>
      )}
    </div>
  );
}
