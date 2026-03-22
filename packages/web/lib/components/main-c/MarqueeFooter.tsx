"use client";

/**
 * Infinite scrolling marquee footer bar pinned to the bottom.
 */
export function MarqueeFooter() {
  const text = "DECODED_CORE_STATION";
  // Repeat enough times for seamless loop
  const items = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-10 overflow-hidden bg-[#080808] border-t border-[#eafd67]/20">
      <div className="flex items-center h-full animate-marquee-c whitespace-nowrap">
        {items.map((i) => (
          <span key={i} className="flex items-center gap-4 mx-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#eafd67]" />
            <span className="text-[11px] font-mono tracking-[0.3em] text-[#eafd67]/70 uppercase">
              {text}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
