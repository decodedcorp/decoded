"use client";

import { useState, useRef, useCallback } from "react";

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
}

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
}: BeforeAfterSliderProps) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current || !isDragging.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full cursor-col-resize select-none overflow-hidden touch-none"
      onPointerDown={(e) => {
        isDragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerUp={(e) => {
        isDragging.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => handleMove(e.clientX)}
    >
      <img
        src={afterSrc}
        alt="Result"
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full object-contain"
      />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPos}%` }}
      >
        <img
          src={beforeSrc}
          alt="Original"
          draggable={false}
          className="pointer-events-none h-full object-contain"
          style={{
            width: `${containerRef.current ? containerRef.current.offsetWidth : 0}px`,
            maxWidth: "none",
          }}
        />
      </div>
      <div
        className="absolute top-0 bottom-0 z-10 w-0.5 bg-[#eafd67]"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#eafd67] bg-[#050505] p-1.5">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M5 3L2 8L5 13M11 3L14 8L11 13"
              stroke="#eafd67"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      <span className="absolute top-3 left-3 z-10 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
        Before
      </span>
      <span className="absolute top-3 right-3 z-10 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
        After
      </span>
    </div>
  );
}
